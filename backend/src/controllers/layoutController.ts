import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { handleUploadedFile } from '../utils/handleUploadedFile';

const prisma = new PrismaClient();

// Get the currently published layout for a project
export const getPublishedLayout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const projectId = req.params.projectId as string;

    const layout = await prisma.projectLayout.findFirst({
      where: {
        projectId,
        status: 'PUBLISHED'
      },
      include: {
        elements: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'No published layout found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Server error retrieving published layout'
    });
  }
};

// Get the current draft layout, or create one if none exists
export const getDraftLayout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const projectId = req.params.projectId as string;

    // Find existing draft
    let layout = await prisma.projectLayout.findFirst({
      where: {
        projectId,
        status: 'DRAFT'
      },
      include: {
        elements: true
      }
    });

    // If no draft exists, copy from published or create new
    if (!layout) {
      const published = await prisma.projectLayout.findFirst({
        where: {
          projectId,
          status: 'PUBLISHED'
        },
        include: {
          elements: true
        },
        orderBy: {
          publishedAt: 'desc'
        }
      });

      if (published) {
        // Clone published to draft
        layout = await prisma.projectLayout.create({
          data: {
            projectId,
            name: published.name + ' (Draft)',
            version: 'v' + Date.now(),
            status: 'DRAFT',
            canvasWidth: published.canvasWidth,
            canvasHeight: published.canvasHeight,
            backgroundImage: published.backgroundImage,
            backgroundOpacity: published.backgroundOpacity,
            gridSize: published.gridSize,
            createdBy: req.user?.id,
            elements: {
              create: published.elements.map((el: any) => ({
                type: el.type,
                inventoryUnitId: el.inventoryUnitId,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                rotation: el.rotation,
                zIndex: el.zIndex,
                elementData: el.elementData as any
              }))
            }
          },
          include: {
            elements: true
          }
        });
      } else {
        // Create an empty draft
        layout = await prisma.projectLayout.create({
          data: {
            projectId,
            name: 'Master Layout',
            status: 'DRAFT',
            createdBy: req.user?.id
          },
          include: {
            elements: true
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Server error retrieving draft layout'
    });
  }
};

// Atomic Save Draft
export const saveDraftLayout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const projectId = req.params.projectId as string;

    const {
      name,
      canvasWidth,
      canvasHeight,
      backgroundImage,
      backgroundOpacity,
      gridSize,
      elements
    } = req.body;

    // Find the current draft
    const draft = await prisma.projectLayout.findFirst({
      where: {
        projectId,
        status: 'DRAFT'
      }
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message:
          'Draft not found to save. Call getDraftLayout first.'
      });
    }

    // Perform atomic transaction
    const updatedLayout = await prisma.$transaction(
      async (tx) => {
        // 1. Update Layout properties
        const layout = await tx.projectLayout.update({
          where: {
            id: draft.id
          },
          data: {
            name: name || draft.name,
            canvasWidth:
              canvasWidth !== undefined
                ? canvasWidth
                : draft.canvasWidth,
            canvasHeight:
              canvasHeight !== undefined
                ? canvasHeight
                : draft.canvasHeight,
            backgroundImage:
              backgroundImage !== undefined
                ? backgroundImage
                : draft.backgroundImage,
            backgroundOpacity:
              backgroundOpacity !== undefined
                ? backgroundOpacity
                : draft.backgroundOpacity,
            gridSize:
              gridSize !== undefined
                ? gridSize
                : draft.gridSize,
            updatedBy: req.user?.id
          }
        });

        // 2. Clear existing elements
        await tx.layoutElement.deleteMany({
          where: {
            layoutId: draft.id
          }
        });

        // 3. Verify and Create new elements
        if (elements && elements.length > 0) {
          
          const inventoryIds = elements
            .filter((e: any) => e.type === 'PLOT' || e.type === 'UNIT')
            .map((e: any) => e.inventoryUnitId)
            .filter(Boolean);

          let validationError = null;

          if (inventoryIds.length > 0) {
            const validUnits = await tx.inventoryUnit.findMany({
              where: { id: { in: inventoryIds }, projectId: projectId }
            });
            const validIds = new Set(validUnits.map(u => u.id));
            
            elements.forEach((el: any) => {
              if (el.type === 'PLOT' || el.type === 'UNIT') {
                if (!el.inventoryUnitId) {
                  validationError = `Orphan unit detected. Every plot or unit must be linked to a real inventory unit.`;
                } else if (!validIds.has(el.inventoryUnitId)) {
                  validationError = `Inventory Unit ${el.inventoryUnitId} not found in this project. Cannot save orphan plot.`;
                }
              }
            });
          } else {
            // Even if no mapped inventory units are present, we still need to reject any PLOT/UNIT that lacks an inventoryUnitId
            elements.forEach((el: any) => {
              if ((el.type === 'PLOT' || el.type === 'UNIT') && !el.inventoryUnitId) {
                validationError = `Orphan unit detected. Every plot or unit must be linked to a real inventory unit.`;
              }
            });
          }

          if (validationError) {
             throw new Error(`VALIDATION_FAILED:${validationError}`);
          }
          
          await tx.layoutElement.createMany({
            data: elements.map((el: any) => ({
              layoutId: draft.id,
              type: el.type,
              inventoryUnitId:
                el.inventoryUnitId || null,
              x: el.x,
              y: el.y,
              width: el.width || null,
              height: el.height || null,
              rotation: el.rotation || 0,
              zIndex: el.zIndex || 1,
              elementData: el.elementData || null
            }))
          });
        }

        return await tx.projectLayout.findUnique({
          where: {
            id: draft.id
          },
          include: {
            elements: true
          }
        });
      }
    );

    return res.status(200).json({
      success: true,
      data: updatedLayout
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('VALIDATION_FAILED:')) {
      return res.status(400).json({
        success: false,
        message: error.message.split('VALIDATION_FAILED:')[1]
      });
    }

    console.error(
      'Error saving draft:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error saving layout draft'
    });
  }
};

// Publish a draft layout
export const publishLayout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const layoutId =
      req.params.layoutId as string;

    const draft =
      await prisma.projectLayout.findUnique({
        where: {
          id: layoutId
        }
      });

    if (!draft || draft.status !== 'DRAFT') {
      return res.status(404).json({
        success: false,
        message: 'Draft layout not found.'
      });
    }

    // Atomic publish
    await prisma.$transaction(async (tx) => {
      // 1. Archive previously published layout
      // for this project
      await tx.projectLayout.updateMany({
        where: {
          projectId: draft.projectId,
          status: 'PUBLISHED'
        },
        data: {
          status: 'ARCHIVED'
        }
      });

      // 2. Mark this draft as PUBLISHED
      await tx.projectLayout.update({
        where: {
          id: draft.id
        },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: req.user?.id
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Layout published successfully.'
    });
  } catch (error: any) {
    console.error(
      'Error publishing layout:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error publishing layout'
    });
  }
};

// Handle background image upload
//
// The file is first received by Multer on the Render
// server. It is then transferred to Hostinger using SFTP.
//
// Hostinger destination:
// /public_html/uploads/projects/
//
// The returned URL is the permanent public URL.
export const uploadLayoutBackground = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const imageUrl = await handleUploadedFile(
      req.file,
      'projects'
    );

    return res.status(200).json({
      success: true,
      url: imageUrl
    });
  } catch (error: any) {
    console.error(
      'Error uploading layout background:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to upload layout background'
    });
  }
};
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import { handleUploadedFile } from '../utils/handleUploadedFile';

const prisma = new PrismaClient();

export const uploadProjectMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { mediaType, title, displayOrder, isCover } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Transfer temporary Render file to Hostinger.
    const url = await handleUploadedFile(
      req.file,
      'projects'
    );

    const isCoverBool =
      isCover === 'true' || isCover === true;

    if (isCoverBool) {
      await prisma.projectMedia.updateMany({
        where: { projectId },
        data: { isCover: false }
      });
    }

    const projectMedia =
      await prisma.projectMedia.create({
        data: {
          projectId,
          mediaType: mediaType || 'GALLERY',
          url,
          title: title || null,
          displayOrder: displayOrder
            ? parseInt(displayOrder, 10)
            : 0,
          isCover: isCoverBool
        }
      });

    return res.status(201).json({
      success: true,
      data: projectMedia
    });
  } catch (error: any) {
    console.error(
      'Error uploading project media:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to upload project media'
    });
  }
};

export const deleteProjectMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { mediaId } =
      req.params as { mediaId: string };

    const media =
      await prisma.projectMedia.findUnique({
        where: { id: mediaId }
      });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    await prisma.projectMedia.delete({
      where: { id: mediaId }
    });

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error: any) {
    console.error(
      'Error deleting project media:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const setCoverPhoto = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { mediaId } =
      req.params as { mediaId: string };

    const media =
      await prisma.projectMedia.findUnique({
        where: { id: mediaId }
      });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    await prisma.$transaction([
      prisma.projectMedia.updateMany({
        where: { projectId: media.projectId },
        data: { isCover: false }
      }),
      prisma.projectMedia.update({
        where: { id: mediaId },
        data: { isCover: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Cover photo updated'
    });
  } catch (error: any) {
    console.error(
      'Error setting cover:',
      error
    );

    const msg =
      process.env.NODE_ENV === 'development'
        ? error.message || 'Server error'
        : 'Server error';

    return res.status(500).json({
      success: false,
      message: msg
    });
  }
};
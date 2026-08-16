import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { userService } from '../services/userService';
import { 
  createUserSchema, 
  updateUserSchema, 
  updateStatusSchema, 
  resetPasswordSchema,
  approveUserSchema
} from '../validators/userValidator';

export const userController = {
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await userService.getUsers(req.query);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const parsedData = createUserSchema.parse(req.body);
      const authenticatedUserId = req.user!.id;
      const authenticatedUserRole = req.user!.role;
      
      const isDuplicate = await userService.checkDuplicate(parsedData.email);
      if (isDuplicate) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      const { user, temporaryPassword } = await userService.createUser(parsedData, authenticatedUserId, authenticatedUserRole);
      return res.status(201).json({ success: true, user, temporaryPassword });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  },

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const parsedData = updateUserSchema.parse(req.body);
      const id = req.params.id as string;

      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isDuplicate = await userService.checkDuplicate(parsedData.email, undefined, id);
      if (isDuplicate) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      const user = await userService.updateUser(id, parsedData);
      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async updateMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      // NOTE: We do not parse with updateUserSchema here because associates
      // can edit profile fields but CANNOT edit role, associateCode, etc.
      // A dedicated schema is preferred, but for this fix we'll manually filter.
      const id = req.user!.id;
      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Safe fields that a user can update themselves
      const allowedFields = [
        'name', 'phone', 'secondaryPhone', 'whatsappNumber', 'currentAddress', 'permanentAddress',
        'bloodGroup', 'socialMedia', 'panNumber', 'aadhaarNumber', 'bankName', 'accountNumber',
        'ifscCode', 'branchName', 'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone'
      ];
      
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const user = await userService.updateUser(id, updateData);
      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async uploadProfilePhoto(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const id = req.user!.id;
      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // In production you would upload to S3 and return the URL.
      // Here we return the local URL from multer.
      const fileUrl = `/uploads/${req.file.filename}`;

      const user = await userService.updateUser(id, { profileImageUrl: fileUrl });
      return res.status(200).json({ success: true, user, fileUrl });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const parsedData = updateStatusSchema.parse(req.body);
      const id = req.params.id as string;
      const authenticatedUserId = req.user!.id;

      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = await userService.updateStatus(id, parsedData.status, authenticatedUserId);
      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      if (error.message === 'Cannot deactivate or reject your own account') {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async approveUser(req: AuthenticatedRequest, res: Response) {
    try {
      const parsedData = approveUserSchema.parse(req.body);
      const id = req.params.id as string;
      const authenticatedUserId = req.user!.id;

      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = await userService.approveUser(id, parsedData.status, parsedData.rejectionReason, authenticatedUserId);
      return res.status(200).json({ success: true, user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const parsedData = resetPasswordSchema.parse(req.body);
      const id = req.params.id as string;

      const userExists = await userService.getUserById(id);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      await userService.resetPassword(id, parsedData.password);
      return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

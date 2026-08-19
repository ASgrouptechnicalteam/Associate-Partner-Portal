import { Response } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { uploadToHostinger } from '../utils/sftp';

export const testHostingerSftp = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const testFilePath = path.join(
    os.tmpdir(),
    `render-sftp-test-${Date.now()}.txt`
  );

  try {
    // Create a temporary file on the Render server
    const content = [
      'Render to Hostinger SFTP test',
      `Time: ${new Date().toISOString()}`,
      `Server: Render`,
    ].join('\n');

    await fs.writeFile(testFilePath, content, 'utf8');

    // Upload temporary file from Render to Hostinger
    const publicUrl = await uploadToHostinger(
      testFilePath,
      `render-sftp-test-${Date.now()}.txt`,
      'profiles'
    );

    console.log('========================================');
    console.log('RENDER → HOSTINGER SFTP TEST SUCCESS');
    console.log('Public URL:', publicUrl);
    console.log('========================================');

    return res.status(200).json({
      success: true,
      message: 'Render to Hostinger SFTP upload successful',
      publicUrl
    });
  } catch (error: any) {
    console.error('========================================');
    console.error('RENDER → HOSTINGER SFTP TEST FAILED');
    console.error(error);
    console.error('========================================');

    return res.status(500).json({
      success: false,
      message: 'Render to Hostinger SFTP upload failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error?.message || String(error)
          : 'SFTP connection or upload failed'
    });
  } finally {
    // Remove temporary file from Render
    await fs.unlink(testFilePath).catch(() => undefined);
  }
};
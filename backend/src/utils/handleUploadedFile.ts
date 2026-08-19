import fs from 'fs/promises';
import path from 'path';
import { uploadToHostinger } from './sftp';

export const handleUploadedFile = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  try {
    const extension = path.extname(file.originalname);

    const remoteFileName =
      `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

    await uploadToHostinger(
      file.path,
      remoteFileName,
      folder
    );

    const publicBaseUrl = (
      process.env.PUBLIC_UPLOAD_URL ||
      'https://associateportal.sonthilluconstructions.com/uploads'
    ).replace(/\/$/, '');

    return `${publicBaseUrl}/${folder}/${remoteFileName}`;
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
};
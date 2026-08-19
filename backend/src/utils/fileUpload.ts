import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Upload directory.
// In production, use UPLOAD_PATH if explicitly configured.
// Otherwise keep uploads inside the backend application directory.
const uploadPath = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      file.fieldname +
        '-' +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  }
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images, PDFs, and videos.
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only images, videos, and PDFs are allowed.'
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});
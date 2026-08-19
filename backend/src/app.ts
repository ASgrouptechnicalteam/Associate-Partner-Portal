import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import teamRoutes from './routes/teamRoutes';
import projectRoutes from './routes/projectRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import bookingRoutes from './routes/bookingRoutes';
import commissionRoutes from './routes/commissionRoutes';
import travelRoutes from './routes/travelRoutes';
import authorizationRoutes from './routes/authorizationRoutes';
import siteVisitRoutes from './routes/siteVisitRoutes';
import carouselRoutes from './routes/carouselRoutes';
import popupRoutes from './routes/popupRoutes';
import offerRoutes from './routes/offerRoutes';
import reviewRoutes from './routes/reviewRoutes';
import publicReviewRoutes from './routes/publicReviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import faqRoutes from './routes/faqRoutes';
import tutorialRoutes from './routes/tutorialRoutes';
import searchRoutes from './routes/searchRoutes';
const app = express();

// Security Headers
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Associate Partner Portal API is running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/commissions', commissionRoutes);
app.use('/api/v1/travel', travelRoutes);
app.use('/api/v1/authorizations', authorizationRoutes);
app.use('/api/v1/site-visits', siteVisitRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/carousel', carouselRoutes);
app.use('/api/v1/popups', popupRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/public/reviews', publicReviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/tutorials', tutorialRoutes);
app.use('/api/search', searchRoutes);

// Serve uploaded files (bill documents, project media)
const uploadDir = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error && err.message === 'File too large') {
    return res.status(413).json({ success: false, message: 'File exceeds the 10 MB maximum.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

export default app;

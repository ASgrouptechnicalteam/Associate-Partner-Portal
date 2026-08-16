import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
  sessionId?: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.verify(token, secret) as JwtPayload;
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // get token from cookies
  // since we haven't set up cookie parser, we can manually parse it or use cookie-parser
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No session cookie' } });
    return;
  }

  const cookies = cookieHeader.split(';').reduce((acc: any, cookie) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies['tivask_session'];
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No session cookie' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_for_local_dev');
    (req as any).adminId = (decoded as any).id;
    next();
  } catch (err) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session cookie' } });
    return;
  }
}

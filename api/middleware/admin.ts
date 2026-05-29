import { authMiddleware, type JwtPayload } from './auth.js'
import { Response, NextFunction } from 'express'

export interface AuthRequest {
  user?: JwtPayload
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authMiddleware(req as any, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '需要管理员权限' })
    }
    next()
  })
}

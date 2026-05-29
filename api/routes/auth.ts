import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// Helper: Get company member info for a user
function getCompanyMemberInfo(userId: number): { companyId: number; teamRole: string } | null {
  const db = getDb()
  const member = db.prepare(
    'SELECT company_id, role FROM company_members WHERE user_id = ?'
  ).get(userId) as { company_id: number; role: string } | undefined
  return member ? { companyId: member.company_id, teamRole: member.role } : null
}

const passwordSchema = z.string()
  .min(8, '密码至少8位')
  .regex(/[A-Za-z]/, '密码必须包含字母')
  .regex(/[0-9]/, '密码必须包含数字')

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: passwordSchema,
  companyName: z.string().min(1, '企业名称不能为空').max(100, '企业名称不能超过100字'),
})

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
})

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    if (!checkRateLimit(`register:${clientIp}`)) {
      res.status(429).json({
        success: false,
        message: '注册请求过于频繁，请稍后再试',
      })
      return
    }

    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const { email, password, companyName } = parsed.data
    const db = getDb()

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      res.status(409).json({
        success: false,
        message: '该邮箱已被注册',
      })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const insertUser = db.prepare('INSERT INTO users (email, password, company_name) VALUES (?, ?, ?)')
    const result = insertUser.run(email, hashedPassword, companyName)
    const userId = result.lastInsertRowid as number

    db.prepare('INSERT INTO companies (user_id, name) VALUES (?, ?)').run(userId, companyName)

    // Add creator as admin member of the company
    db.prepare('INSERT INTO company_members (company_id, user_id, role) VALUES (?, ?, ?)').run(userId, userId, 'admin')

    const token = jwt.sign(
      { userId, email, role: 'admin', companyId: userId },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          companyName,
          role: 'admin',
          companyId: userId,
        },
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
    })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    if (!checkRateLimit(`login:${clientIp}`)) {
      res.status(429).json({
        success: false,
        message: '登录请求过于频繁，请稍后再试',
      })
      return
    }

    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const { email, password } = parsed.data
    const db = getDb()

    const user = db.prepare('SELECT id, email, password, company_name, role FROM users WHERE email = ?').get(email) as
      | { id: number; email: string; password: string; company_name: string; role: string }
      | undefined

    if (!user) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码不正确',
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码不正确',
      })
      return
    }

    const memberInfo = getCompanyMemberInfo(user.id)

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, companyId: memberInfo?.companyId },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
          role: user.role,
          companyId: memberInfo?.companyId,
        },
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
    })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT id, email, company_name, role, created_at FROM users WHERE id = ?').get(req.user!.userId) as
      | { id: number; email: string; company_name: string; role: string; created_at: string }
      | undefined

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      })
      return
    }

    const memberInfo = getCompanyMemberInfo(user.id)

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        role: user.role,
        companyId: memberInfo?.companyId,
        createdAt: user.created_at,
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    })
  }
})

const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: z.string()
    .min(8, '密码至少8位')
    .regex(/[A-Za-z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
})

router.put('/password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = passwordChangeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const { oldPassword, newPassword } = parsed.data
    const db = getDb()

    const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(req.user!.userId) as
      | { id: number; password: string }
      | undefined

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '原密码不正确',
      })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user!.userId)

    res.json({
      success: true,
      message: '密码修改成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '修改密码失败，请稍后重试',
    })
  }
})

export default router
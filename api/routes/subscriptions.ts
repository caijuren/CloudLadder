import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const createSubscriptionSchema = z.object({
  name: z.string().min(1, '订阅名称不能为空').max(50, '订阅名称不能超过50字'),
  region: z.string().optional().default(''),
  department: z.string().optional().default(''),
  supportType: z.string().optional().default(''),
  keywords: z.string().optional().default(''),
})

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const rows = db.prepare(
      'SELECT id, name, region, department, support_type, keywords, created_at FROM policy_subscriptions WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user!.userId) as Array<{
      id: number
      name: string
      region: string
      department: string
      support_type: string
      keywords: string
      created_at: string
    }>

    res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        region: row.region,
        department: row.department,
        supportType: row.support_type,
        keywords: row.keywords,
        createdAt: row.created_at,
      })),
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取订阅列表失败',
    })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSubscriptionSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const { name, region, department, supportType, keywords } = parsed.data
    const db = getDb()

    const result = db.prepare(
      'INSERT INTO policy_subscriptions (user_id, name, region, department, support_type, keywords) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.userId, name, region, department, supportType, keywords)

    res.status(201).json({
      success: true,
      data: {
        id: Number(result.lastInsertRowid),
        name,
        region,
        department,
        supportType,
        keywords,
      },
      message: '订阅创建成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '创建订阅失败',
    })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const sub = db.prepare(
      'SELECT id FROM policy_subscriptions WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user!.userId) as { id: number } | undefined

    if (!sub) {
      res.status(404).json({
        success: false,
        message: '订阅不存在',
      })
      return
    }

    db.prepare('DELETE FROM policy_subscriptions WHERE id = ?').run(req.params.id)

    res.json({
      success: true,
      message: '订阅已删除',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '删除订阅失败',
    })
  }
})

router.get('/new-count', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT last_viewed_at FROM users WHERE id = ?').get(req.user!.userId) as { last_viewed_at: string } | undefined

    if (!user) {
      res.json({ success: true, data: { count: 0 } })
      return
    }

    const result = db.prepare(
      'SELECT COUNT(*) as count FROM policies WHERE created_at > ? AND status = ?'
    ).get(user.last_viewed_at || '1970-01-01', 'active') as { count: number }

    res.json({
      success: true,
      data: { count: result.count },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取新政策数量失败',
    })
  }
})

router.post('/mark-read', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    db.prepare('UPDATE users SET last_viewed_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      req.user!.userId
    )

    res.json({
      success: true,
      message: '已标记为已读',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '标记失败',
    })
  }
})

export default router
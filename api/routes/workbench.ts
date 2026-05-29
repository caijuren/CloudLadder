import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed'], {
    errorMap: () => ({ message: '状态值无效，必须为 pending、in_progress 或 completed' }),
  }),
})

const createTaskSchema = z.object({
  policyId: z.number().int().positive('政策ID必须为正整数'),
  title: z.string().min(1, '任务标题不能为空'),
  category: z.string().optional().default('material'),
  deadline: z.string().optional().default(''),
})

const validTransitions: Record<string, string[]> = {
  pending: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
}

router.get('/tasks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

    if (!company) {
      res.status(404).json({
        success: false,
        message: '企业信息不存在',
      })
      return
    }

    const rows = db.prepare(`
      SELECT
        t.id,
        t.title,
        t.category,
        t.deadline,
        t.status,
        t.policy_id,
        p.title as policy_title
      FROM tasks t
      LEFT JOIN policies p ON t.policy_id = p.id
      WHERE t.company_id = ?
      ORDER BY
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'completed' THEN 3
        END,
        t.deadline ASC
    `).all(company.id) as Array<{
      id: number
      title: string
      category: string
      deadline: string
      status: string
      policy_id: number
      policy_title: string
    }>

    res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        deadline: row.deadline,
        status: row.status,
        policyId: row.policy_id,
        policyTitle: row.policy_title,
      })),
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
    })
  }
})

router.post('/tasks', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const db = getDb()
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

    if (!company) {
      res.status(404).json({
        success: false,
        message: '企业信息不存在',
      })
      return
    }

    const { policyId, title, category, deadline } = parsed.data

    const policy = db.prepare('SELECT id FROM policies WHERE id = ?').get(policyId) as { id: number } | undefined
    if (!policy) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      })
      return
    }

    const result = db.prepare(`
      INSERT INTO tasks (company_id, policy_id, title, category, deadline, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(company.id, policyId, title, category, deadline)

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as {
      id: number
      title: string
      category: string
      deadline: string
      status: string
      policy_id: number
    }

    res.status(201).json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        category: task.category,
        deadline: task.deadline,
        status: task.status,
        policyId: task.policy_id,
      },
      message: '任务创建成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '创建任务失败',
    })
  }
})

router.post('/tasks/:id/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

    if (!company) {
      res.status(404).json({
        success: false,
        message: '企业信息不存在',
      })
      return
    }

    const parsed = updateStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const { id } = req.params
    const { status } = parsed.data

    const task = db.prepare('SELECT id, status FROM tasks WHERE id = ? AND company_id = ?').get(id, company.id) as { id: number; status: string } | undefined

    if (!task) {
      res.status(404).json({
        success: false,
        message: '任务不存在',
      })
      return
    }

    const allowedTransitions = validTransitions[task.status]
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      res.status(400).json({
        success: false,
        message: `不允许从 "${task.status}" 变更为 "${status}"`,
      })
      return
    }

    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id)

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as {
      id: number
      title: string
      category: string
      deadline: string
      status: string
      policy_id: number
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        deadline: updated.deadline,
        status: updated.status,
        policyId: updated.policy_id,
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '更新任务状态失败',
    })
  }
})

router.delete('/tasks/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

    if (!company) {
      res.status(404).json({
        success: false,
        message: '企业信息不存在',
      })
      return
    }

    const { id } = req.params
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND company_id = ?').get(id, company.id)

    if (!task) {
      res.status(404).json({
        success: false,
        message: '任务不存在',
      })
      return
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '任务删除成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '删除任务失败',
    })
  }
})

export default router
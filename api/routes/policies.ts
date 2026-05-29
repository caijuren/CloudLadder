import { z } from 'zod'
import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const updatePolicySchema = z.object({
  title: z.string().optional(),
  department: z.string().optional(),
  deadline: z.string().optional(),
  subsidy: z.string().optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  requirements: z.record(z.string()).optional(),
  process: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'expired']).optional(),
})

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const { department, region, supportType, page = '1', limit = '10' } = req.query

    let sql = 'SELECT * FROM policies WHERE status = \'active\''
    const params: string[] = []

    if (department) {
      sql += ' AND department LIKE ?'
      params.push(`%${department}%`)
    }

    if (region) {
      sql += ' AND region LIKE ?'
      params.push(`%${region}%`)
    }

    if (supportType) {
      sql += ' AND (tags LIKE ? OR title LIKE ?)'
      params.push(`%${supportType}%`, `%${supportType}%`)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10))
    const offset = (pageNum - 1) * limitNum

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(String(limitNum), String(offset))

    const rows = db.prepare(sql).all(...params) as Array<{
      id: number
      title: string
      department: string
      deadline: string
      subsidy: string
      region: string
      tags: string
      requirements_json: string
      created_at: string
    }>

    const userLastViewedAt = db.prepare('SELECT last_viewed_at FROM users WHERE id = ?').get(req.user!.userId) as { last_viewed_at: string } | undefined
    const userSince = userLastViewedAt?.last_viewed_at ? new Date(userLastViewedAt.last_viewed_at) : null

    const list = rows.map((row) => {
      let isNew = false
      if (userSince) {
        const createdAt = new Date(row.created_at)
        isNew = createdAt > userSince
      }
      return {
        id: row.id,
        title: row.title,
        department: row.department,
        deadline: row.deadline,
        subsidy: row.subsidy,
        region: row.region,
        tags: row.tags ? row.tags.split(',') : [],
        isNew,
      }
    })

    res.json({
      success: true,
      data: {
        list,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取政策列表失败',
    })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const { id } = req.params

    const row = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as
      | {
          id: number
          title: string
          department: string
          deadline: string
          subsidy: string
          region: string
          description: string
          requirements_json: string
          process: string
          materials: string
          tags: string
          status: string
          created_at: string
        }
      | undefined

    if (!row) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      })
      return
    }

    let requirements: Record<string, string> = {}
    try {
      requirements = JSON.parse(row.requirements_json)
    } catch {
      requirements = {}
    }

    const userLastViewedAt = db.prepare('SELECT last_viewed_at FROM users WHERE id = ?').get(req.user!.userId) as { last_viewed_at: string } | undefined
    let isNew = false
    if (userLastViewedAt?.last_viewed_at) {
      const createdAt = new Date(row.created_at)
      isNew = createdAt > new Date(userLastViewedAt.last_viewed_at)
    }

    res.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        department: row.department,
        deadline: row.deadline,
        subsidy: row.subsidy,
        region: row.region,
        description: row.description,
        requirements,
        process: row.process ? row.process.split('→') : [],
        materials: row.materials ? row.materials.split(',') : [],
        tags: row.tags ? row.tags.split(',') : [],
        status: row.status,
        createdAt: row.created_at,
        isNew,
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取政策详情失败',
    })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const { title, department, deadline, subsidy, region, description, requirements, process, materials, tags } = req.body

    if (!title) {
      res.status(400).json({
        success: false,
        message: '请提供政策标题',
      })
      return
    }

    const requirementsJson = requirements ? JSON.stringify(requirements) : '{}'
    const processStr = Array.isArray(process) ? process.join('→') : (process || '')
    const materialsStr = Array.isArray(materials) ? materials.join(',') : (materials || '')
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '')

    const result = db.prepare(`
      INSERT INTO policies (title, department, deadline, subsidy, region, description, requirements_json, process, materials, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(title, department || '', deadline || '', subsidy || '', region || '', description || '', requirementsJson, processStr, materialsStr, tagsStr)

    res.json({
      success: true,
      data: { id: Number(result.lastInsertRowid) },
      message: '政策添加成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '添加政策失败',
    })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const { id } = req.params
    const policy = db.prepare('SELECT id FROM policies WHERE id = ?').get(id) as { id: number } | undefined

    if (!policy) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      })
      return
    }

    db.prepare('DELETE FROM policies WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '政策删除成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '删除政策失败',
    })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const parsed = updatePolicySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      })
      return
    }

    const db = getDb()
    const { id } = req.params
    const policy = db.prepare('SELECT id FROM policies WHERE id = ?').get(id) as { id: number } | undefined

    if (!policy) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      })
      return
    }

    const fields: string[] = []
    const values: (string | number)[] = []

    const fieldMap: Record<string, string> = {
      title: 'title',
      department: 'department',
      deadline: 'deadline',
      subsidy: 'subsidy',
      region: 'region',
      description: 'description',
      status: 'status',
    }

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue
      if (key === 'requirements' && typeof value === 'object') {
        fields.push('requirements_json = ?')
        values.push(JSON.stringify(value))
      } else if (key === 'process' && Array.isArray(value)) {
        fields.push('process = ?')
        values.push(value.join('→'))
      } else if (key === 'materials' && Array.isArray(value)) {
        fields.push('materials = ?')
        values.push(value.join(','))
      } else if (key === 'tags' && Array.isArray(value)) {
        fields.push('tags = ?')
        values.push(value.join(','))
      } else if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(String(value))
      }
    }

    if (fields.length === 0) {
      res.status(400).json({
        success: false,
        message: '没有需要更新的字段',
      })
      return
    }

    values.push(id)
    db.prepare(`UPDATE policies SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as any

    res.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        department: updated.department,
        deadline: updated.deadline,
        subsidy: updated.subsidy,
        region: updated.region,
        description: updated.description,
        status: updated.status,
      },
      message: '政策更新成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '更新政策失败',
    })
  }
})

export default router
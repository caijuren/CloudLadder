import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { parsePolicyText } from '../services/policyParser.js'

const router = Router()

router.post('/parse', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawText } = req.body

    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({
        success: false,
        message: '请提供 rawText 参数',
      })
      return
    }

    const result = await parsePolicyText(rawText)

    res.json({
      success: true,
      data: {
        ...result,
        requirements_json: JSON.parse(result.requirements_json || '{}'),
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '解析失败',
    })
  }
})

router.post('/parse-and-save', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawText } = req.body

    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({
        success: false,
        message: '请提供 rawText 参数',
      })
      return
    }

    const parsed = await parsePolicyText(rawText)

    if (!parsed.title) {
      res.status(400).json({
        success: false,
        message: '无法解析出政策标题，保存失败',
      })
      return
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM policies WHERE title = ?').get(parsed.title) as { id: number } | undefined

    let policyId: number

    if (existing) {
      policyId = existing.id
    } else {
      const result = db.prepare(`
        INSERT INTO policies (title, department, deadline, subsidy, region, description, requirements_json, process, materials, tags, status, raw_text)
        VALUES (@title, @department, @deadline, @subsidy, @region, @description, @requirements_json, @process, @materials, @tags, 'active', @raw_text)
      `).run({
        ...parsed,
        raw_text: rawText,
      })
      policyId = Number(result.lastInsertRowid)
    }

    const companies = db.prepare('SELECT id FROM companies').all() as Array<{ id: number }>
    const insertMatch = db.prepare(`
      INSERT OR IGNORE INTO policy_matches (company_id, policy_id, match_rate, matched_items, unmatched_items)
      VALUES (?, ?, 50, '[]', '["待评估"]')
    `)

    const insertTasks = db.prepare(`
      INSERT INTO tasks (company_id, policy_id, title, category, deadline, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)

    for (const company of companies) {
      insertMatch.run(company.id, policyId)
      if (parsed.deadline) {
        insertTasks.run(company.id, policyId, `申报${parsed.title}`, '申报', parsed.deadline)
      }
      if (parsed.materials) {
        const materialList = parsed.materials.split(',').filter(Boolean)
        for (const material of materialList) {
          insertTasks.run(company.id, policyId, `准备${material}`, '材料', parsed.deadline || '')
        }
      }
    }

    res.json({
      success: true,
      data: {
        policyId,
        title: parsed.title,
        requirements_json: JSON.parse(parsed.requirements_json || '{}'),
      },
      message: existing ? '政策已存在，已更新匹配关系' : '政策保存成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '解析并保存失败',
    })
  }
})

router.get('/parse-logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const { page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20))
    const offset = (pageNum - 1) * limitNum

    const countResult = db.prepare('SELECT COUNT(*) as total FROM policy_crawl_logs').get() as { total: number }

    const rows = db.prepare(`
      SELECT l.*, s.name as source_name
      FROM policy_crawl_logs l
      LEFT JOIN policy_sources s ON l.source_id = s.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limitNum, offset) as Array<{
      id: number
      source_id: number | null
      policy_title: string | null
      raw_text: string | null
      parsed_json: string | null
      status: string
      error_message: string | null
      created_at: string
      source_name: string | null
    }>

    const list = rows.map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      sourceName: row.source_name,
      policyTitle: row.policy_title,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }))

    res.json({
      success: true,
      data: {
        list,
        total: countResult.total,
        page: pageNum,
        limit: limitNum,
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取解析日志失败',
    })
  }
})

export default router
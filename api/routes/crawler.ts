import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { crawlSource, crawlAll } from '../services/crawler.js'

const router = Router()

router.get('/sources', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM policy_sources ORDER BY created_at DESC').all() as Array<{
      id: number
      name: string
      url: string
      department: string
      region: string
      source_type: string
      enabled: number
      last_crawled_at: string | null
      created_at: string
    }>

    const list = rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      department: row.department,
      region: row.region,
      sourceType: row.source_type,
      enabled: !!row.enabled,
      lastCrawledAt: row.last_crawled_at,
      createdAt: row.created_at,
    }))

    res.json({
      success: true,
      data: list,
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取政策源列表失败',
    })
  }
})

router.post('/sources', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const { name, url, department, region } = req.body

    if (!name || !url) {
      res.status(400).json({
        success: false,
        message: '请提供 name 和 url',
      })
      return
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM policy_sources WHERE url = ?').get(url) as { id: number } | undefined

    if (existing) {
      res.status(409).json({
        success: false,
        message: '该URL的政策源已存在',
      })
      return
    }

    const result = db.prepare(`
      INSERT INTO policy_sources (name, url, department, region, source_type, enabled)
      VALUES (?, ?, ?, ?, 'government', 1)
    `).run(name, url, department || '', region || '')

    res.json({
      success: true,
      data: { id: Number(result.lastInsertRowid) },
      message: '政策源添加成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '添加政策源失败',
    })
  }
})

router.delete('/sources/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const db = getDb()
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM policy_sources WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '政策源不存在',
      })
      return
    }

    db.prepare('DELETE FROM policy_sources WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '政策源删除成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '删除政策源失败',
    })
  }
})

router.post('/trigger/:sourceId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const { sourceId } = req.params
    const result = await crawlSource(Number(sourceId))

    res.json({
      success: true,
      data: result,
      message: `爬取完成: 获取 ${result.crawled} 条, 新增 ${result.newPolicies} 条, 错误 ${result.errors} 条`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `爬取失败: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

router.post('/trigger-all', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '无权限访问',
      })
      return
    }

    const results = await crawlAll()
    const totalNew = results.reduce((sum, r) => sum + r.newPolicies, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const totalCrawled = results.reduce((sum, r) => sum + r.crawled, 0)

    res.json({
      success: true,
      data: results,
      message: `全量爬取完成: 获取 ${totalCrawled} 条, 新增 ${totalNew} 条, 错误 ${totalErrors} 条`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `全量爬取失败: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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
      message: '获取爬取日志失败',
    })
  }
})

export default router
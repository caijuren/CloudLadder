import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const companyId = req.user!.companyId
    if (!companyId) {
      res.status(400).json({ success: false, message: '请先创建企业档案' })
      return
    }
    const rows = db.prepare(
      'SELECT id, name, category_value, sort_order, created_at FROM doc_categories WHERE company_id = ? ORDER BY sort_order ASC, id ASC'
    ).all(companyId)
    res.json({ success: true, data: rows })
  } catch {
    res.status(500).json({ success: false, message: '获取分类列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const companyId = req.user!.companyId
    if (!companyId) {
      res.status(400).json({ success: false, message: '请先创建企业档案' })
      return
    }
    const { name, category_value } = req.body
    if (!name?.trim()) {
      res.status(400).json({ success: false, message: '请输入分类名称' })
      return
    }
    if (!category_value?.trim()) {
      res.status(400).json({ success: false, message: '请填写分类标识符' })
      return
    }

    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM doc_categories WHERE company_id = ?'
    ).get(companyId) as { next_order: number }

    db.prepare(
      'INSERT INTO doc_categories (company_id, name, category_value, sort_order) VALUES (?, ?, ?, ?)'
    ).run(companyId, name.trim(), category_value.trim(), maxOrder.next_order)

    const row = db.prepare(
      'SELECT id, name, category_value, sort_order, created_at FROM doc_categories WHERE company_id = ? ORDER BY sort_order ASC, id ASC'
    ).all(companyId)

    res.json({ success: true, data: row })
  } catch {
    res.status(500).json({ success: false, message: '添加分类失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const companyId = req.user!.companyId
    const { id } = req.params
    const { name, sort_order } = req.body

    const existing = db.prepare(
      'SELECT id FROM doc_categories WHERE id = ? AND company_id = ?'
    ).get(id, companyId)
    if (!existing) {
      res.status(404).json({ success: false, message: '分类不存在' })
      return
    }

    if (name !== undefined) {
      db.prepare('UPDATE doc_categories SET name = ? WHERE id = ?').run(name.trim(), id)
    }
    if (sort_order !== undefined) {
      db.prepare('UPDATE doc_categories SET sort_order = ? WHERE id = ?').run(sort_order, id)
    }

    const rows = db.prepare(
      'SELECT id, name, category_value, sort_order, created_at FROM doc_categories WHERE company_id = ? ORDER BY sort_order ASC, id ASC'
    ).all(companyId)
    res.json({ success: true, data: rows })
  } catch {
    res.status(500).json({ success: false, message: '更新分类失败' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const companyId = req.user!.companyId
    const { id } = req.params

    const category = db.prepare(
      'SELECT id, category_value FROM doc_categories WHERE id = ? AND company_id = ?'
    ).get(id, companyId) as { id: number; category_value: string } | undefined
    if (!category) {
      res.status(404).json({ success: false, message: '分类不存在' })
      return
    }

    db.prepare('DELETE FROM doc_categories WHERE id = ? AND company_id = ?').run(id, companyId)

    const rows = db.prepare(
      'SELECT id, name, category_value, sort_order, created_at FROM doc_categories WHERE company_id = ? ORDER BY sort_order ASC, id ASC'
    ).all(companyId)
    res.json({ success: true, data: rows })
  } catch {
    res.status(500).json({ success: false, message: '删除分类失败' })
  }
})

export default router
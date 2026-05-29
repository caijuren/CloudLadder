import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

const LINK_FIELDS = 'id, title AS name, url, department, region, category, description AS notes, created_at'

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const userId = req.user!.userId
    const { search, department, region, category } = req.query

    let sql = `SELECT ${LINK_FIELDS} FROM resource_links WHERE user_id = ?`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [userId]

    if (search) {
      sql += ' AND (title LIKE ? OR url LIKE ? OR description LIKE ?)'
      const s = `%${search}%`
      params.push(s, s, s)
    }
    if (department) {
      sql += ' AND department = ?'
      params.push(department)
    }
    if (region) {
      sql += ' AND region = ?'
      params.push(region)
    }
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params)
    res.json({ success: true, data: rows })
  } catch {
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const userId = req.user!.userId
    const { name, title, url, department, region, category, notes, description } = req.body

    const linkName = (name || title || '').trim()
    const linkNotes = notes || description || ''

    if (!linkName) {
      res.status(400).json({ success: false, message: '请输入网站名称' })
      return
    }
    if (!url?.trim()) {
      res.status(400).json({ success: false, message: '请输入链接地址' })
      return
    }

    const result = db.prepare(`
      INSERT INTO resource_links (user_id, title, url, department, region, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, linkName, url.trim(), department || '', region || '', category || '', linkNotes)

    const row = db.prepare(`SELECT ${LINK_FIELDS} FROM resource_links WHERE id = ?`).get(result.lastInsertRowid)
    res.json({ success: true, data: row })
  } catch {
    res.status(500).json({ success: false, message: '添加失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const userId = req.user!.userId
    const { id } = req.params
    const { name, title, url, department, region, category, notes, description } = req.body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = db.prepare('SELECT * FROM resource_links WHERE id = ? AND user_id = ?').get(id, userId) as any
    if (!existing) {
      res.status(404).json({ success: false, message: '记录不存在' })
      return
    }

    const linkName = (name || title || '').trim() || existing.title
    const linkNotes = (notes || description) ?? existing.description

    db.prepare(`
      UPDATE resource_links SET title = ?, url = ?, department = ?, region = ?, category = ?, description = ?
      WHERE id = ? AND user_id = ?
    `).run(
      linkName,
      url?.trim() ?? existing.url,
      department ?? existing.department,
      region ?? existing.region,
      category ?? existing.category,
      linkNotes,
      id,
      userId
    )

    const row = db.prepare(`SELECT ${LINK_FIELDS} FROM resource_links WHERE id = ?`).get(id)
    res.json({ success: true, data: row })
  } catch {
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const userId = req.user!.userId
    const { id } = req.params

    const result = db.prepare('DELETE FROM resource_links WHERE id = ? AND user_id = ?').run(id, userId)
    if (result.changes === 0) {
      res.status(404).json({ success: false, message: '记录不存在' })
      return
    }
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

export default router
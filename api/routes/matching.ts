import { Router, type Request, type Response } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getDb } from '../db.js'
import { evaluateAllPolicies } from '../services/matchingEngine.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
    if (!user) {
      res.json({ success: true, data: [] })
      return
    }

    const results = await evaluateAllPolicies(user.id)

    const upsertMatch = db.prepare(`
      INSERT INTO policy_matches (company_id, policy_id, match_rate, matched_items, unmatched_items)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(company_id, policy_id) DO UPDATE SET
        match_rate = excluded.match_rate,
        matched_items = excluded.matched_items,
        unmatched_items = excluded.unmatched_items
    `)

    const transaction = db.transaction(() => {
      for (const r of results) {
        upsertMatch.run(user.id, r.policyId, r.rate, JSON.stringify(r.matched), JSON.stringify(r.unmatched))
      }
    })
    transaction()

    const data = db.prepare(`
      SELECT pm.*, p.title, p.department, p.deadline, p.subsidy, p.region, p.tags
      FROM policy_matches pm
      JOIN policies p ON pm.policy_id = p.id
      WHERE pm.company_id = ?
      ORDER BY pm.match_rate DESC
    `).all(user.id) as Array<{
      id: number
      company_id: number
      policy_id: number
      match_rate: number
      matched_items: string
      unmatched_items: string
      title: string
      department: string
      deadline: string
      subsidy: string
      region: string
      tags: string
    }>

    const list = data.map((row) => ({
      id: row.id,
      policyId: row.policy_id,
      policyTitle: row.title,
      matchRate: row.match_rate,
      matchedItems: JSON.parse(row.matched_items || '[]'),
      unmatchedItems: JSON.parse(row.unmatched_items || '[]'),
      subsidy: row.subsidy,
      deadline: row.deadline,
      department: row.department,
      region: row.region,
      tags: row.tags ? row.tags.split(',') : [],
    }))

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('Matching error:', error)
    res.status(500).json({ success: false, message: '匹配计算失败' })
  }
})

export default router
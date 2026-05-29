import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { adminMiddleware } from '../middleware/admin.js'
import { evaluateAllPolicies } from '../services/matchingEngine.js'

const router = Router()

router.get('/dashboard', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }

    const totalPolicies = db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = \'active\'').get() as { count: number }

    const totalMatches = db.prepare('SELECT COUNT(*) as count FROM policy_matches').get() as { count: number }

    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
    const completedTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = \'completed\'').get() as { count: number }

    const avgMatchRate = db.prepare('SELECT AVG(match_rate) as avg FROM policy_matches').get() as { avg: number | null }

    const industryDistribution = db.prepare(`
      SELECT industry, COUNT(*) as count
      FROM companies
      WHERE industry != ''
      GROUP BY industry
      ORDER BY count DESC
    `).all() as Array<{ industry: string; count: number }>

    const regionDistribution = db.prepare(`
      SELECT region, COUNT(*) as count
      FROM companies
      WHERE region != ''
      GROUP BY region
      ORDER BY count DESC
    `).all() as Array<{ region: string; count: number }>

    res.json({
      success: true,
      data: {
        totalCompanies: totalCompanies.count,
        totalPolicies: totalPolicies.count,
        totalMatches: totalMatches.count,
        totalTasks: totalTasks.count,
        completedTasks: completedTasks.count,
        taskCompletionRate: totalTasks.count > 0 ? Math.round((completedTasks.count / totalTasks.count) * 100) : 0,
        averageMatchRate: avgMatchRate.avg ? Math.round(avgMatchRate.avg) : 0,
        industryDistribution,
        regionDistribution,
      },
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取仪表盘数据失败',
    })
  }
})

router.get('/enterprises', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const rows = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.industry,
        c.region,
        c.employee_count,
        c.revenue,
        u.email,
        u.created_at,
        (SELECT COUNT(*) FROM assets WHERE company_id = c.id) as asset_count,
        (SELECT COUNT(*) FROM team_members WHERE company_id = c.id) as team_count,
        (SELECT COUNT(*) FROM tasks WHERE company_id = c.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE company_id = c.id AND status = 'completed') as completed_task_count,
        (SELECT AVG(match_rate) FROM policy_matches WHERE company_id = c.id) as avg_match_rate
      FROM companies c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id DESC
    `).all() as Array<{
      id: number
      name: string
      industry: string
      region: string
      employee_count: number
      revenue: string
      email: string
      created_at: string
      asset_count: number
      team_count: number
      task_count: number
      completed_task_count: number
      avg_match_rate: number | null
    }>

    const list = rows.map((row) => {
      const healthScore = calculateHealthScore(row)
      return {
        id: row.id,
        name: row.name,
        industry: row.industry,
        region: row.region,
        employeeCount: row.employee_count,
        revenue: row.revenue,
        email: row.email,
        createdAt: row.created_at,
        assetCount: row.asset_count,
        teamCount: row.team_count,
        taskCount: row.task_count,
        completedTaskCount: row.completed_task_count,
        averageMatchRate: row.avg_match_rate ? Math.round(row.avg_match_rate) : 0,
        healthScore,
        healthLevel: getHealthLevel(healthScore),
      }
    })

    res.json({
      success: true,
      data: list,
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取企业列表失败',
    })
  }
})

function calculateHealthScore(company: {
  asset_count: number
  team_count: number
  task_count: number
  completed_task_count: number
  avg_match_rate: number | null
}): number {
  let score = 0

  score += Math.min(company.asset_count * 15, 30)
  score += Math.min(company.team_count * 10, 20)
  if (company.task_count > 0) {
    score += Math.round((company.completed_task_count / company.task_count) * 20)
  }
  if (company.avg_match_rate) {
    score += Math.round(company.avg_match_rate * 0.3)
  }

  return Math.min(score, 100)
}

function getHealthLevel(score: number): string {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '待提升'
}

router.post('/recommend/:companyId', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const { companyId } = req.params
    const company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(companyId) as { id: number; name: string } | undefined

    if (!company) {
      res.status(404).json({
        success: false,
        message: '企业不存在',
      })
      return
    }

    const results = await evaluateAllPolicies(Number(companyId))

    const upsertMatch = db.prepare(`
      INSERT OR REPLACE INTO policy_matches (company_id, policy_id, match_rate, matched_items, unmatched_items)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      for (const r of results) {
        upsertMatch.run(company.id, r.policyId, r.rate, JSON.stringify(r.matched), JSON.stringify(r.unmatched))
      }
    })
    transaction()

    res.json({
      success: true,
      data: {
        companyId: company.id,
        companyName: company.name,
        matchedPolicies: results.length,
      },
      message: `一键推荐完成: 共匹配 ${results.length} 条政策`,
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '一键推荐失败',
    })
  }
})

router.get('/auto-grants', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const rows = db.prepare(`
      SELECT
        ag.id,
        ag.policy_id,
        ag.grant_type,
        ag.description,
        ag.eligible_condition,
        ag.auto_amount,
        ag.is_active,
        ag.created_at,
        p.title as policy_title,
        p.department,
        p.subsidy,
        p.region
      FROM auto_grants ag
      JOIN policies p ON ag.policy_id = p.id
      ORDER BY ag.created_at DESC
    `).all() as Array<{
      id: number
      policy_id: number
      grant_type: string
      description: string
      eligible_condition: string
      auto_amount: string
      is_active: number
      created_at: string
      policy_title: string
      department: string
      subsidy: string
      region: string
    }>

    const list = rows.map((row) => ({
      id: row.id,
      policyId: row.policy_id,
      grantType: row.grant_type,
      description: row.description,
      eligibleCondition: row.eligible_condition,
      autoAmount: row.auto_amount,
      isActive: !!row.is_active,
      createdAt: row.created_at,
      policyTitle: row.policy_title,
      department: row.department,
      subsidy: row.subsidy,
      region: row.region,
    }))

    res.json({
      success: true,
      data: list,
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '获取免申即享列表失败',
    })
  }
})

router.post('/auto-grants', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()

    const { policyId, grantType, description, eligibleCondition, autoAmount } = req.body

    if (!policyId) {
      res.status(400).json({
        success: false,
        message: '请提供 policyId',
      })
      return
    }

    const policy = db.prepare('SELECT id FROM policies WHERE id = ?').get(policyId) as { id: number } | undefined
    if (!policy) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      })
      return
    }

    const existing = db.prepare('SELECT id FROM auto_grants WHERE policy_id = ?').get(policyId) as { id: number } | undefined
    if (existing) {
      res.status(409).json({
        success: false,
        message: '该政策已配置免申即享',
      })
      return
    }

    const result = db.prepare(`
      INSERT INTO auto_grants (policy_id, grant_type, description, eligible_condition, auto_amount, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(policyId, grantType || 'auto', description || '', eligibleCondition || '', autoAmount || '')

    res.json({
      success: true,
      data: { id: Number(result.lastInsertRowid) },
      message: '免申即享记录添加成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '添加免申即享记录失败',
    })
  }
})

router.delete('/auto-grants/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM auto_grants WHERE id = ?').get(id) as { id: number } | undefined
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '免申即享记录不存在',
      })
      return
    }

    db.prepare('DELETE FROM auto_grants WHERE id = ?').run(id)

    res.json({
      success: true,
      message: '免申即享记录删除成功',
    })
  } catch {
    res.status(500).json({
      success: false,
      message: '删除免申即享记录失败',
    })
  }
})

export default router
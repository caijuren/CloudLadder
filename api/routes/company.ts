import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getDb } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const updateProfileSchema = z.object({
  revenue: z.string().optional(),
  socialInsuranceCount: z.number().int().min(0).optional(),
  industry: z.string().optional(),
  region: z.string().optional(),
  employeeCount: z.number().int().min(0).optional(),
  establishedDate: z.string().optional(),
  name: z.string().optional(),
  unifiedSocialCreditCode: z.string().optional(),
  companyType: z.string().optional(),
  registeredCapital: z.string().optional(),
  legalRepresentative: z.string().optional(),
  businessScope: z.string().optional(),
  description: z.string().optional(),
})

const addTeamMemberSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  education: z.string().optional().default(''),
  socialSecurityStatus: z.string().optional().default('active'),
  position: z.string().optional().default(''),
  title: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  joinDate: z.string().optional().default(''),
  major: z.string().optional().default(''),
})

const addDocumentSchema = z.object({
  category: z.string().min(1, '分类不能为空'),
  name: z.string().min(1, '名称不能为空'),
  docType: z.string().optional().default(''),
  docNumber: z.string().optional().default(''),
  issuingAuthority: z.string().optional().default(''),
  grantDate: z.string().optional().default(''),
  expiryDate: z.string().optional().default(''),
  amount: z.string().optional().default(''),
  counterparty: z.string().optional().default(''),
  status: z.string().optional().default('active'),
  notes: z.string().optional().default(''),
  fileUrl: z.string().optional().default(''),
  fileOriginalName: z.string().optional().default(''),
  fileSize: z.number().optional().default(0),
})

function getCompanyId(userId: number): number | null {
  const db = getDb()
  const company = db.prepare('SELECT id FROM companies WHERE user_id = ?').get(userId) as { id: number } | undefined
  return company ? company.id : null
}

const profileFields = [
  'id', 'name', 'established_date', 'revenue', 'social_insurance_count',
  'industry', 'region', 'employee_count', 'unified_social_credit_code',
  'company_type', 'registered_capital', 'legal_representative',
  'business_scope', 'description',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any) {
  return {
    id: row.id,
    name: row.name,
    establishedDate: row.established_date,
    revenue: row.revenue,
    socialInsuranceCount: row.social_insurance_count,
    industry: row.industry,
    region: row.region,
    employeeCount: row.employee_count,
    unifiedSocialCreditCode: row.unified_social_credit_code,
    companyType: row.company_type,
    registeredCapital: row.registered_capital,
    legalRepresentative: row.legal_representative,
    businessScope: row.business_scope,
    description: row.description,
  }
}

router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) {
      res.status(404).json({ success: false, message: '企业信息不存在' })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = db.prepare(`SELECT ${profileFields.join(',')} FROM companies WHERE id = ?`).get(companyId) as any
    if (!company) {
      res.status(404).json({ success: false, message: '企业信息不存在' })
      return
    }
    res.json({ success: true, data: mapProfile(company) })
  } catch {
    res.status(500).json({ success: false, message: '获取企业信息失败' })
  }
})

router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message })
      return
    }

    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) {
      res.status(404).json({ success: false, message: '企业信息不存在' })
      return
    }

    const fieldMap: Record<string, string> = {
      name: 'name', establishedDate: 'established_date', revenue: 'revenue',
      socialInsuranceCount: 'social_insurance_count', industry: 'industry',
      region: 'region', employeeCount: 'employee_count',
      unifiedSocialCreditCode: 'unified_social_credit_code',
      companyType: 'company_type', registeredCapital: 'registered_capital',
      legalRepresentative: 'legal_representative', businessScope: 'business_scope',
      description: 'description',
    }

    const fields: string[] = []
    const values: (string | number)[] = []
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' })
      return
    }

    values.push(companyId)
    db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = db.prepare(`SELECT ${profileFields.join(',')} FROM companies WHERE id = ?`).get(companyId) as any
    res.json({ success: true, data: mapProfile(updated) })
  } catch {
    res.status(500).json({ success: false, message: '更新企业信息失败' })
  }
})

// ─── Documents ───────────────────────────────────────────
router.get('/documents', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) {
      res.status(404).json({ success: false, message: '企业信息不存在' })
      return
    }
    const { category } = req.query
    let sql = 'SELECT * FROM company_documents WHERE company_id = ?'
    const params: (string | number)[] = [companyId]
    if (category && typeof category === 'string') {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY id DESC'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = db.prepare(sql).all(...params) as any[]
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id, category: r.category, name: r.name,
        docType: r.doc_type, docNumber: r.doc_number,
        issuingAuthority: r.issuing_authority, grantDate: r.grant_date,
        expiryDate: r.expiry_date, amount: r.amount,
        counterparty: r.counterparty, status: r.status,
        notes: r.notes, createdAt: r.created_at,
        fileUrl: r.file_url, fileOriginalName: r.file_original_name,
        fileSize: r.file_size,
      })),
    })
  } catch {
    res.status(500).json({ success: false, message: '获取文档列表失败' })
  }
})

router.post('/documents', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = addDocumentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message })
      return
    }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) {
      res.status(404).json({ success: false, message: '企业信息不存在' })
      return
    }
    const d = parsed.data
    const result = db.prepare(
      'INSERT INTO company_documents (company_id, category, name, doc_type, doc_number, issuing_authority, grant_date, expiry_date, amount, counterparty, status, notes, file_url, file_original_name, file_size) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(companyId, d.category, d.name, d.docType, d.docNumber, d.issuingAuthority, d.grantDate, d.expiryDate, d.amount, d.counterparty, d.status, d.notes, d.fileUrl, d.fileOriginalName, d.fileSize)
    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) }, message: '添加成功' })
  } catch {
    res.status(500).json({ success: false, message: '添加文档失败' })
  }
})

router.delete('/documents/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const doc = db.prepare('SELECT id FROM company_documents WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!doc) { res.status(404).json({ success: false, message: '文档不存在' }); return }
    db.prepare('DELETE FROM company_documents WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch {
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

router.put('/documents/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = addDocumentSchema.safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const doc = db.prepare('SELECT id FROM company_documents WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!doc) { res.status(404).json({ success: false, message: '文档不存在' }); return }
    const d = parsed.data
    db.prepare(
      'UPDATE company_documents SET category=?, name=?, doc_type=?, doc_number=?, issuing_authority=?, grant_date=?, expiry_date=?, amount=?, counterparty=?, status=?, notes=?, file_url=?, file_original_name=?, file_size=? WHERE id=?'
    ).run(d.category, d.name, d.docType, d.docNumber, d.issuingAuthority, d.grantDate, d.expiryDate, d.amount, d.counterparty, d.status, d.notes, d.fileUrl, d.fileOriginalName, d.fileSize, req.params.id)
    res.json({ success: true, message: '更新成功' })
  } catch {
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// ─── Assets (legacy) ─────────────────────────────────────
router.get('/assets', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = db.prepare('SELECT * FROM assets WHERE company_id = ? ORDER BY id DESC').all(companyId) as any[]
    res.json({
      success: true,
      data: rows.map((row) => ({ id: row.id, type: row.type, name: row.name, certNumber: row.cert_number, grantDate: row.grant_date })),
    })
  } catch { res.status(500).json({ success: false, message: '获取列表失败' }) }
})

router.post('/assets', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.object({
      type: z.enum(['SOFTWARE_COPYRIGHT', 'PATENT', 'HIGH_TECH_CERT', 'ISO', 'CMMI']),
      name: z.string().min(1),
      certNumber: z.string().optional().default(''),
      grantDate: z.string().optional().default(''),
    }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const { type, name, certNumber, grantDate } = parsed.data
    const result = db.prepare('INSERT INTO assets (company_id, type, name, cert_number, grant_date) VALUES (?, ?, ?, ?, ?)').run(companyId, type, name, certNumber, grantDate)
    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid), type, name, certNumber, grantDate }, message: '添加成功' })
  } catch { res.status(500).json({ success: false, message: '添加失败' }) }
})

router.delete('/assets/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const asset = db.prepare('SELECT id FROM assets WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!asset) { res.status(404).json({ success: false, message: '资产不存在' }); return }
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch { res.status(500).json({ success: false, message: '删除失败' }) }
})

router.put('/assets/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.object({
      type: z.enum(['SOFTWARE_COPYRIGHT', 'PATENT', 'HIGH_TECH_CERT', 'ISO', 'CMMI']),
      name: z.string().min(1),
      certNumber: z.string().optional().default(''),
      grantDate: z.string().optional().default(''),
    }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const asset = db.prepare('SELECT id FROM assets WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!asset) { res.status(404).json({ success: false, message: '资产不存在' }); return }
    const { type, name, certNumber, grantDate } = parsed.data
    db.prepare('UPDATE assets SET type=?, name=?, cert_number=?, grant_date=? WHERE id=?').run(type, name, certNumber, grantDate, req.params.id)
    res.json({ success: true, message: '更新成功' })
  } catch { res.status(500).json({ success: false, message: '更新失败' }) }
})

// ─── Team Members ────────────────────────────────────────
router.get('/team', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = db.prepare('SELECT * FROM team_members WHERE company_id = ? ORDER BY id DESC').all(companyId) as any[]
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id, name: r.name, education: r.education,
        socialSecurityStatus: r.social_security_status, position: r.position,
        title: r.title, phone: r.phone, email: r.email,
        joinDate: r.join_date, major: r.major,
      })),
    })
  } catch { res.status(500).json({ success: false, message: '获取团队列表失败' }) }
})

router.post('/team', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = addTeamMemberSchema.safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const d = parsed.data
    const result = db.prepare(
      'INSERT INTO team_members (company_id, name, education, social_security_status, position, title, phone, email, join_date, major) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(companyId, d.name, d.education, d.socialSecurityStatus, d.position, d.title, d.phone, d.email, d.joinDate, d.major)
    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) }, message: '添加成功' })
  } catch { res.status(500).json({ success: false, message: '添加成员失败' }) }
})

router.delete('/team/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const member = db.prepare('SELECT id FROM team_members WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!member) { res.status(404).json({ success: false, message: '成员不存在' }); return }
    db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch { res.status(500).json({ success: false, message: '删除失败' }) }
})

router.put('/team/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = addTeamMemberSchema.safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }
    const db = getDb()
    const companyId = getCompanyId(req.user!.userId)
    if (!companyId) { res.status(404).json({ success: false, message: '企业信息不存在' }); return }
    const member = db.prepare('SELECT id FROM team_members WHERE id = ? AND company_id = ?').get(req.params.id, companyId)
    if (!member) { res.status(404).json({ success: false, message: '成员不存在' }); return }
    const d = parsed.data
    db.prepare(
      'UPDATE team_members SET name=?, education=?, social_security_status=?, position=?, title=?, phone=?, email=?, join_date=?, major=? WHERE id=?'
    ).run(d.name, d.education, d.socialSecurityStatus, d.position, d.title, d.phone, d.email, d.joinDate, d.major, req.params.id)
    res.json({ success: true, message: '更新成功' })
  } catch { res.status(500).json({ success: false, message: '更新失败' }) }
})

// ─── Team / Permission Management ───────────────────────

function getCompanyIdByMember(userId: number): { companyId: number; role: string } | null {
  const db = getDb()
  const member = db.prepare(
    'SELECT company_id, role FROM company_members WHERE user_id = ?'
  ).get(userId) as { company_id: number; role: string } | undefined
  return member ? { companyId: member.company_id, role: member.role } : null
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET /api/company/members - list all company members
router.get('/members', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }

    const rows = db.prepare(`
      SELECT cm.id, cm.user_id, cm.role, cm.joined_at,
             u.email, u.company_name
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.company_id = ?
      ORDER BY cm.joined_at ASC
    `).all(memberInfo.companyId) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        email: r.email,
        name: r.company_name,
        role: r.role,
        joinedAt: r.joined_at,
      })),
    })
  } catch { res.status(500).json({ success: false, message: '获取成员列表失败' }) }
})

// DELETE /api/company/members/:id - remove a member (admin only)
router.delete('/members/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }
    if (memberInfo.role !== 'admin') { res.status(403).json({ success: false, message: '需要管理员权限' }); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = db.prepare('SELECT id, user_id, role FROM company_members WHERE id = ? AND company_id = ?').get(req.params.id, memberInfo.companyId) as any
    if (!target) { res.status(404).json({ success: false, message: '成员不存在' }); return }
    if (target.role === 'admin') { res.status(400).json({ success: false, message: '不能移除管理员' }); return }
    if (target.user_id === req.user!.userId) { res.status(400).json({ success: false, message: '不能移除自己' }); return }

    db.prepare('DELETE FROM company_members WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '成员已移除' })
  } catch { res.status(500).json({ success: false, message: '移除失败' }) }
})

// PUT /api/company/members/:id/role - change member role (admin only)
router.put('/members/:id/role', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.object({ role: z.enum(['admin', 'member']) }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: '角色无效' }); return }

    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }
    if (memberInfo.role !== 'admin') { res.status(403).json({ success: false, message: '需要管理员权限' }); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = db.prepare('SELECT id, role FROM company_members WHERE id = ? AND company_id = ?').get(req.params.id, memberInfo.companyId) as any
    if (!target) { res.status(404).json({ success: false, message: '成员不存在' }); return }

    db.prepare('UPDATE company_members SET role = ? WHERE id = ?').run(parsed.data.role, req.params.id)
    res.json({ success: true, message: '角色已更新' })
  } catch { res.status(500).json({ success: false, message: '更新角色失败' }) }
})

// POST /api/company/invitations - create invitation (admin only)
router.post('/invitations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.object({ email: z.string().email('邮箱格式不正确') }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }

    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }
    if (memberInfo.role !== 'admin') { res.status(403).json({ success: false, message: '需要管理员权限' }); return }

    const { email } = parsed.data

    // Check if user is already a member
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined
    if (existingUser) {
      const alreadyMember = db.prepare('SELECT id FROM company_members WHERE user_id = ? AND company_id = ?').get(existingUser.id, memberInfo.companyId)
      if (alreadyMember) { res.status(409).json({ success: false, message: '该用户已是企业成员' }); return }
    }

    // Check for pending invitation
    const pendingInvite = db.prepare(
      'SELECT id FROM invitations WHERE company_id = ? AND email = ? AND status = ?'
    ).get(memberInfo.companyId, email, 'pending')
    if (pendingInvite) { res.status(409).json({ success: false, message: '已向该邮箱发送过邀请，请等待对方接受' }); return }

    const inviteCode = generateInviteCode()
    db.prepare(
      'INSERT INTO invitations (company_id, email, invite_code, invited_by) VALUES (?, ?, ?, ?)'
    ).run(memberInfo.companyId, email, inviteCode, req.user!.userId)

    // Get company name for response
    const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(memberInfo.companyId) as { name: string } | undefined

    res.status(201).json({
      success: true,
      data: { inviteCode, email, companyName: company?.name || '' },
      message: '邀请已创建',
    })
  } catch { res.status(500).json({ success: false, message: '创建邀请失败' }) }
})

// GET /api/company/invitations - list invitations
router.get('/invitations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }
    if (memberInfo.role !== 'admin') { res.status(403).json({ success: false, message: '需要管理员权限' }); return }

    const rows = db.prepare(`
      SELECT i.id, i.email, i.invite_code, i.status, i.created_at,
             u.email as invited_by_email
      FROM invitations i
      LEFT JOIN users u ON u.id = i.invited_by
      WHERE i.company_id = ?
      ORDER BY i.created_at DESC
    `).all(memberInfo.companyId) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        email: r.email,
        inviteCode: r.invite_code,
        status: r.status,
        invitedBy: r.invited_by_email,
        createdAt: r.created_at,
      })),
    })
  } catch { res.status(500).json({ success: false, message: '获取邀请列表失败' }) }
})

// DELETE /api/company/invitations/:id - cancel invitation (admin only)
router.delete('/invitations/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const memberInfo = getCompanyIdByMember(req.user!.userId)
    if (!memberInfo) { res.status(404).json({ success: false, message: '未加入任何企业' }); return }
    if (memberInfo.role !== 'admin') { res.status(403).json({ success: false, message: '需要管理员权限' }); return }

    const invite = db.prepare('SELECT id FROM invitations WHERE id = ? AND company_id = ?').get(req.params.id, memberInfo.companyId)
    if (!invite) { res.status(404).json({ success: false, message: '邀请不存在' }); return }

    db.prepare('DELETE FROM invitations WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '邀请已取消' })
  } catch { res.status(500).json({ success: false, message: '取消失败' }) }
})

// POST /api/company/invitations/accept - accept invitation by code (authenticated user)
router.post('/invitations/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.object({ inviteCode: z.string().min(1, '邀请码不能为空') }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.errors[0].message }); return }

    const db = getDb()
    const { inviteCode } = parsed.data

    const invite = db.prepare(`
      SELECT i.id, i.company_id, i.email, i.status
      FROM invitations i
      WHERE i.invite_code = ?
    `).get(inviteCode) as { id: number; company_id: number; email: string; status: string } | undefined

    if (!invite) { res.status(404).json({ success: false, message: '邀请码无效' }); return }
    if (invite.status !== 'pending') { res.status(400).json({ success: false, message: '邀请已失效' }); return }

    // Verify the email matches (or user is accepting for themselves)
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.user!.userId) as { id: number; email: string } | undefined
    if (!user) { res.status(404).json({ success: false, message: '用户不存在' }); return }
    if (user.email !== invite.email) { res.status(403).json({ success: false, message: '邀请邮箱与当前账号不匹配' }); return }

    // Check if already a member
    const alreadyMember = db.prepare('SELECT id FROM company_members WHERE user_id = ? AND company_id = ?').get(user.id, invite.company_id)
    if (alreadyMember) { res.status(409).json({ success: false, message: '您已是该企业成员' }); return }

    // Add to company members and update invitation status
    const txn = db.transaction(() => {
      db.prepare('INSERT INTO company_members (company_id, user_id, role) VALUES (?, ?, ?)').run(invite.company_id, user.id, 'member')
      db.prepare('UPDATE invitations SET status = ? WHERE id = ?').run('accepted', invite.id)
    })
    txn()

    // Get company name
    const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(invite.company_id) as { name: string } | undefined

    res.json({
      success: true,
      data: { companyId: invite.company_id, companyName: company?.name || '', role: 'member' },
      message: '已成功加入企业',
    })
  } catch { res.status(500).json({ success: false, message: '接受邀请失败' }) }
})

// ─── Enterprise Info Auto-fill ────────────────────────────
const enterpriseSearchSchema = z.object({
  keyword: z.string().min(1, '企业名称或信用代码不能为空'),
})

router.post('/fetch-info', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = enterpriseSearchSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message })
      return
    }

    const { keyword } = parsed.data
    const apiKey = process.env.TIANYANCHA_API_KEY

    if (apiKey) {
      const response = await fetch('https://open.api.tianyancha.com/services/open/ic/baseinfo/normal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify({ keyword }),
      })

      if (!response.ok) {
        res.status(502).json({ success: false, message: '企业信息查询服务暂不可用' })
        return
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await response.json() as any

      if (result.error_code && result.error_code !== 0) {
        res.status(400).json({ success: false, message: result.message || '未查询到企业信息' })
        return
      }

      const data = result.data || {}
      res.json({
        success: true,
        data: {
          name: data.companyName || '',
          unifiedSocialCreditCode: data.regNumber || '',
          legalRepresentative: data.legalPersonName || '',
          companyType: data.companyType || '',
          registeredCapital: data.regCapital || '',
          establishedDate: data.establishTime || '',
          industry: data.industry || '',
          region: data.regLocation ? data.regLocation.replace(/^.*省|自治区/, '').replace(/.*市/, '') : '',
          businessScope: data.businessScope || '',
          employeeCount: data.employees ? parseInt(String(data.employees)) || 0 : 0,
        },
      })
    } else if (process.env.QICHACHA_API_KEY) {
      const response = await fetch('https://api.qichacha.com/Company/GetCompanyDetail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': process.env.QICHACHA_API_KEY,
        },
        body: JSON.stringify({ keyword, key: keyword }),
      })

      if (!response.ok) {
        res.status(502).json({ success: false, message: '企业信息查询服务暂不可用' })
        return
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await response.json() as any

      if (result.Status !== '200' && result.Status !== 200) {
        res.status(400).json({ success: false, message: result.Message || '未查询到企业信息' })
        return
      }

      const data = result.Data || result.data || {}
      const industry = data.Industry || data.industry || ''
      const region = data.Province || data.province || ''
      const city = data.City || data.city || ''

      res.json({
        success: true,
        data: {
          name: data.CompanyName || data.companyName || '',
          unifiedSocialCreditCode: data.CreditCode || data.creditCode || data.RegNumber || '',
          legalRepresentative: data.OperName || data.legalPersonName || '',
          companyType: data.CompanyType || data.companyType || '',
          registeredCapital: data.RegCapital || data.regCapital || '',
          establishedDate: data.StartDate || data.establishTime || '',
          industry: industry,
          region: city || region,
          businessScope: data.BusinessScope || data.businessScope || '',
          employeeCount: 0,
        },
      })
    } else {
      const demoData = generateDemoData(keyword)
      res.json({
        success: true,
        data: demoData,
        demo: true,
        message: '当前为演示数据。如需真实数据，请在 .env 中配置 TIANYANCHA_API_KEY',
      })
    }
  } catch (error) {
    console.error('企业信息查询失败', error)
    res.status(500).json({ success: false, message: '企业信息查询失败' })
  }
})

function generateDemoData(keyword: string) {
  const now = new Date()
  const year = now.getFullYear()
  const randomDigits = () => Math.floor(Math.random() * 10)
  const creditCode = `91${Array.from({ length: 16 }, randomDigits).join('')}`
  const registeredCapital = `${[100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)]}万元人民币`
  const establishedDate = `${year - 3 - Math.floor(Math.random() * 10)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  const industries = ['软件/信息技术', '人工智能', '生物医药', '新能源/环保', '先进制造', '新材料', '集成电路', '文化创意', '农业科技']
  const regions = ['苏州市', '南京市', '无锡市', '常州市', '南通市', '上海市', '北京市', '深圳市', '杭州市']
  const companyTypes = ['有限责任公司', '股份有限公司', '个人独资企业']
  const names = ['张', '王', '李', '陈', '刘', '杨', '周', '吴', '郑']

  return {
    name: keyword,
    unifiedSocialCreditCode: creditCode,
    legalRepresentative: `${names[Math.floor(Math.random() * names.length)]}${['建国', '伟', '强', '明', '磊', '静', '芳', '敏', '勇', '军'][Math.floor(Math.random() * 10)]}`,
    companyType: companyTypes[Math.floor(Math.random() * companyTypes.length)],
    registeredCapital,
    establishedDate,
    industry: industries[Math.floor(Math.random() * industries.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    businessScope: '计算机软硬件的开发、销售；计算机系统集成；网络技术开发、技术咨询、技术服务；信息技术咨询；企业管理咨询；市场营销策划。',
    employeeCount: Math.floor(Math.random() * 500) + 20,
  }
}

export default router
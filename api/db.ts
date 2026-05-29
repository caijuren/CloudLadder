import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'cloudladder.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      company_name TEXT DEFAULT '',
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT DEFAULT '',
      established_date TEXT DEFAULT '',
      revenue TEXT DEFAULT '',
      social_insurance_count INTEGER DEFAULT 0,
      industry TEXT DEFAULT '',
      region TEXT DEFAULT '',
      employee_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('SOFTWARE_COPYRIGHT', 'PATENT', 'HIGH_TECH_CERT', 'ISO', 'CMMI')),
      name TEXT NOT NULL,
      cert_number TEXT DEFAULT '',
      grant_date TEXT DEFAULT '',
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      education TEXT DEFAULT '',
      social_security_status TEXT DEFAULT 'active',
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT DEFAULT '',
      deadline TEXT DEFAULT '',
      subsidy TEXT DEFAULT '',
      region TEXT DEFAULT '',
      description TEXT DEFAULT '',
      requirements_json TEXT DEFAULT '{}',
      process TEXT DEFAULT '',
      materials TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      policy_id INTEGER NOT NULL,
      match_rate INTEGER DEFAULT 0,
      matched_items TEXT DEFAULT '[]',
      unmatched_items TEXT DEFAULT '[]',
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      policy_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'material',
      deadline TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS policy_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      department TEXT DEFAULT '',
      region TEXT DEFAULT '',
      source_type TEXT DEFAULT 'government',
      enabled INTEGER DEFAULT 1,
      last_crawled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_crawl_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER,
      policy_title TEXT,
      raw_text TEXT,
      parsed_json TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES policy_sources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS auto_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL UNIQUE,
      grant_type TEXT NOT NULL DEFAULT 'auto',
      description TEXT DEFAULT '',
      eligible_condition TEXT DEFAULT '',
      auto_amount TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      policy_id INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS policy_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      region TEXT DEFAULT '',
      department TEXT DEFAULT '',
      support_type TEXT DEFAULT '',
      keywords TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_policies_region ON policies(region);
    CREATE INDEX IF NOT EXISTS idx_policies_department ON policies(department);
    CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
    CREATE INDEX IF NOT EXISTS idx_policy_matches_company_id ON policy_matches(company_id);
    CREATE INDEX IF NOT EXISTS idx_policy_matches_policy_id ON policy_matches(policy_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_matches_unique ON policy_matches(company_id, policy_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_assets_company_id ON assets(company_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON team_members(company_id);
    CREATE INDEX IF NOT EXISTS idx_policy_crawl_logs_source_id ON policy_crawl_logs(source_id);
    CREATE INDEX IF NOT EXISTS idx_policy_subscriptions_user_id ON policy_subscriptions(user_id);
  `)

  // ─── Team / Permission Management Tables ─────────────
  database.exec(`
    CREATE TABLE IF NOT EXISTS company_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL UNIQUE,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired')),
      invited_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
    CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
    CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
  `)

  // Migrate existing users: add to company_members if not already present
  const existingCompanies = database.prepare('SELECT id, user_id FROM companies').all() as { id: number; user_id: number }[]
  const insertMember = database.prepare(
    'INSERT OR IGNORE INTO company_members (company_id, user_id, role) VALUES (?, ?, ?)'
  )
  const addMemberTxn = database.transaction(() => {
    for (const company of existingCompanies) {
      const member = database.prepare(
        'SELECT id FROM company_members WHERE company_id = ? AND user_id = ?'
      ).get(company.id, company.user_id)
      if (!member) {
        insertMember.run(company.id, company.user_id, 'admin')
      }
    }
  })
  addMemberTxn()

  try {
    database.exec('ALTER TABLE policies ADD COLUMN source_url TEXT DEFAULT \'\'')
  } catch {
    // column already exists, ignore
  }

  try {
    database.exec('ALTER TABLE policies ADD COLUMN raw_text TEXT DEFAULT \'\'')
  } catch {
    // column already exists, ignore
  }

  try {
    database.exec('ALTER TABLE users ADD COLUMN last_viewed_at TEXT DEFAULT \'\'')
  } catch {
    // column already exists, ignore
  }

  // Company profile extensions
  try {
    database.exec("ALTER TABLE companies ADD COLUMN unified_social_credit_code TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE companies ADD COLUMN company_type TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE companies ADD COLUMN registered_capital TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE companies ADD COLUMN legal_representative TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE companies ADD COLUMN business_scope TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE companies ADD COLUMN description TEXT DEFAULT ''")
  } catch { /* ignore */ }

  // Team member extensions
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN position TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN title TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN phone TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN email TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN join_date TEXT DEFAULT ''")
  } catch { /* ignore */ }
  try {
    database.exec("ALTER TABLE team_members ADD COLUMN major TEXT DEFAULT ''")
  } catch { /* ignore */ }

  // Company documents table
  database.exec(`
    CREATE TABLE IF NOT EXISTS company_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      doc_type TEXT DEFAULT '',
      doc_number TEXT DEFAULT '',
      issuing_authority TEXT DEFAULT '',
      grant_date TEXT DEFAULT '',
      expiry_date TEXT DEFAULT '',
      amount TEXT DEFAULT '',
      counterparty TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `)

  try { database.exec("ALTER TABLE company_documents ADD COLUMN file_url TEXT DEFAULT ''") } catch { /* ignore */ }
  try { database.exec("ALTER TABLE company_documents ADD COLUMN file_original_name TEXT DEFAULT ''") } catch { /* ignore */ }
  try { database.exec("ALTER TABLE company_documents ADD COLUMN file_size INTEGER DEFAULT 0") } catch { /* ignore */ }

  // Resource links table
  database.exec(`
    CREATE TABLE IF NOT EXISTS resource_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      department TEXT DEFAULT '',
      region TEXT DEFAULT '',
      category TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  try { database.exec("CREATE INDEX IF NOT EXISTS idx_resource_links_user_id ON resource_links(user_id)") } catch { /* ignore */ }

  const policyCount = database.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number }
  if (policyCount.count === 0) {
    const insertPolicy = database.prepare(`
      INSERT INTO policies (title, department, deadline, subsidy, region, description, requirements_json, process, materials, tags)
      VALUES (@title, @department, @deadline, @subsidy, @region, @description, @requirements_json, @process, @materials, @tags)
    `)

    const policies = [
      {
        title: '科技型中小企业入库',
        department: '科技部',
        deadline: '2026-10-31',
        subsidy: '资质认定',
        region: '全国',
        description: '科技型中小企业评价入库，享受研发费用加计扣除等政策',
        requirements_json: JSON.stringify({ revenue: '<2亿', employees: '<500', ipRequirement: '有自主知识产权' }),
        process: '注册→填报→评价→入库',
        materials: '企业注册信息表,知识产权证书,上年度财务报表',
        tags: '科技型,基础资质',
      },
      {
        title: '高新技术企业认定',
        department: '科技部',
        deadline: '2026-09-30',
        subsidy: '40万元',
        region: '苏州',
        description: '高新技术企业认定，享受企业所得税优惠（15%税率）',
        requirements_json: JSON.stringify({ revenue: '>500万', employees: '>10', ipRequirement: 'Ⅰ类知识产权≥1件或Ⅱ类≥6件' }),
        process: '自评→注册→材料编制→提交→评审→公示',
        materials: '知识产权证明,科技人员证明,研发费用审计报告,高新收入审计报告,产学研协议',
        tags: '高企,资金补贴,核心资质',
      },
      {
        title: '太仓市大创园创业资助',
        department: '太仓市人社局',
        deadline: '2026-12-31',
        subsidy: '5万元',
        region: '太仓',
        description: '太仓市大学生创业园创业项目资助，支持优秀创业项目',
        requirements_json: JSON.stringify({ revenue: '<500万', employees: '≥3', ipRequirement: '有核心技术或知识产权优先' }),
        process: '申请→初审→路演→公示→拨付',
        materials: '创业计划书,团队介绍,知识产权证明,财务报表',
        tags: '太仓,创业资助,园区专项',
      },
      {
        title: '江苏省专精特新中小企业',
        department: '江苏省工信厅',
        deadline: '2026-06-30',
        subsidy: '30万元',
        region: '江苏',
        description: '江苏省专精特新中小企业认定，专注于细分市场、创新能力强',
        requirements_json: JSON.stringify({ revenue: '>1000万', employees: '>50', ipRequirement: '拥有自主知识产权≥2件' }),
        process: '企业申报→市县推荐→专家评审→公示认定',
        materials: '企业营业执照,知识产权清单,审计报告,专精特新申请书',
        tags: '专精特新,省级认定,资金补贴',
      },
      {
        title: '苏州市科技创新创业领军人才',
        department: '苏州市科技局',
        deadline: '2026-08-15',
        subsidy: '100万元',
        region: '苏州',
        description: '苏州市科技创新创业领军人才计划，支持高层次人才创新创业',
        requirements_json: JSON.stringify({ revenue: '无硬性要求', employees: '≥5', ipRequirement: '核心技术须有自主知识产权' }),
        process: '网上申报→形式审查→专家评审→面试答辩→公示立项',
        materials: '人才计划书,学历学位证明,知识产权证明,企业财务报表',
        tags: '人才计划,领军人才,高额补贴',
      },
      {
        title: '国家高新技术企业培育入库',
        department: '科技部',
        deadline: '2026-05-31',
        subsidy: '20万元',
        region: '全国',
        description: '国家高新技术企业培育入库，为申报高企做准备',
        requirements_json: JSON.stringify({ revenue: '>200万', employees: '>5', ipRequirement: '有自主知识产权' }),
        process: '注册→填报→审核→入库',
        materials: '企业基本信息,知识产权清单,研发投入证明',
        tags: '高企培育,基础资质,全国性',
      },
    ]

    const insertMany = database.transaction((items: typeof policies) => {
      for (const item of items) {
        insertPolicy.run(item)
      }
    })

    insertMany(policies)

    const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    if (userCount.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10)
      database.prepare(
        'INSERT INTO users (email, password, company_name, role) VALUES (?, ?, ?, ?)',
      ).run('admin@cloudladder.com', hashedPassword, '示例科技有限公司', 'admin')

      database.prepare(
        'INSERT INTO companies (user_id, name, industry, region, employee_count, revenue) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(1, '示例科技有限公司', '信息技术', '苏州', 80, '1200万')

      // Add the company creator as admin member
      database.prepare(
        'INSERT INTO company_members (company_id, user_id, role) VALUES (?, ?, ?)',
      ).run(1, 1, 'admin')
    }

    const insertMatch = database.prepare(`
      INSERT INTO policy_matches (company_id, policy_id, match_rate, matched_items, unmatched_items)
      VALUES (@company_id, @policy_id, @match_rate, @matched_items, @unmatched_items)
    `)

    const matches = [
      { company_id: 1, policy_id: 1, match_rate: 85, matched_items: JSON.stringify(['企业规模', '知识产权']), unmatched_items: JSON.stringify(['财务指标']) },
      { company_id: 1, policy_id: 2, match_rate: 60, matched_items: JSON.stringify(['所属行业', '企业资质']), unmatched_items: JSON.stringify(['营收规模', '知识产权数量', '科技人员比例']) },
      { company_id: 1, policy_id: 3, match_rate: 90, matched_items: JSON.stringify(['企业规模', '所属行业', '注册区域']), unmatched_items: JSON.stringify(['团队背景']) },
    ]

    const insertMatches = database.transaction((items: typeof matches) => {
      for (const item of items) {
        insertMatch.run(item)
      }
    })

    insertMatches(matches)

    const insertTask = database.prepare(`
      INSERT INTO tasks (company_id, policy_id, title, category, deadline, status)
      VALUES (@company_id, @policy_id, @title, @category, @deadline, @status)
    `)

    const tasks = [
      { company_id: 1, policy_id: 1, title: '填写科技型中小企业评价信息表', category: '填报', deadline: '2026-06-15', status: 'in_progress' },
      { company_id: 1, policy_id: 1, title: '上传上年度财务报表', category: '材料', deadline: '2026-06-20', status: 'pending' },
      { company_id: 1, policy_id: 1, title: '上传知识产权证书', category: '材料', deadline: '2026-06-20', status: 'completed' },
      { company_id: 1, policy_id: 3, title: '撰写创业计划书', category: '材料', deadline: '2026-11-01', status: 'pending' },
      { company_id: 1, policy_id: 3, title: '整理团队成员证明材料', category: '材料', deadline: '2026-11-01', status: 'pending' },
    ]

    const insertTasks = database.transaction((items: typeof tasks) => {
      for (const item of items) {
        insertTask.run(item)
      }
    })

    insertTasks(tasks)

    const insertAutoGrant = database.prepare(`
      INSERT INTO auto_grants (policy_id, grant_type, description, eligible_condition, auto_amount, is_active)
      VALUES (@policy_id, @grant_type, @description, @eligible_condition, @auto_amount, @is_active)
    `)

    insertAutoGrant.run({
      policy_id: 3,
      grant_type: 'auto',
      description: '太仓市大创园创业资助免申即享',
      eligible_condition: '入驻太仓市大学生创业园且正常经营',
      auto_amount: '5万元',
      is_active: 1,
    })

    const insertSource = database.prepare(`
      INSERT INTO policy_sources (name, url, department, region, source_type, enabled)
      VALUES (@name, @url, @department, @region, @source_type, @enabled)
    `)

    const sources = [
      { name: '太仓市人民政府', url: 'https://www.taicang.gov.cn', department: '太仓市人民政府', region: '太仓', source_type: 'government', enabled: 1 },
      { name: '苏州市科技局', url: 'https://kjj.suzhou.gov.cn', department: '苏州市科技局', region: '苏州', source_type: 'government', enabled: 1 },
      { name: '江苏省工信厅', url: 'https://gxt.jiangsu.gov.cn', department: '江苏省工信厅', region: '江苏', source_type: 'government', enabled: 1 },
    ]

    const insertSources = database.transaction((items: typeof sources) => {
      for (const item of items) {
        insertSource.run(item)
      }
    })

    insertSources(sources)

    // Seed resource links
    const adminUser = database.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number } | undefined
    const adminUserId = adminUser?.id ?? 1

    const insertLink = database.prepare(`
      INSERT OR IGNORE INTO resource_links (user_id, title, url, department, region, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const links = [
      { title: '苏州市科技局', url: 'https://kjj.suzhou.gov.cn/', department: '苏州市科技局', region: '苏州', category: '政府科技部门', description: '苏州市科学技术局官网，发布苏州市科技项目申报、政策通知' },
      { title: '科学技术部政务服务平台', url: 'https://fuwu.most.gov.cn/html/', department: '科学技术部', region: '全国', category: '政府科技部门', description: '国家科学技术部政务服务平台，高新技术企业认定、科技型中小企业评价等' },
      { title: '中国国际科技合作网', url: 'https://www.cistc.gov.cn', department: '科学技术部', region: '全国', category: '科技合作', description: '中国国际科技合作网，国际科技合作项目与交流信息' },
      { title: '太仓市人民政府', url: 'https://www.taicang.gov.cn', department: '太仓市人民政府', region: '太仓', category: '政府综合', description: '太仓市人民政府官网，发布太仓市政策文件、通知公告' },
      { title: '苏州市人民政府', url: 'https://www.suzhou.gov.cn', department: '苏州市人民政府', region: '苏州', category: '政府综合', description: '苏州市人民政府官网，发布苏州市政策法规、政府文件' },
      { title: '江苏省科技厅', url: 'https://kxjst.jiangsu.gov.cn/', department: '江苏省科技厅', region: '江苏', category: '政府科技部门', description: '江苏省科学技术厅官网，发布江苏省科技项目申报、政策通知' },
      { title: '江苏省科技资源统筹服务中心', url: 'https://www.jssic.cn/#/index', department: '江苏省科技厅', region: '江苏', category: '科技服务', description: '江苏省科技资源统筹服务中心，大型科学仪器共享、科技资源服务' },
      { title: '江苏省科学技术厅', url: 'https://jsszkj.kxjst.jiangsu.gov.cn/js-home/home', department: '江苏省科技厅', region: '江苏', category: '政府科技部门', description: '江苏省科学技术厅数字化平台，科技项目在线申报与管理' },
      { title: '江苏省数字经济学会', url: 'https://www.jsde.org.cn', department: '江苏省科学技术协会', region: '江苏', category: '行业协会', description: '江苏省数字经济学会，数字经济领域学术交流与产业服务' },
      { title: '江苏公众科技网', url: 'https://www.jskx.org.cn', department: '江苏省科学技术协会', region: '江苏', category: '科技服务', description: '江苏公众科技网，科普宣传、科技服务、学术交流平台' },
    ]

    const insertLinks = database.transaction((items: typeof links) => {
      for (const item of items) {
        insertLink.run(adminUserId, item.title, item.url, item.department, item.region, item.category, item.description)
      }
    })
    insertLinks(links)

    console.log('[DB] Seed data inserted successfully')
  }
}

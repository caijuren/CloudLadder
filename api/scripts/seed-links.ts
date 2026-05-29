import { getDb } from '../db.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'cloudladder.db')

const dataDir = path.dirname(process.env.DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const links = [
  {
    title: '苏州市科技局',
    url: 'https://kjj.suzhou.gov.cn/',
    department: '苏州市科技局',
    region: '苏州',
    category: '政府科技部门',
    description: '苏州市科学技术局官网，发布苏州市科技项目申报、政策通知',
  },
  {
    title: '科学技术部政务服务平台',
    url: 'https://fuwu.most.gov.cn/html/',
    department: '科学技术部',
    region: '全国',
    category: '政府科技部门',
    description: '国家科学技术部政务服务平台，高新技术企业认定、科技型中小企业评价等',
  },
  {
    title: '中国国际科技合作网',
    url: 'https://www.cistc.gov.cn',
    department: '科学技术部',
    region: '全国',
    category: '科技合作',
    description: '中国国际科技合作网，国际科技合作项目与交流信息',
  },
  {
    title: '太仓市人民政府',
    url: 'https://www.taicang.gov.cn',
    department: '太仓市人民政府',
    region: '太仓',
    category: '政府综合',
    description: '太仓市人民政府官网，发布太仓市政策文件、通知公告',
  },
  {
    title: '苏州市人民政府',
    url: 'https://www.suzhou.gov.cn',
    department: '苏州市人民政府',
    region: '苏州',
    category: '政府综合',
    description: '苏州市人民政府官网，发布苏州市政策法规、政府文件',
  },
  {
    title: '江苏省科技厅',
    url: 'https://kxjst.jiangsu.gov.cn/',
    department: '江苏省科技厅',
    region: '江苏',
    category: '政府科技部门',
    description: '江苏省科学技术厅官网，发布江苏省科技项目申报、政策通知',
  },
  {
    title: '江苏省科技资源统筹服务中心',
    url: 'https://www.jssic.cn/#/index',
    department: '江苏省科技厅',
    region: '江苏',
    category: '科技服务',
    description: '江苏省科技资源统筹服务中心，大型科学仪器共享、科技资源服务',
  },
  {
    title: '江苏省科学技术厅',
    url: 'https://jsszkj.kxjst.jiangsu.gov.cn/js-home/home',
    department: '江苏省科技厅',
    region: '江苏',
    category: '政府科技部门',
    description: '江苏省科学技术厅数字化平台，科技项目在线申报与管理',
  },
  {
    title: '江苏省数字经济学会',
    url: 'https://www.jsde.org.cn',
    department: '江苏省科学技术协会',
    region: '江苏',
    category: '行业协会',
    description: '江苏省数字经济学会，数字经济领域学术交流与产业服务',
  },
  {
    title: '江苏公众科技网',
    url: 'https://www.jskx.org.cn',
    department: '江苏省科学技术协会',
    region: '江苏',
    category: '科技服务',
    description: '江苏公众科技网，科普宣传、科技服务、学术交流平台',
  },
]

async function main() {
  const db = getDb()

  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number } | undefined
  const userId = admin?.id ?? 1

  const insert = db.prepare(`
    INSERT OR IGNORE INTO resource_links (user_id, title, url, department, region, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const txn = db.transaction(() => {
    let count = 0
    for (const link of links) {
      const existing = db.prepare('SELECT id FROM resource_links WHERE url = ? AND user_id = ?').get(link.url, userId)
      if (!existing) {
        insert.run(userId, link.title, link.url, link.department, link.region, link.category, link.description)
        count++
      }
    }
    return count
  })

  const inserted = txn()
  console.log(`[seed-links] 导入完成：新增 ${inserted} 条，共 ${links.length} 条`)
}

main().catch((err) => {
  console.error('[seed-links] 导入失败:', err)
  process.exit(1)
})
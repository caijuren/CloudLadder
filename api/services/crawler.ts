import * as cheerio from 'cheerio'
import { getDb } from '../db.js'
import { parsePolicyText } from './policyParser.js'

const TIMEOUT_MS = 8000
const MAX_DEPTH = 30

interface CrawlResult {
  sourceId: number
  sourceName: string
  crawled: number
  newPolicies: number
  errors: number
}

async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ]

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const links: string[] = []
  const seen = new Set<string>()

  const urlObj = new URL(baseUrl)
  const baseHost = urlObj.hostname

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    try {
      const fullUrl = new URL(href, baseUrl)
      if (fullUrl.hostname === baseHost && !seen.has(fullUrl.href)) {
        seen.add(fullUrl.href)
        links.push(fullUrl.href)
      }
    } catch {
      // ignore invalid URLs
    }
  })

  return links.slice(0, MAX_DEPTH)
}

function extractText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header, aside, iframe').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function isPolicyUrl(url: string): boolean {
  const urlLower = url.toLowerCase()
  if (urlLower.endsWith('.pdf') || urlLower.endsWith('.doc') || urlLower.endsWith('.docx') || urlLower.endsWith('.xls') || urlLower.endsWith('.zip') || urlLower.endsWith('.jpg') || urlLower.endsWith('.png') || urlLower.endsWith('.js') || urlLower.endsWith('.css')) {
    return false
  }
  const policyKeywords = /(政策|通知|公告|公示|认定|申报|资助|补贴|项目|办法|指南|方案|意见|印发|发布|实施|试行|暂行|解读|zc|tzgg|xxgk|zwgk|gzdt|tz|gg)/i
  return policyKeywords.test(url) || policyKeywords.test(urlLower)
}

function isPolicyContent(text: string): boolean {
  const policyIndicators = [
    '政策', '通知', '公告', '办法', '规定', '意见', '通知',
    '申报', '认定', '资助', '补贴', '奖励', '支持',
    '印发', '发布', '实施', '试行', '暂行',
  ]
  const matchCount = policyIndicators.filter((kw) => text.includes(kw)).length
  return matchCount >= 2 && text.length > 200
}

export async function crawlSource(sourceId: number): Promise<CrawlResult> {
  const db = getDb()
  const source = db.prepare('SELECT * FROM policy_sources WHERE id = ? AND enabled = 1').get(sourceId) as
    | { id: number; name: string; url: string; department: string; region: string }
    | undefined

  if (!source) {
    throw new Error(`政策源不存在或未启用 (id: ${sourceId})`)
  }

  const result: CrawlResult = {
    sourceId: source.id,
    sourceName: source.name,
    crawled: 0,
    newPolicies: 0,
    errors: 0,
  }

  const insertLog = db.prepare(`
    INSERT INTO policy_crawl_logs (source_id, policy_title, raw_text, parsed_json, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertPolicy = db.prepare(`
    INSERT INTO policies (title, department, deadline, subsidy, region, description, requirements_json, process, materials, tags, status, raw_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `)

  const checkPolicy = db.prepare('SELECT id FROM policies WHERE title = ?')

  try {
    const html = await fetchWithTimeout(source.url)
    const links = extractLinks(html, source.url)

    for (const link of links) {
      if (!isPolicyUrl(link)) continue

      // 添加 1-2 秒随机延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      try {
        const pageHtml = await fetchWithTimeout(link)
        const rawText = extractText(pageHtml)

        if (!isPolicyContent(rawText)) continue

        result.crawled++

        const parsed = await parsePolicyText(rawText)

        if (!parsed.title) {
          insertLog.run(source.id, null, rawText, JSON.stringify(parsed), 'failed', '无法解析标题')
          result.errors++
          continue
        }

        const existing = checkPolicy.get(parsed.title) as { id: number } | undefined

        if (existing) {
          insertLog.run(source.id, parsed.title, rawText, JSON.stringify(parsed), 'success', null)
          continue
        }

        insertPolicy.run(
              parsed.title || '',
              parsed.department || '',
              parsed.deadline || '',
              parsed.subsidy || '',
              parsed.region || '',
              parsed.description || '',
              parsed.requirements_json || '',
              parsed.process || '',
              parsed.materials || '',
              parsed.tags || '',
              rawText
            )

        insertLog.run(source.id, parsed.title, rawText, JSON.stringify(parsed), 'success', null)
          result.newPolicies++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        insertLog.run(source.id, null, '', '{}', 'failed', errorMsg)
        result.errors++
      }
    }
  } catch (error) {
    db.prepare(`
      INSERT INTO policy_crawl_logs (source_id, policy_title, raw_text, parsed_json, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(source.id, null, '', '{}', 'failed', `源页面访问失败: ${error instanceof Error ? error.message : String(error)}`)
    result.errors++
  }

  db.prepare('UPDATE policy_sources SET last_crawled_at = CURRENT_TIMESTAMP WHERE id = ?').run(source.id)

  return result
}

export async function crawlAll(): Promise<CrawlResult[]> {
  const db = getDb()
  const sources = db.prepare('SELECT * FROM policy_sources WHERE enabled = 1').all() as Array<{
    id: number
    name: string
  }>

  const results: CrawlResult[] = []
  for (const source of sources) {
    try {
      const result = await crawlSource(source.id)
      results.push(result)
    } catch {
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        crawled: 0,
        newPolicies: 0,
        errors: 1,
      })
    }
  }

  return results
}
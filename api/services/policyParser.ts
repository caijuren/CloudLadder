const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'

export interface ParsedPolicy {
  title: string
  department: string
  deadline: string
  subsidy: string
  region: string
  description: string
  requirements_json: string
  process: string
  materials: string
  tags: string
}

function buildPrompt(rawText: string): string {
  return `你是一个政策解析专家。请从以下政策文本中提取结构化信息，返回严格的JSON格式（不要包含markdown代码块标记）：

{
  "title": "政策标题",
  "department": "归口部门",
  "deadline": "截止时间",
  "subsidy": "补贴金额",
  "region": "所属区域",
  "description": "政策描述（200字以内）",
  "requirements": { "revenue": "营收要求", "employees": "人员要求", "ipRequirement": "知识产权要求" },
  "process": "申报流程（用→分隔步骤）",
  "materials": "所需材料（用逗号分隔）",
  "tags": "标签（用逗号分隔，如：太仓,资金补贴）"
}

政策文本：
${rawText}`
}

async function parseWithAI(rawText: string): Promise<ParsedPolicy | null> {
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: '你是一个政策解析专家，只能输出JSON格式数据。' },
          { role: 'user', content: buildPrompt(rawText) },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      console.error(`[AI] API request failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      console.error('[AI] Empty response from API')
      return null
    }

    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      title: parsed.title || '',
      department: parsed.department || '',
      deadline: parsed.deadline || '',
      subsidy: parsed.subsidy || '',
      region: parsed.region || '',
      description: parsed.description || '',
      requirements_json: JSON.stringify(parsed.requirements || {}),
      process: parsed.process || '',
      materials: parsed.materials || '',
      tags: parsed.tags || '',
    }
  } catch (error) {
    console.error('[AI] Parse error:', error)
    return null
  }
}

function parseWithLocal(rawText: string): ParsedPolicy {
  const titleMatch = rawText.match(/(?:^|\n)\s*([^\n]+?((?:认定|申报|资助|补贴|计划|项目|办法|通知|指南|方案))[^\n]*)/)
  const title = titleMatch ? titleMatch[1].trim() : ''

  const deadlineMatch = rawText.match(/(?:截止|截止时间|截止日期|申报截止|报送截止)[：:]\s*(\S+(?:日|月|年)?)/)
  const deadline = deadlineMatch ? deadlineMatch[1].trim() : ''

  const subsidyMatch = rawText.match(/(?:补贴|资助|奖励|补助|扶持)[：:\s]*(\S*(?:万元|元|万))/)
  const subsidy = subsidyMatch ? subsidyMatch[1].trim() : ''

  const departmentMatch = rawText.match(/(?:归口部门|主管部门|发布单位|发文单位|印发单位)[：:]\s*(\S+)/)
  const department = departmentMatch ? departmentMatch[1].trim() : ''

  const regionMatch = rawText.match(/(?:适用区域|所属区域|地区)[：:]\s*(\S+)/)
  const region = regionMatch ? regionMatch[1].trim() : ''

  const revenueMatch = rawText.match(/(?:营收|收入|销售额|营业收入)[：:\s]*(\S+)/)
  const employeesMatch = rawText.match(/(?:人员|员工|职工|人数)[：:\s]*(\S+)/)
  const ipMatch = rawText.match(/(?:知识产权|专利|软著)[：:\s]*(\S+)/)

  const requirements = {
    revenue: revenueMatch ? revenueMatch[1].trim() : '',
    employees: employeesMatch ? employeesMatch[1].trim() : '',
    ipRequirement: ipMatch ? ipMatch[1].trim() : '',
  }

  const descriptionMatch = rawText.match(/(?:政策描述|政策内容|主要内容|支持方式)[：:]\s*([^。]+。)/)
  const description = descriptionMatch ? descriptionMatch[1].trim() : rawText.slice(0, 100)

  const processMatch = rawText.match(/(?:申报流程|办理流程|申报程序|流程)[：:]\s*([^。]+)/)
  const process = processMatch ? processMatch[1].trim() : ''

  const materialsMatch = rawText.match(/(?:申报材料|所需材料|申请材料|材料清单)[：:]\s*([^。]+)/)
  const materials = materialsMatch ? materialsMatch[1].trim() : ''

  const tags: string[] = []
  if (region) tags.push(region)
  if (subsidy) tags.push('资金补贴')
  if (department) tags.push(department)

  return {
    title,
    department,
    deadline,
    subsidy,
    region,
    description,
    requirements_json: JSON.stringify(requirements),
    process,
    materials,
    tags: tags.join(','),
  }
}

export async function parsePolicyText(rawText: string): Promise<ParsedPolicy> {
  if (!rawText || rawText.trim().length === 0) {
    return {
      title: '',
      department: '',
      deadline: '',
      subsidy: '',
      region: '',
      description: '',
      requirements_json: '{}',
      process: '',
      materials: '',
      tags: '',
    }
  }

  if (AI_API_KEY) {
    const aiResult = await parseWithAI(rawText)
    if (aiResult) {
      return aiResult
    }
    console.warn('[Parser] AI parsing failed, falling back to local parser')
  }

  return parseWithLocal(rawText)
}
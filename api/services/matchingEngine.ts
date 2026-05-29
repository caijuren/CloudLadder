import { getDb } from '../db.js'

interface CompanyProfile {
  id: number
  name: string
  established_date: string
  revenue: string
  social_insurance_count: number
  industry: string
  region: string
  employee_count: number
}

function parseNumericRange(value: string): { min?: number; max?: number } {
  value = value.replace(/[约大概]/g, '').trim()
  const numMatch = value.match(/(\d+\.?\d*)/)
  if (!numMatch) return {}
  const num = parseFloat(numMatch[1])

  if (value.includes('亿')) return { min: value.startsWith('<') ? undefined : 0, max: value.startsWith('<') ? num * 10000 : undefined }
  if (value.includes('万') || value.includes('w')) return { min: value.startsWith('<') ? undefined : num, max: value.startsWith('<') ? num : undefined }
  return { min: num, max: num }
}

function compareRevenue(companyRevenue: string, policyRequirement: string): boolean {
  const rev = parseFloat(companyRevenue) || 0
  const range = parseNumericRange(policyRequirement)

  if (policyRequirement.startsWith('<') && range.max !== undefined) {
    return rev < range.max
  }
  if (policyRequirement.startsWith('>') && range.min !== undefined) {
    return rev > range.min
  }
  if (policyRequirement.startsWith('≥') && range.min !== undefined) {
    return rev >= range.min
  }
  return true
}

function compareEmployees(companyCount: number, policyRequirement: string): boolean {
  const range = parseNumericRange(policyRequirement)
  if (policyRequirement.startsWith('<') && range.max !== undefined) {
    return companyCount < range.max
  }
  if (policyRequirement.startsWith('>') && range.min !== undefined) {
    return companyCount > range.min
  }
  if (policyRequirement.startsWith('≥') && range.min !== undefined) {
    return companyCount >= range.min
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareIpRequirement(companyAssets: any[], policyRequirement: string): boolean {
  if (!policyRequirement || policyRequirement === '有自主知识产权' || policyRequirement === '有核心技术或知识产权优先') {
    return companyAssets.length > 0
  }
  const copyrights = companyAssets.filter(a => a.type === 'SOFTWARE_COPYRIGHT').length
  const patents = companyAssets.filter(a => a.type === 'PATENT').length

  if (policyRequirement.includes('Ⅰ类') && policyRequirement.includes('≥1')) {
    return patents >= 1
  }
  if (policyRequirement.includes('Ⅱ类') && policyRequirement.includes('≥6')) {
    return copyrights >= 6
  }
  return companyAssets.length > 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateMatchRate(company: CompanyProfile, companyAssets: any[], policyRequirements: any): { rate: number; matched: string[]; unmatched: string[] } {
  const matched: string[] = []
  const unmatched: string[] = []
  let totalChecks = 0
  let passed = 0

  if (policyRequirements.revenue) {
    totalChecks++
    if (compareRevenue(company.revenue, policyRequirements.revenue)) {
      passed++
      matched.push(`营收达标: ${company.revenue}`)
    } else {
      unmatched.push(`营收不符要求: 需${policyRequirements.revenue}`)
    }
  }

  if (policyRequirements.employees) {
    totalChecks++
    const empCount = company.social_insurance_count || company.employee_count || 0
    if (compareEmployees(empCount, policyRequirements.employees)) {
      passed++
      matched.push(`人员达标: ${empCount}人`)
    } else {
      unmatched.push(`人员不符要求: 需${policyRequirements.employees}`)
    }
  }

  if (policyRequirements.ipRequirement) {
    totalChecks++
    if (compareIpRequirement(companyAssets, policyRequirements.ipRequirement)) {
      passed++
      matched.push(`知识产权达标: ${companyAssets.length}项`)
    } else {
      unmatched.push(`知识产权不符: 需${policyRequirements.ipRequirement}`)
    }
  }

  if (totalChecks === 0) {
    matched.push('系统评估中，请补充企业信息')
    return { rate: 50, matched, unmatched }
  }

  const rate = Math.round((passed / totalChecks) * 100)
  return { rate, matched, unmatched }
}

export function evaluateAllPolicies(companyId: number): Promise<Array<{ policyId: number; rate: number; matched: string[]; unmatched: string[] }>> {
  const db = getDb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any
  if (!company) return Promise.resolve([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assets = db.prepare('SELECT * FROM assets WHERE company_id = ?').all(companyId) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const policies = db.prepare('SELECT * FROM policies WHERE status = ?').all('active') as any[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = policies.map((policy: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requirements: any = {}
    try {
      requirements = JSON.parse(policy.requirements_json || '{}')
    } catch {
      // requirements_json is invalid, use empty object
    }

    const { rate, matched, unmatched } = calculateMatchRate(company, assets, requirements)

    return {
      policyId: policy.id,
      rate,
      matched,
      unmatched,
    }
  })

  results.sort((a, b) => b.rate - a.rate)

  return Promise.resolve(results)
}
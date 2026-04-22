import nationalSubsidiesRaw from '@/data/cached/subsidies/nl-national.json'
import provincialSubsidiesRaw from '@/data/cached/subsidies/nl-provincial.json'
import type { Subsidy, UpgradeId, LegacyUpgradeId } from '@/types/upgrade'

interface SubsidyEntry {
  id: string
  name: string
  nameEn?: string
  amount: number
  upgradeIds: string[]
  deadline: string | null
  deadlineEn?: string | null
  url: string
  conditions: string
  conditionsEn?: string
  minRcValue?: number
  maxYearBuilt?: number
}

const nationalSubsidies = nationalSubsidiesRaw as unknown as { subsidies: SubsidyEntry[] }
const provincialSubsidies = provincialSubsidiesRaw as unknown as {
  provinces: Record<string, {
    provincial: SubsidyEntry[]
    municipal: Record<string, SubsidyEntry[]>
  }>
}

/**
 * Returns all applicable subsidies for a given set of upgrade IDs,
 * combining national and provincial/municipal data.
 */
export function getSubsidies(
  upgradeId: UpgradeId | LegacyUpgradeId,
  province: string,
  municipality?: string,
  tierParams?: Record<string, number>,
  yearBuilt?: number,
): Subsidy[] {
  const results: Subsidy[] = []

  // National subsidies
  for (const s of nationalSubsidies.subsidies) {
    if (s.upgradeIds.includes(upgradeId)) {
      if (s.minRcValue && tierParams?.uValue) {
        const effectiveRc = 1 / tierParams.uValue
        if (effectiveRc < s.minRcValue) continue
      }
      if (s.maxYearBuilt && yearBuilt && yearBuilt > s.maxYearBuilt) continue
      results.push({
        name: s.name,
        nameEn: s.nameEn,
        amount: s.amount,
        deadline: s.deadline,
        deadlineEn: s.deadlineEn,
        url: s.url,
      })
    }
  }

  // Provincial subsidies
  const prov = provincialSubsidies.provinces[province]
  if (prov) {
    for (const s of prov.provincial) {
      if (s.upgradeIds.includes(upgradeId)) {
        results.push({ name: s.name, nameEn: s.nameEn, amount: s.amount, deadline: s.deadline, deadlineEn: s.deadlineEn, url: s.url })
      }
    }

    if (municipality && prov.municipal[municipality]) {
      for (const s of prov.municipal[municipality]) {
        if (s.upgradeIds.includes(upgradeId)) {
          results.push({ name: s.name, nameEn: s.nameEn, amount: s.amount, deadline: s.deadline, deadlineEn: s.deadlineEn, url: s.url })
        }
      }
    }
  }

  return results
}

/** Total subsidy amount for a given upgrade */
export function totalSubsidyAmount(
  upgradeId: UpgradeId | LegacyUpgradeId,
  province: string,
  municipality?: string
): number {
  return getSubsidies(upgradeId, province, municipality)
    .reduce((sum, s) => sum + s.amount, 0)
}

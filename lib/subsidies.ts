import nationalSubsidies from '@/data/cached/subsidies/nl-national.json'
import provincialSubsidies from '@/data/cached/subsidies/nl-provincial.json'
import type { Subsidy, UpgradeId } from '@/types/upgrade'

interface NationalSubsidy {
  id: string
  name: string
  amount: number
  upgradeIds: string[]
  deadline: string | null
  url: string
  conditions: string
}

/**
 * Returns all applicable subsidies for a given set of upgrade IDs,
 * combining national and provincial/municipal data.
 */
export function getSubsidies(
  upgradeId: UpgradeId,
  province: string,
  municipality?: string
): Subsidy[] {
  const results: Subsidy[] = []

  // National subsidies
  for (const s of nationalSubsidies.subsidies as NationalSubsidy[]) {
    if (s.upgradeIds.includes(upgradeId)) {
      results.push({
        name: s.name,
        amount: s.amount,
        deadline: s.deadline,
        url: s.url,
      })
    }
  }

  // Provincial subsidies
  const provinces = provincialSubsidies.provinces as Record<string, {
    provincial: NationalSubsidy[]
    municipal: Record<string, NationalSubsidy[]>
  }>

  const prov = provinces[province]
  if (prov) {
    for (const s of prov.provincial) {
      if (s.upgradeIds.includes(upgradeId)) {
        results.push({ name: s.name, amount: s.amount, deadline: s.deadline, url: s.url })
      }
    }

    if (municipality && prov.municipal[municipality]) {
      for (const s of prov.municipal[municipality]) {
        if (s.upgradeIds.includes(upgradeId)) {
          results.push({ name: s.name, amount: s.amount, deadline: s.deadline, url: s.url })
        }
      }
    }
  }

  return results
}

/** Total subsidy amount for a given upgrade */
export function totalSubsidyAmount(
  upgradeId: UpgradeId,
  province: string,
  municipality?: string
): number {
  return getSubsidies(upgradeId, province, municipality)
    .reduce((sum, s) => sum + s.amount, 0)
}

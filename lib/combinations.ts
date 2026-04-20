import type { UpgradeId } from '@/types/upgrade'

interface Dependency {
  upgradeId: UpgradeId
  requiredBefore: UpgradeId[]
  reason: string
}

interface Synergy {
  upgradeIds: [UpgradeId, UpgradeId]
  savingPercent: number
  reason: string
}

const DEPENDENCIES: Dependency[] = [
  {
    upgradeId: 'heat-pump',
    requiredBefore: ['cavity-wall-insulation', 'external-wall-insulation', 'roof-insulation'],
    reason: 'Een warmtepomp werkt aanzienlijk minder goed zonder voldoende isolatie. Overweeg eerst te isoleren.',
  },
]

const SYNERGIES: Synergy[] = [
  {
    upgradeIds: ['roof-insulation', 'external-wall-insulation'],
    savingPercent: 15,
    reason: 'Dak + gevel tegelijk via steiger bespaart ~15% op installatiekosten.',
  },
  {
    upgradeIds: ['cavity-wall-insulation', 'roof-insulation'],
    savingPercent: 10,
    reason: 'Spouwmuur + dak in één project bespaart ~10% op arbeidskosten.',
  },
  {
    upgradeIds: ['heat-pump', 'solar-panels'],
    savingPercent: 0,
    reason: 'Zonnepanelen dekken een deel van het stroomverbruik van de warmtepomp — goede combinatie.',
  },
]

/** Returns upgrades that should ideally be done before the given upgrade */
export function getRequiredBefore(upgradeId: UpgradeId): { upgradeId: UpgradeId; reason: string }[] {
  const dep = DEPENDENCIES.find(d => d.upgradeId === upgradeId)
  if (!dep) return []
  return dep.requiredBefore.map(id => ({ upgradeId: id, reason: dep.reason }))
}

/** Returns synergies for a given upgrade */
export function getSynergies(upgradeId: UpgradeId): { upgradeId: UpgradeId; savingPercent: number; reason: string }[] {
  return SYNERGIES
    .filter(s => s.upgradeIds.includes(upgradeId))
    .map(s => ({
      upgradeId: s.upgradeIds.find(id => id !== upgradeId)!,
      savingPercent: s.savingPercent,
      reason: s.reason,
    }))
}

/** Returns true if this upgrade requires exterior access and therefore needs VvE approval */
export function isBlockedForVvE(requiresExteriorAccess: boolean): boolean {
  return requiresExteriorAccess
}

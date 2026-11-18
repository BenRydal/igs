export const RAIL_TABS = [
  'data',
  'people',
  'codes',
  'talk',
  'filters',
  'select',
  'settings',
] as const

export type RailTab = (typeof RAIL_TABS)[number]

export const RAIL_LABELS: Record<RailTab | 'help', string> = {
  data: 'Data',
  people: 'People',
  codes: 'Codes',
  talk: 'Talk',
  filters: 'Filters',
  select: 'Select',
  settings: 'Settings',
  help: 'Help',
}

export function isRailTab(id: string): id is RailTab {
  return RAIL_TABS.some((tab) => tab === id)
}

export function isTabAvailable(
  tab: RailTab,
  view: { is3DMode: boolean; dataHasCodes: boolean }
): boolean {
  if (tab === 'select') return !view.is3DMode
  if (tab === 'codes') return view.dataHasCodes
  return true
}

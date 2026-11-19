import { CoreUtils } from './core-utils'

const rules = new CoreUtils()

const NON_CSV = 0
const MOVEMENT = 1
const CONVERSATION = 2
const CODES = 3
const UNKNOWN_CSV = 4

const HEADER_PRIORITIES = [
  { headers: rules.headersGPSMovement1, priority: MOVEMENT },
  { headers: rules.headersGPSMovement2, priority: MOVEMENT },
  { headers: rules.headersMovement, priority: MOVEMENT },
  { headers: rules.headersConversation, priority: CONVERSATION },
  { headers: rules.headersMultiCodes, priority: CODES },
  { headers: rules.headersSingleCodes, priority: CODES },
]

export function csvImportPriority(headerLine: string): number {
  const headers = headerLine
    .toLowerCase()
    .split(',')
    .map((header) => header.trim().replace(/"/g, ''))
  const match = HEADER_PRIORITIES.find((rule) => rules.includesAllHeaders(headers, rule.headers))
  return match?.priority ?? UNKNOWN_CSV
}

export async function sortFilesForImport(files: File[]): Promise<File[]> {
  const ranked = await Promise.all(
    files.map(async (file) => {
      if (!file.name.toLowerCase().endsWith('.csv')) return { file, priority: NON_CSV }
      const head = await file
        .slice(0, 1024)
        .text()
        .catch(() => '')
      return { file, priority: csvImportPriority(head.split('\n')[0]) }
    })
  )
  return ranked.sort((a, b) => a.priority - b.priority).map((entry) => entry.file)
}

import Papa from 'papaparse'

/**
 * Generate a CSV string from parallel arrays of start and end times.
 */
export function generateCodeCSV(startTimes: number[], endTimes: number[]): string {
  if (startTimes.length !== endTimes.length) {
    throw new Error(
      `generateCodeCSV: startTimes length (${startTimes.length}) !== endTimes length (${endTimes.length})`
    )
  }
  const rows = startTimes.map((start, i) => ({ start, end: endTimes[i] }))
  return Papa.unparse(rows)
}

/**
 * Trigger a browser file download with the given content.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

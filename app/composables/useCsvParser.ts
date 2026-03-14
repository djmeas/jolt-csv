import Papa from 'papaparse'

export interface CsvParseResult {
  headers: string[]
  rows: string[][]
  raw: string
}

export function useCsvParser() {
  function parseCsv(input: string): CsvParseResult | null {
    if (!input?.trim()) return null

    const result = Papa.parse<string[]>(input, {
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    })

    if (result.errors.length > 0 && result.data.length === 0) {
      return null
    }

    const rows = result.data
    if (rows.length === 0) return null

    const headers = rows[0] ?? []
    const dataRows = rows.slice(1)

    return {
      headers,
      rows: dataRows,
      raw: input
    }
  }

  return { parseCsv }
}

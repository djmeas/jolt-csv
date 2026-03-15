import * as XLSX from 'xlsx'
import type { CsvParseResult } from './useCsvParser'

export function useXlsxParser() {
  // Module-level workbook cache — persists for the lifetime of the composable call
  let _workbook: XLSX.WorkBook | null = null

  function loadWorkbook(buffer: ArrayBuffer): string[] {
    _workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
    return _workbook.SheetNames
  }

  function getSheetData(sheetName: string, firstRowIsHeader = true): CsvParseResult | null {
    if (!_workbook) return null

    const sheet = _workbook.Sheets[sheetName]
    if (!sheet) return null

    const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    if (data.length === 0) return null

    const stringifyRow = (row: unknown[]) =>
      row.map((cell) => String(cell ?? ''))

    if (firstRowIsHeader) {
      const headers = (data[0] as unknown[]).map((h) => String(h ?? '').trim())
      const rows = (data.slice(1) as unknown[][]).map(stringifyRow)
      return { headers, rows, raw: '' }
    }

    const rows = (data as unknown[][]).map(stringifyRow)
    const colCount = rows.length > 0
      ? Math.max(...rows.map((r) => r.length))
      : 0
    const headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`)
    return { headers, rows, raw: '' }
  }

  function exportToXlsx(
    headers: string[],
    rows: string[][],
    sheetName = 'Sheet1',
    filename = 'export.xlsx'
  ) {
    const aoa: string[][] = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearWorkbook() {
    _workbook = null
  }

  return { loadWorkbook, getSheetData, exportToXlsx, clearWorkbook }
}

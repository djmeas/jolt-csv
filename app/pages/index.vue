<script setup lang="ts">
import Papa from 'papaparse'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { CsvParseResult } from '~/composables/useCsvParser'

const { parseCsv } = useCsvParser()
const { loadWorkbook, getSheetData, exportToXlsx, clearWorkbook } = useXlsxParser()

const ROW_HEIGHT = 36
const HEADER_HEIGHT = 40

const pasteText = ref('')
const csvData = ref<CsvParseResult | null>(null)
const parseError = ref('')
const isDragging = ref(false)
const activeTab = ref<'paste' | 'upload'>('paste')

// File type and xlsx sheet state
const fileType = ref<'csv' | 'xlsx'>('csv')
const originalFilename = ref('export')
const activeSheetName = ref('')
const xlsxSheetNames = ref<string[]>([])
const showSheetPicker = ref(false)
const showHeaderDialog = ref(false)
const pendingSheetName = ref('')

// Filter state
type FilterMode = 'all' | 'any'
type FilterOperator = 'equals' | 'contains' | 'starts with' | 'ends with' | 'not equals' | 'is empty' | 'is not empty'

interface FilterCondition {
  columnIndex: number
  operator: FilterOperator
  value: string
}

const filterMode = ref<FilterMode>('all')
const filterConditions = ref<FilterCondition[]>([{ columnIndex: 0, operator: 'contains', value: '' }])

// Sort state
type SortDirection = 'asc' | 'desc'
const sortColumn = ref<number | null>(null)
const sortDirection = ref<SortDirection>('asc')

const showCellBorders = ref(true)
const editMode = ref(false)

const FILTER_OPERATORS: { value: FilterOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'starts with', label: 'starts with', needsValue: true },
  { value: 'ends with', label: 'ends with', needsValue: true },
  { value: 'not equals', label: 'not equals', needsValue: true },
  { value: 'is empty', label: 'is empty', needsValue: false },
  { value: 'is not empty', label: 'is not empty', needsValue: false }
]

function resetTableState() {
  filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
  sortColumn.value = null
  sortDirection.value = 'asc'
}

function handleParse() {
  parseError.value = ''
  csvData.value = null
  fileType.value = 'csv'
  originalFilename.value = 'export'
  activeSheetName.value = ''

  const text = pasteText.value.trim()
  if (!text) {
    parseError.value = 'Please paste or upload some CSV data.'
    return
  }

  const result = parseCsv(text)
  if (result) {
    csvData.value = result
    resetTableState()
  } else {
    parseError.value = 'Could not parse CSV. Check the format and try again.'
  }
}

function isXlsxFile(file: File): boolean {
  return (
    file.name.endsWith('.xlsx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

function isCsvOrTxtFile(file: File): boolean {
  return (
    file.name.endsWith('.csv') ||
    file.name.endsWith('.txt') ||
    file.type === 'text/csv' ||
    file.type === 'text/plain'
  )
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (isXlsxFile(file)) {
      readXlsxFile(file)
    } else {
      readCsvFile(file)
    }
  }
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  if (isXlsxFile(file)) {
    readXlsxFile(file)
  } else if (isCsvOrTxtFile(file)) {
    readCsvFile(file)
  } else {
    parseError.value = 'Please drop a CSV (.csv, .txt) or Excel (.xlsx) file.'
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function readCsvFile(file: File) {
  parseError.value = ''
  csvData.value = null
  fileType.value = 'csv'
  originalFilename.value = file.name.replace(/\.[^.]+$/, '')

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string) ?? ''
    pasteText.value = text
    const result = parseCsv(text)
    if (result) {
      csvData.value = result
      resetTableState()
    } else {
      parseError.value = 'Could not parse the file. It may not be valid CSV.'
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function readXlsxFile(file: File) {
  parseError.value = ''
  csvData.value = null
  fileType.value = 'xlsx'
  originalFilename.value = file.name.replace(/\.[^.]+$/, '')

  const reader = new FileReader()
  reader.onload = (e) => {
    const buffer = e.target?.result as ArrayBuffer
    if (!buffer) {
      parseError.value = 'Could not read the file.'
      return
    }

    try {
      const sheetNames = loadWorkbook(buffer)
      if (sheetNames.length === 0) {
        parseError.value = 'The Excel file contains no sheets.'
        return
      }

      if (sheetNames.length === 1) {
        loadSheet(sheetNames[0]!)
      } else {
        xlsxSheetNames.value = sheetNames
        showSheetPicker.value = true
      }
    } catch {
      parseError.value = 'Could not parse the Excel file. Make sure it is a valid .xlsx file.'
    }
  }
  reader.readAsArrayBuffer(file)
}

function loadSheet(sheetName: string) {
  showSheetPicker.value = false
  pendingSheetName.value = sheetName
  showHeaderDialog.value = true
}

function applySheetWithHeaderChoice(firstRowIsHeader: boolean) {
  const sheetName = pendingSheetName.value
  if (!sheetName) return

  const result = getSheetData(sheetName, firstRowIsHeader)
  if (result) {
    activeSheetName.value = sheetName
    csvData.value = result
    resetTableState()
  } else {
    parseError.value = `Could not parse sheet "${sheetName}".`
  }

  showHeaderDialog.value = false
  pendingSheetName.value = ''
}

function cancelHeaderDialog() {
  showHeaderDialog.value = false
  pendingSheetName.value = ''
  if (xlsxSheetNames.value.length > 1) {
    showSheetPicker.value = true
  } else {
    cancelSheetPicker()
  }
}

function cancelSheetPicker() {
  showSheetPicker.value = false
  xlsxSheetNames.value = []
  fileType.value = 'csv'
  clearWorkbook()
}

function clear() {
  pasteText.value = ''
  csvData.value = null
  parseError.value = ''
  filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
  sortColumn.value = null
  sortDirection.value = 'asc'
  editMode.value = false
  showExportDialog.value = false
  showSheetPicker.value = false
  showHeaderDialog.value = false
  pendingSheetName.value = ''
  xlsxSheetNames.value = []
  activeSheetName.value = ''
  fileType.value = 'csv'
  originalFilename.value = 'export'
  clearWorkbook()
}

function addFilterCondition() {
  const maxCol = csvData.value ? Math.max(0, csvData.value.headers.length - 1) : 0
  filterConditions.value.push({ columnIndex: maxCol, operator: 'contains', value: '' })
}

function removeFilterCondition(index: number) {
  filterConditions.value.splice(index, 1)
  if (filterConditions.value.length === 0) {
    filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
  }
}

function matchesCondition(row: string[], cond: FilterCondition): boolean {
  const cellValue = (row[cond.columnIndex] ?? '').trim().toLowerCase()
  const filterValue = cond.value.trim().toLowerCase()

  switch (cond.operator) {
    case 'equals':
      return cellValue === filterValue
    case 'contains':
      return cellValue.includes(filterValue)
    case 'starts with':
      return cellValue.startsWith(filterValue)
    case 'ends with':
      return cellValue.endsWith(filterValue)
    case 'not equals':
      return cellValue !== filterValue
    case 'is empty':
      return cellValue === ''
    case 'is not empty':
      return cellValue !== ''
    default:
      return true
  }
}

function rowMatchesFilters(row: string[]): boolean {
  const activeConditions = filterConditions.value.filter(
    (c) => c.operator === 'is empty' || c.operator === 'is not empty' || c.value.trim() !== ''
  )
  if (activeConditions.length === 0) return true

  if (filterMode.value === 'all') {
    return activeConditions.every((cond) => matchesCondition(row, cond))
  }
  return activeConditions.some((cond) => matchesCondition(row, cond))
}

const filteredRows = computed(() => {
  if (!csvData.value) return []
  const withIndex = csvData.value.rows
    .map((row, i) => ({ row, originalIndex: i }))
    .filter(({ row }) => rowMatchesFilters(row))
  if (sortColumn.value !== null) {
    const col = sortColumn.value
    const dir = sortDirection.value
    return [...withIndex].sort((a, b) => {
      const aVal = (a.row[col] ?? '').trim()
      const bVal = (b.row[col] ?? '').trim()
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
      return dir === 'asc' ? cmp : -cmp
    })
  }
  return withIndex
})

function handleHeaderClick(columnIndex: number) {
  if (sortColumn.value === columnIndex) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      sortColumn.value = null
      sortDirection.value = 'asc'
    }
  } else {
    sortColumn.value = columnIndex
    sortDirection.value = 'asc'
  }
}

function formatHeader(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const columnWidths = computed(() => {
  if (!csvData.value) return ''
  const { headers, rows } = csvData.value
  const colCount = headers.length
  const maxLen = new Array<number>(colCount).fill(0)

  headers.forEach((h, i) => {
    maxLen[i] = Math.max(maxLen[i] ?? 0, (h ?? '').length)
  })
  rows.forEach((row) => {
    for (let i = 0; i < colCount; i++) {
      maxLen[i] = Math.max(maxLen[i] ?? 0, (row[i] ?? '').length)
    }
  })

  const tracks = maxLen.map((len) => {
    const ch = Math.max(15, len + 2)
    return `minmax(120px, ${ch}ch)`
  })
  return tracks.join(' ')
})

const scrollRef = ref<HTMLElement | null>(null)
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: filteredRows.value.length,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    paddingStart: csvData.value ? HEADER_HEIGHT : 0
  }))
)

function paddedRow(row: string[]): string[] {
  if (!csvData.value) return row
  const len = csvData.value.headers.length
  const padded = [...row]
  while (padded.length < len) padded.push('')
  return padded.slice(0, len)
}

function updateHeader(colIndex: number, value: string) {
  if (csvData.value) {
    csvData.value.headers[colIndex] = value
  }
}

function updateCell(rowIndex: number, colIndex: number, value: string) {
  if (csvData.value) {
    const row = csvData.value.rows[rowIndex]
    if (row) {
      while (row.length <= colIndex) row.push('')
      row[colIndex] = value
    }
  }
}

const showExportDialog = ref(false)

const hasActiveFilters = computed(() => {
  if (!csvData.value) return false
  return filteredRows.value.length !== csvData.value.rows.length
})

const exportLabel = computed(() =>
  fileType.value === 'xlsx' ? 'Export XLSX' : 'Export CSV'
)

function doExport(rows: string[][]) {
  if (!csvData.value) return

  if (fileType.value === 'xlsx') {
    exportToXlsx(
      csvData.value.headers,
      rows,
      activeSheetName.value || 'Sheet1',
      `${originalFilename.value}.xlsx`
    )
  } else {
    const data = [csvData.value.headers, ...rows]
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${originalFilename.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}

function exportFile() {
  if (!csvData.value) return
  if (!hasActiveFilters.value) {
    doExport(csvData.value.rows)
    return
  }
  showExportDialog.value = true
}

function exportAllRows() {
  if (!csvData.value) return
  doExport(csvData.value.rows)
  showExportDialog.value = false
}

function exportFilteredRows() {
  doExport(filteredRows.value.map((f) => f.row))
  showExportDialog.value = false
}
</script>

<template>
  <div
    class="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col"
    :class="csvData ? 'h-screen overflow-hidden' : 'min-h-screen'"
  >
    <!-- Header -->
    <header class="shrink-0 border-b border-slate-800/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          type="button"
          class="text-lg font-semibold text-white hover:text-slate-200 transition-colors"
          @click="clear"
        >
          Jolt Sheets ⚡️
        </button>
      </div>
    </header>

    <!-- Input state: paste/upload form -->
    <main v-if="!csvData" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">
          CSV &amp; Excel Viewer
        </h1>
        <p class="mt-2 text-slate-400">
          Paste CSV data or upload a .csv or .xlsx file to get started.
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button
          type="button"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'paste'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          ]"
          @click="activeTab = 'paste'"
        >
          Paste
        </button>
        <button
          type="button"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          ]"
          @click="activeTab = 'upload'"
        >
          Upload
        </button>
      </div>

      <!-- Input area -->
      <div class="mb-8">
        <!-- Paste tab (CSV only) -->
        <div v-show="activeTab === 'paste'" class="space-y-4">
          <textarea
            v-model="pasteText"
            placeholder="Paste your CSV data here...

Example:
name,email,role
Alice,alice@example.com,admin
Bob,bob@example.com,user"
            rows="8"
            class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-y min-h-[200px]"
          />
          <div class="flex gap-3">
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
              @click="handleParse"
            >
              Parse CSV
            </button>
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
              @click="clear"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Upload tab (CSV + XLSX) -->
        <div v-show="activeTab === 'upload'" class="space-y-4">
          <div
            :class="[
              'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer',
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
            ]"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <input
              type="file"
              accept=".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @change="handleFileSelect"
            >
            <div class="p-12 text-center">
              <div class="inline-flex w-14 h-14 rounded-full bg-slate-700/50 items-center justify-center text-slate-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p class="text-white font-medium">
                Drop your file here
              </p>
              <p class="mt-1 text-sm text-slate-400">
                or click to browse
              </p>
              <p class="mt-2 text-xs text-slate-500">
                .csv, .txt, or .xlsx files
              </p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <p v-if="parseError" class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {{ parseError }}
        </p>
      </div>
    </main>

    <!-- Full-screen table when data is loaded -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <div class="shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-700/50 flex items-center justify-between gap-4 bg-slate-900/50">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-slate-300">
            {{ csvData.headers.length }} columns · {{ filteredRows.length }} rows
            <span v-if="filteredRows.length !== csvData.rows.length" class="text-slate-500">
              (of {{ csvData.rows.length }})
            </span>
            <span v-if="fileType === 'xlsx' && activeSheetName" class="text-slate-500">
              · sheet: {{ activeSheetName }}
            </span>
          </span>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <div class="relative w-10 h-6 rounded-full bg-slate-700 transition-colors has-[:checked]:bg-indigo-600">
              <input
                v-model="showCellBorders"
                type="checkbox"
                class="sr-only peer"
              >
              <span
                class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4"
                aria-hidden
              />
            </div>
            <span class="text-sm text-slate-400">Cell borders</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <div class="relative w-10 h-6 rounded-full bg-slate-700 transition-colors has-[:checked]:bg-indigo-600">
              <input
                v-model="editMode"
                type="checkbox"
                class="sr-only peer"
              >
              <span
                class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4"
                aria-hidden
              />
            </div>
            <span class="text-sm text-slate-400">Edit mode</span>
          </label>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button
            type="button"
            class="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
            @click="exportFile"
          >
            {{ exportLabel }}
          </button>
          <button
            type="button"
            class="text-sm text-slate-400 hover:text-white transition-colors"
            @click="clear"
          >
            Clear &amp; start over
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-700/50 bg-slate-800/30">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Filter
          </span>
          <div class="flex rounded-lg overflow-hidden border border-slate-600">
            <button
              type="button"
              :class="[
                'px-3 py-1.5 text-sm font-medium transition-colors',
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              ]"
              @click="filterMode = 'all'"
            >
              Match ALL
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-1.5 text-sm font-medium transition-colors',
                filterMode === 'any'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              ]"
              @click="filterMode = 'any'"
            >
              Match ANY
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div
              v-for="(cond, idx) in filterConditions"
              :key="idx"
              class="flex items-center gap-2 flex-wrap"
            >
              <select
                v-model.number="cond.columnIndex"
                class="px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option
                  v-for="(h, i) in csvData.headers"
                  :key="i"
                  :value="i"
                >
                  {{ h || `(empty ${i + 1})` }}
                </option>
              </select>
              <select
                v-model="cond.operator"
                class="px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option
                  v-for="op in FILTER_OPERATORS"
                  :key="op.value"
                  :value="op.value"
                >
                  {{ op.label }}
                </option>
              </select>
              <input
                v-if="FILTER_OPERATORS.find(o => o.value === cond.operator)?.needsValue"
                v-model="cond.value"
                type="text"
                placeholder="Value"
                class="px-2.5 py-1.5 rounded border border-slate-600 bg-slate-800 text-slate-200 text-sm placeholder-slate-500 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
              <button
                type="button"
                class="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                title="Remove condition"
                @click="removeFilterCondition(idx)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              class="px-2.5 py-1.5 rounded border border-dashed border-slate-600 text-slate-400 text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
              @click="addFilterCondition"
            >
              + Add condition
            </button>
          </div>
        </div>
      </div>

      <!-- Virtualized scroll container -->
      <div ref="scrollRef" class="csv-scroll">
        <div
          class="csv-grid"
          :class="{ 'csv-grid-borders': showCellBorders }"
          :style="{
            gridTemplateColumns: columnWidths,
            gridTemplateRows: `${HEADER_HEIGHT}px repeat(${filteredRows.length}, ${ROW_HEIGHT}px)`
          }"
        >
          <!-- Header cells -->
          <template v-for="(header, i) in csvData.headers" :key="`h-${i}`">
            <button
              v-if="!editMode"
              type="button"
              class="csv-th csv-th-sortable"
              @click="handleHeaderClick(i)"
            >
              <span>{{ formatHeader(header) || `(empty ${i + 1})` }}</span>
              <span
                v-if="sortColumn === i"
                class="csv-th-sort-icon"
                :aria-label="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
              >
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </button>
            <input
              v-else
              type="text"
              :value="formatHeader(header ?? '') || `(empty ${i + 1})`"
              class="csv-th csv-th-input"
              @input="updateHeader(i, ($event.target as HTMLInputElement).value)"
            >
          </template>

          <!-- Virtualized data cells -->
          <template v-for="virtualRow in rowVirtualizer.getVirtualItems()" :key="virtualRow.key">
            <template v-for="(cell, cellIndex) in paddedRow(filteredRows[virtualRow.index]!.row)" :key="`${virtualRow.key}-${cellIndex}`">
              <div
                v-if="!editMode"
                class="csv-td"
                :style="{ gridRow: virtualRow.index + 2 }"
              >
                {{ cell ?? '' }}
              </div>
              <input
                v-else
                type="text"
                :value="cell ?? ''"
                class="csv-td csv-td-input"
                :style="{ gridRow: virtualRow.index + 2 }"
                @input="updateCell(filteredRows[virtualRow.index]!.originalIndex, cellIndex, ($event.target as HTMLInputElement).value)"
              >
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Header row dialog (xlsx) -->
    <Teleport to="body">
      <div
        v-if="showHeaderDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="cancelHeaderDialog"
      >
        <div
          class="rounded-xl bg-slate-800 border border-slate-600 p-6 shadow-xl w-full max-w-sm mx-4"
          role="dialog"
          aria-labelledby="header-dialog-title"
          aria-modal="true"
        >
          <h2 id="header-dialog-title" class="text-lg font-semibold text-white mb-1">
            First Row
          </h2>
          <p class="text-slate-400 text-sm mb-5">
            Is the first row a header row (column names)?
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
              @click="applySheetWithHeaderChoice(true)"
            >
              Yes, it's a header
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 text-slate-200 font-medium hover:bg-slate-600 transition-colors"
              @click="applySheetWithHeaderChoice(false)"
            >
              No, it's data
            </button>
          </div>
          <button
            type="button"
            class="mt-4 w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
            @click="cancelHeaderDialog"
          >
            Cancel
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Sheet picker modal (xlsx with multiple sheets) -->
    <Teleport to="body">
      <div
        v-if="showSheetPicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="cancelSheetPicker"
      >
        <div
          class="rounded-xl bg-slate-800 border border-slate-600 p-6 shadow-xl w-full max-w-sm mx-4"
          role="dialog"
          aria-labelledby="sheet-picker-title"
          aria-modal="true"
        >
          <h2 id="sheet-picker-title" class="text-lg font-semibold text-white mb-1">
            Select a Sheet
          </h2>
          <p class="text-slate-400 text-sm mb-5">
            This workbook has {{ xlsxSheetNames.length }} sheets. Choose one to load.
          </p>
          <div class="flex flex-col gap-2 max-h-72 overflow-y-auto">
            <button
              v-for="name in xlsxSheetNames"
              :key="name"
              type="button"
              class="w-full text-left px-4 py-3 rounded-lg bg-slate-700/50 text-slate-200 text-sm font-medium hover:bg-indigo-600 hover:text-white transition-colors border border-slate-600 hover:border-indigo-500"
              @click="loadSheet(name)"
            >
              {{ name }}
            </button>
          </div>
          <button
            type="button"
            class="mt-4 w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
            @click="cancelSheetPicker"
          >
            Cancel
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Export dialog (when filters are active) -->
    <Teleport to="body">
      <div
        v-if="csvData && showExportDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showExportDialog = false"
      >
        <div
          class="rounded-xl bg-slate-800 border border-slate-600 p-6 shadow-xl max-w-sm mx-4"
          role="dialog"
          aria-labelledby="export-dialog-title"
          aria-modal="true"
        >
          <h2 id="export-dialog-title" class="text-lg font-semibold text-white mb-3">
            {{ exportLabel }}
          </h2>
          <p class="text-slate-400 text-sm mb-4">
            Would you like to export all rows or only filtered rows?
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
              @click="exportAllRows"
            >
              All rows
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 font-medium hover:bg-slate-600 transition-colors"
              @click="exportFilteredRows"
            >
              Filtered rows
            </button>
          </div>
          <button
            type="button"
            class="mt-4 w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
            @click="showExportDialog = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.csv-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.csv-grid {
  display: grid;
  min-width: max-content;
}

.csv-th {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 0.75rem 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgb(148 163 184);
  background: rgb(30 41 59);
  border-bottom: 1px solid rgb(51 65 85 / 0.5);
  white-space: nowrap;
}

.csv-th-sortable {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  border: none;
  text-align: left;
  width: 100%;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
}

.csv-th-sortable:hover {
  color: rgb(203 213 225);
}

.csv-th-sort-icon {
  color: rgb(129 140 248);
  font-size: 0.875rem;
}

.csv-td {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  color: rgb(203 213 225);
  white-space: nowrap;
  border-bottom: 1px solid rgb(51 65 85 / 0.3);
}

.csv-td-input,
.csv-th-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid rgb(51 65 85 / 0.3);
  outline: none;
  background: transparent;
}

.csv-td-input {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  white-space: nowrap;
  color: rgb(203 213 225);
  caret-color: rgb(203 213 225);
}

.csv-th-input {
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
  color: rgb(148 163 184);
  caret-color: rgb(148 163 184);
  background: rgb(30 41 59);
}

.csv-td-input:focus,
.csv-th-input:focus {
  outline: 1px solid rgb(99 102 241);
  outline-offset: -1px;
}

.csv-grid-borders {
  border-left: 1px solid rgb(51 65 85 / 0.5);
  border-top: 1px solid rgb(51 65 85 / 0.5);
}

.csv-grid-borders .csv-th {
  border-right: 1px solid rgb(51 65 85 / 0.6);
  border-bottom: 1px solid rgb(51 65 85 / 0.6);
}

.csv-grid-borders .csv-td {
  border-right: 1px solid rgb(51 65 85 / 0.4);
  border-bottom: 1px solid rgb(51 65 85 / 0.4);
}

.csv-grid-borders .csv-td-input {
  border-right: 1px solid rgb(51 65 85 / 0.4);
  border-bottom: 1px solid rgb(51 65 85 / 0.4);
}

.csv-grid-borders .csv-th-input {
  border-right: 1px solid rgb(51 65 85 / 0.6);
  border-bottom: 1px solid rgb(51 65 85 / 0.6);
}
</style>

<script setup lang="ts">
import type { CsvParseResult } from '~/composables/useCsvParser'

const { parseCsv } = useCsvParser()

const pasteText = ref('')
const csvData = ref<CsvParseResult | null>(null)
const parseError = ref('')
const isDragging = ref(false)
const activeTab = ref<'paste' | 'upload'>('paste')

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

const FILTER_OPERATORS: { value: FilterOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'starts with', label: 'starts with', needsValue: true },
  { value: 'ends with', label: 'ends with', needsValue: true },
  { value: 'not equals', label: 'not equals', needsValue: true },
  { value: 'is empty', label: 'is empty', needsValue: false },
  { value: 'is not empty', label: 'is not empty', needsValue: false }
]

function handleParse() {
  parseError.value = ''
  csvData.value = null

  const text = pasteText.value.trim()
  if (!text) {
    parseError.value = 'Please paste or upload some CSV data.'
    return
  }

  const result = parseCsv(text)
  if (result) {
    csvData.value = result
    filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
  } else {
    parseError.value = 'Could not parse CSV. Check the format and try again.'
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) readFile(file)
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file && (file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'text/plain')) {
    readFile(file)
  } else {
    parseError.value = 'Please drop a CSV file (.csv or .txt).'
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function readFile(file: File) {
  parseError.value = ''
  csvData.value = null

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string) ?? ''
    pasteText.value = text
    const result = parseCsv(text)
    if (result) {
      csvData.value = result
      filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
    } else {
      parseError.value = 'Could not parse the file. It may not be valid CSV.'
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function clear() {
  pasteText.value = ''
  csvData.value = null
  parseError.value = ''
  filterConditions.value = [{ columnIndex: 0, operator: 'contains', value: '' }]
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
  return csvData.value.rows.filter((row) => rowMatchesFilters(row))
})

function paddedRow(row: string[]): string[] {
  if (!csvData.value) return row
  const len = csvData.value.headers.length
  const padded = [...row]
  while (padded.length < len) padded.push('')
  return padded.slice(0, len)
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
        <NuxtLink to="/" class="text-lg font-semibold text-white hover:text-slate-200 transition-colors">
          ← Jolt CSV
        </NuxtLink>
      </div>
    </header>

    <!-- Input state: paste/upload form -->
    <main v-if="!csvData" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">
          CSV Viewer
        </h1>
        <p class="mt-2 text-slate-400">
          Paste your CSV data or upload a file to get started.
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
        <!-- Paste tab -->
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
              @click="handleParse"
              class="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
            >
              Parse CSV
            </button>
            <button
              type="button"
              @click="clear"
              class="px-6 py-2.5 rounded-lg bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Upload tab -->
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
              accept=".csv,.txt,text/csv,text/plain"
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
                Drop your CSV file here
              </p>
              <p class="mt-1 text-sm text-slate-400">
                or click to browse
              </p>
              <p class="mt-2 text-xs text-slate-500">
                .csv or .txt files
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

    <!-- Full-screen table when CSV is loaded -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <div class="shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
        <span class="text-sm font-medium text-slate-300">
          {{ csvData.headers.length }} columns · {{ filteredRows.length }} rows
          <span v-if="filteredRows.length !== csvData.rows.length" class="text-slate-500">
            (of {{ csvData.rows.length }})
          </span>
        </span>
        <button
          type="button"
          @click="clear"
          class="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Clear & start over
        </button>
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
                @click="removeFilterCondition(idx)"
                class="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                title="Remove condition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              @click="addFilterCondition"
              class="px-2.5 py-1.5 rounded border border-dashed border-slate-600 text-slate-400 text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
            >
              + Add condition
            </button>
          </div>
        </div>
      </div>

      <!-- Single scroll container; grid inside has no overflow so sticky works -->
      <div class="csv-scroll">
        <div
          class="csv-grid"
          :style="{ gridTemplateColumns: `repeat(${csvData.headers.length}, minmax(120px, auto))` }"
        >
          <div
            v-for="(header, i) in csvData.headers"
            :key="`h-${i}`"
            class="csv-th"
          >
            {{ header || `(empty ${i + 1})` }}
          </div>
          <template v-for="(row, rowIndex) in filteredRows" :key="rowIndex">
            <div
              v-for="(cell, cellIndex) in paddedRow(row)"
              :key="`${rowIndex}-${cellIndex}`"
              class="csv-td"
            >
              {{ cell ?? '' }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  The scroll container handles ALL overflow (both x and y).
  The grid inside has NO overflow set, so position:sticky on
  the header cells has a valid scroll ancestor to stick within.
*/
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
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(148 163 184);
  background: rgb(30 41 59);
  border-bottom: 1px solid rgb(51 65 85 / 0.5);
  white-space: nowrap;
}

.csv-td {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  color: rgb(203 213 225);
  white-space: nowrap;
  border-bottom: 1px solid rgb(51 65 85 / 0.3);
}
</style>

const STORAGE_KEY = 'jolt-theme'

export function useTheme() {
  const isDark = useState<boolean>('theme-dark', () => true)

  function applyTheme(dark: boolean) {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
    }
  }

  function toggle() {
    isDark.value = !isDark.value
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
      applyTheme(isDark.value)
    }
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      isDark.value = stored === 'dark'
    }
    applyTheme(isDark.value)
  })

  return { isDark, toggle }
}

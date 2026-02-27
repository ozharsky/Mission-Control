// Theme Manager
// Handles dark/light mode with manual toggle

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme()
    this.applyTheme(this.currentTheme)
    this.setupListeners()
  }
  
  // Get theme from localStorage
  getStoredTheme() {
    return localStorage.getItem('mc-theme')
  }
  
  // Get system preference
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light'
  }
  
  // Apply theme to document
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff'
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }
  
  // Set theme manually
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light' && theme !== 'system') {
      console.error('Invalid theme:', theme)
      return
    }
    
    this.currentTheme = theme
    
    if (theme === 'system') {
      localStorage.removeItem('mc-theme')
      this.applyTheme(this.getSystemTheme())
    } else {
      localStorage.setItem('mc-theme', theme)
      this.applyTheme(theme)
    }
  }
  
  // Toggle between dark/light
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
    return newTheme
  }
  
  // Get current theme
  getTheme() {
    return this.currentTheme
  }
  
  // Check if dark mode
  isDark() {
    return this.currentTheme === 'dark' || 
      (this.currentTheme === 'system' && this.getSystemTheme() === 'dark')
  }
  
  // Setup system preference listener
  setupListeners() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'system' || !this.getStoredTheme()) {
        this.applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  }
  
  // Create theme toggle button
  createToggleButton() {
    const btn = document.createElement('button')
    btn.className = 'theme-toggle-btn'
    btn.setAttribute('aria-label', 'Toggle theme')
    btn.innerHTML = this.isDark() ? '☀️' : '🌙'
    
    btn.addEventListener('click', () => {
      const newTheme = this.toggle()
      btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙'
    })
    
    // Listen for theme changes
    window.addEventListener('themechange', (e) => {
      btn.innerHTML = e.detail.theme === 'dark' ? '☀️' : '🌙'
    })
    
    return btn
  }
  
  // Create theme selector
  createThemeSelector() {
    const container = document.createElement('div')
    container.className = 'theme-selector'
    
    const themes = [
      { value: 'light', label: '☀️ Light', icon: '☀️' },
      { value: 'dark', label: '🌙 Dark', icon: '🌙' },
      { value: 'system', label: '💻 System', icon: '💻' }
    ]
    
    themes.forEach(theme => {
      const btn = document.createElement('button')
      btn.className = `theme-option ${this.currentTheme === theme.value ? 'active' : ''}`
      btn.innerHTML = `${theme.icon} ${theme.label}`
      btn.onclick = () => {
        this.setTheme(theme.value)
        container.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      }
      container.appendChild(btn)
    })
    
    return container
  }
}

// Create singleton instance
export const themeManager = new ThemeManager()

// Export for use in components
export const { setTheme, toggle, getTheme, isDark, createToggleButton, createThemeSelector } = themeManager

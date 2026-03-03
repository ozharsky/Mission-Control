// Custom Theme Manager
// Allows users to customize accent colors and create themes

import { themeManager } from './themeManager.js'

class CustomThemeManager {
  constructor() {
    this.themes = this.loadThemes()
    this.currentCustomTheme = localStorage.getItem('mc-custom-theme')
  }
  
  // Default themes
  get defaultThemes() {
    return {
      indigo: {
        name: 'Indigo',
        colors: {
          primary: '#6366f1',
          primaryLight: '#818cf8',
          primaryDark: '#4f46e5',
          accent: '#8b5cf6'
        }
      },
      emerald: {
        name: 'Emerald',
        colors: {
          primary: '#10b981',
          primaryLight: '#34d399',
          primaryDark: '#059669',
          accent: '#14b8a6'
        }
      },
      rose: {
        name: 'Rose',
        colors: {
          primary: '#f43f5e',
          primaryLight: '#fb7185',
          primaryDark: '#e11d48',
          accent: '#ec4899'
        }
      },
      amber: {
        name: 'Amber',
        colors: {
          primary: '#f59e0b',
          primaryLight: '#fbbf24',
          primaryDark: '#d97706',
          accent: '#f97316'
        }
      },
      cyan: {
        name: 'Cyan',
        colors: {
          primary: '#06b6d4',
          primaryLight: '#22d3ee',
          primaryDark: '#0891b2',
          accent: '#0ea5e9'
        }
      },
      violet: {
        name: 'Violet',
        colors: {
          primary: '#8b5cf6',
          primaryLight: '#a78bfa',
          primaryDark: '#7c3aed',
          accent: '#6366f1'
        }
      }
    }
  }
  
  // Load custom themes from storage
  loadThemes() {
    try {
      return JSON.parse(localStorage.getItem('mc-themes') || '{}')
    } catch {
      return {}
    }
  }
  
  // Save themes to storage
  saveThemes() {
    localStorage.setItem('mc-themes', JSON.stringify(this.themes))
  }
  
  // Apply a theme
  applyTheme(themeId) {
    const theme = this.defaultThemes[themeId] || this.themes[themeId]
    if (!theme) return false
    
    const root = document.documentElement
    
    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    
    // Update accent-primary
    root.style.setProperty('--accent-primary', theme.colors.primary)
    root.style.setProperty('--accent-secondary', theme.colors.accent)
    
    this.currentCustomTheme = themeId
    localStorage.setItem('mc-custom-theme', themeId)
    
    return true
  }
  
  // Create custom theme
  createTheme(name, colors) {
    const id = `custom-${Date.now()}`
    this.themes[id] = {
      name,
      colors,
      isCustom: true
    }
    this.saveThemes()
    return id
  }
  
  // Update custom theme
  updateTheme(themeId, updates) {
    if (!this.themes[themeId]) return false
    
    this.themes[themeId] = {
      ...this.themes[themeId],
      ...updates
    }
    this.saveThemes()
    
    if (this.currentCustomTheme === themeId) {
      this.applyTheme(themeId)
    }
    
    return true
  }
  
  // Delete custom theme
  deleteTheme(themeId) {
    if (!this.themes[themeId]?.isCustom) return false
    
    delete this.themes[themeId]
    this.saveThemes()
    
    if (this.currentCustomTheme === themeId) {
      this.applyTheme('indigo')
    }
    
    return true
  }
  
  // Get all available themes
  getAllThemes() {
    return {
      ...this.defaultThemes,
      ...this.themes
    }
  }
  
  // Create theme picker UI
  createThemePicker() {
    const container = document.createElement('div')
    container.className = 'theme-picker'
    
    const themes = this.getAllThemes()
    
    Object.entries(themes).forEach(([id, theme]) => {
      const btn = document.createElement('button')
      btn.className = `theme-option ${this.currentCustomTheme === id ? 'active' : ''}`
      btn.innerHTML = `
        <div class="theme-preview" style="background: ${theme.colors.primary}"></div>
        <span>${theme.name}</span>
        ${theme.isCustom ? '<button class="delete-theme m-touch">✕</button>' : ''}
      `
      
      btn.onclick = (e) => {
        if (e.target.classList.contains('delete-theme')) {
          e.stopPropagation()
          if (confirm(`Delete "${theme.name}" theme?`)) {
            this.deleteTheme(id)
            btn.remove()
          }
          return
        }
        
        this.applyTheme(id)
        container.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      }
      
      container.appendChild(btn)
    })
    
    // Add "Create Custom" button
    const createBtn = document.createElement('button')
    createBtn.className = 'theme-option create-theme m-touch'
    createBtn.innerHTML = '<span data-lucide="plus" class="lucide-icon" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;"></span> Create Custom'
    createBtn.onclick = () => this.showCreateThemeModal()
    container.appendChild(createBtn)
    
    return container
  }
  
  // Show create theme modal
  showCreateThemeModal() {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <div class="modal-title"><span data-lucide="palette" class="lucide-icon" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;"></span> Create Custom Theme</div>
          <button class="modal-close m-touch" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <form class="modal-body" onsubmit="return false">
          <div class="form-group">
            <label>Theme Name</label>
            <input type="text" id="theme-name" placeholder="My Theme" required>
          </div>
          
          <div class="form-group">
            <label>Primary Color</label>
            <input type="color" id="theme-primary" value="#6366f1">
          </div>
          
          <div class="form-group">
            <label>Accent Color</label>
            <input type="color" id="theme-accent" value="#8b5cf6">
          </div>
          
          <div class="form-group">
            <label>Preview</label>
            <div class="theme-preview-box" id="theme-preview"
                 style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <button class="btn btn-primary" style="margin-right: 0.5rem;">Primary</button>
              <button class="btn btn-secondary">Secondary</button>
            </div>
          </div>
        </form>
        
        <div class="modal-footer">
          <button class="btn btn-secondary m-touch" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary m-touch" id="save-theme">Save Theme</button>
        </div>
      </div>
    `
    
    // Live preview
    const updatePreview = () => {
      const primary = modal.querySelector('#theme-primary').value
      const accent = modal.querySelector('#theme-accent').value
      const preview = modal.querySelector('#theme-preview')
      preview.querySelector('.btn-primary').style.background = primary
      preview.querySelector('.btn-secondary').style.background = accent
    }
    
    modal.querySelector('#theme-primary').oninput = updatePreview
    modal.querySelector('#theme-accent').oninput = updatePreview
    
    // Save
    modal.querySelector('#save-theme').onclick = () => {
      const name = modal.querySelector('#theme-name').value
      const primary = modal.querySelector('#theme-primary').value
      const accent = modal.querySelector('#theme-accent').value
      
      if (!name) return
      
      this.createTheme(name, {
        primary,
        primaryLight: this.lighten(primary, 20),
        primaryDark: this.darken(primary, 20),
        accent
      })
      
      modal.remove()
      
      // Refresh picker if exists
      const picker = document.querySelector('.theme-picker')
      if (picker) {
        picker.replaceWith(this.createThemePicker())
      }
    }
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove()
    }
    
    document.body.appendChild(modal)
  }
  
  // Helper: lighten color
  lighten(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }
  
  // Helper: darken color
  darken(color, percent) {
    return this.lighten(color, -percent)
  }
}

export const customThemeManager = new CustomThemeManager()
export default customThemeManager

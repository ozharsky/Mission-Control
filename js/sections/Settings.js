import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { themeManager } from '../utils/themeManager.js'
import { customThemeManager } from '../utils/customThemes.js'
import { analytics } from '../utils/analytics.js'
import { isFirebaseConfigured, isGitHubConfigured, isPrinterConfigured, saveFirebaseConfig, saveGitHubConfig, savePrinterConfig, testFirebaseConnection, testGitHubConnection, testPrinterConnection } from '../config.js'

let activeSection = 'general'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'backup', label: 'Backup', icon: '💾' },
  { id: 'data', label: 'Data', icon: '📊' }
]

export function createSettingsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function getStats() {
    const state = store.getState()
    const priorities = state.priorities || []
    const projects = state.projects || []
    const notes = state.notes || []

    const completed = priorities.filter(p => p.completed).length
    const total = priorities.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      completed,
      total,
      completionRate,
      projectCount: projects.length,
      noteCount: notes.length
    }
  }

  function render() {
    const stats = getStats()
    const lastBackup = localStorage.getItem('mc_last_backup')

    container.innerHTML = `
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">⚙️ Settings</div>
          <div class="welcome-status">
            <span class="status-badge">Mission Control v4</span>
          </div>
        </div>
      </div>

      <div class="settings-layout">
        <div class="settings-nav">
          ${SETTINGS_SECTIONS.map(section => `
            <button class="settings-nav-item ${activeSection === section.id ? 'active' : ''}"
              onclick="window.setSettingsSection('${section.id}')"
            >
              <span class="nav-icon">${section.icon}</span>
              <span class="nav-label">${section.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="settings-content">
          ${renderActiveSection(stats, lastBackup)}
        </div>
      </div>
    `
  }

  function renderActiveSection(stats, lastBackup) {
    switch (activeSection) {
      case 'general': return renderGeneralSettings(stats)
      case 'appearance': return renderAppearanceSettings()
      case 'notifications': return renderNotificationSettings()
      case 'integrations': return renderIntegrationsSettings()
      case 'backup': return renderBackupSettings(lastBackup)
      case 'data': return renderDataSettings()
      default: return renderGeneralSettings(stats)
    }
  }

  function renderGeneralSettings(stats) {
    const ordersTarget = store.get('ordersTarget') || 150
    const revenueGoal = store.get('revenueGoal') || 5400

    return `
      <div class="settings-group">
        <div class="settings-group-title">📈 Your Stats</div>

        <div class="metrics-grid settings-metrics">
          <div class="metric-card">
            <div class="metric-value">${stats.completed}</div>
            <div class="metric-label">Completed</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">${stats.completionRate}%</div>
            <div class="metric-label">Completion Rate</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">${stats.projectCount}</div>
            <div class="metric-label">Projects</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">${stats.noteCount}</div>
            <div class="metric-label">Notes</div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🎯 Goals</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Monthly Order Target</div>
            <div class="setting-desc">Target number of orders per month</div>
          </div>

          <input type="number"
            class="form-input"
            value="${ordersTarget}"
            onchange="window.updateOrderTarget(this.value)"
            style="width: 100px;"
            min="1"
            max="10000"
          >
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Revenue Goal</div>
            <div class="setting-desc">Monthly revenue target ($)</div>
          </div>

          <input type="number"
            class="form-input"
            value="${revenueGoal}"
            onchange="window.updateRevenueGoal(this.value)"
            style="width: 120px;"
            min="0"
            max="1000000"
            step="100"
          >
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">⌨️ Keyboard Shortcuts</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Press ? for help</div>
            <div class="setting-desc">Show all keyboard shortcuts</div>
          </div>

          <button class="btn btn-secondary" onclick="window.showShortcutsHelp()">
            Show Shortcuts
          </button>
        </div>
      </div>
    `
  }

  function renderAppearanceSettings() {
    const currentTheme = themeManager.getTheme()
    const isCompact = document.body.classList.contains('compact-mode')

    return `
      <div class="settings-group">
        <div class="settings-group-title">🎨 Theme</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Color Scheme</div>
            <div class="setting-desc">Choose light or dark mode</div>
          </div>

          <div class="theme-selector">
            <button class="theme-option ${currentTheme === 'light' ? 'active' : ''}"
              onclick="window.setTheme('light')"
            >☀️ Light</button>
            <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''}"
              onclick="window.setTheme('dark')"
            >🌙 Dark</button>
            <button class="theme-option ${currentTheme === 'system' ? 'active' : ''}"
              onclick="window.setTheme('system')"
            >💻 System</button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Compact Mode</div>
            <div class="setting-desc">Reduce padding for denser layout</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${isCompact ? 'checked' : ''}
              onchange="window.toggleCompactMode(this.checked)"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🎨 Accent Color</div>
        <div class="theme-picker">
          ${renderThemePicker()}
        </div>
      </div>
    `
  }

  function renderThemePicker() {
    const themes = customThemeManager.getAllThemes()
    const current = customThemeManager.currentCustomTheme || 'indigo'

    return Object.entries(themes).map(([id, theme]) => `
      <button class="theme-option ${current === id ? 'active' : ''}"
        onclick="window.setAccentTheme('${id}')"
        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-secondary); cursor: pointer;"
      >
        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${theme.colors.primary};"></div>
        <span>${theme.name}</span>
      </button>
    `).join('')
  }

  function renderNotificationSettings() {
    const notificationsEnabled = localStorage.getItem('mc_notifications') === 'true'
    const dueReminders = localStorage.getItem('mc_due_reminders') !== 'false'

    return `
      <div class="settings-group">
        <div class="settings-group-title">🔔 Notifications</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Enable Notifications</div>
            <div class="setting-desc">Receive browser notifications</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${notificationsEnabled ? 'checked' : ''}
              onchange="window.toggleNotifications(this.checked)"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Due Date Reminders</div>
            <div class="setting-desc">Notify when tasks are due within 24 hours</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${dueReminders ? 'checked' : ''}
              onchange="window.toggleDueReminders(this.checked)"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `
  }

  function renderIntegrationsSettings() {
    const fbUrl = localStorage.getItem('mc_firebase_url') || ''
    const fbSecret = localStorage.getItem('mc_firebase_secret') || ''
    const ghToken = localStorage.getItem('mc_github_token') || ''
    const ghGistId = localStorage.getItem('mc_gist_id') || ''
    const printerProxy = localStorage.getItem('mc_printer_proxy') || ''

    return `
      <div class="settings-group">
        <div class="settings-group-title">🔥 Firebase Sync</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Database URL</div>
            <div class="setting-desc">Your Firebase Realtime Database URL</div>
          </div>
          <input type="text" class="form-input" id="fbUrl" value="${fbUrl}" placeholder="https://your-project.firebaseio.com/">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Database Secret</div>
            <div class="setting-desc">Found in Firebase Console → Project Settings → Database Secrets</div>
          </div>
          <input type="password" class="form-input" id="fbSecret" value="${fbSecret}" placeholder="Your Firebase secret">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Status</div>
            <div class="setting-desc">${isFirebaseConfigured() ? '✅ Configured' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="testFirebase()">Test</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🐙 GitHub Backup</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">GitHub Token</div>
            <div class="setting-desc">Personal access token with 'gist' scope</div>
          </div>
          <input type="password" class="form-input" id="ghToken" value="${ghToken}" placeholder="ghp_...">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Gist ID</div>
            <div class="setting-desc">ID of a secret gist for data storage</div>
          </div>
          <input type="text" class="form-input" id="ghGistId" value="${ghGistId}" placeholder="Gist ID">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Status</div>
            <div class="setting-desc">${isGitHubConfigured() ? '✅ Configured' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="testGitHub()">Test</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🖨️ SimplyPrint</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Proxy URL</div>
            <div class="setting-desc">Your Vercel proxy URL for SimplyPrint API</div>
          </div>
          <input type="text" class="form-input" id="printerProxy" value="${printerProxy}" placeholder="https://your-app.vercel.app/api/printers">
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Status</div>
            <div class="setting-desc">${isPrinterConfigured() ? '✅ Configured' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="testPrinter()">Test</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="backup-actions" style="display: flex; gap: 1rem;">
          <button class="btn btn-primary" onclick="saveIntegrations()">💾 Save All</button>
        </div>
      </div>
    `
  }

  function renderBackupSettings(lastBackup) {
    const autoBackup = localStorage.getItem('mc_auto_backup') !== 'false'

    return `
      <div class="settings-group">
        <div class="settings-group-title">💾 Backup</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Auto Backup</div>
            <div class="setting-desc">Automatically backup data</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${autoBackup ? 'checked' : ''}
              onchange="window.toggleAutoBackup(this.checked)"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>

        ${lastBackup ? `
          <div class="backup-info" style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius); margin-bottom: 1rem;">
            <span>🕐 Last backup: ${formatDate(lastBackup)}</span>
          </div>
        ` : ''}

        <div class="backup-actions" style="display: flex; gap: 1rem;">
          <button class="btn btn-primary" onclick="window.backupNow()">
            💾 Backup Now
          </button>

          <button class="btn btn-secondary" onclick="window.restoreFromBackup()">
            📤 Restore
          </button>
        </div>
      </div>
    `
  }

  function renderDataSettings() {
    return `
      <div class="settings-group">
        <div class="settings-group-title">📊 Data Management</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Export Data</div>
            <div class="setting-desc">Download all your data as JSON</div>
          </div>

          <button class="btn btn-primary" onclick="window.exportData()">
            📥 Export
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Import Data</div>
            <div class="setting-desc">Restore from a backup file</div>
          </div>

          <button class="btn btn-secondary" onclick="window.importData()">
            📤 Import
          </button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title" style="color: var(--accent-danger);">⚠️ Danger Zone</div>

        <div class="danger-zone" style="border: 1px solid var(--accent-danger); border-radius: var(--radius); padding: 1rem;">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label" style="color: var(--accent-danger);">Clear All Data</div>
              <div class="setting-desc">Permanently delete everything. Cannot be undone.</div>
            </div>

            <button class="btn btn-danger" onclick="window.clearAllData()">
              Clear Data
            </button>
          </div>
        </div>
      </div>
    `
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  // Global functions
  window.setSettingsSection = (section) => {
    activeSection = section
    render()
  }

  window.setTheme = (theme) => {
    themeManager.setTheme(theme)
    toast.success('Theme updated')
    render()
  }

  window.setAccentTheme = (themeId) => {
    customThemeManager.applyTheme(themeId)
    toast.success('Accent color updated')
    render()
  }

  window.toggleCompactMode = (enabled) => {
    document.body.classList.toggle('compact-mode', enabled)
    localStorage.setItem('mc_compact_mode', enabled)
    toast.success(enabled ? 'Compact mode enabled' : 'Compact mode disabled')
  }

  window.updateOrderTarget = (value) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 1) {
      toast.error('Invalid value')
      return
    }
    store.set('ordersTarget', num)
    toast.success('Order target updated')
  }

  window.updateRevenueGoal = (value) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 0) {
      toast.error('Invalid value')
      return
    }
    store.set('revenueGoal', num)
    toast.success('Revenue goal updated')
  }

  window.toggleNotifications = (enabled) => {
    localStorage.setItem('mc_notifications', enabled)
    if (enabled && 'Notification' in window) {
      Notification.requestPermission()
    }
    toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled')
  }

  window.toggleDueReminders = (enabled) => {
    localStorage.setItem('mc_due_reminders', enabled)
    toast.success(enabled ? 'Due reminders enabled' : 'Due reminders disabled')
  }

  window.toggleAutoBackup = (enabled) => {
    localStorage.setItem('mc_auto_backup', enabled)
    toast.success(enabled ? 'Auto-backup enabled' : 'Auto-backup disabled')
  }

  window.backupNow = () => {
    const data = store.getState()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    localStorage.setItem('mc_last_backup', new Date().toISOString())
    toast.success('Backup downloaded')
    render()
  }

  window.restoreFromBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (confirm('Restore from backup? This will replace current data.')) {
            Object.keys(data).forEach(key => {
              store.set(key, data[key])
            })
            toast.success('Data restored')
            render()
          }
        } catch (err) {
          toast.error('Invalid backup file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  window.showShortcutsHelp = () => {
    if (window.createShortcutsHelp) {
      window.createShortcutsHelp()
    } else {
      toast.info('Press ? to show keyboard shortcuts')
    }
  }

  window.exportData = () => {
    const data = JSON.stringify(store.getState(), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  window.importData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (confirm(`Import ${Object.keys(data).length} data types?`)) {
            Object.keys(data).forEach(key => {
              store.set(key, data[key])
            })
            toast.success('Data imported')
            render()
          }
        } catch (err) {
          toast.error('Import failed')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  window.clearAllData = () => {
    // Auto-export first
    const data = store.getState()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-BACKUP-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    if (confirm('⚠️ WARNING: This will delete ALL data.\n\nA backup has been downloaded.\n\nContinue?')) {
      if (prompt('Type DELETE to confirm:') === 'DELETE') {
        localStorage.clear()
        toast.success('All data cleared')
        setTimeout(() => location.reload(), 1500)
      }
    }
  }

  // Integration test functions
  window.testFirebase = async () => {
    const result = await testFirebaseConnection()
    if (result.success) {
      toast.success('Firebase connection successful!')
    } else {
      toast.error('Firebase connection failed: ' + result.error)
    }
  }

  window.testGitHub = async () => {
    const result = await testGitHubConnection()
    if (result.success) {
      toast.success('GitHub connection successful!')
    } else {
      toast.error('GitHub connection failed: ' + result.error)
    }
  }

  window.testPrinter = async () => {
    const result = await testPrinterConnection()
    if (result.success) {
      toast.success('Printer API connection successful!')
    } else {
      toast.error('Printer API connection failed: ' + result.error)
    }
  }

  window.saveIntegrations = () => {
    const fbUrl = document.getElementById('fbUrl')?.value.trim()
    const fbSecret = document.getElementById('fbSecret')?.value.trim()
    const ghToken = document.getElementById('ghToken')?.value.trim()
    const ghGistId = document.getElementById('ghGistId')?.value.trim()
    const printerProxy = document.getElementById('printerProxy')?.value.trim()

    if (fbUrl && fbSecret) saveFirebaseConfig(fbUrl, fbSecret)
    if (ghToken && ghGistId) saveGitHubConfig(ghToken, ghGistId)
    if (printerProxy) savePrinterConfig(printerProxy)

    toast.success('Integrations saved!')
    render()
  }

  // Load preferences
  function loadPreferences() {
    const compact = localStorage.getItem('mc_compact_mode') === 'true'
    if (compact) document.body.classList.add('compact-mode')
  }

  store.subscribe(() => render())
  loadPreferences()
  render()

  return { render }
}

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { themeManager } from '../utils/themeManager.js'
import { customThemeManager } from '../utils/customThemes.js'
import { isFirebaseConfigured, isGitHubConfigured, isPrinterConfigured, saveFirebaseConfig, saveGitHubConfig, savePrinterConfig, testFirebaseConnection, testGitHubConnection, testPrinterConnection } from '../config.js'
import { syncStorage } from '../storage/sync.js'

let activeSection = 'general'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'data', label: 'Data & Backup', icon: '💾' }
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
      projectCount: Array.isArray(projects) ? projects.length : Object.values(projects).flat().length,
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
            <span class="status-badge">Mission Control v5</span>
          </div>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Mobile Tab Navigation -->
        <div class="settings-nav-mobile">
          <select class="settings-mobile-select" onchange="window.setSettingsSection(this.value)">
            ${SETTINGS_SECTIONS.map(section => `
              <option value="${section.id}" ${activeSection === section.id ? 'selected' : ''}>
                ${section.icon} ${section.label}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Desktop Sidebar Navigation -->
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
      case 'data': return renderDataSettings(lastBackup)
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
    const reduceMotion = localStorage.getItem('mc_reduce_motion') === 'true'

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

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Reduce Motion</div>
            <div class="setting-desc">Minimize animations for accessibility</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${reduceMotion ? 'checked' : ''}
              onchange="window.toggleReduceMotion(this.checked)"
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
    const emailAlerts = localStorage.getItem('mc_email_alerts') === 'true'

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

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Email Alerts</div>
            <div class="setting-desc">Send critical alerts via email (requires configuration)</div>
          </div>

          <label class="toggle-switch">
            <input type="checkbox"
              ${emailAlerts ? 'checked' : ''}
              onchange="window.toggleEmailAlerts(this.checked)"
            >
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `
  }

  function renderIntegrationsSettings() {
    // Load all Firebase config values
    const fbApiKey = localStorage.getItem('mc_firebase_api_key') || ''
    const fbAuthDomain = localStorage.getItem('mc_firebase_auth_domain') || ''
    const fbUrl = localStorage.getItem('mc_firebase_url') || ''
    const fbProjectId = localStorage.getItem('mc_firebase_project_id') || ''
    const fbStorageBucket = localStorage.getItem('mc_firebase_storage_bucket') || ''
    const fbMessagingSenderId = localStorage.getItem('mc_firebase_messaging_sender_id') || ''
    const fbAppId = localStorage.getItem('mc_firebase_app_id') || ''
    const fbSecret = localStorage.getItem('mc_firebase_secret') || ''
    
    // GitHub config
    const ghToken = localStorage.getItem('mc_github_token') || ''
    const ghGistId = localStorage.getItem('mc_gist_id') || ''
    
    // Printer config
    const printerProxy = localStorage.getItem('mc_printer_proxy') || ''

    const firebaseConnected = isFirebaseConfigured()
    const githubConnected = isGitHubConfigured()
    const printerConnected = isPrinterConfigured()

    return `
      <div class="settings-group">
        <div class="settings-group-title">🔥 Firebase Configuration</div>
        <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
          Required for real-time sync, file storage, and cloud backup. 
          <a href="https://console.firebase.google.com" target="_blank" style="color: var(--accent-primary);">Get config from Firebase Console →</a>
        </p>
        
        <div class="form-group">
          <label class="form-label">API Key *</label>
          <input type="text" class="form-input" id="fbApiKey" value="${fbApiKey}" placeholder="AIzaSy...">
        </div>
        
        <div class="form-group">
          <label class="form-label">Auth Domain *</label>
          <input type="text" class="form-input" id="fbAuthDomain" value="${fbAuthDomain}" placeholder="your-project.firebaseapp.com">
        </div>
        
        <div class="form-group">
          <label class="form-label">Database URL *</label>
          <input type="text" class="form-input" id="fbUrl" value="${fbUrl}" placeholder="https://your-project-default-rtdb.firebaseio.com/">
        </div>
        
        <div class="form-group">
          <label class="form-label">Project ID *</label>
          <input type="text" class="form-input" id="fbProjectId" value="${fbProjectId}" placeholder="your-project-id">
        </div>
        
        <div class="form-group">
          <label class="form-label">Storage Bucket *</label>
          <input type="text" class="form-input" id="fbStorageBucket" value="${fbStorageBucket}" placeholder="your-project.appspot.com">
        </div>
        
        <div class="form-group">
          <label class="form-label">Messaging Sender ID</label>
          <input type="text" class="form-input" id="fbMessagingSenderId" value="${fbMessagingSenderId}" placeholder="123456789">
        </div>
        
        <div class="form-group">
          <label class="form-label">App ID *</label>
          <input type="text" class="form-input" id="fbAppId" value="${fbAppId}" placeholder="1:123456789:web:abcdef123456">
        </div>
        
        <div class="form-group">
          <label class="form-label">Database Secret (optional - for REST API)</label>
          <input type="password" class="form-input" id="fbSecret" value="${fbSecret}" placeholder="For legacy REST API access">
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label">Connection Status</div>
            <div class="setting-desc">${firebaseConnected ? '✅ Firebase connected' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="window.testFirebase()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🐙 GitHub Backup</div>
        <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
          Backup your data to a GitHub Gist for version control and additional redundancy.
        </p>
        
        <div class="form-group">
          <label class="form-label">GitHub Token</label>
          <input type="password" class="form-input" id="ghToken" value="${ghToken}" placeholder="ghp_...">
          <span class="form-hint">Personal access token with 'gist' scope</span>
        </div>
        
        <div class="form-group">
          <label class="form-label">Gist ID</label>
          <input type="text" class="form-input" id="ghGistId" value="${ghGistId}" placeholder="Gist ID for data storage">
          <span class="form-hint">ID of a secret gist for data storage</span>
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label">Connection Status</div>
            <div class="setting-desc">${githubConnected ? '✅ GitHub connected' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="window.testGitHub()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">🖨️ SimplyPrint Integration</div>
        <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
          Connect to your SimplyPrint 3D printer management system.
        </p>
        
        <div class="form-group">
          <label class="form-label">Proxy URL</label>
          <input type="text" class="form-input" id="printerProxy" value="${printerProxy}" placeholder="https://your-app.vercel.app/api/printers">
          <span class="form-hint">Your Vercel proxy URL for SimplyPrint API</span>
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label">Connection Status</div>
            <div class="setting-desc">${printerConnected ? '✅ Printer API connected' : '❌ Not configured'}</div>
          </div>
          <button class="btn btn-secondary" onclick="window.testPrinter()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">💾 Save Configuration</div>
        <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
          Save all integration settings. The app will reload to apply new Firebase configuration.
        </p>
        <div class="backup-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="window.saveAllIntegrations()">💾 Save All Settings</button>
          <button class="btn btn-secondary" onclick="window.clearAllIntegrations()">🗑️ Clear All</button>
        </div>
      </div>
    `
  }

  function renderDataSettings(lastBackup) {
    const autoBackup = localStorage.getItem('mc_auto_backup') !== 'false'

    return `
      <div class="settings-group">
        <div class="settings-group-title">💾 Backup & Restore</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Auto Backup</div>
            <div class="setting-desc">Automatically backup data to configured cloud storage</div>
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

        <div class="backup-actions" style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <button class="btn btn-primary" onclick="window.backupNow()">
            💾 Backup Now
          </button>

          <button class="btn btn-secondary" onclick="window.restoreFromBackup()">
            📤 Restore from File
          </button>
        </div>

        <div class="setting-item" style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label">Cloud Sync</div>
            <div class="setting-desc">Manually trigger sync to Firebase/GitHub</div>
          </div>
          <button class="btn btn-secondary" onclick="window.manualCloudSync()">🔄 Sync Now</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">📊 Data Management</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Export Data</div>
            <div class="setting-desc">Download all your data as JSON for offline storage</div>
          </div>

          <button class="btn btn-primary" onclick="window.exportData()">
            📥 Export JSON
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Import Data</div>
            <div class="setting-desc">Restore from a backup JSON file</div>
          </div>

          <button class="btn btn-secondary" onclick="window.importData()">
            📤 Import JSON
          </button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title" style="color: var(--accent-danger);">⚠️ Danger Zone</div>

        <div class="danger-zone" style="border: 1px solid var(--accent-danger); border-radius: var(--radius); padding: 1rem;">
          <div class="setting-item" style="border-bottom: none; padding-bottom: 0;">
            <div class="setting-info">
              <div class="setting-label" style="color: var(--accent-danger);">Clear All Data</div>
              <div class="setting-desc">Permanently delete everything. An automatic backup will be downloaded first. Cannot be undone.</div>
            </div>

            <button class="btn btn-danger" onclick="window.clearAllData()">
              Clear All Data
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

  window.toggleReduceMotion = (enabled) => {
    localStorage.setItem('mc_reduce_motion', enabled)
    document.documentElement.classList.toggle('reduce-motion', enabled)
    toast.success(enabled ? 'Reduced motion enabled' : 'Reduced motion disabled')
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

  window.toggleEmailAlerts = (enabled) => {
    localStorage.setItem('mc_email_alerts', enabled)
    toast.success(enabled ? 'Email alerts enabled' : 'Email alerts disabled')
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

  window.manualCloudSync = async () => {
    try {
      await syncStorage.sync()
      toast.success('Cloud sync complete', 'Data synchronized successfully')
    } catch (error) {
      toast.error('Sync failed', error.message)
    }
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
          if (confirm(`Import ${Object.keys(data).length} data types? This will merge with existing data.`)) {
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

  window.saveAllIntegrations = () => {
    // Save Firebase config
    const fbApiKey = document.getElementById('fbApiKey')?.value.trim()
    const fbAuthDomain = document.getElementById('fbAuthDomain')?.value.trim()
    const fbUrl = document.getElementById('fbUrl')?.value.trim()
    const fbProjectId = document.getElementById('fbProjectId')?.value.trim()
    const fbStorageBucket = document.getElementById('fbStorageBucket')?.value.trim()
    const fbMessagingSenderId = document.getElementById('fbMessagingSenderId')?.value.trim()
    const fbAppId = document.getElementById('fbAppId')?.value.trim()
    const fbSecret = document.getElementById('fbSecret')?.value.trim()
    
    // Save GitHub config
    const ghToken = document.getElementById('ghToken')?.value.trim()
    const ghGistId = document.getElementById('ghGistId')?.value.trim()
    
    // Save Printer config
    const printerProxy = document.getElementById('printerProxy')?.value.trim()

    // Save all values to localStorage
    if (fbApiKey) localStorage.setItem('mc_firebase_api_key', fbApiKey)
    if (fbAuthDomain) localStorage.setItem('mc_firebase_auth_domain', fbAuthDomain)
    if (fbUrl) localStorage.setItem('mc_firebase_url', fbUrl)
    if (fbProjectId) localStorage.setItem('mc_firebase_project_id', fbProjectId)
    if (fbStorageBucket) localStorage.setItem('mc_firebase_storage_bucket', fbStorageBucket)
    if (fbMessagingSenderId) localStorage.setItem('mc_firebase_messaging_sender_id', fbMessagingSenderId)
    if (fbAppId) localStorage.setItem('mc_firebase_app_id', fbAppId)
    if (fbSecret) localStorage.setItem('mc_firebase_secret', fbSecret)
    
    if (ghToken) localStorage.setItem('mc_github_token', ghToken)
    if (ghGistId) localStorage.setItem('mc_gist_id', ghGistId)
    
    if (printerProxy) localStorage.setItem('mc_printer_proxy', printerProxy)

    toast.success('All settings saved!', 'App will reload to apply changes')
    
    // Reload to apply new Firebase config
    setTimeout(() => window.location.reload(), 1500)
  }

  window.clearAllIntegrations = () => {
    if (confirm('Clear all integration settings? This will disconnect Firebase, GitHub, and Printer.')) {
      localStorage.removeItem('mc_firebase_api_key')
      localStorage.removeItem('mc_firebase_auth_domain')
      localStorage.removeItem('mc_firebase_url')
      localStorage.removeItem('mc_firebase_project_id')
      localStorage.removeItem('mc_firebase_storage_bucket')
      localStorage.removeItem('mc_firebase_messaging_sender_id')
      localStorage.removeItem('mc_firebase_app_id')
      localStorage.removeItem('mc_firebase_secret')
      localStorage.removeItem('mc_github_token')
      localStorage.removeItem('mc_gist_id')
      localStorage.removeItem('mc_printer_proxy')
      
      toast.success('Integration settings cleared')
      render()
    }
  }

  // Load preferences
  function loadPreferences() {
    const compact = localStorage.getItem('mc_compact_mode') === 'true'
    if (compact) document.body.classList.add('compact-mode')
    
    const reduceMotion = localStorage.getItem('mc_reduce_motion') === 'true'
    if (reduceMotion) document.documentElement.classList.add('reduce-motion')
  }

  store.subscribe(() => render())
  loadPreferences()
  render()

  return { render }
}

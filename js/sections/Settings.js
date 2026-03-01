import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { themeManager } from '../utils/themeManager.js'
import { customThemeManager } from '../utils/customThemes.js'
import { isFirebaseConfigured, isGitHubConfigured, isPrinterConfigured, saveFirebaseConfig, saveGitHubConfig, savePrinterConfig, testFirebaseConnection, testGitHubConnection, testPrinterConnection } from '../config.js'
import { syncStorage } from '../storage/sync.js'
import { icons } from '../utils/icons.js'

let activeSection = 'general'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
  { id: 'data', label: 'Data & Backup', icon: 'save' }
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
          <div class="welcome-greeting m-title">${icons.settings()} Settings</div>
          <div class="welcome-status">
            <span class="m-badge">Mission Control v5</span>
          </div>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Mobile Tab Navigation -->
        <div class="settings-nav-mobile">
          <select class="settings-mobile-select m-select" onchange="window.setSettingsSection(this.value)">
            ${SETTINGS_SECTIONS.map(section => `
              <option value="${section.id}" ${activeSection === section.id ? 'selected' : ''}>
                ${section.label}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Desktop Sidebar Navigation -->
        <div class="settings-nav">
          ${SETTINGS_SECTIONS.map(section => `
            <button class="settings-nav-item ${activeSection === section.id ? 'active' : ''} m-touch"
              onclick="window.setSettingsSection('${section.id}')"
            >
              <span class="nav-icon">${icons[section.icon]()}</span>
              <span class="nav-label m-body">${section.label}</span>
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
        <div class="settings-group-title m-title">${icons.chart()} Your Stats</div>

        <div class="metrics-grid settings-metrics">
          <div class="m-card metric-card">
            <div class="metric-value m-title">${stats.completed}</div>
            <div class="metric-label m-body">Completed</div>
          </div>

          <div class="m-card metric-card">
            <div class="metric-value m-title">${stats.completionRate}%</div>
            <div class="metric-label m-body">Completion Rate</div>
          </div>

          <div class="m-card metric-card">
            <div class="metric-value m-title">${stats.projectCount}</div>
            <div class="metric-label m-body">Projects</div>
          </div>

          <div class="m-card metric-card">
            <div class="metric-value m-title">${stats.noteCount}</div>
            <div class="metric-label m-body">Notes</div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.target()} Goals</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Monthly Order Target</div>
            <div class="setting-desc m-caption">Target number of orders per month</div>
          </div>

          <input type="number"
            class="m-input"
            value="${ordersTarget}"
            onchange="window.updateOrderTarget(this.value)"
            min="1"
            max="10000"
          >
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Revenue Goal</div>
            <div class="setting-desc m-caption">Monthly revenue target ($)</div>
          </div>

          <input type="number"
            class="m-input"
            value="${revenueGoal}"
            onchange="window.updateRevenueGoal(this.value)"
            min="0"
            max="1000000"
            step="100"
          >
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.keyboard()} Keyboard Shortcuts</div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Press ? for help</div>
            <div class="setting-desc m-caption">Show all keyboard shortcuts</div>
          </div>

          <button class="m-btn-secondary m-touch" onclick="window.showShortcutsHelp()">
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
        <div class="settings-group-title m-title">${icons.palette()} Theme</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Color Scheme</div>
            <div class="setting-desc m-caption">Choose light or dark mode</div>
          </div>

          <div class="theme-selector">
            <button class="theme-option ${currentTheme === 'light' ? 'active' : ''} m-touch"
              onclick="window.setTheme('light')"
            >${icons.sun()} Light</button>
            <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''} m-touch"
              onclick="window.setTheme('dark')"
            >${icons.moon()} Dark</button>
            <button class="theme-option ${currentTheme === 'system' ? 'active' : ''} m-touch"
              onclick="window.setTheme('system')"
            >${icons.monitor()} System</button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Compact Mode</div>
            <div class="setting-desc m-caption">Reduce padding for denser layout</div>
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
            <div class="setting-label m-body">Reduce Motion</div>
            <div class="setting-desc m-caption">Minimize animations for accessibility</div>
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
        <div class="settings-group-title m-title">${icons.palette()} Accent Color</div>
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
      <button class="theme-option m-btn-secondary m-touch ${current === id ? 'active' : ''}"
        onclick="window.setAccentTheme('${id}')"
        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-secondary); cursor: pointer;"
      >
        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${theme.colors.primary};"></div>
        <span class="m-body">${theme.name}</span>
      </button>
    `).join('')
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
        <div class="settings-group-title m-title">${icons.flame()} Firebase Configuration</div>
        <p class="m-caption" style="color: var(--text-secondary); margin-bottom: 1rem;">
          Required for real-time sync, file storage, and cloud backup. 
          <a href="https://console.firebase.google.com" target="_blank" style="color: var(--accent-primary);">Get config from Firebase Console →</a>
        </p>
        
        <div class="form-group">
          <label class="form-label m-body">API Key *</label>
          <input type="text" class="m-input" id="fbApiKey" value="${fbApiKey}" placeholder="AIzaSy...">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Auth Domain *</label>
          <input type="text" class="m-input" id="fbAuthDomain" value="${fbAuthDomain}" placeholder="your-project.firebaseapp.com">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Database URL *</label>
          <input type="text" class="m-input" id="fbUrl" value="${fbUrl}" placeholder="https://your-project-default-rtdb.firebaseio.com/">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Project ID *</label>
          <input type="text" class="m-input" id="fbProjectId" value="${fbProjectId}" placeholder="your-project-id">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Storage Bucket *</label>
          <input type="text" class="m-input" id="fbStorageBucket" value="${fbStorageBucket}" placeholder="your-project.appspot.com">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Messaging Sender ID</label>
          <input type="text" class="m-input" id="fbMessagingSenderId" value="${fbMessagingSenderId}" placeholder="123456789">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">App ID *</label>
          <input type="text" class="m-input" id="fbAppId" value="${fbAppId}" placeholder="1:123456789:web:abcdef123456">
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Database Secret (optional - for REST API)</label>
          <input type="password" class="m-input" id="fbSecret" value="${fbSecret}" placeholder="For legacy REST API access">
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label m-body">Connection Status</div>
            <div class="setting-desc m-caption">${firebaseConnected ? icons.check() + ' Firebase connected' : icons.x() + ' Not configured'}</div>
          </div>
          <button class="m-btn-secondary m-touch" onclick="window.testFirebase()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.github()} GitHub Backup</div>
        <p class="m-caption" style="color: var(--text-secondary); margin-bottom: 1rem;">
          Backup your data to a GitHub Gist for version control and additional redundancy.
        </p>
        
        <div class="form-group">
          <label class="form-label m-body">GitHub Token</label>
          <input type="password" class="m-input" id="ghToken" value="${ghToken}" placeholder="ghp_...">
          <span class="form-hint m-caption">Personal access token with 'gist' scope</span>
        </div>
        
        <div class="form-group">
          <label class="form-label m-body">Gist ID</label>
          <input type="text" class="m-input" id="ghGistId" value="${ghGistId}" placeholder="Gist ID for data storage">
          <span class="form-hint m-caption">ID of a secret gist for data storage</span>
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label m-body">Connection Status</div>
            <div class="setting-desc m-caption">${githubConnected ? icons.check() + ' GitHub connected' : icons.x() + ' Not configured'}</div>
          </div>
          <button class="m-btn-secondary m-touch" onclick="window.testGitHub()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.printer()} SimplyPrint Integration</div>
        <p class="m-caption" style="color: var(--text-secondary); margin-bottom: 1rem;">
          Connect to your SimplyPrint 3D printer management system.
        </p>
        
        <div class="form-group">
          <label class="form-label m-body">Proxy URL</label>
          <input type="text" class="m-input" id="printerProxy" value="${printerProxy}" placeholder="https://your-app.vercel.app/api/printers">
          <span class="form-hint m-caption">Your Vercel proxy URL for SimplyPrint API</span>
        </div>

        <div class="setting-item" style="margin-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label m-body">Connection Status</div>
            <div class="setting-desc m-caption">${printerConnected ? icons.check() + ' Printer API connected' : icons.x() + ' Not configured'}</div>
          </div>
          <button class="m-btn-secondary m-touch" onclick="window.testPrinter()">Test Connection</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.save()} Save Configuration</div>
        <p class="m-caption" style="color: var(--text-secondary); margin-bottom: 1rem;">
          Save all integration settings. The app will reload to apply new Firebase configuration.
        </p>
        <div class="backup-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="m-btn-primary m-touch" onclick="window.saveAllIntegrations()">${icons.save()} Save All Settings</button>
          <button class="m-btn-secondary m-touch" onclick="window.clearAllIntegrations()">${icons.delete()} Clear All</button>
        </div>
      </div>
    `
  }

  function renderDataSettings(lastBackup) {
    const autoBackup = localStorage.getItem('mc_auto_backup') !== 'false'

    return `
      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.save()} Backup & Restore</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Auto Backup</div>
            <div class="setting-desc m-caption">Automatically backup data to configured cloud storage</div>
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
          <div class="backup-info m-card" style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius); margin-bottom: 1rem;">
            <span class="m-body">${icons.clock()} Last backup: ${formatDate(lastBackup)}</span>
          </div>
        ` : ''}

        <div class="backup-actions" style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <button class="m-btn-primary m-touch" onclick="window.backupNow()">
            ${icons.save()} Backup Now
          </button>

          <button class="m-btn-secondary m-touch" onclick="window.restoreFromBackup()">
            ${icons.upload()} Restore from File
          </button>
        </div>

        <div class="setting-item" style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <div class="setting-info">
            <div class="setting-label m-body">Cloud Sync</div>
            <div class="setting-desc m-caption">Manually trigger sync to Firebase/GitHub</div>
          </div>
          <button class="m-btn-secondary m-touch" onclick="window.manualCloudSync()">${icons.refresh()} Sync Now</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title">${icons.chart()} Data Management</div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Export Data</div>
            <div class="setting-desc m-caption">Download all your data as JSON for offline storage</div>
          </div>

          <button class="m-btn-primary m-touch" onclick="window.exportData()">
            ${icons.download()} Export JSON
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label m-body">Import Data</div>
            <div class="setting-desc m-caption">Restore from a backup JSON file</div>
          </div>

          <button class="m-btn-secondary m-touch" onclick="window.importData()">
            ${icons.upload()} Import JSON
          </button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title m-title" style="color: var(--accent-danger);">${icons.alert()} Danger Zone</div>

        <div class="danger-zone m-card" style="border: 1px solid var(--accent-danger); border-radius: var(--radius); padding: 1rem;">
          <div class="setting-item" style="border-bottom: none; padding-bottom: 0;">
            <div class="setting-info">
              <div class="setting-label m-body" style="color: var(--accent-danger);">Clear All Data</div>
              <div class="setting-desc m-caption">Permanently delete everything. An automatic backup will be downloaded first. Cannot be undone.</div>
            </div>

            <button class="m-btn-danger m-touch" onclick="window.clearAllData()">
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

    if (confirm('WARNING: This will delete ALL data.\n\nA backup has been downloaded.\n\nContinue?')) {
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

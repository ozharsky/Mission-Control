// Automated backup scheduler

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { dataExport } from './dataTransfer.js'

class BackupScheduler {
  constructor() {
    this.interval = null
    this.lastBackup = localStorage.getItem('last_backup_time')
    this.settings = this.loadSettings()
  }
  
  loadSettings() {
    const defaults = {
      enabled: false,
      frequency: 'daily', // hourly, daily, weekly
      time: '09:00', // for daily/weekly
      keepCount: 7, // number of backups to keep
      destinations: ['local'] // local, github, drive
    }
    
    const saved = localStorage.getItem('backup_settings')
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  }
  
  saveSettings() {
    localStorage.setItem('backup_settings', JSON.stringify(this.settings))
  }
  
  /**
   * Start the scheduler
   */
  start() {
    if (this.interval) clearInterval(this.interval)
    if (!this.settings.enabled) return
    
    // Check every minute
    this.interval = setInterval(() => {
      this.checkAndBackup()
    }, 60000)
    
    // Initial check
    this.checkAndBackup()
  }
  
  /**
   * Stop the scheduler
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
  
  /**
   * Check if backup is due
   */
  checkAndBackup() {
    const now = new Date()
    const lastBackup = this.lastBackup ? new Date(this.lastBackup) : null
    
    let shouldBackup = false
    
    switch (this.settings.frequency) {
      case 'hourly':
        shouldBackup = !lastBackup || (now - lastBackup) > 60 * 60 * 1000
        break
        
      case 'daily':
        const [hours, minutes] = this.settings.time.split(':').map(Number)
        const backupTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
        
        if (lastBackup) {
          const lastBackupDate = new Date(lastBackup)
          shouldBackup = backupTime <= now && lastBackupDate < backupTime
        } else {
          shouldBackup = backupTime <= now
        }
        break
        
      case 'weekly':
        const dayOfWeek = now.getDay() // 0 = Sunday
        const [wh, wm] = this.settings.time.split(':').map(Number)
        const weeklyBackupTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), wh, wm)
        
        // Backup on Sundays
        if (dayOfWeek === 0) {
          if (lastBackup) {
            const lastBackupDate = new Date(lastBackup)
            shouldBackup = weeklyBackupTime <= now && lastBackupDate < weeklyBackupTime
          } else {
            shouldBackup = weeklyBackupTime <= now
          }
        }
        break
    }
    
    if (shouldBackup) {
      this.performBackup()
    }
  }
  
  /**
   * Perform backup
   */
  async performBackup() {
    const data = store.getState()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `mission-control-backup-${timestamp}.json`
    
    try {
      // Local backup
      if (this.settings.destinations.includes('local')) {
        dataExport.toJSON(data, filename)
      }
      
      // GitHub backup
      if (this.settings.destinations.includes('github')) {
        await this.backupToGitHub(data, filename)
      }
      
      // Update last backup time
      this.lastBackup = new Date().toISOString()
      localStorage.setItem('last_backup_time', this.lastBackup)
      
      // Cleanup old backups
      this.cleanupOldBackups()
      
      Toast.success('Backup complete', `Saved to ${this.settings.destinations.join(', ')}`)
      
    } catch (err) {
      console.error('Backup failed:', err)
      Toast.error('Backup failed', err.message)
    }
  }
  
  /**
   * Backup to GitHub
   */
  async backupToGitHub(data, filename) {
    const token = localStorage.getItem('github_token')
    const owner = localStorage.getItem('github_owner') || 'ozharsky'
    const repo = localStorage.getItem('github_repo') || 'Mission-Control'
    
    if (!token) {
      throw new Error('GitHub token not configured')
    }
    
    const content = btoa(JSON.stringify(data, null, 2))
    const path = `data/backups/${filename}`
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Backup: ${new Date().toLocaleString()}`,
        content
      })
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
  }
  
  /**
   * Cleanup old local backups
   */
  cleanupOldBackups() {
    // This would need to be implemented based on your storage mechanism
  }
  
  /**
   * Manual backup trigger
   */
  backupNow() {
    this.performBackup()
  }
  
  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    this.stop()
    this.start()
  }
  
  /**
   * Get next backup time
   */
  getNextBackupTime() {
    if (!this.settings.enabled) return null
    
    const now = new Date()
    let next = new Date()
    
    switch (this.settings.frequency) {
      case 'hourly':
        next.setHours(now.getHours() + 1, 0, 0, 0)
        break
        
      case 'daily':
        const [hours, minutes] = this.settings.time.split(':').map(Number)
        next.setHours(hours, minutes, 0, 0)
        if (next <= now) {
          next.setDate(next.getDate() + 1)
        }
        break
        
      case 'weekly':
        const [wh, wm] = this.settings.time.split(':').map(Number)
        next.setHours(wh, wm, 0, 0)
        // Next Sunday
        const daysUntilSunday = 7 - now.getDay()
        next.setDate(now.getDate() + daysUntilSunday)
        break
    }
    
    return next
  }
  
  /**
   * Create settings UI
   */
  createSettingsUI() {
    const nextBackup = this.getNextBackupTime()
    
    return `
      <div class="card">
        <div class="card-title">💾 Auto Backup</div>
        
        <div class="form-group">
          <label class="form-label">Enable Auto Backup</label>
          <input type="checkbox" id="backupEnabled" 
                 ${this.settings.enabled ? 'checked' : ''}
                 onchange="backupScheduler.updateSettings({ enabled: this.checked })">
        </div>
        
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select class="form-input" id="backupFrequency"
                onchange="backupScheduler.updateSettings({ frequency: this.value })">
            <option value="hourly" ${this.settings.frequency === 'hourly' ? 'selected' : ''}>Hourly</option>
            <option value="daily" ${this.settings.frequency === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${this.settings.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="backupTime"
                 value="${this.settings.time}"
                 onchange="backupScheduler.updateSettings({ time: this.value })">
        </div>
        
        <div class="form-group">
          <label class="form-label">Keep Backups</label>
          <input type="number" class="form-input" id="backupKeep"
                 value="${this.settings.keepCount}" min="1" max="30"
                 onchange="backupScheduler.updateSettings({ keepCount: parseInt(this.value) })">
        </div>
        
        ${nextBackup ? `
          <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 1rem;">
            <div style="font-size: 0.875rem; color: var(--text-muted);">Next backup:</div>
            <div style="font-weight: 500;">${nextBackup.toLocaleString()}</div>
          </div>
        ` : ''}
        
        <button class="btn btn-primary" onclick="backupScheduler.backupNow()">💾 Backup Now</button>
      </div>
    `
  }
}

export const backupScheduler = new BackupScheduler()

// Auto-start if enabled
if (backupScheduler.settings.enabled) {
  backupScheduler.start()
}

// Expose globally
window.backupScheduler = backupScheduler

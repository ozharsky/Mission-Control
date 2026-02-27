import { syncStorage } from '../storage/sync.js'
import { isFirebaseConfigured, isGitHubConfigured, saveFirebaseConfig, saveGitHubConfig } from '../config.js'
import { toast } from './Toast.js'

export function createSettingsModal() {
  const existing = document.getElementById('settingsModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'settingsModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚙️ Settings</div>
        <button class="modal-close" onclick="closeSettings()">✕</button>
      </div>
      
      <div class="modal-body">
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.75rem;">🔥 Firebase (Real-time Sync)</div>
          <div class="form-group">
            <label class="form-label">Database URL</label>
            <input type="text" class="form-input" id="fbUrl" placeholder="https://your-project.firebaseio.com/">
          </div>
          <div class="form-group">
            <label class="form-label">Database Secret</label>
            <input type="password" class="form-input" id="fbSecret" placeholder="Firebase secret...">
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.75rem;">🐙 GitHub (Backup)</div>
          <div class="form-group">
            <label class="form-label">Token</label>
            <input type="password" class="form-input" id="ghToken" placeholder="ghp_...">
          </div>
          <div class="form-group">
            <label class="form-label">Gist ID</label>
            <input type="text" class="form-input" id="ghGistId" placeholder="Gist ID for data storage">
          </div>
        </div>
        
        <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">📊 Status</div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            <div>Firebase: ${isFirebaseConfigured() ? '✅ Connected' : '❌ Not configured'}</div>
            <div>GitHub: ${isGitHubConfigured() ? '✅ Connected' : '❌ Not configured'}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.75rem;">💾 Manual Backup</div>
          <button class="btn btn-secondary" onclick="manualBackup()" style="width: 100%;">
            💾 Backup Now
          </button>
          <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.5rem;">
            Manually save current state to cloud storage
          </p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeSettings()">Cancel</button>
        <button class="btn btn-primary" onclick="saveSettings()">Save</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Load existing values
  const fbUrl = localStorage.getItem('mc_firebase_url') || ''
  const fbSecret = localStorage.getItem('mc_firebase_secret') || ''
  const ghToken = localStorage.getItem('mc_github_token') || ''
  const ghGistId = localStorage.getItem('mc_gist_id') || ''
  
  document.getElementById('fbUrl').value = fbUrl
  document.getElementById('fbSecret').value = fbSecret
  document.getElementById('ghToken').value = ghToken
  document.getElementById('ghGistId').value = ghGistId
  
  window.closeSettings = () => {
    modal.remove()
  }
  
  window.saveSettings = () => {
    const fbUrl = document.getElementById('fbUrl').value.trim()
    const fbSecret = document.getElementById('fbSecret').value.trim()
    const ghToken = document.getElementById('ghToken').value.trim()
    const ghGistId = document.getElementById('ghGistId').value.trim()
    
    if (fbUrl && fbSecret) {
      saveFirebaseConfig(fbUrl, fbSecret)
    }
    if (ghToken && ghGistId) {
      saveGitHubConfig(ghToken, ghGistId)
    }
    
    modal.remove()
    toast.success('Settings saved!')
  }
  
  window.manualBackup = async () => {
    try {
      const data = store.getState()
      await syncStorage.save(data)
      toast.success('💾 Backup saved!')
    } catch (err) {
      toast.error('Backup failed: ' + err.message)
    }
  }
}

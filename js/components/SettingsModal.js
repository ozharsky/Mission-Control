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
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">⚙️ Settings</div>
        <button class="modal-close" onclick="closeSettings()">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Firebase Configuration -->
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.75rem; font-size: 1.1rem;">🔥 Firebase Configuration</div>
          <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
            Required for real-time sync, file storage, and cloud backup. 
            <a href="https://console.firebase.google.com" target="_blank" style="color: var(--accent-primary);">Get config from Firebase Console →</a>
          </p>
          
          <div class="form-group">
            <label class="form-label">API Key *</label>
            <input type="text" class="form-input" id="fbApiKey" placeholder="AIzaSy...">
          </div>
          
          <div class="form-group">
            <label class="form-label">Auth Domain *</label>
            <input type="text" class="form-input" id="fbAuthDomain" placeholder="your-project.firebaseapp.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Database URL *</label>
            <input type="text" class="form-input" id="fbUrl" placeholder="https://your-project-default-rtdb.firebaseio.com/">
          </div>
          
          <div class="form-group">
            <label class="form-label">Project ID *</label>
            <input type="text" class="form-input" id="fbProjectId" placeholder="your-project-id">
          </div>
          
          <div class="form-group">
            <label class="form-label">Storage Bucket *</label>
            <input type="text" class="form-input" id="fbStorageBucket" placeholder="your-project.appspot.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Messaging Sender ID</label>
            <input type="text" class="form-input" id="fbMessagingSenderId" placeholder="123456789">
          </div>
          
          <div class="form-group">
            <label class="form-label">App ID *</label>
            <input type="text" class="form-input" id="fbAppId" placeholder="1:123456789:web:abcdef123456">
          </div>
          
          <div class="form-group">
            <label class="form-label">Database Secret (optional - for REST API)</label>
            <input type="password" class="form-input" id="fbSecret" placeholder="For legacy REST API access">
          </div>
        </div>
        
        <!-- GitHub Configuration -->
        <div style="margin-bottom: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <div style="font-weight: 600; margin-bottom: 0.75rem; font-size: 1.1rem;">🐙 GitHub Backup (Optional)</div>
          <p style="color: var(--text-secondary); font-size: 0.8125rem; margin-bottom: 1rem;">
            Backup your data to a GitHub Gist for version control.
          </p>
          
          <div class="form-group">
            <label class="form-label">Token</label>
            <input type="password" class="form-input" id="ghToken" placeholder="ghp_...">
          </div>
          
          <div class="form-group">
            <label class="form-label">Gist ID</label>
            <input type="text" class="form-input" id="ghGistId" placeholder="Gist ID for data storage">
          </div>
        </div>
        
        <!-- Status -->
        <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">📊 Connection Status</div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span>${isFirebaseConfigured() ? '✅' : '❌'}</span>
              <span>Firebase: ${isFirebaseConfigured() ? 'Connected' : 'Not configured'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${isGitHubConfigured() ? '✅' : '❌'}</span>
              <span>GitHub: ${isGitHubConfigured() ? 'Connected' : 'Not configured'}</span>
            </div>
          </div>
        </div>
        
        <!-- Manual Backup -->
        <div style="margin-bottom: 1rem;">
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
        <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Load existing values
  document.getElementById('fbApiKey').value = localStorage.getItem('mc_firebase_api_key') || ''
  document.getElementById('fbAuthDomain').value = localStorage.getItem('mc_firebase_auth_domain') || ''
  document.getElementById('fbUrl').value = localStorage.getItem('mc_firebase_url') || ''
  document.getElementById('fbProjectId').value = localStorage.getItem('mc_firebase_project_id') || ''
  document.getElementById('fbStorageBucket').value = localStorage.getItem('mc_firebase_storage_bucket') || ''
  document.getElementById('fbMessagingSenderId').value = localStorage.getItem('mc_firebase_messaging_sender_id') || ''
  document.getElementById('fbAppId').value = localStorage.getItem('mc_firebase_app_id') || ''
  document.getElementById('fbSecret').value = localStorage.getItem('mc_firebase_secret') || ''
  document.getElementById('ghToken').value = localStorage.getItem('mc_github_token') || ''
  document.getElementById('ghGistId').value = localStorage.getItem('mc_gist_id') || ''
  
  window.closeSettings = () => {
    modal.remove()
  }
  
  window.saveSettings = () => {
    // Save Firebase config
    const fbApiKey = document.getElementById('fbApiKey').value.trim()
    const fbAuthDomain = document.getElementById('fbAuthDomain').value.trim()
    const fbUrl = document.getElementById('fbUrl').value.trim()
    const fbProjectId = document.getElementById('fbProjectId').value.trim()
    const fbStorageBucket = document.getElementById('fbStorageBucket').value.trim()
    const fbMessagingSenderId = document.getElementById('fbMessagingSenderId').value.trim()
    const fbAppId = document.getElementById('fbAppId').value.trim()
    const fbSecret = document.getElementById('fbSecret').value.trim()
    
    if (fbApiKey) localStorage.setItem('mc_firebase_api_key', fbApiKey)
    if (fbAuthDomain) localStorage.setItem('mc_firebase_auth_domain', fbAuthDomain)
    if (fbUrl) localStorage.setItem('mc_firebase_url', fbUrl)
    if (fbProjectId) localStorage.setItem('mc_firebase_project_id', fbProjectId)
    if (fbStorageBucket) localStorage.setItem('mc_firebase_storage_bucket', fbStorageBucket)
    if (fbMessagingSenderId) localStorage.setItem('mc_firebase_messaging_sender_id', fbMessagingSenderId)
    if (fbAppId) localStorage.setItem('mc_firebase_app_id', fbAppId)
    if (fbSecret) localStorage.setItem('mc_firebase_secret', fbSecret)
    
    // Save GitHub config
    const ghToken = document.getElementById('ghToken').value.trim()
    const ghGistId = document.getElementById('ghGistId').value.trim()
    
    if (ghToken) localStorage.setItem('mc_github_token', ghToken)
    if (ghGistId) localStorage.setItem('mc_gist_id', ghGistId)
    
    toast.success('Settings saved', 'Configuration updated successfully')
    modal.remove()
    
    // Reload to apply new Firebase config
    setTimeout(() => window.location.reload(), 1000)
  }
  
  window.manualBackup = async () => {
    try {
      await syncStorage.sync()
      toast.success('Backup complete', 'Data saved to cloud storage')
    } catch (error) {
      toast.error('Backup failed', error.message)
    }
  }
}

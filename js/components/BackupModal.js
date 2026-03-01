import { store } from '../state/store.js'
import { exportToJSON, readFile } from '../utils/csv.js'
import { toast } from '../components/Toast.js'
import { migrateV3ToV4 } from '../utils/migrate.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'

export function createBackupModal() {
  const existing = document.getElementById('backupModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'backupModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">💾 Backup & Restore</div>
        <button class="modal-close" onclick="document.getElementById('backupModal').remove()">✕</button>
      </div>
      
      <div class="modal-body">
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.75rem;">📤 Export Data</div>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">Download a complete backup of all your data.</p>
          <button class="btn btn-primary" onclick="backup.export()">
            📥 Download Backup
          </button>
        </div>
        
        <div style="margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <div style="font-weight: 600; margin-bottom: 0.75rem;">📥 Import Data</div>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">Restore from a previous backup. V3 backups will be automatically migrated.</p>
          
          <input type="file" id="backupFileInput" accept=".json" style="display: none;">
          <button class="btn btn-secondary" onclick="document.getElementById('backupFileInput').click()">
            📁 Select Backup File
          </button>
        </div>
        
        <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">⚠️ Warning</div>
          <div style="font-size: 0.875rem; color: var(--text-secondary);">
            Importing will replace all your current data. Make sure to export a backup first!
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('backupModal').remove()">Close</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
  
  // Setup file import
  const fileInput = document.getElementById('backupFileInput')
  fileInput.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!confirm('This will replace all current data. Are you sure?')) {
      fileInput.value = ''
      return
    }
    
    try {
      const text = await readFile(file)
      const data = JSON.parse(text)
      
      // Check if this is V3 data
      const isV3 = !data.version || data.version.startsWith('3.') || typeof data.notes === 'string'
      
      let processedData = data
      if (isV3) {
        console.log('Detected V3 backup, running migration...')
        processedData = migrateV3ToV4(data)
        if (!processedData) {
          throw new Error('Migration failed')
        }
      }
      
      // Validate basic structure
      if (!processedData.priorities || !processedData.projects) {
        throw new Error('Invalid backup file format')
      }
      
      // Replace all data
      store.replace(processedData)
      
      toast.success('Backup restored', isV3 ? 'V3 data migrated to V4' : 'All data imported')
      document.getElementById('backupModal').remove()
      unlockBodyScroll()
      
    } catch (err) {
      console.error('Import error:', err)
      toast.error('Import failed', err.message)
    }
    
    fileInput.value = ''
  }
  
  // Export function
  window.backup = {
    export() {
      const data = store.getState()
      exportToJSON(data, `mission-control-backup-${new Date().toISOString().split('T')[0]}.json`)
      toast.success('Backup downloaded')
    }
  }
}

// Add to window for global access
window.createBackupModal = createBackupModal
// Firebase + GitHub Sync Storage
import { CONFIG, isFirebaseConfigured, isGitHubConfigured } from '../config.js'

export const syncStorage = {
  // Load from Firebase (primary) or GitHub (backup)
  async load() {
    // Try Firebase first
    if (isFirebaseConfigured()) {
      try {
        const data = await this.loadFromFirebase()
        if (data) {
          console.log('✅ Loaded from Firebase')
          return data
        }
      } catch (e) {
        console.error('Firebase load failed:', e)
      }
    }
    
    // Fallback to GitHub
    if (isGitHubConfigured()) {
      try {
        const data = await this.loadFromGitHub()
        if (data) {
          console.log('✅ Loaded from GitHub')
          return data
        }
      } catch (e) {
        console.error('GitHub load failed:', e)
      }
    }
    
    return null
  },
  
  // Save to both Firebase and GitHub
  async save(data) {
    const results = { firebase: false, github: false }
    
    if (isFirebaseConfigured()) {
      try {
        results.firebase = await this.saveToFirebase(data)
      } catch (e) {
        console.error('Firebase save failed:', e)
      }
    }
    
    if (isGitHubConfigured()) {
      try {
        results.github = await this.saveToGitHub(data)
      } catch (e) {
        console.error('GitHub save failed:', e)
      }
    }
    
    return results
  },
  
  async loadFromFirebase() {
    const { databaseURL, secret } = CONFIG.firebase
    const res = await fetch(`${databaseURL}/data.json?auth=${secret}`, { method: 'GET' })
    if (!res.ok) throw new Error(`Firebase error: ${res.status}`)
    return await res.json()
  },
  
  async saveToFirebase(data) {
    const { databaseURL, secret } = CONFIG.firebase
    const res = await fetch(`${databaseURL}/data.json?auth=${secret}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, _lastSync: Date.now() })
    })
    return res.ok
  },
  
  async loadFromGitHub() {
    const { token, gistId } = CONFIG.github
    if (!gistId || gistId.length < 20) {
      console.warn('⚠️ Invalid Gist ID format')
      return null
    }
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { 'Authorization': `token ${token}` }
    })
    if (res.status === 404) {
      console.warn('⚠️ GitHub Gist not found. Check your Gist ID.')
      return null
    }
    if (!res.ok) throw new Error(`GitHub error: ${res.status}`)
    const gist = await res.json()
    const content = gist.files['mission-control-data.json']?.content
    return content ? JSON.parse(content) : null
  },
  
  async saveToGitHub(data) {
    const { token, gistId } = CONFIG.github
    if (!gistId || gistId.length < 32) {
      console.warn('⚠️ Cannot save: Invalid Gist ID')
      return false
    }
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'mission-control-data.json': {
            content: JSON.stringify({ ...data, _lastSync: Date.now() }, null, 2)
          }
        }
      })
    })
    if (res.status === 404) {
      console.warn('⚠️ Cannot save to GitHub: Gist not found')
      return false
    }
    if (!res.ok) {
      console.error('❌ GitHub API error:', res.status)
      return false
    }
    return true
  },
  
  // Start periodic sync (placeholder for future real-time sync)
  startSync(interval = 30000) {
    console.log('🔄 Sync started (interval:', interval, 'ms)')
    // Placeholder - could implement WebSocket or polling here
    return setInterval(async () => {
      // Optional: Periodic background sync
    }, interval)
  },
  
  // Get sync status for UI indicator
  getStatus() {
    return {
      firebase: isFirebaseConfigured(),
      github: isGitHubConfigured(),
      configured: isFirebaseConfigured() || isGitHubConfigured()
    }
  }
}

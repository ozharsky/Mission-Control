// Firebase + GitHub Sync Storage
import { CONFIG, isFirebaseConfigured, isGitHubConfigured } from '../config.js'

// Discord webhook notifier
const discordNotifier = {
  webhooks: null,

  async loadWebhooks() {
    if (this.webhooks) return this.webhooks
    if (!isFirebaseConfigured()) return null

    try {
      const { databaseURL, secret } = CONFIG.firebase
      const res = await fetch(`${databaseURL}/data/webhooks.json?auth=${secret}`)
      if (res.ok) {
        this.webhooks = await res.json()
        return this.webhooks
      }
    } catch (e) {
      console.error('Failed to load webhooks:', e)
    }
    return null
  },

  async notify(board, message, embed = null) {
    const webhooks = await this.loadWebhooks()
    if (!webhooks) {
      console.log('No webhooks configured')
      return
    }

    console.log('Looking for webhook for board:', board)
    console.log('Available webhooks:', Object.keys(webhooks))

    // Find webhook for this board
    const webhookEntry = Object.values(webhooks).find(w => w.board === board)
    if (!webhookEntry) {
      console.log('No webhook found for board:', board)
      return
    }

    console.log('Found webhook:', webhookEntry.channel)

    try {
      const payload = embed ? { embeds: [embed] } : { content: message }
      const res = await fetch(webhookEntry.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        console.log('[Discord] Notification sent')
      } else {
        console.error('[Discord] Webhook failed:', res.status)
      }
    } catch (e) {
      console.error('Discord notify failed:', e)
    }
  },

  async notifyTaskChange(task, action) {
    const board = task.board || 'all'
    
    // Board-specific colors
    const boardColors = {
      'etsy': 0xff6b6b,      // Red for Etsy
      'photography': 0x4ecdc4, // Teal for Photography
      '3dprint': 0x45b7d1,   // Blue for 3D Printing
      'wholesale': 0xff00ff, // Purple for B2B
      'all': 0x6366f1       // Indigo default
    }
    
    const actionColors = {
      'completed': 0x00ff00,  // Green
      'created': 0x0099ff,    // Blue
      'reassigned': 0xff00ff, // Purple
      'updated': 0xffaa00     // Orange
    }
    
    const color = actionColors[action] || boardColors[board] || 0x6366f1

    // Truncate description if too long
    let description = task.desc || 'No description'
    if (description.length > 300) {
      description = description.substring(0, 297) + '...'
    }

    const title = action === 'reassigned' ? 
      `Task reassigned to ${task.assignee || 'Unassigned'}` :
      action === 'completed' ? 'Task Completed' :
      action === 'created' ? 'New Task Created' :
      action === 'updated' ? 'Task Updated' :
      `Task ${action}`

    const embed = {
      title: title,
      description: `**${task.text}**\n\n${description}`,
      color: color,
      fields: [
        { 
          name: 'Board', 
          value: board.charAt(0).toUpperCase() + board.slice(1), 
          inline: true 
        },
        { 
          name: 'Status', 
          value: (task.status || 'todo').charAt(0).toUpperCase() + (task.status || 'todo').slice(1), 
          inline: true 
        },
        { 
          name: 'Assignee', 
          value: task.assignee || 'Unassigned', 
          inline: true 
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Mission Control V5'
      }
    }

    // Add due date if present
    if (task.dueDate) {
      const due = new Date(task.dueDate)
      const today = new Date()
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
      
      let dueText = task.dueDate
      if (diffDays < 0) dueText += ' [OVERDUE]'
      else if (diffDays === 0) dueText += ' [TODAY]'
      else if (diffDays <= 3) dueText += ` [${diffDays} days]`
      
      embed.fields.push({
        name: 'Due Date',
        value: dueText,
        inline: true
      })
    }

    // Add tags if present
    if (task.tags && task.tags.length > 0) {
      embed.fields.push({
        name: 'Tags',
        value: task.tags.join(', '),
        inline: true
      })
    }

    await this.notify(board, null, embed)
  }
}

export const syncStorage = {
  // Load from Firebase (primary) or GitHub (backup)
  async load() {
    // Try Firebase first
    if (isFirebaseConfigured()) {
      try {
        const data = await this.loadFromFirebase()
        if (data) {
          console.log('[Sync] Loaded from Firebase')
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
          console.log('[Sync] Loaded from GitHub')
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
      console.warn('[Sync] Invalid Gist ID format')
      return null
    }
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { 'Authorization': `token ${token}` }
    })
    if (res.status === 404) {
      console.warn('[Sync] GitHub Gist not found. Check your Gist ID.')
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
      console.warn('[Sync] Cannot save: Invalid Gist ID')
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
      console.warn('[Sync] Cannot save to GitHub: Gist not found')
      return false
    }
    if (!res.ok) {
      console.error('[Sync] GitHub API error:', res.status)
      return false
    }
    return true
  },
  
  // Start periodic sync (placeholder for future real-time sync)
  startSync(interval = 30000) {
    console.log('[Sync] Started (interval:', interval, 'ms)')
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
  },

  // Discord notifier for external use
  notifier: discordNotifier,

  // Start polling for changes and notify Discord
  startDiscordPolling(interval = 60000) {
    if (!isFirebaseConfigured()) {
      console.log('Discord polling skipped: Firebase not configured')
      return null
    }

    console.log('[Discord] Polling started (interval:', interval, 'ms)')
    
    // Load last checked state from localStorage to survive page refreshes
    const STORAGE_KEY = 'discordPollingLastState'
    let lastCheckedPriorities = new Map()
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        lastCheckedPriorities = new Map(Object.entries(parsed))
        console.log('[Discord] Loaded', lastCheckedPriorities.size, 'tracked tasks from storage')
      }
    } catch (e) {
      console.error('Failed to load polling state:', e)
    }

    // Save state to localStorage helper
    const saveState = () => {
      try {
        const obj = Object.fromEntries(lastCheckedPriorities)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
      } catch (e) {
        console.error('Failed to save polling state:', e)
      }
    }

    // Initial load to establish baseline (don't notify on initial load)
    this.loadFromFirebase().then(data => {
      if (data && data.priorities) {
        // If we have no saved state, populate without notifying
        if (lastCheckedPriorities.size === 0) {
          console.log('[Discord] Initial load - tracking', data.priorities.length, 'tasks without notifications')
          data.priorities.forEach(p => {
            lastCheckedPriorities.set(String(p.id), { 
              status: p.status, 
              completed: p.completed, 
              assignee: p.assignee,
              updatedAt: p.updatedAt 
            })
          })
          saveState()
        }
      }
    }).catch(e => console.error('Initial load failed:', e))

    return setInterval(async () => {
      try {
        const data = await this.loadFromFirebase()
        if (!data || !data.priorities) return

        const currentPriorities = data.priorities
        let hasChanges = false

        for (const priority of currentPriorities) {
          const priorityId = String(priority.id)
          const lastState = lastCheckedPriorities.get(priorityId)

          if (!lastState) {
            // New task created
            console.log('[Discord] New task detected:', priority.text)
            await discordNotifier.notifyTaskChange(priority, 'created')
            hasChanges = true
          } else if (lastState.completed !== priority.completed && priority.completed) {
            // Task completed
            console.log('[Discord] Task completed:', priority.text)
            await discordNotifier.notifyTaskChange(priority, 'completed')
            hasChanges = true
          } else if (lastState.status !== priority.status) {
            // Task status changed
            console.log('[Discord] Task updated:', priority.text)
            await discordNotifier.notifyTaskChange(priority, 'updated')
            hasChanges = true
          } else if (lastState.assignee !== priority.assignee) {
            // Task reassigned
            console.log('[Discord] Task reassigned:', priority.text, '→', priority.assignee)
            await discordNotifier.notifyTaskChange(priority, 'reassigned')
            hasChanges = true
          }

          // Update stored state
          lastCheckedPriorities.set(priorityId, {
            status: priority.status,
            completed: priority.completed,
            assignee: priority.assignee,
            updatedAt: priority.updatedAt
          })
        }

        // Remove deleted tasks from tracking
        const currentIds = new Set(currentPriorities.map(p => String(p.id)))
        for (const id of lastCheckedPriorities.keys()) {
          if (!currentIds.has(id)) {
            lastCheckedPriorities.delete(id)
            hasChanges = true
          }
        }

        // Save state if there were any changes
        if (hasChanges) {
          saveState()
        }
      } catch (e) {
        console.error('Discord polling error:', e)
      }
    }, interval)
  }
}
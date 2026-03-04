// Webhook system for external integrations

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { icon } from './icons.js'

class WebhookManager {
  constructor() {
    this.webhooks = this.loadWebhooks()
    this.eventQueue = []
    this.processing = false
  }
  
  loadWebhooks() {
    const saved = localStorage.getItem('webhooks')
    return saved ? JSON.parse(saved) : []
  }
  
  saveWebhooks() {
    localStorage.setItem('webhooks', JSON.stringify(this.webhooks))
  }
  
  /**
   * Available events
   */
  getEvents() {
    return [
      { id: 'priority.created', name: 'Priority Created', icon: 'plus' },
      { id: 'priority.updated', name: 'Priority Updated', icon: 'pencil' },
      { id: 'priority.completed', name: 'Priority Completed', icon: 'check' },
      { id: 'priority.deleted', name: 'Priority Deleted', icon: 'trash-2' },
      { id: 'project.created', name: 'Project Created', icon: 'folder' },
      { id: 'project.updated', name: 'Project Updated', icon: 'file-text' },
      { id: 'project.moved', name: 'Project Moved', icon: 'arrow-right' },
      { id: 'revenue.updated', name: 'Revenue Updated', icon: 'dollar-sign' },
      { id: 'backup.completed', name: 'Backup Completed', icon: 'save' }
    ]
  }
  
  /**
   * Create a new webhook
   */
  create(config) {
    const webhook = {
      id: `wh_${Date.now()}`,
      createdAt: new Date().toISOString(),
      enabled: true,
      secret: this.generateSecret(),
      ...config
    }
    
    this.webhooks.push(webhook)
    this.saveWebhooks()
    
    Toast.success('Webhook created', webhook.name)
    return webhook
  }
  
  /**
   * Generate a secret for webhook signature
   */
  generateSecret() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  /**
   * Delete a webhook
   */
  delete(id) {
    this.webhooks = this.webhooks.filter(w => w.id !== id)
    this.saveWebhooks()
  }
  
  /**
   * Toggle webhook on/off
   */
  toggle(id) {
    const webhook = this.webhooks.find(w => w.id === id)
    if (webhook) {
      webhook.enabled = !webhook.enabled
      this.saveWebhooks()
    }
  }
  
  /**
   * Trigger an event
   */
  trigger(event, data = {}) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    }
    
    // Queue the event
    this.eventQueue.push(payload)
    
    // Process queue
    if (!this.processing) {
      this.processQueue()
    }
  }
  
  /**
   * Process event queue
   */
  async processQueue() {
    if (this.processing || this.eventQueue.length === 0) return
    
    this.processing = true
    
    while (this.eventQueue.length > 0) {
      const payload = this.eventQueue.shift()
      
      // Find matching webhooks
      const matching = this.webhooks.filter(w => 
        w.enabled && w.events.includes(payload.event)
      )
      
      // Send to each webhook
      for (const webhook of matching) {
        await this.send(webhook, payload)
      }
    }
    
    this.processing = false
  }
  
  /**
   * Send payload to webhook
   */
  async send(webhook, payload) {
    try {
      const signature = await this.sign(payload, webhook.secret)
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Event': payload.event
        },
        body: JSON.stringify(payload)
      })
      
      // Update stats
      webhook.lastTriggered = new Date().toISOString()
      webhook.triggerCount = (webhook.triggerCount || 0) + 1
      
      if (!response.ok) {
        webhook.lastError = `HTTP ${response.status}`
        webhook.errorCount = (webhook.errorCount || 0) + 1
      } else {
        webhook.lastError = null
      }
      
      this.saveWebhooks()
      
    } catch (err) {
      console.error('Webhook failed:', err)
      webhook.lastError = err.message
      webhook.errorCount = (webhook.errorCount || 0) + 1
      this.saveWebhooks()
    }
  }
  
  /**
   * Sign payload with secret
   */
  async sign(payload, secret) {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(payload))
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, data)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  /**
   * Test a webhook
   */
  async test(webhookId) {
    const webhook = this.webhooks.find(w => w.id === webhookId)
    if (!webhook) return
    
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' }
    }
    
    Toast.info('Testing webhook...')
    
    try {
      await this.send(webhook, testPayload)
      
      if (webhook.lastError) {
        Toast.error('Webhook test failed', webhook.lastError)
      } else {
        Toast.success('Webhook test successful!')
      }
    } catch (err) {
      Toast.error('Webhook test failed', err.message)
    }
  }
  
  /**
   * Get webhook logs (simulated)
   */
  getLogs(webhookId, limit = 50) {
    // In a real app, this would come from a server
    // For now, return mock data
    const webhook = this.webhooks.find(w => w.id === webhookId)
    if (!webhook) return []
    
    return [
      {
        timestamp: webhook.lastTriggered,
        event: 'priority.created',
        status: webhook.lastError ? 'error' : 'success',
        error: webhook.lastError
      }
    ].filter(l => l.timestamp)
  }
  
  /**
   * Render webhook settings
   */
  renderSettings(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    container.innerHTML = `
      <div class="card">
        <div class="card-title">🔗 Webhooks</div>
        
        <div style="margin-bottom: 1rem;">
          <button class="btn btn-primary m-touch" onclick="webhooks.showCreateDialog()">${icon('plus')} Add Webhook</button>
        </div>
        
        ${this.webhooks.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">${icon('link', 'empty-state-lucide-icon')}</div>
            <div class="empty-state-title">No webhooks</div>
            <div class="empty-state-desc">Connect to external services like Zapier, Slack, or your own API</div>
          </div>
        ` : `
          <div class="webhooks-list">
            ${this.webhooks.map(w => `
              <div class="webhook-item ${w.enabled ? '' : 'disabled'}" data-id="${w.id}">
                <div class="webhook-header">
                  <div class="webhook-name">${w.name}</div>
                  <div class="webhook-toggle">
                    <input type="checkbox" 
                           ${w.enabled ? 'checked' : ''} 
                           onchange="webhooks.toggle('${w.id}')">
                  </div>
                </div>
                <div class="webhook-url">${w.url}</div>
                <div class="webhook-events">
                  ${w.events.map(e => {
                    const eventInfo = this.getEvents().find(ev => ev.id === e)
                    return `<span class="webhook-event-tag">${eventInfo?.icon ? icon(eventInfo.icon, 'webhook-event-icon') : icon('bell', 'webhook-event-icon')} ${eventInfo?.name || e}</span>`
                  }).join('')}
                </div>
                <div class="webhook-stats">
                  <span>${icon('bar-chart-2', 'webhook-stat-icon')} ${w.triggerCount || 0} calls</span>
                  ${w.errorCount ? `<span style="color: var(--accent-danger);">${icon('x', 'webhook-stat-icon')} ${w.errorCount} errors</span>` : ''}
                  ${w.lastTriggered ? `<span>${icon('clock', 'webhook-stat-icon')} ${new Date(w.lastTriggered).toLocaleString()}</span>` : ''}
                </div>
                <div class="webhook-actions">
                  <button class="btn btn-sm btn-secondary m-touch" onclick="webhooks.test('${w.id}')">Test</button>
                  <button class="btn btn-sm btn-danger m-touch" onclick="webhooks.delete('${w.id}')">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `
  }
  
  showCreateDialog() {
    const name = prompt('Webhook name:')
    if (!name) return
    
    const url = prompt('Webhook URL:')
    if (!url) return
    
    // Show event selection
    const events = this.getEvents()
    const eventList = events.map((e, i) => `${i + 1}. ${e.name}`).join('\n')
    const selected = prompt(`Select events (comma-separated numbers):\n\n${eventList}`)
    
    if (!selected) return
    
    const selectedEvents = selected.split(',').map(s => {
      const idx = parseInt(s.trim()) - 1
      return events[idx]?.id
    }).filter(Boolean)
    
    if (selectedEvents.length === 0) return
    
    this.create({ name, url, events: selectedEvents })
    this.renderSettings('webhooksSettings')
  }
}

export const webhooks = new WebhookManager()

// Auto-trigger on store changes
store.subscribe((state, path) => {
  if (path?.includes('priorities')) {
    // Detect changes and trigger appropriate events
    // This is simplified - real implementation would track actual changes
  }
})

// Expose globally
window.webhooks = webhooks

// Automation rules engine

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'

class AutomationEngine {
  constructor() {
    this.rules = []
    this.loadRules()
  }
  
  loadRules() {
    const saved = localStorage.getItem('automation_rules')
    this.rules = saved ? JSON.parse(saved) : []
  }
  
  saveRules() {
    localStorage.setItem('automation_rules', JSON.stringify(this.rules))
  }
  
  /**
   * Create a new automation rule
   */
  addRule(rule) {
    const newRule = {
      id: Date.now(),
      enabled: true,
      createdAt: new Date().toISOString(),
      ...rule
    }
    
    this.rules.push(newRule)
    this.saveRules()
    
    toast.success('Automation created', `Rule: ${rule.name}`)
    return newRule
  }
  
  /**
   * Remove a rule
   */
  removeRule(id) {
    this.rules = this.rules.filter(r => r.id !== id)
    this.saveRules()
  }
  
  /**
   * Toggle rule on/off
   */
  toggleRule(id) {
    const rule = this.rules.find(r => r.id === id)
    if (rule) {
      rule.enabled = !rule.enabled
      this.saveRules()
    }
  }
  
  /**
   * Process all rules against current state
   */
  process() {
    const state = store.getState()
    
    this.rules.filter(r => r.enabled).forEach(rule => {
      this.executeRule(rule, state)
    })
  }
  
  /**
   * Execute a single rule
   */
  executeRule(rule, state) {
    const { trigger, conditions, actions } = rule
    
    // Check if trigger matches
    const items = this.getTriggerItems(trigger, state)
    
    items.forEach(item => {
      // Check all conditions
      const allConditionsMet = conditions.every(c => this.checkCondition(c, item))
      
      if (allConditionsMet) {
        // Execute all actions
        actions.forEach(a => this.executeAction(a, item))
      }
    })
  }
  
  /**
   * Get items based on trigger type
   */
  getTriggerItems(trigger, state) {
    switch (trigger.type) {
      case 'priority':
        return state.priorities || []
      case 'project':
        return Object.values(state.projects || {}).flat()
      case 'time':
        return [{ type: 'time', now: new Date() }]
      default:
        return []
    }
  }
  
  /**
   * Check if condition is met
   */
  checkCondition(condition, item) {
    const { field, operator, value } = condition
    const fieldValue = this.getFieldValue(item, field)
    
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(value)
      case 'less_than':
        return Number(fieldValue) < Number(value)
      case 'is_empty':
        return !fieldValue || String(fieldValue).trim() === ''
      case 'is_not_empty':
        return !!fieldValue && String(fieldValue).trim() !== ''
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)
      case 'tagged':
        return item.tags?.includes(value)
      case 'overdue':
        return item.dueDate && new Date(item.dueDate) < new Date() && !item.completed
      case 'due_today':
        const today = new Date().toISOString().split('T')[0]
        return item.dueDate === today
      case 'due_soon':
        if (!item.dueDate || item.completed) return false
        const due = new Date(item.dueDate)
        const days = (due - new Date()) / (1000 * 60 * 60 * 24)
        return days <= 3 && days >= 0
      default:
        return false
    }
  }
  
  /**
   * Execute an action
   */
  executeAction(action, item) {
    const { type, params = {} } = action
    
    switch (type) {
      case 'set_status':
        item.status = params.status
        if (params.status === 'done') item.completed = true
        break
        
      case 'add_tag':
        if (!item.tags) item.tags = []
        if (!item.tags.includes(params.tag)) {
          item.tags.push(params.tag)
        }
        break
        
      case 'remove_tag':
        if (item.tags) {
          item.tags = item.tags.filter(t => t !== params.tag)
        }
        break
        
      case 'set_priority':
        item.priority = params.priority
        break
        
      case 'assign':
        item.assignee = params.assignee
        break
        
      case 'set_due_date':
        item.dueDate = params.date
        break
        
      case 'send_notification':
        toast.info(params.title || 'Automation', params.message)
        break
        
      case 'create_priority':
        const priorities = store.get('priorities') || []
        priorities.push({
          id: Date.now(),
          text: params.text,
          status: 'later',
          tags: params.tags || [],
          createdAt: new Date().toISOString()
        })
        store.set('priorities', priorities)
        break
        
      case 'log_activity':
        if (!item.activityLog) item.activityLog = []
        item.activityLog.push({
          timestamp: new Date().toISOString(),
          action: 'Automation',
          details: params.message
        })
        break
    }
  }
  
  /**
   * Get field value from item
   */
  getFieldValue(item, field) {
    if (field.includes('.')) {
      return field.split('.').reduce((obj, key) => obj?.[key], item)
    }
    return item[field]
  }
  
  /**
   * Get preset rules
   */
  getPresets() {
    return [
      {
        name: 'Auto-complete overdue tasks',
        description: 'Mark tasks as done when 7 days overdue',
        trigger: { type: 'priority' },
        conditions: [
          { field: 'dueDate', operator: 'overdue' },
          { field: 'completed', operator: 'equals', value: false }
        ],
        actions: [
          { type: 'set_status', params: { status: 'done' } },
          { type: 'add_tag', params: { tag: 'auto-completed' } }
        ]
      },
      {
        name: 'Tag urgent items',
        description: 'Add urgent tag to high priority items due soon',
        trigger: { type: 'priority' },
        conditions: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'dueDate', operator: 'due_soon' }
        ],
        actions: [
          { type: 'add_tag', params: { tag: 'urgent' } },
          { type: 'send_notification', params: { title: 'Urgent!', message: 'High priority item due soon' } }
        ]
      },
      {
        name: 'Auto-assign client work',
        description: 'Assign items with client tag to Oleg',
        trigger: { type: 'priority' },
        conditions: [
          { field: 'tags', operator: 'tagged', value: 'client' },
          { field: 'assignee', operator: 'is_empty' }
        ],
        actions: [
          { type: 'assign', params: { assignee: 'Oleg' } }
        ]
      }
    ]
  }
  
  /**
   * Show create rule dialog
   */
  showCreateDialog() {
    const name = prompt('Rule name:')
    if (!name) return
    
    const triggerType = prompt('Trigger type (priority/project):', 'priority')
    if (!triggerType) return
    
    // Create a simple rule
    const rule = {
      name,
      trigger: { type: triggerType },
      conditions: [],
      actions: []
    }
    
    this.addRule(rule)
    alert('Rule created! Edit it in the console for now.')
  }
}

export const automation = new AutomationEngine()

// Run automation every minute
setInterval(() => {
  automation.process()
}, 60000)

// Expose globally
window.automation = automation

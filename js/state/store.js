// State Manager - Centralized state management with debounced notifications

function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const store = {
  data: {
    priorities: [],
    projects: { backlog: [], todo: [], inprogress: [], done: [] },
    revenueHistory: [],
    leads: [],
    events: [],
    skus: [],
    documents: [],
    notes: [],
    printers: [],
    orders: 0,
    ordersTarget: 150,
    revenueGoal: 5400,
    goalDate: '2026-05-01',
    currentBoard: 'all',
    _version: '4.0'
  },
  
  listeners: new Set(),
  pendingPath: '',
  
  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  },
  
  notify(path = '') {
    // Debounce notifications to batch rapid updates
    this.pendingPath = path
    this._debouncedNotify()
  },
  
  _debouncedNotify: debounce(function() {
    const path = this.pendingPath
    this.pendingPath = ''
    this.listeners.forEach(fn => {
      try {
        fn(this.data, path)
      } catch (e) {
        console.error('Error in store listener:', e)
      }
    })
  }, 16), // 16ms = 1 frame at 60fps
  
  getState() {
    return this.data
  },
  
  get(path) {
    const keys = path.split('.')
    let value = this.data
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) return undefined
    }
    return value
  },
  
  set(path, value) {
    const keys = path.split('.')
    let target = this.data
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {}
      target = target[keys[i]]
    }
    target[keys[keys.length - 1]] = value
    this.notify(path)
  },
  
  replace(newState) {
    this.data = newState
    this.notify()
  }
}

window.store = store

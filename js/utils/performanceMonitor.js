// Performance monitoring and metrics collection

/**
 * Performance metrics collector
 * Tracks Core Web Vitals and custom performance metrics
 */
export const performanceMonitor = {
  _metrics: new Map(),
  _observers: [],
  _isActive: false,

  /**
   * Start performance monitoring
   */
  start() {
    if (this._isActive) return
    this._isActive = true

    // Monitor Core Web Vitals
    this._observeWebVitals()

    // Monitor long tasks
    this._observeLongTasks()

    // Monitor layout shifts
    this._observeLayoutShifts()

    console.log('📊 Performance monitoring started')
  },

  /**
   * Stop performance monitoring and clean up
   */
  stop() {
    this._isActive = false
    this._observers.forEach(obs => {
      try {
        obs.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
    })
    this._observers = []
  },

  /**
   * Clear all collected metrics
   */
  clearMetrics() {
    this._metrics.clear()
  },

  /**
   * Observe Core Web Vitals
   */
  _observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this._metrics.set('LCP', {
            value: lastEntry.startTime,
            rating: this._getRating('LCP', lastEntry.startTime)
          })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this._observers.push(lcpObserver)
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.processingStart) {
              const delay = entry.processingStart - entry.startTime
              this._metrics.set('FID', {
                value: delay,
                rating: this._getRating('FID', delay)
              })
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this._observers.push(fidObserver)
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          this._metrics.set('CLS', {
            value: clsValue,
            rating: this._getRating('CLS', clsValue)
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this._observers.push(clsObserver)
      } catch (e) {
        // CLS not supported
      }

      // Time to First Byte (TTFB)
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.startTime
        this._metrics.set('TTFB', {
          value: ttfb,
          rating: this._getRating('TTFB', ttfb)
        })
      }
    }
  },

  /**
   * Observe long tasks
   */
  _observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            console.warn('⚠️ Long task detected:', entry.duration.toFixed(2) + 'ms')
            this._recordMetric('longTask', entry.duration)
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this._observers.push(longTaskObserver)
      } catch (e) {
        // Long tasks not supported
      }
    }
  },

  /**
   * Observe layout shifts
   */
  _observeLayoutShifts() {
    // Already handled in _observeWebVitals
  },

  /**
   * Get rating for a metric
   */
  _getRating(metric, value) {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 600, poor: 1000 },
      FCP: { good: 1800, poor: 3000 }
    }

    const t = thresholds[metric]
    if (!t) return 'unknown'

    if (value <= t.good) return 'good'
    if (value <= t.poor) return 'needs-improvement'
    return 'poor'
  },

  /**
   * Record a custom metric
   */
  _recordMetric(name, value) {
    if (!this._metrics.has(name)) {
      this._metrics.set(name, [])
    }
    const metrics = this._metrics.get(name)
    metrics.push({
      value,
      timestamp: Date.now()
    })
    // Keep only last 100 entries
    if (metrics.length > 100) {
      metrics.shift()
    }
  },

  /**
   * Measure function execution time
   * @param {Function} fn - Function to measure
   * @param {string} label - Metric label
   * @returns {any} Function result
   */
  measure(fn, label) {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    this._recordMetric(label, duration)
    return result
  },

  /**
   * Measure async function execution time
   * @param {Function} fn - Async function to measure
   * @param {string} label - Metric label
   * @returns {Promise<any>} Function result
   */
  async measureAsync(fn, label) {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    this._recordMetric(label, duration)
    return result
  },

  /**
   * Mark a performance milestone
   * @param {string} name - Milestone name
   */
  mark(name) {
    if (performance.mark) {
      performance.mark(name)
    }
    this._recordMetric(`mark:${name}`, performance.now())
  },

  /**
   * Measure between two marks
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @param {string} label - Metric label
   */
  measureBetween(startMark, endMark, label) {
    if (performance.measure) {
      try {
        performance.measure(label, startMark, endMark)
        const entries = performance.getEntriesByName(label)
        if (entries.length > 0) {
          this._recordMetric(label, entries[entries.length - 1].duration)
        }
      } catch (e) {
        // Marks might not exist
      }
    }
  },

  /**
   * Get all metrics
   */
  getMetrics() {
    return Object.fromEntries(this._metrics)
  },

  /**
   * Get summary report
   */
  getReport() {
    const report = {
      webVitals: {},
      custom: {},
      summary: {
        good: 0,
        'needs-improvement': 0,
        poor: 0
      }
    }

    this._metrics.forEach((value, key) => {
      if (Array.isArray(value)) {
        // Custom metrics array
        const avg = value.reduce((a, b) => a + b.value, 0) / value.length
        report.custom[key] = {
          count: value.length,
          average: avg,
          last: value[value.length - 1]?.value
        }
      } else {
        // Web vital
        report.webVitals[key] = value
        report.summary[value.rating]++
      }
    })

    return report
  },

  /**
   * Log performance report to console
   */
  logReport() {
    const report = this.getReport()
    console.group('📊 Performance Report')
    
    console.group('Core Web Vitals')
    Object.entries(report.webVitals).forEach(([key, value]) => {
      const emoji = value.rating === 'good' ? '🟢' : value.rating === 'needs-improvement' ? '🟡' : '🔴'
      const formatted = key === 'CLS' ? value.value.toFixed(3) : value.value.toFixed(2) + 'ms'
      console.log(`${emoji} ${key}: ${formatted} (${value.rating})`)
    })
    console.groupEnd()

    console.group('Custom Metrics')
    Object.entries(report.custom).forEach(([key, value]) => {
      console.log(`${key}: ${value.average.toFixed(2)}ms avg (${value.count} samples)`)
    })
    console.groupEnd()

    console.group('Summary')
    console.log(`🟢 Good: ${report.summary.good}`)
    console.log(`🟡 Needs Improvement: ${report.summary['needs-improvement']}`)
    console.log(`🔴 Poor: ${report.summary.poor}`)
    console.groupEnd()

    console.groupEnd()
  }
}

/**
 * Resource loading monitor
 */
export const resourceMonitor = {
  /**
   * Get resource loading times
   */
  getResourceTimes() {
    if (!performance.getEntriesByType) return []

    return performance.getEntriesByType('resource').map(r => ({
      name: r.name.split('/').pop(),
      type: r.initiatorType,
      duration: r.duration,
      size: r.transferSize,
      startTime: r.startTime
    }))
  },

  /**
   * Get slow resources
   * @param {number} threshold - Duration threshold in ms
   */
  getSlowResources(threshold = 1000) {
    return this.getResourceTimes().filter(r => r.duration > threshold)
  },

  /**
   * Log resource loading summary
   */
  logSummary() {
    const resources = this.getResourceTimes()
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0)
    const totalTime = resources.reduce((sum, r) => sum + r.duration, 0)

    console.group('📦 Resource Loading Summary')
    console.log(`Total resources: ${resources.length}`)
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Total time: ${totalTime.toFixed(2)}ms`)
    
    const slow = this.getSlowResources()
    if (slow.length > 0) {
      console.group('Slow resources (>1000ms)')
      slow.forEach(r => console.log(`${r.name}: ${r.duration.toFixed(2)}ms`))
      console.groupEnd()
    }
    console.groupEnd()
  }
}

/**
 * Memory usage monitor
 */
export const memoryMonitor = {
  /**
   * Get current memory usage
   */
  getUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
      }
    }
    return null
  },

  /**
   * Log memory usage
   */
  log() {
    const usage = this.getUsage()
    if (usage) {
      console.log(`🧠 Memory: ${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(usage.limit / 1024 / 1024).toFixed(2)}MB (${usage.percent}%)`)
    }
  }
}

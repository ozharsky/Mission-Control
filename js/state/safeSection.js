// Safe section wrapper with error boundaries and cleanup
import { store } from './store.js'

export function createSafeSection(createFn) {
  return function(containerId, options = {}) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.warn(`Container #${containerId} not found`)
      return { render: () => {}, destroy: () => {} }
    }
    
    const unsubscribers = []
    let isDestroyed = false
    
    // Safe store subscription with auto-cleanup
    function safeSubscribe(fn) {
      const unsub = store.subscribe((state, path) => {
        if (isDestroyed) return
        try {
          fn(state, path)
        } catch (e) {
          console.error('Store subscription error:', e)
        }
      })
      unsubscribers.push(unsub)
      return unsub
    }
    
    // Safe render with error boundary
    function safeRender(renderFn) {
      if (isDestroyed) return
      try {
        renderFn()
      } catch (e) {
        console.error(`Render error in section:`, e)
        container.innerHTML = `
          <div class="error-boundary">
            <div class="error-boundary-icon">⚠️</div>
            <div class="error-boundary-title">Something went wrong</div>
            <div class="error-boundary-text">${e.message}</div>
            <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
          </div>
        `
      }
    }
    
    // Cleanup function
    function destroy() {
      isDestroyed = true
      unsubscribers.forEach(unsub => {
        try {
          unsub()
        } catch (e) {
          console.error('Unsubscribe error:', e)
        }
      })
      unsubscribers.length = 0
    }
    
    // Create the section with safe wrappers
    const section = createFn(containerId, {
      ...options,
      safeSubscribe,
      safeRender
    })
    
    // Return wrapped section
    return {
      render: (...args) => {
        if (isDestroyed) return
        safeRender(() => section.render?.(...args))
      },
      destroy,
      // Allow manual unsubscribe registration
      onDestroy: (fn) => unsubscribers.push(fn)
    }
  }
}

// Error boundary styles
const errorStyles = document.createElement('style')
errorStyles.textContent = `
  .error-boundary {
    text-align: center;
    padding: 3rem 1.5rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    margin: 1rem;
  }
  
  .error-boundary-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-boundary-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .error-boundary-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    font-family: monospace;
    background: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    word-break: break-word;
  }
`
document.head.appendChild(errorStyles)
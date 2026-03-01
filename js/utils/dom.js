/**
 * DOM Utilities
 * Helper functions for DOM manipulation and querying
 */

/**
 * Query selector with null check
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {HTMLElement|null} Element or null
 */
export function $(selector, context = document) {
  return context.querySelector(selector)
}

/**
 * Query selector all with array return
 * @param {string} selector - CSS selector
 * @param {HTMLElement} context - Context element (default: document)
 * @returns {Array<HTMLElement>} Array of elements
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector))
}

/**
 * Create element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag)
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue
      })
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value)
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value)
    }
  })
  
  // Add children
  if (typeof children === 'string') {
    element.textContent = children
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child))
      } else if (child instanceof HTMLElement) {
        element.appendChild(child)
      }
    })
  }
  
  return element
}

/**
 * Insert element after reference element
 * @param {HTMLElement} newElement - Element to insert
 * @param {HTMLElement} referenceElement - Reference element
 */
export function insertAfter(newElement, referenceElement) {
  referenceElement.parentNode?.insertBefore(newElement, referenceElement.nextSibling)
}

/**
 * Remove element from DOM safely
 * @param {HTMLElement} element - Element to remove
 */
export function removeElement(element) {
  element?.parentNode?.removeChild(element)
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {Object} options - Options
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element, options = {}) {
  const { offset = 0, fullyInView = false } = options
  const rect = element.getBoundingClientRect()
  
  if (fullyInView) {
    return (
      rect.top >= offset &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }
  
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.bottom > -offset &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) + offset &&
    rect.right > 0
  )
}

/**
 * Get element position relative to document
 * @param {HTMLElement} element - Element
 * @returns {Object} Position { top, left }
 */
export function getPosition(element) {
  const rect = element.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    width: rect.width,
    height: rect.height
  }
}

/**
 * Smooth scroll to element
 * @param {HTMLElement|string} target - Element or selector
 * @param {Object} options - Scroll options
 */
export function scrollTo(target, options = {}) {
  const { offset = 0, behavior = 'smooth' } = options
  
  const element = typeof target === 'string' ? $(target) : target
  if (!element) return
  
  const position = getPosition(element)
  window.scrollTo({
    top: position.top - offset,
    behavior
  })
}

/**
 * Add class to element(s)
 * @param {HTMLElement|Array} elements - Element(s)
 * @param {string} className - Class to add
 */
export function addClass(elements, className) {
  const els = Array.isArray(elements) ? elements : [elements]
  els.forEach(el => el?.classList.add(className))
}

/**
 * Remove class from element(s)
 * @param {HTMLElement|Array} elements - Element(s)
 * @param {string} className - Class to remove
 */
export function removeClass(elements, className) {
  const els = Array.isArray(elements) ? elements : [elements]
  els.forEach(el => el?.classList.remove(className))
}

/**
 * Toggle class on element(s)
 * @param {HTMLElement|Array} elements - Element(s)
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(elements, className, force) {
  const els = Array.isArray(elements) ? elements : [elements]
  els.forEach(el => el?.classList.toggle(className, force))
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Element
 * @param {string} className - Class to check
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element?.classList.contains(className) || false
}

/**
 * Set attributes on element
 * @param {HTMLElement} element - Element
 * @param {Object} attrs - Attributes
 */
export function setAttributes(element, attrs) {
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      element.removeAttribute(key)
    } else {
      element.setAttribute(key, value)
    }
  })
}

/**
 * Get/set data attribute
 * @param {HTMLElement} element - Element
 * @param {string} key - Data key
 * @param {*} value - Value to set (omit to get)
 */
export function data(element, key, value) {
  if (value === undefined) {
    return element?.dataset?.[key]
  }
  if (element?.dataset) {
    element.dataset[key] = value
  }
}

/**
 * Empty element (remove all children)
 * @param {HTMLElement} element - Element to empty
 */
export function empty(element) {
  while (element?.firstChild) {
    element.removeChild(element.firstChild)
  }
}

/**
 * Replace element content
 * @param {HTMLElement} element - Element
 * @param {string|HTMLElement} content - New content
 */
export function setContent(element, content) {
  if (!element) return
  
  empty(element)
  
  if (typeof content === 'string') {
    element.innerHTML = content
  } else if (content instanceof HTMLElement) {
    element.appendChild(content)
  }
}

/**
 * Clone element
 * @param {HTMLElement} element - Element to clone
 * @param {boolean} deep - Deep clone (include children)
 * @returns {HTMLElement} Cloned element
 */
export function clone(element, deep = true) {
  return element?.cloneNode(deep)
}

/**
 * Wrap element with wrapper
 * @param {HTMLElement} element - Element to wrap
 * @param {HTMLElement} wrapper - Wrapper element
 */
export function wrap(element, wrapper) {
  if (!element?.parentNode) return
  
  element.parentNode.insertBefore(wrapper, element)
  wrapper.appendChild(element)
}

/**
 * Unwrap element (remove parent, keep children)
 * @param {HTMLElement} element - Element to unwrap
 */
export function unwrap(element) {
  const parent = element?.parentNode
  if (!parent) return
  
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

/**
 * Find closest ancestor matching selector
 * @param {HTMLElement} element - Starting element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
export function closest(element, selector) {
  return element?.closest(selector) || null
}

/**
 * Get siblings of element
 * @param {HTMLElement} element - Element
 * @returns {Array<HTMLElement>} Sibling elements
 */
export function siblings(element) {
  if (!element?.parentNode) return []
  
  return Array.from(element.parentNode.children).filter(child => child !== element)
}

/**
 * Get next sibling matching selector
 * @param {HTMLElement} element - Element
 * @param {string} selector - CSS selector (optional)
 * @returns {HTMLElement|null}
 */
export function next(element, selector) {
  let sibling = element?.nextElementSibling
  
  if (selector) {
    while (sibling && !sibling.matches(selector)) {
      sibling = sibling.nextElementSibling
    }
  }
  
  return sibling
}

/**
 * Get previous sibling matching selector
 * @param {HTMLElement} element - Element
 * @param {string} selector - CSS selector (optional)
 * @returns {HTMLElement|null}
 */
export function prev(element, selector) {
  let sibling = element?.previousElementSibling
  
  if (selector) {
    while (sibling && !sibling.matches(selector)) {
      sibling = sibling.previousElementSibling
    }
  }
  
  return sibling
}

/**
 * Serialize form data to object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data object
 */
export function serializeForm(form) {
  const formData = new FormData(form)
  const data = {}
  
  formData.forEach((value, key) => {
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]]
      }
      data[key].push(value)
    } else {
      data[key] = value
    }
  })
  
  return data
}

/**
 * Parse HTML string to DOM elements
 * @param {string} html - HTML string
 * @returns {DocumentFragment} Document fragment
 */
export function parseHTML(html) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content
}

/**
 * Ready - Execute callback when DOM is ready
 * @param {Function} callback - Callback function
 */
export function ready(callback) {
  if (document.readyState !== 'loading') {
    callback()
  } else {
    document.addEventListener('DOMContentLoaded', callback)
  }
}

/**
 * Frame - Execute callback on next animation frame
 * @param {Function} callback - Callback function
 * @returns {number} Frame ID
 */
export function frame(callback) {
  return requestAnimationFrame(callback)
}

/**
 * Batch DOM reads and writes for better performance
 * @param {Function} readFn - Read function
 * @param {Function} writeFn - Write function
 */
export function batchDOM(readFn, writeFn) {
  requestAnimationFrame(() => {
    const readData = readFn?.()
    requestAnimationFrame(() => {
      writeFn?.(readData)
    })
  })
}

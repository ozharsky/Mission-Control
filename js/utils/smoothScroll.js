// Smooth scroll animations and scroll-based effects

import { throttle, rafThrottle } from './performance.js'

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target - Element or selector to scroll to
 * @param {Object} options - Scroll options
 */
export function smoothScrollTo(target, options = {}) {
  const {
    offset = 0,
    duration = 500,
    easing = 'easeInOutCubic'
  } = options

  const element = typeof target === 'string' 
    ? document.querySelector(target) 
    : target

  if (!element) return Promise.reject(new Error('Target not found'))

  const container = document.querySelector('.content') || window
  const elementRect = element.getBoundingClientRect()
  const containerTop = container === window ? 0 : container.getBoundingClientRect().top
  const targetPosition = elementRect.top - containerTop + (container.scrollY || container.scrollTop || 0) - offset

  if (container === window) {
    return new Promise((resolve) => {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
      setTimeout(resolve, duration)
    })
  }

  // Custom smooth scroll for container
  return new Promise((resolve) => {
    const startPosition = container.scrollTop
    const distance = targetPosition - startPosition
    const startTime = performance.now()

    const easings = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (--t) * t * t + 1,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    }

    const easeFn = easings[easing] || easings.easeInOutCubic

    function scroll(currentTime) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeFn(progress)

      container.scrollTop = startPosition + distance * easedProgress

      if (progress < 1) {
        requestAnimationFrame(scroll)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(scroll)
  })
}

/**
 * Parallax effect for elements
 * @param {string} selector - Elements to apply parallax to
 * @param {Object} options - Parallax options
 */
export function createParallax(selector, options = {}) {
  const { speed = 0.5, direction = 'vertical' } = options

  const elements = document.querySelectorAll(selector)
  if (elements.length === 0) return

  const handleScroll = rafThrottle(() => {
    const scrollY = window.scrollY

    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const distance = scrollY - elementTop + window.innerHeight

      if (distance > 0 && rect.bottom > 0) {
        const offset = distance * speed
        if (direction === 'vertical') {
          el.style.transform = `translateY(${offset}px)`
        } else {
          el.style.transform = `translateX(${offset}px)`
        }
      }
    })
  })

  window.addEventListener('scroll', handleScroll, { passive: true })

  return {
    destroy: () => window.removeEventListener('scroll', handleScroll)
  }
}

/**
 * Scroll progress indicator
 * @param {string} containerSelector - Container to track scroll progress
 * @param {string} indicatorSelector - Progress indicator element
 */
export function createScrollProgress(containerSelector, indicatorSelector) {
  const container = document.querySelector(containerSelector)
  const indicator = document.querySelector(indicatorSelector)

  if (!container || !indicator) return

  const updateProgress = rafThrottle(() => {
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight - container.clientHeight
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0

    indicator.style.width = `${progress}%`
  })

  container.addEventListener('scroll', updateProgress, { passive: true })

  return {
    update: updateProgress,
    destroy: () => container.removeEventListener('scroll', updateProgress)
  }
}

/**
 * Reveal elements on scroll with stagger
 * @param {string} selector - Elements to reveal
 * @param {Object} options - Reveal options
 */
export function revealOnScroll(selector, options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    stagger = 100,
    animationClass = 'reveal-in'
  } = options

  const elements = document.querySelectorAll(selector)
  if (elements.length === 0) return

  // Add base styles
  if (!document.getElementById('reveal-styles')) {
    const styles = document.createElement('style')
    styles.id = 'reveal-styles'
    styles.textContent = `
      [data-reveal] {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      [data-reveal].${animationClass} {
        opacity: 1;
        transform: translateY(0);
      }
    `
    document.head.appendChild(styles)
  }

  elements.forEach((el, i) => {
    el.dataset.reveal = ''
    el.style.transitionDelay = `${i * stagger}ms`
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass)
        observer.unobserve(entry.target)
      }
    })
  }, {
    threshold,
    rootMargin
  })

  elements.forEach(el => observer.observe(el))

  return observer
}

/**
 * Header scroll behavior - hide/show on scroll
 * @param {string} headerSelector - Header element
 * @param {Object} options - Behavior options
 */
export function createHeaderScrollBehavior(headerSelector, options = {}) {
  const {
    hideThreshold = 100,
    showThreshold = 50,
    hideClass = 'header-hidden'
  } = options

  const header = document.querySelector(headerSelector)
  if (!header) return

  let lastScrollY = 0
  let ticking = false

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const scrollDelta = currentScrollY - lastScrollY

        // Scrolling down and past threshold
        if (scrollDelta > 0 && currentScrollY > hideThreshold) {
          header.classList.add(hideClass)
        }
        // Scrolling up
        else if (scrollDelta < 0 && currentScrollY > showThreshold) {
          header.classList.remove(hideClass)
        }
        // At top
        else if (currentScrollY <= showThreshold) {
          header.classList.remove(hideClass)
        }

        lastScrollY = currentScrollY
        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  // Add default styles
  if (!document.getElementById('header-scroll-styles')) {
    const styles = document.createElement('style')
    styles.id = 'header-scroll-styles'
    styles.textContent = `
      ${headerSelector} {
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      ${headerSelector}.${hideClass} {
        transform: translateY(-100%);
        opacity: 0;
      }
    `
    document.head.appendChild(styles)
  }

  return {
    destroy: () => window.removeEventListener('scroll', handleScroll)
  }
}

/**
 * Scroll snap to nearest section
 * @param {string} containerSelector - Scroll container
 * @param {string} sectionSelector - Sections to snap to
 */
export function createScrollSnap(containerSelector, sectionSelector) {
  const container = document.querySelector(containerSelector)
  const sections = document.querySelectorAll(sectionSelector)

  if (!container || sections.length === 0) return

  let isScrolling = false
  let scrollTimeout

  const handleScrollEnd = throttle(() => {
    if (isScrolling) return

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.top + containerRect.height / 2

    let closestSection = null
    let closestDistance = Infinity

    sections.forEach(section => {
      const rect = section.getBoundingClientRect()
      const sectionCenter = rect.top + rect.height / 2
      const distance = Math.abs(containerCenter - sectionCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestSection = section
      }
    })

    if (closestSection) {
      isScrolling = true
      closestSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => { isScrolling = false }, 500)
    }
  }, 150)

  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(handleScrollEnd, 100)
  }, { passive: true })

  return {
    destroy: () => container.removeEventListener('scroll', handleScrollEnd)
  }
}

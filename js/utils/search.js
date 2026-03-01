// Fuzzy search implementation

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Calculate fuzzy match score (0-1)
 */
function fuzzyScore(query, text) {
  if (!query || !text) return 0
  
  query = query.toLowerCase()
  text = text.toLowerCase()
  
  // Exact match
  if (text.includes(query)) {
    return 1
  }
  
  // Calculate distance
  const distance = levenshteinDistance(query, text.slice(0, query.length + 5))
  const maxDistance = Math.max(query.length, text.length)
  
  return Math.max(0, 1 - (distance / maxDistance))
}

/**
 * Fuzzy search through items
 */
export function fuzzySearch(items, query, options = {}) {
  const {
    keys = ['text', 'title', 'name'],
    threshold = 0.3,
    limit = 20
  } = options
  
  if (!query || query.trim() === '') {
    return items.slice(0, limit)
  }
  
  const scored = items.map(item => {
    let maxScore = 0
    
    for (const key of keys) {
      const value = item[key]
      if (typeof value === 'string') {
        const score = fuzzyScore(query, value)
        maxScore = Math.max(maxScore, score)
      }
    }
    
    return { item, score: maxScore }
  })
  
  return scored
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}

/**
 * Highlight matching text
 */
export function highlightMatch(text, query) {
  if (!query || !text) return text
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Search with filters
 */
export function advancedSearch(items, query, filters = {}) {
  let results = items
  
  // Apply text search
  if (query) {
    results = fuzzySearch(results, query, { threshold: 0.2 })
  }
  
  // Apply filters
  if (filters.status) {
    results = results.filter(item => item.status === filters.status)
  }
  
  if (filters.tags?.length > 0) {
    results = results.filter(item => 
      filters.tags.some(tag => item.tags?.includes(tag))
    )
  }
  
  if (filters.dateFrom) {
    results = results.filter(item => 
      new Date(item.dueDate || item.date) >= new Date(filters.dateFrom)
    )
  }
  
  if (filters.dateTo) {
    results = results.filter(item => 
      new Date(item.dueDate || item.date) <= new Date(filters.dateTo)
    )
  }
  
  if (filters.completed !== undefined) {
    results = results.filter(item => item.completed === filters.completed)
  }
  
  return results
}

// Expose globally
window.fuzzySearch = fuzzySearch
window.highlightMatch = highlightMatch
window.advancedSearch = advancedSearch

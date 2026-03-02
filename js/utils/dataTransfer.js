// Advanced data import/export

import { Toast } from '../components/Toast.js'

/**
 * Export data in multiple formats
 */
export const dataExport = {
  /**
   * Export to JSON
   */
  toJSON(data, filename = 'mission-control-export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    this.download(blob, filename)
    return true
  },
  
  /**
   * Export to CSV (for priorities/projects)
   */
  toCSV(items, options = {}) {
    const { 
      filename = 'export.csv',
      columns = null 
    } = options
    
    if (items.length === 0) {
      Toast.warning('No data to export')
      return false
    }
    
    // Auto-detect columns if not specified
    const cols = columns || Object.keys(items[0]).filter(k => 
      typeof items[0][k] !== 'object' && 
      typeof items[0][k] !== 'function'
    )
    
    // Header
    let csv = cols.join(',') + '\n'
    
    // Rows
    items.forEach(item => {
      const row = cols.map(col => {
        const value = item[col]
        // Escape values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    this.download(blob, filename)
    return true
  },
  
  /**
   * Export to Markdown (for notes/docs)
   */
  toMarkdown(items, options = {}) {
    const { filename = 'export.md', title = 'Export' } = options
    
    let md = `# ${title}\n\n`
    md += `Generated: ${new Date().toLocaleString()}\n\n`
    
    items.forEach((item, i) => {
      md += `## ${item.title || item.text || `Item ${i + 1}`}\n\n`
      
      Object.entries(item).forEach(([key, value]) => {
        if (key === 'title' || key === 'text') return
        if (value === null || value === undefined) return
        
        md += `**${key}:** ${value}\n\n`
      })
      
      md += '---\n\n'
    })
    
    const blob = new Blob([md], { type: 'text/markdown' })
    this.download(blob, filename)
    return true
  },
  
  /**
   * Export to PDF (using print to PDF)
   */
  toPDF(element, filename = 'export.pdf') {
    // Open print dialog for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      Toast.error('Popup blocked', 'Please allow popups to export PDF')
      return false
    }
    
    const content = element.innerHTML
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${content}
          <script>window.print()</script>
        </body>
      </html>
    `)
    printWindow.document.close()
    return true
  },
  
  /**
   * Download helper
   */
  download(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Import data from various formats
 */
export const dataImport = {
  /**
   * Read file content
   */
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  },
  
  /**
   * Parse JSON
   */
  fromJSON(text) {
    try {
      return JSON.parse(text)
    } catch (err) {
      throw new Error('Invalid JSON file')
    }
  },
  
  /**
   * Parse CSV
   */
  fromCSV(text, options = {}) {
    const { headers = true } = options
    const lines = text.trim().split('\n')
    
    if (lines.length === 0) return []
    
    const cols = this.parseCSVLine(lines[0])
    const data = []
    
    const startIndex = headers ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      const row = {}
      
      cols.forEach((col, idx) => {
        const key = headers ? col : `col${idx}`
        row[key] = this.parseValue(values[idx])
      })
      
      data.push(row)
    }
    
    return data
  },
  
  /**
   * Parse a CSV line handling quotes
   */
  parseCSVLine(line) {
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())
    return values
  },
  
  /**
   * Parse value to appropriate type
   */
  parseValue(value) {
    if (value === '' || value === undefined) return null
    if (value === 'true') return true
    if (value === 'false') return false
    if (/^\d+$/.test(value)) return parseInt(value)
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value)
    return value
  },
  
  /**
   * Auto-detect format and parse
   */
  async autoParse(file) {
    const text = await this.readFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    
    switch (ext) {
      case 'json':
        return this.fromJSON(text)
      case 'csv':
        return this.fromCSV(text)
      case 'md':
      case 'txt':
        return { text, format: 'text' }
      default:
        // Try JSON first, then CSV
        try {
          return this.fromJSON(text)
        } catch {
          return this.fromCSV(text)
        }
    }
  }
}

/**
 * Sync with cloud storage (Google Drive, Dropbox, etc)
 */
export const cloudSync = {
  /**
   * Export to Google Drive
   */
  async toGoogleDrive(data, filename) {
    // This would require Google Drive API integration
    // For now, just download the file
    dataExport.toJSON(data, filename)
    Toast.info('Downloaded', 'Google Drive integration coming soon')
  },
  
  /**
   * Create shareable link
   */
  createShareLink(data) {
    const json = JSON.stringify(data)
    const compressed = btoa(json) // Simple base64 encoding
    const url = `${window.location.origin}?import=${compressed}`
    
    navigator.clipboard.writeText(url).then(() => {
      Toast.success('Link copied', 'Share link copied to clipboard')
    })
    
    return url
  }
}

// Expose globally
window.dataExport = dataExport
window.dataImport = dataImport
window.cloudSync = cloudSync

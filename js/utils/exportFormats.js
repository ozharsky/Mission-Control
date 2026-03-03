// Enhanced Export Utilities
// Support for multiple export formats

import { formatDate } from './shared.js'
import { store } from '../state/store.js'

// Export to CSV with proper formatting
export function exportToCSV(data, options = {}) {
  const { 
    filename = 'export.csv',
    headers = null,
    includeHeaders = true
  } = options
  
  if (!data || data.length === 0) {
    return
  }
  
  // Auto-detect headers if not provided
  const cols = headers || Object.keys(data[0])
  
  // Build CSV content
  const lines = []
  
  // Add headers
  if (includeHeaders) {
    lines.push(cols.map(escapeCSV).join(','))
  }
  
  // Add data rows
  data.forEach(row => {
    const values = cols.map(col => {
      const value = row[col]
      
      // Format based on value type
      if (value == null) return ''
      if (value instanceof Date) return formatDate(value, { format: 'iso' })
      if (typeof value === 'boolean') return value ? 'Yes' : 'No'
      if (Array.isArray(value)) return value.join('; ')
      
      return String(value)
    })
    
    lines.push(values.map(escapeCSV).join(','))
  })
  
  // Download
  const csv = lines.join('\n')
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

// Escape CSV value
function escapeCSV(value) {
  const str = String(value)
  
  // Escape quotes and wrap in quotes if contains special chars
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  
  return str
}

// Export to Excel-compatible HTML
export function exportToExcel(data, options = {}) {
  const { filename = 'export.xls', sheetName = 'Data' } = options
  
  if (!data || data.length === 0) {
    return
  }
  
  const cols = Object.keys(data[0])
  
  // Build HTML table
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background: #f0f0f0; font-weight: bold; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      </style>
    </head>
    <body>
      <table>
  `
  
  // Add headers
  html += '<tr>' + cols.map(col => `<th>${escapeHtml(col)}</th>`).join('') + '</tr>\n'
  
  // Add data rows
  data.forEach(row => {
    html += '<tr>' + cols.map(col => {
      const value = row[col]
      let display = ''
      
      if (value == null) {
        display = ''
      } else if (value instanceof Date) {
        display = formatDate(value, { format: 'iso' })
      } else if (typeof value === 'boolean') {
        display = value ? 'Yes' : 'No'
      } else if (Array.isArray(value)) {
        display = value.join(', ')
      } else {
        display = String(value)
      }
      
      return `<td>${escapeHtml(display)}</td>`
    }).join('') + '</tr>\n'
  })
  
  html += `
      </table>
    </body>
    </html>
  `
  
  downloadFile(html, filename, 'application/vnd.ms-excel')
}

// Export to PDF (via print dialog)
export function exportToPDF(options = {}) {
  const { title = 'Mission Control Report' } = options
  
  // Set print date
  document.body.setAttribute('data-print-date', new Date().toLocaleDateString())
  
  // Set page title temporarily
  const originalTitle = document.title
  document.title = title
  
  // Trigger print dialog
  window.print()
  
  // Restore title
  document.title = originalTitle
}

// Export specific data types
export const exporters = {
  priorities: () => {
    const priorities = store.getState().priorities || []
    exportToCSV(priorities, { 
      filename: `priorities-${formatDate(new Date(), { format: 'iso' })}.csv`,
      headers: ['id', 'text', 'status', 'completed', 'dueDate', 'priority', 'assignee', 'tags']
    })
  },
  
  leads: () => {
    const leads = store.getState().leads || []
    exportToCSV(leads, {
      filename: `leads-${formatDate(new Date(), { format: 'iso' })}.csv`,
      headers: ['id', 'name', 'company', 'email', 'phone', 'status', 'value', 'lastContact']
    })
  },
  
  events: () => {
    const events = store.getState().events || []
    exportToCSV(events, {
      filename: `events-${formatDate(new Date(), { format: 'iso' })}.csv`,
      headers: ['id', 'name', 'date', 'type', 'status', 'location', 'notes']
    })
  },
  
  skus: () => {
    const skus = store.getState().skus || []
    exportToCSV(skus, {
      filename: `skus-${formatDate(new Date(), { format: 'iso' })}.csv`,
      headers: ['id', 'code', 'name', 'stock', 'status']
    })
  },
  
  revenue: () => {
    const history = store.getState().revenueHistory || []
    exportToCSV(history, {
      filename: `revenue-${formatDate(new Date(), { format: 'iso' })}.csv`,
      headers: ['date', 'value', 'orders', 'items']
    })
  }
}

// Helper function
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

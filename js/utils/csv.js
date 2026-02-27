// CSV parsing utilities

export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  
  // Parse header
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    rows.push(row)
  }
  
  return rows
}

function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quotes
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current)
  return values
}

// Parse Etsy date format (MM/DD/YY or MM/DD/YYYY)
function parseEtsyDate(dateStr) {
  if (!dateStr) return null
  
  const parts = dateStr.trim().split('/')
  if (parts.length !== 3) return null
  
  let month = parseInt(parts[0])
  let day = parseInt(parts[1])
  let year = parseInt(parts[2])
  
  // Handle 2-digit years (25 -> 2025, 26 -> 2026)
  if (year < 100) {
    year = 2000 + year
  }
  
  const date = new Date(year, month - 1, day)
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return null
  }
  
  return date
}

// Etsy CSV specific parsing
export function parseEtsyCSV(csvText) {
  const rows = parseCSV(csvText)
  
  if (rows.length === 0) {
    return []
  }
  
  const results = []
  
  rows.forEach((row, idx) => {
    // Try to find date column
    const dateStr = row['Sale Date'] || row['Date'] || row['date']
    const date = parseEtsyDate(dateStr)
    
    if (!date) {
      return
    }
    
    // Try to find order value/net
    let orderValue = 0
    const orderValueStr = row['Order Value'] || row['Order Net'] || row['Order Total']
    if (orderValueStr) {
      orderValue = parseFloat(orderValueStr.replace('$', '').replace(',', ''))
    }
    
    // Try to find number of items
    let items = 1
    const itemsStr = row['Number of Items'] || row['Items']
    if (itemsStr) {
      items = parseInt(itemsStr) || 1
    }
    
    // Format date as YYYY-MM
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const formattedDate = `${year}-${month}`
    
    results.push({
      date: formattedDate,
      orderId: row['Order ID'] || '',
      items: items,
      value: orderValue,
      net: orderValue
    })
  })
  
  return results
}

// SKU CSV parsing
export function parseSKUCSV(csvText) {
  const rows = parseCSV(csvText)
  
  return rows.map(row => ({
    code: row['SKU Code'] || row['code'] || row['SKU'] || '',
    name: row['Product Name'] || row['name'] || row['Product'] || '',
    stock: parseInt(row['Stock'] || row['stock'] || row['Quantity'] || 0),
    status: row['Status'] || row['status'] || 'active'
  })).filter(r => r.code && r.name)
}

// Export data as JSON
export function exportToJSON(data, filename = 'mission-control-backup.json') {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, filename, 'application/json')
}

// Export as CSV
export function exportToCSV(data, filename = 'data.csv') {
  if (!data || data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h]?.toString() || ''
      // Escape quotes and wrap in quotes if contains comma
      if (val.includes(',') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(','))
  ].join('\n')
  
  downloadFile(csv, filename, 'text/csv')
}

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

// Download SKU CSV template
export function downloadSkuTemplate() {
  const template = 'SKU Code,Product Name,Stock\nACC-BLK-001,Black Accessory,10\nACC-WHT-002,White Accessory,5\nACC-GRY-003,Grey Accessory,0'
  downloadFile(template, 'sku-template.csv', 'text/csv')
}

// Download Revenue CSV template
export function downloadRevenueTemplate() {
  const template = 'Month,Revenue,Orders\n2026-01,500.00,15\n2026-02,750.00,22\n2026-03,600.00,18'
  downloadFile(template, 'revenue-template.csv', 'text/csv')
}

// Read file as text
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

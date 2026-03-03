// Markdown Editor Component
import { sanitizeInput } from '../utils/sanitize.js'
import { icon } from '../utils/icons.js'

export function createMarkdownEditor(options) {
  const {
    container,
    initialValue = '',
    onChange,
    placeholder = 'Start typing...'
  } = options
  
  let isPreview = false
  let value = initialValue
  
  function render() {
    container.innerHTML = `
      <div class="markdown-editor">
        <div class="markdown-toolbar">
          <div class="toolbar-group">
            <button type="button" class="toolbar-btn m-touch ${!isPreview ? 'active' : ''}" onclick="togglePreview()" title="Edit">
              ${icon('pencil', 'toolbar-icon')} Edit
            </button>
            <button type="button" class="toolbar-btn m-touch ${isPreview ? 'active' : ''}" onclick="togglePreview()" title="Preview">
              ${icon('eye', 'toolbar-icon')} Preview
            </button>
          </div>
          
          <div class="toolbar-group">
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('**', '**')" title="Bold">
              ${icon('bold', 'toolbar-icon')}
            </button>
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('*', '*')" title="Italic">
              ${icon('italic', 'toolbar-icon')}
            </button>
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('# ', '')" title="Heading">
              ${icon('heading', 'toolbar-icon')}
            </button>
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('- ', '')" title="List">
              ${icon('list', 'toolbar-icon')}
            </button>
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('[]()', '')" title="Link">
              ${icon('link', 'toolbar-icon')}
            </button>
            <button type="button" class="toolbar-btn m-touch" onclick="insertMarkdown('\`\`\`\n', '\n\`\`\`')" title="Code">
              ${icon('code', 'toolbar-icon')}
            </button>
          </div>
          
          <div class="toolbar-group">
            <button type="button" class="toolbar-btn m-touch" onclick="showMarkdownHelp()" title="Help">
              ${icon('help-circle', 'toolbar-icon')}
            </button>
          </div>
        </div>
        
        ${isPreview ? `
          <div class="markdown-preview">
            ${renderMarkdown(value) || `<span class="placeholder">${placeholder}</span>`}
          </div>
        ` : `
          <textarea 
            class="markdown-textarea"
            placeholder="${placeholder}"
            oninput="handleMarkdownInput(this.value)"
          >${escapeHtml(value)}</textarea>
        `}
      </div>
    `
  }
  
  function renderMarkdown(text) {
    if (!text) return ''
    
    // Simple markdown parser
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      
      // Lists
      .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
      .replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      
      // Line breaks
      .replace(/\n/g, '<br>')
    
    return html
  }
  
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
  
  window.togglePreview = () => {
    isPreview = !isPreview
    render()
  }
  
  window.handleMarkdownInput = (newValue) => {
    value = newValue
    if (onChange) onChange(newValue)
  }
  
  window.insertMarkdown = (before, after) => {
    if (isPreview) return
    
    const textarea = container.querySelector('.markdown-textarea')
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)
    const replacement = before + selected + after
    
    value = value.substring(0, start) + replacement + value.substring(end)
    
    // Update textarea
    textarea.value = value
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + replacement.length - after.length)
    
    if (onChange) onChange(value)
  }
  
  window.showMarkdownHelp = () => {
    const helpText = `
# Markdown Help

**Bold**: **text** or __text__
*Italic*: *text* or _text_
# Heading 1: # text
## Heading 2: ## text
### Heading 3: ### text
- List item: - text
[Link](url): [text](https://example.com)
\`Code\`: \`text\`
\`\`\`Code block\`\`\`
    `
    
    alert(helpText.trim())
  }
  
  render()
  
  return {
    getValue: () => value,
    setValue: (newValue) => {
      value = newValue
      render()
    },
    destroy: () => {
      container.innerHTML = ''
    }
  }
}

// Simple markdown renderer for display
export function renderMarkdown(text) {
  if (!text) return ''
  
  return text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    
    // Lists
    .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    
    // Line breaks
    .replace(/\n/g, '<br>')
}

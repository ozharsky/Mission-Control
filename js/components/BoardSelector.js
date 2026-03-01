import { store } from '../state/store.js'

const BOARDS = [
  { id: 'all', label: 'All', icon: '🏢' },
  { id: 'etsy', label: 'Etsy', icon: '🛒' },
  { id: 'photography', label: 'Photo', icon: '📸' },
  { id: 'wholesale', label: 'B2B', icon: '🏪' },
  { id: '3dprint', label: '3D Print', icon: '🖨️' }
]

export function createBoardSelector(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const currentBoard = store.get('currentBoard') || 'all'
    
    container.innerHTML = `
      <div class="board-selector" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
        ${BOARDS.map(board => `
          <button 
            class="filter-btn ${currentBoard === board.id ? 'active' : ''}"
            onclick="switchBoard('${board.id}', this)"
            style="display: flex; align-items: center; gap: 0.5rem;"
          >
            <span>${board.icon}</span>
            <span>${board.label}</span>
          </button>
        `).join('')}
      </div>
    `
  }
  
  // Expose switch function globally
  window.switchBoard = (boardId, btn) => {
    store.set('currentBoard', boardId)
    
    // Update all board buttons
    document.querySelectorAll('.board-selector .filter-btn').forEach(b => b.classList.remove('active'))
    if (btn) btn.classList.add('active')
    
    // Trigger re-render of sections that filter by board
    store.notify('currentBoard')
  }
  
  store.subscribe((state, path) => {
    if (path === 'currentBoard') render()
  })
  
  render()
  return { render }
}

// Helper function to filter items by current board
export function filterByBoard(items, boardField = 'board') {
  if (!Array.isArray(items)) return []
  const currentBoard = store.get('currentBoard') || 'all'
  if (currentBoard === 'all') return items
  
  return items.filter(item => {
    const itemBoard = item[boardField]
    return itemBoard === currentBoard || itemBoard === 'all' || !itemBoard
  })
}

// Get current board label
export function getCurrentBoardLabel() {
  const currentBoard = store.get('currentBoard') || 'all'
  const board = BOARDS.find(b => b.id === currentBoard)
  return board?.label || 'All'
}

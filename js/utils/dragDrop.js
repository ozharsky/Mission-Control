// Improved Drag and Drop utility using SortableJS pattern
// More reliable cross-browser support

export function createDraggableList(options) {
  const {
    container,
    items,
    onReorder,
    renderItem,
    keyField = 'id',
    handle = '.drag-handle', // CSS selector for drag handle
    animation = 150
  } = options
  
  let draggedElement = null
  let placeholder = null
  let startIndex = null
  
  // Create wrapper for positioning
  const wrapper = document.createElement('div')
  wrapper.className = 'draggable-list-wrapper'
  container.appendChild(wrapper)
  
  function init() {
    render()
    attachGlobalListeners()
  }
  
  function render() {
    wrapper.innerHTML = items.map((item, index) => {
      const content = renderItem(item, index)
      return `
        <div class="draggable-item"
             data-index="${index}"
             data-key="${item[keyField]}"
             data-id="${item[keyField]}"
             draggable="false"
             style="position: relative; transition: transform ${animation}ms;"
        >
          <div class="drag-handle" style="cursor: grab; user-select: none;"
               onmousedown="event.stopPropagation();"
          >⋮⋮</div>
          <div class="draggable-content" style="flex: 1;">${content}</div>
        </div>
      `
    }).join('')
    
    // Attach handle listeners only (not the whole item)
    wrapper.querySelectorAll(handle).forEach((h, index) => {
      h.addEventListener('mousedown', (e) => startDrag(e, index))
      h.addEventListener('touchstart', (e) => startDrag(e, index), { passive: false })
    })
  }
  
  function startDrag(e, index) {
    e.preventDefault()
    e.stopPropagation()
    
    const item = wrapper.children[index]
    if (!item) return
    
    draggedElement = item
    startIndex = index
    
    // Create placeholder
    placeholder = document.createElement('div')
    placeholder.className = 'drag-placeholder'
    placeholder.style.height = item.offsetHeight + 'px'
    placeholder.style.background = 'rgba(99, 102, 241, 0.1)'
    placeholder.style.border = '2px dashed var(--accent-primary)'
    placeholder.style.borderRadius = 'var(--radius)'
    placeholder.style.marginBottom = '0.5rem'
    
    // Style dragged element
    draggedElement.style.position = 'fixed'
    draggedElement.style.zIndex = '9999'
    draggedElement.style.width = item.offsetWidth + 'px'
    draggedElement.style.opacity = '0.9'
    draggedElement.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
    draggedElement.style.pointerEvents = 'none'
    draggedElement.classList.add('dragging')
    
    // Insert placeholder
    wrapper.insertBefore(placeholder, item.nextSibling)
    
    // Position at cursor
    updateDragPosition(e)
    
    // Add dragging class to wrapper
    wrapper.classList.add('is-dragging')
  }
  
  function updateDragPosition(e) {
    if (!draggedElement) return
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    draggedElement.style.left = (clientX - draggedElement.offsetWidth / 2) + 'px'
    draggedElement.style.top = (clientY - 20) + 'px'
  }
  
  function onDragMove(e) {
    if (!draggedElement) return
    
    e.preventDefault()
    updateDragPosition(e)
    
    // Find element below
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    draggedElement.style.display = 'none'
    const below = document.elementFromPoint(clientX, clientY)
    draggedElement.style.display = ''
    
    const belowItem = below?.closest('.draggable-item')
    
    if (belowItem && belowItem !== draggedElement && belowItem !== placeholder) {
      const rect = belowItem.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      
      if (clientY < midpoint) {
        wrapper.insertBefore(placeholder, belowItem)
      } else {
        wrapper.insertBefore(placeholder, belowItem.nextSibling)
      }
    }
  }
  
  function onDragEnd(e) {
    if (!draggedElement) return
    
    // Calculate new index
    const newIndex = Array.from(wrapper.children).indexOf(placeholder)
    
    // Clean up styles
    draggedElement.style.position = ''
    draggedElement.style.zIndex = ''
    draggedElement.style.width = ''
    draggedElement.style.opacity = ''
    draggedElement.style.boxShadow = ''
    draggedElement.style.pointerEvents = ''
    draggedElement.style.left = ''
    draggedElement.style.top = ''
    draggedElement.classList.remove('dragging')
    
    // Move element to placeholder position
    if (placeholder.parentNode) {
      wrapper.insertBefore(draggedElement, placeholder)
      placeholder.remove()
    }
    
    wrapper.classList.remove('is-dragging')
    
    // Trigger reorder if changed
    if (newIndex !== -1 && newIndex !== startIndex && startIndex !== null) {
      const newItems = [...items]
      const [movedItem] = newItems.splice(startIndex, 1)
      
      // Adjust index if moving down
      const adjustedIndex = newIndex > startIndex ? newIndex - 1 : newIndex
      newItems.splice(adjustedIndex, 0, movedItem)
      
      // Update order property
      newItems.forEach((item, idx) => {
        item.order = idx
      })
      
      onReorder(newItems)
    }
    
    draggedElement = null
    placeholder = null
    startIndex = null
  }
  
  function attachGlobalListeners() {
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
    document.addEventListener('touchmove', onDragMove, { passive: false })
    document.addEventListener('touchend', onDragEnd)
  }
  
  function detachGlobalListeners() {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)
  }
  
  function updateItems(newItems) {
    items = newItems
    render()
  }
  
  function destroy() {
    detachGlobalListeners()
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper)
    }
  }
  
  init()
  
  return {
    updateItems,
    destroy
  }
}

// Simple sortable for kanban columns
export function createSortable(options) {
  const {
    container,
    group,
    onAdd,
    onRemove,
    onUpdate,
    handle = null
  } = options
  
  let draggedItem = null
  let sourceContainer = null
  
  function init() {
    // Make items draggable
    const items = container.querySelectorAll('.kanban-item, .sortable-item')
    items.forEach(item => {
      item.draggable = true
      item.addEventListener('dragstart', handleDragStart)
      item.addEventListener('dragend', handleDragEnd)
    })
    
    // Container events
    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)
    container.addEventListener('dragenter', handleDragEnter)
    container.addEventListener('dragleave', handleDragLeave)
  }
  
  function handleDragStart(e) {
    draggedItem = this
    sourceContainer = container
    this.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', this.dataset.id)
    
    // Delay opacity change for visual feedback
    setTimeout(() => {
      this.style.opacity = '0.5'
    }, 0)
  }
  
  function handleDragEnd(e) {
    this.classList.remove('dragging')
    this.style.opacity = '1'
    draggedItem = null
    sourceContainer = null
    
    // Remove all drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over')
    })
  }
  
  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Find insertion point
    const afterElement = getDragAfterElement(container, e.clientY)
    if (afterElement) {
      container.insertBefore(draggedItem, afterElement)
    } else {
      container.appendChild(draggedItem)
    }
  }
  
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-item:not(.dragging), .sortable-item:not(.dragging)')]
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element
  }
  
  function handleDrop(e) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    
    if (sourceContainer !== container) {
      // Moved from different container
      if (onAdd) onAdd(id, container.dataset.status)
    } else {
      // Reordered within same container
      if (onUpdate) onUpdate()
    }
  }
  
  function handleDragEnter(e) {
    e.preventDefault()
    container.classList.add('drag-over')
  }
  
  function handleDragLeave(e) {
    if (!container.contains(e.relatedTarget)) {
      container.classList.remove('drag-over')
    }
  }
  
  init()
  
  return {
    refresh: init,
    destroy: () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }
}

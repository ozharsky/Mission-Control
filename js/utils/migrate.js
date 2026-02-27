// Migration script from V3 to V4
// Run this in browser console: migrateV3ToV4(v3Data)

export function migrateV3ToV4(v3Data) {
  if (!v3Data) {
    console.error('No V3 data provided')
    return null
  }
  
  console.log('Starting V3 to V4 migration...')
  
  // Transform V3 data to V4 structure
  const v4Data = {
    // Core data
    priorities: migratePriorities(v3Data.priorities),
    projects: migrateProjects(v3Data.projects),
    notes: migrateNotes(v3Data.notes),
    
    // Business data
    revenueHistory: v3Data.revenueHistory || [],
    skus: v3Data.skus || [],
    leads: migrateLeads(v3Data.leads),
    events: v3Data.events || [],
    
    // Reference data
    documents: v3Data.documents || [],
    tags: v3Data.tags || [],
    boards: v3Data.boards || [],
    
    // Activity & tracking
    activities: v3Data.activities || [],
    activityTimeline: v3Data.activityTimeline || [],
    decisions: v3Data.decisions || [],
    intel: v3Data.intel || [],
    agents: v3Data.agents || [],
    timeline: v3Data.timeline || [],
    
    // Settings & config
    currentBoard: v3Data.currentBoard || 'all',
    orders: v3Data.orders || 127,
    ordersTarget: v3Data.ordersTarget || 150,
    revenueGoal: v3Data.revenueGoal || 5400,
    goalDate: v3Data.goalDate || '2026-05-01',
    avgOrderValue: v3Data.avgOrderValue || 25.99,
    totalRevenue: v3Data.totalRevenue || 3281.77,
    totalItems: v3Data.totalItems || 213,
    
    // Printer data
    printers: v3Data.printers || [],
    printerLastUpdate: v3Data.printerLastUpdate || Date.now(),
    
    // Notifications
    notifications: v3Data.notifications || [],
    
    // Version
    version: '4.0',
    _lastModified: Date.now()
  }
  
  console.log('Migration complete!')
  console.log(`- Priorities: ${v4Data.priorities.length}`)
  console.log(`- Projects: ${Object.values(v4Data.projects).flat().length}`)
  console.log(`- Notes: ${v4Data.notes.length}`)
  console.log(`- SKUs: ${v4Data.skus.length}`)
  console.log(`- Leads: ${v4Data.leads.length}`)
  console.log(`- Events: ${v4Data.events.length}`)
  console.log(`- Documents: ${v4Data.documents.length}`)
  
  return v4Data
}

function migratePriorities(v3Priorities) {
  if (!Array.isArray(v3Priorities)) return []
  
  return v3Priorities.map(p => ({
    id: p.id || Date.now() + Math.random(),
    text: p.text || 'Untitled',
    desc: p.desc || '',
    notes: p.notes || '',
    completed: p.completed || false,
    status: p.status || (p.completed ? 'done' : 'todo'),
    board: p.board || 'all',
    tags: p.tags || [],
    dueDate: p.dueDate || null,
    assignee: p.assignee || null,
    projectId: p.projectId || null,
    docPath: p.docPath || '',
    recurring: p.recurring || '',
    timeEstimate: p.timeEstimate || 0,
    timeSpent: p.timeSpent || 0,
    blockedBy: p.blockedBy || [],
    activityLog: p.activityLog || [],
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString()
  }))
}

function migrateProjects(v3Projects) {
  if (!v3Projects || typeof v3Projects !== 'object') {
    return { backlog: [], todo: [], inprogress: [], done: [] }
  }
  
  const migrated = { backlog: [], todo: [], inprogress: [], done: [] }
  
  // Migrate each status column
  Object.keys(v3Projects).forEach(status => {
    const projects = v3Projects[status]
    if (!Array.isArray(projects)) return
    
    const targetKey = status.toLowerCase()
    if (migrated[targetKey]) {
      migrated[targetKey] = projects.map(p => ({
        id: p.id || Date.now() + Math.random(),
        title: p.title || 'Untitled',
        desc: p.desc || '',
        board: p.board || 'all',
        status: p.status || targetKey,
        priority: p.priority || 'medium',
        tags: p.tags || [],
        dueDate: p.dueDate || null,
        priorityIds: p.priorityIds || [],
        docPath: p.docPath || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
      }))
    }
  })
  
  return migrated
}

function migrateNotes(v3Notes) {
  if (!v3Notes) {
    // Try to parse from string if it's the old format
    return []
  }
  
  if (typeof v3Notes === 'string') {
    // Old format was a markdown string - create a single note
    return [{
      id: Date.now(),
      title: 'Imported Notes',
      text: v3Notes,
      color: 'default',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]
  }
  
  if (Array.isArray(v3Notes)) {
    return v3Notes.map(n => ({
      id: n.id || Date.now() + Math.random(),
      title: n.title || '',
      text: n.text || n.content || '',
      color: n.color || 'default',
      pinned: n.pinned || false,
      createdAt: n.createdAt || new Date().toISOString(),
      updatedAt: n.updatedAt || new Date().toISOString()
    }))
  }
  
  return []
}

function migrateLeads(v3Leads) {
  if (!Array.isArray(v3Leads)) return []
  
  return v3Leads.map(l => ({
    id: l.id || Date.now() + Math.random(),
    name: l.name || 'Unknown',
    company: l.company || '',
    status: l.status || 'new',
    value: l.value || 0,
    board: l.board || 'all',
    notes: l.notes || '',
    lastContact: l.lastContact || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Export for use in store
export function importV3Data(v3Data, store) {
  const v4Data = migrateV3ToV4(v3Data)
  
  if (!v4Data) return false
  
  // Save to store
  Object.keys(v4Data).forEach(key => {
    store.set(key, v4Data[key])
  })
  
  return true
}

// Auto-migration check
export function checkAndMigrate(store) {
  const version = store.get('version')
  
  if (!version || version.startsWith('3.')) {
    console.log('Detected V3 data, migration needed')
    // Data will be migrated when importV3Data is called
    return true
  }
  
  return false
}
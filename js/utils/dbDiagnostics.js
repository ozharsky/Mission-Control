// Database Connection Diagnostic Tool
// Run this in browser console to check Firebase/GitHub connectivity

export async function diagnoseDatabaseConnection() {
  const results = {
    timestamp: new Date().toISOString(),
    localStorage: {},
    firebase: { configured: false, connected: false, error: null },
    github: { configured: false, connected: false, error: null },
    dataStatus: {}
  }
  
  // Check localStorage config
  const firebaseUrl = localStorage.getItem('mc_firebase_url')
  const firebaseSecret = localStorage.getItem('mc_firebase_secret')
  const githubToken = localStorage.getItem('mc_github_token')
  const gistId = localStorage.getItem('mc_gist_id')
  
  results.localStorage = {
    hasFirebaseUrl: !!firebaseUrl,
    hasFirebaseSecret: !!firebaseSecret,
    hasGitHubToken: !!githubToken,
    hasGistId: !!gistId,
    firebaseUrl: firebaseUrl ? `${firebaseUrl.substring(0, 30)}...` : null
  }
  
  // Check Firebase
  if (firebaseUrl && firebaseSecret) {
    results.firebase.configured = true
    try {
      const res = await fetch(`${firebaseUrl}/.json?auth=${firebaseSecret}`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      results.firebase.connected = res.ok
      results.firebase.status = res.status
      if (!res.ok) {
        results.firebase.error = `HTTP ${res.status}: ${res.statusText}`
      }
    } catch (e) {
      results.firebase.error = e.message
    }
  }
  
  // Check GitHub
  if (githubToken && gistId) {
    results.github.configured = true
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { 'Authorization': `token ${githubToken}` }
      })
      results.github.connected = res.ok
      results.github.status = res.status
      if (!res.ok) {
        results.github.error = `HTTP ${res.status}: ${res.statusText}`
      }
    } catch (e) {
      results.github.error = e.message
    }
  }
  
  // Check local data
  const localData = localStorage.getItem('mc-data')
  results.dataStatus = {
    hasLocalData: !!localData,
    localDataSize: localData ? `${(localData.length / 1024).toFixed(2)} KB` : '0 KB'
  }
  
  if (localData) {
    try {
      const parsed = JSON.parse(localData)
      results.dataStatus.prioritiesCount = parsed.priorities?.length || 0
      results.dataStatus.projectsCount = Object.values(parsed.projects || {}).flat().length
      results.dataStatus.lastUpdated = parsed._lastSync || 'unknown'
    } catch (e) {
      results.dataStatus.parseError = e.message
    }
  }
  
  // Print results
  console.log('[DB] Database Connection Diagnostics')
  console.log('====================================')
  console.log('Timestamp:', results.timestamp)
  console.log('')
  console.log('[CFG] LocalStorage Config:')
  console.log('  - Firebase URL:', results.localStorage.hasFirebaseUrl ? 'YES' : 'NO')
  console.log('  - Firebase Secret:', results.localStorage.hasFirebaseSecret ? 'YES' : 'NO')
  console.log('  - GitHub Token:', results.localStorage.hasGitHubToken ? 'YES' : 'NO')
  console.log('  - Gist ID:', results.localStorage.hasGistId ? 'YES' : 'NO')
  console.log('')
  console.log('[FB] Firebase:')
  console.log('  - Configured:', results.firebase.configured ? 'YES' : 'NO')
  console.log('  - Connected:', results.firebase.connected ? 'YES' : 'NO')
  if (results.firebase.error) console.log('  - Error:', results.firebase.error)
  console.log('')
  console.log('[GH] GitHub:')
  console.log('  - Configured:', results.github.configured ? 'YES' : 'NO')
  console.log('  - Connected:', results.github.connected ? 'YES' : 'NO')
  if (results.github.error) console.log('  - Error:', results.github.error)
  console.log('')
  console.log('[Data] Local Data:')
  console.log('  - Has Data:', results.dataStatus.hasLocalData ? 'YES' : 'NO')
  console.log('  - Size:', results.dataStatus.localDataSize)
  console.log('  - Priorities:', results.dataStatus.prioritiesCount)
  console.log('  - Projects:', results.dataStatus.projectsCount)
  console.log('')
  
  // Recommendations
  console.log('[INFO] Recommendations:')
  if (!results.firebase.configured && !results.github.configured) {
    console.log('  [!] No cloud storage configured. Go to Settings and add Firebase or GitHub credentials.')
  }
  if (results.firebase.configured && !results.firebase.connected) {
    console.log('  [!] Firebase configured but not connecting. Check your URL and secret.')
  }
  if (results.github.configured && !results.github.connected) {
    console.log('  [!] GitHub configured but not connecting. Check your token and Gist ID.')
  }
  if (!results.dataStatus.hasLocalData) {
    console.log('  [!] No local data found. You may need to reload the page or add some data.')
  }
  
  return results
}

// Auto-run on load
if (typeof window !== 'undefined') {
  window.diagnoseDatabase = diagnoseDatabaseConnection
  console.log('[TIP] Run diagnoseDatabase() in console to check database connection')
}

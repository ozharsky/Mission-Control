// Firebase Configuration for Mission Control V5
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js'
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js'

// Firebase config - uses localStorage for credentials
function getFirebaseConfig() {
  return {
    apiKey: localStorage.getItem('mc_firebase_api_key') || '',
    authDomain: localStorage.getItem('mc_firebase_auth_domain') || '',
    databaseURL: localStorage.getItem('mc_firebase_url') || '',
    projectId: localStorage.getItem('mc_firebase_project_id') || '',
    storageBucket: localStorage.getItem('mc_firebase_storage_bucket') || '',
    messagingSenderId: localStorage.getItem('mc_firebase_messaging_sender_id') || '',
    appId: localStorage.getItem('mc_firebase_app_id') || ''
  }
}

// Initialize Firebase
let app = null
let database = null
let storage = null

export function initFirebase() {
  const config = getFirebaseConfig()
  
  // Only initialize if we have a database URL
  if (!config.databaseURL) {
    console.log('⚠️ Firebase not configured - set credentials in Settings')
    return null
  }
  
  try {
    app = initializeApp(config)
    database = getDatabase(app)
    storage = getStorage(app)
    console.log('✅ Firebase initialized')
    return { app, database, storage }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error)
    return null
  }
}

// Get Firebase instances
export function getFirebase() {
  if (!app) {
    return initFirebase()
  }
  return { app, database, storage }
}

// Export individual instances
export { app, database, storage }

// Auto-initialize on import
const firebase = initFirebase()
if (firebase) {
  app = firebase.app
  database = firebase.database
  storage = firebase.storage
}

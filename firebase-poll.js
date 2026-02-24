// Simple Firebase polling script for Mission Control
// This can be run to check data without browser access

const FIREBASE_URL = 'https://mission-control-sync-default-rtdb.firebaseio.com';

async function pollMissionControl() {
  try {
    // Try to fetch data from Firebase REST API
    // This requires the database rules to allow public read
    const response = await fetch(`${FIREBASE_URL}/missionControl.json`);
    
    if (!response.ok) {
      console.log('Firebase returned:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error polling Firebase:', error.message);
    return null;
  }
}

// Poll every 10 seconds
setInterval(async () => {
  const data = await pollMissionControl();
  if (data) {
    console.log('📊 Mission Control Data:');
    console.log('Priorities:', data.priorities?.length || 0);
    console.log('Projects:', 
      (data.projects?.backlog?.length || 0) + 
      (data.projects?.inprogress?.length || 0) + 
      (data.projects?.done?.length || 0)
    );
    console.log('Last update:', new Date().toLocaleTimeString());
    console.log('---');
  }
}, 10000);

console.log('🔍 Polling Mission Control every 10 seconds...');
console.log('Waiting for data...');

// Hybrid Storage: Firebase (real-time) + GitHub (backup/version history)
// Firebase = Source of truth for live data
// GitHub = Backup every 5 minutes + manual snapshots

class HybridStorage {
  constructor(config = {}) {
    // Firebase config
    this.firebaseUrl = config.firebaseUrl || 'https://mission-control-sync-default-rtdb.firebaseio.com/';
    this.firebaseSecret = config.firebaseSecret || localStorage.getItem('firebase_secret');
    
    // GitHub config
    this.githubToken = config.githubToken || localStorage.getItem('github_token');
    this.githubOwner = config.githubOwner || localStorage.getItem('github_owner') || 'ozharsky';
    this.githubRepo = config.githubRepo || localStorage.getItem('github_repo') || 'Mission-Control';
    
    // State
    this.data = null;
    this.listeners = [];
    this.lastBackup = 0;
    this.backupInterval = 5 * 60 * 1000; // 5 minutes
    this.isGitHubConfigured = !!(this.githubToken && this.githubOwner && this.githubRepo);
    this.isFirebaseConfigured = !!this.firebaseSecret;
    
    // Start backup timer
    if (this.isGitHubConfigured) {
      setInterval(() => this.backupToGitHub(), this.backupInterval);
    }
  }

  // Check configurations
  isReady() {
    return this.isFirebaseConfigured || this.isGitHubConfigured;
  }

  // Save config to localStorage
  saveConfig() {
    if (this.firebaseSecret) localStorage.setItem('firebase_secret', this.firebaseSecret);
    if (this.githubToken) localStorage.setItem('github_token', this.githubToken);
    if (this.githubOwner) localStorage.setItem('github_owner', this.githubOwner);
    if (this.githubRepo) localStorage.setItem('github_repo', this.githubRepo);
  }

  // ==================== FIREBASE (Real-time) ====================

  // Load from Firebase
  async loadFromFirebase() {
    if (!this.isFirebaseConfigured) throw new Error('Firebase not configured');
    
    const url = `${this.firebaseUrl}/missionControl.json?auth=${this.firebaseSecret}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firebase error: ${res.status}`);
    
    const data = await res.json();
    this.data = data || this.getDefaultData();
    return this.data;
  }

  // Save to Firebase
  async saveToFirebase(data) {
    if (!this.isFirebaseConfigured) throw new Error('Firebase not configured');
    
    data.lastUpdated = Date.now();
    const url = `${this.firebaseUrl}/missionControl.json?auth=${this.firebaseSecret}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) throw new Error(`Firebase save failed: ${res.status}`);
    this.data = data;
    
    // Trigger backup to GitHub (debounced)
    this.debouncedBackup();
    
    return data;
  }

  // Listen for real-time updates
  startRealtimeSync(callback) {
    if (!this.isFirebaseConfigured) return;
    
    // Poll every 2 seconds (Firebase REST doesn't support true websockets without SDK)
    this.syncInterval = setInterval(async () => {
      try {
        const fresh = await this.loadFromFirebase();
        if (JSON.stringify(fresh) !== JSON.stringify(this.data)) {
          this.data = fresh;
          callback(fresh);
        }
      } catch (e) {
        console.log('Sync poll failed:', e.message);
      }
    }, 2000);
  }

  stopRealtimeSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  // ==================== GITHUB (Backup/Version History) ====================

  // Backup to GitHub (creates commit)
  async backupToGitHub() {
    if (!this.isGitHubConfigured || !this.data) return;
    
    // Don't backup if recently backed up
    if (Date.now() - this.lastBackup < 60000) return; // Min 1 min between backups
    
    const path = 'data/mc-data.json';
    const apiBase = 'https://api.github.com';
    const branch = 'main'; // Your repo uses 'main'
    
    try {
      // Get current file SHA (may not exist)
      let sha = null;
      try {
        const getRes = await fetch(`${apiBase}/repos/${this.githubOwner}/${this.githubRepo}/contents/${path}?ref=${branch}`, {
          headers: { 'Authorization': `token ${this.githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (getRes.ok) {
          const fileInfo = await getRes.json();
          sha = fileInfo.sha;
        }
      } catch (e) {
        // File doesn't exist yet
      }
      
      // Create/update file
      // Use Unicode-safe base64 encoding
      const jsonStr = JSON.stringify(this.data, null, 2);
      const bytes = new TextEncoder().encode(jsonStr);
      const content = btoa(String.fromCharCode(...bytes));
      
      const body = {
        message: `Auto-backup: ${new Date().toISOString()}`,
        content: content,
        branch: branch
      };
      if (sha) body.sha = sha;
      
      const putRes = await fetch(`${apiBase}/repos/${this.githubOwner}/${this.githubRepo}/contents/${path}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `token ${this.githubToken}`, 
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (putRes.ok) {
        this.lastBackup = Date.now();
        console.log('✅ Backed up to GitHub');
      }
    } catch (e) {
      console.error('GitHub backup failed:', e);
    }
  }

  // Manual snapshot (immediate GitHub commit)
  async createSnapshot(message) {
    if (!this.isGitHubConfigured) throw new Error('GitHub not configured');
    if (!this.data) throw new Error('No data to snapshot');
    
    console.log('Starting snapshot, data size:', JSON.stringify(this.data).length, 'bytes');
    
    const path = 'data/mc-data.json';
    const apiBase = 'https://api.github.com';
    const branch = 'main'; // Your repo uses 'main' not 'master'
    
    // Get current SHA (file may not exist yet)
    let sha = null;
    try {
      const getRes = await fetch(`${apiBase}/repos/${this.githubOwner}/${this.githubRepo}/contents/${path}?ref=${branch}`, {
        headers: { 'Authorization': `token ${this.githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
        console.log('Existing file found, updating...');
      } else if (getRes.status === 404) {
        // File doesn't exist, that's ok - we'll create it
        console.log('File does not exist yet, creating new...');
      } else {
        console.log('Unexpected response:', getRes.status);
      }
    } catch (e) {
      // Network error or other issue
      console.log('Fetch error (will try to create new file):', e.message);
    }
    
    // Create commit
    // Use Unicode-safe base64 encoding
    const jsonStr = JSON.stringify(this.data, null, 2);
    const bytes = new TextEncoder().encode(jsonStr);
    const content = btoa(String.fromCharCode(...bytes));
    
    const body = {
      message: `Snapshot: ${message} - ${new Date().toISOString()}`,
      content: content,
      branch: branch
    };
    if (sha) body.sha = sha;
    
    console.log('Creating/updating file with SHA:', sha || 'none (new file)');
    
    const putRes = await fetch(`${apiBase}/repos/${this.githubOwner}/${this.githubRepo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `token ${this.githubToken}`, 
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('PUT response status:', putRes.status);
    
    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error('GitHub API error:', errorText);
      throw new Error(`Snapshot failed: ${putRes.status}`);
    }
    this.lastBackup = Date.now();
    return true;
  }

  // ==================== HYBRID METHODS ====================

  // Load (Firebase preferred, GitHub fallback)
  async load() {
    if (this.isFirebaseConfigured) {
      try {
        return await this.loadFromFirebase();
      } catch (e) {
        console.log('Firebase load failed, trying GitHub:', e.message);
      }
    }
    
    if (this.isGitHubConfigured) {
      try {
        const path = 'data/mc-data.json';
        const apiBase = 'https://api.github.com';
        const res = await fetch(`${apiBase}/repos/${this.githubOwner}/${this.githubRepo}/contents/${path}`, {
          headers: { 'Authorization': `token ${this.githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (res.ok) {
          const fileInfo = await res.json();
          const content = atob(fileInfo.content);
          this.data = JSON.parse(content);
          return this.data;
        }
      } catch (e) {
        console.log('GitHub load failed:', e.message);
      }
    }
    
    // Final fallback: localStorage
    const local = localStorage.getItem('mc-data');
    if (local) {
      this.data = JSON.parse(local);
      return this.data;
    }
    
    // Default data
    this.data = this.getDefaultData();
    return this.data;
  }

  // Save (Firebase + debounced GitHub backup)
  async save(data) {
    this.data = data;
    
    // Always save to localStorage as emergency backup
    localStorage.setItem('mc-data', JSON.stringify(data));
    
    // Save to Firebase
    if (this.isFirebaseConfigured) {
      try {
        await this.saveToFirebase(data);
      } catch (e) {
        console.error('Firebase save failed:', e);
      }
    }
    
    return data;
  }

  // Debounced backup
  debouncedBackup() {
    if (this.backupTimeout) clearTimeout(this.backupTimeout);
    this.backupTimeout = setTimeout(() => this.backupToGitHub(), 30000); // 30 sec delay
  }

  // ==================== DEFAULT DATA ====================

  getDefaultData() {
    return {
      orders: 125,
      ordersTarget: 150,
      goalDate: '2026-05-01',
      revenueGoal: 5400,
      totalRevenue: 3248.80,
      monthlyRevenueGoal: 450,
      revenueHistory: [
        { month: 'Sep 2025', revenue: 198.48, orders: 12 },
        { month: 'Oct 2025', revenue: 12.00, orders: 1 },
        { month: 'Nov 2025', revenue: 107.12, orders: 5 },
        { month: 'Dec 2025', revenue: 582.69, orders: 25 },
        { month: 'Jan 2026', revenue: 110.45, orders: 4 },
        { month: 'Feb 2026', revenue: 398.50, orders: 6 }
      ],
      priorities: [
        { id: 1, text: 'Update Etsy SEO', completed: false, tags: ['urgent', 'seo'], dueDate: '2026-02-24', board: 'etsy' },
        { id: 2, text: 'Follow up on NYC event quote', completed: false, tags: ['urgent', 'client'], dueDate: '2026-02-26', board: 'photography' }
      ],
      projects: { backlog: [], inprogress: [], done: [] },
      timeline: [],
      leads: [],
      events: [],
      lastUpdated: Date.now()
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.HybridStorage = HybridStorage;
}

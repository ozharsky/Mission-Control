// GitHub Storage Adapter for Mission Control
// Uses GitHub API to read/write data as JSON files
// Enables version control, backup, and sync across devices

class GitHubStorage {
  constructor(config = {}) {
    this.token = config.token || localStorage.getItem('github_token');
    this.owner = config.owner || localStorage.getItem('github_owner') || 'ozharsky';
    this.repo = config.repo || localStorage.getItem('github_repo') || 'mission-control';
    this.branch = config.branch || 'main';
    this.apiBase = 'https://api.github.com';
    this.dataPath = 'data/mc-data.json';
    this.activityPath = 'data/mc-activity.json';
  }

  // Check if configured
  isConfigured() {
    return !!(this.token && this.owner && this.repo);
  }

  // Save configuration
  saveConfig() {
    localStorage.setItem('github_token', this.token);
    localStorage.setItem('github_owner', this.owner);
    localStorage.setItem('github_repo', this.repo);
  }

  // Clear configuration
  clearConfig() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_owner');
    localStorage.removeItem('github_repo');
    this.token = null;
  }

  // Make authenticated API request
  async api(method, endpoint, body = null) {
    const url = `${this.apiBase}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`GitHub API ${response.status}: ${error.message}`);
    }

    return response.json();
  }

  // Get file content and SHA
  async getFile(path) {
    try {
      const data = await this.api('GET', `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`);
      const content = atob(data.content);
      return { content: JSON.parse(content), sha: data.sha };
    } catch (e) {
      if (e.message.includes('404')) {
        return { content: null, sha: null };
      }
      throw e;
    }
  }

  // Create or update file
  async putFile(path, content, sha = null) {
    const message = `Update ${path} - ${new Date().toISOString()}`;
    const body = {
      message,
      content: btoa(JSON.stringify(content, null, 2)),
      branch: this.branch
    };
    if (sha) body.sha = sha;

    return this.api('PUT', `/repos/${this.owner}/${this.repo}/contents/${path}`, body);
  }

  // Load data from GitHub
  async loadData() {
    const { content } = await this.getFile(this.dataPath);
    return content || this.getDefaultData();
  }

  // Save data to GitHub
  async saveData(data) {
    const { sha } = await this.getFile(this.dataPath);
    data.lastUpdated = Date.now();
    return this.putFile(this.dataPath, data, sha);
  }

  // Add activity entry
  async addActivity(entry) {
    const { content, sha } = await this.getFile(this.activityPath);
    const activities = content || [];
    
    activities.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    });

    // Keep only last 100 entries
    if (activities.length > 100) activities.shift();

    return this.putFile(this.activityPath, activities, sha);
  }

  // Get activity log
  async getActivity() {
    const { content } = await this.getFile(this.activityPath);
    return content || [];
  }

  // Default data structure
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
        { month: 'Oct 2025', revenue: 12, orders: 1 },
        { month: 'Nov 2025', revenue: 107.12, orders: 5 },
        { month: 'Dec 2025', revenue: 582.69, orders: 25 },
        { month: 'Jan 2026', revenue: 110.45, orders: 4 },
        { month: 'Feb 2026', revenue: 398.50, orders: 6 }
      ],
      priorities: [
        { id: 1, text: 'Update Etsy SEO', completed: false, tags: ['urgent', 'seo'], dueDate: '2026-02-24', board: 'etsy' },
        { id: 2, text: 'Follow up on NYC event quote', completed: false, tags: ['urgent', 'client'], dueDate: '2026-02-26', board: 'photography' },
        { id: 3, text: 'Research magnetic closure cases', completed: false, tags: ['research'], dueDate: '2026-03-05', board: 'etsy' },
        { id: 4, text: 'Apply for Artist Trust GAP Grant', completed: false, tags: ['grant', 'photo'], dueDate: '2026-03-15', board: 'photography' },
        { id: 5, text: 'Create 4 bundle listings', completed: false, tags: ['listing', 'urgent'], dueDate: '2026-02-28', board: 'etsy' }
      ],
      projects: {
        backlog: [
          { id: 101, title: 'Create 4 bundle listings', desc: 'Multi-color matched pairs', tags: ['listing', 'etsy'], board: 'etsy' },
          { id: 102, title: 'Apply for Artist Trust GAP Grant', desc: '$1,500 photography grant', tags: ['grant', 'photo'], board: 'photography' },
          { id: 103, title: 'Build Nicotine Pouch Calculator', desc: 'Lead generation tool', tags: ['marketing'], board: 'marketing' }
        ],
        inprogress: [
          { id: 201, title: 'Update Etsy SEO', desc: 'Add Made in USA, new keywords', tags: ['urgent', 'seo', 'etsy'], board: 'etsy' },
          { id: 202, title: 'Follow up on NYC event quote', desc: '$7,500-9,000 photography job', tags: ['urgent', 'client', 'photo'], board: 'photography' }
        ],
        done: [
          { id: 301, title: 'Optimize 7 Etsy listings', desc: 'Removed 3D printed, added Precision-crafted', tags: ['seo', 'etsy'], board: 'etsy' },
          { id: 302, title: 'Create NYC event quote', desc: 'HTML quote page for client', tags: ['client', 'photo'], board: 'photography' }
        ]
      },
      timeline: [
        { id: 1, title: 'Foundation Phase', date: 'Jan-Feb 2026', desc: 'Core systems', status: 'completed', milestones: [{ text: 'Launch website', completed: true }, { text: 'Create SKU system', completed: true }] },
        { id: 2, title: 'Growth Phase', date: 'Mar-Apr 2026', desc: 'Scale operations', status: 'active', milestones: [{ text: 'Reach 15 orders/month', completed: false }, { text: 'Launch bundles', completed: false }] },
        { id: 3, title: 'Scale Phase', date: 'May 2026+', desc: 'Hit targets', status: 'pending', milestones: [{ text: 'Reach 20 orders/month', completed: false }] }
      ],
      leads: [
        { id: 1, name: 'Soulshine Cannabis', company: 'Cannabis Producer', status: 'new', value: 2500, notes: 'Renton, WA' },
        { id: 2, name: "Uncle Ike's", company: 'Dispensary Chain', status: 'new', value: 1500, notes: 'Seattle locations' }
      ],
      events: [
        { id: 1, name: 'Emerald Cup Bellevue', date: '2026-04-24', type: 'cannabis', location: 'Bellevue, WA' },
        { id: 2, name: 'Hall of Flowers Ventura', date: '2026-03-18', type: 'cannabis', location: 'Ventura, CA' }
      ],
      lastUpdated: Date.now()
    };
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.GitHubStorage = GitHubStorage;
}

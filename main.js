  // Advanced GitHub Stats with Smart Analytics
  class GitHubActivityTracker {
    constructor(username) {
      this.username = username;
      this.cacheKey = `github-activity-${username}`;
      this.cacheDuration = 60 * 60 * 1000; // 1 hour
    }

    async getActivity() {
      this.updateStatus('ANALYZING CODE ACTIVITY...', 'fetching');
      
      const cached = this.getCachedData();
      
      if (cached && !this.isCacheExpired(cached)) {
        this.updateStatus('DATA SYNCED • AUTO UPDATE IN 1H', 'success');
        this.startCacheTimer(cached.timestamp);
        return cached.data;
      }

      try {
        const freshData = await this.fetchGitHubData();
        this.setCachedData(freshData);
        this.updateStatus('DATA SYNCED • AUTO UPDATE IN 1H', 'success');
        this.startCacheTimer(Date.now());
        return freshData;
      } catch (error) {
        console.error('GitHub API error:', error);
        this.updateStatus('OFFLINE MODE • USING CACHED DATA', 'error');
        return cached ? cached.data : this.getDefaultData();
      }
    }

    async fetchGitHubData() {
      // Get all repositories
      const repos = await this.fetchAllRepos();
      
      // Analyze languages across all repos
      const languages = this.analyzeLanguages(repos);
      
      // Get top repository by stars
      const topRepo = this.findTopRepo(repos);
      
      // Analyze commit activity (estimated)
      const commitStats = await this.analyzeCommitActivity(repos);
      
      // Calculate coding frequency
      const frequencyStats = this.calculateFrequency(commitStats);

      return {
        languages,
        topRepo,
        commitStats,
        frequencyStats,
        lastUpdated: new Date().toISOString()
      };
    }

    async fetchAllRepos() {
      let allRepos = [];
      let page = 1;
      
      while (page <= 5) { // Limit to 500 repos
        const response = await fetch(
          `https://api.github.com/users/${this.username}/repos?per_page=100&page=${page}&sort=updated`
        );
        if (!response.ok) throw new Error('API limit exceeded');
        
        const repos = await response.json();
        if (repos.length === 0) break;
        
        allRepos = allRepos.concat(repos);
        page++;
      }
      
      return allRepos;
    }

    analyzeLanguages(repos) {
      const languageMap = {};
      
      repos.forEach(repo => {
        if (repo.language) {
          languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
        }
      });
      
      // Get top 6 languages
      return Object.entries(languageMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([lang]) => lang);
    }

    findTopRepo(repos) {
      if (repos.length === 0) return null;
      
      return repos.reduce((top, repo) => {
        return (!top || repo.stargazers_count > top.stargazers_count) ? repo : top;
      });
    }

    async analyzeCommitActivity(repos) {
      // Estimate commits based on repo activity
      const totalCommits = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const recentActivity = repos.filter(repo => {
        const lastUpdated = new Date(repo.updated_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastUpdated > thirtyDaysAgo;
      }).length;

      return {
        totalRepos: repos.length,
        activeRepos: recentActivity,
        estimatedCommits: Math.floor(totalCommits / 2) // Rough estimate
      };
    }

    calculateFrequency(commitStats) {
      const activityLevel = commitStats.activeRepos / commitStats.totalRepos;
      
      if (activityLevel > 0.7) return { level: 'HIGH', description: 'Very Active' };
      if (activityLevel > 0.4) return { level: 'MEDIUM', description: 'Consistent' };
      if (activityLevel > 0.2) return { level: 'MODERATE', description: 'Regular' };
      return { level: 'CASUAL', description: 'Occasional' };
    }

    // Cache management
    getCachedData() {
      const cached = sessionStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    }

    setCachedData(data) {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    }

    isCacheExpired(cached) {
      return Date.now() - cached.timestamp > this.cacheDuration;
    }

    // Timer for cache updates
    startCacheTimer(timestamp) {
      const updateCache = () => {
        this.setCachedData(this.getDefaultData()); // Clear cache to force refresh
        this.displayActivity(); // Refresh display
      };

      // Auto-refresh every hour
      setInterval(updateCache, this.cacheDuration);
      
      // Update timer display
      this.updateTimerDisplay(timestamp);
    }

    updateTimerDisplay(timestamp) {
      const timerElement = document.getElementById('cacheTimer');
      if (!timerElement) return;

      const updateTime = () => {
        const now = Date.now();
        const nextUpdate = timestamp + this.cacheDuration;
        const timeLeft = nextUpdate - now;
        
        if (timeLeft <= 0) {
          timerElement.textContent = 'UPDATING NOW...';
          return;
        }
        
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timerElement.textContent = `Next sync: ${minutes}m ${seconds}s`;
      };

      updateTime();
      setInterval(updateTime, 1000);
    }

    updateStatus(message, type) {
      const statusElement = document.getElementById('githubStatus');
      const statusDot = document.getElementById('githubStatusDot');
      
      if (statusElement) {
        statusElement.textContent = message;
        
        if (statusDot) {
          statusDot.style.background = 
            type === 'success' ? 'var(--accent-3)' :
            type === 'error' ? 'var(--accent-2)' :
            type === 'fetching' ? 'var(--accent)' : 'var(--dim)';
        }
      }
    }

    getDefaultData() {
      return {
        languages: ['JavaScript', 'Python', 'HTML', 'CSS'],
        topRepo: { name: 'Loading...', stargazers_count: 0, forks_count: 0 },
        commitStats: { totalRepos: 0, activeRepos: 0, estimatedCommits: 0 },
        frequencyStats: { level: 'UNKNOWN', description: 'Analyzing...' },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Display functions
  async function displayGitHubActivity() {
    const tracker = new GitHubActivityTracker('MuzamilAliSuleman'); // Your GitHub username
    const activity = await tracker.getActivity();
    
    displayLanguages(activity.languages);
    displayTopRepo(activity.topRepo);
    displayCommitStats(activity.commitStats);
    displayFrequencyStats(activity.frequencyStats);
  }

  function displayLanguages(languages) {
    const container = document.getElementById('topLanguages');
    if (!container) return;
    
    container.innerHTML = languages.map(lang => 
      `<div class="language-tag">${lang}</div>`
    ).join('');
  }

  function displayTopRepo(repo) {
    const container = document.getElementById('topRepo');
    if (!container || !repo.name) return;
    
    container.innerHTML = `
      <div class="repo-name">${repo.name}</div>
      <div class="repo-details">
        <span class="repo-stat">⭐ ${repo.stargazers_count || 0}</span>
        <span class="repo-stat">🍴 ${repo.forks_count || 0}</span>
      </div>
    `;
  }

  function displayCommitStats(stats) {
    const container = document.getElementById('commitStats');
    if (!container) return;
    
    container.innerHTML = `
      <div class="commit-count">${stats.estimatedCommits}+</div>
      <div class="commit-trend">across ${stats.totalRepos} repos</div>
      <div class="activity-bars">
        ${Array.from({length: 7}, (_, i) => 
          `<div class="activity-bar" style="height: ${10 + Math.random() * 15}px"></div>`
        ).join('')}
      </div>
    `;
  }

  function displayFrequencyStats(stats) {
    const container = document.getElementById('frequencyStats');
    if (!container) return;
    
    container.innerHTML = `
      <div class="frequency-level">${stats.level}</div>
      <div class="frequency-desc">${stats.description}</div>
    `;
  }

  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', function() {
    displayGitHubActivity();
    // Your existing cursor and scroll code
    const cursor = document.querySelector('.custom-cursor');
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    document.querySelector('.cta-button').addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('#contact').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    });
  });
  // ========== HACKER STATS (YOUR COUNTER + LEETCODE) ==========
  


async function updateViews() {
  const VIEW_KEY = "last_view";
  const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in ms
  const now = Date.now();
  const lastViewed = sessionStorage.getItem(VIEW_KEY);

  let shouldIncrement = false;

  if (!lastViewed) {
    // First time visitor ever
    shouldIncrement = true;
  } else if (now - parseInt(lastViewed) > THIRTY_MINUTES) {
    // More than 30 minutes since last count
    shouldIncrement = true;
  }


  if (shouldIncrement) {
    try {
      let res = await fetch("/get_views");
      let ans  = await res.json();
      if(ans.count == -1){
        document.getElementById("viewCount").innerText = "150+";
        console.log("View count failed (offline?)");
        return;
      }
      sessionStorage.setItem("views",ans.count);
      sessionStorage.setItem(VIEW_KEY, now.toString());
      document.getElementById("viewCount").innerText = ans.count;
    }

     catch(e) {
      console.log("1View count failed (offline?)");
    }

}else{
document.getElementById("viewCount").innerText = sessionStorage.getItem("views");

}
}
async function updateLeetCode() {
  const LAST_FETCH_KEY = "leetcode_last_fetch";
  const DATA_KEY = "leetcode_data";
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const now = Date.now();

  // 1. Try to load from Cache
  const cached = sessionStorage.getItem(DATA_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Only render if the data is actually valid
      if (parsed && (parsed.solvedProblem || parsed.totalSolved)) {
        renderLeetCodeUI(parsed);
      }
    } catch (e) {
      console.error("LeetCode cache error");
    }
  }

  // 2. Decide if we need to fetch fresh data
  const lastFetched = sessionStorage.getItem(LAST_FETCH_KEY);
  if (!lastFetched || (now - parseInt(lastFetched) > THIRTY_MINUTES)) {
    try {
      const res = await fetch(`/get_leetcode_stats`);
      const result = await res.json();
      
      // Your FastAPI returns {"data": {...}}
      const freshData = result.data;

      // GUARD: Only update if the API gave us real numbers
      if (freshData && freshData.solvedProblem && freshData.solvedProblem !== "undefined") {
        renderLeetCodeUI(freshData);
        sessionStorage.setItem(DATA_KEY, JSON.stringify(freshData));
        sessionStorage.setItem(LAST_FETCH_KEY, now.toString());
      }
    } catch (e) {
      console.log("LeetCode sync failed - keeping fallbacks");
    }
  }
}

// 3. SEPARATE RENDERING LOGIC (The Safety Net)
function renderLeetCodeUI(data) {
  const total = document.getElementById("leetcodeTotal");
  const easy = document.getElementById("easySolved");
  const med = document.getElementById("mediumSolved");
  const hard = document.getElementById("hardSolved");

  // Only update if elements exist and data is not 'undefined'
  if (total && data.solvedProblem) {
    // We use totalSolved OR solvedProblem depending on which one the API sent
    total.textContent = data.solvedProblem || data.totalSolved;
    easy.textContent = data.easySolved;
    med.textContent = data.mediumSolved;
    hard.textContent = data.hardSolved;
  }
}
  updateViews();
  updateLeetCode();
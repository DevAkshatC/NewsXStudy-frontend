// 🌍 Auto-select API base URL (kept exactly like you had)
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:5000"
  : "https://newsxstudy-backend.onrender.com";

// ✅ DOM Elements
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const newsSection = document.getElementById('news-section');
const bookmarksSection = document.getElementById('bookmarks-section');
const studySection = document.getElementById('study-section');
const authSection = document.getElementById('auth-section');

// ====== Auth Tabs (centered overlay) ======
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
});
document.querySelectorAll('[data-switch-to]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab(a.dataset.switchTo);
  });
});
function switchAuthTab(tab){
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  authForms.forEach(f => f.classList.toggle('hidden', f.dataset.tab !== tab));
}

// ====== Top Nav SPA-style routing ======
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').replace('#', '');
    ['news-section', 'bookmarks-section', 'study-section'].forEach(secId => {
      document.getElementById(secId).style.display = (secId === id ? 'block' : 'none');
    });
    // Scroll to top of section for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ====== Auth State on load ======
if (localStorage.getItem('token')) {
  showApp();
} else {
  showAuth();
}

function showAuth(){
  authSection.classList.remove('hidden');
  authSection.style.display = 'flex';
  newsSection.style.display = 'none';
  bookmarksSection.style.display = 'none';
  studySection.style.display = 'none';
  logoutBtn.style.display = 'none';
}
function showApp(){
  authSection.style.display = 'none';
  newsSection.style.display = 'block';
  bookmarksSection.style.display = 'block';
  studySection.style.display = 'block';
  logoutBtn.style.display = 'inline-block';
}

// ====== SIGNUP ======
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  try {
    const res = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password });
    alert(res.data.message || 'Signup successful');
    signupForm.reset();
    switchAuthTab('login');
  } catch (err) {
    alert(err.response?.data?.message || 'Signup failed');
  }
});

// ====== LOGIN ======
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const token = res.data.token;
    localStorage.setItem('token', token);
    alert('Login successful');

    loginForm.reset();
    showApp();
    fetchBookmarks();
    loadNews();
  } catch (err) {
    alert(err.response?.data?.message || 'Login failed');
  }
});

// 🔓 Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  alert('Logged out');
  document.getElementById('bookmark-container').innerHTML = '';
  showAuth();
});

// ==========================================
// 📑 Bookmarks API
// ==========================================
function saveBookmark(title, url) {
  const token = localStorage.getItem('token');
  if (!token) return alert('Please login to save bookmarks');

  axios.post(`${API_BASE}/api/bookmarks/add`, { title, url }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => alert(res.data.message || 'Bookmark saved'))
  .catch(err => alert(err.response?.data?.message || 'Failed to save bookmark'));
}

function fetchBookmarks() {
  const token = localStorage.getItem('token');
  if (!token) return;

  axios.get(`${API_BASE}/api/bookmarks/list`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => {
    const container = document.getElementById('bookmark-container');
    container.innerHTML = '';
    res.data.forEach(b => {
      const item = document.createElement('div');
      item.className = 'bookmark';
      item.innerHTML = `
        <a href="${b.url}" target="_blank" rel="noopener noreferrer">${b.title}</a>
        <button onclick="deleteBookmark('${b._id}')">🗑️ Delete</button>
      `;
      container.appendChild(item);
    });
  })
  .catch(() => {
    document.getElementById('bookmark-container').innerHTML = 'Failed to load bookmarks';
  });
}

function deleteBookmark(id) {
  const token = localStorage.getItem('token');
  if (!token) return;

  axios.delete(`${API_BASE}/api/bookmarks/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(() => fetchBookmarks())
  .catch(() => alert('Failed to delete'));
}

// ==========================================
// ⏱️ Study Timer
// ==========================================
let timer;
let seconds = 0;

function startStudy() {
  if (timer) return;
  timer = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('study-timer').textContent = `Timer: ${mins}:${secs}`;
  }, 1000);
}
function stopStudy() {
  clearInterval(timer);
  timer = null;
}

// ==========================================
// 📰 News API + Render
// ==========================================
function loadNews() {
  axios.get(`${API_BASE}/api/news`)
    .then(res => renderNews(res.data.articles))
    .catch(() => {
      document.getElementById('news-container').innerHTML = 'Failed to load news';
    });
}

const searchForm = document.getElementById('search-form');
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  if (!query) return alert('Enter something to search');

  try {
    const res = await axios.get(`${API_BASE}/api/news/search?q=${encodeURIComponent(query)}`);
    renderNews(res.data.articles);
  } catch (err) {
    alert('Search failed');
  }
});

const categorySelect = document.getElementById('category-select');
categorySelect.addEventListener('change', async (e) => {
  const selected = e.target.value;
  if (!selected) return loadNews();

  try {
    const res = await axios.get(`${API_BASE}/api/news/category/${encodeURIComponent(selected)}`);
    renderNews(res.data.articles);
  } catch (err) {
    alert('Failed to filter news');
  }
});

// 🔄 Render Articles (with Images + Cards + Fallback)
function renderNews(articles) {
  const container = document.getElementById('news-container');
  container.innerHTML = '';

  if (!articles || articles.length === 0) {
    container.innerHTML = '<p>No news found</p>';
    return;
  }

  const placeholder = 'https://via.placeholder.com/800x450?text=No+Image';

  articles.forEach(article => {
    const div = document.createElement('div');
    div.classList.add('news-card');

    const imgSrc = article.urlToImage || article.image || placeholder;
    const title = article.title || 'Untitled';
    const description = article.description || '';
    const url = article.url || '#';

    const safeTitle = title.replace(/'/g, "\\'");
    const safeUrl = url.replace(/'/g, "\\'");

    div.innerHTML = `
      <img src="${imgSrc}" alt="news" class="news-img" onerror="this.src='${placeholder}'" />
      <div class="news-card-content">
        <h3 class="news-title">${title}</h3>
        <p class="news-desc">${description}</p>
        <div class="card-actions">
          <a href="${url}" target="_blank" rel="noopener noreferrer">Read More</a>
          <button onclick="saveBookmark('${safeTitle}', '${safeUrl}')">🔖 Bookmark</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ==========================================
// 🚀 On Load
// ==========================================
window.addEventListener('load', () => {
  if (localStorage.getItem('token')) {
    showApp();
    fetchBookmarks();
    loadNews();
  } else {
    showAuth();
  }
});


const BASE_URL = 'https://newsxstudy-backend.onrender.com';

// ✅ SIGNUP
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newsSection = document.getElementById('news-section');
const bookmarksSection = document.getElementById('bookmarks-section');
const studySection = document.getElementById('study-section');
const authSection = document.getElementById('auth-section');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const res = await axios.post(`${BASE_URL}/api/auth/register`, { name, email, password });
        alert(res.data.message);
        signupForm.reset();
    } catch (err) {
        alert(err.response?.data?.message || 'Signup failed');
    }
});

// ✅ LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
        const token = res.data.token;
        localStorage.setItem('token', token);
        alert('Login successful');
        loginForm.reset();
        toggleSectionsOnLogin();
        fetchBookmarks();
    } catch (err) {
        alert(err.response?.data?.message || 'Login failed');
    }
});

// 🔓 Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    alert('Logged out');
    document.getElementById('bookmark-container').innerHTML = '';
    toggleSectionsOnLogout();
});

function toggleSectionsOnLogin() {
    authSection.style.display = 'none';
    newsSection.style.display = 'block';
    bookmarksSection.style.display = 'block';
    studySection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
}

function toggleSectionsOnLogout() {
    authSection.style.display = 'block';
    newsSection.style.display = 'none';
    bookmarksSection.style.display = 'none';
    studySection.style.display = 'none';
    logoutBtn.style.display = 'none';
}

// 📌 Save Bookmark
function saveBookmark(title, url) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please login to save bookmarks');

    axios.post(`${BASE_URL}/api/bookmarks/add`, { title, url }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => alert(res.data.message))
    .catch(err => alert(err.response?.data?.message || 'Failed to save bookmark'));
}

// 📥 Fetch Bookmarks
function fetchBookmarks() {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get(`${BASE_URL}/api/bookmarks/list`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        const container = document.getElementById('bookmark-container');
        container.innerHTML = '';
        res.data.forEach(bookmark => {
            const div = document.createElement('div');
            div.innerHTML = `
                <p><a href="${bookmark.url}" target="_blank">${bookmark.title}</a></p>
                <button onclick="deleteBookmark('${bookmark._id}')">🔚️ Delete</button>
                <hr>
            `;
            container.appendChild(div);
        });
    })
    .catch(() => {
        document.getElementById('bookmark-container').innerHTML = 'Failed to load bookmarks';
    });
}

// ❌ Delete Bookmark
function deleteBookmark(id) {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.delete(`${BASE_URL}/api/bookmarks/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => fetchBookmarks())
    .catch(() => alert('Failed to delete'));
}

// ⏱️ Study Timer
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

// 🌍 Load Default News
function loadNews() {
    axios.get(`${BASE_URL}/api/news`)
    .then(res => renderNews(res.data.articles))
    .catch(() => {
        document.getElementById('news-container').innerHTML = 'Failed to load news';
    });
}

// 🔍 Search News
const searchForm = document.getElementById('search-form');
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (!query) return alert('Enter something to search');

    try {
        const res = await axios.get(`${BASE_URL}/api/news/search?q=${query}`);
        renderNews(res.data.articles);
    } catch (err) {
        alert('Search failed');
    }
});

// 🗂️ Filter by Category
const categorySelect = document.getElementById('category-select');
categorySelect.addEventListener('change', async (e) => {
    const selected = e.target.value;
    if (!selected) return loadNews();

    try {
        const res = await axios.get(`${BASE_URL}/api/news/category/${selected}`);
        renderNews(res.data.articles);
    } catch (err) {
        alert('Failed to filter news');
    }
});

// 🔄 Render Articles
function renderNews(articles) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    if (!articles || articles.length === 0) {
        container.innerHTML = 'No news found';
        return;
    }

    articles.forEach(article => {
        const div = document.createElement('div');
        div.classList.add('news-card');
        div.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.description || ''}</p>
            <a href="${article.url}" target="_blank">Read more</a>
            <button onclick="saveBookmark('${article.title}', '${article.url}')">🔖 Bookmark</button>
        `;
        container.appendChild(div);
    });
}

// 🔁 Auto-load bookmarks if logged in
if (localStorage.getItem('token')) {
    toggleSectionsOnLogin();
    fetchBookmarks();
}

// 🚀 Load news on start
window.onload = () => {
    loadNews();
};

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const hasFirebase = typeof firebase !== 'undefined' && firebase.apps;
const app = hasFirebase && firebase.apps.length ? firebase.app() : (hasFirebase ? firebase.initializeApp(firebaseConfig) : null);
const db = app ? firebase.database() : null;

const localGames = [
  {
    title: 'Skybound Legends',
    tag: 'Aksiyon • Çok Oyunculu',
    description: 'Hızlı tempolu savaşlar, açık dünya keşfi ve takım taktikleriyle dolu bir proje.',
    status: 'Beta Test'
  },
  {
    title: 'Moonlight Quest',
    tag: 'RPG • Hikâye',
    description: 'Karakter gelişimi, büyüleyici hikâye ve otomatik savaş sistemiyle oyuncuyu içine çeken bir dünya.',
    status: 'Yapım Aşaması'
  }
];

const teamMembers = [
  { name: 'Eren', role: 'Kurucu / Yönetici', note: 'Stüdyo vizyonu ve proje planlaması.' },
  { name: 'Mira', role: 'Game Designer', note: 'Dünya tasarımı ve oyuncu akışı.' },
  { name: 'Aylin', role: 'Grafik & UI', note: 'Karakterler, arayüz ve görsel stil.' },
  { name: 'Can', role: 'Teknoloji & Backend', note: 'Firebase, sistemler ve oyun altyapısı.' }
];

const demoGames = localGames;

const demoNews = [
  {
    title: 'Yeni sürüm duyurusu',
    category: 'Güncelleme',
    date: '15 Haziran 2026',
    description: 'Stüdyo, ilk büyük güncellemesini hazırlıyor ve oyuncu geri bildirimlerine göre yeni içerikler ekliyor.'
  },
  {
    title: 'Topluluk etkinliği',
    category: 'Etkinlik',
    date: '20 Haziran 2026',
    description: 'Oyuncularımızla buluşmak için özel bir canlı yayın ve demo oturumu düzenliyoruz.'
  }
];

function renderCards(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || !items.length) {
    container.innerHTML = '<article class="card"><p>Henüz içerik yok. Admin panelden ekleyebilirsiniz.</p></article>';
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="card ${type}-card ${type === 'news' ? 'news-card' : ''}">
      <div class="game-topline">
        <span class="game-badge">${type === 'game' ? item.tag : (item.category || 'Haber')}</span>
        ${type === 'game' ? `<span class="status-pill">${item.status || 'Yeni'}</span>` : `<span class="status-pill">${item.date || 'Yeni'}</span>`}
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      ${type === 'game' ? '<button class="btn btn-secondary small">Detaylar</button>' : '<span class="news-meta">AFK Games Studio</span>'}
    </article>
  `).join('');
}

function renderTeamCards() {
  const container = document.getElementById('team-list');
  if (!container) return;

  container.innerHTML = teamMembers.map(member => `
    <article class="member-card card">
      <div class="avatar">${member.name.charAt(0)}</div>
      <h3>${member.name}</h3>
      <p class="member-role">${member.role}</p>
      <p>${member.note}</p>
    </article>
  `).join('');
}

function renderAdminLists() {
  const gameList = document.getElementById('game-list');
  const newsList = document.getElementById('news-admin-list');

  if (gameList && db) {
    db.ref('games').once('value').then(snapshot => {
      const items = snapshot.val() || {};
      const list = Object.entries(items).map(([id, item]) => `
        <article class="mini-item">
          <strong>${item.title}</strong>
          <button class="btn btn-secondary small" data-delete="games/${id}">Sil</button>
        </article>
      `).join('');
      gameList.innerHTML = list || '<p>Henüz oyun yok.</p>';
    });
  }

  if (newsList && db) {
    db.ref('news').once('value').then(snapshot => {
      const items = snapshot.val() || {};
      const list = Object.entries(items).map(([id, item]) => `
        <article class="mini-item">
          <strong>${item.title}</strong>
          <button class="btn btn-secondary small" data-delete="news/${id}">Sil</button>
        </article>
      `).join('');
      newsList.innerHTML = list || '<p>Henüz haber yok.</p>';
    });
  }
}

function handleDelete(event) {
  if (!db) return;
  const target = event.target.closest('[data-delete]');
  if (!target) return;
  const path = target.getAttribute('data-delete');
  if (path) {
    db.ref(path).remove().then(() => renderAdminLists());
  }
}

function setupForms() {
  const gameForm = document.getElementById('game-form');
  const newsForm = document.getElementById('news-form');

  if (gameForm && db) {
    gameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      db.ref('games').push({
        title: document.getElementById('game-title').value.trim(),
        tag: document.getElementById('game-tag').value.trim(),
        description: document.getElementById('game-desc').value.trim()
      }).then(() => {
        gameForm.reset();
        renderAdminLists();
      });
    });
  }

  if (newsForm && db) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      db.ref('news').push({
        title: document.getElementById('news-title').value.trim(),
        category: document.getElementById('news-category').value.trim(),
        date: document.getElementById('news-date').value.trim(),
        description: document.getElementById('news-desc').value.trim()
      }).then(() => {
        newsForm.reset();
        renderAdminLists();
      });
    });
  }
}

function initAdminGate() {
  const passwordInput = document.getElementById('admin-password');
  const unlockButton = document.getElementById('unlock-admin');
  const lockBox = document.getElementById('admin-lock');
  const adminContent = document.getElementById('admin-content');
  const errorText = document.getElementById('admin-error');

  if (!passwordInput || !unlockButton || !lockBox || !adminContent || !errorText) return;

  const correctPassword = 'AFKGAMES2026';

  const unlock = () => {
    if (passwordInput.value === correctPassword) {
      lockBox.hidden = true;
      adminContent.hidden = false;
      errorText.hidden = true;
    } else {
      errorText.hidden = false;
      passwordInput.value = '';
    }
  };

  unlockButton.addEventListener('click', unlock);
  passwordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlock();
  });
}

function init() {
  document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

  const savedTheme = localStorage.getItem('afk-theme');
  if (savedTheme === 'light') document.documentElement.classList.add('light');

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const applyTheme = () => {
      const isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('afk-theme', isLight ? 'light' : 'dark');
      themeToggle.textContent = isLight ? '☀️' : '🌙';
    };
    themeToggle.addEventListener('click', applyTheme);
    themeToggle.textContent = document.documentElement.classList.contains('light') ? '☀️' : '🌙';
  }

  const menuBtn = document.querySelector('.menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  if (document.getElementById('games-list')) {
    if (db) {
      db.ref('games').once('value').then(snapshot => {
        const items = snapshot.val();
        renderCards('games-list', items ? Object.values(items) : demoGames, 'game');
      }).catch(() => renderCards('games-list', demoGames, 'game'));
    } else {
      renderCards('games-list', demoGames, 'game');
    }
  }

  if (document.getElementById('news-list')) {
    if (db) {
      db.ref('news').once('value').then(snapshot => {
        const items = snapshot.val();
        renderCards('news-list', items ? Object.values(items) : demoNews, 'news');
      }).catch(() => renderCards('news-list', demoNews, 'news'));
    } else {
      renderCards('news-list', demoNews, 'news');
    }
  }

  initAdminGate();
  renderTeamCards();
  if (db) {
    setupForms();
    renderAdminLists();
  }
  document.addEventListener('click', handleDelete);
}

init();

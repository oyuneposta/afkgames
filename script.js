const firebaseConfig = {
  apiKey: "AIzaSyCUScDnCVhZNkX1ZVooU0Og_Zi8faE_kHM",
  authDomain: "afkgames.firebaseapp.com",
  projectId: "afkgames",
  storageBucket: "afkgames.firebasestorage.app",
  messagingSenderId: "866864941891",
  appId: "1:866864941891:web:2cd2af124b000dbf96fdf6"
};

const hasFirebase = typeof firebase !== 'undefined' && firebase.apps;
const app = hasFirebase && firebase.apps.length ? firebase.app() : (hasFirebase ? firebase.initializeApp(firebaseConfig) : null);
const db = app ? firebase.firestore() : null;

const teamMembers = [
  { name: 'Mustafa Gürkan Çifcioğlu', role: 'Productor', note: 'Proje planlama, görev dağılımı ve süreç takibi.' },
  { name: 'Özcan Tezcan', role: 'Productor', note: 'Üretim hattı ve ekip organizasyonu.' },
  { name: 'Abdulkadir Çolak', role: 'Coordinator', note: 'Ekip içi iletişim, toplantı düzeni ve koordinasyon akışı.' },
  { name: 'Alim Erva Irmak', role: 'Developer', note: 'Oyun mekanikleri ve yazılım altyapısı.' },
  { name: 'Batuhan Özcan', role: 'Developer', note: 'Performans, hata giderme ve oynanabilir sistemler.' },
  { name: 'Nazım Kadir Can', role: 'Developer', note: 'Teknoloji altyapısı ve proje geliştirme.' },
  { name: 'Aykut Kılıç', role: 'Designer', note: 'Görsel kimlik ve karakter/harita tasarımı.' },
  { name: 'Furkan Çifcioğlu', role: 'Designer', note: 'Arayüz ve oyuncu deneyimi tasarımı.' },
  { name: 'İbrahim Kerim Kaplan', role: 'Designer', note: 'Görsel bütünlük ve tasarım yönü.' }
];

let editingGameId = null;
let editingNewsId = null;

function renderCards(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const visibleItems = (items || []).filter(item => item.status !== 'draft');
  if (!visibleItems.length) {
    container.innerHTML = '<article class="card"><p>Henüz yayınlanmış içerik yok. Admin panelden ekleyebilirsiniz.</p></article>';
    return;
  }

  container.innerHTML = visibleItems.map(item => `
    <article class="card ${type === 'news' ? 'news-card' : ''}">
      ${item.image ? `<img class="content-thumb" src="${item.image}" alt="${item.title}" />` : ''}
      <div class="game-topline">
        <span class="game-badge">${type === 'game' ? (item.tag || 'Oyun') : (item.category || 'Haber')}</span>
        <span class="status-pill">${type === 'game' ? (item.platform || 'Yeni') : (item.date || 'Yeni')}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      ${item.link ? `<a class="btn btn-secondary small" href="${item.link}" target="_blank" rel="noreferrer">Detay</a>` : ''}
    </article>
  `).join('');
}

function renderTeamCards() {
  const container = document.getElementById('team-list');
  if (!container) return;

  container.innerHTML = teamMembers.map(member => `
    <article class="member-card card">
      <div class="member-top">
        <div class="avatar">${member.name.charAt(0)}</div>
        <div>
          <span class="member-chip">${member.role}</span>
          <h3>${member.name}</h3>
        </div>
      </div>
      <p class="member-role">${member.role} alanı</p>
      <p class="member-note">${member.note}</p>
      <span class="member-tag">AFK Games Studio</span>
    </article>
  `).join('');
}

function getItemsFromDb(path, fallback = []) {
  if (!db) return Promise.resolve(fallback);
  return db.collection(path).get().then(snapshot => {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }).catch(() => fallback);
}

function renderAdminLists() {
  const gameList = document.getElementById('game-list');
  const newsList = document.getElementById('news-admin-list');
  const gameFilter = document.getElementById('game-filter');
  const newsFilter = document.getElementById('news-filter');
  const gameStatusFilter = document.getElementById('game-status-filter');
  const newsStatusFilter = document.getElementById('news-status-filter');

  getItemsFromDb('games').then(items => {
    const filtered = (items || []).filter(item => {
      const matchesText = (item.title || '').toLowerCase().includes((gameFilter?.value || '').toLowerCase());
      const matchesStatus = !gameStatusFilter || gameStatusFilter.value === 'all' || item.status === gameStatusFilter.value;
      return matchesText && matchesStatus;
    });
    if (gameList) {
      gameList.innerHTML = filtered.length ? filtered.map(item => `
        <article class="mini-item">
          <div>
            <strong>${item.title}</strong>
            <p class="mini-meta">${item.tag || 'Oyun'} · ${item.status || 'published'}</p>
          </div>
          <div class="mini-actions">
            <button class="btn btn-secondary small" data-edit="games/${item.id}">Düzenle</button>
            <button class="btn btn-secondary small" data-delete="games/${item.id}">Sil</button>
          </div>
        </article>
      `).join('') : '<p>Henüz oyun yok.</p>';
    }
    const statGames = document.getElementById('stat-games');
    if (statGames) statGames.textContent = String(items.length || 0);
    const statStatus = document.getElementById('stat-status');
    if (statStatus) {
      const published = (items || []).filter(item => item.status === 'published').length;
      const draft = (items || []).filter(item => item.status === 'draft').length;
      statStatus.textContent = `${published} / ${draft}`;
    }
  });

  getItemsFromDb('news').then(items => {
    const filtered = (items || []).filter(item => {
      const matchesText = (item.title || '').toLowerCase().includes((newsFilter?.value || '').toLowerCase());
      const matchesStatus = !newsStatusFilter || newsStatusFilter.value === 'all' || item.status === newsStatusFilter.value;
      return matchesText && matchesStatus;
    });
    if (newsList) {
      newsList.innerHTML = filtered.length ? filtered.map(item => `
        <article class="mini-item">
          <div>
            <strong>${item.title}</strong>
            <p class="mini-meta">${item.category || 'Haber'} · ${item.status || 'published'}</p>
          </div>
          <div class="mini-actions">
            <button class="btn btn-secondary small" data-edit="news/${item.id}">Düzenle</button>
            <button class="btn btn-secondary small" data-delete="news/${item.id}">Sil</button>
          </div>
        </article>
      `).join('') : '<p>Henüz haber yok.</p>';
    }
    const statNews = document.getElementById('stat-news');
    if (statNews) statNews.textContent = String((items || []).filter(item => item.status === 'published').length || 0);
    const statLatest = document.getElementById('stat-latest');
    if (statLatest) {
      const latest = (items || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
      statLatest.textContent = latest?.date || '—';
    }
  });
}

function handleDelete(event) {
  if (!db) return;
  const target = event.target.closest('[data-delete]');
  if (!target) return;
  const path = target.getAttribute('data-delete');
  if (path) {
    const [collection, id] = path.split('/');
    if (db && collection && id) {
      db.collection(collection).doc(id).delete()
        .then(() => renderAdminLists())
        .catch(error => { console.error('Delete failed:', error); alert('Silme işlemi başarısız oldu. Firestore kurallarını kontrol edin.'); });
    }
  }
}

function handleEdit(event) {
  const target = event.target.closest('[data-edit]');
  if (!target) return;
  const path = target.getAttribute('data-edit');
  const [type, id] = path.split('/');

  if (type === 'games') {
    getItemsFromDb('games').then(items => {
      const item = items.find(entry => entry.id === id);
      if (!item) return;
      editingGameId = id;
      document.getElementById('game-title').value = item.title || '';
      document.getElementById('game-tag').value = item.tag || '';
      document.getElementById('game-platform').value = item.platform || '';
      document.getElementById('game-image').value = item.image || '';
      document.getElementById('game-link').value = item.link || '';
      document.getElementById('game-status').value = item.status || 'published';
      document.getElementById('game-desc').value = item.description || '';
      document.getElementById('cancel-game-edit').hidden = false;
    });
  }

  if (type === 'news') {
    getItemsFromDb('news').then(items => {
      const item = items.find(entry => entry.id === id);
      if (!item) return;
      editingNewsId = id;
      document.getElementById('news-title').value = item.title || '';
      document.getElementById('news-category').value = item.category || '';
      document.getElementById('news-date').value = item.date || '';
      document.getElementById('news-image').value = item.image || '';
      document.getElementById('news-link').value = item.link || '';
      document.getElementById('news-status').value = item.status || 'published';
      document.getElementById('news-desc').value = item.description || '';
      document.getElementById('cancel-news-edit').hidden = false;
    });
  }
}

function resetGameForm() {
  editingGameId = null;
  document.getElementById('game-form').reset();
  document.getElementById('cancel-game-edit').hidden = true;
}

function resetNewsForm() {
  editingNewsId = null;
  document.getElementById('news-form').reset();
  document.getElementById('cancel-news-edit').hidden = true;
}

function setupForms() {
  const gameForm = document.getElementById('game-form');
  const newsForm = document.getElementById('news-form');

  if (gameForm && db) {
    gameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('game-title').value.trim(),
        tag: document.getElementById('game-tag').value.trim(),
        platform: document.getElementById('game-platform').value.trim(),
        image: document.getElementById('game-image').value.trim(),
        link: document.getElementById('game-link').value.trim(),
        status: document.getElementById('game-status').value,
        description: document.getElementById('game-desc').value.trim()
      };
      if (!data.title || !data.description) return;
      const action = editingGameId
        ? db.collection('games').doc(editingGameId).set(data, { merge: true })
        : db.collection('games').add(data);
      action
        .then(() => { gameForm.reset(); resetGameForm(); renderAdminLists(); renderPageContent(); })
        .catch(error => { console.error('Games save failed:', error); alert('Oyun kaydedilemedi. Firestore kurallarını kontrol edin.'); });
    });
  }

  if (newsForm && db) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('news-title').value.trim(),
        category: document.getElementById('news-category').value.trim(),
        date: document.getElementById('news-date').value.trim(),
        image: document.getElementById('news-image').value.trim(),
        link: document.getElementById('news-link').value.trim(),
        status: document.getElementById('news-status').value,
        description: document.getElementById('news-desc').value.trim()
      };
      if (!data.title || !data.description) return;
      const action = editingNewsId
        ? db.collection('news').doc(editingNewsId).set(data, { merge: true })
        : db.collection('news').add(data);
      action
        .then(() => { newsForm.reset(); resetNewsForm(); renderAdminLists(); renderPageContent(); })
        .catch(error => { console.error('News save failed:', error); alert('Haber kaydedilemedi. Firestore kurallarını kontrol edin.'); });
    });
  }

  document.getElementById('cancel-game-edit')?.addEventListener('click', resetGameForm);
  document.getElementById('cancel-news-edit')?.addEventListener('click', resetNewsForm);
  document.getElementById('game-filter')?.addEventListener('input', renderAdminLists);
  document.getElementById('news-filter')?.addEventListener('input', renderAdminLists);
  document.getElementById('game-status-filter')?.addEventListener('change', renderAdminLists);
  document.getElementById('news-status-filter')?.addEventListener('change', renderAdminLists);
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

function renderPageContent() {
  if (db) {
    getItemsFromDb('games').then(items => renderCards('games-list', items, 'game'));
    getItemsFromDb('news').then(items => renderCards('news-list', items, 'news'));
  } else {
    renderCards('games-list', [], 'game');
    renderCards('news-list', [], 'news');
  }
}

function smoothScrollTo(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.pageYOffset - 84;
  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo({ top, behavior: 'smooth' });
  } else {
    window.scrollTo(0, top);
  }
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

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      event.preventDefault();
      navLinks?.classList.remove('open');

      const main = document.querySelector('main');
      if (main && hash !== '#top') {
        main.classList.add('section-fade');
        setTimeout(() => {
          smoothScrollTo(hash);
          setTimeout(() => main.classList.remove('section-fade'), 50);
        }, 180);
      } else {
        smoothScrollTo(hash);
      }
    });
  });

  // Sayfalar arası yumuşak geçiş (fade)
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
    if (href.startsWith('#')) return; // aynı sayfa içi link, smooth scroll zaten var

    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 280);
    });
  });

  // Sayfa bir bölüme (#bölüm) gitmek için açıldıysa, yumuşak şekilde o bölüme kaydır
  const scrollTarget = sessionStorage.getItem('afk-scroll-target');
  if (scrollTarget) {
    sessionStorage.removeItem('afk-scroll-target');
    requestAnimationFrame(() => {
      setTimeout(() => smoothScrollTo(scrollTarget), 150);
    });
  }

  renderPageContent();

  initAdminGate();
  renderTeamCards();
  if (db) {
    setupForms();
    renderAdminLists();
  }
  document.addEventListener('click', (event) => {
    handleDelete(event);
    handleEdit(event);
  });
}

init();

// ─── Landing Page Script ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Redirect logged-in users
  if (DB.isLoggedIn()) { window.location.href = 'browse.html'; return; }

  initNav();
  initFAQ();

  // ✅ Hide loader after max 1 second — never block the UI
  setTimeout(() => Utils.hideLoader(), 1000);

  // Load everything in background (non-blocking)
  loadHero();
  loadMovieRowsProgressive();
});

// ── Nav ──────────────────────────────────────────────────────────────────────
function initNav() {
  const nav = document.querySelector('.landing-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ── Hero ─────────────────────────────────────────────────────────────────────
async function loadHero() {
  try {
    const movie = await API.getFeatured();
    if (!movie) return;

    const heroBackdrop = document.getElementById('hero-backdrop');
    if (movie.backdrop_path && heroBackdrop) {
      heroBackdrop.style.backgroundImage =
        `url('${API.imageUrl(movie.backdrop_path, CONFIG.BACKDROP_SIZE)}')`;
    }

    const heroInfo = document.getElementById('hero-movie-info');
    if (heroInfo && movie.id) {
      heroInfo.innerHTML = `
              <div class="hero-movie-title">${movie.title || movie.name}</div>
              <div class="hero-movie-meta">
                <span class="match">${Math.round((movie.vote_average || 0) * 10)}% Match</span>
                <span>${Utils.formatYear(movie.release_date)}</span>
                <span class="rating-badge">HD</span>
              </div>
              <p class="hero-movie-overview">${movie.overview || ''}</p>
              <div class="hero-movie-actions">
                <button class="btn-hero-play" onclick="window.location.href='register.html'">▶ Play</button>
                <button class="btn-hero-info" onclick="window.location.href='register.html'">ⓘ More Info</button>
              </div>`;
      heroInfo.hidden = false;
    }

    // Parallax zoom
    if (heroBackdrop) {
      setTimeout(() => heroBackdrop.classList.add('zoom'), 100);
      setInterval(() => heroBackdrop.classList.toggle('zoom'), 8000);
    }
  } catch (e) {
    console.warn('Hero load failed:', e);
  }
}

// ── Movie Rows — load each row independently (skeleton → real content) ─────────
function loadMovieRowsProgressive() {
  const container = document.getElementById('movies-rows');
  if (!container) return;

  const rowDefs = [
    { title: 'Trending Now', icon: '🔥', fetch: () => API.getTrending(), id: 'trending' },
    { title: 'Popular on ShadowFlix', icon: '🎬', fetch: () => API.getPopular(), id: 'popular' },
    { title: 'Top Rated', icon: '⭐', fetch: () => API.getTopRated(), id: 'toprated' },
    { title: 'Coming Soon', icon: '🗓️', fetch: () => API.getUpcoming(), id: 'upcoming' }
  ];

  // Inject shimmer skeletons immediately so page feels full
  if (!document.getElementById('shimmer-style')) {
    const s = document.createElement('style');
    s.id = 'shimmer-style';
    s.textContent = `
          @keyframes shimmer { from{opacity:0.35} to{opacity:0.75} }
          .skeleton-card {
            flex: 0 0 180px; height: 270px;
            background: rgba(255,255,255,0.07);
            border-radius: 6px;
            animation: shimmer 1.2s ease-in-out infinite alternate;
          }`;
    document.head.appendChild(s);
  }

  const skeletonRow = (r) => `
        <div class="movie-row" id="row-${r.id}">
          <h2 class="row-title"><span class="row-icon">${r.icon}</span>${r.title}</h2>
          <div class="movie-row-track">
            ${Array(8).fill('<div class="skeleton-card"></div>').join('')}
          </div>
        </div>`;

  container.innerHTML = rowDefs.map(skeletonRow).join('');

  // Fetch each row independently — whichever comes first renders first
  rowDefs.forEach(async (rowDef) => {
    try {
      const data = await rowDef.fetch();
      const rowEl = document.getElementById(`row-${rowDef.id}`);
      if (!rowEl || !data?.results?.length) return;

      // Replace skeleton row with real cards
      const realRowHtml = Utils.createMovieRow(rowDef.title, rowDef.icon, data.results, rowDef.id);
      rowEl.outerHTML = realRowHtml;

      // Bind click events for just this row
      const newRow = document.getElementById(`row-${rowDef.id}`);
      if (newRow) Utils.bindCardEvents(newRow, openMovieModal);
    } catch (e) {
      console.warn('Row failed:', rowDef.id, e);
    }
  });
}

// ── Movie Modal ───────────────────────────────────────────────────────────────
async function openMovieModal(movieId) {
  const overlay = document.getElementById('movie-modal-overlay');
  const body = document.getElementById('movie-modal-body');
  if (!overlay || !body) return;

  body.innerHTML = '<div class="flex-center" style="height:200px"><div class="spinner"></div></div>';
  overlay.classList.add('active');

  const movie = await API.getMovieDetail(movieId);
  if (!movie) return;

  const backdrop = API.imageUrl(movie.backdrop_path, CONFIG.BACKDROP_SIZE);
  const genres = (movie.genres || []).map(g => `<span class="meta-genre">${g.name}</span>`).join('');
  const inWL = DB.isLoggedIn() && DB.isInWatchlist(movie.id);

  body.innerHTML = `
      <div style="position:relative">
        <img src="${backdrop}" alt="${movie.title}"
             style="width:100%;height:280px;object-fit:cover;display:block"
             onerror="this.style.display='none'">
        <div style="position:absolute;bottom:0;left:0;right:0;height:60%;
             background:linear-gradient(to bottom,transparent,var(--bg-card))"></div>
      </div>
      <div class="movie-modal-body">
        <h2 class="movie-modal-title">${movie.title}</h2>
        <div class="movie-modal-meta">
          <span class="meta-rating">★ ${Utils.formatRating(movie.vote_average)}</span>
          <span class="meta-year">${Utils.formatYear(movie.release_date)}</span>
          <span>${Utils.formatRuntime(movie.runtime)}</span>
          ${genres}
        </div>
        <p class="movie-modal-overview">${movie.overview || 'No overview available.'}</p>
        <div class="movie-modal-actions">
          <button class="btn-play" onclick="window.location.href='register.html'">▶ Play</button>
          <button class="btn-watchlist" id="modal-wl-btn">
            ${inWL ? '✓ In Watchlist' : '+ Watchlist'}
          </button>
        </div>
      </div>`;

  document.getElementById('modal-wl-btn')?.addEventListener('click', () => {
    if (!DB.isLoggedIn()) { window.location.href = 'login.html'; return; }
    const added = DB.toggleWatchlist({
      id: movie.id, title: movie.title,
      poster_path: movie.poster_path, release_date: movie.release_date
    });
    const btn = document.getElementById('modal-wl-btn');
    btn.textContent = added ? '✓ In Watchlist' : '+ Watchlist';
    Utils.toast(added ? 'Added to watchlist!' : 'Removed from watchlist', added ? 'success' : 'info');
  });
}

function closeMovieModal() {
  document.getElementById('movie-modal-overlay')?.classList.remove('active');
}

// Close on overlay click / Escape key
document.addEventListener('click', (e) => {
  if (e.target.id === 'movie-modal-overlay') closeMovieModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMovieModal();
});

// ── FAQ ───────────────────────────────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ── Get Started ───────────────────────────────────────────────────────────────
function handleGetStarted(e) {
  e.preventDefault();
  const email = document.getElementById('hero-email')?.value.trim();
  const url = email ? `register.html?email=${encodeURIComponent(email)}` : 'register.html';
  window.location.href = url;
}

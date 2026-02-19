// ─── Landing Page Script ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect logged-in users
    if (DB.isLoggedIn()) { window.location.href = 'browse.html'; return; }

    initNav();
    initFAQ();
    await loadHero();
    await loadMovieRows();
    Utils.hideLoader();
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
    const movie = await API.getFeatured();
    const backup = {
        backdrop_path: null,
        title: 'Unlimited Movies, TV Shows & More',
        overview: 'Watch anywhere. Cancel anytime.',
        vote_average: 0
    };
    const m = movie || backup;

    const heroBackdrop = document.getElementById('hero-backdrop');
    if (m.backdrop_path) {
        heroBackdrop.style.backgroundImage = `url('${API.imageUrl(m.backdrop_path, CONFIG.BACKDROP_SIZE)}')`;
    }

    // Show featured movie info
    const heroInfo = document.getElementById('hero-movie-info');
    if (heroInfo && m.id) {
        heroInfo.innerHTML = `
          <div class="hero-movie-title">${m.title || m.name}</div>
          <div class="hero-movie-meta">
            <span class="match">${Math.round(m.vote_average * 10)}% Match</span>
            <span>${Utils.formatYear(m.release_date)}</span>
            <span class="rating-badge">HD</span>
          </div>
          <p class="hero-movie-overview">${m.overview || ''}</p>
          <div class="hero-movie-actions">
            <button class="btn-hero-play" onclick="window.location.href='register.html'">
              ▶ Play
            </button>
            <button class="btn-hero-info" onclick="window.location.href='register.html'">
              ⓘ More Info
            </button>
          </div>`;
        heroInfo.hidden = false;
    }

    // Parallax zoom
    setTimeout(() => { heroBackdrop.classList.add('zoom'); }, 100);
    setInterval(() => { heroBackdrop.classList.toggle('zoom'); }, 8000);
}

// ── Movie Rows ────────────────────────────────────────────────────────────────
async function loadMovieRows() {
    const container = document.getElementById('movies-rows');
    if (!container) return;

    const [trending, popular, topRated, upcoming] = await Promise.all([
        API.getTrending(),
        API.getPopular(),
        API.getTopRated(),
        API.getUpcoming()
    ]);

    const rows = [
        { title: 'Trending Now', icon: '🔥', data: trending, id: 'trending' },
        { title: 'Popular on ShadowFlix', icon: '🎬', data: popular, id: 'popular' },
        { title: 'Top Rated', icon: '⭐', data: topRated, id: 'toprated' },
        { title: 'Coming Soon', icon: '🗓️', data: upcoming, id: 'upcoming' }
    ];

    container.innerHTML = rows
        .filter(r => r.data?.results?.length)
        .map(r => Utils.createMovieRow(r.title, r.icon, r.data.results, r.id))
        .join('');

    // Bind click → open movie modal
    Utils.bindCardEvents(container, openMovieModal);
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
      <div class="movie-modal-backdrop" style="position:relative">
        <img src="${backdrop}" alt="${movie.title}" style="width:100%;height:280px;object-fit:cover"
             onerror="this.style.display='none'">
        <div class="movie-modal-backdrop-overlay"></div>
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
          <button class="btn-watchlist" id="modal-wl-btn" data-id="${movie.id}">
            ${inWL ? '✓ In Watchlist' : '+ Watchlist'}
          </button>
        </div>
      </div>`;

    document.getElementById('modal-wl-btn')?.addEventListener('click', () => {
        if (!DB.isLoggedIn()) { window.location.href = 'login.html'; return; }
        const added = DB.toggleWatchlist({ id: movie.id, title: movie.title, poster_path: movie.poster_path, release_date: movie.release_date });
        const btn = document.getElementById('modal-wl-btn');
        btn.textContent = added ? '✓ In Watchlist' : '+ Watchlist';
        Utils.toast(added ? 'Added to watchlist!' : 'Removed from watchlist', added ? 'success' : 'info');
    });
}

function closeMovieModal() {
    document.getElementById('movie-modal-overlay')?.classList.remove('active');
}

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

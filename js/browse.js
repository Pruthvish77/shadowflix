// ─── Browse Page Script ───────────────────────────────────────────────────────

let genres = [];
let activeGenreId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Utils.requireAuth()) return;

    populateUserInfo();
    initBrowseNav();
    initSearch();
    loadGenres();
    await loadBrowseHero();
    await loadAllRows();
    Utils.hideLoader();
});

// ── User Info ─────────────────────────────────────────────────────────────────
function populateUserInfo() {
    const user = DB.getSession();
    if (!user) return;
    const avatar = document.getElementById('nav-avatar');
    const greeting = document.getElementById('user-greeting');
    if (avatar) avatar.src = user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=e50914&color=fff`;
    if (greeting) greeting.textContent = `Hi, ${user.firstName}`;
}

function handleLogout() {
    DB.clearSession();
    Utils.toast('Signed out successfully', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function initBrowseNav() {
    const nav = document.querySelector('.browse-nav');
    window.addEventListener('scroll', () => {
        nav?.classList.toggle('scrolled', window.scrollY > 10);
    });
}

// ── Search ────────────────────────────────────────────────────────────────────
function initSearch() {
    const searchWrap = document.getElementById('nav-search-wrap');
    const searchInput = document.getElementById('nav-search-input');
    const searchBtn = document.getElementById('nav-search-btn');
    let searchTimer;

    searchBtn?.addEventListener('click', () => {
        searchWrap?.classList.toggle('open');
        if (searchWrap?.classList.contains('open')) searchInput?.focus();
    });

    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = searchInput.value.trim();
        if (!q) { loadAllRows(); return; }
        searchTimer = setTimeout(() => performSearch(q), 500);
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchWrap?.classList.remove('open');
            searchInput.value = '';
            loadAllRows();
        }
    });
}

async function performSearch(query) {
    const container = document.getElementById('browse-rows');
    if (!container) return;
    container.innerHTML = '<div class="flex-center" style="height:200px"><div class="spinner"></div></div>';

    const data = await API.searchMovies(query);
    if (!data?.results?.length) {
        container.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text-dim)">
          <p style="font-size:1.2rem">No results for "<strong>${query}</strong>"</p></div>`;
        return;
    }

    container.innerHTML = Utils.createMovieRow(`Results for "${query}"`, '🔍', data.results, 'search');
    Utils.bindCardEvents(container, openMovieModal);
}

// ── Genres ────────────────────────────────────────────────────────────────────
async function loadGenres() {
    const data = await API.getGenres();
    genres = data?.genres || [];

    const chipsEl = document.getElementById('genre-chips');
    if (!chipsEl) return;

    chipsEl.innerHTML = `
      <button class="genre-chip active" onclick="filterGenre(null, this)">All</button>
      ${genres.slice(0, 18).map(g =>
        `<button class="genre-chip" onclick="filterGenre(${g.id}, this)">${g.name}</button>`
    ).join('')}`;
}

async function filterGenre(genreId, btn) {
    document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
    btn?.classList.add('active');
    activeGenreId = genreId;

    if (!genreId) { loadAllRows(); return; }

    const container = document.getElementById('browse-rows');
    container.innerHTML = '<div class="flex-center" style="height:200px"><div class="spinner"></div></div>';
    const data = await API.getByGenre(genreId);
    const genre = genres.find(g => g.id === genreId);

    container.innerHTML = Utils.createMovieRow(genre?.name || 'Genre', '🎭', data?.results || [], 'genre');
    Utils.bindCardEvents(container, openMovieModal);
}

// ── Browse Hero ───────────────────────────────────────────────────────────────
async function loadBrowseHero() {
    const heroEl = document.getElementById('browse-hero-img');
    const contentEl = document.getElementById('browse-hero-content');
    if (!heroEl || !contentEl) return;

    const movie = await API.getFeatured();
    if (!movie) return;

    heroEl.style.backgroundImage = `url('${API.imageUrl(movie.backdrop_path, CONFIG.BACKDROP_SIZE)}')`;
    const genres = (movie.genres || []).slice(0, 3).map(g => g.name).join(' · ');

    contentEl.innerHTML = `
      <span class="browse-hero-badge">✦ Featured</span>
      <h1 class="browse-hero-title">${movie.title}</h1>
      <div class="browse-hero-meta">
        <span class="match">${Math.round((movie.vote_average || 0) * 10)}% Match</span>
        <span>${Utils.formatYear(movie.release_date)}</span>
        <span>${Utils.formatRuntime(movie.runtime)}</span>
        <span style="color:var(--text-dim);font-size:0.82rem">${genres}</span>
      </div>
      <p class="browse-hero-overview">${movie.overview || ''}</p>
      <div class="browse-hero-actions">
        <button class="btn-hero-play" onclick="openMovieModal(${movie.id})">▶ Play</button>
        <button class="btn-hero-info" onclick="openMovieModal(${movie.id})">ⓘ More Info</button>
      </div>`;
}

// ── All Rows ──────────────────────────────────────────────────────────────────
async function loadAllRows() {
    const container = document.getElementById('browse-rows');
    if (!container) return;
    container.innerHTML = '<div class="flex-center" style="height:200px"><div class="spinner"></div></div>';

    const [trending, popular, topRated, upcoming, tvPop, tvTop, watchlist] = await Promise.all([
        API.getTrending(),
        API.getPopular(),
        API.getTopRated(),
        API.getUpcoming(),
        API.getTVPopular(),
        API.getTVTopRated(),
        Promise.resolve({ results: DB.getWatchlist() })
    ]);

    const rows = [
        { title: 'Trending Now', icon: '🔥', data: trending, id: 'trending' },
        { title: 'Popular Movies', icon: '🎬', data: popular, id: 'popular' },
        { title: 'Top Rated', icon: '⭐', data: topRated, id: 'toprated' },
        { title: 'Coming Soon', icon: '🗓️', data: upcoming, id: 'upcoming' },
        { title: 'Popular TV Shows', icon: '📺', data: tvPop, id: 'tvpop' },
        { title: 'Top Rated TV Shows', icon: '🏆', data: tvTop, id: 'tvtop' },
    ];

    if (watchlist.results.length) {
        rows.unshift({ title: 'My Watchlist', icon: '❤️', data: watchlist, id: 'watchlist' });
    }

    container.innerHTML = rows
        .filter(r => r.data?.results?.length)
        .map(r => Utils.createMovieRow(r.title, r.icon, r.data.results, r.id))
        .join('');

    Utils.bindCardEvents(container, openMovieModal);
}

// ── Movie Modal ───────────────────────────────────────────────────────────────
async function openMovieModal(movieId) {
    const overlay = document.getElementById('movie-modal-overlay');
    const bodyEl = document.getElementById('movie-modal-body');
    if (!overlay || !bodyEl) return;

    bodyEl.innerHTML = '<div class="flex-center" style="height:220px"><div class="spinner"></div></div>';
    overlay.classList.add('active');

    const movie = await API.getMovieDetail(movieId);
    if (!movie) return;

    const backdrop = API.imageUrl(movie.backdrop_path, CONFIG.BACKDROP_SIZE);
    const genres = (movie.genres || []).map(g => `<span class="meta-genre">${g.name}</span>`).join('');
    const inWL = DB.isInWatchlist(movie.id);
    const cast = (movie.credits?.cast || []).slice(0, 5).map(a => a.name).join(', ');

    bodyEl.innerHTML = `
      <div style="position:relative">
        <img src="${backdrop}" alt="${movie.title}"
             style="width:100%;height:280px;object-fit:cover;display:block"
             onerror="this.style.display='none'">
        <div style="position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to bottom,transparent,var(--bg-card))"></div>
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
        ${cast ? `<p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:20px"><strong style="color:var(--text)">Cast:</strong> ${cast}</p>` : ''}
        <div class="movie-modal-actions">
          <button class="btn-play">▶ Play</button>
          <button class="btn-watchlist" id="modal-wl-btn">
            ${inWL ? '✓ In Watchlist' : '+ Watchlist'}
          </button>
        </div>
      </div>`;

    document.getElementById('modal-wl-btn')?.addEventListener('click', () => {
        const added = DB.toggleWatchlist({
            id: movie.id, title: movie.title,
            poster_path: movie.poster_path, release_date: movie.release_date
        });
        const btn = document.getElementById('modal-wl-btn');
        btn.textContent = added ? '✓ In Watchlist' : '+ Watchlist';
        Utils.toast(added ? `Added "${movie.title}"` : 'Removed from watchlist', added ? 'success' : 'info');
        // Refresh rows to update watchlist
        if (!added) loadAllRows();
    });
}

function closeMovieModal() {
    document.getElementById('movie-modal-overlay')?.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'movie-modal-overlay') closeMovieModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMovieModal();
});

// ─── Shared Utilities ────────────────────────────────────────────────────────

const Utils = {
    // Toast
    toast(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container') || (() => {
            const c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
            return c;
        })();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration + 400);
    },

    // Format movie data
    formatRating: (r) => r ? r.toFixed(1) : 'N/A',
    formatYear: (d) => d ? d.slice(0, 4) : '',
    formatRuntime: (m) => m ? `${Math.floor(m / 60)}h ${m % 60}m` : '',

    // Create card HTML
    createMovieCard(movie, showWatchlist = true) {
        const poster = API.imageUrl(movie.poster_path);
        const rating = this.formatRating(movie.vote_average);
        const year = this.formatYear(movie.release_date || movie.first_air_date);
        const title = movie.title || movie.name || 'Untitled';
        const inWL = DB.isLoggedIn() && DB.isInWatchlist(movie.id);

        return `
        <div class="movie-card" data-id="${movie.id}" tabindex="0" role="button"
             aria-label="View details for ${title}">
          <img class="card-img" src="${poster}" alt="${title}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/180x270/1a1a1a/555?text=No+Image'">
          <div class="card-overlay">
            <div class="card-actions">
              <button class="card-btn play" aria-label="Play ${title}">▶</button>
              ${showWatchlist ? `
              <button class="card-btn watchlist-btn ${inWL ? 'active' : ''}"
                      data-id="${movie.id}" data-title="${title}"
                      data-poster="${movie.poster_path || ''}"
                      data-year="${year}"
                      aria-label="${inWL ? 'Remove from' : 'Add to'} watchlist">
                ${inWL ? '✓' : '+'}
              </button>` : ''}
            </div>
            <div class="card-title">${title}</div>
            <div class="card-meta">
              <span class="card-rating">★ ${rating}</span>
              <span>${year}</span>
            </div>
          </div>
        </div>`;
    },

    // Create movie row HTML
    createMovieRow(title, icon, movies, rowId) {
        if (!movies || !movies.length) return '';
        const cards = movies.slice(0, 20).map(m => this.createMovieCard(m)).join('');
        return `
        <div class="movie-row" id="row-${rowId}">
          <h2 class="row-title"><span class="row-icon">${icon}</span>${title}</h2>
          <div class="row-arrow left" onclick="Utils.scrollRow('row-${rowId}', -1)">‹</div>
          <div class="movie-row-track">${cards}</div>
          <div class="row-arrow right" onclick="Utils.scrollRow('row-${rowId}', 1)">›</div>
        </div>`;
    },

    scrollRow(rowId, dir) {
        const track = document.querySelector(`#${rowId} .movie-row-track`);
        if (track) track.scrollBy({ left: dir * 600, behavior: 'smooth' });
    },

    // Bind card click events
    bindCardEvents(container, onCardClick) {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.movie-card');
            if (!card) return;

            // Watchlist button
            const wlBtn = e.target.closest('.watchlist-btn');
            if (wlBtn) {
                e.stopPropagation();
                if (!DB.isLoggedIn()) {
                    Utils.toast('Please sign in to manage your watchlist', 'info');
                    return;
                }
                const movie = {
                    id: parseInt(wlBtn.dataset.id),
                    title: wlBtn.dataset.title,
                    poster_path: wlBtn.dataset.poster,
                    release_date: wlBtn.dataset.year
                };
                const added = DB.toggleWatchlist(movie);
                wlBtn.textContent = added ? '✓' : '+';
                wlBtn.classList.toggle('active', added);
                Utils.toast(added ? `Added "${movie.title}" to watchlist` : `Removed from watchlist`, added ? 'success' : 'info');
                return;
            }

            // Play button
            const playBtn = e.target.closest('.card-btn.play');
            if (playBtn) { e.stopPropagation(); }

            if (onCardClick) onCardClick(parseInt(card.dataset.id));
        });

        // Keyboard
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const card = e.target.closest('.movie-card');
                if (card && onCardClick) { e.preventDefault(); onCardClick(parseInt(card.dataset.id)); }
            }
        });
    },

    // Loader
    showLoader(id = 'page-loader') { document.getElementById(id)?.classList.remove('hidden'); },
    hideLoader(id = 'page-loader') { document.getElementById(id)?.classList.add('hidden'); },

    // Redirect if not logged in
    requireAuth(redirectTo = 'login.html') {
        if (!DB.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },

    // Redirect if already logged in
    redirectIfAuth(to = 'browse.html') {
        if (DB.isLoggedIn()) { window.location.href = to; return true; }
        return false;
    }
};

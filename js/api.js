
const API = {
    buildUrl(endpoint, params = {}) {
        const url = new URL(`${CONFIG.BASE_URL}${endpoint}`);
        url.searchParams.set('api_key', CONFIG.API_KEY);
        url.searchParams.set('language', 'en-US');
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        return url.toString();
    },

    async fetch(endpoint, params = {}) {
        try {
            const res = await fetch(this.buildUrl(endpoint, params));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            return null;
        }
    },

    imageUrl(path, size = CONFIG.POSTER_SIZE) {
        if (!path) return 'assets/placeholder.jpg';
        return `${CONFIG.IMAGE_BASE_URL}${size}${path}`;
    },

    async getTrending() { return this.fetch(CONFIG.ENDPOINTS.TRENDING); },
    async getPopular() { return this.fetch(CONFIG.ENDPOINTS.POPULAR); },
    async getTopRated() { return this.fetch(CONFIG.ENDPOINTS.TOP_RATED); },
    async getNowPlaying() { return this.fetch(CONFIG.ENDPOINTS.NOW_PLAYING); },
    async getUpcoming() { return this.fetch(CONFIG.ENDPOINTS.UPCOMING); },
    async getTVPopular() { return this.fetch(CONFIG.ENDPOINTS.TV_POPULAR); },
    async getTVTopRated() { return this.fetch(CONFIG.ENDPOINTS.TV_TOP_RATED); },

    async getMovieDetail(id) {
        return this.fetch(`${CONFIG.ENDPOINTS.MOVIE_DETAIL}/${id}`, { append_to_response: 'videos,credits' });
    },

    async searchMovies(query, page = 1) {
        return this.fetch(CONFIG.ENDPOINTS.SEARCH, { query, page });
    },

    async getGenres() {
        return this.fetch(CONFIG.ENDPOINTS.GENRES);
    },

    async getByGenre(genreId, page = 1) {
        return this.fetch('/discover/movie', { with_genres: genreId, page, sort_by: 'popularity.desc' });
    },

    async getFeatured() {
        const data = await this.getTrending();
        if (!data || !data.results.length) return null;
        const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
        const movie = data.results[randomIndex];
        return this.getMovieDetail(movie.id);
    }
};

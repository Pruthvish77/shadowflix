// ─── Database (LocalStorage) ──────────────────────────────────────────────────

const DB = {
    KEYS: {
        USERS: 'shadowflix_users',
        SESSION: 'shadowflix_session',
        WATCHLIST: 'shadowflix_watchlist'
    },

    // ── Hashing ────────────────────────────────────────────────────────────────
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'shadowflix_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPassword(password, hash) {
        const newHash = await this.hashPassword(password);
        return newHash === hash;
    },

    // ── Users ──────────────────────────────────────────────────────────────────
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
        } catch { return []; }
    },

    saveUsers(users) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    findUserByEmail(email) {
        return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    findUserByUsername(username) {
        return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
    },

    async registerUser({ firstName, lastName, email, username, password, dob, gender, phone }) {
        const users = this.getUsers();

        // Check duplicates
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Email already registered.' };
        }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, error: 'Username already taken.' };
        }

        const hashedPassword = await this.hashPassword(password);
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            firstName,
            lastName,
            email,
            username,
            password: hashedPassword,
            dob,
            gender,
            phone,
            avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=e50914&color=fff&size=128`,
            createdAt: new Date().toISOString(),
            watchlist: []
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, user: newUser };
    },

    async loginUser(identifier, password) {
        const users = this.getUsers();
        // Find by email or username
        const user = users.find(u =>
            u.email.toLowerCase() === identifier.toLowerCase() ||
            u.username.toLowerCase() === identifier.toLowerCase()
        );

        if (!user) {
            return { success: false, error: 'No account found with that email or username.' };
        }

        const isValid = await this.verifyPassword(password, user.password);
        if (!isValid) {
            return { success: false, error: 'Incorrect password.' };
        }

        // Create session (sans password)
        const session = { ...user };
        delete session.password;
        this.setSession(session);
        return { success: true, user: session };
    },

    // ── Session ────────────────────────────────────────────────────────────────
    setSession(user) {
        sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
    },

    getSession() {
        try {
            return JSON.parse(sessionStorage.getItem(this.KEYS.SESSION));
        } catch { return null; }
    },

    clearSession() {
        sessionStorage.removeItem(this.KEYS.SESSION);
    },

    isLoggedIn() {
        return this.getSession() !== null;
    },

    // ── Watchlist ──────────────────────────────────────────────────────────────
    getWatchlist() {
        const session = this.getSession();
        if (!session) return [];
        const users = this.getUsers();
        const user = users.find(u => u.id === session.id);
        return user ? user.watchlist || [] : [];
    },

    toggleWatchlist(movie) {
        const session = this.getSession();
        if (!session) return false;
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === session.id);
        if (idx === -1) return false;

        const user = users[idx];
        user.watchlist = user.watchlist || [];
        const mIdx = user.watchlist.findIndex(m => m.id === movie.id);
        if (mIdx === -1) {
            user.watchlist.push(movie);
        } else {
            user.watchlist.splice(mIdx, 1);
        }
        users[idx] = user;
        this.saveUsers(users);
        return mIdx === -1; // true = added
    },

    isInWatchlist(movieId) {
        return this.getWatchlist().some(m => m.id === movieId);
    }
};

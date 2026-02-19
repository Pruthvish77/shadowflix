// ─── Login Page Script ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    Utils.redirectIfAuth('browse.html');
    loadAuthBg();
    bindLoginValidation();
});

async function loadAuthBg() {
    const bg = document.getElementById('auth-bg');
    if (!bg) return;
    const data = await API.getNowPlaying();
    const movie = data?.results?.[Math.floor(Math.random() * 5)];
    if (movie?.backdrop_path) {
        bg.style.backgroundImage = `url('${API.imageUrl(movie.backdrop_path, CONFIG.BACKDROP_SIZE)}')`;
    }
}

function bindLoginValidation() {
    const idField = document.getElementById('login-identifier');
    const pwField = document.getElementById('login-password');

    idField?.addEventListener('input', () => {
        const val = idField.value.trim();
        if (val.length > 0) {
            idField.classList.add('input-valid');
            idField.classList.remove('input-invalid');
        } else {
            idField.classList.remove('input-valid');
        }
    });

    pwField?.addEventListener('input', () => {
        const val = pwField.value;
        if (val.length > 0) {
            pwField.classList.add('input-valid');
            pwField.classList.remove('input-invalid');
        } else {
            pwField.classList.remove('input-valid');
        }
    });
}

function togglePw(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
}

async function handleLogin(e) {
    e.preventDefault();

    const identifier = document.getElementById('login-identifier')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const btn = document.getElementById('login-submit');
    const alertEl = document.getElementById('login-alert');

    // Client-side checks
    if (!identifier) {
        showAlert(alertEl, 'Please enter your email or username', 'error');
        document.getElementById('login-identifier')?.classList.add('input-invalid');
        return;
    }
    if (!password) {
        showAlert(alertEl, 'Please enter your password', 'error');
        document.getElementById('login-password')?.classList.add('input-invalid');
        return;
    }

    btn.disabled = true;
    btn.classList.add('loading');
    alertEl.classList.remove('show');

    // Attempt login
    const result = await DB.loginUser(identifier, password);

    btn.disabled = false;
    btn.classList.remove('loading');

    if (result.success) {
        showAlert(alertEl, `Welcome back, ${result.user.firstName}! 🎬`, 'success');
        Utils.toast(`Welcome back, ${result.user.firstName}!`, 'success');
        setTimeout(() => { window.location.href = 'browse.html'; }, 900);
    } else {
        showAlert(alertEl, result.error, 'error');
        document.getElementById('login-password')?.classList.add('input-invalid');
        // Add shake animation
        document.querySelector('.auth-card')?.classList.add('shake');
        setTimeout(() => document.querySelector('.auth-card')?.classList.remove('shake'), 600);
    }
}

function showAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert ${type} show`;
}

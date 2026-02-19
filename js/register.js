// ─── Registration Page Script ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    Utils.redirectIfAuth('browse.html');

    // Pre-fill email from landing page
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
        const emailField = document.getElementById('reg-email');
        if (emailField) { emailField.value = emailParam; validateEmail(); }
    }

    bindValidation();
    loadAuthBg();
});

// ── Background ───────────────────────────────────────────────────────────────
async function loadAuthBg() {
    const bg = document.getElementById('auth-bg');
    if (!bg) return;
    const data = await API.getPopular();
    if (data?.results?.[0]?.backdrop_path) {
        bg.style.backgroundImage = `url('${API.imageUrl(data.results[0].backdrop_path, CONFIG.BACKDROP_SIZE)}')`;
    }
}

// ── Field Validation ──────────────────────────────────────────────────────────
function bindValidation() {
    // First Name
    bindRequired('reg-firstname', 'reg-firstname-msg', 'Please enter your first name',
        v => v.length >= 2, 'At least 2 characters');

    // Last Name
    bindRequired('reg-lastname', 'reg-lastname-msg', 'Please enter your last name',
        v => v.length >= 2, 'At least 2 characters');

    // Email
    document.getElementById('reg-email')?.addEventListener('input', validateEmail);

    // Username
    document.getElementById('reg-username')?.addEventListener('input', validateUsername);

    // Phone
    document.getElementById('reg-phone')?.addEventListener('input', () => {
        const field = document.getElementById('reg-phone');
        const msg = document.getElementById('reg-phone-msg');
        const val = field.value.trim();
        if (!val) { clearMsg(field, msg); return; }
        const valid = /^\+?[\d\s\-()]{7,15}$/.test(val);
        setFieldState(field, msg, valid, valid ? '' : 'Enter a valid phone number');
    });

    // DOB
    document.getElementById('reg-dob')?.addEventListener('change', () => {
        const field = document.getElementById('reg-dob');
        const msg = document.getElementById('reg-dob-msg');
        const val = new Date(field.value);
        const now = new Date();
        const age = (now - val) / (1000 * 60 * 60 * 24 * 365.25);
        if (!field.value) { clearMsg(field, msg); return; }
        setFieldState(field, msg, age >= 13,
            age < 13 ? 'You must be at least 13 years old' : '');
    });

    // Password
    document.getElementById('reg-password')?.addEventListener('input', validatePassword);

    // Confirm Password
    document.getElementById('reg-confirm')?.addEventListener('input', validateConfirm);
}

function bindRequired(id, msgId, emptyMsg, extraTest, extraMsg) {
    const field = document.getElementById(id);
    const msg = document.getElementById(msgId);
    field?.addEventListener('input', () => {
        const val = field.value.trim();
        if (!val) { setFieldState(field, msg, false, emptyMsg); return; }
        if (extraTest && !extraTest(val)) { setFieldState(field, msg, false, extraMsg); return; }
        setFieldState(field, msg, true, '');
    });
}

function validateEmail() {
    const field = document.getElementById('reg-email');
    const msg = document.getElementById('reg-email-msg');
    const val = field.value.trim();
    if (!val) { setFieldState(field, msg, false, 'Email is required'); return; }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setFieldState(field, msg, valid, valid ? '' : 'Enter a valid email address');
}

function validateUsername() {
    const field = document.getElementById('reg-username');
    const msg = document.getElementById('reg-username-msg');
    const val = field.value.trim();
    if (!val) { setFieldState(field, msg, false, 'Username is required'); return; }
    if (val.length < 3) { setFieldState(field, msg, false, 'At least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
        setFieldState(field, msg, false, 'Only letters, numbers, underscores'); return;
    }
    // Check if taken
    const taken = DB.findUserByUsername(val);
    setFieldState(field, msg, !taken, taken ? 'Username already taken' : '');
}

function validatePassword() {
    const field = document.getElementById('reg-password');
    const val = field.value;

    // Strength
    const strength = PasswordValidator.getStrength(val);
    const fill = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');
    if (fill) { fill.style.width = strength.score + '%'; fill.style.background = strength.color; }
    if (label) { label.textContent = strength.label; label.style.color = strength.color; }

    // Rules
    const { results } = PasswordValidator.validate(val);
    results.forEach(r => {
        const ruleEl = document.getElementById(`rule-${r.id}`);
        if (!ruleEl) return;
        ruleEl.classList.toggle('passed', r.passed);
        ruleEl.classList.toggle('failed', val.length > 0 && !r.passed);
        const icon = ruleEl.querySelector('.pw-rule-icon');
        if (icon) icon.textContent = r.passed ? '✓' : (val.length > 0 ? '✗' : '○');
    });

    const allPass = results.every(r => r.passed);
    field.classList.toggle('input-valid', allPass && val.length > 0);
    field.classList.toggle('input-invalid', !allPass && val.length > 0);

    // Re-validate confirm
    if (document.getElementById('reg-confirm').value) validateConfirm();
}

function validateConfirm() {
    const pw = document.getElementById('reg-password')?.value;
    const field = document.getElementById('reg-confirm');
    const msg = document.getElementById('reg-confirm-msg');
    const val = field.value;
    if (!val) { clearMsg(field, msg); return; }
    setFieldState(field, msg, pw === val, pw !== val ? 'Passwords do not match' : '');
}

function setFieldState(field, msgEl, valid, errorMsg) {
    field.classList.toggle('input-valid', valid);
    field.classList.toggle('input-invalid', !valid);
    if (msgEl) {
        msgEl.className = `form-msg ${valid ? 'success' : 'error'}`;
        msgEl.innerHTML = valid
            ? (errorMsg ? '' : '<span>✓ Looks good</span>')
            : `<span>⚠ ${errorMsg}</span>`;
    }
}
function clearMsg(field, msgEl) {
    field.classList.remove('input-valid', 'input-invalid');
    if (msgEl) { msgEl.className = 'form-msg'; msgEl.innerHTML = ''; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function togglePw(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
}

// ── Form Submit ───────────────────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('reg-submit');
    const alertEl = document.getElementById('reg-alert');

    const data = {
        firstName: document.getElementById('reg-firstname').value.trim(),
        lastName: document.getElementById('reg-lastname').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        password: document.getElementById('reg-password').value,
        dob: document.getElementById('reg-dob').value,
        gender: document.getElementById('reg-gender').value,
        phone: document.getElementById('reg-phone').value.trim(),
    };

    // Validate all
    const errors = [];
    if (!data.firstName || data.firstName.length < 2) errors.push('First name is required');
    if (!data.lastName || data.lastName.length < 2) errors.push('Last name is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Valid email is required');
    if (!data.username || data.username.length < 3) errors.push('Username is required');
    if (!data.dob) errors.push('Date of birth is required');
    if (!data.gender) errors.push('Please select a gender');
    if (!document.getElementById('reg-terms').checked) errors.push('You must accept the terms');

    const { valid, results } = PasswordValidator.validate(data.password);
    if (!valid) {
        const failed = results.filter(r => !r.passed).map(r => r.label);
        errors.push('Password: ' + failed[0]);
    }
    if (data.password !== document.getElementById('reg-confirm').value) {
        errors.push('Passwords do not match');
    }

    if (errors.length) {
        showAlert(alertEl, errors[0], 'error');
        return;
    }

    btn.disabled = true;
    btn.classList.add('loading');
    alertEl.classList.remove('show');

    const result = await DB.registerUser(data);

    btn.disabled = false;
    btn.classList.remove('loading');

    if (result.success) {
        showAlert(alertEl, '🎉 Account created! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'browse.html'; }, 1200);
    } else {
        showAlert(alertEl, result.error, 'error');
    }
}

function showAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert ${type} show`;
}

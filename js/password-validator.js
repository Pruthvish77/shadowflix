// ─── Password Validation (All Test Cases) ────────────────────────────────────

const PasswordValidator = {
    rules: [
        {
            id: 'length',
            label: 'At least 8 characters',
            test: (pw) => pw.length >= 8
        },
        {
            id: 'uppercase',
            label: 'At least one uppercase letter (A-Z)',
            test: (pw) => /[A-Z]/.test(pw)
        },
        {
            id: 'lowercase',
            label: 'At least one lowercase letter (a-z)',
            test: (pw) => /[a-z]/.test(pw)
        },
        {
            id: 'digit',
            label: 'At least one digit (0-9)',
            test: (pw) => /[0-9]/.test(pw)
        },
        {
            id: 'special',
            label: 'At least one special character (!@#$%^&*...)',
            test: (pw) => /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/\\`~]/.test(pw)
        },
        {
            id: 'no_spaces',
            label: 'No spaces allowed',
            test: (pw) => !/\s/.test(pw)
        },
        {
            id: 'max_length',
            label: 'No more than 64 characters',
            test: (pw) => pw.length <= 64
        },
        {
            id: 'not_common',
            label: 'Not a common password',
            test: (pw) => {
                const common = [
                    'password', 'password1', '123456', '12345678', 'qwerty',
                    'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
                    'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
                    'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
                    'welcome', 'login', 'hello', 'admin', 'pass', 'test'
                ];
                return !common.includes(pw.toLowerCase());
            }
        },
        {
            id: 'no_repeat',
            label: 'No more than 3 repeating characters in a row',
            test: (pw) => !/(.)\1{3,}/.test(pw)
        },
        {
            id: 'no_sequential',
            label: 'No obvious sequential patterns (e.g. 1234, abcd)',
            test: (pw) => {
                const sequences = ['0123', '1234', '2345', '3456', '4567', '5678', '6789',
                    'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij', 'hijk', 'ijkl',
                    'jklm', 'klmn', 'lmno', 'mnop', 'nopq', 'opqr', 'pqrs', 'qrst', 'rstu',
                    'stuv', 'tuvw', 'uvwx', 'vwxy', 'wxyz'];
                const lower = pw.toLowerCase();
                return !sequences.some(seq => lower.includes(seq));
            }
        }
    ],

    validate(password) {
        const results = this.rules.map(rule => ({
            id: rule.id,
            label: rule.label,
            passed: rule.test(password)
        }));
        const allPassed = results.every(r => r.passed);
        return { valid: allPassed, results };
    },

    getStrength(password) {
        if (!password) return { score: 0, label: '', color: '' };
        const { results } = this.validate(password);
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const score = Math.round((passed / total) * 100);

        if (score < 40) return { score, label: 'Weak', color: '#e50914' };
        if (score < 60) return { score, label: 'Fair', color: '#f5a623' };
        if (score < 80) return { score, label: 'Good', color: '#f5d720' };
        if (score < 100) return { score, label: 'Strong', color: '#4caf50' };
        return { score, label: 'Very Strong', color: '#00e676' };
    }
};

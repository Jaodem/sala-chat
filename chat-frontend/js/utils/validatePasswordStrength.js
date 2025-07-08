export function isPasswordStrong(password) {
    return {
        length: password.length >= 6,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password),
        symbol: /[@$!%*#?&_\-]/.test(password)
    };
}

export function isPasswordValid(password) {
    const rules = isPasswordStrong(password);
    return Object.values(rules).every(Boolean);
}

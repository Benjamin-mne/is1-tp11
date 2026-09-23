/**
 * MockAuth: simulación de autenticación basada en localStorage.
 * Los usuarios registrados y la sesión activa persisten entre recargas.
 * La recuperación de contraseña usa sessionStorage (vive solo en la pestaña).
 */
const MockAuth = (() => {
    const USERS_KEY = "tp11_users";
    const SESSION_KEY = "tp11_session";
    const RECOVERY_KEY = "tp11_recovery";

    const DEMO_USER = { email: "demo@example.com", password: "demo1234" };

    const read = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };

    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

    const readSession = (key, fallback) => {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };

    const writeSession = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));

    /** Devuelve la lista de usuarios garantizando que el demo existe. */
    const loadUsers = () => {
        const users = read(USERS_KEY, []);
        if (!users.some((u) => u.email === DEMO_USER.email)) {
            users.push(DEMO_USER);
            write(USERS_KEY, users);
        }
        return users;
    };

    const saveUsers = (users) => write(USERS_KEY, users);

    const normalizeEmail = (email) => email.toLowerCase().trim();

    const findByEmail = (email) => loadUsers().find((u) => u.email === normalizeEmail(email)) || null;

    const register = ({ email, password }) => {
        const key = normalizeEmail(email);
        if (findByEmail(key)) {
            return { ok: false, error: "Ya existe una cuenta registrada con ese e-mail." };
        }
        const users = loadUsers();
        users.push({ email: key, password });
        saveUsers(users);
        return { ok: true };
    };

    const login = (email, password) => {
        const user = findByEmail(email);
        if (!user || user.password !== password) {
            return { ok: false, error: "Credenciales incorrectas. Verificá tu e-mail y contraseña." };
        }
        write(SESSION_KEY, { email: user.email });
        return { ok: true };
    };

    const logout = () => localStorage.removeItem(SESSION_KEY);

    const currentUser = () => read(SESSION_KEY, null);

    const updatePassword = (email, newPassword) => {
        const key = normalizeEmail(email);
        const users = loadUsers();
        const index = users.findIndex((u) => u.email === key);
        if (index === -1) {
            return { ok: false, error: "El usuario ya no existe." };
        }
        users[index].password = newPassword;
        saveUsers(users);
        return { ok: true };
    };

    const setRecovery = (data) => writeSession(RECOVERY_KEY, data);

    const getRecovery = () => readSession(RECOVERY_KEY, null);

    const clearRecovery = () => sessionStorage.removeItem(RECOVERY_KEY);

    /** Genera un código de 6 dígitos para simular el envío por e-mail. */
    const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

    return {
        findByEmail,
        register,
        login,
        logout,
        currentUser,
        updatePassword,
        setRecovery,
        getRecovery,
        clearRecovery,
        generateCode,
    };
})();
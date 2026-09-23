/**
 * app.js: inicializa el flujo de cada página según el atributo
 * data-page que tiene <body>. Se encarga de la interacción entre
 * páginas (navegación, sesión y recuperación de contraseña).
 */
document.addEventListener("DOMContentLoaded", () => {
    const pageHandlers = {
        login: initLogin,
        register: initRegister,
        recovery: initRecovery,
        verify: initVerify,
        "new-password": initNewPassword,
        dashboard: initDashboard,
    };

    const page = document.body.dataset.page;
    if (pageHandlers[page]) pageHandlers[page]();
});

/* ---------------------------------------------------------------------------
   Utilidades de UI
--------------------------------------------------------------------------- */
const Ui = {
    showMessage(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `form-message form-message--${type}`;
        el.hidden = false;
    },

    hideMessage(el) {
        if (!el) return;
        el.textContent = "";
        el.hidden = true;
    },

    showFlash(text) {
        const el = document.getElementById("flash");
        if (!el) return;
        el.textContent = text;
        el.classList.add("show");
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove("show"), 4000);
    },
};

const FLASH_MESSAGES = {
    registered: "Cuenta creada exitosamente. Ahora podés iniciar sesión.",
    reset: "Contraseña actualizada. Iniciá sesión con tu nueva contraseña.",
    logout: "Sesión cerrada correctamente.",
};

/** Muestra un banner de confirmación leído del query string (?flash=...). */
function showFlashFromParam() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("flash");
    if (!key || !FLASH_MESSAGES[key]) return;
    Ui.showFlash(FLASH_MESSAGES[key]);
    const url = new URL(window.location.href);
    url.searchParams.delete("flash");
    try {
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } catch {
        /* Al abrir el archivo con file://, algunos navegadores bloquean replaceState. */
    }
}

function getFormMessage(form) {
    return document.getElementById("form-message");
}

/* ---------------------------------------------------------------------------
   LOGIN (index.html)
--------------------------------------------------------------------------- */
function initLogin() {
    if (MockAuth.currentUser()) {
        window.location.replace("dashboard.html");
        return;
    }

    showFlashFromParam();

    const form = document.getElementById("login-form");
    const message = getFormMessage(form);

    const rules = {
        "login-email": [Validator.required, Validator.email],
        "login-pass": [Validator.required],
    };
    Validator.clearOnInput(form, rules);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        Ui.hideMessage(message);

        const result = Validator.validate(form, rules);
        if (!result.ok) {
            result.firstErrorEl.focus();
            return;
        }

        const auth = MockAuth.login(
            form.elements["login-email"].value,
            form.elements["login-pass"].value
        );

        if (!auth.ok) {
            Ui.showMessage(message, auth.error, "error");
            return;
        }

        window.location.href = "dashboard.html";
    });
}

/* ---------------------------------------------------------------------------
   REGISTRO (register.html)
--------------------------------------------------------------------------- */
function initRegister() {
    if (MockAuth.currentUser()) {
        window.location.replace("dashboard.html");
        return;
    }

    const form = document.getElementById("register-form");
    const message = getFormMessage(form);

    const notRegistered = (f, input) =>
        MockAuth.findByEmail(input.value) ? "Ya existe una cuenta con ese e-mail." : "";

    const rules = {
        "reg-email": [Validator.required, Validator.email, notRegistered],
        "reg-pass": [Validator.required, Validator.minLength(6, "La contraseña debe tener al menos 6 caracteres.")],
        "reg-pass-confirm": [Validator.required, Validator.matches("reg-pass", "Las contraseñas no coinciden.")],
        "reg-terms": [Validator.required],
    };
    Validator.clearOnInput(form, rules);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        Ui.hideMessage(message);

        const result = Validator.validate(form, rules);
        if (!result.ok) {
            result.firstErrorEl.focus();
            return;
        }

        const auth = MockAuth.register({
            email: form.elements["reg-email"].value,
            password: form.elements["reg-pass"].value,
        });

        if (!auth.ok) {
            Ui.showMessage(message, auth.error, "error");
            return;
        }

        window.location.href = "index.html?flash=registered";
    });
}

/* ---------------------------------------------------------------------------
   RECUPERACIÓN - Paso 1: ingresar e-mail (recovery.html)
--------------------------------------------------------------------------- */
function initRecovery() {
    const form = document.getElementById("recovery-form");
    const message = getFormMessage(form);

    const registeredUser = (f, input) =>
        MockAuth.findByEmail(input.value) ? "" : "No existe una cuenta con ese e-mail. ¿Probaste registrarte?";

    const rules = {
        "recovery-email": [Validator.required, Validator.email, registeredUser],
    };
    Validator.clearOnInput(form, rules);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        Ui.hideMessage(message);

        const result = Validator.validate(form, rules);
        if (!result.ok) {
            result.firstErrorEl.focus();
            return;
        }

        const email = form.elements["recovery-email"].value.trim();
        const code = MockAuth.generateCode();
        MockAuth.setRecovery({ email, code });

        window.location.href = "verify.html";
    });
}

/* ---------------------------------------------------------------------------
   RECUPERACIÓN - Paso 2: verificar código OTP (verify.html)
--------------------------------------------------------------------------- */
function initVerify() {
    const state = MockAuth.getRecovery();
    if (!state) {
        window.location.replace("recovery.html");
        return;
    }

    const emailEl = document.getElementById("verify-email");
    if (emailEl) emailEl.textContent = state.email;

    const codeEl = document.getElementById("mock-code");
    if (codeEl) codeEl.textContent = state.code;

    const form = document.getElementById("verify-form");
    const message = getFormMessage(form);
    const otpInputs = initOtp(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        Ui.hideMessage(message);

        const code = Array.from(otpInputs).map((input) => input.value).join("");
        if (code.length < 6) {
            Ui.showMessage(message, "Completá los 6 dígitos del código.", "error");
            return;
        }

        if (code !== state.code) {
            Ui.showMessage(message, "El código ingresado es incorrecto.", "error");
            return;
        }

        window.location.href = "new-password.html";
    });

    const resend = document.getElementById("resend-code");
    if (resend) {
        resend.addEventListener("click", (event) => {
            event.preventDefault();
            const newCode = MockAuth.generateCode();
            MockAuth.setRecovery({ ...state, code: newCode });
            if (codeEl) codeEl.textContent = newCode;
            if (emailEl) emailEl.textContent = state.email;
            Ui.showMessage(message, "Te reenviamos un nuevo código de prueba.", "notice");
        });
    }
}

/* ---------------------------------------------------------------------------
   RECUPERACIÓN - Paso 3: nueva contraseña (new-password.html)
--------------------------------------------------------------------------- */
function initNewPassword() {
    const state = MockAuth.getRecovery();
    if (!state) {
        window.location.replace("recovery.html");
        return;
    }

    const form = document.getElementById("new-password-form");
    const message = getFormMessage(form);

    const rules = {
        "new-pass": [Validator.required, Validator.minLength(6, "La contraseña debe tener al menos 6 caracteres.")],
        "new-pass-confirm": [Validator.required, Validator.matches("new-pass", "Las contraseñas no coinciden.")],
    };
    Validator.clearOnInput(form, rules);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        Ui.hideMessage(message);

        const result = Validator.validate(form, rules);
        if (!result.ok) {
            result.firstErrorEl.focus();
            return;
        }

        const auth = MockAuth.updatePassword(state.email, form.elements["new-pass"].value);
        if (!auth.ok) {
            Ui.showMessage(message, auth.error, "error");
            return;
        }

        MockAuth.clearRecovery();
        window.location.href = "index.html?flash=reset";
    });
}

/* ---------------------------------------------------------------------------
   DASHBOARD (dashboard.html)
--------------------------------------------------------------------------- */
function initDashboard() {
    const user = MockAuth.currentUser();
    if (!user) {
        window.location.replace("index.html");
        return;
    }

    const emailLabel = document.getElementById("user-email");
    if (emailLabel) emailLabel.textContent = user.email;

    const nameLabel = document.getElementById("user-name");
    if (nameLabel) nameLabel.textContent = user.email.split("@")[0];

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            MockAuth.logout();
            window.location.href = "index.html?flash=logout";
        });
    }
}

/* ---------------------------------------------------------------------------
   CÓDIGO OTP (autofoco, solo números, borrado y pegado)
--------------------------------------------------------------------------- */
function initOtp(form) {
    const inputs = form.querySelectorAll(".otp-inputs input");

    inputs.forEach((input, index) => {
        input.addEventListener("input", (event) => {
            event.target.value = event.target.value.replace(/[^0-9]/g, "");
            if (event.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (event) => {
            if (event.key === "Backspace" && event.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });

        input.addEventListener("paste", (event) => {
            event.preventDefault();
            const data = (event.clipboardData || window.clipboardData).getData("text");
            const numbers = data.replace(/[^0-9]/g, "").split("").slice(0, inputs.length);
            numbers.forEach((digit, i) => {
                if (inputs[i]) {
                    inputs[i].value = digit;
                    if (i < inputs.length - 1) inputs[i + 1].focus();
                }
            });
        });
    });

    return inputs;
}
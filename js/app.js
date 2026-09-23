/**
 * app.js: inicializa el flujo de cada página según el atributo
 * data-page que tiene <body>. Se encarga de la interacción entre
 * páginas (navegación, sesión, recuperación de contraseña y tickets).
 */
/**
 * URL del repositorio de origen, usada por el badge "Source Code".
 */
const SOURCE_CODE_URL = "https://github.com/Benjamin-mne/is1-tp11";

/**
 * Crea el badge "Source Code" (con el logo de GitHub) que flota por fuera
 * de las pantallas, al estilo del badge "Powered by Netlify", como acceso
 * directo al repositorio del prototipo.
 */
function injectSourceBadge() {
    if (document.querySelector(".source-badge")) return;

    const badge = document.createElement("a");
    badge.className = "source-badge";
    badge.href = SOURCE_CODE_URL;
    badge.target = "_blank";
    badge.rel = "noopener noreferrer";
    badge.setAttribute("aria-label", "Source Code (repositorio de GitHub)");

    badge.innerHTML =
        '<svg class="source-badge__logo" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27 1.36 0 2.04.09 2 .27.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>' +
        "</svg>" +
        "<span class=\"source-badge__text\">Source Code</span>";

    document.body.appendChild(badge);
}

document.addEventListener("DOMContentLoaded", () => {
    injectSourceBadge();

    const pageHandlers = {
        login: initLogin,
        register: initRegister,
        recovery: initRecovery,
        verify: initVerify,
        "new-password": initNewPassword,
        helpdesk: initHelpdesk,
        "ticket-detail": initTicketDetail,
        "ticket-create": initTicketCreate,
        "ticket-append": initTicketAppend,
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
    created: "Ticket creado correctamente.",
    canceled: "El ticket fue cancelado.",
    details_added: "Los detalles fueron agregados al ticket.",
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

/** Sanitiza texto del usuario antes de insertarlo en el DOM. */
const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[char]));

/* ---------------------------------------------------------------------------
   Estados e íconos de tickets (Material Symbols)
--------------------------------------------------------------------------- */
const TICKET_STATUS = {
    pending: { label: "Pendiente", icon: "schedule" },
    "in-progress": { label: "En proceso", icon: "sync" },
    resolved: { label: "Resuelto", icon: "check_circle" },
    canceled: { label: "Cancelado", icon: "cancel" },
};

/** Renderiza un chip de estado (ícono Material + texto). */
const statusChip = (ticket) => {
    const meta = TICKET_STATUS[ticket.status] || TICKET_STATUS.pending;
    return (
        `<span class="status-chip status--${ticket.status}">` +
        `<span class="material-symbols-outlined" aria-hidden="true">${meta.icon}</span>` +
        `${meta.label}</span>`
    );
};

/** Renderiza una tarjeta del listado de tickets. */
const ticketCard = (ticket) => `
    <a href="ticket-detail.html?id=${ticket.id}" class="ticket-card status--${ticket.status}">
        <div class="ticket-id">Ticket N° ${escapeHtml(ticket.code)}</div>
        <p class="ticket-desc"><strong>Descripción:</strong> ${escapeHtml(ticket.headline)}</p>
        <span class="ticket-date">Fecha: ${escapeHtml(ticket.date)}</span>
        <div class="ticket-status-label">${statusChip(ticket)}</div>
    </a>`;

/** Guard: las páginas del portal exigen sesión iniciada. */
function requireSession() {
    if (MockAuth.currentUser()) return true;
    window.location.replace("index.html");
    return false;
}

/* ---------------------------------------------------------------------------
   LOGIN (index.html)
--------------------------------------------------------------------------- */
function initLogin() {
    if (MockAuth.currentUser()) {
        window.location.replace("helpdesk.html");
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

        window.location.href = "helpdesk.html";
    });
}

/* ---------------------------------------------------------------------------
   REGISTRO (register.html)
--------------------------------------------------------------------------- */
function initRegister() {
    if (MockAuth.currentUser()) {
        window.location.replace("helpdesk.html");
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

        // Se lee el código vigente del store: también sirve para códigos reenviados.
        const current = MockAuth.getRecovery();
        if (!current || code !== current.code) {
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
            MockAuth.setRecovery({ email: state.email, code: newCode });
            if (codeEl) codeEl.textContent = newCode;
            otpInputs.forEach((input) => {
                input.value = "";
            });
            if (otpInputs[0]) otpInputs[0].focus();
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
   MESA DE AYUDA - Home / listado (helpdesk.html)
--------------------------------------------------------------------------- */
function initHelpdesk() {
    if (!requireSession()) return;
    showFlashFromParam();

    const user = MockAuth.currentUser();

    const listEl = document.getElementById("tickets-list");
    const filterEl = document.getElementById("ticket-filter");
    const countEl = document.getElementById("tickets-count");

    const render = () => {
        const status = filterEl ? filterEl.value : "all";
        const tickets = MockTickets.list(status);

        if (countEl) countEl.textContent = `(${tickets.length})`;

        if (!listEl) return;
        if (!tickets.length) {
            listEl.innerHTML = '<p class="empty-state">No hay tickets en esta vista.</p>';
            return;
        }
        listEl.innerHTML = tickets.map(ticketCard).join("");
    };

    if (filterEl) filterEl.addEventListener("change", render);
    render();

    const menuBtn = document.getElementById("user-menu-btn");
    const menu = document.getElementById("user-menu");
    const menuEmail = document.getElementById("user-menu-email");
    if (menuEmail) menuEmail.textContent = user.email;

    if (menuBtn && menu) {
        const setMenuOpen = (open) => {
            menu.hidden = !open;
            menuBtn.setAttribute("aria-expanded", String(open));
        };

        menuBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            setMenuOpen(menu.hidden);
        });

        document.addEventListener("click", (event) => {
            if (!menu.hidden && !menu.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (!menu.hidden && event.key === "Escape") {
                setMenuOpen(false);
                menuBtn.focus();
            }
        });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            MockAuth.logout();
            window.location.href = "index.html?flash=logout";
        });
    }
}

/* ---------------------------------------------------------------------------
   MESA DE AYUDA - Detalle de ticket (ticket-detail.html)
--------------------------------------------------------------------------- */
function initTicketDetail() {
    if (!requireSession()) return;
    showFlashFromParam();

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const ticket = id ? MockTickets.get(id) : null;
    if (!ticket) {
        window.location.replace("helpdesk.html");
        return;
    }

    document.getElementById("detail-id").textContent = `Ticket ${ticket.code}`;
    document.getElementById("detail-title").textContent = ticket.headline;
    document.getElementById("detail-body").textContent = ticket.description;
    document.getElementById("detail-client").textContent = ticket.client;
    document.getElementById("detail-date").textContent = ticket.date;
    document.getElementById("detail-status").innerHTML = statusChip(ticket);

    const appendLink = document.getElementById("append-details-link");
    if (appendLink) appendLink.href = `ticket-append.html?id=${ticket.id}`;

    const cancelBtn = document.getElementById("cancel-ticket-btn");
    const actionRow = document.querySelector(".button-split-row");
    const closedNote = document.getElementById("detail-closed-note");

    // Un ticket resuelto o cancelado no admite cancelarlo ni modificarle detalles.
    const actionable = ticket.status !== "resolved" && ticket.status !== "canceled";

    if (!actionable) {
        if (actionRow) actionRow.hidden = true;
        if (closedNote) {
            closedNote.textContent =
                ticket.status === "canceled"
                    ? "Este ticket está cancelado y ya no se puede modificar."
                    : "Este ticket está resuelto y ya no se puede modificar.";
            closedNote.hidden = false;
        }
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            MockTickets.cancel(ticket.id);
            window.location.href = "helpdesk.html?flash=canceled";
        });
    }
}

/* ---------------------------------------------------------------------------
   MESA DE AYUDA - Cargar ticket (ticket-create.html)
--------------------------------------------------------------------------- */
function initTicketCreate() {
    if (!requireSession()) return;

    const form = document.getElementById("create-form");
    const message = getFormMessage(form);

    const rules = {
        "ticket-headline": [Validator.required],
        "ticket-description": [Validator.required],
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

        MockTickets.create({
            headline: form.elements["ticket-headline"].value,
            description: form.elements["ticket-description"].value,
            client: MockAuth.currentUser().email,
        });

        window.location.href = "helpdesk.html?flash=created";
    });
}

/* ---------------------------------------------------------------------------
   MESA DE AYUDA - Agregar detalles (ticket-append.html)
--------------------------------------------------------------------------- */
function initTicketAppend() {
    if (!requireSession()) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const ticket = id ? MockTickets.get(id) : null;
    if (!ticket) {
        window.location.replace("helpdesk.html");
        return;
    }

    // Un ticket resuelto o cancelado ya no admite modificaciones.
    if (ticket.status === "resolved" || ticket.status === "canceled") {
        window.location.replace(`ticket-detail.html?id=${ticket.id}`);
        return;
    }

    const backEl = document.getElementById("append-back");
    if (backEl) backEl.href = `ticket-detail.html?id=${ticket.id}`;

    document.getElementById("preview-id").textContent = `Ticket ${ticket.code}`;
    document.getElementById("preview-title").textContent = ticket.headline;
    document.getElementById("preview-snippet").textContent =
        ticket.description.length > 80
            ? `${ticket.description.slice(0, 80)}...`
            : ticket.description;

    const form = document.getElementById("append-form");
    const message = getFormMessage(form);

    const rules = {
        "ticket-extra-details": [Validator.required],
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

        MockTickets.appendDetail(ticket.id, form.elements["ticket-extra-details"].value);
        window.location.href = `ticket-detail.html?id=${ticket.id}&flash=details_added`;
    });
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
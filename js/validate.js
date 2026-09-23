/**
 * Validator: utilidades de validación de formularios.
 * Cada validador recibe (form, input, value) y devuelve un mensaje
 * de error, o un string vacío si el campo es válido.
 */
const Validator = (() => {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const required = (form, input) => {
        if (input.type === "checkbox") {
            return input.checked ? "" : "Debe marcar esta opción.";
        }
        return input.value.trim() ? "" : "Este campo es obligatorio.";
    };

    const email = (form, input) => {
        const value = input.value.trim();
        if (!value) return "Este campo es obligatorio.";
        return EMAIL_RE.test(value) ? "" : "Ingrese un e-mail válido.";
    };

    const minLength = (min, message) => (form, input) =>
        input.value.length >= min ? "" : message;

    const matches = (otherName, message) => (form, input) => {
        const other = form.elements[otherName];
        if (!other) return "";
        return input.value === other.value ? "" : message;
    };

    /** Ejecuta los validadores de un campo y devuelve el primer error. */
    const runValidators = (form, input, validators) => {
        for (const fn of validators) {
            const message = fn(form, input, input.value) || "";
            if (message) return message;
        }
        return "";
    };

    /** Pinta/limpia el error de un campo según su <small class="field-error">. */
    const setError = (input, message) => {
        const group = input.closest(".input-group");
        if (!group) return;
        group.classList.toggle("has-error", Boolean(message));
        const errorEl = group.querySelector(".field-error");
        if (errorEl) errorEl.textContent = message;
    };

    /**
     * Valida un formulario completo a partir de un mapa de reglas.
     * rules: { nombreDelCampo: [validators...] }
     */
    const validate = (form, rules) => {
        let firstErrorEl = null;
        Object.entries(rules).forEach(([name, validators]) => {
            const input = form.elements[name];
            if (!input) return;
            const message = runValidators(form, input, validators);
            setError(input, message);
            if (message && !firstErrorEl) firstErrorEl = input;
        });
        return firstErrorEl ? { ok: false, firstErrorEl } : { ok: true };
    };

    /** Limpia el error de un campo en cada interacción del usuario. */
    const clearOnInput = (form, rules) => {
        Object.keys(rules).forEach((name) => {
            const input = form.elements[name];
            if (!input) return;
            ["input", "change", "blur"].forEach((eventName) => {
                input.addEventListener(eventName, () => {
                    setError(input, runValidators(form, input, rules[name]));
                });
            });
        });
    };

    return { required, email, minLength, matches, validate, clearOnInput };
})();
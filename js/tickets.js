/**
 * MockTickets: simulación del listado de tickets de la Mesa de Ayuda.
 * Persiste en localStorage y viene precargado con tickets de demostración.
 * Las operaciones (crear, agregar detalle, cancelar) actualizan el listado real.
 */
const MockTickets = (() => {
    const KEY = "tp11_tickets";

    const SEED = [
        {
            id: 1,
            code: "0003-0003-0456",
            headline: "Error con el carrito de compras",
            description:
                '"Cuando intento agregar más de 5 artículos al carrito, la imagen de los últimos productos comienza a salirse de la pantalla, impidiendo la interacción con el producto".',
            client: "Rafaela Carra",
            date: "12-07-2026",
            status: "resolved",
        },
        {
            id: 2,
            code: "F003-0aa3-0489",
            headline: "Fallo gráfico en la pantalla de login",
            description:
                "Al abrir la aplicación, el fondo de la pantalla de login se renderiza en blanco hasta que se toca la pantalla una vez.",
            client: "Rafaela Carra",
            date: "13-07-2026",
            status: "pending",
        },
        {
            id: 3,
            code: "0e03-0003-0489",
            headline: "Demora en la carga de la pasarela de pagos",
            description:
                "La pasarela de pagos tarda más de 30 segundos en cargar cuando el carrito supera las 200 unidades.",
            client: "Rafaela Carra",
            date: "14-07-2026",
            status: "pending",
        },
    ];

    const read = () => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) return JSON.parse(raw);
        } catch {
            /* datos corruptos: se regeneran */
        }
        localStorage.setItem(KEY, JSON.stringify(SEED));
        return SEED.map((t) => ({ ...t }));
    };

    const write = (tickets) => localStorage.setItem(KEY, JSON.stringify(tickets));

    const generateCode = () => {
        const segment = () =>
            Math.floor(Math.random() * 0xffff)
                .toString(16)
                .padStart(4, "0")
                .toUpperCase();
        return `${segment()}-${segment()}-${segment()}`;
    };

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${day}-${month}-${date.getFullYear()}`;
    };

    /** Devuelve los tickets, pudiendo filtrar por estado. */
    const list = (status = "all") => {
        const tickets = read();
        return status === "all" ? tickets : tickets.filter((t) => t.status === status);
    };

    const get = (id) => read().find((t) => t.id === Number(id)) || null;

    const create = ({ headline, description, client }) => {
        const tickets = read();
        const ticket = {
            id: tickets.length ? Math.max(...tickets.map((t) => t.id)) + 1 : 1,
            code: generateCode(),
            headline: headline.trim(),
            description: description.trim(),
            client: client || "Soporte",
            date: formatDate(new Date()),
            status: "pending",
        };
        tickets.unshift(ticket);
        write(tickets);
        return ticket;
    };

    /** Un ticket "cerrado" (resuelto o cancelado) no admite modificaciones. */
    const isClosed = (ticket) =>
        !!ticket && (ticket.status === "resolved" || ticket.status === "canceled");

    const appendDetail = (id, text) => {
        const tickets = read();
        const ticket = tickets.find((t) => t.id === Number(id));
        if (!ticket || isClosed(ticket)) return null;
        ticket.description += `\n\n[Detalle adicional del ${formatDate(new Date())}]\n${text.trim()}`;
        write(tickets);
        return ticket;
    };

    const cancel = (id) => {
        const tickets = read();
        const ticket = tickets.find((t) => t.id === Number(id));
        if (!ticket || isClosed(ticket)) return null;
        ticket.status = "canceled";
        write(tickets);
        return ticket;
    };

    return { list, get, create, appendDetail, cancel };
})();
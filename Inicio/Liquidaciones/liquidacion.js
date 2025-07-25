import { API_URL } from "/Login/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const admin = JSON.parse(localStorage.getItem("adminActivo"));
    if (!admin) {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    const tablaCuerpo = document.getElementById("tablaLiquidacionCuerpo");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const btnAtras = document.getElementById("btnAtras");
    const btnLiquidar = document.getElementById("btnLiquidar");
    const btnVerLiquidaciones = document.getElementById("btnVerLiquidaciones");

    btnCerrarSesion.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("adminActivo");
        window.location.href = "/Login/login.html";
    });

    btnAtras.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/Inicio/inicio.html";
    });

    btnLiquidar.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/Inicio/Liquidar/liquidar.html";
    });

    btnVerLiquidaciones.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/Inicio/VerLiquidaciones/verliquidaciones.html";
    });

    async function obtenerFondoActual() {
        try {
            const res = await fetch(`${API_URL}/api/fondos/actual`);
            if (!res.ok) throw new Error("No hay fondo actual");
            return await res.json();
        } catch (err) {
            console.error(err);
            alert("No hay un fondo marcado como actual.");
            return null;
        }
    }

    async function cargarParticipantes(fondoId) {
        try {
            const res = await fetch(`${API_URL}/api/participantes/usuarios?fondo_id=${fondoId}`);
            return await res.json();
        } catch (err) {
            console.error("Error cargando participantes:", err);
            return [];
        }
    }

    async function cargarTotalesAhorros() {
        try {
            const res = await fetch(`${API_URL}/api/pagos-ahorros/totales-por-participante`);
            return await res.json();
        } catch (err) {
            console.error("Error cargando totales de ahorro:", err);
            return [];
        }
    }

    async function cargarTotalGananciasPrestamos() {
        try {
            const res = await fetch(`${API_URL}/api/prestamos/total-ganancias`);
            const datos = await res.json();
            return parseFloat(datos.totalGanancias) || 0;
        } catch (err) {
            console.error("Error cargando total de ganancias de préstamos:", err);
            return 0;
        }
    }

    async function cargarMultasYMoras() {
        try {
            const res = await fetch(`${API_URL}/api/multas-moras/pendientes`);
            return await res.json();
        } catch (err) {
            console.error("Error cargando multas y moras:", err);
            return [];
        }
    }

    async function cargarRestantesPrestamos() {
        try {
            const pagosPrestamos = await fetch(`${API_URL}/api/pagos-prestamos`).then(r => r.json());
            const prestamos = await fetch(`${API_URL}/api/prestamos`).then(r => r.json());

            const restantesPorParticipante = {};

            prestamos.forEach(prestamo => {
                const totalPrestamo = parseFloat(prestamo.valorTotalPagar);
                const pagos = pagosPrestamos
                    .filter(p => p.idPrestamo == prestamo.id)
                    .reduce((sum, p) => sum + parseFloat(p.vpago), 0);

                const restante = totalPrestamo - pagos;

                if (restante > 0) {
                    if (!restantesPorParticipante[prestamo.solicitante]) {
                        restantesPorParticipante[prestamo.solicitante] = 0;
                    }
                    restantesPorParticipante[prestamo.solicitante] += restante;

                    if (prestamo.nombre && prestamo.nombre !== prestamo.solicitante) {
                        if (!restantesPorParticipante[prestamo.nombre]) {
                            restantesPorParticipante[prestamo.nombre] = 0;
                        }
                        restantesPorParticipante[prestamo.nombre] += restante;
                    }
                }
            });

            return restantesPorParticipante;
        } catch (err) {
            console.error("Error cargando restantes de préstamos:", err);
            return {};
        }
    }

    function mostrarParticipantes(participantes, ahorros, totalGananciaPrestamos, multasMoras, restantesPrestamos) {
    tablaCuerpo.innerHTML = "";

    let totalSocios = participantes.length;
    let totalNumeros = 0;
    let totalPuestos = 0;
    let totalPorcentajePuesto = 0;
    let totalAhorros = 0;
    let totalRentabilidad = 0;
    let totalMoraPrestamos = 0;
    let totalMoraAhorros = 0;
    let totalMultas = 0;
    let totalGeneralEntregar = 0;
    let totalRestantePrestamos = 0;

    // ✅ Calcular el total de ahorros SOLO con participantes activos
    totalAhorros = participantes.reduce((sum, p) => {
        const ahorroEncontrado = ahorros.find(a => a.nombre === p.nombre);
        return sum + (ahorroEncontrado ? parseFloat(ahorroEncontrado.totalAhorro) : 0);
    }, 0);

    // ✅ Calcular totales de mora y multas antes para D. Multas
    participantes.forEach(p => {
        const multaMoraEncontrada = multasMoras.find(m => m.nombre === p.nombre);
        totalMoraPrestamos += multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraPrestamos) : 0;
        totalMoraAhorros += multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraAhorros) : 0;
        totalMultas += multaMoraEncontrada ? parseFloat(multaMoraEncontrada.multa) : 0;
    });

    const divisionMultasGlobal = totalSocios > 0
        ? (totalMoraPrestamos + totalMoraAhorros + totalMultas) / totalSocios
        : 0;

        localStorage.setItem("divisionMultasGlobal", divisionMultasGlobal);

    // ✅ Iterar participantes activos para calcular correctamente
    participantes.forEach((p, i) => {
        totalNumeros++;

        const cantPuestos = parseFloat(p.cantPuestos) || 0;
        totalPuestos += cantPuestos;

        const ahorroEncontrado = ahorros.find(a => a.nombre === p.nombre);
        const ahorro = ahorroEncontrado ? parseFloat(ahorroEncontrado.totalAhorro) : 0;

        // ✅ % Puesto basado SOLO en ahorros de participantes activos
        const porcentajePuesto = totalAhorros > 0 ? ((ahorro / totalAhorros) * 100) : 0;
        totalPorcentajePuesto += porcentajePuesto;

        // ✅ Rentabilidad proporcional al % Puesto de activos
        const rentabilidad = (totalGananciaPrestamos * (porcentajePuesto / 100));
        totalRentabilidad += rentabilidad;

        const multaMoraEncontrada = multasMoras.find(m => m.nombre === p.nombre);
        const moraPrestamos = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraPrestamos) : 0;
        const moraAhorros = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraAhorros) : 0;
        const multa = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.multa) : 0;

        const restantePrestamo = restantesPrestamos[p.nombre] || 0;
        totalRestantePrestamos += restantePrestamo;

        const totalEntregar = (ahorro + rentabilidad + divisionMultasGlobal) -
            (moraPrestamos + moraAhorros + multa + restantePrestamo);
        totalGeneralEntregar += totalEntregar;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${cantPuestos.toFixed(1)}</td>
            <td>${porcentajePuesto.toFixed(2)}%</td>
            <td>${p.nombre}</td>
            <td>$${Math.round(ahorro).toLocaleString("es-CO")}</td>
            ${i === 0 ? `<td rowspan="${participantes.length}">$${Math.round(totalGananciaPrestamos).toLocaleString("es-CO")}</td>` : ""}
            <td>$${Math.round(rentabilidad).toLocaleString("es-CO")}</td>
            <td>$${Math.round(restantePrestamo).toLocaleString("es-CO")}</td>
            <td>$${Math.round(moraPrestamos).toLocaleString("es-CO")}</td>
            <td>$${Math.round(moraAhorros).toLocaleString("es-CO")}</td>
            <td>$${Math.round(multa).toLocaleString("es-CO")}</td>
            ${i === 0 ? `<td rowspan="${participantes.length}">$${Math.round(divisionMultasGlobal).toLocaleString("es-CO")}</td>` : ""}
            <td class="${totalEntregar >= 0 ? "positivo" : "negativo"}">$${Math.round(totalEntregar).toLocaleString("es-CO")}</td>
        `;
        tablaCuerpo.appendChild(row);
    });

    // ✅ Fila total correcta con base en activos
    const totalRow = document.createElement("tr");
    totalRow.classList.add("fila-total");
    totalRow.innerHTML = `
        <td>${totalNumeros}</td>
        <td>${totalPuestos.toFixed(1)}</td>
        <td>${totalPorcentajePuesto.toFixed(2)}%</td>
        <td></td>
        <td>$${Math.round(totalAhorros).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalGananciaPrestamos).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalRentabilidad).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalRestantePrestamos).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalMoraPrestamos).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalMoraAhorros).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalMultas).toLocaleString("es-CO")}</td>
        <td>$${Math.round(divisionMultasGlobal).toLocaleString("es-CO")}</td>
        <td>$${Math.round(totalGeneralEntregar).toLocaleString("es-CO")}</td>
    `;
    tablaCuerpo.appendChild(totalRow);
}


    const fondoActual = await obtenerFondoActual();
    if (fondoActual) {
        const participantes = await cargarParticipantes(fondoActual.id);
        const ahorros = await cargarTotalesAhorros();
        const totalGananciaPrestamos = await cargarTotalGananciasPrestamos();
        const multasMoras = await cargarMultasYMoras();
        const restantesPrestamos = await cargarRestantesPrestamos();

        // ✅ Filtrar retirados aquí (ya con datos cargados)
        const liquidaciones = await fetch(`${API_URL}/api/liquidaciones`).then(r => r.json());
        const retirados = liquidaciones
            .filter(l => l.motivo === "Retiro voluntario" && l.fondo_id === fondoActual.id)
            .map(l => l.nombre);

        const participantesActivos = participantes.filter(p => !retirados.includes(p.nombre));

        mostrarParticipantes(
            participantesActivos,
            ahorros,
            totalGananciaPrestamos,
            multasMoras,
            restantesPrestamos
        );
    }
});

import { API_URL } from "/Login/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const admin = JSON.parse(localStorage.getItem("adminActivo"));
    if (!admin) {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    const tablaCuerpo = document.getElementById("tablaVerLiquidacionCuerpo");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const btnAtras = document.getElementById("btnAtras");

    btnCerrarSesion.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("adminActivo");
        window.location.href = "/Login/login.html";
    });

    btnAtras.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/Inicio/Liquidaciones/liquidacion.html";
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

    async function cargarLiquidaciones(fondoId) {
        try {
            const res = await fetch(`${API_URL}/api/liquidaciones?fondo_id=${fondoId}`);
            return await res.json();
        } catch (err) {
            console.error("Error cargando liquidaciones:", err);
            return [];
        }
    }

    async function cargarDetallesParticipante(nombre, motivo, fondoId) {
    try {
        // ✅ 1. Datos del participante
        const participanteInfoRes = await fetch(`${API_URL}/api/participantes/buscar?nombre=${encodeURIComponent(nombre)}&fondo_id=${fondoId}`);
        const participanteInfo = await participanteInfoRes.json();
        const cantPuestos = participanteInfo && participanteInfo.cantPuestos ? parseFloat(participanteInfo.cantPuestos) : 1;

        // ✅ 2. Cargar datos en paralelo
        const [ahorrosRes, prestamosRes, pagosPrestamosRes, morasRes, participantesRes, liquidacionesRes, totalGananciaPrestamosRes] = await Promise.all([
            fetch(`${API_URL}/api/pagos-ahorros/totales-por-participante`),
            fetch(`${API_URL}/api/prestamos`),
            fetch(`${API_URL}/api/pagos-prestamos`),
            fetch(`${API_URL}/api/multas-moras/pendientes`),
            fetch(`${API_URL}/api/participantes/usuarios?fondo_id=${fondoId}`),
            fetch(`${API_URL}/api/liquidaciones?fondo_id=${fondoId}`),
            fetch(`${API_URL}/api/prestamos/total-ganancias`)
        ]);

        const ahorros = await ahorrosRes.json();
        const prestamos = await prestamosRes.json();
        const pagosPrestamos = await pagosPrestamosRes.json();
        const multasMoras = await morasRes.json();
        const participantes = await participantesRes.json();
        const liquidaciones = await liquidacionesRes.json();
        const totalGananciaPrestamos = await totalGananciaPrestamosRes.json();

        // ✅ 3. Filtrar retirados y calcular participantes activos
        const retirados = liquidaciones.filter(l => l.motivo === "Retiro voluntario").map(l => l.nombre);
        const participantesActivos = participantes.filter(p => !retirados.includes(p.nombre));

        // ✅ 4. Ahorro del participante
const ahorroEncontrado = ahorros.find(a => a.nombre === nombre);
const ahorro = ahorroEncontrado ? parseFloat(ahorroEncontrado.totalAhorro) : 0;

// ✅ 5. Total de ahorros de participantes activos
const totalAhorrosActivos = ahorros
    .filter(a => participantesActivos.some(p => p.nombre === a.nombre))
    .reduce((sum, a) => sum + parseFloat(a.totalAhorro), 0);

// ✅ 6. % de participación basado en ahorro
const porcentajeAhorro = totalAhorrosActivos > 0 ? (ahorro / totalAhorrosActivos) : 0;

// ✅ 7. Rentabilidad proporcional al ahorro
const rentabilidadPrestamos = parseFloat(totalGananciaPrestamos.totalGanancias || 0) * porcentajeAhorro;

// ✅ Usamos el valor correcto ya calculado en la tabla
const divisionMultasGlobal = parseFloat(localStorage.getItem("divisionMultasGlobal")) || 0;

// ✅ 9. Rentabilidad final
const rentabilidad = rentabilidadPrestamos + divisionMultasGlobal;



        // ✅ 8. Datos de préstamos
        const prestamosParticipante = prestamos.filter(p => p.nombre === nombre);
        const prestamosSolicitados = prestamosParticipante.length;

        let prestamosPagados = 0;
        let prestamosSinPagar = 0;
        let restantePrestamos = 0;

        prestamosParticipante.forEach(prestamo => {
            const totalPrestamo = parseFloat(prestamo.valorTotalPagar || prestamo.vprestamo);
            const pagado = pagosPrestamos
                .filter(p => p.idPrestamo === prestamo.id)
                .reduce((sum, p) => sum + parseFloat(p.vpago || 0), 0);

            const restante = totalPrestamo - pagado;
            if (restante <= 0) {
                prestamosPagados++;
            } else {
                prestamosSinPagar++;
                restantePrestamos += restante;
            }
        });

        // ✅ 9. Moras del participante
        const moraEncontrada = multasMoras.find(m => m.nombre === nombre);
        const moras = moraEncontrada
            ? parseFloat(moraEncontrada.moraPrestamos || 0) +
              parseFloat(moraEncontrada.moraAhorros || 0) +
              parseFloat(moraEncontrada.multa || 0)
            : 0;

        return {
            cantPuestos,
            ahorro,
            rentabilidad: rentabilidadPrestamos,
            divisionMultas: divisionMultasGlobal,
            prestamosSolicitados,
            prestamosPagados,
            prestamosSinPagar,
            restantePrestamos,
            moras
        };

    } catch (err) {
        console.error("Error cargando detalles del participante:", err);
        return {
            cantPuestos: 1,
            ahorro: 0,
            rentabilidad: 0,
            prestamosSolicitados: 0,
            prestamosPagados: 0,
            prestamosSinPagar: 0,
            restantePrestamos: 0,
            moras: 0
        };
    }
}

    function mostrarLiquidaciones(liquidaciones, fondoId) {
        tablaCuerpo.innerHTML = "";

        if (!liquidaciones.length) {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="5">No hay liquidaciones registradas.</td>`;
            tablaCuerpo.appendChild(row);
            return;
        }

        liquidaciones.forEach((liq, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${liq.nombre}</td>
                <td>${liq.motivo}</td>
                <td>$${parseFloat(liq.valor_liquidar).toLocaleString("es-CO")}</td>
                <td>${new Date(liq.fecha_liquidacion).toLocaleDateString("es-CO")}</td>
                <td>
                    <button class="btn-ver-detalle" data-index="${index}">
                        <i class="fas fa-search"></i> Ver
                    </button>
                </td>
            `;
            tablaCuerpo.appendChild(row);

            const detalleRow = document.createElement("tr");
            detalleRow.style.display = "none";
            detalleRow.innerHTML = `
                <td colspan="5" id="detalle-${index}">
                    <div class="detalle-card">Cargando detalles...</div>
                </td>
            `;
            tablaCuerpo.appendChild(detalleRow);
        });

        document.querySelectorAll(".btn-ver-detalle").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const idx = e.target.closest("button").dataset.index;
                const detalleFila = document.getElementById(`detalle-${idx}`);
                const filaPadre = detalleFila.parentElement;

                if (filaPadre.style.display === "table-row") {
                    filaPadre.style.display = "none";
                    return;
                }

                filaPadre.style.display = "table-row";

                const liq = liquidaciones[idx];
                const detalles = await cargarDetallesParticipante(liq.nombre, liq.motivo, fondoId);

                detalleFila.innerHTML = `
    <div class="detalle-card">
        <h3>${liq.nombre}</h3>
        <p><strong>Puestos:</strong> ${detalles.cantPuestos}</p>
        <p><strong>Ahorro:</strong> $${Math.round(detalles.ahorro).toLocaleString("es-CO")}</p>
        <p><strong>Ganancias:</strong> ${
            liq.motivo === "Retiro voluntario"
                ? "N/A"
                : `$${Math.round(detalles.rentabilidad + detalles.divisionMultas).toLocaleString("es-CO")}`
        }</p>

        <p><strong>Cantidad de préstamos solicitados:</strong> ${detalles.prestamosSolicitados}</p>
        <p><strong>Préstamos pagados:</strong> ${detalles.prestamosPagados}</p>
        <p><strong>Préstamos sin pagar:</strong> ${detalles.prestamosSinPagar}</p>
        <p><strong>Restante Préstamos:</strong> $${Math.round(detalles.restantePrestamos).toLocaleString("es-CO")}</p>
        <p><strong>Multas o moras:</strong> $${Math.round(detalles.moras).toLocaleString("es-CO")}</p>
    </div>
`;

            });
        });
    }

    const fondoActual = await obtenerFondoActual();
    if (fondoActual) {
        const liquidaciones = await cargarLiquidaciones(fondoActual.id);
        mostrarLiquidaciones(liquidaciones, fondoActual.id);
    }
});

import { API_URL } from "/Login/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const admin = JSON.parse(localStorage.getItem("adminActivo"));
    if (!admin) {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "/Login/login.html";
        return;
    }

    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const btnAtras = document.getElementById("btnAtras");
    const nombreSelect = document.getElementById("nombreParticipante");
    const motivoSelect = document.getElementById("motivo");
    const valorLiquidarInput = document.querySelector("input[type='text']");
    const fechaInput = document.querySelector("input[type='date']");
    const btnLiquidar = document.getElementById("btnLiquidarParticipante");

    let datosLiquidacion = [];

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
            alert("No hay un fondo marcado como actual.");
            return null;
        }
    }

    async function cargarDatosLiquidacion() {
    try {
        const fondoActual = await obtenerFondoActual();
        if (!fondoActual) return;

        const participantes = await fetch(`${API_URL}/api/participantes/usuarios?fondo_id=${fondoActual.id}`).then(r => r.json());
        const ahorros = await fetch(`${API_URL}/api/pagos-ahorros/totales-por-participante`).then(r => r.json());
        const totalGananciaPrestamos = await fetch(`${API_URL}/api/prestamos/total-ganancias`).then(r => r.json()).then(d => parseFloat(d.totalGanancias) || 0);
        const multasMoras = await fetch(`${API_URL}/api/multas-moras/pendientes`).then(r => r.json());
        const restantesPrestamos = await cargarRestantesPrestamos();
        const liquidaciones = await fetch(`${API_URL}/api/liquidaciones`).then(r => r.json());

        // ✅ Retirados solo los voluntarios
        const retirados = liquidaciones
            .filter(l => l.fondo_id === fondoActual.id && l.motivo === "Retiro voluntario")
            .map(l => l.nombre);

        // ✅ Activos para cálculos globales
        const participantesActivos = participantes.filter(p => !retirados.includes(p.nombre));

        // ✅ Excluimos también liquidados de fondo SOLO para el select
        const liquidadosFondo = liquidaciones
            .filter(l => l.fondo_id === fondoActual.id && l.motivo === "Liquidación Fondo")
            .map(l => l.nombre);

        const participantesParaSelect = participantesActivos.filter(
            p => !liquidadosFondo.includes(p.nombre)
        );

        // ✅ Cálculos globales
        const totalAhorrosActivos = participantesActivos.reduce((sum, p) => {
            const ahorroEncontrado = ahorros.find(a => a.nombre === p.nombre);
            return sum + (ahorroEncontrado ? parseFloat(ahorroEncontrado.totalAhorro) : 0);
        }, 0);

        let totalMoraPrestamos = 0, totalMoraAhorros = 0, totalMultas = 0;
        participantesActivos.forEach(p => {
            const multa = multasMoras.find(m => m.nombre === p.nombre);
            if (multa) {
                totalMoraPrestamos += parseFloat(multa.moraPrestamos) || 0;
                totalMoraAhorros += parseFloat(multa.moraAhorros) || 0;
                totalMultas += parseFloat(multa.multa) || 0;
            }
        });

        const divisionMultasGlobal = participantesActivos.length > 0
            ? (totalMoraPrestamos + totalMoraAhorros + totalMultas) / participantesActivos.length
            : 0;

        datosLiquidacion = participantesActivos.map(p => {
            const ahorroEncontrado = ahorros.find(a => a.nombre === p.nombre);
            const ahorro = ahorroEncontrado ? parseFloat(ahorroEncontrado.totalAhorro) : 0;

            const rentabilidad = totalAhorrosActivos > 0
                ? totalGananciaPrestamos * (ahorro / totalAhorrosActivos)
                : 0;

            const multaMoraEncontrada = multasMoras.find(m => m.nombre === p.nombre);
            const moraPrestamos = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraPrestamos) : 0;
            const moraAhorros = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.moraAhorros) : 0;
            const multa = multaMoraEncontrada ? parseFloat(multaMoraEncontrada.multa) : 0;

            const restantePrestamo = restantesPrestamos[p.nombre] || 0;

            const totalEntregar = (ahorro + rentabilidad + divisionMultasGlobal) -
                (restantePrestamo + moraPrestamos + moraAhorros + multa);

            return {
                nombre: p.nombre,
                ahorro,
                rentabilidad,
                divisionMultasGlobal,
                moraPrestamos,
                moraAhorros,
                multa,
                restantePrestamo,
                totalEntregar
            };
        });

        // ✅ Poblar solo con los que no han sido liquidados (ni voluntarios ni de fondo)
        nombreSelect.innerHTML = `<option value="" disabled selected>Selecciona un participante</option>`;
        participantesParaSelect.forEach(p => {
            const opcion = document.createElement("option");
            opcion.value = p.nombre;
            opcion.textContent = p.nombre;
            nombreSelect.appendChild(opcion);
        });

    } catch (err) {
        console.error("Error cargando datos de liquidación:", err);
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

    nombreSelect.addEventListener("change", actualizarValorLiquidar);
    motivoSelect.addEventListener("change", actualizarValorLiquidar);

    function actualizarValorLiquidar() {
        const nombre = nombreSelect.value;
        const motivo = motivoSelect.options[motivoSelect.selectedIndex].text;
        if (!nombre || !motivo) return;

        const datos = datosLiquidacion.find(d => d.nombre === nombre);
        if (!datos) return;

        let valorLiquidar = 0;
        if (motivo === "Retiro voluntario") {
            valorLiquidar = datos.ahorro -
                (datos.restantePrestamo + datos.moraPrestamos + datos.moraAhorros + datos.multa);
        } else {
            valorLiquidar = datos.totalEntregar;
        }

        valorLiquidarInput.value = Math.round(valorLiquidar).toLocaleString("es-CO");
    }

    btnLiquidar.addEventListener("click", async () => {
        const nombre = nombreSelect.value;
        const motivo = motivoSelect.options[motivoSelect.selectedIndex].text;
        const valorLiquidar = parseFloat(valorLiquidarInput.value.replace(/\./g, '').replace(/,/g, ''));
        const fecha = fechaInput.value;

        if (!nombre || !motivo || !valorLiquidar || !fecha) {
            alert("Completa todos los campos.");
            return;
        }

        try {
            const fondoActual = await obtenerFondoActual();

            const res = await fetch(`${API_URL}/api/liquidaciones`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    motivo,
                    valor_liquidar: valorLiquidar,
                    fecha_liquidacion: fecha,
                    fondo_id: fondoActual.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.mensaje || "Error al liquidar");

            alert("Liquidación realizada con éxito");
            location.reload();
            window.location.href = "/Inicio/VerLiquidaciones/verliquidaciones.html";

        } catch (err) {
            console.error("Error al liquidar:", err);
            alert("Hubo un error al realizar la liquidación");
        }
    });

    cargarDatosLiquidacion();
});

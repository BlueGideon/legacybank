import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', async () => {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder.');
        window.location.href = '/Login/login.html';
        return;
    }

    const filtroTipoMovimiento = document.getElementById('filtroTipoMovimiento');
    const filtroFondo = document.getElementById('filtroFondo');
    const filtroAno = document.getElementById('filtroAno');
    const filtroMes = document.getElementById('filtroMes');
    const tablaCuerpo = document.getElementById('tablaParticipantesCuerpo');
    const totalIngresosSpan = document.getElementById('totalIngresos');
    const totalGastosSpan = document.getElementById('totalGastos');
    const btnGenerar = document.querySelector('.generar-informe');
    const btnDescargar = document.getElementById('descargarInforme');

    // Cerrar sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // Botones de navegación
    btnParticipantes.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/Participantes/informes_participantes.html';
    });
    btnPrestamos.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/Prestamos/informes_prestamos.html';
    });
    btnAhorros.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });

    let movimientos = [];
    let fondoActual = null; // ✅ Guardaremos aquí el nombre del fondo actual

    // ✅ 1. Obtener fondo actual
    async function obtenerFondoActual() {
        try {
            const res = await fetch(`${API_URL}/api/fondos/actual`);
            if (!res.ok) throw new Error("No se encontró un fondo actual");
            const fondo = await res.json();

            fondoActual = fondo.nombre;
            filtroFondo.innerHTML = '';
            const option = document.createElement('option');
            option.value = fondoActual;
            option.textContent = fondoActual;
            filtroFondo.appendChild(option);
            filtroFondo.disabled = true;

            console.log("Fondo actual detectado:", fondoActual);
        } catch (err) {
            console.error("Error obteniendo fondo actual:", err);
            alert("No hay un fondo marcado como actual en la base de datos.");
        }
    }

    // ✅ 2. Cargar movimientos (ingresos y gastos)
    async function cargarMovimientos() {
        try {
            const [ahorrosRes, pagosPrestamosRes, prestamosRes, moraAhorrosRes, moraPrestamosRes] =
                await Promise.all([
                    fetch(`${API_URL}/api/pagos-ahorros`),
                    fetch(`${API_URL}/api/pagos-prestamos`),
                    fetch(`${API_URL}/api/prestamos`),
                    fetch(`${API_URL}/api/pagos-mora-ahorros`),
                    fetch(`${API_URL}/api/pagos-mora-prestamos`)
                ]);

            const ahorros = await ahorrosRes.json();
            const pagosPrestamos = await pagosPrestamosRes.json();
            const prestamos = await prestamosRes.json();
            const moraAhorros = await moraAhorrosRes.json();
            const moraPrestamos = await moraPrestamosRes.json();

            movimientos = [
                ...ahorros.map(a => ({
                    fecha: a.fecha_pago,
                    tipo: 'Ingreso',
                    participante: a.nombre,
                    descripcion: 'Pago de Ahorro',
                    valor: parseFloat(a.valor),
                    fondo: a.fondo
                })),
                ...pagosPrestamos.map(p => ({
                    fecha: p.fpago,
                    tipo: 'Ingreso',
                    participante: p.solicitante,
                    descripcion: `Pago Préstamo (Cuota ${p.cuotaAPagar})`,
                    valor: parseFloat(p.vpago),
                    fondo: p.fondo
                })),
                ...moraAhorros.map(m => ({
                    fecha: m.fecha_pago,
                    tipo: 'Ingreso',
                    participante: m.nombre,
                    descripcion: 'Pago Mora Ahorro',
                    valor: parseFloat(m.valor),
                    fondo: m.fondo
                })),
                ...moraPrestamos.map(m => ({
                    fecha: m.fecha_pago,
                    tipo: 'Ingreso',
                    participante: m.solicitante,
                    descripcion: 'Pago Mora Préstamo',
                    valor: parseFloat(m.valor),
                    fondo: m.fondo
                })),
                ...prestamos.map(pr => ({
                    fecha: pr.fprestamo,
                    tipo: 'Gasto',
                    participante: pr.solicitante,
                    descripcion: 'Préstamo otorgado',
                    valor: parseFloat(pr.vprestamo),
                    fondo: pr.fondo
                }))
            ];

            cargarFiltrosFecha();
            mostrarMovimientos();
        } catch (err) {
            console.error('Error cargando movimientos:', err);
        }
    }

    // ✅ 3. Cargar años y meses para los filtros
    function cargarFiltrosFecha() {
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const años = [...new Set(movimientos.map(m => new Date(m.fecha).getFullYear()))];
        const meses = [...new Set(movimientos.map(m => new Date(m.fecha).getMonth() + 1))];

        filtroAno.innerHTML = '<option value="" disabled selected>Selecciona el año</option>';
        filtroMes.innerHTML = '<option value="" disabled selected>Selecciona el mes</option>';

        años.sort().forEach(a => {
            const option = document.createElement('option');
            option.value = a;
            option.textContent = a;
            filtroAno.appendChild(option);
        });

        meses.sort((a, b) => a - b).forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = nombresMeses[m - 1];
            filtroMes.appendChild(option);
        });
    }

    // ✅ 4. Mostrar movimientos (siempre filtra por el fondo actual)
    function mostrarMovimientos() {
        const tipo = filtroTipoMovimiento.value;
        const anio = filtroAno.value;
        const mes = filtroMes.value;

        let filtrados = movimientos.filter(m => {
            const fecha = new Date(m.fecha);
            return (
                m.fondo === fondoActual &&
                (!tipo || tipo === 'Todos' || m.tipo === tipo) &&
                (!anio || fecha.getFullYear().toString() === anio) &&
                (!mes || (fecha.getMonth() + 1).toString() === mes)
            );
        });

        tablaCuerpo.innerHTML = '';
        let totalIngresos = 0, totalGastos = 0;

        if (filtrados.length === 0) {
            tablaCuerpo.innerHTML = `<tr><td colspan="6">No hay movimientos disponibles</td></tr>`;
        } else {
            filtrados.forEach(m => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(m.fecha).toLocaleDateString()}</td>
                    <td>${m.tipo}</td>
                    <td>${m.participante}</td>
                    <td>${m.descripcion}</td>
                    <td>$${m.valor.toLocaleString('es-CO')}</td>
                    <td>${m.fondo}</td>
                `;
                tablaCuerpo.appendChild(row);

                if (m.tipo === 'Ingreso') totalIngresos += m.valor;
                else totalGastos += m.valor;
            });
        }

        totalIngresosSpan.textContent = `$ ${totalIngresos.toLocaleString('es-CO')}`;
        totalGastosSpan.textContent = `$ ${totalGastos.toLocaleString('es-CO')}`;
    }

    // ✅ 5. Descargar Excel (solo del fondo actual)
    btnDescargar.addEventListener('click', () => {
        const wsData = [
            ['Fecha', 'Tipo', 'Participante', 'Descripción', 'Valor', 'Fondo'],
            ...movimientos
                .filter(m => m.fondo === fondoActual)
                .map(m => [
                    new Date(m.fecha).toLocaleDateString(),
                    m.tipo,
                    m.participante,
                    m.descripcion,
                    m.valor,
                    m.fondo
                ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');
        XLSX.writeFile(wb, 'Informe_Ingresos_Gastos.xlsx');
    });

    btnGenerar.addEventListener('click', mostrarMovimientos);

    // ✅ Inicio
    await obtenerFondoActual();
    await cargarMovimientos();
});

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

    // Funcion para ir a pestaña participantes
    btnParticipantes.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Participantes/informes_participantes.html';
    });

    // Funcion para ir a pestaña prestamos
    btnPrestamos.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Prestamos/informes_prestamos.html';
    });

    // Funcion para ir a pestaña ahorros
    btnAhorros.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });

    let movimientos = [];

    // ✅ 1. Cargar fondos desde MySQL
    async function cargarFondos() {
        try {
            const res = await fetch(`${API_URL}/api/fondos`);
            const fondos = await res.json();

            fondos.forEach(f => {
                const option = document.createElement('option');
                option.value = f.nombre;
                option.textContent = f.nombre;
                filtroFondo.appendChild(option);
            });
        } catch (err) {
            console.error('Error cargando fondos:', err);
        }
    }

    // ✅ 2. Obtener todos los movimientos (ingresos y gastos)
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

    // ✅ 3. Cargar filtros de año y mes automáticamente (con nombres de meses)
function cargarFiltrosFecha() {
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const años = [...new Set(movimientos.map(m => new Date(m.fecha).getFullYear()))];
    const meses = [...new Set(movimientos.map(m => new Date(m.fecha).getMonth() + 1))];

    años.sort().forEach(a => {
        const option = document.createElement('option');
        option.value = a;
        option.textContent = a;
        filtroAno.appendChild(option);
    });

    meses.sort((a, b) => a - b).forEach(m => {
        const option = document.createElement('option');
        option.value = m; // ✅ Mantiene el número para el filtro
        option.textContent = nombresMeses[m - 1]; // ✅ Muestra el nombre del mes
        filtroMes.appendChild(option);
    });
}


    // ✅ 4. Mostrar movimientos aplicando filtros
    function mostrarMovimientos() {
        const tipo = filtroTipoMovimiento.value;
        const fondo = filtroFondo.value;
        const anio = filtroAno.value;
        const mes = filtroMes.value;

        let filtrados = movimientos.filter(m => {
            const fecha = new Date(m.fecha);
            return (
                (!tipo || tipo === 'Todos' || m.tipo === tipo) &&
                (!fondo || m.fondo === fondo) &&
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

    // ✅ 5. Descargar en Excel usando SheetJS
    btnDescargar.addEventListener('click', () => {
        const wsData = [
            ['Fecha', 'Tipo', 'Participante', 'Descripción', 'Valor', 'Fondo'],
            ...movimientos.map(m => [
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
    await cargarFondos();
    await cargarMovimientos();
});

document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const filtroTipoMovimiento = document.getElementById('filtroTipoMovimiento');
    const filtroFondo = document.getElementById('filtroFondo');
    const filtroAno = document.getElementById('filtroAno');
    const filtroMes = document.getElementById('filtroMes');
    const btnGenerar = document.querySelector('.generar-informe');
    const tablaCuerpo = document.getElementById('tablaParticipantesCuerpo');
    const totalIngresos = document.getElementById('totalIngresos');
    const totalGastos = document.getElementById('totalGastos');

    // Botones de navegación
    document.getElementById('btnPrestamos')?.addEventListener('click', e => {
        e.preventDefault(); window.location.href = '/Informes/Prestamos/informes_prestamos.html';
    });
    document.getElementById('btnParticipantes')?.addEventListener('click', e => {
        e.preventDefault(); window.location.href = '/Informes/Participantes/informes_participantes.html';
    });
    document.getElementById('btnAhorros')?.addEventListener('click', e => {
        e.preventDefault(); window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });


    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // ------------------- Cargar fondos -------------------
    const fondos = JSON.parse(localStorage.getItem('fondosCreados')) || [];
    fondos.forEach(f => {
        const option = document.createElement('option');
        option.value = f.nombre;
        option.textContent = f.nombre;
        filtroFondo.appendChild(option);
    });

    // ------------------- Obtener fechas -------------------
    const pagosAhorros = JSON.parse(localStorage.getItem('pagosAgregados')) || [];
    const pagosPrestamos = JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];
    const prestamos = JSON.parse(localStorage.getItem('prestamosAgregados')) || [];

    const fechas = [
        ...pagosAhorros.map(p => p.fpago),
        ...pagosPrestamos.map(p => p.fpago),
        ...prestamos.map(p => p.fprestamo)
    ];

    const añosSet = new Set();
    const mesesSet = new Set();

    fechas.forEach(f => {
        const fecha = new Date(f);
        if (!isNaN(fecha)) {
            añosSet.add(fecha.getFullYear());
            mesesSet.add(fecha.getMonth() + 1);
        }
    });

    [...añosSet].sort((a, b) => b - a).forEach(a => {
        const option = document.createElement('option');
        option.value = a;
        option.textContent = a;
        filtroAno.appendChild(option);
    });

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    [...mesesSet].sort((a, b) => a - b).forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = nombresMeses[m - 1];
        filtroMes.appendChild(option);
    });

    // ------------------- Botón Generar Informe -------------------
    btnGenerar.addEventListener('click', () => {
        const tipo = filtroTipoMovimiento.value;
        const fondoSeleccionado = filtroFondo.value;
        const ano = parseInt(filtroAno.value);
        const mes = parseInt(filtroMes.value);

        if (!tipo) {
            alert("Por favor selecciona el tipo de movimiento.");
            return;
        }

        const pagosAhorros = JSON.parse(localStorage.getItem('pagosAgregados')) || [];
        const pagosPrestamos = JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];
        const prestamos = JSON.parse(localStorage.getItem('prestamosAgregados')) || [];

        let movimientos = [];

        if (tipo === 'Todos' || tipo === 'Ingresos') {
            movimientos.push(...pagosAhorros.map(p => ({
                fecha: p.fpago,
                tipo: 'Ingreso',
                participante: p.nombre,
                descripcion: 'Pago de ahorro',
                valor: parseFloat(p.valor),
                fondo: p.fondo
            })));

            movimientos.push(...pagosPrestamos.map(p => ({
                fecha: p.fpago,
                tipo: 'Ingreso',
                participante: p.solicitante,
                descripcion: 'Pago de préstamo',
                valor: parseFloat(p.vpago),
                fondo: p.fondo
            })));
        }

        if (tipo === 'Todos' || tipo === 'Gastos') {
            movimientos.push(...prestamos.map(p => ({
                fecha: p.fprestamo,
                tipo: 'Gasto',
                participante: p.nombre,
                descripcion: 'Préstamo',
                valor: parseFloat(p.vprestamo),
                fondo: p.fondo
            })));
        }

        movimientos = movimientos.filter(m => {
            const fecha = new Date(m.fecha);
            const cumpleFondo = filtroFondo.selectedIndex > 0 ? (m.fondo ? m.fondo === fondoSeleccionado : true) : true;
            const cumpleAno = filtroAno.selectedIndex > 0 ? fecha.getFullYear() === ano : true;
            const cumpleMes = filtroMes.selectedIndex > 0 ? (fecha.getMonth() + 1) === mes : true;
            return cumpleFondo && cumpleAno && cumpleMes;
        });


        tablaCuerpo.innerHTML = '';
        let totalIng = 0;
        let totalGast = 0;

        if (movimientos.length === 0) {
            const row = tablaCuerpo.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = '⚠️ No hay movimientos con los filtros seleccionados';
            cell.style.textAlign = 'center';
        } else {
            movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            movimientos.forEach(m => {
                const row = tablaCuerpo.insertRow();
                row.insertCell().textContent = m.fecha;
                row.insertCell().textContent = m.tipo;
                row.insertCell().textContent = m.participante;
                row.insertCell().textContent = m.descripcion;
                row.insertCell().textContent = `$${m.valor.toLocaleString('es-CO')}`;
                row.insertCell().textContent = m.fondo;

                if (m.tipo === 'Ingreso') totalIng += m.valor;
                else totalGast += m.valor;
            });
        }

        totalIngresos.textContent = `$ ${totalIng.toLocaleString('es-CO')}`;
        totalGastos.textContent = `$ ${totalGast.toLocaleString('es-CO')}`;
    });

    // ------------------- Botón Descargar Excel -------------------
    const btnDescargarInforme = document.getElementById('descargarInforme');
    btnDescargarInforme.addEventListener('click', () => {
        const tabla = document.querySelector('.tabla');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(tabla);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');
        XLSX.writeFile(wb, 'Informe_IngresosGastos.xlsx');
    });
});


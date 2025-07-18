import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnPrestamos = document.getElementById('btnPrestamos');
    const btnParticipantes = document.getElementById('btnParticipantes');
    const btnIngresosGastos = document.getElementById('btnIngresosGastos');
    const filtroParticipante = document.getElementById('filtroParticipante');
    const filtroAno = document.getElementById('filtroAno');
    const filtroMes = document.getElementById('filtroMes');
    const inputFechas = document.querySelectorAll('.input__filtro');
    const tablaPagosCuerpo = document.getElementById('tablaPagosCuerpo');
    const totalAhorrado = document.getElementById('totalAhorrado');
    const btnGenerarInforme = document.querySelector('.generar-informe');
    const btnDescargarInforme = document.getElementById('descargarInforme');

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

    // Funcion para ir a pestaña ingresos y gastos
    btnIngresosGastos.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/IngresosGastos/informes_ingresosgastos.html';
    });

    // Cargar participantes (solo usuarios con fondo actual)
    try {
        const fondoRes = await fetch(`${API_URL}/api/fondos/actual`);
        const fondoActual = await fondoRes.json();

        const participantesRes = await fetch(`${API_URL}/api/participantes`);
        const participantes = await participantesRes.json();

        const usuarios = participantes.filter(p =>
            p.rol === 'Usuario' && p.fondo === fondoActual.nombre
        );

        const nombresUnicos = [...new Set(usuarios.map(p => p.nombre))];

        nombresUnicos.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            filtroParticipante.appendChild(option);
        });

        filtroParticipante.addEventListener('change', async () => {
            filtroAno.innerHTML = `<option disabled selected>Selecciona el año</option>`;
            filtroMes.innerHTML = `<option disabled selected>Selecciona el mes</option>`;

            const nombre = filtroParticipante.value;
            const pagosRes = await fetch(`${API_URL}/api/pagos-ahorros/por-nombre/${encodeURIComponent(nombre)}`);
            const pagos = await pagosRes.json();

            const anos = new Set();
            const meses = new Set();

            pagos.forEach(p => {
                const fecha = new Date(p.fecha_pago);
                if (!isNaN(fecha)) {
                    anos.add(fecha.getFullYear());
                    meses.add(fecha.getMonth() + 1);
                }
            });

            [...anos].sort().forEach(ano => {
                const option = document.createElement('option');
                option.value = ano;
                option.textContent = ano;
                filtroAno.appendChild(option);
            });

            const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            [...meses].sort((a, b) => a - b).forEach(mes => {
                const option = document.createElement('option');
                option.value = mes;
                option.textContent = nombresMeses[mes - 1];
                filtroMes.appendChild(option);
            });
        });

    } catch (error) {
        console.error('Error al cargar participantes o fondo:', error);
    }

    function formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha)) return '';
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }


    // Generar informe
    btnGenerarInforme.addEventListener('click', async () => {
        const nombre = filtroParticipante.value;
        if (!nombre) {
            alert('Selecciona un participante.');
            return;
        }

        let pagos = [];
        try {
            const res = await fetch(`${API_URL}/api/pagos-ahorros/por-nombre/${encodeURIComponent(nombre)}`);
            pagos = await res.json();
        } catch (error) {
            console.error('Error al cargar pagos de ahorros:', error);
            return;
        }

        const fechaInicio = new Date(inputFechas[0].value);
        const fechaFin = new Date(inputFechas[1].value);
        const filtrarPorRango = inputFechas[0].value && inputFechas[1].value;

        const anoSeleccionado = parseInt(filtroAno.value);
        const mesSeleccionado = parseInt(filtroMes.value);
        const filtrarPorFecha = !isNaN(anoSeleccionado) && !isNaN(mesSeleccionado);

        let pagosFiltrados = pagos.filter(p => {
            const fecha = new Date(p.fecha_pago);
            if (filtrarPorRango && (fecha < fechaInicio || fecha > fechaFin)) return false;
            if (filtrarPorFecha && (fecha.getFullYear() !== anoSeleccionado || fecha.getMonth() + 1 !== mesSeleccionado)) return false;
            return true;
        });

        tablaPagosCuerpo.innerHTML = '';
        let total = 0;

        if (pagosFiltrados.length === 0) {
            const row = tablaPagosCuerpo.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = 'No se encontraron pagos.';
            cell.style.textAlign = 'center';
        } else {
            pagosFiltrados.forEach(p => {
                const row = tablaPagosCuerpo.insertRow();
                row.insertCell().textContent = p.nombre;
                row.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
                row.insertCell().textContent = formatearFecha(p.fecha_pago);
                row.insertCell().textContent = formatearFecha(p.fecha_limite_pago);
                row.insertCell().textContent = p.mes;

                // Calcular mora
                const fPago = new Date(p.fecha_pago);    
                const fLimite = new Date(p.fecha_limite_pago);
                const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));

                row.insertCell().textContent = diasMora > 0 ? `${diasMora} días` : 'Sin mora';

                total += parseFloat(p.valor);
            });
        }

        totalAhorrado.textContent = `$ ${total.toLocaleString('es-CO')}`;
    });

    // Exportar a Excel
    btnDescargarInforme.addEventListener('click', () => {
        const tabla = document.querySelector('.tabla');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(tabla);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');
        XLSX.writeFile(wb, 'Informe_Ahorrado.xlsx');
    });
});

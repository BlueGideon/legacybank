document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCrearFondo = document.getElementById('btnCrearFondo');

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    const btnAhorros = document.getElementById('btnAhorros');
    const btnPrestamos = document.getElementById('btnPrestamos');
    const btnIngresosGastos = document.getElementById('btnIngresosGastos');
    
    const btnGestionFondos = document.getElementById('btnGestionFondos');

    // Funcion para cerrar sesion
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Funcion para ir a pestaña ahorros
    btnAhorros.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
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

    const filtroFondo = document.getElementById('filtroFondo');
    const filtroParticipante = document.getElementById('filtroTipoParticipante');
    const filtroPuesto = document.getElementById('filtroPuesto');
    const btnGenerar = document.querySelector('.generar-informe');
    const cuerpoTabla = document.getElementById('tablaParticipantesCuerpo');
    const totalParticipantes = document.getElementById('totalParticipantes');
    const totalPuesto = document.getElementById('totalPuesto');

    const fondos = JSON.parse(localStorage.getItem('fondosCreados')) || [];
    const participantes = JSON.parse(localStorage.getItem('participantesCreados')) || [];

    // 1. Llenar el filtro de fondos
    fondos.forEach(f => {
        const option = document.createElement('option');
        option.value = f.nombre;
        option.textContent = f.nombre;
        filtroFondo.appendChild(option);
    });

    // 2. Cuando se selecciona un fondo, llenar los participantes y puestos
    filtroFondo.addEventListener('change', () => {
        const fondoSeleccionado = filtroFondo.value;

        // Participantes del fondo con rol Usuario
        const participantesFondo = participantes.filter(p => p.fondo === fondoSeleccionado && p.rol === 'Usuario');

        // Participantes únicos
        filtroParticipante.innerHTML = '<option disabled selected>Selecciona Participante</option>';
        [...new Set(participantesFondo.map(p => p.nombre))].forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            filtroParticipante.appendChild(option);
        });


        // Puestos únicos
        filtroPuesto.innerHTML = '<option disabled selected>Selecciona el puesto</option>';
        [...new Set(participantesFondo.map(p => p.puesto))].forEach(puesto => {
            const option = document.createElement('option');
            option.value = puesto;
            option.textContent = puesto;
            filtroPuesto.appendChild(option);
        });
    });

    // 3. Generar informe
    btnGenerar.addEventListener('click', () => {
        const fondo = filtroFondo.value;
        const participante = filtroParticipante.value;
        const puesto = filtroPuesto.value;

        if (!fondo || fondo === 'Selecciona fondo') {
            alert('Selecciona al menos un fondo');
            return;
        }

        let datosFiltrados = participantes.filter(p => p.fondo === fondo && p.rol === 'Usuario');

        if (participante && participante !== 'Selecciona Participante') {
            datosFiltrados = datosFiltrados.filter(p => p.nombre === participante);
        }

        if (puesto && puesto !== 'Selecciona el puesto') {
            datosFiltrados = datosFiltrados.filter(p => p.puesto === puesto);
        }

        // Mostrar en tabla
        cuerpoTabla.innerHTML = '';
        if (datosFiltrados.length === 0) {
            const row = cuerpoTabla.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No hay participantes con esos filtros.';
            cell.style.textAlign = 'center';
            cell.style.color = '#fff';
        } else {
            datosFiltrados.forEach(p => {
                const row = cuerpoTabla.insertRow();
                row.insertCell().textContent = p.nombre;
                row.insertCell().textContent = p.correo;
                row.insertCell().textContent = p.telefono;
                row.insertCell().textContent = p.puesto;
                row.insertCell().textContent = p.rol;
                row.insertCell().textContent = p.fondo;
            });
        }

        totalParticipantes.textContent = datosFiltrados.length;
        totalPuesto.textContent = datosFiltrados.filter(p => p.puesto === 'Completo').length + ' / ' + datosFiltrados.filter(p => p.puesto === 'Medio').length;
    });

    const btnDescargarInforme = document.getElementById('descargarInforme');

    btnDescargarInforme.addEventListener('click', () => {
        const tabla = document.querySelector('.tabla'); // La tabla del informe

        // Convertir la tabla a una hoja de cálculo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(tabla);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');

        // Descargar el archivo Excel
        XLSX.writeFile(wb, 'Informe_Participantes.xlsx');
    });
});
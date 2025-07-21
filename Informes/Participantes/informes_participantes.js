import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', () => {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const filtroFondo = document.getElementById('filtroFondo');
    const filtroParticipante = document.getElementById('filtroTipoParticipante');
    const filtroPuesto = document.getElementById('filtroPuesto');
    const btnGenerar = document.querySelector('.generar-informe');
    const cuerpoTabla = document.getElementById('tablaParticipantesCuerpo');
    const totalParticipantes = document.getElementById('totalParticipantes');
    const totalPuesto = document.getElementById('totalPuesto');
    const btnDescargar = document.getElementById('descargarInforme');

    // Cerrar sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // Botones de pestañas
    btnAhorros.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });
    btnPrestamos.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/Prestamos/informes_prestamos.html';
    });
    btnIngresosGastos.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = '/Informes/IngresosGastos/informes_ingresosgastos.html';
    });

    // ✅ 1. Cargar Fondos desde MySQL (value = id, text = nombre)
    async function cargarFondos() {
        filtroFondo.innerHTML = '<option disabled selected>Selecciona fondo</option>';
        try {
            const response = await fetch(`${API_URL}/api/fondos`);
            const fondos = await response.json();

            fondos.forEach(fondo => {
                const option = document.createElement('option');
                option.value = fondo.id; // ✅ Usamos el ID para filtrar
                option.textContent = fondo.nombre; // ✅ Mostramos el nombre
                filtroFondo.appendChild(option);
            });

        } catch (error) {
            console.error('Error cargando fondos:', error);
        }
    }

    // ✅ 2. Cargar Participantes según Fondo (filtra por idFondo)
    async function cargarParticipantesPorFondo(idFondo) {
        try {
            const response = await fetch(`${API_URL}/api/participantes`);
            const todos = await response.json();

            const participantesDelFondo = todos.filter(
                p => p.fondo_id === parseInt(idFondo) && p.rol === 'Usuario'
            );

            // Participantes únicos
            filtroParticipante.innerHTML = '<option disabled selected>Selecciona Participante</option>';
            [...new Set(participantesDelFondo.map(p => p.nombre))].forEach(nombre => {
                const option = document.createElement('option');
                option.value = nombre;
                option.textContent = nombre;
                filtroParticipante.appendChild(option);
            });

            // Puestos únicos
            filtroPuesto.innerHTML = '<option disabled selected>Selecciona el puesto</option>';
            [...new Set(participantesDelFondo.map(p => p.puesto))].forEach(puesto => {
                const option = document.createElement('option');
                option.value = puesto;
                option.textContent = puesto;
                filtroPuesto.appendChild(option);
            });

        } catch (error) {
            console.error('Error cargando participantes por fondo:', error);
        }
    }

    // ✅ 3. Generar Informe (filtra por idFondo, muestra nombreFondo)
    async function generarInformeParticipantes() {
        const idFondo = filtroFondo.value;
        const participante = filtroParticipante.value;
        const puesto = filtroPuesto.value;

        if (!idFondo || idFondo === 'Selecciona fondo') {
            alert('Debes seleccionar un fondo');
            return;
        }

        try {
            // Obtener participantes y fondos
            const [resParticipantes, resFondos] = await Promise.all([
                fetch(`${API_URL}/api/participantes`),
                fetch(`${API_URL}/api/fondos`)
            ]);

            const participantes = await resParticipantes.json();
            const fondos = await resFondos.json();

            // Encontrar el nombre del fondo seleccionado
            const fondoSeleccionado = fondos.find(f => f.id === parseInt(idFondo));

            // Filtrar participantes por idFondo
            let filtrados = participantes.filter(
                p => p.fondo_id === parseInt(idFondo) && p.rol === 'Usuario'
            );

            if (participante && participante !== 'Selecciona Participante') {
                filtrados = filtrados.filter(
                    p => p.nombre.trim().toLowerCase() === participante.trim().toLowerCase()
                );
            }

            if (puesto && puesto !== 'Selecciona el puesto') {
                filtrados = filtrados.filter(
                    p => p.puesto.trim().toLowerCase() === puesto.trim().toLowerCase()
                );
            }

            // Pintar tabla
            cuerpoTabla.innerHTML = '';
            if (filtrados.length === 0) {
                const row = cuerpoTabla.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 7;
                cell.textContent = 'No hay participantes con esos filtros.';
                cell.style.textAlign = 'center';
                cell.style.color = '#fff';
            } else {
                filtrados.forEach(p => {
                    const row = cuerpoTabla.insertRow();
                    row.insertCell().textContent = p.nombre;
                    row.insertCell().textContent = p.correo;
                    row.insertCell().textContent = p.telefono;
                    row.insertCell().textContent = p.puesto;
                    row.insertCell().textContent = p.rol;
                    // ✅ Muestra el nombre del fondo, no el ID
                    row.insertCell().textContent = fondoSeleccionado ? fondoSeleccionado.nombre : 'Desconocido';
                });
            }

            totalParticipantes.textContent = filtrados.length;
            totalPuesto.textContent =
                `${filtrados.filter(p => p.puesto.toLowerCase() === 'completo').length} / 
                 ${filtrados.filter(p => p.puesto.toLowerCase() === 'medio').length}`;

        } catch (error) {
            console.error('Error generando informe:', error);
        }
    }

    // ✅ 4. Descargar Informe en Excel
    btnDescargar.addEventListener('click', () => {
        const tabla = document.querySelector('.tabla');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(tabla);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');
        XLSX.writeFile(wb, 'Informe_Participantes.xlsx');
    });

    // ✅ 5. Eventos
    filtroFondo.addEventListener('change', () => {
        const idFondo = filtroFondo.value;
        cargarParticipantesPorFondo(idFondo);
    });

    btnGenerar.addEventListener('click', generarInformeParticipantes);

    // ✅ 6. Inicializar
    cargarFondos();
});

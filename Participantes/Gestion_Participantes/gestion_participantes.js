import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAnadirParticipante = document.getElementById('btnAnadirParticipante');
    const tablaParticipantesCuerpo = document.getElementById('tablaParticipantesCuerpo');

    btnCerrarSesion.addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    btnAnadirParticipante.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('participanteEnEdicionId');
        window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
    });

    async function cargarParticipantes() {
        tablaParticipantesCuerpo.innerHTML = '';

        try {
            // ✅ 1. Obtener el fondo actual (ID y nombre)
            const fondoActualRes = await fetch(`${API_URL}/api/fondos/actual`);
            const fondoActual = await fondoActualRes.json();
            const fondoIdActual = fondoActual.id;
            const fondoNombreActual = fondoActual.nombre;

            // ✅ 2. Obtener todos los participantes
            const participantesRes = await fetch(`${API_URL}/api/participantes`);
            let participantes = await participantesRes.json();

            // ✅ 3. Filtrar solo los del fondo actual por ID
            participantes = participantes.filter(p => p.fondo_id === fondoIdActual);

            if (participantes.length === 0) {
                const row = tablaParticipantesCuerpo.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 9;
                cell.textContent = 'No hay participantes creados aún en este fondo.';
                cell.style.textAlign = 'center';
                return;
            }

            // ✅ 4. Pintar los participantes (con el nombre del fondo actual)
            participantes.forEach(participante => {
                const row = tablaParticipantesCuerpo.insertRow();
                row.insertCell().textContent = participante.nombre;
                row.insertCell().textContent = participante.correo;
                row.insertCell().textContent = participante.contrasena;
                row.insertCell().textContent = participante.telefono;
                row.insertCell().textContent = participante.rol;
                row.insertCell().textContent = participante.puesto;
                row.insertCell().textContent = participante.cantPuestos;
                row.insertCell().textContent = fondoNombreActual; // 👈 Mostramos el nombre, no el ID

                const accionesCell = row.insertCell();
                const btnEditar = document.createElement('button');
                btnEditar.textContent = 'Editar';
                btnEditar.classList.add('editar-btn');
                btnEditar.addEventListener('click', () => editarParticipante(participante.id));
                accionesCell.appendChild(btnEditar);

                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.classList.add('eliminar-btn');
                btnEliminar.addEventListener('click', () => eliminarParticipante(participante.id));
                accionesCell.appendChild(btnEliminar);
            });
        } catch (error) {
            console.error('Error al cargar participantes:', error);
        }
    }

    function editarParticipante(id) {
        localStorage.setItem('participanteEnEdicionId', id);
        window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
    }

    function eliminarParticipante(id) {
        if (confirm('¿Estás seguro de eliminar este participante?')) {
            fetch(`${API_URL}/api/participantes/${id}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje);
                cargarParticipantes();
            })
            .catch(error => {
                console.error('Error al eliminar participante:', error);
            });
        }
    }

    cargarParticipantes();
});

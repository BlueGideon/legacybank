document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAnadirParticipante = document.getElementById('btnAnadirParticipante');
    const tablaParticipantesCuerpo = document.getElementById('tablaParticipantesCuerpo');

    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    btnAnadirParticipante.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('participanteEnEdicionId');
        window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
    });

    function cargarParticipantes() {
        tablaParticipantesCuerpo.innerHTML = '';

        fetch('http://localhost:3000/api/participantes')
            .then(res => res.json())
            .then(participantes => {
                if (participantes.length === 0) {
                    const row = tablaParticipantesCuerpo.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 9;
                    cell.textContent = 'No hay participantes creados aún.';
                    cell.style.textAlign = 'center';
                    return;
                }

                participantes.forEach(participante => {
                    const row = tablaParticipantesCuerpo.insertRow();
                    row.insertCell().textContent = participante.nombre;
                    row.insertCell().textContent = participante.correo;
                    row.insertCell().textContent = participante.contrasena;
                    row.insertCell().textContent = participante.telefono;
                    row.insertCell().textContent = participante.rol;
                    row.insertCell().textContent = participante.puesto;
                    row.insertCell().textContent = participante.cantPuestos;
                    row.insertCell().textContent = participante.fondo;

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
            })
            .catch(error => {
                console.error('Error al cargar participantes:', error);
            });
    }

    function editarParticipante(id) {
        localStorage.setItem('participanteEnEdicionId', id);
        window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
    }

    function eliminarParticipante(id) {
        if (confirm('¿Estás seguro de eliminar este participante?')) {
            fetch(`http://localhost:3000/api/participantes/${id}`, {
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

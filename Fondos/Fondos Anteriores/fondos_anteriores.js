import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    const btnAtras = document.getElementById('btnAtras');

    const tablaFondosCuerpo = document.getElementById('tablaFondosCuerpo');

    const btnVolverCrearFondo = document.getElementById('btnVolverCrearFondo');

    // Funcion para cerrar sesión
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Funcion para volver atras
    btnAtras.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Fondos/fondos.html';
    });

    // Funcion para cargar y mostrar los fondos
    function cargarFondos() {
        tablaFondosCuerpo.innerHTML = '';

        fetch(`${API_URL}/api/fondos`)
            .then(response => response.json())
            .then(fondos => {
                if (fondos.length === 0) {
                    const row = tablaFondosCuerpo.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 6;
                    cell.textContent = 'No hay fondos creados aún.';
                    cell.style.textAlign = 'center';
                    return;
                }

                fondos.forEach(fondo => {
                    const row = tablaFondosCuerpo.insertRow();

                    row.insertCell().textContent = fondo.nombre;
                    row.insertCell().textContent = fondo.tISocio;
                    row.insertCell().textContent = fondo.tIExterno;
                    row.insertCell().textContent = fondo.vPCompleto;
                    row.insertCell().textContent = fondo.esActual;

                    const accionesCell = row.insertCell();
                    accionesCell.classList.add('acciones');

                    const btnEditar = document.createElement('button');
                    btnEditar.textContent = 'Editar';
                    btnEditar.classList.add('editar-btn');
                    btnEditar.addEventListener('click', () => {
                        // Guardar el ID del fondo para editar
                        localStorage.setItem('fondoEnEdicion', fondo.id);
                        window.location.href = '/Fondos/Crear Fondo/crear_fondo.html';
                    });
                    accionesCell.appendChild(btnEditar);

                    const btnEliminar = document.createElement('button');
                    btnEliminar.textContent = 'Eliminar';
                    btnEliminar.classList.add('eliminar-btn');
                    btnEliminar.addEventListener('click', () => eliminarFondo(fondo.id));
                    accionesCell.appendChild(btnEliminar);
                });
            })
            .catch(error => {
                console.error('Error al obtener fondos:', error);
            });
    }

    // Funcion eliminar fondo
    function eliminarFondo(id) {
        if (confirm('¿Estás seguro de eliminar este fondo?')) {
            fetch(`${API_URL}/api/fondos/${id}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje);
                cargarFondos(); // Recargar tabla
            })
            .catch(error => {
                console.error('Error al eliminar fondo:', error);
            });
        }
    }

    // Llama a la función para cargar los fondos cuando la página se carga
    cargarFondos();

    // Evento para el botón "Volver a Crear Fondo"
    if (btnVolverCrearFondo) {
        btnVolverCrearFondo.addEventListener('click', function() {
            localStorage.removeItem('fondoEnEdicion');
            window.location.href = '/Fondos/Crear Fondo/crear_fondo.html';
        });
    }
});
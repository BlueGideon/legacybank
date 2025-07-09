document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCrearFondo = document.getElementById('btnCrearFondo');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnGestionFondos = document.getElementById('btnGestionFondos');

    // Función para cerrar sesión
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Función para ir al formulario de crear fondo
    btnCrearFondo.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Fondos/Crear Fondo/crear_fondo.html';
    });

    // Función para ir a la gestión de fondos
    btnGestionFondos.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Fondos/Fondos Anteriores/fondos_anteriores.html';
    });

    // 🔄 Obtener fondo actual desde MySQL
    const fondoActualElemento = document.getElementById('fondoActualNombre');

    fetch('http://localhost:3000/api/fondos/actual')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo obtener el fondo actual');
            return response.json();
        })
        .then(data => {
            fondoActualElemento.textContent = data.nombre || 'Ninguno';
        })
        .catch(error => {
            console.error('Error al cargar fondo actual:', error);
            fondoActualElemento.textContent = 'Ninguno';
        });
});

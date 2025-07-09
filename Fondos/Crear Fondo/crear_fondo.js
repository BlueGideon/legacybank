document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnAtras = document.getElementById('btnAtras');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnCrearFondo = document.getElementById('btnCrearFondo');

    // Cerrar sesión
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Volver atrás
    btnAtras.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '../fondos.html';
    });

    const fondoEnEdicion = localStorage.getItem('fondoEnEdicion');

    // Si se está editando, traer datos del fondo desde el backend
    if (fondoEnEdicion) {
        fetch('http://localhost:3000/api/fondos')
            .then(res => res.json())
            .then(fondos => {
                const fondo = fondos.find(f => f.id == fondoEnEdicion);
                if (fondo) {
                    document.getElementById('nombreFondo').value = fondo.nombre;
                    document.getElementById('tasaInteresSocio').value = fondo.tISocio;
                    document.getElementById('tasaInteresExterno').value = fondo.tIExterno;
                    document.getElementById('vPuestoCompleto').value = fondo.vPCompleto;
                    document.getElementById('marcarActual').checked = fondo.esActual === 'Si';
                    btnCrearFondo.textContent = 'Actualizar Fondo';
                }
            });
    }

    // Crear o actualizar fondo
    btnCrearFondo.addEventListener('click', async function () {
        const nombre = document.getElementById('nombreFondo').value;
        const tISocio = document.getElementById('tasaInteresSocio').value;
        const tIExterno = document.getElementById('tasaInteresExterno').value;
        const vPCompleto = Number(document.getElementById('vPuestoCompleto').value);
        const esActual = document.getElementById('marcarActual').checked ? 'Si' : 'No';

        if (!nombre || !tISocio || !tIExterno || !vPCompleto) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        try {
            if (fondoEnEdicion) {
                // Actualizar fondo
                await fetch(`http://localhost:3000/api/fondos/${fondoEnEdicion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, tISocio, tIExterno, vPCompleto, esActual })
                });
                localStorage.removeItem('fondoEnEdicion');
            } else {
                // Crear nuevo fondo
                await fetch('http://localhost:3000/api/fondos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, tISocio, tIExterno, vPCompleto, esActual })
                });
            }

            window.location.href = '/Fondos/Fondos Anteriores/fondos_anteriores.html';
        } catch (error) {
            console.error('Error al guardar el fondo:', error);
            alert('Hubo un error al guardar el fondo');
        }
    });
});

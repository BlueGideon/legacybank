import { API_URL } from "./config.js";
document.addEventListener('DOMContentLoaded', function() {

    const btnIniciarSesion = document.getElementById('btnIniciarSesion');

    const linkOlvido = document.getElementById('olvideContrasena');
    const seccionRecuperar = document.getElementById('recuperarContrasena');
    const formularioLogin = document.getElementById('formularioLogin');
    const btnVerificar = document.getElementById('verificarIdentidad');
    const formNuevaContrasena = document.getElementById('formNuevaContrasena');
    const btnActualizarContrasena = document.getElementById('btnActualizarContrasena');
    const volverLogin = document.getElementById('volverLogin');

    // Evento para iniciar sesión
    btnIniciarSesion.addEventListener('click', async function(event) {
    event.preventDefault();

    const correo = document.getElementById('inputCorreo').value.trim();
    const contrasena = document.getElementById('inputContrasena').value.trim();

    if (!correo || !contrasena) {
        return alert('Completa todos los campos.');
    }

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.mensaje);
            return;
        }

        localStorage.setItem('adminActivo', JSON.stringify(data.usuario));
        window.location.href = '/Inicio/inicio.html';

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('No se pudo iniciar sesión.');
    }
});


    // Mostrar formulario de recuperar contraseña
    linkOlvido.addEventListener('click', function (e) {
        e.preventDefault();
        formularioLogin.style.display = 'none';
        seccionRecuperar.classList.remove('oculto');
    });

    // Verificar identidad
    btnVerificar.addEventListener('click', async () => {
    const correo = document.getElementById('correoRecuperar').value;
    const fondoActual = document.getElementById('fondoRecuperar').value;

    if (!correo || !fondoActual) {
        alert('Completa todos los campos');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/login/verificar-identidad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, fondo: fondoActual })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.mensaje || 'Verificación fallida');
            formNuevaContrasena.style.display = 'none';
            return;
        }

        formNuevaContrasena.style.display = 'block';

    } catch (error) {
        console.error('Error verificando identidad:', error);
        alert('No se pudo verificar identidad');
    }
});


    // Actualizar contraseña
    btnActualizarContrasena.addEventListener('click', async () => {
    const correo = document.getElementById('correoRecuperar').value.trim();
    const nueva = document.getElementById('nuevaContrasena').value.trim();
    const confirmar = document.getElementById('confirmarContrasena').value.trim();
    const fondo = document.getElementById('fondoRecuperar').value;

    if (!correo || !nueva || !confirmar) {
        alert('Completa todos los campos.');
        return;
    }

    if (nueva !== confirmar) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/login/actualizar-contrasena`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, fondo, nuevaContrasena: nueva })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.mensaje);
            return;
        }

        alert('Contraseña actualizada correctamente.');
        location.reload();
    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        alert('Error al actualizar la contraseña.');
    }
});


    volverLogin.addEventListener('click', (e) => {
        e.preventDefault();
        seccionRecuperar.classList.add('oculto');
        formularioLogin.style.display = 'flex'; // o 'block', depende de tu estilo
    });

    // Cargar el fondo actual
    fetch(`${API_URL}/api/fondos/actual`)
        .then(res => res.json())
        .then(fondoActual => {
            const selectFondo = document.getElementById('fondoRecuperar');
            selectFondo.innerHTML = ''; // limpiar
            const option = document.createElement('option');
            option.value = fondoActual.nombre;
            option.textContent = fondoActual.nombre;
            selectFondo.appendChild(option);
        })
        .catch(error => {
            console.error('Error al cargar fondo actual:', error);
            const selectFondo = document.getElementById('fondoRecuperar');
            selectFondo.innerHTML = '<option>Error al cargar fondo actual</option>';
        });

});

document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Funcion editar perfil
document.getElementById('perfilAdmin').addEventListener('click', () => {
    localStorage.removeItem('modoCambiarContrasenaAdmin');
    localStorage.setItem('modoEditarPerfilAdmin', 'true');
    window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
});

    // ✅ Funcion cambiar contraseña
    document.getElementById('cambiarContrasena').addEventListener('click', function () {
        localStorage.setItem('modoCambiarContrasenaAdmin', 'true');
        window.location.href = '/Participantes/Anadir_Participante/anadir_participante.html';
    });

});
document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCrearParticipante = document.getElementById('btnCrearParticipante');
    const nombreInput = document.getElementById('nombreParticipante');
    const correoInput = document.getElementById('correoElectronico');
    const contrasenaInput = document.getElementById('contrasenaNParticipante');
    const telefonoInput = document.getElementById('telefonoNParticipante');
    const puestoSelect = document.getElementById('seleccionPuesto');
    const rolSelect = document.getElementById('seleccionRol');
    const cantidadPuestosInput = document.getElementById('cantidadPuestos');
    const fondoInput = document.getElementById('fondoActualAsignado');

    const idEdicion = localStorage.getItem('participanteEnEdicionId');

    // Mostrar fondo actual desde MySQL SOLO si NO estamos editando
if (!idEdicion) {
    fetch('http://localhost:3000/api/fondos/actual')
        .then(res => res.json())
        .then(fondo => {
            fondoInput.value = fondo.nombre || 'Ninguno';
        })
        .catch(error => {
            console.error('Error al obtener fondo actual:', error);
            fondoInput.value = 'Ninguno';
        });
}


    // Ocultar campos si el rol es Administrador
    function toggleCamposPorRol(rol) {
        if (rol === 'Administrador') {
            puestoSelect.parentElement.style.display = 'none';
            cantidadPuestosInput.parentElement.style.display = 'none';
            puestoSelect.value = 'N/A';
            cantidadPuestosInput.value = '0'; // Para evitar error con DECIMAL
        } else {
            puestoSelect.parentElement.style.display = '';
            cantidadPuestosInput.parentElement.style.display = '';
        }
    }

    rolSelect.addEventListener('change', () => {
        toggleCamposPorRol(rolSelect.value);
    });

    // Cargar datos en modo edición
    if (idEdicion) {
        fetch(`http://localhost:3000/api/participantes/${idEdicion}`)
            .then(res => res.json())
            .then(participante => {
                nombreInput.value = participante.nombre;
                correoInput.value = participante.correo;
                contrasenaInput.value = participante.contrasena;
                telefonoInput.value = participante.telefono;
                rolSelect.value = participante.rol;
                puestoSelect.value = participante.puesto;
                cantidadPuestosInput.value = participante.cantPuestos || '0';
                fondoInput.value = participante.fondo;

                toggleCamposPorRol(participante.rol); // Oculta si es admin

                btnCrearParticipante.textContent = 'Actualizar Participante';
            })
            .catch(error => {
                console.error('Error al cargar participante:', error);
                alert('No se pudo cargar el participante.');
            });
    }

    // Crear o actualizar participante
    btnCrearParticipante.addEventListener('click', function () {
        const nombre = nombreInput.value.trim();
        const correo = correoInput.value.trim();
        const contrasena = contrasenaInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const rol = rolSelect.value;
        const puesto = puestoSelect.value || 'N/A';
        let cantPuestos = cantidadPuestosInput.value.trim();
        const fondo = fondoInput.value;

        // Si es Administrador, asegúrate de que sea 0 (número)
        if (rol === 'Administrador') {
            cantPuestos = 0;
        }

        // Validar campos obligatorios
        if (!nombre || !correo || !contrasena || !telefono || !rol || cantPuestos === '') {
            return alert('Por favor completa todos los campos obligatorios.');
        }

        const datos = {
            nombre,
            correo,
            contrasena,
            telefono,
            rol,
            puesto,
            cantPuestos: parseFloat(cantPuestos), // Asegura que se envíe como número
            fondo
        };

        const url = idEdicion
            ? `http://localhost:3000/api/participantes/${idEdicion}`
            : `http://localhost:3000/api/participantes`;

        const method = idEdicion ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        })
            .then(res => res.json())
            .then(data => {
                alert(data.mensaje);
                localStorage.removeItem('participanteEnEdicionId');
                window.location.href = '/Participantes/Gestion_Participantes/gestion_participantes.html';
            })
            .catch(error => {
                console.error('Error al guardar participante:', error);
                alert('Hubo un error al guardar el participante.');
            });
    });
});


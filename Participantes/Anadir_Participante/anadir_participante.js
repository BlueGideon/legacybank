import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCrearParticipante = document.getElementById('btnCrearParticipante');
    const nombreInput = document.getElementById('nombreParticipante');
    const correoInput = document.getElementById('correoElectronico');
    const contrasenaInput = document.getElementById('contrasenaNParticipante');
    const telefonoInput = document.getElementById('telefonoNParticipante');
    const puestoSelect = document.getElementById('seleccionPuesto');
    const rolSelect = document.getElementById('seleccionRol');
    const cantidadPuestosInput = document.getElementById('cantidadPuestos');
    const fondoInput = document.getElementById('fondoActualAsignado');
    const fondoHiddenInput = document.getElementById('fondoActualId');
    const tituloFormulario = document.querySelector('.dashboard__titulo');

    const idEdicion = localStorage.getItem('participanteEnEdicionId');
    const esModoPerfilAdmin = localStorage.getItem('modoEditarPerfilAdmin') === 'true';
    const esModoCambiarContrasena = localStorage.getItem('modoCambiarContrasenaAdmin') === 'true';

    // ✅ --- MODO CAMBIAR CONTRASEÑA ADMIN ---
    if (esModoCambiarContrasena) {
        tituloFormulario.textContent = 'Cambiar Contraseña';
        btnCrearParticipante.textContent = 'Actualizar Contraseña';

        nombreInput.parentElement.style.display = 'none';
        correoInput.parentElement.style.display = 'none';
        telefonoInput.parentElement.style.display = 'none';
        rolSelect.parentElement.style.display = 'none';
        puestoSelect.parentElement.style.display = 'none';
        cantidadPuestosInput.parentElement.style.display = 'none';
        fondoInput.parentElement.style.display = 'none';

        const confirmarDiv = document.createElement('div');
        confirmarDiv.classList.add('datos__nuevo-participante');
        confirmarDiv.innerHTML = `
            <label class="label__nuevo-participante">Confirmar Contraseña</label>
            <input class="input__nuevo-participante" type="password" id="confirmarContrasena" placeholder="Confirma tu nueva contraseña">
        `;
        contrasenaInput.type = 'password';
        contrasenaInput.placeholder = 'Nueva Contraseña';
        contrasenaInput.parentElement.after(confirmarDiv);

        const confirmarInput = document.getElementById('confirmarContrasena');

        btnCrearParticipante.addEventListener('click', function () {
            const nuevaContrasena = contrasenaInput.value.trim();
            const confirmarContrasena = confirmarInput.value.trim();

            if (!nuevaContrasena || !confirmarContrasena) {
                return alert('Por favor completa ambos campos.');
            }

            if (nuevaContrasena !== confirmarContrasena) {
                return alert('Las contraseñas no coinciden.');
            }

            fetch(`${API_URL}/api/participantes/cambiar-contrasena/${admin.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contrasena: nuevaContrasena })
            })
                .then(res => res.json())
                .then(() => {
                    alert('Contraseña actualizada correctamente');
                    localStorage.removeItem('modoCambiarContrasenaAdmin');
                    window.location.href = '/Configuracion/configuracion.html';
                })
                .catch(error => {
                    console.error('Error al cambiar contraseña:', error);
                    alert('Hubo un error al cambiar la contraseña.');
                });
        });

        return;
    }

    // ✅ --- MODO PERFIL ADMIN ---
    if (esModoPerfilAdmin) {
        tituloFormulario.textContent = 'Actualizar Perfil de Administrador';
        btnCrearParticipante.textContent = 'Actualizar Perfil';

        nombreInput.value = admin.nombre;
        correoInput.value = admin.correo;
        telefonoInput.value = admin.telefono;

        contrasenaInput.parentElement.style.display = 'none';
        rolSelect.parentElement.style.display = 'none';
        puestoSelect.parentElement.style.display = 'none';
        cantidadPuestosInput.parentElement.style.display = 'none';
        fondoInput.parentElement.style.display = 'none';

        btnCrearParticipante.addEventListener('click', function () {
            const nombre = nombreInput.value.trim();
            const correo = correoInput.value.trim();
            const telefono = telefonoInput.value.trim();

            if (!nombre || !correo || !telefono) {
                return alert('Por favor completa todos los campos obligatorios.');
            }

            const datosActualizados = { nombre, correo, telefono };

            fetch(`${API_URL}/api/participantes/perfil-admin/${admin.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosActualizados)
            })
                .then(res => res.json())
                .then(() => {
                    alert('Perfil actualizado correctamente');
                    admin.nombre = nombre;
                    admin.correo = correo;
                    admin.telefono = telefono;
                    localStorage.setItem('adminActivo', JSON.stringify(admin));
                    localStorage.removeItem('modoEditarPerfilAdmin');
                    window.location.href = '/Configuracion/configuracion.html';
                })
                .catch(error => {
                    console.error('Error al actualizar perfil:', error);
                    alert('Hubo un error al actualizar el perfil.');
                });
        });

        return;
    }

    // ✅ --- MODO NORMAL (CREAR / EDITAR PARTICIPANTES) ---
    if (!idEdicion) {
        fetch(`${API_URL}/api/fondos/actual`)
            .then(res => res.json())
            .then(fondo => {
                fondoInput.value = fondo.nombre || 'Ninguno';
                fondoHiddenInput.value = fondo.id || '';
            })
            .catch(error => {
                console.error('Error al obtener fondo actual:', error);
                fondoInput.value = 'Ninguno';
                fondoHiddenInput.value = '';
            });
    }

    function toggleCamposPorRol(rol) {
        if (rol === 'Administrador') {
            puestoSelect.parentElement.style.display = 'none';
            cantidadPuestosInput.parentElement.style.display = 'none';
            puestoSelect.value = 'N/A';
            cantidadPuestosInput.value = '0';
        } else {
            puestoSelect.parentElement.style.display = '';
            cantidadPuestosInput.parentElement.style.display = '';
        }
    }

    rolSelect.addEventListener('change', () => {
        toggleCamposPorRol(rolSelect.value);
    });

    if (idEdicion) {
        fetch(`${API_URL}/api/participantes/${idEdicion}`)
            .then(res => res.json())
            .then(async participante => {
                nombreInput.value = participante.nombre;
                correoInput.value = participante.correo;
                contrasenaInput.value = participante.contrasena;
                telefonoInput.value = participante.telefono;
                rolSelect.value = participante.rol;
                puestoSelect.value = participante.puesto;
                cantidadPuestosInput.value = participante.cantPuestos || '0';
                toggleCamposPorRol(participante.rol);
                btnCrearParticipante.textContent = 'Actualizar Participante';

                // ✅ Obtenemos el nombre del fondo a partir del ID
                if (participante.fondo_id) {
                    try {
                        const resFondo = await fetch(`${API_URL}/api/fondos/${participante.fondo_id}`);
                        const fondoData = await resFondo.json();
                        fondoInput.value = fondoData.nombre || 'Ninguno';
                        fondoHiddenInput.value = participante.fondo_id;
                    } catch (error) {
                        console.error('Error al obtener el fondo del participante:', error);
                        fondoInput.value = 'Ninguno';
                        fondoHiddenInput.value = participante.fondo_id;
                    }
                }
            })
            .catch(error => {
                console.error('Error al cargar participante:', error);
                alert('No se pudo cargar el participante.');
            });
    }

    btnCrearParticipante.addEventListener('click', function () {
        const nombre = nombreInput.value.trim();
        const correo = correoInput.value.trim();
        const contrasena = contrasenaInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const rol = rolSelect.value;
        const puesto = puestoSelect.value || 'N/A';
        let cantPuestos = cantidadPuestosInput.value.trim();
        const fondoId = fondoHiddenInput.value;

        if (rol === 'Administrador') {
            cantPuestos = 0;
        }

        if (!nombre || !correo || !contrasena || !telefono || !rol || cantPuestos === '' || !fondoId) {
            return alert('Por favor completa todos los campos obligatorios.');
        }

        const datos = {
            nombre,
            correo,
            contrasena,
            telefono,
            rol,
            puesto,
            cantPuestos: parseFloat(cantPuestos),
            fondo_id: fondoId
        };

        const url = idEdicion
            ? `${API_URL}/api/participantes/${idEdicion}`
            : `${API_URL}/api/participantes`;

        const method = idEdicion ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
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

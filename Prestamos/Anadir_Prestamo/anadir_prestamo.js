import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAgregarPrestamo = document.getElementById('btnAgregarPrestamo');
    const nombreSelect = document.getElementById('nombreParticipante');

    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    const idEdicion = localStorage.getItem('prestamoEnEdicionID');
    let prestamoEnEdicion = null;
    let fondoActualId = null;

    try {
        // ✅ 1. OBTENER FONDO ACTUAL (ID Y NOMBRE)
        const fondoRes = await fetch(`${API_URL}/api/fondos/actual`);
        const fondoActual = await fondoRes.json();
        fondoActualId = fondoActual.id;

        // ✅ 2. CARGAR PARTICIPANTES DEL FONDO ACTUAL
        const participantesRes = await fetch(`${API_URL}/api/participantes/usuarios?fondo_id=${fondoActualId}`);
        const participantes = await participantesRes.json();

        nombreSelect.innerHTML = '';

        const opcionDefault = document.createElement('option');
        opcionDefault.value = '';
        opcionDefault.textContent = 'Seleccionar participante';
        opcionDefault.disabled = true;
        opcionDefault.selected = true;
        nombreSelect.appendChild(opcionDefault);

        if (participantes.length === 0) {
            const opcion = document.createElement('option');
            opcion.textContent = 'No hay usuarios registrados en este fondo';
            opcion.disabled = true;
            nombreSelect.appendChild(opcion);
        } else {
            participantes.forEach(part => {
                const opcion = document.createElement('option');
                opcion.value = part.nombre;
                opcion.textContent = part.nombre;
                nombreSelect.appendChild(opcion);
            });
        }
    } catch (error) {
        console.error('Error cargando fondo o participantes:', error);
        alert('Error al cargar los datos iniciales');
    }

    // ✅ 3. CARGAR PRÉSTAMO SI ESTAMOS EDITANDO
    if (idEdicion) {
        document.querySelector('h1').textContent = 'Actualizar Préstamo';
        btnAgregarPrestamo.textContent = 'Actualizar Préstamo';

        try {
            const res = await fetch(`${API_URL}/api/prestamos/${idEdicion}`);
            prestamoEnEdicion = await res.json();

            document.getElementById('fechaPrestamo').value = prestamoEnEdicion.fprestamo.split('T')[0];
            document.getElementById('solicitante').value = prestamoEnEdicion.solicitante;
            document.getElementById('valorPrestamo').value = prestamoEnEdicion.vprestamo;
            document.getElementById('seleccionTasa').value = prestamoEnEdicion.selecciontasa;
            document.getElementById('numeroCuotas').value = prestamoEnEdicion.ncuotas;
            nombreSelect.value = prestamoEnEdicion.nombre;
        } catch (err) {
            console.error('Error al cargar préstamo para edición:', err);
            alert('Error al cargar el préstamo para edición');
        }
    }

    // ✅ 4. GUARDAR O ACTUALIZAR PRÉSTAMO
    btnAgregarPrestamo.addEventListener('click', async function () {
        const fechaPrestamo = document.getElementById('fechaPrestamo').value;
        const nombreParticipante = document.getElementById('nombreParticipante').value;
        const solicitante = document.getElementById('solicitante').value;
        const valorPrestamo = document.getElementById('valorPrestamo').value;
        const seleccionTasa = document.getElementById('seleccionTasa').value;
        const numeroCuotas = document.getElementById('numeroCuotas').value;

        if (!fechaPrestamo || !nombreParticipante || !solicitante || !valorPrestamo || !seleccionTasa || !numeroCuotas) {
            alert('Por favor, completa todos los campos para crear el préstamo.');
            return;
        }

        const valorPrestamoNum = parseFloat(valorPrestamo);
        const tasaNum = parseFloat(seleccionTasa.replace('%', '')) / 100;
        const cuotasNum = parseInt(numeroCuotas);

        const valorInteres = valorPrestamoNum * tasaNum;
        const valorCuota = (valorPrestamoNum / cuotasNum) + valorInteres;
        const ganancia = valorInteres * cuotasNum;
        const valorTotalPagar = valorCuota * cuotasNum;

        const prestamoData = {
            fprestamo: fechaPrestamo,
            nombre: nombreParticipante,
            solicitante,
            vprestamo: valorPrestamoNum,
            selecciontasa: seleccionTasa,
            ncuotas: cuotasNum,
            valorInteres,
            valorCuota,
            ganancia,
            valorTotalPagar,
            fondo_id: fondoActualId // ✅ AHORA GUARDAMOS EL ID DEL FONDO
        };

        try {
            const url = idEdicion
                ? `${API_URL}/api/prestamos/${idEdicion}`
                : `${API_URL}/api/prestamos`;

            const metodo = idEdicion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prestamoData)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.mensaje || 'Error al guardar el préstamo.');
                return;
            }

            alert(data.mensaje || 'Préstamo guardado con éxito');
            localStorage.removeItem('prestamoEnEdicionID');
            window.location.href = '/Prestamos/Gestionar_Prestamos/gestion_prestamos.html';
        } catch (error) {
            console.error('Error al guardar préstamo:', error);
            alert('Hubo un error al guardar el préstamo.');
        }
    });
});

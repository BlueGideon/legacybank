import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAgregarPrestamo = document.getElementById('btnAgregarPrestamo');
    const nombreSelect = document.getElementById('nombreParticipante');

    // 🔐 Cerrar sesión
    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    const idEdicion = localStorage.getItem('prestamoEnEdicionID');
    let prestamoEnEdicion = null; // Guardamos los datos del préstamo mientras cargan los participantes

    if (idEdicion) {
        document.querySelector('h1').textContent = 'Actualizar Préstamo';
        btnAgregarPrestamo.textContent = 'Actualizar Préstamo';

        // Primero traemos el préstamo, pero NO llenamos aún el select
        fetch(`${API_URL}/api/prestamos/${idEdicion}`)
            .then(res => res.json())
            .then(prestamo => {
                prestamoEnEdicion = prestamo;
                document.getElementById('fechaPrestamo').value = prestamo.fprestamo.split('T')[0];
                document.getElementById('solicitante').value = prestamo.solicitante;
                document.getElementById('valorPrestamo').value = prestamo.vprestamo;
                document.getElementById('seleccionTasa').value = prestamo.selecciontasa;
                document.getElementById('numeroCuotas').value = prestamo.ncuotas;
            })
            .catch(err => {
                console.error('Error al cargar préstamo para edición:', err);
                alert('Error al cargar el préstamo para edición');
            });
    }

    // 🧑‍🤝‍🧑 Cargar participantes con rol 'Usuario' desde MySQL
    fetch(`${API_URL}/api/participantes/usuarios`)
        .then(res => res.json())
        .then(participantes => {
            nombreSelect.innerHTML = ''; // Limpiar opciones previas

            if (participantes.length === 0) {
                const opcion = document.createElement('option');
                opcion.textContent = 'No hay usuarios registrados';
                opcion.disabled = true;
                nombreSelect.appendChild(opcion);
                return;
            }

            participantes.forEach(part => {
                const opcion = document.createElement('option');
                opcion.value = part.nombre;
                opcion.textContent = part.nombre;
                opcion.setAttribute('data-puesto', part.puesto);
                nombreSelect.appendChild(opcion);
            });

            // ✅ Si estamos en edición, seleccionamos el nombre correcto AHORA que ya cargó el select
            if (idEdicion && prestamoEnEdicion) {
                nombreSelect.value = prestamoEnEdicion.nombre;
            }
        })
        .catch(err => {
            console.error('Error al cargar participantes:', err);
            alert('Error al cargar usuarios');
        });

    // 📌 Guardar o actualizar préstamo
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
            valorTotalPagar
        };

        try {
            let res, data;

            if (idEdicion) {
                // Actualizar préstamo existente
                res = await fetch(`${API_URL}/api/prestamos/${idEdicion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prestamoData)
                });
                data = await res.json();

                if (!res.ok) {
                    alert(data.mensaje || 'Error al actualizar el préstamo.');
                    return;
                }

                localStorage.removeItem('prestamoEnEdicionID');
                alert('Préstamo actualizado con éxito');
            } else {
                // Crear nuevo préstamo
                res = await fetch(`${API_URL}/api/prestamos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prestamoData)
                });
                data = await res.json();

                if (!res.ok) {
                    alert(data.mensaje || 'Error al guardar el préstamo.');
                    return;
                }

                alert('Préstamo guardado con éxito');
            }

            window.location.href = '/Prestamos/Gestionar_Prestamos/gestion_prestamos.html';

        } catch (error) {
            console.error('Error al guardar/actualizar préstamo:', error);
            alert('Error de conexión al guardar o actualizar préstamo.');
        }
    });
});


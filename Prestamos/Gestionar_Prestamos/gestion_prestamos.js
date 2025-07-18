import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAnadirPrestamo = document.getElementById('btnAnadirPrestamo');
    const btnVerPagosPrestamos = document.getElementById('btnVerPagosPrestamos');
    const tablaPrestamosCuerpo = document.getElementById('tablaPrestamosCuerpo');
    const btnVolverAgregarPagos = document.getElementById('btnVolverAgregarPrestamos');

    // Cerrar sesión
    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // Redirigir a añadir préstamo
    btnAnadirPrestamo.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('prestamoEnEdicionID');
        window.location.href = '/Prestamos/Anadir_Prestamo/anadir_prestamo.html';
    });

    // Redirigir a gestionar pagos
    btnVerPagosPrestamos.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Prestamos/Gestion_Pagos_Prestamos/gestion_pagos_prestamos.html';
    });

    // Botón para volver a agregar préstamo
    if (btnVolverAgregarPagos) {
        btnVolverAgregarPagos.addEventListener('click', function () {
            window.location.href = '/Prestamos/Anadir_Prestamo/anadir_prestamo.html';
        });
    }

    // Cargar préstamos desde backend
    function cargarPrestamos() {
        tablaPrestamosCuerpo.innerHTML = '';

        fetch(`${API_URL}/api/prestamos`)
            .then(res => res.json())
            .then(prestamos => {
                let total = 0;

                if (prestamos.length === 0) {
                    const row = tablaPrestamosCuerpo.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 11;
                    cell.textContent = 'No hay préstamos agregados aún.';
                    cell.style.textAlign = 'center';
                    document.getElementById('totalPrestado').textContent = '$ 0';
                    return;
                }

                prestamos.forEach(prestamo => {
                    const row = tablaPrestamosCuerpo.insertRow();

                    const valorPrestamo = parseFloat(prestamo.vprestamo);
                    const tasa = parseFloat(prestamo.selecciontasa.replace('%', '')) / 100;
                    const nCuotas = parseInt(prestamo.ncuotas);

                    const valorInteres = valorPrestamo * tasa;
                    const valorCuota = (valorPrestamo / nCuotas) + valorInteres;
                    const ganancia = valorInteres * nCuotas;
                    const valorTotalPagar = valorCuota * nCuotas;

                    const fecha = new Date(prestamo.fprestamo);
                    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;

                    row.insertCell().textContent = fechaFormateada;
                    row.insertCell().textContent = prestamo.nombre;
                    row.insertCell().textContent = prestamo.solicitante;
                    row.insertCell().textContent = valorPrestamo.toLocaleString('es-CO');
                    row.insertCell().textContent = prestamo.selecciontasa;
                    row.insertCell().textContent = prestamo.ncuotas;
                    row.insertCell().textContent = valorInteres.toLocaleString('es-CO');
                    row.insertCell().textContent = valorCuota.toLocaleString('es-CO');
                    row.insertCell().textContent = ganancia.toLocaleString('es-CO');
                    row.insertCell().textContent = valorTotalPagar.toLocaleString('es-CO');

                    const accionesCell = row.insertCell();
                    accionesCell.classList.add('acciones');

                    const btnEditar = document.createElement('button');
                    btnEditar.textContent = 'Editar';
                    btnEditar.classList.add('editar-btn');
                    btnEditar.addEventListener('click', () => {
                        localStorage.setItem('prestamoEnEdicionID', prestamo.id);
                        window.location.href = '/Prestamos/Anadir_Prestamo/anadir_prestamo.html';
                    });

                    const btnEliminar = document.createElement('button');
                    btnEliminar.textContent = 'Eliminar';
                    btnEliminar.classList.add('eliminar-btn');
                    btnEliminar.addEventListener('click', () => eliminarPrestamo(prestamo.id));

                    accionesCell.appendChild(btnEditar);
                    accionesCell.appendChild(btnEliminar);

                    total += valorPrestamo;
                });

                document.getElementById('totalPrestado').textContent = `$ ${total.toLocaleString('es-CO')}`;
            })
            .catch(err => {
                console.error('Error al cargar préstamos:', err);
                tablaPrestamosCuerpo.innerHTML = '<tr><td colspan="11">Error al cargar los préstamos</td></tr>';
            });
    }

    // Eliminar préstamo
    function eliminarPrestamo(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este préstamo?')) {
            fetch(`${API_URL}/api/prestamos/${id}`, {
                method: 'DELETE'
            })
                .then(res => res.json())
                .then(data => {
                    alert(data.mensaje || 'Préstamo eliminado');
                    cargarPrestamos(); // Recargar la tabla
                })
                .catch(err => {
                    console.error('Error al eliminar préstamo:', err);
                    alert('Error al eliminar el préstamo');
                });
        }
    }

    // Cargar préstamos al iniciar
    cargarPrestamos();
});

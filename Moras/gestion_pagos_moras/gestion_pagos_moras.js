import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Botones de navegación
    document.getElementById('btnAhorros').addEventListener('click', () => {
        window.location.href = '/Moras/moras_ahorros/moras_ahorros.html';
    });

    document.getElementById('btnPrestamos').addEventListener('click', () => {
        window.location.href = '/Moras/moras_prestamos/moras_prestamos.html';
    });

    document.getElementById('btnGestionPagosMoras').addEventListener('click', () => {
        window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';
    });

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const tablaPagosAhorros = document.getElementById('tablaPagosAhorros');
    const totalMoraAhorros = document.getElementById('totalMoraAhorros');
    const tablaPagosPrestamos = document.getElementById('tablaPagosPrestamos');
    const totalMoraPrestamos = document.getElementById('totalMoraPrestamos');

    btnCerrarSesion.addEventListener('click', function () {
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // =========================
    // PAGOS MORA DE AHORROS
    // =========================
    try {
        const resAhorros = await fetch(`${API_URL}/api/pagos-mora-ahorros/fondo-actual`);
        const pagosAhorros = await resAhorros.json();

        let totalAhorros = 0;
        tablaPagosAhorros.innerHTML = '';

        pagosAhorros.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

        pagosAhorros.forEach(p => {
            const fila = tablaPagosAhorros.insertRow();
            fila.insertCell().textContent = p.nombre;
            fila.insertCell().textContent = formatearFecha(p.fecha_pago);
            fila.insertCell().textContent = p.concepto;
            fila.insertCell().textContent = p.detalle;
            fila.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
            totalAhorros += parseFloat(p.valor);

            const accionesCell = fila.insertCell();

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'btn btn-editar';
            btnEditar.addEventListener('click', () => {
                localStorage.setItem('idPagoMoraAhorroEditar', p.id);
                localStorage.setItem('tipoMora', 'ahorros');
                window.location.href = '/Moras/pagos_moras_ahorros/pagos_moras_ahorros.html';
            });

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'btn btn-eliminar';
            btnEliminar.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de eliminar este pago de mora?')) {
                    try {
                        await fetch(`${API_URL}/api/pagos-mora-ahorros/${p.id}`, { method: 'DELETE' });
                        alert('Pago eliminado.');
                        location.reload();
                    } catch (err) {
                        console.error('Error al eliminar:', err);
                        alert('Error al eliminar el pago.');
                    }
                }
            });

            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
        });

        totalMoraAhorros.textContent = `$ ${totalAhorros.toLocaleString('es-CO')}`;
    } catch (error) {
        console.error('Error al cargar pagos mora ahorros:', error);
    }

    // =========================
    // PAGOS MORA DE PRÉSTAMOS
    // =========================
    try {
        const resPrestamos = await fetch(`${API_URL}/api/pagos-mora-prestamos/fondo-actual`);
        const pagosPrestamos = await resPrestamos.json();

        let totalPrestamos = 0;
        tablaPagosPrestamos.innerHTML = '';

        pagosPrestamos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

        pagosPrestamos.forEach(p => {
            const fila = tablaPagosPrestamos.insertRow();
            fila.insertCell().textContent = p.solicitante;
            fila.insertCell().textContent = formatearFecha(p.fecha_pago);
            fila.insertCell().textContent = p.concepto;
            fila.insertCell().textContent = p.detalle;
            fila.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
            totalPrestamos += parseFloat(p.valor);

            const accionesCell = fila.insertCell();

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.className = 'btn btn-editar';
            btnEditar.addEventListener('click', () => {
                localStorage.setItem('idPagoMoraPrestamoEditar', p.id);
                localStorage.setItem('tipoMora', 'prestamos');
                window.location.href = '/Moras/pagos_moras_prestamos/pagos_moras_prestamos.html';
            });

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'btn btn-eliminar';
            btnEliminar.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de eliminar este pago de mora de préstamo?')) {
                    try {
                        await fetch(`${API_URL}/api/pagos-mora-prestamos/${p.id}`, { method: 'DELETE' });
                        alert('Pago eliminado correctamente.');
                        location.reload();
                    } catch (err) {
                        console.error('Error al eliminar:', err);
                        alert('Error al eliminar el pago de mora.');
                    }
                }
            });

            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
        });

        totalMoraPrestamos.textContent = `$ ${totalPrestamos.toLocaleString('es-CO')}`;
    } catch (error) {
        console.warn('No se pudieron cargar pagos de mora de préstamos:', error);
    }

    // =========================
    // FUNCIONES DE APOYO
    // =========================
    function formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha)) return '';
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }
});

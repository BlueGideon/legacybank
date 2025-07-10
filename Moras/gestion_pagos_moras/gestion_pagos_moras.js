document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder.');
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

    // Elementos HTML
    const tablaPagosAhorros = document.getElementById('tablaPagosAhorros');
    const totalMoraAhorros = document.getElementById('totalMoraAhorros');

    const tablaPagosPrestamos = document.getElementById('tablaPagosPrestamos');
    const totalMoraPrestamos = document.getElementById('totalMoraPrestamos');

    // Cargar pagos de mora ahorros
try {
    const resAhorros = await fetch('http://localhost:3000/api/pagos-mora-ahorros');
    const pagosAhorros = await resAhorros.json();
    let totalAhorros = 0;
    tablaPagosAhorros.innerHTML = '';

    pagosAhorros.forEach(p => {
        const fila = tablaPagosAhorros.insertRow();
        fila.insertCell().textContent = p.nombre;
        fila.insertCell().textContent = formatearFecha(p.fecha_pago);
        fila.insertCell().textContent = p.concepto;
        fila.insertCell().textContent = p.detalle;
        fila.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
        totalAhorros += parseFloat(p.valor);

        // Acciones
        const accionesCell = fila.insertCell();
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn btn-editar';
        btnEditar.addEventListener('click', () => {
            localStorage.setItem('idPagoMoraEditar', p.id);
            window.location.href = '/Moras/pagos_moras.html';
        });

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn btn-eliminar';
        btnEliminar.addEventListener('click', async () => {
            const confirmacion = confirm('¿Estás seguro de eliminar este pago de mora?');
            if (confirmacion) {
                await fetch(`http://localhost:3000/api/pagos-mora-ahorros/${p.id}`, {
                    method: 'DELETE'
                });
                alert('Pago eliminado.');
                location.reload();
            }
        });

        accionesCell.appendChild(btnEditar);
        accionesCell.appendChild(btnEliminar);
    });

    document.getElementById('totalMoraAhorros').textContent = `$ ${totalAhorros.toLocaleString('es-CO')}`;
} catch (error) {
    console.error('Error al cargar pagos mora ahorros:', error);
}


    // Cargar pagos moras de préstamos (si ya tienes el backend listo)
    try {
        const resPrestamos = await fetch('http://localhost:3000/api/pagos-mora-prestamos');
        const pagosPrestamos = await resPrestamos.json();
        let totalPrestamos = 0;

        tablaPagosPrestamos.innerHTML = '';
        pagosPrestamos.forEach(p => {
            const fila = tablaPagosPrestamos.insertRow();
            fila.insertCell().textContent = p.solicitante;
            fila.insertCell().textContent = formatearFecha(p.fecha_pago);
            fila.insertCell().textContent = p.concepto;
            fila.insertCell().textContent = p.detalle;
            fila.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
            totalPrestamos += parseFloat(p.valor);
        });

        totalMoraPrestamos.textContent = `$ ${totalPrestamos.toLocaleString('es-CO')}`;
    } catch (error) {
        console.warn('No se pudieron cargar pagos de mora de préstamos (aún no implementado)');
    }

    // Formatear fecha
    function formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha)) return '';
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }
});

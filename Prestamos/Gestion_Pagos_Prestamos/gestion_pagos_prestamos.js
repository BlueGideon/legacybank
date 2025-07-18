import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAtras = document.getElementById('btnAtras');
    const btnAnadirPagosPrestamos = document.getElementById('btnAnadirPagosPrestamos');
    const tablaPagosPrestamosCuerpo = document.getElementById('tablaPagosPrestamosCuerpo');
    const btnVolverAgregarPagos = document.getElementById('btnVolverAgregarPagos');

    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    btnAtras.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Prestamos/Gestionar_Prestamos/gestion_prestamos.html';
    });

    btnAnadirPagosPrestamos.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Prestamos/Anadir_Pagos_Prestamos/anadir_pagos_prestamos.html';
    });

    function formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    async function cargarPagosPrestamos() {
    tablaPagosPrestamosCuerpo.innerHTML = '';

    try {
        const pagosprestamos = await fetch(`${API_URL}/api/pagos-prestamos`).then(res => res.json());
        const prestamos = await fetch(`${API_URL}/api/prestamos`).then(res => res.json());

        if (!pagosprestamos.length) {
            const row = tablaPagosPrestamosCuerpo.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8;
            cell.textContent = 'No hay pagos de préstamos agregados aún.';
            cell.style.textAlign = 'center';
            document.getElementById('totalPagosPrestado').textContent = '$ 0';
            document.getElementById('totalPendientePagar').textContent = '$ 0';
            return;
        }

        // ✅ Agrupar pagos por idPrestamo
        const pagosAgrupados = {};
        for (let pago of pagosprestamos) {
            if (!pagosAgrupados[pago.idPrestamo]) {
                pagosAgrupados[pago.idPrestamo] = [];
            }
            pagosAgrupados[pago.idPrestamo].push(pago);
        }

        const pagosConSaldo = [];

        for (let idPrestamo in pagosAgrupados) {
            const pagos = pagosAgrupados[idPrestamo].sort((a, b) => new Date(a.fpago) - new Date(b.fpago)); // cronológico
            const prestamo = prestamos.find(p => p.id == idPrestamo);
            if (!prestamo) continue;

            const totalPrestamo = parseFloat(prestamo.valorTotalPagar);
            let acumulado = 0;

            for (let pago of pagos) {
                const valorCuota = parseFloat(pago.vpago);
                acumulado += valorCuota;
                const restante = totalPrestamo - acumulado;

                // Calcular días de mora
                let diasMora = 0;
                if (pago.flpago) {
                    const fechaLimite = new Date(pago.flpago);
                    const fechaPago = new Date(pago.fpago);
                    const diferenciaEnMs = fechaPago - fechaLimite;
                    if (diferenciaEnMs > 0) {
                        diasMora = Math.floor(diferenciaEnMs / (1000 * 60 * 60 * 24));
                    }
                }

                pagosConSaldo.push({
                    ...pago,
                    solicitante: prestamo.solicitante,
                    valorCuota,
                    diasMora,
                    restante
                });
            }
        }

        // ✅ Mostrar los pagos (más reciente primero)
        pagosConSaldo.sort((a, b) => new Date(b.fpago) - new Date(a.fpago));

        pagosConSaldo.forEach((pago) => {
            const row = tablaPagosPrestamosCuerpo.insertRow();
            row.insertCell().textContent = pago.solicitante;
            row.insertCell().textContent = formatearFecha(pago.fpago);
            row.insertCell().textContent = formatearFecha(pago.flpago);
            row.insertCell().textContent = pago.valorCuota.toLocaleString('es-CO');
            row.insertCell().textContent = pago.cuotaAPagar;
            row.insertCell().textContent = pago.diasMora > 0 ? `${pago.diasMora} días` : 'Sin mora';
            row.insertCell().textContent = pago.restante.toLocaleString('es-CO');

            const accionesCell = row.insertCell();
            accionesCell.classList.add('acciones');

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.classList.add('editar-btn');
            btnEditar.addEventListener('click', () => {
                localStorage.setItem('pagoPrestamoEnEdicion', pago.id);
                window.location.href = '/Prestamos/Anadir_Pagos_Prestamos/anadir_pagos_prestamos.html';
            });
            accionesCell.appendChild(btnEditar);

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.classList.add('eliminar-btn');
            btnEliminar.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de que quieres eliminar este pago de préstamo?')) {
                    await fetch(`${API_URL}/api/pagos-prestamos/${pago.id}`, {
                        method: 'DELETE'
                    });
                    cargarPagosPrestamos();
                }
            });
            accionesCell.appendChild(btnEliminar);
        });

        // ✅ Total pagado
        const totalPagado = pagosConSaldo.reduce((sum, p) => sum + p.valorCuota, 0);
        document.getElementById('totalPagosPrestado').textContent = `$ ${totalPagado.toLocaleString('es-CO')}`;

        // ✅ Total pendiente (sumando cada préstamo)
        let totalPendiente = 0;
        prestamos.forEach(prestamo => {
            const totalPrestamo = parseFloat(prestamo.valorTotalPagar);
            const pagosPrestamo = pagosprestamos
                .filter(p => p.idPrestamo == prestamo.id)
                .reduce((sum, p) => sum + parseFloat(p.vpago), 0);

            const restante = totalPrestamo - pagosPrestamo;
            if (restante > 0) totalPendiente += restante;
        });
        document.getElementById('totalPendientePagar').textContent = `$ ${totalPendiente.toLocaleString('es-CO')}`;

    } catch (error) {
        console.error('Error al cargar pagos:', error);
        alert('No se pudieron cargar los pagos de préstamos.');
    }
}


    cargarPagosPrestamos();

    if (btnVolverAgregarPagos) {
        btnVolverAgregarPagos.addEventListener('click', function () {
            window.location.href = '/Prestamos/Anadir_Pagos_Prestamos/anadir_pagos_prestamos.html';
        });
    }
});

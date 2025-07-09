// ✅ anadir_pagos_prestamos.js

document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnAtras = document.getElementById('btnAtras');
    const titulo_pagosPrestamos = document.getElementById('titulo_pagosPrestamos');
    const btnAgregarPagoPrestamo = document.getElementById('btnAgregarPagoPrestamo');
    const solicitanteSelect = document.getElementById('solicitante');

    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    btnAtras.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Prestamos/Gestion_Pagos_Prestamos/gestion_pagos_prestamos.html';
    });

    fetch('http://localhost:3000/api/prestamos')
        .then(response => response.json())
        .then(prestamos => {
            const nombresUnicos = [...new Set(prestamos.map(p => p.solicitante))];
            if (nombresUnicos.length === 0) {
                const opcion = document.createElement('option');
                opcion.textContent = 'No hay solicitantes con préstamos';
                opcion.disabled = true;
                solicitanteSelect.appendChild(opcion);
            } else {
                nombresUnicos.forEach(nombre => {
                    const opcion = document.createElement('option');
                    opcion.value = nombre;
                    opcion.textContent = nombre;
                    solicitanteSelect.appendChild(opcion);
                });
            }

            const indiceEdicion = localStorage.getItem('pagoPrestamoEnEdicion');
            if (indiceEdicion !== null) {
                fetch('http://localhost:3000/api/pagos-prestamos')
                    .then(res => res.json())
                    .then(pagos => {
                        const pago = pagos.find(p => p.id == indiceEdicion);
                        if (pago) {
                            document.getElementById('solicitante').value = pago.solicitante;
                            document.getElementById('fechaPago').value = pago.fpago.split('T')[0];
                            document.getElementById('fechaLimitePago').value = pago.flpago.split('T')[0];
                            document.getElementById('valorPago').value = pago.vpago;
                            document.getElementById('solicitante').dispatchEvent(new Event('change'));
                            setTimeout(() => {
                                document.getElementById('cuotaAPagar').value = pago.cuotaAPagar;
                            }, 300);
                            titulo_pagosPrestamos.textContent = 'Actualizar Pago Préstamo';
                            btnAgregarPagoPrestamo.textContent = 'Actualizar Pago';
                        }
                    });
            }
        })
        .catch(error => console.error('Error al cargar solicitantes:', error));

    solicitanteSelect.addEventListener('change', async function () {
        const solicitanteSeleccionado = solicitanteSelect.value;
        const cuotaSelect = document.getElementById('cuotaAPagar');
        cuotaSelect.innerHTML = '<option value="" disabled selected>Selecciona la cuota</option>';

        try {
            const prestamoRes = await fetch(`http://localhost:3000/api/prestamos/por-solicitante/${encodeURIComponent(solicitanteSeleccionado)}`);
            const prestamoSolicitante = await prestamoRes.json();
            const totalCuotas = parseInt(prestamoSolicitante.ncuotas);

            const pagosRes = await fetch(`http://localhost:3000/api/pagos-prestamos/por-solicitante/${encodeURIComponent(solicitanteSeleccionado)}`);
            const pagosSolicitante = await pagosRes.json();

            const idEdicion = localStorage.getItem('pagoPrestamoEnEdicion');
            let cuotaEditando = null;
            if (idEdicion !== null) {
                const pagosAll = await fetch('http://localhost:3000/api/pagos-prestamos').then(r => r.json());
                const pagoEditando = pagosAll.find(p => p.id == idEdicion);
                if (pagoEditando?.solicitante === solicitanteSeleccionado) {
                    cuotaEditando = parseInt(pagoEditando.cuotaAPagar);
                }
            }

            const cuotasPagadas = pagosSolicitante.map(p => parseInt(p.cuotaAPagar)).filter(n => n !== cuotaEditando);

            for (let i = 1; i <= totalCuotas; i++) {
                if (!cuotasPagadas.includes(i) || i === cuotaEditando) {
                    const opcion = document.createElement('option');
                    opcion.value = i;
                    opcion.textContent = `Cuota ${i}`;
                    cuotaSelect.appendChild(opcion);
                }
            }
        } catch (error) {
            console.error('Error al cargar cuotas:', error);
            alert('No se pudo obtener la información del préstamo.');
        }
    });

    btnAgregarPagoPrestamo.addEventListener('click', async function () {
        const solicitante = document.getElementById('solicitante').value;
        const fechaPago = document.getElementById('fechaPago').value;
        const fechaLimitePago = document.getElementById('fechaLimitePago').value;
        const valorPago = document.getElementById('valorPago').value;
        const cuotaAPagar = document.getElementById('cuotaAPagar').value;

        if (!solicitante || !fechaPago || !fechaLimitePago || !valorPago || !cuotaAPagar) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        const nuevoPago = {
            solicitante,
            fpago: fechaPago,
            flpago: fechaLimitePago,
            vpago: parseFloat(valorPago),
            cuotaAPagar: parseInt(cuotaAPagar)
        };

        const idEdicion = localStorage.getItem('pagoPrestamoEnEdicion');

        try {
            if (idEdicion) {
                await fetch(`http://localhost:3000/api/pagos-prestamos/${idEdicion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoPago)
                });
                localStorage.removeItem('pagoPrestamoEnEdicion');
            } else {
                await fetch('http://localhost:3000/api/pagos-prestamos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoPago)
                });
            }
            window.location.href = '/Prestamos/Gestion_Pagos_Prestamos/gestion_pagos_prestamos.html';
        } catch (error) {
            console.error('Error al guardar el pago:', error);
            alert('Hubo un error al guardar el pago');
        }
    });
});

document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    btnCerrarSesion.addEventListener('click', function (event) {
            event.preventDefault();
            localStorage.removeItem('adminActivo');
            window.location.href = '/Login/login.html';
    });

    // Ir al boton Atras
    const btnAtras = document.getElementById('btnAtras');

    btnAtras.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';
    });


    const tipoMora = localStorage.getItem('tipoMora');
    if (tipoMora !== 'ahorros') return;

    let idEditar = localStorage.getItem('idPagoMoraAhorroEditar');

// Validación estricta
if (!idEditar || idEditar === 'undefined' || idEditar === 'null') {
    idEditar = null;
    localStorage.removeItem('idPagoMoraAhorroEditar'); // 🔥 limpiar basura
}

const modoEdicion = !!idEditar;


    const conceptoInput = document.getElementById('conceptoMora');
    const participante = document.getElementById('participante');
    const fechaPago = document.getElementById('fechaPago');
    const detalle = document.getElementById('detalleMora');
    const valor = document.getElementById('valorPago');
    const resumen = document.getElementById('resumenMora');
    const btnAgregar = document.getElementById('btnAgregarPagomoraAhorro');

    conceptoInput.value = 'Pago de Ahorro';

    // ==================================
    // 🟦 MODO EDICIÓN DE PAGO EXISTENTE
    // ==================================
    if (modoEdicion) {
        try {
            const res = await fetch(`http://localhost:3000/api/pagos-mora-ahorros/${idEditar}`);
            const pago = await res.json();
            const valorAnterior = parseFloat(pago.valor);

            participante.innerHTML = `<option value="${pago.nombre}" selected>${pago.nombre}</option>`;
            fechaPago.value = pago.fecha_pago.split('T')[0];
            detalle.innerHTML = `<option value="${pago.detalle}" selected>${pago.detalle}</option>`;
            valor.value = pago.valor;

            resumen.innerHTML = `<span class="mora-dias">Edición activa</span>`;
            btnAgregar.textContent = 'Actualizar Pago Mora';

            btnAgregar.addEventListener('click', async () => {
                const datos = {
                    nombre: participante.value,
                    fecha_pago: fechaPago.value,
                    concepto: conceptoInput.value.trim(),
                    detalle: detalle.value,
                    valor: parseFloat(valor.value),
                    id_pago_ahorro: pago.id_pago_ahorro
                };

                if (!datos.nombre || !datos.fecha_pago || !datos.concepto || !datos.detalle || isNaN(datos.valor) || datos.valor <= 0) {
                    alert('Completa todos los campos correctamente.');
                    return;
                }

                try {
                    const resUpdate = await fetch(`http://localhost:3000/api/pagos-mora-ahorros/${idEditar}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datos)
                    });

                    if (!resUpdate.ok) throw new Error('Error al actualizar el pago');

                    alert('Pago de mora actualizado correctamente.');
                    localStorage.removeItem('idPagoMoraAhorroEditar');
                    localStorage.removeItem('tipoMora');
                    window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';

                } catch (err) {
                    console.error('Error al actualizar:', err);
                    alert('Hubo un error al actualizar el pago.');
                }
            });

        } catch (error) {
            console.error('Error al cargar el pago a editar:', error);
            alert('No se pudo cargar el pago a editar.');
        }


    // ==================================
    // 🟩 MODO CREACIÓN DE NUEVO PAGO
    // ==================================
    } else {
        const pago = JSON.parse(localStorage.getItem('pagoAhorroMora'));
        console.log(pago)
        if (!pago) {
            alert('No se encontró el pago con mora.');
            return;
        }

        const fPago = new Date(pago.fecha_pago);
        const fLimite = new Date(pago.fecha_limite_pago);
        const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));
        const moraTotal = diasMora * 1000;

        try {
            const abonoRes = await fetch(`http://localhost:3000/api/pagos-mora-ahorros/abonados/${pago.id}`);
            const { total_abonado } = await abonoRes.json();
            const abonado = total_abonado ?? 0;
            const restante = moraTotal - abonado;

            participante.innerHTML = `<option value="${pago.nombre}" selected>${pago.nombre}</option>`;

            const detalleObj = {
                id: pago.id,
                diasMora,
                descripcion: `Mora ahorro del ${fPago.toLocaleDateString()}`,
                valorRestante: restante,
                valorTotal: moraTotal
            };

            detalle.innerHTML = `<option value='${JSON.stringify(detalleObj)}' selected>${detalleObj.descripcion} - $${restante.toLocaleString('es-CO')}</option>`;

            valor.value = restante;

            resumen.innerHTML = `
                <span class="mora-dias">Mora: ${diasMora} día${diasMora !== 1 ? 's' : ''}</span>
                <span class="mora-abono">Abonado: $${abonado.toLocaleString('es-CO')}</span>
                <span class="mora-restante">Restante: $${restante.toLocaleString('es-CO')}</span>
            `;

            btnAgregar.addEventListener('click', async () => {
                const detalleSeleccionado = detalle.value;
                if (!detalleSeleccionado) {
                    alert('Selecciona un detalle de mora válido.');
                    return;
                }

                const detalleParseado = JSON.parse(detalleSeleccionado);

                const datos = {
                    nombre: participante.value,
                    fecha_pago: fechaPago.value,
                    concepto: conceptoInput.value.trim(),
                    detalle: detalleParseado.descripcion,
                    valor: parseFloat(valor.value),
                    id_pago_ahorro: detalleParseado.id,  // ✅ Importante en CREACIÓN
                    id_fondo: pago.id_fondo
                };

                if (
                    !datos.nombre ||
                    !datos.fecha_pago ||
                    !datos.concepto ||
                    !datos.detalle ||
                    isNaN(datos.valor) || datos.valor <= 0 ||
                    !datos.id_pago_ahorro
                ) {
                    alert('Completa todos los campos correctamente.');
                    return;
                }

                try {
                    const res = await fetch('http://localhost:3000/api/pagos-mora-ahorros', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datos)
                    });

                    if (!res.ok) throw new Error('Error al guardar el pago');

                    alert('Pago de mora guardado correctamente.');
                    localStorage.removeItem('pagoAhorroMora');
                    localStorage.removeItem('tipoMora');
                    window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';

                } catch (err) {
                    console.error('Error al guardar:', err);
                    alert('Hubo un error al guardar el pago.');
                }
            });

        } catch (err) {
            console.error('Error cargando mora:', err);
            alert('Error al cargar la información de mora.');
        }
    }
});

import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const tituloSeccion = document.getElementById('tituloSeccion');
    const btnAgregarPago = document.getElementById('btnAgregarPago');
    const nombreSelect = document.getElementById('nombreParticipante');
    const pagoId = localStorage.getItem('pagoIdEdicion');

    // Cerrar sesión
    btnCerrarSesion.addEventListener('click', function (event) {
        event.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // Mostrar automáticamente el puesto y la cantidad al seleccionar participante
    nombreSelect.addEventListener('change', function () {
        const selectedOption = nombreSelect.options[nombreSelect.selectedIndex];
        const puesto = selectedOption.getAttribute('data-puesto');
        const cantPuestos = parseFloat(selectedOption.getAttribute('data-cantpuestos')) || 0;

        document.getElementById('puestoParticipante').value = puesto || '';
        document.getElementById('numPuestos').value = cantPuestos || '';

        // Valor de un puesto completo (puedes traerlo dinámico si lo deseas)
        const valorPuestoCompleto = 130000;
        const valorCalculado = valorPuestoCompleto * cantPuestos;
        document.getElementById('valorPago').placeholder =
            `Sugerido: ${valorCalculado.toLocaleString('es-CO')}`;
    });

    // ✅ Función para cargar participantes del fondo actual
    async function cargarParticipantesYEditarSiAplica() {
        try {
            // 1. Obtener fondo actual
            const fondoActualRes = await fetch(`${API_URL}/api/fondos/actual`);
            const fondoActual = await fondoActualRes.json();
            const fondoId = fondoActual.id; // 👈 Usamos el ID del fondo

            // 2. Obtener participantes SOLO del fondo actual desde el backend
            const res = await fetch(`${API_URL}/api/participantes/usuarios?fondo_id=${fondoId}`);
            const participantes = await res.json();


            // 3. Rellenar select
            nombreSelect.innerHTML = '';

            // 👉 Opción por defecto
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
                return;
            }

            participantes.forEach(part => {
                const opcion = document.createElement('option');
                opcion.value = part.nombre;
                opcion.textContent = part.nombre;
                opcion.setAttribute('data-puesto', part.puesto);
                opcion.setAttribute('data-cantpuestos', part.cantPuestos);
                nombreSelect.appendChild(opcion);

                console.log(`>> Participante: ${part.nombre} | Fondo: ${part.fondo}`);
            });

            // 4. Si estamos editando un pago, cargarlo
            if (pagoId) {
                const resPago = await fetch(`${API_URL}/api/pagos-ahorros/${pagoId}`);
                const pago = await resPago.json();

                document.getElementById('nombreParticipante').value = pago.nombre;
                document.getElementById('puestoParticipante').value = pago.puesto;
                document.getElementById('numPuestos').value = pago.cantPuestos;
                document.getElementById('valorPago').value = pago.valor;
                document.getElementById('fechaPago').value = pago.fecha_pago.split('T')[0];
                document.getElementById('fechaLimitePago').value = pago.fecha_limite_pago.split('T')[0];
                document.getElementById('seleccionMes').value = pago.mes;

                if (btnAgregarPago) btnAgregarPago.textContent = 'Actualizar Pago';
                if (tituloSeccion) tituloSeccion.textContent = 'Actualizar Pago';
            }

        } catch (error) {
            console.error('Error al cargar participantes o pago:', error);
        }
    }

    // Guardar nuevo pago o editar
    if (btnAgregarPago) {
        btnAgregarPago.addEventListener('click', async function () {
            const nombreParticipante = document.getElementById('nombreParticipante').value;
            const puesto = document.getElementById('puestoParticipante').value;
            const cantPuestos = document.getElementById('numPuestos').value;
            const valorPago = document.getElementById('valorPago').value;
            const fechaPago = document.getElementById('fechaPago').value;
            const fechaLimitePago = document.getElementById('fechaLimitePago').value;
            const seleccionMes = document.getElementById('seleccionMes').value;

            if (!nombreParticipante || !puesto || !cantPuestos || !valorPago || !fechaPago || !fechaLimitePago || !seleccionMes) {
                alert('Por favor, completa todos los campos.');
                return;
            }

            const diasMora = Math.ceil(
                (new Date(fechaPago) - new Date(fechaLimitePago)) / (1000 * 60 * 60 * 24)
            );

            const metodo = pagoId ? 'PUT' : 'POST';
            const url = pagoId
                ? `${API_URL}/api/pagos-ahorros/${pagoId}`
                : `${API_URL}/api/pagos-ahorros`;

            try {
                const res = await fetch(url, {
                    method: metodo,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombreParticipante,
                        puesto: puesto,
                        cantPuestos: cantPuestos,
                        valor: valorPago,
                        fecha_pago: fechaPago,
                        fecha_limite_pago: fechaLimitePago,
                        mes: seleccionMes,
                        dias_mora: diasMora
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    alert('Error al guardar el pago.');
                    return;
                }

                alert(data.mensaje);
                localStorage.removeItem('pagoIdEdicion');
                window.location.href = '/Pagos/Gestionar_Pagos/gestion_pagos.html';

            } catch (error) {
                console.error('Error al guardar el pago:', error);
                alert('Hubo un error al guardar el pago.');
            }
        });
    }

    // Iniciar carga
    cargarParticipantesYEditarSiAplica();
});

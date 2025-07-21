import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Botones navegación
    document.getElementById('btnPrestamos').addEventListener('click', () => {
        window.location.href = '/Moras/moras_prestamos/moras_prestamos.html';
    });

    document.getElementById('btnGestionPagosMoras').addEventListener('click', () => {
        window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';
    });

    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    const tablaCuerpo = document.querySelector('#tablaPagosCuerpo');
    const selectFiltro = document.getElementById('filtroParticipante');
    const btnConsultar = document.querySelector('.consultar');
    const totalTexto = document.getElementById('totalMora');
    const tipoMora = 'ahorros';
    let pagosConMora = [];

    // Función para formatear fechas
    function formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    try {
        const pagosRes = await fetch(`${API_URL}/api/pagos-ahorros/moras`);
        if (!pagosRes.ok) throw new Error('Error al obtener pagos con mora');
        const pagos = await pagosRes.json();

        const nombresSet = new Set();

        // Procesar pagos (ya vienen solo con mora > 0 del backend)
        for (const pago of pagos) {
            const diasMora = pago.dias_mora;
            const moraTotal = diasMora * 1000;

            const abonoRes = await fetch(`${API_URL}/api/pagos-mora-ahorros/abonados/${pago.id}`);
            if (!abonoRes.ok) throw new Error(`Error al obtener abonos de ${pago.id}`);
            const { total_abonado } = await abonoRes.json();
            const abonado = total_abonado ?? 0;
            const restante = moraTotal - abonado;

            if (restante > 0) {
                pagosConMora.push({
                    ...pago,
                    diasMora,
                    abonado,
                    restante,
                    moraTotal,
                    id_fondo: pago.fondo_id
                });
                nombresSet.add(pago.nombre);
            }
        }

        // Llenar select de participantes
        [...nombresSet].sort().forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            selectFiltro.appendChild(option);
        });

        mostrarTabla(); // Mostrar todos inicialmente

    } catch (err) {
        console.error('❌ Error cargando pagos de mora:', err);
        alert('Error al cargar los datos.');
    }

    // Mostrar tabla
    function mostrarTabla(filtro = '') {
        tablaCuerpo.innerHTML = '';
        let totalRestante = 0;

        const datosFiltrados = filtro
            ? pagosConMora.filter(p => p.nombre === filtro)
            : pagosConMora;

        if (datosFiltrados.length === 0) {
            const row = tablaCuerpo.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No se encontraron moras para el participante.';
            cell.style.textAlign = 'center';
            totalTexto.textContent = '$ 0';
            return;
        }

        datosFiltrados.forEach(pago => {
            const row = tablaCuerpo.insertRow();
            row.insertCell().textContent = pago.nombre;
            row.insertCell().textContent = formatearFecha(pago.fecha_pago);
            row.insertCell().textContent = formatearFecha(pago.fecha_limite_pago);
            row.insertCell().textContent = `$${pago.valor.toLocaleString('es-CO')}`;
            row.insertCell().textContent = pago.mes;
            row.insertCell().textContent = `${pago.diasMora} días`;

            const btn = document.createElement('button');
            btn.classList.add('btn-pagar');
            btn.textContent = 'Pagar';
            btn.addEventListener('click', () => {
                const pagoSeleccionado = {
                    id: pago.id,
                    nombre: pago.nombre,
                    fecha_pago: pago.fecha_pago,
                    fecha_limite_pago: pago.fecha_limite_pago,
                    id_fondo: pago.id_fondo
                };

                localStorage.setItem('tipoMora', tipoMora);
                localStorage.setItem('pagoAhorroMora', JSON.stringify(pagoSeleccionado));
                localStorage.removeItem('idPagoMoraAhorroEditar');
                window.location.href = '/Moras/pagos_moras_ahorros/pagos_moras_ahorros.html';
            });

            const cell = row.insertCell();
            cell.appendChild(btn);

            totalRestante += pago.restante;
        });

        totalTexto.textContent = `$ ${totalRestante.toLocaleString('es-CO')}`;
    }

    // Evento para filtrar por participante
    btnConsultar.addEventListener('click', () => {
        const filtro = selectFiltro.value;
        mostrarTabla(filtro);
    });
});

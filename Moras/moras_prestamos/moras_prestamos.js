document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnGestionPagosMoras = document.getElementById('btnGestionPagosMoras');
    const btnAhorros = document.getElementById('btnAhorros');
    const tablaCuerpo = document.querySelector('#tablaPagosCuerpo');
    const selectFiltro = document.getElementById('filtroParticipante');
    const btnConsultar = document.querySelector('.consultar');
    const totalTexto = document.getElementById('totalPrestado');
    const tipoMora = 'prestamos';
    let pagosConMora = [];

    document.getElementById('btnAhorros').addEventListener('click', () => {
        window.location.href = '/Moras/moras_ahorros/moras_ahorros.html';
    });

    document.getElementById('btnGestionPagosMoras').addEventListener('click', () => {
        window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';
    });

    // Función para formatear fechas
    function formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    try {
        const res = await fetch('http://localhost:3000/api/pagos-prestamos');
        const pagos = await res.json();

        const nombresSet = new Set();

        for (const pago of pagos) {
            const fPago = new Date(pago.fpago);
            const fLimite = new Date(pago.flpago);
            const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));

            if (diasMora > 0) {
                const moraTotal = diasMora * 1000;

                const abonoRes = await fetch(`http://localhost:3000/api/pagos-mora-prestamos/abonados/${pago.id}`);
                const { total_abonado } = await abonoRes.json();
                const abonado = total_abonado ?? 0;
                const restante = moraTotal - abonado;

                if (restante > 0) {
                    pagosConMora.push({
                        ...pago,
                        diasMora,
                        abonado,
                        restante,
                        moraTotal
                    });
                    nombresSet.add(pago.solicitante);
                }
            }
        }

        // Llenar el filtro de solicitantes
        [...nombresSet].sort().forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            selectFiltro.appendChild(option);
        });

        mostrarTabla(); // Mostrar todos inicialmente

    } catch (err) {
        console.error('Error cargando pagos:', err);
        alert('Error al cargar los pagos de préstamos.');
    }

    // Mostrar tabla con datos filtrados
    function mostrarTabla(filtro = '') {
        tablaCuerpo.innerHTML = '';
        let totalRestante = 0;

        const datosFiltrados = filtro
            ? pagosConMora.filter(p => p.solicitante === filtro)
            : pagosConMora;

        datosFiltrados.forEach(pago => {
            const row = tablaCuerpo.insertRow();
            row.insertCell().textContent = pago.solicitante;
            row.insertCell().textContent = formatearFecha(pago.fpago);
            row.insertCell().textContent = formatearFecha(pago.flpago);
            row.insertCell().textContent = `$${pago.vpago.toLocaleString('es-CO')}`;
            row.insertCell().textContent = pago.nCuotas || '1';
            row.insertCell().textContent = pago.diasMora;

            const btn = document.createElement('button');
            btn.classList.add('btn-pagar');
            btn.textContent = 'Pagar';
            btn.addEventListener('click', () => {
                localStorage.setItem('tipoMora', tipoMora);
                localStorage.setItem('pagoPrestamoMora', JSON.stringify(pago));
                window.location.href = '/Moras/pagos_moras_prestamos/pagos_moras_prestamos.html';
            });

            const cell = row.insertCell();
            cell.appendChild(btn);

            totalRestante += pago.restante;
        });

        totalTexto.textContent = `$ ${totalRestante.toLocaleString('es-CO')}`;
    }

    // Evento para filtrar por solicitante
    btnConsultar.addEventListener('click', () => {
        const filtro = selectFiltro.value;
        mostrarTabla(filtro);
    });
});

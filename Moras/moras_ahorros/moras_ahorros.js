document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder.');
        window.location.href = '/Login/login.html';
        return;
    }

    const btnPrestamos = document.getElementById('btnPrestamos');
    const btnGestionPagosMoras = document.getElementById('btnGestionPagosMoras');
    const filtroParticipante = document.getElementById('filtroParticipante');
    const tablaPagosCuerpo = document.getElementById('tablaPagosCuerpo');
    const totalMora = document.getElementById('totalMora');
    const btnConsultar = document.querySelector('.consultar');
    const btnPagarMoras = document.getElementById('pagarMoras');

    // Cerrar sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', function (event) {
        e.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

    // Funcion para ir a pestaña prestamos
    btnPrestamos.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Moras/moras_prestamos/moras_prestamos.html';
    });

    // Funcion para ir a pestaña gestion pagos de moras
    btnGestionPagosMoras.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Moras/gestion_pagos_moras/gestion_pagos_moras.html';
    });

    // Ir a Pagar moras
    document.getElementById('pagarMoras').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/Moras/pagos_moras.html';
    })


    // Cargar participantes con mora
    try {
        const fondoRes = await fetch('http://localhost:3000/api/fondos/actual');
        const fondoActual = await fondoRes.json();

        const participantesRes = await fetch('http://localhost:3000/api/participantes');
        const participantes = await participantesRes.json();

        const usuarios = participantes.filter(p =>
            p.rol === 'Usuario' && p.fondo === fondoActual.nombre
        );

        for (const usuario of usuarios) {
            const pagosRes = await fetch(`http://localhost:3000/api/pagos-ahorros/por-nombre/${encodeURIComponent(usuario.nombre)}`);
            const pagos = await pagosRes.json();

            const tieneMora = pagos.some(p => {
                const fPago = new Date(p.fecha_pago);
                const fLimite = new Date(p.fecha_limite_pago);
                return (fPago - fLimite) / (1000 * 60 * 60 * 24) > 0;
            });

            if (tieneMora) {
                const option = document.createElement('option');
                option.value = usuario.nombre;
                option.textContent = usuario.nombre;
                filtroParticipante.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error al cargar participantes con mora:', error);
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

    // Consultar pagos con mora
    btnConsultar.addEventListener('click', async () => {
        const nombre = filtroParticipante.value;
        if (!nombre) {
            alert('Selecciona un participante.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/pagos-ahorros/por-nombre/${encodeURIComponent(nombre)}`);
            const pagos = await res.json();

            tablaPagosCuerpo.innerHTML = '';
            let total = 0;

            const pagosConMora = pagos.filter(p => {
                const fPago = new Date(p.fecha_pago);
                const fLimite = new Date(p.fecha_limite_pago);
                return (fPago - fLimite) / (1000 * 60 * 60 * 24) > 0;
            });

            if (pagosConMora.length === 0) {
                const row = tablaPagosCuerpo.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6;
                cell.textContent = 'Este participante no tiene pagos con mora.';
                cell.style.textAlign = 'center';
                totalMora.textContent = '$ 0';
                return;
            }

            pagosConMora.forEach(p => {
                const row = tablaPagosCuerpo.insertRow();
                row.insertCell().textContent = p.nombre;
                row.insertCell().textContent = `$ ${parseFloat(p.valor).toLocaleString('es-CO')}`;
                row.insertCell().textContent = formatearFecha(p.fecha_pago);
                row.insertCell().textContent = formatearFecha(p.fecha_limite_pago);
                row.insertCell().textContent = p.mes;

                const fPago = new Date(p.fecha_pago);
                const fLimite = new Date(p.fecha_limite_pago);
                const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));

                row.insertCell().textContent = `${diasMora} días`;
                total += diasMora * 1000;
            });

            totalMora.textContent = `$ ${total.toLocaleString('es-CO')}`;
        } catch (error) {
            console.error('Error al consultar pagos con mora:', error);
        }
    });
});

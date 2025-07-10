document.addEventListener('DOMContentLoaded', async function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));
    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    const titulo = document.getElementById('titulo_pagosMoras');
    const btnAtras = document.getElementById('btnAtras');
    const participanteSelect = document.getElementById('participante');
    const fechaPagoInput = document.getElementById('fechaPago');
    const conceptoInput = document.getElementById('conceptoMora');
    const detalleSelect = document.getElementById('detalleMora');
    const valorInput = document.getElementById('valorPago');
    const btnAgregar = document.getElementById('btnAgregarPagomora');
    const resumenMora = document.getElementById('resumenMora');

    titulo.textContent = 'Agregar Nuevo pago de Mora - Ahorros';

    btnAtras.addEventListener('click', function () {
        window.location.href = '/Moras/moras_ahorros/moras_ahorros.html';
    });

    // Obtener pagos de ahorros
    let pagos = [];
    try {
        const res = await fetch('http://localhost:3000/api/pagos-ahorros');
        pagos = await res.json();
    } catch (error) {
        console.error('Error al cargar pagos de ahorros:', error);
    }

    // Filtrar pagos con mora
    const participantesConMora = pagos.filter(p => {
        const fPago = new Date(p.fecha_pago);
        const fLimite = new Date(p.fecha_limite_pago);
        return (fPago - fLimite) / (1000 * 60 * 60 * 24) > 0;
    });

    const nombresUnicos = [...new Set(participantesConMora.map(p => p.nombre))];
    nombresUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        participanteSelect.appendChild(option);
    });

    participanteSelect.addEventListener('change', async () => {
        const nombre = participanteSelect.value;
        detalleSelect.innerHTML = '';
        conceptoInput.value = 'Pago de Ahorros';
        valorInput.value = '';
        resumenMora.innerHTML = '';

        const pagosMora = participantesConMora.filter(p => p.nombre === nombre);
        let totalPendiente = 0;

        for (const pago of pagosMora) {
            const fPago = new Date(pago.fecha_pago);
            const fLimite = new Date(pago.fecha_limite_pago);
            const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));
            if (diasMora <= 0) continue;

            const moraTotal = diasMora * 1000;
            const abonoRes = await fetch(`http://localhost:3000/api/pagos-mora-ahorros/abonados/${pago.id}`);
            const { total_abonado } = await abonoRes.json();
            const abono = total_abonado || 0;
            const moraRestante = moraTotal - abono;

            if (moraRestante > 0) {
                totalPendiente += moraRestante;
                const fechaFormateada = `${fPago.getDate()}/${fPago.getMonth() + 1}/${fPago.getFullYear()}`;
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    diasMora,
                    fecha: pago.fecha_pago,
                    descripcion: `Mora de ${diasMora} días del ${fechaFormateada}`,
                    id: pago.id,
                    valorRestante: moraRestante,
                    valorTotal: moraTotal
                });
                option.textContent = `Mora de ${diasMora} días del ${fechaFormateada} - $${moraRestante.toLocaleString('es-CO')}`;
                detalleSelect.appendChild(option);
            }
        }

        document.getElementById('totalMora').textContent = `$ ${totalPendiente.toLocaleString('es-CO')}`;

        if (detalleSelect.options.length > 0) {
            detalleSelect.selectedIndex = 0;
            const data = JSON.parse(detalleSelect.value);
            valorInput.value = data.valorRestante;

            resumenMora.innerHTML = `
                <span class="mora-dias">Mora: ${data.diasMora} día${data.diasMora > 1 ? 's' : ''}</span>
                <span class="mora-abono">Abonado: $${(data.valorTotal - data.valorRestante).toLocaleString('es-CO')}</span>
                <span class="mora-restante">Restante: $${data.valorRestante.toLocaleString('es-CO')}</span>
            `;
        }
    });

    detalleSelect.addEventListener('change', () => {
        const valorObj = JSON.parse(detalleSelect.value);
        valorInput.value = valorObj.valorRestante;

        resumenMora.innerHTML = `
            <span class="mora-dias">Mora: ${valorObj.diasMora} día${valorObj.diasMora > 1 ? 's' : ''}</span>
            <span class="mora-abono">Abonado: $${(valorObj.valorTotal - valorObj.valorRestante).toLocaleString('es-CO')}</span>
            <span class="mora-restante">Restante: $${valorObj.valorRestante.toLocaleString('es-CO')}</span>
        `;
    });

    btnAgregar.addEventListener('click', async () => {
        const nombre = participanteSelect.value;
        const fecha_pago = fechaPagoInput.value;
        const concepto = conceptoInput.value;
        const detalleObj = JSON.parse(detalleSelect.value);
        const detalle = detalleObj.descripcion;
        const valor = parseFloat(valorInput.value);
        const id_pago_ahorro = detalleObj.id;

        if (!nombre || !fecha_pago || !concepto || !detalle || !valor || !id_pago_ahorro) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/pagos-mora-ahorros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro })
            });

            if (!res.ok) throw new Error('Error en la petición');

            alert('Pago de mora registrado exitosamente.');
            window.location.href = '/Moras/moras_ahorros/moras_ahorros.html';
        } catch (err) {
            console.error('Error al guardar pago mora:', err);
            alert('Error al guardar el pago de mora.');
        }
    });
});

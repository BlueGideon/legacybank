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

    // Cambiar título
    titulo.textContent = 'Agregar Nuevo pago de Mora - Ahorros';

    // Volver atrás
    btnAtras.addEventListener('click', function () {
        window.location.href = '/Moras/moras_ahorros/moras_ahorros.html';
    });

    // Obtener todos los pagos de ahorros
    let pagos = [];
    try {
        const res = await fetch('http://localhost:3000/api/pagos-ahorros');
        pagos = await res.json();
    } catch (error) {
        console.error('Error al cargar pagos de ahorros:', error);
    }

    // Filtrar pagos con mora (días > 0)
    const participantesConMora = pagos.filter(p => {
        const fPago = new Date(p.fecha_pago);
        const fLimite = new Date(p.fecha_limite_pago);
        return (fPago - fLimite) / (1000 * 60 * 60 * 24) > 0;
    });

    // Cargar nombres únicos
    const nombresUnicos = [...new Set(participantesConMora.map(p => p.nombre))];
    nombresUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        participanteSelect.appendChild(option);
    });

    // Cuando selecciona participante
    participanteSelect.addEventListener('change', () => {
        const nombre = participanteSelect.value;

        const pagosMora = participantesConMora.filter(p => p.nombre === nombre);
        detalleSelect.innerHTML = '';
        conceptoInput.value = 'Pago de Ahorros';

        pagosMora.forEach(pago => {
            const fPago = new Date(pago.fecha_pago);
            const fLimite = new Date(pago.fecha_limite_pago);
            const diasMora = Math.max(0, Math.ceil((fPago - fLimite) / (1000 * 60 * 60 * 24)));

            if (diasMora > 0) {
                const descripcion = `Mora de ${diasMora} días del ${fPago.getDate()}/${fPago.getMonth() + 1}/${fPago.getFullYear()}`;
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    diasMora,
                    fecha: pago.fecha_pago,
                    descripcion
                });
                option.textContent = descripcion;
                detalleSelect.appendChild(option);
            }
        });

        // Autoseleccionar primera opción y calcular valor
        if (detalleSelect.options.length > 0) {
            detalleSelect.selectedIndex = 0;
            const valorObj = JSON.parse(detalleSelect.value);
            valorInput.value = valorObj.diasMora * 1000;
        }
    });

    // Cambiar valor al seleccionar otra mora
    detalleSelect.addEventListener('change', () => {
        const valorObj = JSON.parse(detalleSelect.value);
        valorInput.value = valorObj.diasMora * 1000;
    });

    // Guardar el pago de mora
    btnAgregar.addEventListener('click', async () => {
        const nombre = participanteSelect.value;
        const fecha_pago = fechaPagoInput.value;
        const concepto = conceptoInput.value;
        const detalleObj = JSON.parse(detalleSelect.value);
        const detalle = detalleObj.descripcion;
        const valor = detalleObj.diasMora * 1000;

        if (!nombre || !fecha_pago || !concepto || !detalle || !valor) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/pagos-mora-ahorros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, fecha_pago, concepto, detalle, valor })
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

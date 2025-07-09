document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCrearFondo = document.getElementById('btnCrearFondo');

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    const btnAhorros = document.getElementById('btnAhorros');
    const btnParticipantes = document.getElementById('btnParticipantes');
    const btnIngresosGastos = document.getElementById('btnIngresosGastos');

    const btnGestionFondos = document.getElementById('btnGestionFondos');

    // Funcion para cerrar sesion
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Funcion para ir a pestaña ahorros
    btnAhorros.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });

    // Funcion para ir a pestaña participantes
    btnParticipantes.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Participantes/informes_participantes.html';
    });

    // Funcion para ir a pestaña ingresos y gastos
    btnIngresosGastos.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/IngresosGastos/informes_ingresosgastos.html';
    });

    const filtroTipo = document.getElementById('filtroTipoPrestamo');
    const filtroParticipante = document.getElementById('filtroParticipante');
    const filtroAno = document.getElementById('filtroAno');
    const filtroMes = document.getElementById('filtroMes');
    const tablaEncabezado = document.getElementById('tablaEncabezado');
    const tablaCuerpo = document.getElementById('tablaPagosCuerpo');
    const totalPrestado = document.getElementById('totalPrestado');
    const btnGenerar = document.querySelector('.generar-informe');

    let datosPrestamos = JSON.parse(localStorage.getItem('prestamosCreados')) || [];
    let datosPagos = JSON.parse(localStorage.getItem('pagosPrestamos')) || [];

    filtroTipo.addEventListener('change', () => {
        filtroParticipante.innerHTML = `<option disabled selected>Selecciona el participante/solicitante</option>`;
        filtroAno.innerHTML = `<option disabled selected>Selecciona el año</option>`;
        filtroMes.innerHTML = `<option disabled selected>Selecciona el mes</option>`;

        const tipo = filtroTipo.value;

        // Obtener datos según el tipo
        const datos = tipo === 'Préstamos'
            ? JSON.parse(localStorage.getItem('prestamosAgregados')) || []
            : JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];

        // Extraer nombres únicos correctamente
        const nombres = [...new Set(datos.map(d => tipo === 'Préstamos' ? d.nombre : d.solicitante))];

        nombres.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            filtroParticipante.appendChild(option);
        });
    });

    filtroParticipante.addEventListener('change', () => {
        filtroAno.innerHTML = `<option disabled selected>Selecciona el año</option>`;
        filtroMes.innerHTML = `<option disabled selected>Selecciona el mes</option>`;

        const tipo = filtroTipo.value;
        const participante = filtroParticipante.value;

        const datos = tipo === 'Préstamos'
            ? JSON.parse(localStorage.getItem('prestamosAgregados')) || []
            : JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];

        const datosFiltrados = datos.filter(d =>
            (tipo === 'Préstamos' ? d.nombre : d.solicitante) === participante
        );

        const anos = new Set();
        const meses = new Set();

        datosFiltrados.forEach(d => {
            const fecha = new Date(tipo === 'Préstamos' ? d.fprestamo : d.fpago);
            if (!isNaN(fecha)) {
                anos.add(fecha.getFullYear());
                meses.add(fecha.getMonth() + 1);
            }
        });

        [...anos].sort().forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAno.appendChild(option);
        });

        const nombresMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        [...meses].sort((a, b) => a - b).forEach(mes => {
            const option = document.createElement('option');
            option.value = mes;
            option.textContent = nombresMeses[mes - 1];
            filtroMes.appendChild(option);
        });
    });


    btnGenerar.addEventListener('click', () => {
        const tipo = filtroTipo.value;
        const participante = filtroParticipante.value;
        const ano = parseInt(filtroAno.value);
        const mes = parseInt(filtroMes.value);

        if (!tipo || !participante) {
            alert('Selecciona tipo y participante/solicitante');
            return;
        }

        const datos = tipo === 'Préstamos'
            ? JSON.parse(localStorage.getItem('prestamosAgregados')) || []
            : JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];

        const datosFiltrados = datos.filter(d => {
            const nombre = tipo === 'Préstamos' ? d.nombre : d.solicitante;
            const fecha = new Date(tipo === 'Préstamos' ? d.fprestamo : d.fpago);
            return nombre === participante &&
                (!isNaN(ano) ? fecha.getFullYear() === ano : true) &&
                (!isNaN(mes) ? fecha.getMonth() + 1 === mes : true);
        });

        // Limpiar encabezado y cuerpo
        tablaEncabezado.innerHTML = '';
        tablaCuerpo.innerHTML = '';
        totalPrestado.textContent = '$ 0';

        if (tipo === 'Préstamos') {
            tablaEncabezado.innerHTML = `
                <th>F. Préstamo</th>
                <th>Asociado A</th>
                <th>Valor Préstamo</th>
                <th>Tasa Interés</th>
                <th>N° Cuota(s)</th>
                <th>V. Interés</th>
                <th>V. Cuotas</th>
                <th>Ganancia</th>
                <th>V. A Pagar</th>
                <th>Estado</th>
            `;

            let total = 0;

            datosFiltrados.forEach(p => {
                const row = tablaCuerpo.insertRow();
                row.insertCell().textContent = p.fprestamo;
                row.insertCell().textContent = p.nombre;
                row.insertCell().textContent = `$${parseFloat(p.vprestamo || 0).toLocaleString()}`;
                row.insertCell().textContent = p.selecciontasa;
                row.insertCell().textContent = p.ncuotas || 0;
                row.insertCell().textContent = `$${parseFloat(p.valorInteres).toLocaleString()}`;
                row.insertCell().textContent = `$${parseFloat(p.valorCuota).toLocaleString()}`;
                row.insertCell().textContent = `$${parseFloat(p.ganancia || 0).toLocaleString()}`;
                row.insertCell().textContent = `$${parseFloat(p.valorTotalPagar).toLocaleString()}`;

                // Calcular cuánto ha pagado el solicitante
                const pagos = JSON.parse(localStorage.getItem('pagosprestamosAgregados')) || [];
                const pagosSolicitante = pagos
                    .filter(pp => pp.solicitante === p.solicitante)
                    .reduce((sum, pp) => sum + parseFloat(pp.vpago || 0), 0);

                const restante = parseFloat(p.valorTotalPagar) - pagosSolicitante;
                const estado = restante <= 0 ? '✅ Cancelado' : '🟡 Vigente';

                row.insertCell().textContent = estado;

                total += parseFloat(p.vprestamo || 0);
            });


            totalPrestado.textContent = `$ ${total.toLocaleString('es-CO')}`;

        } else if (tipo === 'Pagos de Préstamos') {
            tablaEncabezado.innerHTML = `
                <th>Solicitante</th>
                <th>F. Pago</th>
                <th>F. Límite Pago</th>
                <th>V. Pago</th>
                <th>N° Cuota</th>
                <th>Días de Mora</th>
                <th>Restante a Pagar</th>
            `;

            let total = 0;

            // Ordenar por fecha de pago descendente
            datosFiltrados.sort((a, b) => new Date(b.fpago) - new Date(a.fpago));

            datosFiltrados.forEach(p => {
                const row = tablaCuerpo.insertRow();
                row.insertCell().textContent = p.solicitante;
                row.insertCell().textContent = p.fpago;
                row.insertCell().textContent = p.flpago;
                row.insertCell().textContent = `$${parseFloat(p.vpago).toLocaleString()}`;
                row.insertCell().textContent = p.nCuotas;

                const fechaPago = new Date(p.fpago);
                const fechaLimite = new Date(p.flpago); // usando flpago como fecha límite
                const restante = parseFloat(p.restante);

                let moraText = "No disponible";
                if (!isNaN(fechaPago) && !isNaN(fechaLimite)) {
                    const diasMora = Math.ceil((fechaPago - fechaLimite) / (1000 * 60 * 60 * 24));
                    moraText = diasMora < 0
                        ? `✅ ${Math.abs(diasMora)} días antes`
                        : diasMora === 0
                            ? `🟡 mismo día`
                            : `⚠️ ${diasMora} días tarde`;
                }

                row.insertCell().textContent = moraText;                
                row.insertCell().textContent = isNaN(restante) ? 'No calculado' : `$${restante.toLocaleString('es-CO')}`;

                total += parseFloat(p.vpago);
            });

            totalPrestado.textContent = `$ ${total.toLocaleString('es-CO')}`;
        }
    });

    const btnDescargarInforme = document.getElementById('descargarInforme');

    btnDescargarInforme.addEventListener('click', () => {
        const tabla = document.querySelector('.tabla'); // La tabla del informe

        // Convertir la tabla a una hoja de cálculo
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(tabla);
        XLSX.utils.book_append_sheet(wb, ws, 'Informe');

        // Descargar el archivo Excel
        XLSX.writeFile(wb, 'Informe_Prestamos.xlsx');
    });
});
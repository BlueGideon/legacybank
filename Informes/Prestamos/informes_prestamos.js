import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function () {
  const admin = JSON.parse(localStorage.getItem('adminActivo'));
  if (!admin) {
    alert('Debes iniciar sesión');
    window.location.href = '/Login/login.html';
    return;
  }

  const filtroTipo = document.getElementById('filtroTipoPrestamo');
  const filtroParticipante = document.getElementById('filtroParticipante');
  const filtroAno = document.getElementById('filtroAno');
  const filtroMes = document.getElementById('filtroMes');
  const tablaEncabezado = document.getElementById('tablaEncabezado');
  const tablaCuerpo = document.getElementById('tablaPagosCuerpo');
  const totalPrestado = document.getElementById('totalPrestado');
  const btnGenerar = document.querySelector('.generar-informe');
  const btnDescargar = document.getElementById('descargarInforme');

  // Cerrar sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('adminActivo');
        window.location.href = '/Login/login.html';
    });

  // Funcion para ir a pestaña participantes
    btnParticipantes.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Participantes/informes_participantes.html';
    });

    // Funcion para ir a pestaña ahorros
    btnAhorros.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/Ahorros/informes_ahorros.html';
    });

    // Funcion para ir a pestaña ingresos y gastos
    btnIngresosGastos.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Informes/IngresosGastos/informes_ingresosgastos.html';
    });

  (async function cargarFiltros() {
    const prestamos = await fetch(`${API_URL}/api/prestamos`).then(r => r.json());
    const pagos = await fetch(`${API_URL}/api/pagos-prestamos`).then(r => r.json());

    filtroParticipante.innerHTML = '<option disabled selected>Selecciona participante/solicitante</option>';
    filtroAno.innerHTML = '<option disabled selected>Selecciona el año</option>';
    filtroMes.innerHTML = '<option disabled selected>Selecciona el mes</option>';

    filtroTipo.addEventListener('change', actualizarParticipantes);

    function actualizarParticipantes() {
      filtroParticipante.innerHTML = '<option disabled selected>Selecciona participante/solicitante</option>';
      const tipo = filtroTipo.value;
      const setNoms = new Set(tipo === 'Préstamos' ? prestamos.map(p => p.nombre) : pagos.map(p => p.solicitante));
      for (let nom of [...setNoms].sort()) {
        const opt = document.createElement('option');
        opt.value = nom;
        opt.textContent = nom;
        filtroParticipante.appendChild(opt);
      }
      filtroAno.innerHTML = '<option disabled selected>Selecciona el año</option>';
      filtroMes.innerHTML = '<option disabled selected>Selecciona el mes</option>';
    }
  })();

  filtroParticipante.addEventListener('change', async () => {
    filtroAno.innerHTML = '<option disabled selected>Selecciona el año</option>';
    filtroMes.innerHTML = '<option disabled selected>Selecciona el mes</option>';
    const tipo = filtroTipo.value;
    const part = filtroParticipante.value;
    let datos = tipo === 'Préstamos'
      ? await fetch(`${API_URL}/api/prestamos`).then(r => r.json())
      : await fetch(`${API_URL}/api/pagos-prestamos`).then(r => r.json());

    datos = datos.filter(d => (tipo === 'Préstamos' ? d.nombre : d.solicitante) === part);
    const anos = new Set(), meses = new Set();
    datos.forEach(d => {
      const fecha = new Date(tipo === 'Préstamos' ? d.fprestamo : d.fpago);
      if (!isNaN(fecha)) {
        anos.add(fecha.getFullYear());
        meses.add(fecha.getMonth() + 1);
      }
    });
    for (let año of [...anos].sort())
      filtroAno.appendChild(new Option(año, año));
    const mesesN = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    for (let m of [...meses].sort())
      filtroMes.appendChild(new Option(mesesN[m - 1], m));
  });

  btnGenerar.addEventListener('click', async () => {
    const tipo = filtroTipo.value, part = filtroParticipante.value;
    const ano = filtroAno.value ? parseInt(filtroAno.value) : null;
    const mes = filtroMes.value ? parseInt(filtroMes.value) : null;
    if (!tipo || !part) {
      alert('Selecciona tipo y participante/solicitante');
      return;
    }

    const qs = new URLSearchParams({ participante: part });
    if (ano) qs.set('ano', ano);
    if (mes) qs.set('mes', mes);
    const endpoint = tipo === 'Préstamos' ? 'prestamos' : 'pagos';
    const datos = await fetch(`${API_URL}/api/informes-prestamos/${endpoint}?${qs}`).then(r => r.json());

    tablaEncabezado.innerHTML = '';
    tablaCuerpo.innerHTML = '';
    totalPrestado.textContent = '$ 0';

    if (tipo === 'Préstamos') {
      tablaEncabezado.innerHTML = `
        <th>F. Préstamo</th><th>Asociado</th><th>V. Préstamo</th>
        <th>Tasa</th><th>N° Cuotas</th><th>V. Interés</th>
        <th>V. Cuotas</th><th>Ganancia</th><th>V. Pagar</th><th>Estado</th>`;
      const pagosTodos = await fetch(`${API_URL}/api/pagos-prestamos`).then(r => r.json());
      let total = 0;

      datos.sort((a, b) => new Date(b.fprestamo) - new Date(a.fprestamo));
      datos.forEach(p => {
        const vp = parseFloat(p.vprestamo), tasa = parseFloat(p.selecciontasa) / 100;
        const n = parseInt(p.ncuotas);
        const vi = vp * tasa;
        const vcuota = (vp / n) + vi;
        const gan = vi * n;
        const tota = vcuota * n;

        const pagados = pagosTodos
          .filter(pp => pp.solicitante === p.solicitante)
          .reduce((s, pp) => s + parseFloat(pp.vpago), 0);
        const restante = tota - pagados;
        const estado = restante <= 0 ? '✅ Cancelado' : '🟡 Vigente';

        const row = tablaCuerpo.insertRow();
        row.insertCell().textContent = p.fprestamo.slice(0, 10);
        row.insertCell().textContent = p.nombre;
        row.insertCell().textContent = `$${vp.toLocaleString('es-CO')}`;
        row.insertCell().textContent = p.selecciontasa;
        row.insertCell().textContent = n;
        row.insertCell().textContent = `$${vi.toLocaleString('es-CO')}`;
        row.insertCell().textContent = `$${vcuota.toLocaleString('es-CO')}`;
        row.insertCell().textContent = `$${gan.toLocaleString('es-CO')}`;
        row.insertCell().textContent = `$${tota.toLocaleString('es-CO')}`;
        row.insertCell().textContent = estado;

        total += vp;
      });

      totalPrestado.textContent = `$ ${total.toLocaleString('es-CO')}`;

    } else {
  tablaEncabezado.innerHTML = `
    <th>Solicitante</th><th>F. Pago</th><th>F. Límite</th>
    <th>V. Pago</th><th>N° Cuota</th><th>Días Mora</th><th>Restante</th>`;

  const prestamos = await fetch(`${API_URL}/api/prestamos`).then(r => r.json());

  // ✅ Agrupar pagos por idPrestamo
  const pagosAgrupados = {};
  datos.forEach(p => {
    if (!pagosAgrupados[p.idPrestamo]) pagosAgrupados[p.idPrestamo] = [];
    pagosAgrupados[p.idPrestamo].push(p);
  });

  let total = 0;

  for (let idPrestamo in pagosAgrupados) {
  const pagosDelPrestamo = pagosAgrupados[idPrestamo];
  const prestamo = prestamos.find(p => p.id === parseInt(idPrestamo));
  if (!prestamo) continue;

  const totalPrestamo = parseFloat(prestamo.valorTotalPagar);

  // ✅ Ordenar por fecha ASCENDENTE para calcular acumulado correctamente
  const pagosAsc = pagosDelPrestamo.sort((a, b) => new Date(a.fpago) - new Date(b.fpago));
  
  // Recorremos pagos acumulando para calcular el restante
  let acumulado = 0;
  const pagosConRestante = pagosAsc.map(p => {
    const vp = parseFloat(p.vpago);
    acumulado += vp;
    return {
      ...p,
      restante: Math.max(totalPrestamo - acumulado, 0)
    };
  });

  // ✅ Mostrar los pagos de forma DESCENDENTE pero con restante correcto
  const pagosParaMostrar = pagosConRestante.sort((a, b) => new Date(b.fpago) - new Date(a.fpago));

  pagosParaMostrar.forEach(p => {
    let dias = 'No disponible';
    if (p.fpago && p.flpago) {
      const dF = new Date(p.fpago), dL = new Date(p.flpago);
      const dif = Math.floor((dF - dL) / (1000 * 60 * 60 * 24));
      dias = dif < 0 ? `✅ ${Math.abs(dif)} días antes` :
             dif === 0 ? `🟡 mismo día` :
             `⚠️ ${dif} días tarde`;
    }

    const row = tablaCuerpo.insertRow();
    row.insertCell().textContent = prestamo.solicitante;
    row.insertCell().textContent = p.fpago.slice(0, 10);
    row.insertCell().textContent = p.flpago ? p.flpago.slice(0, 10) : '';
    row.insertCell().textContent = `$${parseFloat(p.vpago).toLocaleString('es-CO')}`;
    row.insertCell().textContent = p.cuotaAPagar || '1';
    row.insertCell().textContent = dias;
    row.insertCell().textContent = `$${p.restante.toLocaleString('es-CO')}`;

    total += parseFloat(p.vpago);
  });
}


  totalPrestado.textContent = `$ ${total.toLocaleString('es-CO')}`;
}

  });

  btnDescargar.addEventListener('click', () => {
    const ws = XLSX.utils.table_to_sheet(document.querySelector('.tabla'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, 'Informe_Prestamos.xlsx');
  });
});

import { API_URL } from "/Login/config.js";

document.addEventListener('DOMContentLoaded', function () {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    async function iniciarDashboard() {
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        const mensajeBienvenida = document.getElementById('mensajeBienvenida');
        const usuario = JSON.parse(localStorage.getItem('adminActivo'));

        btnCerrarSesion.addEventListener('click', function (event) {
            event.preventDefault();
            localStorage.removeItem('adminActivo');
            window.location.href = '/Login/login.html';
        });

        // Mostrar mensaje de bienvenida
        mensajeBienvenida.textContent = usuario?.nombre
            ? `Bienvenido, ${usuario.nombre}`
            : 'Bienvenido, Administrador';

        try {
            // 1. Obtener fondo actual
const fondoActualRes = await fetch(`${API_URL}/api/fondos/actual`);
const fondoActual = await fondoActualRes.json();
const fondoNombre = fondoActual.nombre;
const fondoId = fondoActual.id; // ✅ Usar el ID
const btnLiquidaciones = document.getElementById('btnLiquidaciones');

// Funcion ir a liquidaciones
btnLiquidaciones.addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = '/Inicio/Liquidaciones/liquidacion.html';
});



// 2. Obtener participantes
const participantesRes = await fetch(`${API_URL}/api/participantes`);
const participantes = await participantesRes.json();

            // 3. Obtener datos de ingresos y egresos
const [
    pagosAhorrosRes,
    pagosPrestamosRes,
    prestamosRes,
    pagosMoraAhorrosRes,
    pagosMoraPrestamosRes,
    liquidacionesRes // ✅ Agregado
] = await Promise.all([
    fetch(`${API_URL}/api/pagos-ahorros`),
    fetch(`${API_URL}/api/pagos-prestamos`),
    fetch(`${API_URL}/api/prestamos`),
    fetch(`${API_URL}/api/pagos-mora-ahorros`),
    fetch(`${API_URL}/api/pagos-mora-prestamos`),
    fetch(`${API_URL}/api/liquidaciones?fondo_id=${fondoId}`) // ✅ Agregado
]);

let pagosAhorros = await pagosAhorrosRes.json();
let pagosPrestamos = await pagosPrestamosRes.json();
let prestamos = await prestamosRes.json();
let pagosMoraAhorros = await pagosMoraAhorrosRes.json();
let pagosMoraPrestamos = await pagosMoraPrestamosRes.json();
let liquidaciones = await liquidacionesRes.json();

// ✅ Filtrar datos por fondo actual
pagosAhorros = pagosAhorros.filter(p => p.fondo === fondoNombre);
pagosPrestamos = pagosPrestamos.filter(p => p.fondo === fondoNombre);
prestamos = prestamos.filter(p => p.fondo === fondoNombre);
pagosMoraAhorros = pagosMoraAhorros.filter(p => p.fondo === fondoNombre);
pagosMoraPrestamos = pagosMoraPrestamos.filter(p => p.fondo === fondoNombre);
liquidaciones = liquidaciones.filter(l => l.fondo_id === fondoId); // ✅

const retirados = liquidaciones
    .filter(l => l.motivo === "Retiro voluntario")
    .map(l => l.nombre);

// ✅ Participantes activos sin retirados
const participantesActivos = participantes.filter(p =>
    p.rol === 'Usuario' &&
    p.fondo_id === fondoId &&
    !retirados.includes(p.nombre)
).length;

document.getElementById('participantesActivos').textContent = participantesActivos;

// ✅ Calcular totales (restando también liquidaciones)
const totalAhorros = pagosAhorros.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
const totalPagosPrestamos = pagosPrestamos.reduce((sum, p) => sum + parseFloat(p.vpago || 0), 0);
const totalPagosMoraAhorros = pagosMoraAhorros.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
const totalPagosMoraPrestamos = pagosMoraPrestamos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
const totalPrestado = prestamos.reduce((sum, p) => sum + parseFloat(p.vprestamo || 0), 0);
const totalLiquidado = liquidaciones.reduce((sum, l) => sum + parseFloat(l.valor_liquidar || 0), 0);

const fondosDisponibles = totalAhorros + totalPagosPrestamos + totalPagosMoraAhorros + totalPagosMoraPrestamos - totalPrestado - totalLiquidado;

document.getElementById('fondosDisponibles').textContent = `$ ${fondosDisponibles.toLocaleString('es-CO')}`;


            // 5. Calcular préstamos activos
            let prestamosActivos = 0;
            for (let prestamo of prestamos) {
                const valorPrestamo = parseFloat(prestamo.vprestamo || 0);
                const tasa = parseFloat(prestamo.selecciontasa?.replace('%', '') || 0) / 100;
                const nCuotas = parseInt(prestamo.ncuotas || 1);
                const valorInteres = valorPrestamo * tasa;
                const valorCuota = (valorPrestamo / nCuotas) + valorInteres;
                const totalPagar = valorCuota * nCuotas;

                const pagado = pagosPrestamos
                    .filter(p => p.idPrestamo === prestamo.id) // ✅ usa idPrestamo (mejor que solicitante)
                    .reduce((sum, p) => sum + parseFloat(p.vpago || 0), 0);

                const saldo = totalPagar - pagado;
                if (saldo > 0) prestamosActivos++;
            }

            document.getElementById('prestamosActivos').textContent = prestamosActivos;

        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            document.getElementById('fondosDisponibles').textContent = '$ 0';
            document.getElementById('prestamosActivos').textContent = '0';
            document.getElementById('participantesActivos').textContent = '0';
        }
    }

    iniciarDashboard();
});

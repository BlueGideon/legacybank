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
            const fondoActualRes = await fetch('http://localhost:3000/api/fondos/actual');
            const fondoActual = await fondoActualRes.json();
            const fondoNombre = fondoActual.nombre;

            // 2. Obtener participantes
            const participantesRes = await fetch('http://localhost:3000/api/participantes');
            const participantes = await participantesRes.json();

            // 3. Participantes activos (usuarios con fondo actual)
            const participantesActivos = participantes.filter(p =>
                p.rol === 'Usuario' && p.fondo === fondoNombre
            ).length;

            document.getElementById('participantesActivos').textContent = participantesActivos;

            // 4. Obtener datos: pagos ahorros, pagos préstamos y préstamos
            const pagosAhorrosRes = await fetch('http://localhost:3000/api/pagos-ahorros');
            const pagosPrestamosRes = await fetch('http://localhost:3000/api/pagos-prestamos');
            const prestamosRes = await fetch('http://localhost:3000/api/prestamos');

            const pagosAhorros = await pagosAhorrosRes.json();
            const pagosPrestamos = await pagosPrestamosRes.json();
            const prestamos = await prestamosRes.json();

            // 5. Calcular fondos disponibles = ahorros + pagos préstamo - préstamos dados
            const totalAhorros = pagosAhorros.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
            const totalPagosPrestamos = pagosPrestamos.reduce((sum, p) => sum + parseFloat(p.vpago || 0), 0);
            const totalPrestado = prestamos.reduce((sum, p) => sum + parseFloat(p.vprestamo || 0), 0);

            const fondosDisponibles = totalAhorros + totalPagosPrestamos - totalPrestado;
            document.getElementById('fondosDisponibles').textContent = `$ ${fondosDisponibles.toLocaleString('es-CO')}`;

            // 6. Calcular préstamos activos (saldo > 0)
            let prestamosActivos = 0;

            for (let prestamo of prestamos) {
                const valorPrestamo = parseFloat(prestamo.vprestamo || 0);
                const tasa = parseFloat(prestamo.selecciontasa?.replace('%', '') || 0) / 100;
                const nCuotas = parseInt(prestamo.ncuotas || 1);
                const valorInteres = valorPrestamo * tasa;
                const valorCuota = (valorPrestamo / nCuotas) + valorInteres;
                const totalPagar = valorCuota * nCuotas;

                const pagado = pagosPrestamos
                    .filter(p => p.solicitante === prestamo.solicitante)
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

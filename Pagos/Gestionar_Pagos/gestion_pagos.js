import { API_URL } from "/Login/config.js";
document.addEventListener('DOMContentLoaded', function() {
    const admin = JSON.parse(localStorage.getItem('adminActivo'));

    if (!admin) {
        alert('Debes iniciar sesión para acceder a esta página.');
        window.location.href = '/Login/login.html';
        return;
    }

    // Si el admin está logueado, continúa con el resto de tu lógica...

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');

    const btnAnadirPago = document.getElementById('btnAnadirPago');

    const tablaPagosCuerpo = document.getElementById('tablaPagosCuerpo');

    const btnVolverAgregarPagos = document.getElementById('btnVolverAgregarPagos');

    // Funcion para cerrar sesión
    btnCerrarSesion.addEventListener('click', function(event) {
    event.preventDefault();

    // Elimina la sesión activa (ajusta el nombre si usas otro)
    localStorage.removeItem('adminActivo');

    // Redirige al login
    window.location.href = '/Login/login.html';
});


    // Funcion para añadir pago
    btnAnadirPago.addEventListener('click', function(event) {
        event.preventDefault();

        window.location.href = '/Pagos/Anadir_Pagos/anadir_pagos.html';
    });

    // Funcion para cargar y mostrar los pagos
    async function cargarPagos() {
    tablaPagosCuerpo.innerHTML = '';
    let total = 0;

    try {
        const res = await fetch(`${API_URL}/api/pagos-ahorros`);
        const pagos = await res.json();

        // Ordenar por fecha de pago descendente (más reciente primero)
        pagos.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

        if (!Array.isArray(pagos) || pagos.length === 0) {
            const row = tablaPagosCuerpo.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8;
            cell.textContent = 'No hay pagos agregados aún.';
            cell.style.textAlign = 'center';
            document.getElementById('totalAhorrado').textContent = '$ 0';
            return;
        }

        pagos.forEach((pago) => {
            const row = tablaPagosCuerpo.insertRow();

            row.insertCell().textContent = pago.nombre;
            row.insertCell().textContent = pago.puesto;
            row.insertCell().textContent = pago.valor;
            row.insertCell().textContent = formatearFecha(pago.fecha_pago);
            row.insertCell().textContent = formatearFecha(pago.fecha_limite_pago);
            row.insertCell().textContent = pago.mes;

            // Cálculo días de mora
            const fechaPago = new Date(pago.fecha_pago);
            const fechaLimite = new Date(pago.fecha_limite_pago);
            const diasDiferencia = Math.ceil((fechaPago - fechaLimite) / (1000 * 60 * 60 * 24));

            const celdaEstado = row.insertCell();
            celdaEstado.style.fontWeight = 'bold';

            if (diasDiferencia < 0) {
                celdaEstado.textContent = `✅ ${Math.abs(diasDiferencia)} días antes`;
                celdaEstado.style.color = '#0b0';
            } else if (diasDiferencia === 0) {
                celdaEstado.textContent = `🟡 mismo día`;
                celdaEstado.style.color = '#ff0';
            } else {
                celdaEstado.textContent = `⚠️ ${diasDiferencia} días tarde`;
                celdaEstado.style.color = '#f00';
            }

            // Acciones
            const accionesCell = row.insertCell();
            accionesCell.classList.add('acciones');

            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.classList.add('editar-btn');
            btnEditar.addEventListener('click', () => editarPago(pago.id));
            accionesCell.appendChild(btnEditar);

            // Botón Eliminar (por ahora sigue usando localStorage, lo migramos después)
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.classList.add('eliminar-btn');
            btnEliminar.addEventListener('click', () => eliminarPago(pago.id)); // Esto deberíamos actualizarlo luego también para borrar de MySQL
            accionesCell.appendChild(btnEliminar);

            total += parseFloat(pago.valor);
        });

        document.getElementById('totalAhorrado').textContent = `$ ${total.toLocaleString('es-CO')}`;

    } catch (error) {
        console.error('Error al cargar pagos:', error);
        tablaPagosCuerpo.innerHTML = '<tr><td colspan="8" style="text-align:center;">Error al cargar pagos</td></tr>';
        document.getElementById('totalAhorrado').textContent = '$ 0';
    }
}



    // Funciones para Editar y Eliminar (básicas, puedes expandirlas)
    function editarPago(id) {
        localStorage.setItem('pagoIdEdicion', id); // guardamos el ID real
        window.location.href = '/Pagos/Anadir_Pagos/anadir_pagos.html';
    }

    


    async function eliminarPago(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este pago?')) {
            try {
                const res = await fetch(`${API_URL}/api/pagos-ahorros/${id}`, {
                    method: 'DELETE'
                });

                const data = await res.json();

                if (!res.ok) {
                    alert('Error al eliminar el pago');
                    return;
                }

                alert(data.mensaje);
                cargarPagos();

            } catch (error) {
                console.error('Error al eliminar pago:', error);
                alert('Error al eliminar el pago.');
            }
        }
    }


    // Función para formatear fechas en formato dd/mm/yyyy
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}


    // Llama a la función para cargar los fondos cuando la página se carga
    cargarPagos();

    // Evento para el botón "Volver a agregar pagos"
    if (btnVolverAgregarPagos) {
        btnVolverAgregarPagos.addEventListener('click', function() {
            // Asegúrate de que esta ruta sea correcta para tu archivo crear_fondo.html
            window.location.href = '/Pagos/Anadir_Pagos/anadir_pagos.html';
        });
    }
});
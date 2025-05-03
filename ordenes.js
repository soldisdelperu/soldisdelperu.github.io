// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGIbNDO1ehar5clCUzg3VcirzMkvH7fn24AK3VGjQFu18f7owbt-8BD7pWkZWyiaUwcQ/exec';

// Variables globales
let datosUsuario = null;
let ordenActual = null;

// Función para cargar datos del usuario
function cargarDatosUsuario() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            window.top.location.href = 'index.html';
            return;
        }
        datosUsuario = JSON.parse(userData);
    } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
    }
}

// Función para mostrar mensajes de error en la UI
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;
    
    // Insertar al principio de la tabla
    const tableContainer = document.querySelector('.table-container');
    tableContainer.insertBefore(errorDiv, tableContainer.firstChild);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Función para cargar órdenes
async function cargarOrdenes() {
    try {
        const formData = new FormData();
        formData.append('action', 'getOrdenes');
        
        // Primera solicitud
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // Esperar un momento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Segunda solicitud para obtener datos
        const response = await fetch(`${SCRIPT_URL}?action=getOrdenes`);
        const result = await response.json();
        
        if (result.status === 'success') {
            let ordenes = result.data;
            if (datosUsuario.rol === 'Comprador') {
                ordenes = ordenes.filter(orden => orden.usuario === datosUsuario.usuario);
            }
            mostrarOrdenes(ordenes);
        } else {
            throw new Error(result.message || 'Error al cargar órdenes');
        }
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        mostrarError('Error al cargar órdenes: ' + error.message);
    }
}

// Función para mostrar órdenes en la tabla
function mostrarOrdenes(ordenes) {
    const tbody = document.querySelector('#ordenesTable tbody');
    tbody.innerHTML = '';
    
    ordenes.forEach(orden => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${orden.numero}</td>
            <td>${new Date(orden.fecha).toLocaleDateString()}</td>
            <td>${orden.cliente}</td>
            <td>${orden.unidad}</td>
            <td>${orden.departamento}</td>
            <td>${orden.prioridad}</td>
            <td>S/. ${orden.total.toFixed(2)}</td>
            <td><span class="estado-${orden.estado.toLowerCase()}">${orden.estado}</span></td>
            <td>
                <button onclick="verDetalle(${orden.numero})" class="btn-ver">Ver Detalle</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para ver detalle
async function verDetalle(numeroOrden) {
    try {
        const formData = new FormData();
        formData.append('action', 'getDetalleOrden');
        formData.append('numero', numeroOrden);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`${SCRIPT_URL}?action=getDetalleOrden&numero=${numeroOrden}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            ordenActual = result.data;
            mostrarModalDetalle(result.data);
        } else {
            throw new Error(result.message || 'Error al cargar detalle');
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        mostrarError('Error al cargar detalle: ' + error.message);
    }
}

// Función para mostrar el modal de detalle
function mostrarModalDetalle(data) {
    // Actualizamos el título del modal para incluir el número
    document.querySelector('.modal-header h2').textContent = `Detalle de Orden #${data.orden.numero}`;
    
    document.getElementById('detalleCliente').textContent = data.orden.cliente;
    document.getElementById('detalleUnidad').textContent = data.orden.unidad;
    document.getElementById('detalleDepartamento').textContent = data.orden.departamento;
    document.getElementById('detallePrioridad').textContent = data.orden.prioridad;
    
    const tbody = document.querySelector('#detalleTable tbody');
    tbody.innerHTML = '';
    
    data.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.categoria}</td>
            <td>${item.articulo}</td>
            <td>${item.cantidad}</td>
            <td>S/. ${item.precioUnitario.toFixed(2)}</td>
            <td>S/. ${item.precioTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('detalleSubtotal').textContent = `S/. ${data.orden.subtotal.toFixed(2)}`;
    document.getElementById('detalleIgv').textContent = `S/. ${data.orden.igv.toFixed(2)}`;
    document.getElementById('detalleTotal').textContent = `S/. ${data.orden.total.toFixed(2)}`;
    
    document.getElementById('detalleModal').style.display = 'block';

    // Agregar botones de aprobar/rechazar
    const botonesAprobacion = document.getElementById('botonesAprobacion');
    if (botonesAprobacion) {
        if (datosUsuario.rol === 'Aprobador' && 
            (data.orden.estado === 'Pendiente' || data.orden.estado === 'Rechazada')) {
            botonesAprobacion.innerHTML = `
                <button onclick="aprobarOrden()" class="btn-success">
                    <i class="fas fa-check"></i> Aprobar Orden
                </button>
                <button onclick="rechazarOrden()" class="btn-danger">
                    <i class="fas fa-times"></i> Rechazar Orden
                </button>
            `;
        } else {
            botonesAprobacion.innerHTML = '';
        }
    }
}

// Función para aprobar orden
async function aprobarOrden() {
    if (!ordenActual) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'aprobarOrden');
        formData.append('numero', ordenActual.orden.numero);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarOrdenes();
        
        document.getElementById('detalleModal').style.display = 'none';
        mostrarError('Orden aprobada exitosamente');
    } catch (error) {
        console.error('Error al aprobar orden:', error);
        mostrarError('Error al aprobar orden: ' + error.message);
    }
}

// Función para rechazar orden
async function rechazarOrden() {
    if (!ordenActual) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'rechazarOrden');
        formData.append('numero', ordenActual.orden.numero);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarOrdenes();
        
        document.getElementById('detalleModal').style.display = 'none';
        mostrarError('Orden rechazada');
    } catch (error) {
        console.error('Error al rechazar orden:', error);
        mostrarError('Error al rechazar orden: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosUsuario();
    await cargarOrdenes();
    
    // Botones de aprobar y rechazar
    document.getElementById('aprobarBtn')?.addEventListener('click', aprobarOrden);
    document.getElementById('rechazarBtn')?.addEventListener('click', rechazarOrden);
    
    // Cerrar modal - removemos los event listeners duplicados y usamos solo el onclick del HTML
    const modal = document.getElementById('detalleModal');
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Cerrar con el botón X en la esquina
    document.querySelector('.close')?.addEventListener('click', cerrarModal);
});

// Función para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('detalleModal');
    if (modal) {
        modal.style.display = 'none';
    }
} 

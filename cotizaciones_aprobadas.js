// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcPl6mNqcFIGc2iBPCBG21-Fan-xgUghNxMroMxhN5C5A-9nGDKoFe_WmCMO_Rlp-kgw/exec';

// Variables globales
let datosUsuario = null;
let ordenActual = null;
let notificacionMostrada = false;

// Estados de entrega posibles
const ESTADOS_ENTREGA = [
    'Pendiente',
    'Procesada',
    'Despachada',
    'En Ruta',
    'En Punto de Destino',
    'Entregada'
];

// Función para cargar datos del usuario
async function cargarDatosUsuario() {
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

// Función para verificar cotizaciones express pendientes
function verificarCotizacionesExpress(cotizaciones) {
    if (datosUsuario.rol === 'Logistico' && !notificacionMostrada) {
        const cotizacionesPendientes = cotizaciones.filter(cot => 
            cot.prioridad === 'Express' && 
            (!cot.estado_entrega || cot.estado_entrega === 'Pendiente')
        );
        
        if (cotizacionesPendientes.length > 0) {
            mostrarNotificacionExpress(cotizacionesPendientes.length);
            notificacionMostrada = true;
        }
    }
}

// Función para mostrar la notificación
function mostrarNotificacionExpress(cantidad) {
    const modal = document.createElement('div');
    modal.className = 'modal-notificacion';
    modal.innerHTML = `
        <div class="modal-content-notificacion">
            <h3>¡Atención!</h3>
            <p>Hay ${cantidad} cotización${cantidad > 1 ? 'es' : ''} Express pendiente${cantidad > 1 ? 's' : ''} 
               que requiere${cantidad > 1 ? 'n' : ''} atención inmediata.</p>
            <button onclick="cerrarNotificacion(this)" class="btn-primary">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Función para cerrar la notificación
function cerrarNotificacion(button) {
    const modal = button.closest('.modal-notificacion');
    modal.remove();
}

// Función para cargar cotizaciones aprobadas
async function cargarCotizacionesAprobadas() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getCotizacionesAprobadas`);
        const result = await response.json();
        
        if (result.status === 'success') {
            mostrarCotizaciones(result.data);
            verificarCotizacionesExpress(result.data);
        } else {
            throw new Error(result.message || 'Error al cargar cotizaciones');
        }
    } catch (error) {
        console.error('Error al cargar cotizaciones:', error);
        alert('Error al cargar cotizaciones: ' + error.message);
    }
}

// Función para mostrar cotizaciones en la tabla
function mostrarCotizaciones(cotizaciones) {
    const tbody = document.querySelector('#cotizacionesTable tbody');
    tbody.innerHTML = '';
    
    cotizaciones.forEach(cotizacion => {
        const estadoActual = cotizacion.estado_entrega || 'Pendiente';
        const siguienteEstado = ESTADOS_ENTREGA[ESTADOS_ENTREGA.indexOf(estadoActual) + 1];
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cotizacion.numero}</td>
            <td>${new Date(cotizacion.fecha).toLocaleDateString()}</td>
            <td>${cotizacion.cliente}</td>
            <td>${cotizacion.unidad}</td>
            <td>${cotizacion.departamento}</td>
            <td>${cotizacion.prioridad}</td>
            <td>S/. ${cotizacion.total.toFixed(2)}</td>
            <td><span class="estado-entrega estado-${estadoActual.toLowerCase()}">${estadoActual}</span></td>
            <td>
                <button onclick="verDetalle(${cotizacion.numero})" class="btn-ver">Ver Detalle</button>
                ${(datosUsuario.rol === 'Logistico' && siguienteEstado) ? `
                    <button onclick="cambiarEstadoEntrega(${cotizacion.numero}, '${siguienteEstado}')" 
                            class="btn-success">
                        Cambiar a ${siguienteEstado}
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para ver detalle de una cotización
async function verDetalle(numero) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDetalleCotizacion&numero=${numero}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            ordenActual = result.data;
            mostrarModalDetalle(result.data);
        } else {
            throw new Error(result.message || 'Error al cargar detalle');
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        alert('Error al cargar detalle: ' + error.message);
    }
}

// Función para mostrar el modal de detalle
function mostrarModalDetalle(data) {
    try {
        // Verificar que todos los elementos existan antes de usarlos
        const elementos = {
            numero: document.getElementById('cotizacionNumero'),
            fecha: document.getElementById('fechaActual'),
            cliente: document.getElementById('detalleCliente'),
            unidad: document.getElementById('detalleUnidad'),
            departamento: document.getElementById('detalleDepartamento'),
            prioridad: document.getElementById('detallePrioridad'),
            subtotal: document.getElementById('detalleSubtotal'),
            igv: document.getElementById('detalleIgv'),
            total: document.getElementById('detalleTotal'),
            tabla: document.querySelector('#detalleTable tbody'),
            modal: document.getElementById('detalleModal')
        };

        // Verificar que todos los elementos existan
        Object.entries(elementos).forEach(([nombre, elemento]) => {
            if (!elemento) {
                throw new Error(`No se encontró el elemento: ${nombre}`);
            }
        });

        // Llenar los datos
        elementos.numero.textContent = data.orden.numero;
        elementos.fecha.textContent = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
        elementos.cliente.textContent = data.orden.cliente;
        elementos.unidad.textContent = data.orden.unidad;
        elementos.departamento.textContent = data.orden.departamento;
        elementos.prioridad.textContent = data.orden.prioridad;
        
        // Limpiar y llenar la tabla
        elementos.tabla.innerHTML = '';
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.categoria}</td>
                <td>${item.articulo}</td>
                <td>${item.cantidad}</td>
                <td>S/. ${item.precioUnitario.toFixed(2)}</td>
                <td>S/. ${item.precioTotal.toFixed(2)}</td>
            `;
            elementos.tabla.appendChild(tr);
        });
        
        // Actualizar totales
        elementos.subtotal.textContent = `S/. ${data.orden.subtotal.toFixed(2)}`;
        elementos.igv.textContent = `S/. ${data.orden.igv.toFixed(2)}`;
        elementos.total.textContent = `S/. ${data.orden.total.toFixed(2)}`;
        
        // Mostrar el modal
        elementos.modal.style.display = 'block';

    } catch (error) {
        console.error('Error al mostrar el modal:', error);
        alert('Error al mostrar el detalle: ' + error.message);
    }
}

// Función para actualizar el botón de estado
function actualizarBotonEstado(estadoActual) {
    const btn = document.getElementById('cambiarEstadoBtn');
    const currentIndex = ESTADOS_ENTREGA.indexOf(estadoActual);
    
    if (currentIndex === ESTADOS_ENTREGA.length - 1) {
        btn.style.display = 'none';
    } else {
        btn.style.display = 'inline-block';
        btn.textContent = `Cambiar a: ${ESTADOS_ENTREGA[currentIndex + 1]}`;
        btn.onclick = () => cambiarEstadoEntrega(ordenActual.orden.numero, ESTADOS_ENTREGA[currentIndex + 1]);
    }
}

// Función para cambiar el estado de entrega
async function cambiarEstadoEntrega(numero, nuevoEstado) {
    try {
        const formData = new FormData();
        formData.append('action', 'cambiarEstadoEntrega');
        formData.append('numero', numero);
        formData.append('estado', nuevoEstado);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // Esperar un momento y recargar
        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarCotizacionesAprobadas();
        
        alert(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar estado: ' + error.message);
    }
}

// Función para generar PDF
function generarPDF() {
    if (!ordenActual) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial
    doc.setFont('helvetica');
    doc.setFontSize(20);
    
    // Encabezado
    doc.text('LP SOLDIS', 20, 20);
    doc.setFontSize(12);
    doc.text('RUC: 20609075954', 20, 30);
    doc.text('Dirección: Av. Separadora Industrial 751', 20, 35);
    
    // Información de la cotización
    doc.text(`Cotización N°: ${ordenActual.orden.numero}`, 140, 20);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 140, 30);
    
    // Información del cliente
    doc.setFontSize(14);
    doc.text('Datos del Cliente', 20, 50);
    doc.setFontSize(12);
    doc.text(`Cliente: ${ordenActual.orden.cliente}`, 20, 60);
    doc.text(`Unidad: ${ordenActual.orden.unidad}`, 20, 65);
    doc.text(`Departamento: ${ordenActual.orden.departamento}`, 20, 70);
    doc.text(`Prioridad: ${ordenActual.orden.prioridad}`, 20, 75);
    
    // Tabla de items
    const headers = [['Categoría', 'Artículo', 'Cantidad', 'Precio Unit.', 'Total']];
    const data = ordenActual.items.map(item => [
        item.categoria,
        item.articulo,
        item.cantidad.toString(),
        `S/. ${item.precioUnitario.toFixed(2)}`,
        `S/. ${item.precioTotal.toFixed(2)}`
    ]);
    
    doc.autoTable({
        startY: 85,
        head: headers,
        body: data,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [76, 175, 80] }
    });
    
    // Totales
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.text(`Subtotal: S/. ${ordenActual.orden.subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`IGV (18%): S/. ${ordenActual.orden.igv.toFixed(2)}`, 140, finalY + 5);
    doc.text(`Total: S/. ${ordenActual.orden.total.toFixed(2)}`, 140, finalY + 10);
    
    // Guardar PDF
    doc.save(`Cotizacion_${ordenActual.orden.numero}.pdf`);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosUsuario();
    await cargarCotizacionesAprobadas();
    
    // Botón para descargar PDF
    document.getElementById('descargarPdfBtn').addEventListener('click', generarPDF);
    
    // Cerrar modal
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element.addEventListener('click', () => {
            document.getElementById('detalleModal').style.display = 'none';
        });
    });
}); 

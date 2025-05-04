// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoMKGrC42NJOXa009iXZm-NdtLknBfOOF9ZAVf6A_VwMeLva1mScMNl-liZH7YnWuS5w/exec';

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

// Actualizar la constante EMPRESA_INFO
const EMPRESA_INFO = {
    nombre: 'LP SOLDIS',
    ruc: '20609075954',
    direccion: 'Av. Separadora Industrial 751 - Ate'
};

// Configuración de Cloudinary
const cloudinaryWidget = cloudinary.createUploadWidget({
    cloudName: 'df1zckatu',
    uploadPreset: 'sustento_soldis',
    sources: ['local', 'camera'],
    multiple: false,
    maxFiles: 1,
    maxFileSize: 5000000, // 5MB
    folder: 'evidencias',
    resourceType: 'auto',
    language: 'es',
    text: {
        'es': {
            'queue': {
                'title': 'Archivos para subir',
                'title_uploading_with_counter': 'Subiendo {{num}} archivos',
                'drop_files': 'Suelta los archivos aquí',
                'upload_button': 'Subir archivos',
                'drag_and_drop': 'Arrastra y suelta'
            },
            'local': {
                'browse': 'Explorar',
                'dd_title_single': 'Arrastra y suelta un archivo aquí'
            }
        }
    },
    styles: {
        palette: {
            window: "#FFFFFF",
            sourceBg: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0094C7",
            inactiveTabIcon: "#69778A",
            menuIcons: "#0094C7",
            link: "#0094C7",
            action: "#4CAF50",
            inProgress: "#0194C7",
            complete: "#4CAF50",
            error: "#F44235",
            textDark: "#000000",
            textLight: "#FFFFFF"
        },
        fonts: {
            default: null,
            "'Anaheim', sans-serif": {
                url: "https://fonts.googleapis.com/css?family=Anaheim",
                active: true
            }
        }
    }
}, (error, result) => {
    if (!error && result && result.event === "success") {
        // Guardar la URL en la hoja de cálculo
        guardarEvidencia(ordenActual.orden.numero, result.info.secure_url);
        mostrarNotificacion('Archivo subido correctamente');
    } else if (error) {
        console.error('Error al subir archivo:', error);
        mostrarNotificacion('Error al subir archivo', 'error');
    }
});

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

// Función para mostrar cotizaciones en la tabla
function mostrarCotizaciones(cotizaciones) {
    const tbody = document.querySelector('#cotizacionesTable tbody');
    tbody.innerHTML = '';
    
    // Debug: Mostrar cotizaciones que deberían generar notificación
    if (datosUsuario.rol === 'Aprobador') {
        console.log('Rol del usuario:', datosUsuario.rol);
        console.log('Usuario:', datosUsuario.usuario);
        
        const entregasRecientes = cotizaciones.filter(cot => {
            console.log('Revisando cotización:', cot);
            return cot.aprobador === datosUsuario.usuario && 
                   cot.estado === 'Entregada' &&
                   cot.sustento && 
                   !localStorage.getItem(`notificado_${cot.numero}`);
        });
        
        console.log('Entregas recientes encontradas:', entregasRecientes);
        
        entregasRecientes.forEach(cot => {
            mostrarNotificacion(`La orden N° ${cot.numero} ha sido entregada`, 'success');
            localStorage.setItem(`notificado_${cot.numero}`, 'true');
        });
    }
    
    cotizaciones.forEach(cot => {
        // Debug: Mostrar información de sustento
        console.log(`Cotización ${cot.numero} - Sustento:`, cot.sustento);
        
        const estadoActual = cot.estado || 'Pendiente';
        const siguienteEstado = ESTADOS_ENTREGA[ESTADOS_ENTREGA.indexOf(estadoActual) + 1];
        const estadoClase = estadoActual.toLowerCase().replace(/ /g, '-');
        
        let botonesAccion = `
            <button onclick="verDetalle(${cot.numero})" class="btn-icon" title="Ver Detalle">
                <i class="fas fa-eye"></i>
            </button>`;

        if (datosUsuario.rol === 'Logistico') {
            if (estadoActual === 'Entregada') {
                botonesAccion += `
                    <button onclick="subirEvidencia(${cot.numero})" class="btn-icon btn-upload" title="Subir Evidencia">
                        <i class="fas fa-upload"></i>
                    </button>`;
            } else if (siguienteEstado) {
                botonesAccion += `
                    <button onclick="cambiarEstadoEntrega(${cot.numero}, '${siguienteEstado}')" 
                            class="btn-icon btn-success" title="Cambiar a ${siguienteEstado}">
                        <i class="fas fa-arrow-right"></i>
                    </button>`;
            }
        }
        
        // Agregar botón de ver evidencia si existe
        if (cot.sustento) {
            console.log(`Agregando botón de evidencia para cotización ${cot.numero}`);
            botonesAccion += `
                <button onclick="verEvidencia('${cot.sustento}')" class="btn-icon btn-evidence" title="Ver Evidencia">
                    <i class="fas fa-file-image"></i>
                </button>`;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cot.numero}</td>
            <td>${new Date(cot.fecha).toLocaleDateString()}</td>
            <td>${cot.cliente}</td>
            <td>${cot.unidad}</td>
            <td>${cot.departamento}</td>
            <td>${cot.prioridad}</td>
            <td>S/. ${cot.subtotal.toFixed(2)}</td>
            <td>S/. ${cot.igv.toFixed(2)}</td>
            <td>S/. ${cot.total.toFixed(2)}</td>
            <td><span class="estado-${estadoClase}">${estadoActual}</span></td>
            <td>${cot.usuario}</td>
            <td>${cot.aprobador}</td>
            <td>${botonesAccion}</td>
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
        // Llenar los datos básicos
        document.getElementById('cotizacionNumero').textContent = data.orden.numero;
        document.getElementById('fechaActual').textContent = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
        document.getElementById('detalleCliente').textContent = data.orden.cliente || '';
        document.getElementById('detalleUnidad').textContent = data.orden.unidad || '';
        document.getElementById('detalleDepartamento').textContent = data.orden.departamento || '';
        document.getElementById('detallePrioridad').textContent = data.orden.prioridad || '';
        document.getElementById('detalleComprador').textContent = data.orden.usuario || '';
        document.getElementById('detalleAprobador').textContent = data.orden.aprobador || '';
        
        // Llenar la tabla de items
        const tbody = document.querySelector('#detalleTable tbody');
        tbody.innerHTML = '';
        
        data.items.forEach(item => {
            // Convertir strings a números y validar
            const cantidad = Number(item.cantidad) || 0;
            const precioUnitario = Number(item.precioUnitario) || 0;
            const precioTotal = Number(item.precioTotal) || 0;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.categoria || ''}</td>
                <td>${item.articulo || ''}</td>
                <td>${cantidad}</td>
                <td>S/. ${precioUnitario.toFixed(2)}</td>
                <td>S/. ${precioTotal.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Actualizar totales (convertir a números y validar)
        const subtotal = Number(data.orden.subtotal) || 0;
        const igv = Number(data.orden.igv) || 0;
        const total = Number(data.orden.total) || 0;
        
        document.getElementById('detalleSubtotal').textContent = `S/. ${subtotal.toFixed(2)}`;
        document.getElementById('detalleIgv').textContent = `S/. ${igv.toFixed(2)}`;
        document.getElementById('detalleTotal').textContent = `S/. ${total.toFixed(2)}`;
        
        // Mostrar el modal
        document.getElementById('detalleModal').style.display = 'block';
        
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

        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarCotizacionesAprobadas();
        
        mostrarNotificacion(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarNotificacion('Error al cambiar estado: ' + error.message, 'error');
    }
}

// Función para generar PDF
function generarPDF() {
    if (!ordenActual) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial
    doc.setFont('helvetica');
    
    // Encabezado - Datos de la empresa y número de cotización
    doc.autoTable({
        startY: 20,
        body: [
            [{
                content: 'LP SOLDIS S.A.C.',
                styles: { fontSize: 16, fontStyle: 'bold', textColor: [0, 0, 0] }
            }],
            [{
                content: 'RUC: 20609075954',
                styles: { fontSize: 10 }
            }],
            [{
                content: 'Av. Separadora Industrial 751',
                styles: { fontSize: 10 }
            }]
        ],
        theme: 'plain',
        styles: { cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 100 } }
    });

    // Número de cotización y fecha (alineado a la derecha)
    doc.autoTable({
        startY: 20,
        body: [
            [{
                content: `Cotización N°: ${ordenActual.orden.numero}`,
                styles: { halign: 'right', fontSize: 12, fontStyle: 'bold' }
            }],
            [{
                content: `Fecha: ${new Date().toLocaleDateString('es-PE')}`,
                styles: { halign: 'right', fontSize: 10 }
            }]
        ],
        theme: 'plain',
        styles: { cellPadding: 1 },
        columnStyles: { 0: { cellWidth: 90 } },
        margin: { left: 110 }
    });

    // Datos del cliente
    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [[{
            content: 'DATOS DEL CLIENTE',
            colSpan: 2,
            styles: { halign: 'left', fillColor: [76, 175, 80] }
        }]],
        body: [
            ['Cliente', ordenActual.orden.cliente || ''],
            ['Unidad', ordenActual.orden.unidad || ''],
            ['Departamento', ordenActual.orden.departamento || ''],
            ['Prioridad', ordenActual.orden.prioridad || '']
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 150 }
        }
    });

    // Responsables
    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 10,
        head: [[{
            content: 'RESPONSABLES',
            colSpan: 2,
            styles: { halign: 'left', fillColor: [76, 175, 80] }
        }]],
        body: [
            ['Comprador', ordenActual.orden.usuario || ''],
            ['Aprobador', ordenActual.orden.aprobador || '']
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 150 }
        }
    });

    // Tabla de items
    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 10,
        head: [['Categoría', 'Artículo', 'Cantidad', 'Precio Unit.', 'Total']],
        body: ordenActual.items.map(item => {
            const cantidad = Number(item.cantidad) || 0;
            const precioUnitario = Number(item.precioUnitario) || 0;
            const precioTotal = Number(item.precioTotal) || 0;
            
            return [
                item.categoria || '',
                item.articulo || '',
                cantidad.toString(),
                `S/. ${precioUnitario.toFixed(2)}`,
                `S/. ${precioTotal.toFixed(2)}`
            ];
        }),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [76, 175, 80] },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    // Totales
    const subtotal = Number(ordenActual.orden.subtotal) || 0;
    const igv = Number(ordenActual.orden.igv) || 0;
    const total = Number(ordenActual.orden.total) || 0;

    doc.autoTable({
        startY: doc.autoTable.previous.finalY + 5,
        body: [
            ['Subtotal', `S/. ${subtotal.toFixed(2)}`],
            ['IGV (18%)', `S/. ${igv.toFixed(2)}`],
            ['Total', `S/. ${total.toFixed(2)}`]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: 120 }
    });
    
    // Guardar PDF
    doc.save(`Cotizacion_${ordenActual.orden.numero}.pdf`);
}

// Función para cargar cotizaciones
async function cargarCotizacionesAprobadas() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getCotizacionesAprobadas`);
        const result = await response.json();
        
        if (result.status === 'success') {
            let cotizaciones = result.data;
            
            // Filtrar cotizaciones según el rol
            if (datosUsuario.rol === 'Comprador') {
                // Comprador ve las cotizaciones que él creó
                cotizaciones = cotizaciones.filter(cot => cot.usuario === datosUsuario.usuario);
            } else if (datosUsuario.rol === 'Aprobador') {
                // Aprobador solo ve las cotizaciones que él aprobó
                cotizaciones = cotizaciones.filter(cot => cot.aprobador === datosUsuario.usuario);
            }
            // El Logístico ve todas las cotizaciones
            
            mostrarCotizaciones(cotizaciones);
            verificarCotizacionesExpress(cotizaciones);
        } else {
            throw new Error(result.message || 'Error al cargar cotizaciones');
        }
    } catch (error) {
        console.error('Error al cargar cotizaciones:', error);
        alert('Error al cargar cotizaciones: ' + error.message);
    }
}

// Función para abrir el widget de Cloudinary
function subirEvidencia(numero) {
    ordenActual = { orden: { numero: numero } }; // Guardar el número para usarlo en el callback
    cloudinaryWidget.open();
}

// Función para guardar la URL de la evidencia
async function guardarEvidencia(numero, url) {
    try {
        const formData = new FormData();
        formData.append('action', 'guardarEvidencia');
        formData.append('numero', numero);
        formData.append('sustento', url);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            await cargarCotizacionesAprobadas();
            mostrarNotificacion('Evidencia guardada correctamente');
        } else {
            throw new Error(result.message || 'Error al guardar evidencia');
        }
    } catch (error) {
        console.error('Error al guardar evidencia:', error);
        mostrarNotificacion('Error al guardar evidencia: ' + error.message, 'error');
    }
}

// Función para mostrar notificación tipo toast
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Remover notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.toast-notification');
    notificacionesExistentes.forEach(notif => notif.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification ${tipo}`;
    toast.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Función para ver la evidencia
function verEvidencia(url) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Evidencia de Entrega</h3>
                <button onclick="this.closest('.modal').remove()" class="btn-close">×</button>
            </div>
            <div class="modal-body">
                <img src="${url}" style="max-width: 100%; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <a href="${url}" target="_blank" class="btn-download">
                        <i class="fas fa-external-link-alt"></i> Ver en nueva pestaña
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
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

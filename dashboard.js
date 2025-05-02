// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcPl6mNqcFIGc2iBPCBG21-Fan-xgUghNxMroMxhN5C5A-9nGDKoFe_WmCMO_Rlp-kgw/exec';

// Variables globales para almacenar datos
let datosUsuario = null;
let datosCotizacion = {
    unidades: [],
    articulos: [],
    prioridades: [],
    fletes: []
};

// Función para cargar datos del usuario
function cargarDatosUsuario() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            window.top.location.href = 'index.html';
            return;
        }
        datosUsuario = JSON.parse(userData);
        
        // Actualizar el texto en la interfaz
        const userDataElement = document.getElementById('userData');
        if (userDataElement) {
            userDataElement.textContent = `${datosUsuario.nombres} (${datosUsuario.rol}) - Cliente: ${datosUsuario.cliente}`;
        }
        
        return datosUsuario;
    } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
        const userDataElement = document.getElementById('userData');
        if (userDataElement) {
            userDataElement.textContent = 'Error al cargar datos de usuario';
        }
    }
}

// Función para cargar datos iniciales
async function cargarDatosCotizacion() {
    try {
        console.log('Cargando datos de cotización...');
        const response = await fetch(`${SCRIPT_URL}?action=getDatos`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Respuesta recibida:', response);
        const result = await response.json();
        console.log('Datos recibidos:', result);
        
        if (result.status === 'success') {
            datosCotizacion = result.data;
            llenarSelectores();
        } else {
            throw new Error(result.message || 'Error al cargar datos');
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar datos de cotización');
    }
}

// Función para llenar los selectores
function llenarSelectores() {
    const selectUnidad = document.getElementById('unidad');
    const selectPrioridad = document.getElementById('prioridad');
    const selectCategoria = document.getElementById('categoria');
    const selectArticulo = document.getElementById('articulo');
    
    // Filtrar unidades por cliente
    const unidadesCliente = datosCotizacion.unidades.filter(
        u => u.cliente === datosUsuario.cliente
    );

    // Llenar unidades
    selectUnidad.innerHTML = '<option value="">Seleccione...</option>';
    unidadesCliente.forEach(unidad => {
        const option = document.createElement('option');
        option.value = unidad.unidad;
        option.textContent = unidad.unidad;
        option.dataset.departamento = unidad.departamento;
        selectUnidad.appendChild(option);
    });

    // Llenar prioridades
    selectPrioridad.innerHTML = '<option value="">Seleccione...</option>';
    datosCotizacion.prioridades.forEach(pri => {
        const option = document.createElement('option');
        option.value = pri;
        option.textContent = pri;
        selectPrioridad.appendChild(option);
    });

    // Obtener categorías únicas
    const categorias = [...new Set(datosCotizacion.articulos.map(art => art.categoria))];
    
    // Llenar categorías
    selectCategoria.innerHTML = '<option value="">Seleccione...</option>';
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });

    // Event listeners
    selectUnidad.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const departamento = selectedOption.dataset.departamento;
        document.getElementById('departamento').value = departamento || '';
        actualizarPrecioUnitario();
    });

    selectPrioridad.addEventListener('change', actualizarPrecioUnitario);

    selectCategoria.addEventListener('change', function() {
        const categoria = this.value;
        selectArticulo.innerHTML = '<option value="">Seleccione...</option>';
        
        if (categoria) {
            const articulosCategoria = datosCotizacion.articulos.filter(
                art => art.categoria === categoria
            );
            
            articulosCategoria.forEach(art => {
                const option = document.createElement('option');
                option.value = JSON.stringify(art);
                option.textContent = art.nombre;
                selectArticulo.appendChild(option);
            });
        }
        actualizarPrecioUnitario();
    });

    selectArticulo.addEventListener('change', actualizarPrecioUnitario);
}

function actualizarPrecioUnitario() {
    const articuloSelect = document.getElementById('articulo');
    const precioUnitarioElement = document.getElementById('precioUnitario');
    const departamento = document.getElementById('departamento').value;
    const prioridad = document.getElementById('prioridad').value;
    const articuloStr = articuloSelect.value;

    if (articuloStr && departamento && prioridad) {
        try {
            const articulo = JSON.parse(articuloStr);
            const flete = calcularFlete(departamento, prioridad);
            const precioUnitario = articulo.precio * flete;
            precioUnitarioElement.value = `S/. ${precioUnitario.toFixed(2)}`;
        } catch (error) {
            console.error('Error al calcular precio unitario:', error);
            precioUnitarioElement.value = '';
        }
    } else {
        precioUnitarioElement.value = '';
    }
}

// Función para calcular el flete
function calcularFlete(departamento, prioridad) {
    const flete = datosCotizacion.fletes.find(f => 
        f.departamento === departamento && f.prioridad === prioridad
    );
    return flete ? flete.valor : 0;
}

// Función para agregar artículo
function agregarArticulo() {
    const unidad = document.getElementById('unidad').value;
    const departamento = document.getElementById('departamento').value;
    const prioridad = document.getElementById('prioridad').value;
    const articuloStr = document.getElementById('articulo').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);

    if (!unidad || !departamento || !prioridad || !articuloStr || cantidad < 1) {
        mostrarError('Por favor complete todos los campos');
        return;
    }

    const articulo = JSON.parse(articuloStr);
    const flete = calcularFlete(departamento, prioridad);

    agregarFilaTabla({
        articulo: articulo.nombre,
        categoria: articulo.categoria,
        precioBase: articulo.precio,
        flete: flete,
        cantidad: cantidad
    });

    actualizarTotal();
}

// Función para agregar fila a la tabla
function agregarFilaTabla(item) {
    const tbody = document.querySelector('#cotizacionTable tbody');
    const tr = document.createElement('tr');
    
    const precioUnitario = item.precioBase * item.flete;
    const precioTotal = precioUnitario * item.cantidad;
    
    tr.innerHTML = `
        <td>${item.categoria}</td>
        <td>${item.articulo}</td>
        <td>${item.cantidad}</td>
        <td>S/. ${precioUnitario.toFixed(2)}</td>
        <td>S/. ${precioTotal.toFixed(2)}</td>
        <td><button onclick="eliminarFila(this)" class="btn-danger">Eliminar</button></td>
    `;
    
    tbody.appendChild(tr);
}

// Función para eliminar fila
function eliminarFila(button) {
    const tr = button.closest('tr');
    tr.remove();
    actualizarTotal();
}

// Función para actualizar el total
function actualizarTotal() {
    const filas = document.querySelectorAll('#cotizacionTable tbody tr');
    let subtotal = 0;
    
    filas.forEach(fila => {
        const precioTotal = parseFloat(fila.cells[4].textContent.replace('S/. ', ''));
        subtotal += precioTotal;
    });
    
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    document.getElementById('subtotalCotizacion').textContent = `S/. ${subtotal.toFixed(2)}`;
    document.getElementById('igvCotizacion').textContent = `S/. ${igv.toFixed(2)}`;
    document.getElementById('totalCotizacion').textContent = `S/. ${total.toFixed(2)}`;
}

// Función para mostrar errores
function mostrarError(mensaje) {
    // Aquí puedes implementar tu lógica de mostrar errores
    alert(mensaje);
}

// Función para mostrar la vista previa
function mostrarVistaPrevia() {
    const modal = document.getElementById('previewModal');
    
    // Llenar datos del cliente
    document.getElementById('previewCliente').textContent = datosUsuario.cliente;
    document.getElementById('previewUnidad').textContent = document.getElementById('unidad').value;
    document.getElementById('previewDepartamento').textContent = document.getElementById('departamento').value;
    document.getElementById('previewPrioridad').textContent = document.getElementById('prioridad').value;
    
    // Llenar tabla de artículos
    const previewTbody = document.querySelector('#previewTable tbody');
    previewTbody.innerHTML = '';
    
    document.querySelectorAll('#cotizacionTable tbody tr').forEach(tr => {
        const newTr = document.createElement('tr');
        newTr.innerHTML = tr.innerHTML;
        // Removemos el botón eliminar
        newTr.lastElementChild.remove();
        previewTbody.appendChild(newTr);
    });
    
    // Llenar totales
    document.getElementById('previewSubtotal').textContent = document.getElementById('subtotalCotizacion').textContent;
    document.getElementById('previewIgv').textContent = document.getElementById('igvCotizacion').textContent;
    document.getElementById('previewTotal').textContent = document.getElementById('totalCotizacion').textContent;
    
    modal.style.display = 'block';
}

// Función para guardar la orden
async function guardarOrden() {
    try {
        const orden = {
            fecha: new Date().toISOString(),
            cliente: datosUsuario.cliente,
            unidad: document.getElementById('unidad').value,
            departamento: document.getElementById('departamento').value,
            prioridad: document.getElementById('prioridad').value,
            items: [],
            subtotal: parseFloat(document.getElementById('subtotalCotizacion').textContent.replace('S/. ', '')),
            igv: parseFloat(document.getElementById('igvCotizacion').textContent.replace('S/. ', '')),
            total: parseFloat(document.getElementById('totalCotizacion').textContent.replace('S/. ', '')),
            usuario: datosUsuario.usuario
        };

        // Obtener items de la tabla
        document.querySelectorAll('#cotizacionTable tbody tr').forEach(tr => {
            orden.items.push({
                categoria: tr.cells[0].textContent,
                articulo: tr.cells[1].textContent,
                cantidad: parseInt(tr.cells[2].textContent),
                precioUnitario: parseFloat(tr.cells[3].textContent.replace('S/. ', '')),
                precioTotal: parseFloat(tr.cells[4].textContent.replace('S/. ', ''))
            });
        });

        // Convertir el objeto orden a FormData
        const formData = new FormData();
        formData.append('action', 'guardarOrden');
        formData.append('orden', JSON.stringify(orden));

        // Primera solicitud: enviar datos
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // Segunda solicitud: verificar resultado
        const checkResponse = await fetch(`${SCRIPT_URL}?action=checkOrden&cliente=${encodeURIComponent(orden.cliente)}`);
        const result = await checkResponse.json();
        
        if (result.status === 'success') {
            alert('Orden guardada exitosamente');
            window.location.reload();
        } else {
            throw new Error(result.message || 'Error al guardar la orden');
        }
    } catch (error) {
        console.error('Error al guardar orden:', error);
        alert('Error al guardar la orden: ' + error.message);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosUsuario();
    await cargarDatosCotizacion();
    
    // Event listener para el botón agregar
    document.getElementById('agregarBtn').addEventListener('click', agregarArticulo);
    
    // Botón para generar orden
    document.getElementById('generarOrdenBtn').addEventListener('click', mostrarVistaPrevia);
    
    // Botón para guardar orden
    document.getElementById('guardarOrdenBtn').addEventListener('click', guardarOrden);
    
    // Cerrar modal
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element.addEventListener('click', () => {
            document.getElementById('previewModal').style.display = 'none';
        });
    });
}); 
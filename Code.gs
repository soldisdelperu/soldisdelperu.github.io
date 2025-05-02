// Configuración global de headers para CORS
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Maneja las solicitudes GET y POST
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getDatos') {
      return getDatos();
    } else if (action === 'getUserData') {
      const email = e.parameter.email;
      return getUserData(email);
    } else if (action === 'getUsuarios') {
      return getUsuarios();
    } else if (action === 'getUsuario') {
      const email = e.parameter.email;
      return getUsuario(email);
    } else if (action === 'check') {
      const usuario = e.parameter.usuario;
      // Buscar el usuario en la hoja y devolver sus datos
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('usuarios');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const userRow = data.find(row => row[headers.indexOf('Usuario')] === usuario);
      
      if (userRow) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          data: {
            usuario: userRow[headers.indexOf('Usuario')],
            nombres: userRow[headers.indexOf('Nombres')],
            rol: userRow[headers.indexOf('Rol')],
            cliente: userRow[headers.indexOf('Cliente')]
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (action === 'checkOrden') {
      // Verificar la última orden guardada para el cliente
      const cliente = e.parameter.cliente;
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const ordenesSheet = ss.getSheetByName('ordenes');
      const data = ordenesSheet.getDataRange().getValues();
      const ultimaOrden = data.slice(1).reverse().find(row => row[2] === cliente);
      
      if (ultimaOrden) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Orden guardada correctamente',
          numeroOrden: ultimaOrden[0]
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (action === 'getOrdenes') {
      return getOrdenes();
    } else if (action === 'getDetalleOrden') {
      const numero = e.parameter.numero;
      return getDetalleOrden(numero);
    } else if (action === 'getCotizacionesAprobadas') {
      return getCotizacionesAprobadas();
    } else if (action === 'getDetalleCotizacion') {
      const numero = e.parameter.numero;
      return getDetalleCotizacion(numero);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Usuario no encontrado'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const formData = e.parameter;
    console.log('Datos recibidos en doPost:', formData); // Para debug
    
    if (formData.action === 'login') {
      return handleLogin({
        usuario: formData.usuario,
        password: formData.password
      });
    } else if (formData.action === 'guardarOrden') {
      console.log('Guardando orden...'); // Para debug
      const orden = JSON.parse(formData.orden);
      console.log('Orden parseada:', orden); // Para debug
      return guardarOrden(orden);
    } else if (formData.action === 'aprobarOrden') {
      return aprobarOrden(formData.numero);
    } else if (formData.action === 'rechazarOrden') {
      return rechazarOrden(formData.numero);
    } else if (formData.action === 'cambiarEstadoEntrega') {
      return cambiarEstadoEntrega(formData.numero, formData.estado);
    } else if (formData.action === 'crearUsuario') {
      return crearUsuario(formData);
    } else if (formData.action === 'editarUsuario') {
      return editarUsuario(formData);
    } else if (formData.action === 'eliminarUsuario') {
      const email = formData.email;
      return eliminarUsuario(email);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Acción no válida'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error en doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRequest(e) {
  // Headers CORS específicos
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Manejar la solicitud OPTIONS (preflight)
  if (e.parameter.method === 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders(headers);
  }

  try {
    let result;
    if (e.postData) {
      const data = JSON.parse(e.postData.contents);
      switch (data.action) {
        case 'login':
          result = handleLogin(data);
          break;
        default:
          result = { status: 'error', message: 'Acción no válida' };
      }
    } else {
      result = getDatos();
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
  }
}

// Función para obtener datos
function getDatos() {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const fleteSheet = ss.getSheetByName('flete');
        const matricesSheet = ss.getSheetByName('matrices');
        const unidadesSheet = ss.getSheetByName('unidades');

        // Obtener datos de flete
        const fleteData = fleteSheet.getDataRange().getValues();
        const fleteHeaders = fleteData[0];
        const fleteRows = fleteData.slice(1);

        // Obtener datos de matrices (artículos)
        const matricesData = matricesSheet.getDataRange().getValues();
        const matricesHeaders = matricesData[0];
        const articulos = matricesData.slice(1).map(row => ({
            categoria: row[matricesHeaders.indexOf('Categoria')],
            nombre: row[matricesHeaders.indexOf('Articulo')],
            precio: row[matricesHeaders.indexOf('Precio')]
        }));

        // Obtener datos de unidades
        const unidadesData = unidadesSheet.getDataRange().getValues();
        const unidadesHeaders = unidadesData[0];
        const unidades = unidadesData.slice(1).map(row => ({
            cliente: row[unidadesHeaders.indexOf('Cliente')],
            unidad: row[unidadesHeaders.indexOf('Unidad')],
            departamento: row[unidadesHeaders.indexOf('Departamento')]
        }));

        // Obtener prioridades únicas
        const prioridades = [...new Set(fleteRows.map(row => row[fleteHeaders.indexOf('Prioridad')]))];

        // Crear matriz de fletes
        const fletes = fleteRows.map(row => ({
            departamento: row[fleteHeaders.indexOf('Departamento')],
            prioridad: row[fleteHeaders.indexOf('Prioridad')],
            valor: row[fleteHeaders.indexOf('Flete')]
        }));

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            data: {
                unidades: unidades,
                articulos: articulos,
                prioridades: prioridades,
                fletes: fletes
            }
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Función para crear nuevos registros
function createData(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hoja1");
  // Aquí implementaremos la lógica de inserción según tus necesidades
  
  return {
    status: "success",
    message: "Datos creados correctamente"
  };
}

// Función para enviar respuesta con headers CORS
function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(CORS_HEADERS);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Crear hojas si no existen
  const sheets = {
    'usuarios': [['Usuario', 'Contraseña', 'Nombres', 'Rol', 'Cliente']],
    'unidades': [['Cliente', 'Unidad', 'Departamento']],
    'matrices': [['Categoria', 'Articulo', 'Precio']],
    'cotizaciones': [['Fecha', 'Usuario', 'Cliente', 'Unidad', 'Departamento', 'Prioridad', 'Total', 'IGV', 'Total_Final']],
    'detalle_cotizaciones': [['ID_Cotizacion', 'Categoria', 'Articulo', 'Cantidad', 'Precio_Unitario', 'Subtotal']],
    'ordenes': [['Numero', 'Fecha', 'Cliente', 'Unidad', 'Departamento', 'Prioridad', 'Subtotal', 'IGV', 'Total', 'Estado', 'usuario']],
    'items_ordenes': [['Numero', 'Categoria', 'Articulo', 'Cantidad', 'Precio_Unitario', 'Precio_Total']]
  };

  Object.entries(sheets).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers[0].length).setValues([headers[0]]);
    }
  });
}

function handleLogin(params) {
  const { usuario, password } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('usuarios');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Buscar usuario
  const userRow = data.find(row => 
    row[headers.indexOf('Usuario')] === usuario && 
    row[headers.indexOf('Contraseña')] === password
  );

  if (userRow) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        usuario: userRow[headers.indexOf('Usuario')],
        nombres: userRow[headers.indexOf('Nombres')],
        rol: userRow[headers.indexOf('Rol')],
        cliente: userRow[headers.indexOf('Cliente')]
      }
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Usuario o contraseña incorrectos'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Función para incluir archivos HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function guardarOrden(orden) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Verificar y crear hojas si no existen
    let ordenesSheet = ss.getSheetByName('ordenes');
    let itemsSheet = ss.getSheetByName('items_ordenes');
    
    if (!ordenesSheet) {
      ordenesSheet = ss.insertSheet('ordenes');
      ordenesSheet.appendRow(['Numero', 'Fecha', 'Cliente', 'Unidad', 'Departamento', 'Prioridad', 'Subtotal', 'IGV', 'Total', 'Estado', 'usuario']);
    } else {
      // Verificar si existe la columna Estado, si no, agregarla
      const headers = ordenesSheet.getRange(1, 1, 1, ordenesSheet.getLastColumn()).getValues()[0];
      if (!headers.includes('Estado')) {
        ordenesSheet.getRange(1, ordenesSheet.getLastColumn() + 1).setValue('Estado');
      }
    }
    
    if (!itemsSheet) {
      itemsSheet = ss.insertSheet('items_ordenes');
      itemsSheet.appendRow(['Numero', 'Categoria', 'Articulo', 'Cantidad', 'Precio_Unitario', 'Precio_Total']);
    }
    
    // Obtener el último número de orden
    const lastRow = ordenesSheet.getLastRow();
    const numero = lastRow > 1 ? ordenesSheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Agregar la orden con el usuario que la creó
    ordenesSheet.appendRow([
      numero,
      orden.fecha,
      orden.cliente,
      orden.unidad,
      orden.departamento,
      orden.prioridad,
      orden.subtotal,
      orden.igv,
      orden.total,
      'Pendiente',  // Estado inicial
      orden.usuario  // Se guardará en la columna 'usuario'
    ]);
    
    // Guardar items
    orden.items.forEach(item => {
      itemsSheet.appendRow([
        numero,
        item.categoria,
        item.articulo,
        item.cantidad,
        item.precioUnitario,
        item.precioTotal
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Orden guardada correctamente',
      numeroOrden: numero
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error en guardarOrden:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrdenes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const data = ordenesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Mapear las órdenes
    const ordenes = data.slice(1)
      .map(row => ({
        numero: row[headers.indexOf('Numero')],
        fecha: row[headers.indexOf('Fecha')],
        cliente: row[headers.indexOf('Cliente')],
        unidad: row[headers.indexOf('Unidad')],
        departamento: row[headers.indexOf('Departamento')],
        prioridad: row[headers.indexOf('Prioridad')],
        subtotal: row[headers.indexOf('Subtotal')],
        igv: row[headers.indexOf('IGV')],
        total: row[headers.indexOf('Total')],
        estado: row[headers.indexOf('Estado')],
        Usuario: row[headers.indexOf('Usuario')] // Cambiado a 'Usuario' con mayúscula
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: ordenes
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getDetalleOrden(numero) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const itemsSheet = ss.getSheetByName('items_ordenes');
    
    // Obtener datos de la orden
    const ordenesData = ordenesSheet.getDataRange().getValues();
    const ordenesHeaders = ordenesData[0];
    const orden = ordenesData.find(row => row[ordenesHeaders.indexOf('Numero')] == numero);
    
    if (!orden) {
      throw new Error('Orden no encontrada');
    }
    
    // Obtener items de la orden
    const itemsData = itemsSheet.getDataRange().getValues();
    const itemsHeaders = itemsData[0];
    const items = itemsData.slice(1)
      .filter(row => row[itemsHeaders.indexOf('Numero')] == numero)
      .map(row => ({
        categoria: row[itemsHeaders.indexOf('Categoria')],
        articulo: row[itemsHeaders.indexOf('Articulo')],
        cantidad: row[itemsHeaders.indexOf('Cantidad')],
        precioUnitario: row[itemsHeaders.indexOf('Precio_Unitario')],
        precioTotal: row[itemsHeaders.indexOf('Precio_Total')]
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        orden: {
          numero: orden[ordenesHeaders.indexOf('Numero')],
          fecha: orden[ordenesHeaders.indexOf('Fecha')],
          cliente: orden[ordenesHeaders.indexOf('Cliente')],
          unidad: orden[ordenesHeaders.indexOf('Unidad')],
          departamento: orden[ordenesHeaders.indexOf('Departamento')],
          prioridad: orden[ordenesHeaders.indexOf('Prioridad')],
          subtotal: orden[ordenesHeaders.indexOf('Subtotal')],
          igv: orden[ordenesHeaders.indexOf('IGV')],
          total: orden[ordenesHeaders.indexOf('Total')],
          estado: orden[ordenesHeaders.indexOf('Estado')] || 'Pendiente'
        },
        items: items
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function aprobarOrden(numero) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const data = ordenesSheet.getDataRange().getValues();
    const headers = data[0];
    const estadoCol = headers.indexOf('Estado') + 1;
    
    // Encontrar la fila de la orden
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == numero) {  // La columna Numero es la primera (índice 0)
        rowIndex = i + 1;  // +1 porque las filas en Sheets empiezan en 1
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Orden no encontrada');
    
    // Actualizar estado
    ordenesSheet.getRange(rowIndex, estadoCol).setValue('Aprobado');
    
    // Copiar a cotizaciones_aprobadas
    const cotAprobadas = ss.getSheetByName('cotizaciones_aprobadas') || 
                        ss.insertSheet('cotizaciones_aprobadas');
    
    if (cotAprobadas.getLastRow() === 0) {
      cotAprobadas.appendRow(headers);
    }
    
    cotAprobadas.appendRow(data[rowIndex]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Orden aprobada correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error en aprobarOrden:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function rechazarOrden(numero) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const data = ordenesSheet.getDataRange().getValues();
    const headers = data[0];
    const estadoCol = headers.indexOf('Estado') + 1;
    
    // Encontrar la fila de la orden
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == numero) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Orden no encontrada');
    
    // Actualizar estado
    ordenesSheet.getRange(rowIndex, estadoCol).setValue('Rechazado');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Orden rechazada correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error en rechazarOrden:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCotizacionesAprobadas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const data = ordenesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Verificar si existe la columna estado_entrega, si no, agregarla
    if (!headers.includes('estado_entrega')) {
      ordenesSheet.getRange(1, headers.length + 1).setValue('estado_entrega');
      // Establecer "Pendiente" como valor por defecto para todas las filas existentes
      if (data.length > 1) {
        const range = ordenesSheet.getRange(2, headers.length + 1, data.length - 1, 1);
        range.setValue('Pendiente');
      }
      headers.push('estado_entrega');
    }
    
    // Filtrar solo las órdenes que tienen Estado = "Aprobado"
    const ordenes = data.slice(1)
      .filter(row => row[headers.indexOf('Estado')] === 'Aprobado')
      .map(row => ({
        numero: row[headers.indexOf('Numero')],
        fecha: row[headers.indexOf('Fecha')],
        cliente: row[headers.indexOf('Cliente')],
        unidad: row[headers.indexOf('Unidad')],
        departamento: row[headers.indexOf('Departamento')],
        prioridad: row[headers.indexOf('Prioridad')],
        subtotal: row[headers.indexOf('Subtotal')],
        igv: row[headers.indexOf('IGV')],
        total: row[headers.indexOf('Total')],
        estado_entrega: row[headers.indexOf('estado_entrega')] || 'Pendiente'
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: ordenes
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getDetalleCotizacion(numero) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const itemsSheet = ss.getSheetByName('items_ordenes');
    
    const ordenesData = ordenesSheet.getDataRange().getValues();
    const ordenesHeaders = ordenesData[0];
    const orden = ordenesData.find(row => row[ordenesHeaders.indexOf('Numero')] == numero);
    
    if (!orden) throw new Error('Cotización no encontrada');
    
    const itemsData = itemsSheet.getDataRange().getValues();
    const itemsHeaders = itemsData[0];
    const items = itemsData.slice(1)
      .filter(row => row[itemsHeaders.indexOf('Numero')] == numero)
      .map(row => ({
        categoria: row[itemsHeaders.indexOf('Categoria')],
        articulo: row[itemsHeaders.indexOf('Articulo')],
        cantidad: row[itemsHeaders.indexOf('Cantidad')],
        precioUnitario: row[itemsHeaders.indexOf('Precio_Unitario')],
        precioTotal: row[itemsHeaders.indexOf('Precio_Total')]
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        orden: {
          numero: orden[ordenesHeaders.indexOf('Numero')],
          fecha: orden[ordenesHeaders.indexOf('Fecha')],
          cliente: orden[ordenesHeaders.indexOf('Cliente')],
          unidad: orden[ordenesHeaders.indexOf('Unidad')],
          departamento: orden[ordenesHeaders.indexOf('Departamento')],
          prioridad: orden[ordenesHeaders.indexOf('Prioridad')],
          subtotal: orden[ordenesHeaders.indexOf('Subtotal')],
          igv: orden[ordenesHeaders.indexOf('IGV')],
          total: orden[ordenesHeaders.indexOf('Total')],
          estado_entrega: orden[ordenesHeaders.indexOf('estado_entrega')] || 'Pendiente'
        },
        items: items
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function cambiarEstadoEntrega(numero, nuevoEstado) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ordenesSheet = ss.getSheetByName('ordenes');
    const data = ordenesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Encontrar la fila de la orden
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('Numero')] == numero) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Orden no encontrada');
    
    // Actualizar estado de entrega
    const estadoEntregaCol = headers.indexOf('estado_entrega') + 1;
    ordenesSheet.getRange(rowIndex, estadoEntregaCol).setValue(nuevoEstado);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Estado de entrega actualizado correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getUserRole(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usuariosSheet = ss.getSheetByName('usuarios');
  const data = usuariosSheet.getDataRange().getValues();
  const headers = data[0];
  
  const userRow = data.find(row => row[headers.indexOf('Email')] === email);
  
  if (userRow) {
    return userRow[headers.indexOf('Rol')];
  }
  
  return null;
}

// Función para obtener todos los usuarios
function getUsuarios() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usuariosSheet = ss.getSheetByName('usuarios');
    const data = usuariosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const usuarios = data.slice(1).map(row => ({
      email: row[headers.indexOf('Email')],
      nombres: row[headers.indexOf('Nombres')],
      rol: row[headers.indexOf('Rol')],
      cliente: row[headers.indexOf('Cliente')]
    }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: usuarios
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para obtener un usuario específico
function getUsuario(email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usuariosSheet = ss.getSheetByName('usuarios');
    const data = usuariosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const usuario = data.find(row => row[headers.indexOf('Email')] === email);
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: {
        email: usuario[headers.indexOf('Email')],
        nombres: usuario[headers.indexOf('Nombres')],
        rol: usuario[headers.indexOf('Rol')],
        cliente: usuario[headers.indexOf('Cliente')]
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para crear un nuevo usuario
function crearUsuario(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usuariosSheet = ss.getSheetByName('usuarios');
    
    usuariosSheet.appendRow([
      formData.email,
      formData.nombres,
      formData.rol,
      formData.cliente
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Usuario creado correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para editar un usuario existente
function editarUsuario(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usuariosSheet = ss.getSheetByName('usuarios');
    const data = usuariosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const rowIndex = data.findIndex(row => row[headers.indexOf('Email')] === formData.email);
    
    if (rowIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    usuariosSheet.getRange(rowIndex + 1, 1, 1, 4).setValues([[
      formData.email,
      formData.nombres,
      formData.rol,
      formData.cliente
    ]]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Usuario actualizado correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para eliminar un usuario
function eliminarUsuario(email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usuariosSheet = ss.getSheetByName('usuarios');
    const data = usuariosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const rowIndex = data.findIndex(row => row[headers.indexOf('Email')] === email);
    
    if (rowIndex === -1) {
      throw new Error('Usuario no encontrado');
    }
    
    usuariosSheet.deleteRow(rowIndex + 1);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Usuario eliminado correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Nueva función para obtener datos del usuario
function getUserData(email) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const usuariosSheet = ss.getSheetByName('usuarios');
        const data = usuariosSheet.getDataRange().getValues();
        const headers = data[0];
        
        const userRow = data.find(row => row[headers.indexOf('Email')] === email);
        
        if (userRow) {
            return ContentService.createTextOutput(JSON.stringify({
                status: 'success',
                data: {
                    usuario: email,
                    nombres: userRow[headers.indexOf('Nombres')],
                    rol: userRow[headers.indexOf('Rol')],
                    cliente: userRow[headers.indexOf('Cliente')]
                }
            })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
} 
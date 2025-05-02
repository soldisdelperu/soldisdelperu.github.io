// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcPl6mNqcFIGc2iBPCBG21-Fan-xgUghNxMroMxhN5C5A-9nGDKoFe_WmCMO_Rlp-kgw/exec';

// Variables globales
let datosUsuario = null;
let usuarioActual = null;

// Cargar datos del usuario actual
function cargarDatosUsuario() {
    const userData = localStorage.getItem('userData');
    if (!userData || JSON.parse(userData).rol !== 'Administrador') {
        window.top.location.href = 'index.html';
        return;
    }
    datosUsuario = JSON.parse(userData);
}

// Cargar lista de usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUsuarios`);
        const result = await response.json();
        
        if (result.status === 'success') {
            mostrarUsuarios(result.data);
        } else {
            throw new Error(result.message || 'Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar usuarios: ' + error.message);
    }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.email}</td>
            <td>${usuario.nombres}</td>
            <td>${usuario.rol}</td>
            <td>${usuario.cliente}</td>
            <td>
                <button onclick="editarUsuario('${usuario.email}')" class="btn-primary">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="eliminarUsuario('${usuario.email}')" class="btn-danger">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funciones para el modal
function mostrarModal(titulo = 'Nuevo Usuario') {
    document.querySelector('.modal-header h2').textContent = titulo;
    document.getElementById('usuarioModal').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('usuarioModal').style.display = 'none';
    document.getElementById('usuarioForm').reset();
    usuarioActual = null;
}

// Funciones CRUD
async function guardarUsuario(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('action', usuarioActual ? 'editarUsuario' : 'crearUsuario');
    formData.append('email', document.getElementById('email').value);
    formData.append('nombres', document.getElementById('nombres').value);
    formData.append('rol', document.getElementById('rol').value);
    formData.append('cliente', document.getElementById('cliente').value);
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            cerrarModal();
            cargarUsuarios();
            mostrarError(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar usuario: ' + error.message);
    }
}

async function editarUsuario(email) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUsuario&email=${email}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            usuarioActual = result.data;
            document.getElementById('email').value = usuarioActual.email;
            document.getElementById('nombres').value = usuarioActual.nombres;
            document.getElementById('rol').value = usuarioActual.rol;
            document.getElementById('cliente').value = usuarioActual.cliente;
            
            mostrarModal('Editar Usuario');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar usuario: ' + error.message);
    }
}

async function eliminarUsuario(email) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'eliminarUsuario');
        formData.append('email', email);
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            cargarUsuarios();
            mostrarError('Usuario eliminado correctamente', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al eliminar usuario: ' + error.message);
    }
}

// Función para mostrar mensajes de error/éxito
function mostrarError(mensaje, tipo = 'error') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${tipo}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${mensaje}
    `;
    
    const container = document.querySelector('.usuarios-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    cargarUsuarios();
    
    // Botón nuevo usuario
    document.getElementById('nuevoUsuarioBtn').addEventListener('click', () => {
        mostrarModal();
    });
    
    // Cerrar modal
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element.addEventListener('click', cerrarModal);
    });
    
    // Submit form
    document.getElementById('usuarioForm').addEventListener('submit', guardarUsuario);
}); 
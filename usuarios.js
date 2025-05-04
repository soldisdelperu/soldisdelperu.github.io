// URL del script de Google
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoMKGrC42NJOXa009iXZm-NdtLknBfOOF9ZAVf6A_VwMeLva1mScMNl-liZH7YnWuS5w/exec';

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
            <td>${usuario.usuario}</td>
            <td>${usuario.password}</td>
            <td>${usuario.nombres}</td>
            <td>${usuario.rol}</td>
            <td>${usuario.cliente}</td>
            <td>${usuario.dependencia || ''}</td>
            <td>
                <button onclick="editarUsuario('${usuario.usuario}')" class="btn-primary">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="eliminarUsuario('${usuario.usuario}')" class="btn-danger">
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
    formData.append('usuario', document.getElementById('usuario').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('nombres', document.getElementById('nombres').value);
    formData.append('rol', document.getElementById('rol').value);
    formData.append('cliente', document.getElementById('cliente').value);
    formData.append('dependencia', document.getElementById('dependencia').value);
    
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // Esperar un momento y verificar
        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarUsuarios();
        
        cerrarModal();
        mostrarNotificacion('Usuario guardado correctamente');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    }
}

async function editarUsuario(usuario) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUsuario&usuario=${encodeURIComponent(usuario)}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            usuarioActual = result.data;
            document.getElementById('usuario').value = usuarioActual.usuario;
            document.getElementById('password').value = usuarioActual.password;
            document.getElementById('nombres').value = usuarioActual.nombres;
            document.getElementById('rol').value = usuarioActual.rol;
            document.getElementById('cliente').value = usuarioActual.cliente;
            document.getElementById('dependencia').value = usuarioActual.dependencia || '';
            
            mostrarModal('Editar Usuario');
        } else {
            throw new Error(result.message || 'Error al cargar usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    }
}

async function eliminarUsuario(usuario) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'eliminarUsuario');
        formData.append('usuario', usuario);
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });

        // Esperar un momento y verificar
        await new Promise(resolve => setTimeout(resolve, 1000));
        await cargarUsuarios();
        
        mostrarNotificacion('Usuario eliminado correctamente');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
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

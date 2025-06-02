// Variables globales
let datosUsuario = null;

// Función para cargar datos del usuario
function cargarDatosUsuario() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }
        
        datosUsuario = JSON.parse(userData);
        document.getElementById('userData').textContent = 
            `${datosUsuario.nombres} (${datosUsuario.rol})`;
        
        // Controlar acceso según rol
        const btnNuevaCotizacion = document.querySelector('[data-page="dashboard.html"]');
        const btnOrdenesPendientes = document.querySelector('[data-page="ordenes.html"]');
        const btnCotizacionesAprobadas = document.querySelector('[data-page="cotizaciones_aprobadas.html"]');
        
        switch (datosUsuario.rol) {
            case 'Comprador':
                btnCotizacionesAprobadas.style.display = 'none';
                break;
                
            case 'Logistico':
                btnNuevaCotizacion.style.display = 'none';
                btnOrdenesPendientes.style.display = 'none';
                break;
        }
        
        // Redirigir a la primera página disponible según el rol
        if (datosUsuario.rol === 'Logistico') {
            document.getElementById('contentFrame').src = 'cotizaciones_aprobadas.html';
            btnCotizacionesAprobadas.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
        document.getElementById('userData').textContent = 'Error al cargar datos';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    
    // Manejar navegación
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.id !== 'logoutBtn') {
            item.addEventListener('click', () => {
                // Actualizar clases activas
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Cargar página en el iframe
                const page = item.dataset.page;
                document.getElementById('contentFrame').src = page;
            });
        }
    });
    
    // Manejar cierre de sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
    
    // Verificar rol de usuario y mostrar/ocultar botón de usuarios
    const userData = JSON.parse(localStorage.getItem('userData'));
    const usuariosBtn = document.getElementById('usuariosBtn');
    
    if (userData && userData.rol === 'Administrador') {
        usuariosBtn.style.display = 'flex';
    }

    // Al final del DOMContentLoaded existente
    document.querySelector('.sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        document.querySelector('.content').classList.toggle('expanded');
    });

    // Al final del DOMContentLoaded existente
    const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');
    mobileNavItems.forEach(item => {
        if (!item.id.includes('logout')) {
            item.addEventListener('click', () => {
                mobileNavItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const page = item.dataset.page;
                document.getElementById('contentFrame').src = page;
            });
        }
    });

    // Manejar logout en móvil
    document.getElementById('logoutBtnMobile')?.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
});

// Función para mostrar notificación tipo toast
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Remover notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.toast-notification');
    notificacionesExistentes.forEach(notif => notif.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification ${tipo}`;
    toast.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 
                         tipo === 'warning' ? 'exclamation-triangle' : 
                         'exclamation-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
} 

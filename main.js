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
});

function cargarMenu() {
    const menuContainer = document.getElementById('menu');
    if (!menuContainer) return;

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    let menuHTML = '';

    // El administrador tiene acceso a todo
    if (userData.rol === 'Administrador') {
        menuHTML = `
            <a href="dashboard.html" target="contentFrame" class="menu-item">
                <i class="fas fa-file-invoice"></i> Nueva Cotización
            </a>
            <a href="ordenes.html" target="contentFrame" class="menu-item">
                <i class="fas fa-clipboard-list"></i> Órdenes Pendientes
            </a>
            <a href="cotizaciones_aprobadas.html" target="contentFrame" class="menu-item">
                <i class="fas fa-check-circle"></i> Cotizaciones Aprobadas
            </a>
            <a href="usuarios.html" target="contentFrame" class="menu-item">
                <i class="fas fa-users"></i> Gestión de Usuarios
            </a>
        `;
    } else {
        // Menú existente según el rol
        switch (userData.rol) {
            case 'Comprador':
                menuHTML = `
                    <a href="dashboard.html" target="contentFrame" class="menu-item">
                        <i class="fas fa-file-invoice"></i> Nueva Cotización
                    </a>
                    <a href="ordenes.html" target="contentFrame" class="menu-item">
                        <i class="fas fa-clipboard-list"></i> Órdenes Pendientes
                    </a>
                `;
                break;
            case 'Aprobador':
                menuHTML = `
                    <a href="ordenes.html" target="contentFrame" class="menu-item">
                        <i class="fas fa-clipboard-list"></i> Órdenes Pendientes
                    </a>
                `;
                break;
            case 'Logistico':
                menuHTML = `
                    <a href="cotizaciones_aprobadas.html" target="contentFrame" class="menu-item">
                        <i class="fas fa-check-circle"></i> Cotizaciones Aprobadas
                    </a>
                `;
                break;
        }
    }

    menuContainer.innerHTML = menuHTML;
} 
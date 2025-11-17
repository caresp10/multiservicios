// Cargar sidebar dinámicamente
async function loadSidebar() {
    try {
        const response = await fetch('../components/sidebar.html');
        const sidebarHTML = await response.text();

        // Insertar el sidebar al inicio del dashboard-wrapper
        const dashboardWrapper = document.querySelector('.dashboard-wrapper');
        if (dashboardWrapper) {
            dashboardWrapper.insertAdjacentHTML('afterbegin', sidebarHTML);
        }

        // Marcar el elemento activo basado en la URL actual
        markActiveMenuItem();

        // Configurar el toggle del sidebar para móviles
        setupSidebarToggle();

        // Configurar el toggle del submenu
        setupSubmenuToggle();

        // Ocultar menú de usuarios si no es admin
        hideMenuForNonAdmin();

        // Mostrar/ocultar menús según el rol
        adjustMenuByRole();
    } catch (error) {
        console.error('Error cargando sidebar:', error);
    }
}

// Marcar el menú activo según la página actual
function markActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuLinks = document.querySelectorAll('.sidebar-menu a');

    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');

            // Si el enlace activo está dentro de un submenu, abrir el submenu
            const parentSubmenu = link.closest('.menu-item-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('open');
            }
        }
    });
}

// Configurar toggle del sidebar
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
}

// Ocultar menú de administración para no-admin
function hideMenuForNonAdmin() {
    const user = AuthService.getUser();
    if (user && user.rol !== 'ADMIN') {
        const menuAdministracion = document.getElementById('menuAdministracion');
        if (menuAdministracion) {
            menuAdministracion.style.display = 'none';
        }
    }
}

// Ajustar menús según el rol del usuario
function adjustMenuByRole() {
    const user = AuthService.getUser();
    if (!user) return;

    // Referencias a los menús
    const menuMisOrdenes = document.getElementById('menuMisOrdenes');
    const menuClientes = document.querySelector('a[href="clientes.html"]')?.parentElement;
    const menuPedidos = document.querySelector('a[href="pedidos.html"]')?.parentElement;
    const menuPresupuestos = document.querySelector('a[href="presupuestos.html"]')?.parentElement;
    const menuOrdenes = document.querySelector('a[href="ordenes.html"]')?.parentElement;
    const menuFacturas = document.querySelector('a[href="facturas.html"]')?.parentElement;
    const menuInventario = document.getElementById('menuInventario');
    const menuAdministracion = document.getElementById('menuAdministracion');
    const menuReportes = document.querySelector('a[href="reportes.html"]')?.parentElement;

    if (user.rol === 'TECNICO') {
        // Para técnicos: solo mostrar Dashboard y Mis Órdenes
        if (menuMisOrdenes) menuMisOrdenes.style.display = 'block';

        // Ocultar todos los demás menús
        if (menuClientes) menuClientes.style.display = 'none';
        if (menuPedidos) menuPedidos.style.display = 'none';
        if (menuPresupuestos) menuPresupuestos.style.display = 'none';
        if (menuOrdenes) menuOrdenes.style.display = 'none';
        if (menuFacturas) menuFacturas.style.display = 'none';
        if (menuInventario) menuInventario.style.display = 'none';
        if (menuAdministracion) menuAdministracion.style.display = 'none';
        if (menuReportes) menuReportes.style.display = 'none';
    } else {
        // Para otros roles: ocultar "Mis Órdenes"
        if (menuMisOrdenes) menuMisOrdenes.style.display = 'none';

        // Mostrar los demás menús (según permisos ya configurados)
        if (menuClientes) menuClientes.style.display = 'block';
        if (menuPedidos) menuPedidos.style.display = 'block';
        if (menuPresupuestos) menuPresupuestos.style.display = 'block';
        if (menuOrdenes) menuOrdenes.style.display = 'block';
        if (menuFacturas) menuFacturas.style.display = 'block';
        if (menuReportes) menuReportes.style.display = 'block';

        // El menú de Inventario solo para ADMIN y DUENO
        if (user.rol === 'ADMIN' || user.rol === 'DUENO') {
            if (menuInventario) menuInventario.style.display = 'block';
        } else {
            if (menuInventario) menuInventario.style.display = 'none';
        }
        // menuAdministracion ya se maneja en hideMenuForNonAdmin()
    }
}

// Configurar toggle del submenu
function setupSubmenuToggle() {
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const menuItem = this.parentElement;

            // Toggle la clase 'open'
            menuItem.classList.toggle('open');

            console.log('Submenu toggled:', menuItem.classList.contains('open') ? 'ABIERTO' : 'CERRADO');
        });
    });

    if (submenuToggles.length > 0) {
        console.log('Submenus toggle configurados correctamente:', submenuToggles.length);
    } else {
        console.warn('No se encontraron elementos .submenu-toggle');
    }
}

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        AuthService.logout();
    }
}

// Hacer la función logout global para que esté disponible en el HTML
window.logout = logout;

// Cargar sidebar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

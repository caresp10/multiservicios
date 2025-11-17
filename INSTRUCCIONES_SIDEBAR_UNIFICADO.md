# Instrucciones para Sidebar Unificado

## ¿Qué se ha implementado?

Se ha creado un sistema de sidebar unificado para evitar duplicación de código en todas las páginas HTML.

### Archivos creados:
1. `frontend/components/sidebar.html` - HTML del sidebar
2. `frontend/js/sidebar.js` - Script para cargar el sidebar dinámicamente

## Cómo actualizar cada página HTML

Para cada archivo HTML en `frontend/pages/`, sigue estos pasos:

### 1. Eliminar el sidebar existente

**ANTES:**
```html
<div class="dashboard-wrapper">
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <i class="fas fa-tools fa-2x mb-2"></i>
            <h4>Multiservicios</h4>
        </div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.html"><i class="fas fa-home"></i> Dashboard</a></li>
            <!-- ... más elementos del menú ... -->
        </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content">
```

**DESPUÉS:**
```html
<div class="dashboard-wrapper">
    <!-- El sidebar se cargará dinámicamente -->

    <!-- Main Content -->
    <div class="main-content">
```

### 2. Agregar el script de sidebar

En la sección de scripts (antes del cierre de `</body>`), agrega `sidebar.js` DESPUÉS de `auth.js`:

**ANTES:**
```html
<script src="../js/config.js"></script>
<script src="../js/auth.js"></script>
<script src="../js/api.js"></script>
<script src="../js/[nombre-pagina].js"></script>
</body>
```

**DESPUÉS:**
```html
<script src="../js/config.js"></script>
<script src="../js/auth.js"></script>
<script src="../js/sidebar.js"></script>  <!-- NUEVO -->
<script src="../js/api.js"></script>
<script src="../js/[nombre-pagina].js"></script>
</body>
```

### 3. Eliminar código de toggle del sidebar en cada JS

En los archivos JavaScript de cada página, **ELIMINA** estas líneas:

```javascript
// ELIMINAR ESTO:
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

// ELIMINAR ESTO:
if (user.rol !== 'ADMIN') {
    document.getElementById('menuUsuarios').style.display = 'none';
}
```

El script `sidebar.js` ya maneja estas funcionalidades automáticamente.

## Archivos a actualizar

- [ ] dashboard.html
- [ ] pedidos.html
- [ ] clientes.html
- [ ] ordenes.html
- [ ] presupuestos.html
- [ ] facturas.html
- [ ] usuarios.html
- [ ] reportes.html

## Ventajas

✅ Un solo lugar para modificar el menú
✅ Menos duplicación de código
✅ Más fácil mantenimiento
✅ El elemento activo se marca automáticamente
✅ El toggle para móviles funciona automáticamente
✅ El menú de usuarios se oculta automáticamente para no-admin

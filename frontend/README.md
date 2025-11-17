# Sistema Multiservicios - Frontend

Aplicación web SPA (Single Page Application) para la gestión integral de servicios multiples. Sistema desarrollado con HTML5, CSS3, JavaScript vanilla y Bootstrap 5.

## Características

- Autenticación JWT con gestión de tokens
- Dashboard con estadísticas en tiempo real
- Gestión completa de Clientes (CRUD)
- Gestión completa de Pedidos (CRUD)
- Módulos para Órdenes de Trabajo, Presupuestos y Facturas
- Gestión de Usuarios (solo para ADMIN)
- Reportes y estadísticas
- Diseño responsive con Bootstrap 5
- Interfaz moderna con Font Awesome icons

## Requisitos Previos

1. Servidor backend Spring Boot ejecutándose en `http://localhost:8081`
2. Base de datos MySQL configurada y poblada
3. Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Estructura del Proyecto

```
frontend/
├── index.html              # Página de login
├── css/
│   └── styles.css         # Estilos personalizados
├── js/
│   ├── config.js          # Configuración API
│   ├── auth.js            # Servicio de autenticación
│   ├── api.js             # Servicios API (Cliente, Pedido, Usuario, etc)
│   ├── dashboard.js       # Lógica del dashboard
│   ├── clientes.js        # Gestión de clientes
│   └── pedidos.js         # Gestión de pedidos
└── pages/
    ├── dashboard.html     # Panel principal
    ├── clientes.html      # Gestión de clientes
    ├── pedidos.html       # Gestión de pedidos
    ├── ordenes.html       # Órdenes de trabajo
    ├── presupuestos.html  # Presupuestos
    ├── facturas.html      # Facturas
    ├── usuarios.html      # Gestión de usuarios
    └── reportes.html      # Reportes
```

## Instalación y Configuración

### 1. Verificar Backend

Asegúrese de que el servidor backend está ejecutándose:

```bash
cd C:\java\multiservicios
mvn spring-boot:run
```

El servidor debe estar disponible en `http://localhost:8081`

### 2. Configurar URL del API

Edite el archivo `js/config.js` si necesita cambiar la URL del backend:

```javascript
const CONFIG = {
    API_URL: 'http://localhost:8081/api',  // Cambiar si es necesario
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data'
};
```

### 3. Abrir la Aplicación

Simplemente abra el archivo `index.html` en su navegador web, o utilice un servidor local:

**Opción 1: Abrir directamente**
```
Doble clic en: C:\java\multiservicios\frontend\index.html
```

**Opción 2: Servidor local con Python**
```bash
cd C:\java\multiservicios\frontend
python -m http.server 8080
```
Luego abra: `http://localhost:8080`

**Opción 3: Servidor local con Node.js**
```bash
cd C:\java\multiservicios\frontend
npx http-server -p 8080
```
Luego abra: `http://localhost:8080`

## Credenciales de Acceso

### Usuario Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** ADMIN (acceso completo)

### Usuario Técnico
- **Usuario:** `tecnico1`
- **Contraseña:** `admin123`
- **Rol:** TECNICO

### Usuario Recepcionista
- **Usuario:** `recepcion1`
- **Contraseña:** `admin123`
- **Rol:** RECEPCIONISTA

## Uso de la Aplicación

### Login

1. Ingrese su usuario y contraseña
2. (Opcional) Marque "Recordarme" para mantener la sesión
3. Click en "Iniciar Sesión"
4. Será redirigido al Dashboard automáticamente

### Dashboard

El dashboard muestra:
- Total de Pedidos Activos
- Total de Clientes Registrados
- Órdenes en Proceso
- Facturas del Mes
- Pedidos Recientes con acciones rápidas
- Alertas y notificaciones

### Gestión de Clientes

**Crear Cliente:**
1. Click en "Nuevo Cliente"
2. Seleccione tipo de cliente (PERSONA o EMPRESA)
3. Complete los campos obligatorios (nombre, teléfono)
4. Si es EMPRESA, ingrese la razón social
5. Click en "Guardar"

**Editar Cliente:**
1. Click en el botón de editar (ícono lápiz)
2. Modifique los campos necesarios
3. Click en "Guardar"

**Eliminar Cliente:**
1. Click en el botón de eliminar (ícono papelera)
2. Confirme la eliminación

**Buscar Clientes:**
- Use el campo de búsqueda para filtrar por nombre, apellido, RUC/CI o teléfono

### Gestión de Pedidos

**Crear Pedido:**
1. Click en "Nuevo Pedido"
2. Seleccione el cliente del dropdown
3. Seleccione la categoría del servicio
4. Elija el canal de recepción (PRESENCIAL, TELEFONO, EMAIL, WEB)
5. Establezca la prioridad (BAJA, MEDIA, ALTA)
6. Defina el estado inicial (NUEVO, EN_PROCESO, COMPLETADO, CANCELADO)
7. Ingrese la descripción del pedido
8. (Opcional) Agregue observaciones
9. Click en "Guardar"

**Editar Pedido:**
1. Click en el botón de editar
2. Modifique los campos necesarios
3. Click en "Guardar"

**Filtrar Pedidos:**
- Use el campo de búsqueda para buscar por número de pedido o cliente
- Filtre por Estado usando el dropdown
- Filtre por Prioridad usando el dropdown
- Los filtros se aplican en tiempo real

### Navegación

- Use el menú lateral para navegar entre módulos
- El menú "Usuarios" solo es visible para usuarios con rol ADMIN
- Click en su avatar para ver información de usuario
- Use "Cerrar Sesión" para salir de forma segura

## Características de Seguridad

1. **Autenticación JWT:** Todos los requests al backend incluyen el token JWT
2. **Validación de Tokens:** Los tokens expirados redirigen automáticamente al login
3. **Control de Acceso:** El menú de usuarios solo es visible para ADMIN
4. **Logout Seguro:** Elimina tokens y datos de usuario del localStorage
5. **Protección de Rutas:** Verifica autenticación antes de cargar páginas

## Solución de Problemas

### Error: "Error al cargar [módulo]"

**Causa:** El servidor backend no está respondiendo

**Solución:**
1. Verifique que el backend esté ejecutándose en `http://localhost:8081`
2. Revise la consola del navegador (F12) para ver errores específicos
3. Verifique la configuración CORS en el backend

### Error: "Usuario o contraseña incorrectos"

**Causa:** Credenciales inválidas o hash de contraseña incorrecto

**Solución:**
1. Verifique las credenciales (ver sección "Credenciales de Acceso")
2. Si persiste, ejecute el script SQL: `update_passwords.sql`

### Error: "Token expirado"

**Causa:** El token JWT ha expirado (24 horas por defecto)

**Solución:**
1. Cierre sesión y vuelva a iniciar sesión
2. El sistema redirige automáticamente al login

### No se cargan los estilos

**Causa:** Rutas incorrectas o servidor local necesario

**Solución:**
1. Use un servidor local (Python o Node.js)
2. Verifique que todas las rutas en HTML sean relativas correctamente

## API Endpoints Utilizados

```
POST   /api/auth/login              # Autenticación
GET    /api/clientes                # Listar clientes
POST   /api/clientes                # Crear cliente
GET    /api/clientes/{id}           # Obtener cliente
PUT    /api/clientes/{id}           # Actualizar cliente
DELETE /api/clientes/{id}           # Eliminar cliente
GET    /api/pedidos                 # Listar pedidos
POST   /api/pedidos                 # Crear pedido
GET    /api/pedidos/{id}            # Obtener pedido
PUT    /api/pedidos/{id}            # Actualizar pedido
DELETE /api/pedidos/{id}            # Eliminar pedido
GET    /api/categorias              # Listar categorías
GET    /api/usuarios                # Listar usuarios
```

## Tecnologías Utilizadas

- **HTML5:** Estructura semántica
- **CSS3:** Estilos personalizados con variables CSS
- **JavaScript ES6+:** Lógica de la aplicación (async/await, fetch API)
- **Bootstrap 5.3.0:** Framework CSS responsive
- **Font Awesome 6.4.0:** Iconografía
- **JWT:** Autenticación y autorización

## Características Técnicas

- **SPA:** Single Page Application sin frameworks pesados
- **Responsive Design:** Adaptable a móviles, tablets y desktop
- **API REST:** Comunicación con backend mediante fetch API
- **LocalStorage:** Persistencia de tokens y datos de usuario
- **Modular:** Código organizado en servicios reutilizables
- **Validación:** Validación HTML5 en formularios
- **UX/UI:** Feedback visual inmediato (spinners, alertas, confirmaciones)

## Soporte

Para reportar problemas o solicitar características:
1. Revise la consola del navegador (F12) para errores
2. Verifique los logs del backend
3. Consulte la documentación del API backend

## Licencia

Sistema desarrollado para uso interno de Multiservicios.

---

**Versión:** 1.0.0
**Última actualización:** Noviembre 2025

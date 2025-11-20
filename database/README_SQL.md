# SCRIPT SQL COMPLETO - SISTEMA MULTISERVICIOS
## Base de Datos Lista para Usar

---

## 📋 DESCRIPCIÓN

Este archivo contiene el **dump completo** de la base de datos `multiservices_db` con:

✅ Estructura completa de todas las tablas  
✅ Todas las relaciones (Foreign Keys)  
✅ Índices y constraints  
✅ Datos de prueba precargados  
✅ Usuarios de ejemplo con contraseñas encriptadas  
✅ Triggers y procedimientos almacenados (si existen)

---

## 🚀 INSTRUCCIONES DE USO

### Opción 1: Desde MySQL Workbench (RECOMENDADO)

1. Abrir MySQL Workbench
2. Conectarse al servidor MySQL
3. Ir a: **Server** → **Data Import**
4. Seleccionar: **Import from Self-Contained File**
5. Buscar el archivo: `multiservicios_completo.sql`
6. Click en **Start Import**
7. Esperar a que termine la importación

### Opción 2: Desde línea de comandos

```bash
# Ejecutar el script completo
mysql -u root -p < multiservicios_completo.sql

# O especificando el usuario
mysql -u tu_usuario -p < multiservicios_completo.sql
```

### Opción 3: Desde phpMyAdmin

1. Abrir phpMyAdmin
2. Ir a la pestaña **Importar**
3. Click en **Seleccionar archivo**
4. Elegir `multiservicios_completo.sql`
5. Click en **Continuar**

---

## ⚙️ CONFIGURACIÓN POST-INSTALACIÓN

### 1. Verificar la base de datos

```sql
-- Verificar que la base de datos se creó
SHOW DATABASES LIKE 'multiservices_db';

-- Usar la base de datos
USE multiservices_db;

-- Ver todas las tablas
SHOW TABLES;

-- Verificar cantidad de registros
SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos;
```

### 2. Crear usuario de aplicación (si no existe)

```sql
-- Crear usuario para la aplicación
CREATE USER IF NOT EXISTS 'multiservices_user'@'localhost' 
IDENTIFIED BY 'MultiServ2024!';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON multiservices_db.* 
TO 'multiservices_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## 👤 CREDENCIALES DE PRUEBA

Una vez importada la base de datos, puedes usar estas credenciales para acceder al sistema:

### Usuario Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** ADMIN
- **Permisos:** Acceso completo a todos los módulos

### Usuario Técnico
- **Usuario:** `tecnico1`
- **Contraseña:** `admin123`
- **Rol:** TECNICO
- **Permisos:** Órdenes de trabajo, repuestos

### Usuario Recepcionista
- **Usuario:** `recepcion1`
- **Contraseña:** `admin123`
- **Rol:** RECEPCIONISTA
- **Permisos:** Clientes, pedidos

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Tablas Principales

| Tabla | Descripción | Registros Aprox. |
|-------|-------------|------------------|
| `usuarios` | Usuarios del sistema | 3-5 |
| `clientes` | Clientes (personas y empresas) | 10-20 |
| `pedidos` | Pedidos de servicio | 15-30 |
| `ordenes_trabajo` | Órdenes de trabajo | 10-25 |
| `repuestos` | Inventario de repuestos | 20-50 |
| `facturas` | Facturas emitidas | 10-20 |
| `presupuestos` | Presupuestos generados | 5-15 |
| `proveedores` | Proveedores de repuestos | 5-10 |
| `tecnicos` | Técnicos del taller | 3-5 |
| `categorias_servicio` | Categorías de servicios | 5-10 |

### Relaciones Principales

```
clientes (1) ──→ (N) pedidos
pedidos (1) ──→ (1) ordenes_trabajo
ordenes_trabajo (N) ──→ (1) tecnicos
ordenes_trabajo (N) ──→ (M) repuestos
ordenes_trabajo (1) ──→ (1) facturas
```

---

## ✅ VERIFICACIÓN DE INSTALACIÓN

Ejecutar estas consultas para verificar que todo se instaló correctamente:

```sql
USE multiservices_db;

-- 1. Verificar tablas
SELECT COUNT(*) as total_tablas 
FROM information_schema.tables 
WHERE table_schema = 'multiservices_db';

-- 2. Verificar usuarios
SELECT username, rol, activo FROM usuarios;

-- 3. Verificar clientes
SELECT COUNT(*) as total_clientes FROM clientes;

-- 4. Verificar pedidos
SELECT COUNT(*) as total_pedidos FROM pedidos;

-- 5. Verificar relaciones (Foreign Keys)
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'multiservices_db'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Access denied for user"
**Solución:** Verificar que el usuario MySQL tenga permisos suficientes
```sql
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Database already exists"
**Solución:** El script ya incluye `DROP DATABASE IF EXISTS`, pero si persiste:
```sql
DROP DATABASE IF EXISTS multiservices_db;
```
Luego volver a ejecutar el script.

### Error: "Unknown database"
**Solución:** Asegurarse de ejecutar el script completo, no línea por línea.

### Error: "Table doesn't exist"
**Solución:** Verificar que el script se ejecutó completamente sin errores.

---

## 📝 NOTAS IMPORTANTES

1. **Contraseñas:** Todas las contraseñas están encriptadas con BCrypt
2. **Datos de prueba:** Los datos incluidos son ficticios para demostración
3. **Versión MySQL:** Compatible con MySQL 8.0+
4. **Charset:** UTF-8 (utf8mb4_unicode_ci)
5. **Motor:** InnoDB para todas las tablas

---

## 🔄 ACTUALIZACIÓN DE DATOS

Si necesitas resetear la base de datos a su estado inicial:

```bash
# Eliminar y recrear
mysql -u root -p -e "DROP DATABASE IF EXISTS multiservices_db;"
mysql -u root -p < multiservicios_completo.sql
```

---

## 📞 SOPORTE

Si tienes problemas con la importación:

1. Verificar versión de MySQL: `mysql --version`
2. Verificar que el archivo SQL no esté corrupto
3. Revisar los logs de MySQL para errores específicos
4. Asegurarse de tener permisos de escritura en el servidor MySQL

---

**Archivo generado:** 19 de Noviembre de 2025  
**Versión de la base de datos:** 1.0.0  
**Compatible con:** MySQL 8.0+

---

## ⚡ INICIO RÁPIDO (RESUMEN)

```bash
# 1. Importar base de datos
mysql -u root -p < multiservicios_completo.sql

# 2. Verificar instalación
mysql -u root -p -e "USE multiservices_db; SHOW TABLES;"

# 3. Iniciar aplicación backend
cd C:\java\multiservicios
mvn spring-boot:run

# 4. Abrir frontend
# Navegar a: http://localhost:8082
# Usuario: admin / Contraseña: admin123
```

¡Listo para usar! 🎉

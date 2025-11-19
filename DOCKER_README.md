# GUÍA RÁPIDA - DOCKER
## Sistema Multiservicios

---

## 🚀 INICIO RÁPIDO

### Requisitos Previos
- Docker Desktop instalado y corriendo
- 4 GB RAM disponible
- Puertos 3306, 8081, 8082 libres

### Comandos Básicos

**1. Compilar el proyecto:**
```bash
mvn clean package -DskipTests
```

**2. Iniciar todo el sistema:**
```bash
docker-compose up -d
```

**3. Ver logs:**
```bash
docker-compose logs -f
```

**4. Detener el sistema:**
```bash
docker-compose down
```

**5. Detener y eliminar datos:**
```bash
docker-compose down -v
```

---

## 🌐 ACCEDER AL SISTEMA

Una vez iniciado, acceder a:

- **Frontend:** http://localhost:8082
- **Backend API:** http://localhost:8081/api
- **Base de Datos:** localhost:3306

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## 📊 COMANDOS ÚTILES

### Ver estado de contenedores:
```bash
docker-compose ps
```

### Ver logs de un servicio específico:
```bash
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### Reiniciar un servicio:
```bash
docker-compose restart backend
```

### Reconstruir imágenes:
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Ejecutar comandos dentro de un contenedor:
```bash
# Acceder a MySQL
docker-compose exec mysql mysql -u root -proot123 multiservices_db

# Ver logs del backend
docker-compose exec backend cat /app/logs/application.log
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "port is already allocated"
**Solución:** Cambiar el puerto en docker-compose.yml o detener el servicio que usa ese puerto

### Error: "no space left on device"
**Solución:** Limpiar imágenes y contenedores no usados
```bash
docker system prune -a
```

### Backend no se conecta a MySQL
**Solución:** Esperar a que MySQL esté listo (puede tomar 30-60 segundos)
```bash
docker-compose logs mysql
```

### Frontend no carga
**Solución:** Verificar que los archivos estén en la carpeta frontend/
```bash
docker-compose exec frontend ls /usr/share/nginx/html
```

---

## 📦 PARA PRODUCCIÓN

### Usar variables de entorno:
Crear archivo `.env`:
```env
MYSQL_ROOT_PASSWORD=tu_password_seguro
MYSQL_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_largo_y_seguro
```

### Actualizar docker-compose.yml:
```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
  MYSQL_PASSWORD: ${MYSQL_PASSWORD}
```

---

## 🎯 VENTAJAS DE USAR DOCKER

✅ **Portabilidad:** Funciona igual en cualquier sistema
✅ **Aislamiento:** No afecta tu sistema principal
✅ **Fácil de compartir:** Un comando y todo funciona
✅ **Producción:** Mismo ambiente en desarrollo y producción
✅ **Escalable:** Fácil de replicar y escalar

---

**Última actualización:** 19 de Noviembre de 2025

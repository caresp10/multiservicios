# CI/CD con GitHub Actions y Docker
## Despliegue Automático

---

## 🚀 ¿Qué es CI/CD?

**CI/CD** = Continuous Integration / Continuous Deployment

**Significa:**
- Cada vez que haces `git push`
- GitHub compila automáticamente tu proyecto
- Crea una imagen Docker
- La sube a Docker Hub
- Cualquier servidor puede descargarla y ejecutarla

---

## 📋 CONFIGURACIÓN INICIAL (Una sola vez)

### Paso 1: Crear cuenta en Docker Hub

1. Ir a: https://hub.docker.com/
2. Crear cuenta gratuita
3. Crear un repositorio: `multiservicios`
4. Anotar tu username de Docker Hub

### Paso 2: Configurar Secrets en GitHub

1. Ir a tu repositorio: https://github.com/caresp10/multiservicios
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agregar estos secrets:

**Secret 1:**
- Name: `DOCKER_USERNAME`
- Value: `tu-username-de-dockerhub`

**Secret 2:**
- Name: `DOCKER_PASSWORD`
- Value: `tu-password-de-dockerhub`

### Paso 3: Activar GitHub Actions

El archivo `.github/workflows/docker-build.yml` ya está creado.
GitHub Actions se activará automáticamente en el próximo push.

---

## 🔄 FLUJO DE TRABAJO AUTOMÁTICO

### Cada vez que hagas cambios:

```bash
# 1. Editas tu código
# Ejemplo: modificas ClienteController.java

# 2. Commit y push
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin master

# 3. GitHub Actions automáticamente:
#    ✅ Compila el proyecto con Maven
#    ✅ Ejecuta tests (opcional)
#    ✅ Crea imagen Docker
#    ✅ Sube a Docker Hub
#    ✅ Notifica si hay errores

# 4. En cualquier servidor:
docker pull tu-username/multiservicios:latest
docker-compose up -d
```

---

## 🖥️ DESPLEGAR EN CUALQUIER SERVIDOR

### Opción A: Servidor con Docker instalado

**docker-compose-production.yml:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: multiservices_db
      MYSQL_USER: multiservices_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - multiservicios-network

  backend:
    image: tu-username/multiservicios:latest  # ← Imagen desde Docker Hub
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/multiservices_db
      SPRING_DATASOURCE_USERNAME: multiservices_user
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "8081:8081"
    depends_on:
      - mysql
    networks:
      - multiservicios-network

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
    ports:
      - "80:80"
    networks:
      - multiservicios-network

volumes:
  mysql_data:

networks:
  multiservicios-network:
```

**Desplegar:**
```bash
# En el servidor
docker-compose -f docker-compose-production.yml pull
docker-compose -f docker-compose-production.yml up -d
```

### Opción B: Actualización automática con Watchtower

**Agregar a docker-compose-production.yml:**
```yaml
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300  # Revisa cada 5 minutos
```

**Resultado:**
- Watchtower revisa Docker Hub cada 5 minutos
- Si hay nueva versión, la descarga automáticamente
- Reinicia el contenedor con la nueva versión
- ✅ **Despliegue 100% automático**

---

## 📊 VER EL PROGRESO

### En GitHub:

1. Ir a tu repositorio
2. Click en pestaña **Actions**
3. Ver el progreso de cada build
4. Ver logs si hay errores

### En Docker Hub:

1. Ir a: https://hub.docker.com/
2. Ver tus imágenes
3. Ver tags (latest, versiones específicas)

---

## 🎯 VENTAJAS DE ESTE ENFOQUE

✅ **Automático:** Push y olvídate
✅ **Versionado:** Cada commit tiene su imagen
✅ **Rollback fácil:** Volver a versión anterior
✅ **Portable:** Funciona en cualquier servidor
✅ **Profesional:** Estándar de la industria
✅ **Gratis:** GitHub Actions + Docker Hub gratis

---

## 🔧 COMANDOS ÚTILES

### Desplegar versión específica:
```bash
# Usar un commit específico
docker pull tu-username/multiservicios:abc123def

# Usar siempre la última
docker pull tu-username/multiservicios:latest
```

### Ver todas las versiones:
```bash
docker images tu-username/multiservicios
```

### Actualizar a la última versión:
```bash
docker-compose pull
docker-compose up -d
```

---

## 📋 FLUJO COMPLETO

```
┌─────────────────┐
│  Editas código  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   git push      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  GitHub Actions         │
│  - Compila Maven        │
│  - Crea imagen Docker   │
│  - Sube a Docker Hub    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Docker Hub             │
│  (imagen disponible)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Cualquier Servidor     │
│  docker pull + up       │
│  ✅ Sistema actualizado │
└─────────────────────────┘
```

---

## 🎓 PARA TU EXAMEN

Puedes mencionar:

> "El proyecto implementa CI/CD con GitHub Actions. Cada commit automáticamente compila, testea y genera una imagen Docker que se publica en Docker Hub. Esto permite despliegue automático en cualquier servidor con un simple `docker pull`."

**Esto demuestra:**
- ✅ Conocimiento de DevOps
- ✅ Automatización
- ✅ Buenas prácticas profesionales
- ✅ Proyecto production-ready

---

## 🚀 PRÓXIMOS PASOS

1. **Crear cuenta en Docker Hub** (gratis)
2. **Configurar secrets en GitHub**
3. **Hacer un push** para probar
4. **Ver el build en GitHub Actions**
5. **Descargar imagen desde cualquier PC**

¿Quieres que te ayude a configurar esto paso a paso?

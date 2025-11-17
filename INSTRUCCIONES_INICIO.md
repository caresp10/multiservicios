# Instrucciones para Iniciar el Sistema Multiservicios

## Método 1: Script Automático (MÁS FÁCIL)

### Iniciar Todo con un Solo Click

1. Doble click en: `start-all.bat`
2. Se abrirán 2 ventanas:
   - Una para el **Backend** (Spring Boot en puerto 8081)
   - Una para el **Frontend** (Python Server en puerto 8080)
3. El navegador se abrirá automáticamente en `http://localhost:8082`
4. **NO CIERRES** las ventanas mientras uses el sistema

### Crear Acceso Directo en el Escritorio

1. Click derecho en `start-all.bat`
2. Selecciona "Enviar a" → "Escritorio (crear acceso directo)"
3. Ahora puedes iniciar todo desde tu escritorio

---

## Método 2: Scripts Individuales

### Iniciar Backend
- Doble click en: `start-backend.bat`
- Espera a ver el mensaje: "Started MultiservicesApplication"

### Iniciar Frontend
- Doble click en: `start-frontend.bat`
- Verá: "Serving HTTP on :: port 8080"

### Abrir la Aplicación
- Abre tu navegador en: `http://localhost:8080`

---

## Método 3: Inicio Automático con Windows

### Para que inicie automáticamente al encender la PC:

1. Presiona `Windows + R`
2. Escribe: `shell:startup` y presiona Enter
3. Se abrirá la carpeta de inicio
4. Crea un acceso directo de `start-all.bat` en esa carpeta
5. Ahora el sistema iniciará automáticamente al encender Windows

---

## Método 4: Como Servicio de Windows (Producción)

Para un servidor en producción, puedes instalar el backend como servicio:

### Backend como Servicio

1. Compila el JAR:
   ```
   mvnw clean package
   ```

2. Instala como servicio con NSSM (Non-Sucking Service Manager):
   - Descarga NSSM: https://nssm.cc/download
   - Ejecuta: `nssm install MultiservicesBackend`
   - Path: `C:\Program Files\Java\jdk-21\bin\java.exe`
   - Arguments: `-jar C:\java\multiservicios\target\multiservices-1.0.0.jar`
   - Startup directory: `C:\java\multiservicios`

### Frontend con IIS o Apache

Para producción, sirve el frontend con IIS o Apache en lugar de Python.

---

## Credenciales de Acceso

- **Usuario:** admin
- **Contraseña:** admin123

---

## Verificar que Todo Funciona

1. Backend: Abre `http://localhost:8081` (deberías ver un error 403 - es normal)
2. Frontend: Abre `http://localhost:8082` (deberías ver la pantalla de login)
3. API: Prueba `http://localhost:8081/api/auth/login` con Postman

---

## Detener los Servidores

- Cierra las ventanas de comando (Backend y Frontend)
- O presiona `Ctrl + C` en cada ventana

---

## Solución de Problemas

### Puerto 8081 ya está en uso
```
netstat -ano | findstr :8081
taskkill /F /PID [número_del_PID]
```

### Puerto 8080 ya está en uso
Edita `start-frontend.bat` y cambia 8080 por otro puerto (ej: 8082)

### Python no está instalado
- Descarga Python: https://www.python.org/downloads/
- Marca "Add Python to PATH" durante la instalación
- O usa Node.js: `npx http-server -p 8081` en la carpeta frontend

---

## URLs Importantes

- **Aplicación Web:** http://localhost:8082
- **API Backend:** http://localhost:8081/api
- **Base de Datos:** localhost:3306 (phpMyAdmin)

---

## Estructura de Archivos

```
C:\java\multiservicios\
├── start-all.bat           ← USAR ESTE para iniciar todo
├── start-backend.bat       ← Solo backend
├── start-frontend.bat      ← Solo frontend
├── INSTRUCCIONES_INICIO.md ← Este archivo
└── frontend\
    └── index.html          ← Página de login
```

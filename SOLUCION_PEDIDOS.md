# Solución al Problema de Visualización de Pedidos

## Diagnóstico del Problema

El pedido se guarda en la base de datos pero no se visualiza en la tabla. Posibles causas:

1. **Error en la consola del navegador** - Revisar F12 Developer Tools
2. **Problema con la estructura de datos del pedido**
3. **Error al renderizar la tabla**

## Pasos para Diagnosticar

### 1. Abrir la Consola del Navegador
- Presiona F12
- Ve a la pestaña "Console"
- Recarga la página de pedidos
- Busca errores en rojo

### 2. Verificar la Respuesta del API
En la consola, ejecuta:
```javascript
PedidoService.getAll().then(response => console.log(response))
```

Deberías ver algo como:
```json
{
  "success": true,
  "message": "Lista de pedidos",
  "data": [...]
}
```

### 3. Verificar que el pedido tiene todos los campos necesarios

El renderizado espera estos campos:
- `numeroPedido`
- `cliente.nombre` y `cliente.apellido`
- `categoria.nombre`
- `descripcion`
- `canal`
- `prioridad`
- `estado`
- `fechaPedido`
- `idPedido`

## Solución Rápida

Agrega console.log temporal en pedidos.js para debug:

```javascript
async function cargarPedidos() {
    const table = document.getElementById('pedidosTable');

    try {
        const response = await PedidoService.getAll();
        console.log('Respuesta completa:', response); // DEBUG

        if (response.success && response.data) {
            pedidos = response.data;
            console.log('Pedidos cargados:', pedidos); // DEBUG
            renderPedidos(pedidos);
        } else {
            throw new Error(response.message || 'Error al cargar pedidos');
        }
    } catch (error) {
        console.error('Error detallado:', error); // DEBUG
        // ... resto del código
    }
}
```

## Verifica en la Base de Datos

Ejecuta esta query SQL:
```sql
SELECT * FROM pedidos ORDER BY id_pedido DESC LIMIT 1;
```

Revisa que:
- `id_cliente` tiene un valor válido
- `id_categoria` tiene un valor válido (puede ser NULL)
- `numero_pedido` no es NULL
- Todos los campos requeridos tienen valores

## Posible Solución

Si el problema es que `categoria` es NULL, actualiza el renderizado para manejar mejor este caso (línea 77 de pedidos.js).

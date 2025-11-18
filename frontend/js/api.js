// Servicio genérico para llamadas a la API
class ApiService {
    static async request(endpoint, options = {}) {
        const token = AuthService.getToken();

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const config = { ...defaultOptions, ...options };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}${endpoint}`, config);
            const data = await response.json();

            if (response.status === 401) {
                AuthService.logout();
                throw new Error('Sesión expirada');
            }

            return data;
        } catch (error) {
            console.error('Error en la petición:', error);
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    }

    static put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Servicios específicos
class ClienteService {
    static getAll() {
        return ApiService.get('/clientes');
    }

    static getActivos() {
        return ApiService.get('/clientes/activos');
    }

    static getById(id) {
        return ApiService.get(`/clientes/${id}`);
    }

    static create(cliente) {
        return ApiService.post('/clientes', cliente);
    }

    static update(id, cliente) {
        return ApiService.put(`/clientes/${id}`, cliente);
    }

    static delete(id) {
        return ApiService.delete(`/clientes/${id}`);
    }
}

class PedidoService {
    static getAll() {
        return ApiService.get('/pedidos');
    }

    static getById(id) {
        return ApiService.get(`/pedidos/${id}`);
    }

    static create(pedido) {
        return ApiService.post('/pedidos', pedido);
    }

    static update(id, pedido) {
        return ApiService.put(`/pedidos/${id}`, pedido);
    }

    static delete(id) {
        return ApiService.delete(`/pedidos/${id}`);
    }

    static getByEstado(estado) {
        return ApiService.get(`/pedidos/estado/${estado}`);
    }
}

class UsuarioService {
    static getAll() {
        return ApiService.get('/usuarios');
    }

    static getById(id) {
        return ApiService.get(`/usuarios/${id}`);
    }

    static create(usuario) {
        return ApiService.post('/usuarios', usuario);
    }

    static update(id, usuario) {
        return ApiService.put(`/usuarios/${id}`, usuario);
    }
}

class CategoriaService {
    static getAll() {
        return ApiService.get('/categorias');
    }

    static getActivas() {
        return ApiService.get('/categorias/activas');
    }

    static getById(id) {
        return ApiService.get(`/categorias/${id}`);
    }

    static create(categoria) {
        return ApiService.post('/categorias', categoria);
    }

    static update(id, categoria) {
        return ApiService.put(`/categorias/${id}`, categoria);
    }

    static delete(id) {
        return ApiService.delete(`/categorias/${id}`);
    }
}

class OrdenTrabajoService {
    static getAll() {
        return ApiService.get('/ordenes-trabajo');
    }

    static getById(id) {
        return ApiService.get(`/ordenes-trabajo/${id}`);
    }

    static create(ordenTrabajo) {
        return ApiService.post('/ordenes-trabajo', ordenTrabajo);
    }

    static update(id, ordenTrabajo) {
        return ApiService.put(`/ordenes-trabajo/${id}`, ordenTrabajo);
    }

    static delete(id) {
        return ApiService.delete(`/ordenes-trabajo/${id}`);
    }

    static getByEstado(estado) {
        return ApiService.get(`/ordenes-trabajo/estado/${estado}`);
    }

    static getByTecnico(idTecnico) {
        return ApiService.get(`/ordenes-trabajo/tecnico/${idTecnico}`);
    }
}

class FacturaService {
    static getAll() {
        return ApiService.get('/facturas');
    }

    static getById(id) {
        return ApiService.get(`/facturas/${id}`);
    }

    static create(factura) {
        return ApiService.post('/facturas', factura);
    }

    static update(id, factura) {
        return ApiService.put(`/facturas/${id}`, factura);
    }

    static delete(id) {
        return ApiService.delete(`/facturas/${id}`);
    }

    static getByEstado(estado) {
        return ApiService.get(`/facturas/estado/${estado}`);
    }

    static getByCliente(idCliente) {
        return ApiService.get(`/facturas/cliente/${idCliente}`);
    }

    static getDatosParaFacturar(idOt) {
        return ApiService.get(`/facturas/datos-facturacion/ot/${idOt}`);
    }
}

class PresupuestoService {
    static getAll() {
        return ApiService.get('/presupuestos');
    }

    static getById(id) {
        return ApiService.get(`/presupuestos/${id}`);
    }

    static create(presupuesto) {
        return ApiService.post('/presupuestos', presupuesto);
    }

    static update(id, presupuesto) {
        return ApiService.put(`/presupuestos/${id}`, presupuesto);
    }

    static delete(id) {
        return ApiService.delete(`/presupuestos/${id}`);
    }

    static getByEstado(estado) {
        return ApiService.get(`/presupuestos/estado/${estado}`);
    }

    static getPresupuestosAceptadosPorPedido(idPedido) {
        return ApiService.get(`/presupuestos/pedido/${idPedido}/aceptados`);
    }
}

class TecnicoService {
    static getAll() {
        return ApiService.get('/tecnicos');
    }

    static getActivos() {
        return ApiService.get('/tecnicos/activos');
    }

    static getById(id) {
        return ApiService.get(`/tecnicos/${id}`);
    }

    static getByUsuarioId(idUsuario) {
        return ApiService.get(`/tecnicos/por-usuario/${idUsuario}`);
    }

    static create(tecnico) {
        return ApiService.post('/tecnicos', tecnico);
    }

    static update(id, tecnico) {
        return ApiService.put(`/tecnicos/${id}`, tecnico);
    }

    static delete(id) {
        return ApiService.delete(`/tecnicos/${id}`);
    }
}

class ServicioCatalogoService {
    static getAll() {
        return ApiService.get('/servicios-catalogo');
    }

    static getActivos() {
        return ApiService.get('/servicios-catalogo/activos');
    }

    static getById(id) {
        return ApiService.get(`/servicios-catalogo/${id}`);
    }

    static getByCategoria(idCategoria) {
        return ApiService.get(`/servicios-catalogo/categoria/${idCategoria}`);
    }

    static create(servicio) {
        return ApiService.post('/servicios-catalogo', servicio);
    }

    static update(id, servicio) {
        return ApiService.put(`/servicios-catalogo/${id}`, servicio);
    }

    static delete(id) {
        return ApiService.delete(`/servicios-catalogo/${id}`);
    }

    static getHistorico(id) {
        return ApiService.get(`/servicios-catalogo/${id}/historico-precios`);
    }
}

class RepuestoService {
    static getAll() {
        return ApiService.get('/repuestos');
    }

    static getActivos() {
        return ApiService.get('/repuestos/activos');
    }

    static getById(id) {
        return ApiService.get(`/repuestos/${id}`);
    }

    static getStockBajo() {
        return ApiService.get('/repuestos/stock-bajo');
    }

    static getByCategoria(idCategoria) {
        return ApiService.get(`/repuestos/categoria/${idCategoria}`);
    }

    static create(repuesto) {
        return ApiService.post('/repuestos', repuesto);
    }

    static update(id, repuesto) {
        return ApiService.put(`/repuestos/${id}`, repuesto);
    }

    static delete(id) {
        return ApiService.delete(`/repuestos/${id}`);
    }

    static ajustarStock(id, ajusteData) {
        return ApiService.put(`/repuestos/${id}/ajustar-stock`, ajusteData);
    }

    static getHistorico(id) {
        return ApiService.get(`/repuestos/${id}/historico-precios`);
    }

    static getMovimientos(id) {
        return ApiService.get(`/repuestos/${id}/movimientos-stock`);
    }
}

-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: multiservices_db
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `multiservices_db`
--

/*!40000 DROP DATABASE IF EXISTS `multiservices_db`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `multiservices_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `multiservices_db`;

--
-- Table structure for table `categorias_servicio`
--

DROP TABLE IF EXISTS `categorias_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_servicio` (
  `id_categoria` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_servicio`
--

LOCK TABLES `categorias_servicio` WRITE;
/*!40000 ALTER TABLE `categorias_servicio` DISABLE KEYS */;
INSERT INTO `categorias_servicio` VALUES (1,'Electricidad','Servicios eléctricos generales, instalaciones y reparaciones',1),(2,'Plomería','Servicios de plomería y sanitarios',1),(3,'Herrería','Trabajos en metal, soldadura y herrería',1),(4,'Informática','Soporte técnico, reparación de equipos y servicios IT',1);
/*!40000 ALTER TABLE `categorias_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_cliente` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `tipo_cliente` enum('PERSONA','EMPRESA') DEFAULT 'PERSONA',
  `razon_social` varchar(200) DEFAULT NULL,
  `ruc_ci` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) NOT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `direccion` text,
  `ciudad` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `ruc_ci` (`ruc_ci`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_ruc_ci` (`ruc_ci`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Pedro','Ramírez','PERSONA','','1234567-8','pedro.ramirez@email.com','021123456','0981555555','Av. España 1234, c/ Boquerón','Asunción',1,'2025-11-12 01:15:52',''),(2,'Ana','López','PERSONA',NULL,'2345678-9','ana.lopez@email.com','021234567','0981666666','Calle Palma 567','Asunción',1,'2025-11-12 01:15:52',NULL),(3,'Constructora ABC',NULL,'EMPRESA',NULL,'80012345-1','contacto@constructoraabc.com','021345678','0981777777','Ruta 2 Km 15','San Lorenzo',1,'2025-11-12 01:15:52',NULL),(4,'Supermercado XYZ SA',NULL,'EMPRESA',NULL,'80023456-2','gerencia@superxyz.com','021456789','0981888888','Av. Mariscal López 2345','Asunción',1,'2025-11-12 01:15:52',NULL),(5,'Carlos','Espinola','PERSONA','','3799439-5','caresp10@gmail.com','0984657384','','Santo Rey casi Las Residentas','Luque',1,'2025-11-13 00:07:47','');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id_compra` bigint NOT NULL AUTO_INCREMENT,
  `fecha_actualizacion` datetime(6) DEFAULT NULL,
  `fecha_compra` date NOT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `forma_pago` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iva` decimal(10,2) DEFAULT NULL,
  `numero_compra` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_factura` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `id_proveedor` bigint NOT NULL,
  PRIMARY KEY (`id_compra`),
  UNIQUE KEY `UK_gj9s8e33t0ul7eb2m2ii2lx0` (`numero_compra`),
  KEY `FKkypgd762ocsq30thp7sxxhd20` (`id_proveedor`),
  CONSTRAINT `FKkypgd762ocsq30thp7sxxhd20` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compras`
--

DROP TABLE IF EXISTS `detalle_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_compras` (
  `id_detalle_compra` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `id_compra` bigint NOT NULL,
  `id_repuesto` bigint NOT NULL,
  PRIMARY KEY (`id_detalle_compra`),
  KEY `FKtcds87iga19tvovy0ay2u105e` (`id_compra`),
  KEY `FKepfpn9yqd2exb7kku707gbly0` (`id_repuesto`),
  CONSTRAINT `FKepfpn9yqd2exb7kku707gbly0` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`),
  CONSTRAINT `FKtcds87iga19tvovy0ay2u105e` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factura_items`
--

DROP TABLE IF EXISTS `factura_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factura_items` (
  `id_item` bigint NOT NULL AUTO_INCREMENT,
  `id_factura` bigint DEFAULT NULL,
  `id_servicio_catalogo` bigint DEFAULT NULL,
  `id_repuesto` bigint DEFAULT NULL,
  `tipo_item` enum('SERVICIO','REPUESTO','DIAGNOSTICO','OTRO') NOT NULL,
  `id_servicio` bigint DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `aplica_descuento_stock` tinyint(1) DEFAULT '1' COMMENT 'Si es repuesto, descontar stock',
  PRIMARY KEY (`id_item`),
  KEY `FK8sajv4p9ag0p5hlrvrkp3bsms` (`id_factura`),
  KEY `idx_factura_servicio_catalogo` (`id_servicio_catalogo`),
  KEY `idx_factura_repuesto` (`id_repuesto`),
  CONSTRAINT `FK8sajv4p9ag0p5hlrvrkp3bsms` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`),
  CONSTRAINT `fk_factura_item_repuesto` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`) ON DELETE SET NULL,
  CONSTRAINT `fk_factura_item_servicio` FOREIGN KEY (`id_servicio_catalogo`) REFERENCES `servicios_catalogo` (`id_servicio`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factura_items`
--

LOCK TABLES `factura_items` WRITE;
/*!40000 ALTER TABLE `factura_items` DISABLE KEYS */;
INSERT INTO `factura_items` VALUES (8,11,NULL,NULL,'SERVICIO',NULL,'INF-001 - Diagnostico de Notebook',1.00,150000.00,150000.00,1),(9,11,NULL,NULL,'SERVICIO',NULL,'REP-INF-001 - Disco Duro SATA 2.5\' 240 GB',1.00,250000.00,250000.00,1);
/*!40000 ALTER TABLE `factura_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id_factura` bigint NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(20) NOT NULL,
  `id_pedido` bigint DEFAULT NULL,
  `id_ot` bigint DEFAULT NULL,
  `id_presupuesto` bigint DEFAULT NULL,
  `id_cliente` bigint DEFAULT NULL,
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(12,2) DEFAULT '0.00',
  `iva` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estado` enum('PENDIENTE','PAGADA','VENCIDA','ANULADA') DEFAULT 'PENDIENTE',
  `forma_pago` enum('EFECTIVO','TRANSFERENCIA','TARJETA','CHEQUE') DEFAULT 'EFECTIVO',
  `fecha_pago` timestamp NULL DEFAULT NULL,
  `observaciones` text,
  `timbrado` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_factura`),
  UNIQUE KEY `numero_factura` (`numero_factura`),
  KEY `idx_estado` (`estado`),
  KEY `idx_cliente` (`id_cliente`),
  KEY `idx_fecha` (`fecha_emision`),
  KEY `fk_facturas_pedido` (`id_pedido`),
  KEY `fk_facturas_ot` (`id_ot`),
  KEY `fk_facturas_presupuesto` (`id_presupuesto`),
  CONSTRAINT `fk_facturas_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_facturas_ot` FOREIGN KEY (`id_ot`) REFERENCES `ordenes_trabajo` (`id_ot`),
  CONSTRAINT `fk_facturas_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `fk_facturas_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (11,'FACT-000001',9,9,NULL,2,'2025-11-18 19:08:26',NULL,0.00,0.00,0.00,0.00,'PAGADA','TRANSFERENCIA',NULL,NULL,NULL);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_estados`
--

DROP TABLE IF EXISTS `historial_estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_estados` (
  `id_historial` int NOT NULL AUTO_INCREMENT,
  `entidad_tipo` enum('PEDIDO','OT','FACTURA','PRESUPUESTO') NOT NULL,
  `entidad_id` int NOT NULL,
  `estado_anterior` varchar(50) DEFAULT NULL,
  `estado_nuevo` varchar(50) NOT NULL,
  `id_usuario` bigint DEFAULT NULL,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_historial`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_entidad` (`entidad_tipo`,`entidad_id`),
  KEY `idx_fecha` (`fecha_cambio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_estados`
--

LOCK TABLES `historial_estados` WRITE;
/*!40000 ALTER TABLE `historial_estados` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_estados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_precios_repuestos`
--

DROP TABLE IF EXISTS `historico_precios_repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_precios_repuestos` (
  `id_historico` bigint NOT NULL AUTO_INCREMENT,
  `id_repuesto` bigint NOT NULL,
  `precio_costo_anterior` decimal(12,2) DEFAULT NULL,
  `precio_costo_nuevo` decimal(12,2) DEFAULT NULL,
  `precio_venta_anterior` decimal(12,2) DEFAULT NULL,
  `precio_venta_nuevo` decimal(12,2) DEFAULT NULL,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` bigint DEFAULT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_repuesto_fecha` (`id_repuesto`,`fecha_cambio` DESC),
  CONSTRAINT `historico_precios_repuestos_ibfk_1` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`) ON DELETE CASCADE,
  CONSTRAINT `historico_precios_repuestos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de cambios de precios de repuestos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_precios_repuestos`
--

LOCK TABLES `historico_precios_repuestos` WRITE;
/*!40000 ALTER TABLE `historico_precios_repuestos` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_precios_repuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_precios_servicios`
--

DROP TABLE IF EXISTS `historico_precios_servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_precios_servicios` (
  `id_historico` bigint NOT NULL AUTO_INCREMENT,
  `id_servicio` bigint NOT NULL,
  `precio_anterior` decimal(12,2) DEFAULT NULL,
  `precio_nuevo` decimal(12,2) NOT NULL,
  `fecha_cambio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` bigint DEFAULT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_servicio_fecha` (`id_servicio`,`fecha_cambio` DESC),
  CONSTRAINT `historico_precios_servicios_ibfk_1` FOREIGN KEY (`id_servicio`) REFERENCES `servicios_catalogo` (`id_servicio`) ON DELETE CASCADE,
  CONSTRAINT `historico_precios_servicios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico de cambios de precios de servicios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_precios_servicios`
--

LOCK TABLES `historico_precios_servicios` WRITE;
/*!40000 ALTER TABLE `historico_precios_servicios` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_precios_servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_stock`
--

DROP TABLE IF EXISTS `movimientos_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_stock` (
  `id_movimiento` bigint NOT NULL AUTO_INCREMENT,
  `id_repuesto` bigint NOT NULL,
  `tipo_movimiento` enum('ENTRADA','SALIDA','AJUSTE','DEVOLUCION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL COMMENT 'Cantidad (negativa para salidas)',
  `motivo` enum('COMPRA','VENTA','DEVOLUCION','AJUSTE_INVENTARIO','GARANTIA','PERDIDA','DANO','DONACION','TRANSFERENCIA','OTRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTRO',
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_anterior` int NOT NULL,
  `stock_nuevo` int NOT NULL,
  `precio_unitario` decimal(12,2) DEFAULT NULL,
  `id_factura` bigint DEFAULT NULL COMMENT 'Factura que generó la salida',
  `id_compra` bigint DEFAULT NULL COMMENT 'Compra que generó la entrada',
  `id_usuario` bigint NOT NULL,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_movimiento`),
  KEY `id_factura` (`id_factura`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_repuesto` (`id_repuesto`),
  KEY `idx_tipo` (`tipo_movimiento`),
  KEY `idx_fecha` (`fecha_movimiento` DESC),
  KEY `idx_motivo` (`motivo`),
  CONSTRAINT `movimientos_stock_ibfk_1` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`) ON DELETE RESTRICT,
  CONSTRAINT `movimientos_stock_ibfk_2` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`) ON DELETE SET NULL,
  CONSTRAINT `movimientos_stock_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trazabilidad completa de movimientos de stock';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_stock`
--

LOCK TABLES `movimientos_stock` WRITE;
/*!40000 ALTER TABLE `movimientos_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_trabajo_repuestos`
--

DROP TABLE IF EXISTS `orden_trabajo_repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_trabajo_repuestos` (
  `id_ot_repuesto` bigint NOT NULL AUTO_INCREMENT,
  `cantidad` int NOT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `id_orden_trabajo` bigint NOT NULL,
  `id_repuesto` bigint NOT NULL,
  PRIMARY KEY (`id_ot_repuesto`),
  KEY `FK745lc0udttific6h0pm8yhgab` (`id_orden_trabajo`),
  KEY `FKbno316hc5j7bjvuqsxqtydxgv` (`id_repuesto`),
  CONSTRAINT `FK745lc0udttific6h0pm8yhgab` FOREIGN KEY (`id_orden_trabajo`) REFERENCES `ordenes_trabajo` (`id_ot`),
  CONSTRAINT `FKbno316hc5j7bjvuqsxqtydxgv` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_trabajo_repuestos`
--

LOCK TABLES `orden_trabajo_repuestos` WRITE;
/*!40000 ALTER TABLE `orden_trabajo_repuestos` DISABLE KEYS */;
/*!40000 ALTER TABLE `orden_trabajo_repuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_trabajo`
--

DROP TABLE IF EXISTS `ordenes_trabajo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_trabajo` (
  `id_ot` bigint NOT NULL AUTO_INCREMENT,
  `numero_ot` varchar(20) NOT NULL,
  `id_pedido` bigint DEFAULT NULL,
  `id_presupuesto` bigint DEFAULT NULL,
  `id_tecnico_asignado` bigint DEFAULT NULL,
  `id_supervisor` bigint DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_asignacion` timestamp NULL DEFAULT NULL,
  `fecha_inicio` timestamp NULL DEFAULT NULL,
  `fecha_finalizacion` timestamp NULL DEFAULT NULL,
  `estado` enum('ABIERTA','ASIGNADA','EN_PROCESO','ESPERANDO_REVISION','DEVUELTA_A_TECNICO','TERMINADA','FACTURADA','CANCELADA') NOT NULL DEFAULT 'ABIERTA',
  `prioridad` enum('BAJA','MEDIA','ALTA','URGENTE') DEFAULT 'MEDIA',
  `descripcion_trabajo` text NOT NULL,
  `diagnostico_tecnico` text COMMENT 'Diagnóstico realizado por el técnico',
  `informe_final` text COMMENT 'Informe final del trabajo realizado por el técnico',
  `observaciones` text,
  `horas_trabajadas` double DEFAULT NULL COMMENT 'Horas trabajadas por el técnico',
  `costo_mano_obra` decimal(12,2) DEFAULT NULL COMMENT 'Costo de mano de obra calculado',
  `presupuesto_final` decimal(12,2) DEFAULT NULL COMMENT 'Presupuesto final ajustado por admin',
  `justificacion_ajuste` text,
  `observaciones_devolucion` text,
  PRIMARY KEY (`id_ot`),
  UNIQUE KEY `numero_ot` (`numero_ot`),
  KEY `idx_estado` (`estado`),
  KEY `idx_tecnico` (`id_tecnico_asignado`),
  KEY `idx_fecha` (`fecha_creacion`),
  KEY `fk_ordenes_trabajo_pedido` (`id_pedido`),
  KEY `fk_ordenes_trabajo_presupuesto` (`id_presupuesto`),
  KEY `fk_ordenes_trabajo_supervisor` (`id_supervisor`),
  CONSTRAINT `FK1ao529lp0750i1x0tktpy5ht` FOREIGN KEY (`id_tecnico_asignado`) REFERENCES `tecnicos` (`id_tecnico`),
  CONSTRAINT `fk_ordenes_trabajo_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`),
  CONSTRAINT `fk_ordenes_trabajo_presupuesto` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`),
  CONSTRAINT `fk_ordenes_trabajo_supervisor` FOREIGN KEY (`id_supervisor`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_ordenes_trabajo_tecnico` FOREIGN KEY (`id_tecnico_asignado`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_trabajo`
--

LOCK TABLES `ordenes_trabajo` WRITE;
/*!40000 ALTER TABLE `ordenes_trabajo` DISABLE KEYS */;
INSERT INTO `ordenes_trabajo` VALUES (9,'OT-20251118-0001',9,12,1,NULL,'2025-11-18 19:03:18','2025-11-18 19:03:18',NULL,NULL,'FACTURADA','ALTA','Sin Energia en deposito','Se verifica probleams con la llave TM','Cambio de la llave TM',NULL,0.5,NULL,440000.00,NULL,NULL);
/*!40000 ALTER TABLE `ordenes_trabajo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id_pedido` bigint NOT NULL AUTO_INCREMENT,
  `numero_pedido` varchar(20) NOT NULL,
  `id_cliente` bigint DEFAULT NULL,
  `id_usuario_recepcion` bigint DEFAULT NULL,
  `id_categoria` bigint DEFAULT NULL,
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `canal` enum('TELEFONO','EMAIL','WHATSAPP','PRESENCIAL') NOT NULL,
  `descripcion` text NOT NULL,
  `prioridad` enum('BAJA','MEDIA','ALTA','URGENTE') DEFAULT 'MEDIA',
  `estado` enum('NUEVO','PRESUPUESTO_GENERADO','PRESUPUESTO_ACEPTADO','PRESUPUESTO_RECHAZADO','OT_GENERADA','OT_EN_PROCESO','OT_TERMINADA','FACTURADO','CANCELADO') DEFAULT 'NUEVO',
  `tiene_presupuesto` tinyint(1) DEFAULT '0',
  `tiene_ot` tinyint(1) DEFAULT '0',
  `fecha_estado` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`id_pedido`),
  UNIQUE KEY `numero_pedido` (`numero_pedido`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_pedido`),
  KEY `idx_cliente` (`id_cliente`),
  KEY `fk_pedidos_usuario` (`id_usuario_recepcion`),
  KEY `fk_pedidos_categoria` (`id_categoria`),
  CONSTRAINT `fk_pedidos_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_servicio` (`id_categoria`),
  CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`id_usuario_recepcion`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (9,'PED-20251118-0001',2,1,1,'2025-11-18 17:10:58','WHATSAPP','Sin Energia en deposito','ALTA','FACTURADO',1,1,'2025-11-18 19:08:26','');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `presupuesto_items`
--

DROP TABLE IF EXISTS `presupuesto_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presupuesto_items` (
  `id_item` bigint NOT NULL AUTO_INCREMENT,
  `id_servicio_catalogo` bigint DEFAULT NULL,
  `id_repuesto` bigint DEFAULT NULL,
  `id_presupuesto` bigint DEFAULT NULL,
  `tipo_item` enum('SERVICIO','REPUESTO','MANUAL') DEFAULT 'MANUAL',
  `id_servicio` bigint DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT '1.00',
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_item`),
  KEY `FK2b984xb3alm22p1x3gn2gywp7` (`id_presupuesto`),
  KEY `idx_presupuesto_servicio_catalogo` (`id_servicio_catalogo`),
  KEY `idx_presupuesto_repuesto` (`id_repuesto`),
  KEY `idx_tipo_item` (`tipo_item`),
  CONSTRAINT `FK2b984xb3alm22p1x3gn2gywp7` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuestos` (`id_presupuesto`),
  CONSTRAINT `fk_presupuesto_item_repuesto` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`) ON DELETE SET NULL,
  CONSTRAINT `fk_presupuesto_item_servicio` FOREIGN KEY (`id_servicio_catalogo`) REFERENCES `servicios_catalogo` (`id_servicio`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presupuesto_items`
--

LOCK TABLES `presupuesto_items` WRITE;
/*!40000 ALTER TABLE `presupuesto_items` DISABLE KEYS */;
INSERT INTO `presupuesto_items` VALUES (6,NULL,NULL,12,'SERVICIO',NULL,'INF-001 - Diagnostico de Notebook',1.00,150000.00,150000.00),(7,NULL,NULL,12,'REPUESTO',NULL,'REP-INF-001 - Disco Duro SATA 2.5\" 240 GB',1.00,250000.00,250000.00);
/*!40000 ALTER TABLE `presupuesto_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `presupuestos`
--

DROP TABLE IF EXISTS `presupuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presupuestos` (
  `id_presupuesto` bigint NOT NULL AUTO_INCREMENT,
  `numero_presupuesto` varchar(20) NOT NULL,
  `id_pedido` bigint DEFAULT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(12,2) DEFAULT '0.00',
  `iva` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estado` enum('PENDIENTE','ACEPTADO','RECHAZADO','VENCIDO') DEFAULT 'PENDIENTE',
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  `observaciones` text,
  `condiciones_pago` text,
  `validez_dias` int DEFAULT '15',
  PRIMARY KEY (`id_presupuesto`),
  UNIQUE KEY `numero_presupuesto` (`numero_presupuesto`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_generacion`),
  KEY `fk_presupuestos_pedido` (`id_pedido`),
  CONSTRAINT `fk_presupuestos_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presupuestos`
--

LOCK TABLES `presupuestos` WRITE;
/*!40000 ALTER TABLE `presupuestos` DISABLE KEYS */;
INSERT INTO `presupuestos` VALUES (12,'PRES-20251118-0001',9,'2025-11-18 17:17:20','2025-11-18',400000.00,0.00,40000.00,440000.00,'ACEPTADO','2025-11-18 19:03:08','','',15);
/*!40000 ALTER TABLE `presupuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id_proveedor` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL,
  `ciudad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_actualizacion` datetime(6) DEFAULT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `pais` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `persona_contacto` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razon_social` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_proveedor`),
  UNIQUE KEY `UK_l2qkpg6gem3abown28yrhqjph` (`ruc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,_binary '','Asuncion','sh Pinedo','ferrex@empres.com','2025-11-17 08:33:45.412876','2025-11-17 08:33:45.412876','Ferrex',NULL,'Paraguay',NULL,'Ferrex','52252525','1112233');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repuesto_historial_precio`
--

DROP TABLE IF EXISTS `repuesto_historial_precio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repuesto_historial_precio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_repuesto` bigint NOT NULL,
  `precio_compra` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `fecha_cambio` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_repuesto_fecha` (`id_repuesto`,`fecha_cambio`),
  CONSTRAINT `repuesto_historial_precio_ibfk_1` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repuesto_historial_precio`
--

LOCK TABLES `repuesto_historial_precio` WRITE;
/*!40000 ALTER TABLE `repuesto_historial_precio` DISABLE KEYS */;
/*!40000 ALTER TABLE `repuesto_historial_precio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repuestos`
--

DROP TABLE IF EXISTS `repuestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repuestos` (
  `id_repuesto` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `id_categoria` bigint DEFAULT NULL,
  `fecha_actualizacion` datetime(6) DEFAULT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_compra` decimal(10,2) DEFAULT NULL,
  `precio_venta` decimal(10,2) DEFAULT NULL,
  `margen_ganancia` decimal(5,2) GENERATED ALWAYS AS ((case when (`precio_costo` > 0) then (((`precio_venta` - `precio_costo`) / `precio_costo`) * 100) else 0 end)) STORED COMMENT 'Margen de ganancia en %',
  `stock_actual` int NOT NULL,
  `stock_maximo` int DEFAULT NULL,
  `punto_reorden` int DEFAULT NULL COMMENT 'Stock en el que se debe reordenar',
  `stock_minimo` int DEFAULT NULL,
  `ubicacion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unidad_medida` enum('SERVICIO','UNIDAD','HORA','METRO','METRO_CUADRADO','DIA','VISITA','KILO','LITRO','CAJA','ROLLO','PAR') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proveedor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_proveedor` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `precio_costo` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio de compra al proveedor',
  PRIMARY KEY (`id_repuesto`),
  UNIQUE KEY `UK_5qbl67yw25ix3d8qkn2etsua0` (`codigo`),
  KEY `fk_repuesto_categoria` (`id_categoria`),
  CONSTRAINT `fk_repuesto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_servicio` (`id_categoria`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repuestos`
--

LOCK TABLES `repuestos` WRITE;
/*!40000 ALTER TABLE `repuestos` DISABLE KEYS */;
INSERT INTO `repuestos` (`id_repuesto`, `activo`, `categoria`, `codigo`, `descripcion`, `id_categoria`, `fecha_actualizacion`, `fecha_registro`, `marca`, `modelo`, `nombre`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_maximo`, `punto_reorden`, `stock_minimo`, `ubicacion`, `unidad_medida`, `proveedor`, `telefono_proveedor`, `created_at`, `updated_at`, `precio_costo`) VALUES (3,_binary '',NULL,'REP-ELEC-001','Llave termomagnética 10 Amperios',1,'2025-11-18 10:21:57.227256',NULL,'Schneider',NULL,'Llave termomagnética 10A',NULL,55000.00,25,50,NULL,10,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 13:21:57',35000.00),(4,_binary '\0',NULL,'REP-ELEC-002','Llave termomagnética 20 Amperios',1,NULL,NULL,'Schneider',NULL,'Llave termomagnética 20A',NULL,70000.00,20,50,NULL,10,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',45000.00),(5,_binary '\0',NULL,'REP-ELEC-003','Llave termomagnética 32 Amperios',1,NULL,NULL,'Schneider',NULL,'Llave termomagnética 32A',NULL,85000.00,15,40,NULL,8,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',55000.00),(6,_binary '\0',NULL,'REP-ELEC-004','Toma corriente doble 220V',1,NULL,NULL,'Bticino',NULL,'Toma corriente doble',NULL,30000.00,50,100,NULL,20,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',15000.00),(7,_binary '\0',NULL,'REP-ELEC-005','Interruptor de pared simple',1,NULL,NULL,'Bticino',NULL,'Interruptor simple',NULL,25000.00,60,100,NULL,20,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',12000.00),(8,_binary '\0',NULL,'REP-ELEC-006','Cable eléctrico 2.5mm por metro',1,NULL,NULL,'Prysmian',NULL,'Cable 2.5mm',NULL,6000.00,500,1000,NULL,100,NULL,'METRO','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',3500.00),(9,_binary '\0',NULL,'REP-ELEC-007','Cable eléctrico 4mm por metro',1,NULL,NULL,'Prysmian',NULL,'Cable 4mm',NULL,9000.00,300,800,NULL,100,NULL,'METRO','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',5500.00),(10,_binary '\0',NULL,'REP-ELEC-008','Caja de paso cuadrada PVC',1,NULL,NULL,'Tigre',NULL,'Caja de paso PVC',NULL,15000.00,40,80,NULL,15,NULL,'UNIDAD','Distribuidora Eléctrica SA',NULL,'2025-11-18 12:00:22','2025-11-18 12:00:22',8000.00),(11,_binary '',NULL,'REP-INF-001','Disco Duro 2.5\" para notebook',4,NULL,NULL,'Crucial','021252','Disco Duro SATA 2.5\" 240 GB',NULL,250000.00,10,20,NULL,3,'I-1','UNIDAD',NULL,NULL,'2025-11-18 17:15:04','2025-11-18 17:15:04',150000.00);
/*!40000 ALTER TABLE `repuestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repuestos_utilizados`
--

DROP TABLE IF EXISTS `repuestos_utilizados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repuestos_utilizados` (
  `id_repuesto_utilizado` bigint NOT NULL AUTO_INCREMENT,
  `id_ot` bigint DEFAULT NULL,
  `tipo_item` enum('SERVICIO','REPUESTO','MANUAL') DEFAULT 'MANUAL',
  `id_servicio` bigint DEFAULT NULL,
  `id_repuesto` bigint DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_repuesto_utilizado`),
  KEY `FKqbv2js5awoq9xgl4w3rgwljl3` (`id_ot`),
  KEY `fk_repuesto_utilizado_servicio` (`id_servicio`),
  KEY `fk_repuesto_utilizado_repuesto` (`id_repuesto`),
  CONSTRAINT `fk_repuesto_utilizado_repuesto` FOREIGN KEY (`id_repuesto`) REFERENCES `repuestos` (`id_repuesto`),
  CONSTRAINT `fk_repuesto_utilizado_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios_catalogo` (`id_servicio`),
  CONSTRAINT `FKqbv2js5awoq9xgl4w3rgwljl3` FOREIGN KEY (`id_ot`) REFERENCES `ordenes_trabajo` (`id_ot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repuestos_utilizados`
--

LOCK TABLES `repuestos_utilizados` WRITE;
/*!40000 ALTER TABLE `repuestos_utilizados` DISABLE KEYS */;
/*!40000 ALTER TABLE `repuestos_utilizados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios_catalogo`
--

DROP TABLE IF EXISTS `servicios_catalogo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios_catalogo` (
  `id_servicio` bigint NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `id_categoria` bigint NOT NULL,
  `precio_base` decimal(12,2) NOT NULL,
  `unidad_medida` enum('HORA','UNIDAD','METRO','METRO2','SERVICIO') COLLATE utf8mb4_unicode_ci DEFAULT 'SERVICIO',
  `tiempo_estimado_horas` decimal(5,2) DEFAULT NULL COMMENT 'Tiempo estimado de ejecución en horas',
  `incluye_materiales` tinyint(1) DEFAULT '0',
  `notas_adicionales` text COLLATE utf8mb4_unicode_ci COMMENT 'Notas, advertencias o información adicional',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_servicio`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_categoria` (`id_categoria`),
  KEY `idx_activo` (`activo`),
  KEY `idx_codigo` (`codigo`),
  CONSTRAINT `servicios_catalogo_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_servicio` (`id_categoria`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de servicios estándar con precios base';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios_catalogo`
--

LOCK TABLES `servicios_catalogo` WRITE;
/*!40000 ALTER TABLE `servicios_catalogo` DISABLE KEYS */;
INSERT INTO `servicios_catalogo` VALUES (1,'ELEC-001','Instalación toma corriente simple','Instalación de toma corriente simple con materiales incluidos',1,150000.00,'UNIDAD',1.50,1,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(2,'ELEC-002','Instalación toma corriente doble','Instalación de toma corriente doble con materiales incluidos',1,200000.00,'UNIDAD',2.00,1,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(3,'ELEC-003','Cambio de llave termomagnética','Cambio de llave TM simple (10A-50A)',1,100000.00,'UNIDAD',1.00,0,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(4,'ELEC-004','Instalación de interruptor simple','Instalación de interruptor de pared simple',1,80000.00,'UNIDAD',0.75,1,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(5,'ELEC-005','Instalación de luminaria','Instalación de luminaria con cableado',1,120000.00,'UNIDAD',1.25,0,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(6,'ELEC-006','Revisión tablero eléctrico','Inspección completa de tablero eléctrico',1,250000.00,'SERVICIO',2.00,0,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(7,'ELEC-007','Instalación punto de luz','Instalación de punto de luz con cableado',1,180000.00,'UNIDAD',2.50,1,NULL,1,'2025-11-17 23:43:20','2025-11-17 23:43:20'),(29,'INF-001','Diagnostico de Notebook','Diagnostico inicial de un problema de notebook',4,150000.00,'UNIDAD',0.50,0,NULL,1,'2025-11-18 17:12:18','2025-11-18 17:12:18');
/*!40000 ALTER TABLE `servicios_catalogo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tecnicos`
--

DROP TABLE IF EXISTS `tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tecnicos` (
  `id_tecnico` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ci` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` datetime(6) DEFAULT NULL,
  `nivel_experiencia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario` bigint DEFAULT NULL COMMENT 'Usuario asociado para login del técnico',
  PRIMARY KEY (`id_tecnico`),
  UNIQUE KEY `UK_gqsir5gkntj9ri1xaiuf5mfp9` (`ci`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  KEY `idx_tecnico_usuario` (`id_usuario`),
  CONSTRAINT `fk_tecnico_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tecnicos`
--

LOCK TABLES `tecnicos` WRITE;
/*!40000 ALTER TABLE `tecnicos` DISABLE KEYS */;
INSERT INTO `tecnicos` VALUES (1,_binary '','Rios',NULL,'111222333',NULL,NULL,'Informática','2025-11-13 19:32:27.529837','SENIOR','Juan',NULL,NULL,7);
/*!40000 ALTER TABLE `tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','RECEPCION','TECNICO','SUPERVISOR','DUENO') NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_rol` (`rol`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin','Sistema','admin@multiservices.com','0981000000','admin','$2a$10$S68GJ8n/iNMJChgUB7lb1OBr5BeoF7VObp/lB445o.8awJVrkAiLW','ADMIN',1,'2025-11-12 01:15:52','2025-11-12 19:33:12'),(2,'María','González','recepcion@multiservices.com','0981111111','recepcion','$2a$10$S68GJ8n/iNMJChgUB7lb1OBr5BeoF7VObp/lB445o.8awJVrkAiLW','RECEPCION',1,'2025-11-12 01:15:52','2025-11-12 19:33:12'),(3,'Juan','Pérez','tecnico@multiservices.com','0981222222','tecnico','$2a$10$S68GJ8n/iNMJChgUB7lb1OBr5BeoF7VObp/lB445o.8awJVrkAiLW','TECNICO',1,'2025-11-12 01:15:52','2025-11-12 19:33:12'),(4,'Carlos','Rodríguez','supervisor@multiservices.com','0981333333','supervisor','$2a$10$S68GJ8n/iNMJChgUB7lb1OBr5BeoF7VObp/lB445o.8awJVrkAiLW','SUPERVISOR',1,'2025-11-12 01:15:52','2025-11-12 19:33:12'),(5,'Roberto','Martínez','dueno@multiservices.com','0981444444','dueno','$2a$10$S68GJ8n/iNMJChgUB7lb1OBr5BeoF7VObp/lB445o.8awJVrkAiLW','DUENO',1,'2025-11-12 01:15:52','2025-11-12 19:33:12'),(7,'Juan','Ríos','jrios@multiservices.com',NULL,'jrios','$2a$10$WytCcHH01C2IpTdNn30wke6r1jdqfaF3RsyYHIdj5TTYJ5UuiGIri','TECNICO',1,'2025-11-14 13:20:36','2025-11-14 13:20:36');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_repuestos_stock_bajo`
--

DROP TABLE IF EXISTS `v_repuestos_stock_bajo`;
/*!50001 DROP VIEW IF EXISTS `v_repuestos_stock_bajo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_repuestos_stock_bajo` AS SELECT 
 1 AS `id_repuesto`,
 1 AS `codigo`,
 1 AS `nombre`,
 1 AS `stock_actual`,
 1 AS `stock_minimo`,
 1 AS `stock_maximo`,
 1 AS `punto_reorden`,
 1 AS `proveedor`,
 1 AS `telefono_proveedor`,
 1 AS `cantidad_a_pedir`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'multiservices_db'
--

--
-- Dumping routines for database 'multiservices_db'
--

--
-- Current Database: `multiservices_db`
--

USE `multiservices_db`;

--
-- Final view structure for view `v_repuestos_stock_bajo`
--

/*!50001 DROP VIEW IF EXISTS `v_repuestos_stock_bajo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_repuestos_stock_bajo` AS select `r`.`id_repuesto` AS `id_repuesto`,`r`.`codigo` AS `codigo`,`r`.`nombre` AS `nombre`,`r`.`stock_actual` AS `stock_actual`,`r`.`stock_minimo` AS `stock_minimo`,`r`.`stock_maximo` AS `stock_maximo`,`r`.`punto_reorden` AS `punto_reorden`,`r`.`proveedor` AS `proveedor`,`r`.`telefono_proveedor` AS `telefono_proveedor`,(`r`.`stock_minimo` - `r`.`stock_actual`) AS `cantidad_a_pedir` from `repuestos` `r` where ((`r`.`stock_actual` <= `r`.`stock_minimo`) and (`r`.`activo` = true)) order by `r`.`stock_actual` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-19 11:56:15

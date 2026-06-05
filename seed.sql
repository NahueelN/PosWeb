-- ============================================================
-- Seed data para PosWeb
-- Ejecutar después de: dotnet ef database update
-- ============================================================

-- Medios de pago (ya insertados por la migration, solo referencia)
-- SELECT * FROM MEDIOS_PAGO;

-- Unidades de medida (ya insertadas por la migration)
-- SELECT * FROM UNIDADES_MEDIDA;

-- ============================================================
-- Datos obligatorios para poder loguearse
-- ============================================================

-- Suscripcion (requiere ID_USUARIO=1 admin)
INSERT INTO SUSCRIPCIONES (ID_SUSCRIPCION, ID_USUARIO_TITULAR, NIVEL, ESTADO, COSTO_MENSUAL, MAX_SUCURSALES, MAX_ADMIN, MAX_USUARIOS, FECHA_INICIO)
SELECT 1, 1, 'Premium', 'Activa', 0, 10, 5, 50, NOW()
WHERE NOT EXISTS (SELECT 1 FROM SUSCRIPCIONES WHERE ID_SUSCRIPCION = 1);

-- Empresa
INSERT INTO EMPRESAS (ID_EMPRESA, NOMBRE, DOCUMENTO, ID_SUSCRIPCION)
SELECT 1, 'Mi Empresa', '30-12345678-9', 1
WHERE NOT EXISTS (SELECT 1 FROM EMPRESAS WHERE ID_EMPRESA = 1);

-- Sucursal
INSERT INTO SUCURSALES (ID_SUCURSAL, COD_SUCURSAL, DESC_SUCURSAL, ID_EMPRESA, ACTIVO)
SELECT 1, 'PRINCIPAL', 'Sucursal Principal', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM SUCURSALES WHERE ID_SUCURSAL = 1);

-- Actualizar admin
UPDATE USUARIOS SET
    ID_SUCURSAL_DEFAULT = 1,
    SUSCRIPCION_ACTIVA = TRUE
WHERE ID_USUARIO = 1;

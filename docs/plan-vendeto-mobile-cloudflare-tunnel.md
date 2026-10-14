# Acceso remoto de Vendeto Mobile con Cloudflare Tunnel

## Decisión

Publicar Vendeto Mobile mediante un **Cloudflare Tunnel nombrado** que corre en la PC del comercio. El teléfono accederá a un subdominio HTTPS, por ejemplo `movil.ejemplo.com`, sin depender de la WiFi local, sin abrir puertos del router y sin exponer PosWeb directamente.

El dominio debe incorporarse a la cuenta de Cloudflare existente (`chiacchio-eze01`), que ya opera los Workers de catálogo y licencias.

## Resultado esperado

1. El comercio abre `Vendeto.exe`.
2. Tauri inicia `posweb-backend` y `vendeto-mobile` como sidecars.
3. `cloudflared`, instalado como servicio de Windows, mantiene un túnel saliente hacia Cloudflare.
4. El celular escanea un QR en Pos y abre `https://movil.<dominio>/` usando WiFi o datos móviles.
5. Vendeto Mobile sigue autenticando con el login y JWT existentes; PosWeb y su base local no quedan publicados.

## Arquitectura

```text
Celular ── HTTPS ── Cloudflare ── Tunnel saliente ── cloudflared (PC comercio)
                                                     │
                                                     └── https://127.0.0.1:8543
                                                          vendeto-mobile
                                                               │
                                                               └── http://127.0.0.1:5196/api
                                                                    PosWeb local
```

| Elemento | Decisión |
| --- | --- |
| Entrada pública | Solo `movil.<dominio>` por Cloudflare Tunnel. No abrir 8543 ni 5196 en el router. |
| Origen del túnel | `https://127.0.0.1:8543`; mientras el sidecar use certificado autofirmado, `cloudflared` requiere validar esa conexión como origen interno (`noTLSVerify: true`). |
| TLS para el teléfono | Cloudflare entrega un certificado válido para el subdominio. El navegador deja de advertir y la cámara conserva contexto HTTPS. |
| Backend PosWeb | Permanece en `127.0.0.1:5196`; no recibe tráfico público directo. |
| Disponibilidad | La PC del comercio debe estar encendida, con Vendeto abierto y con Internet. |

## Configuración previa

- [ ] Comprar o usar un dominio y delegar su DNS a Cloudflare.
- [ ] Elegir el hostname definitivo: `movil.<dominio>`.
- [ ] Confirmar que se usará la cuenta Cloudflare existente.
- [ ] Instalar `cloudflared` en la PC del comercio.
- [ ] Crear un túnel nombrado y un registro DNS para el hostname.
- [ ] Instalar el túnel como servicio de Windows para que sobreviva reinicios.
- [ ] Mantener el servicio originado solo en loopback; no crear reglas de port forwarding.

## Cambios de producto a implementar

### 1. Configuración de URL pública

Agregar una configuración explícita para la URL pública de Vendeto Mobile. No debe depender de detectar una IP LAN ni quedar hardcodeada en el frontend.

- Valor esperado: `https://movil.<dominio>`.
- Fallback mientras no exista túnel: URL LAN actual `https://<ip-lan>:8543`.
- La configuración debe ser leída por Tauri, que puede entregarla al frontend desktop sin que el navegador necesite confiar en el certificado interno.

### 2. QR en Pos

Agregar, solo para Admin/SuperAdmin, una acción **Conectar celular** en el pie del menú lateral, separada de **Ver QR** de MercadoPago.

El modal debe mostrar:

- QR de la URL pública configurada.
- URL en texto y acción Copiar link.
- Estado del enlace: remoto configurado o solo red local.
- Mensaje preciso si el sidecar o la URL todavía no están disponibles.

No se agrega como ruta del menú ni dentro de Ventas: conectar un dispositivo es configuración operativa, no una venta.

### 3. Protección pública

Antes de habilitar el hostname para clientes reales:

- [ ] Mantener la allowlist actual del proxy; nunca convertirlo en un proxy genérico.
- [ ] Confirmar rate limiting/WAF aplicable al endpoint de login en el plan actual de Cloudflare.
- [ ] Decidir si Cloudflare Access se usa como segunda barrera. Para personal interno suma protección; para acceso masivo agrega fricción y no reemplaza el login de PosWeb.
- [ ] No registrar tokens, contraseñas ni URLs con secretos en el repositorio.

## Orden de entrega

1. **Infraestructura manual**: dominio, DNS, Tunnel y servicio `cloudflared`; probar el hostname desde datos móviles.
2. **Configuración de aplicación**: fuente persistente de `VENDETO_MOBILE_PUBLIC_URL` o equivalente, con fallback LAN.
3. **QR desktop**: acción Conectar celular, QR, copia y estados de error.
4. **Hardening**: reglas Cloudflare confirmadas, prueba de login, cámara, conexión caída y reinicio de PC/Vendeto.
5. **Release**: instalar el paquete en una PC limpia y validar que Tauri inicia sidecars y el tunnel vuelve a conectar.

## Criterios de aceptación

- [ ] Sin WiFi del comercio, un teléfono abre el hostname y llega al login móvil por HTTPS válido.
- [ ] No hay puertos entrantes publicados en el router para Vendeto ni PosWeb.
- [ ] `http://127.0.0.1:5196` no es accesible desde Internet.
- [ ] El QR de Pos coincide con la URL pública configurada y se puede copiar.
- [ ] Si se cae Internet o Vendeto se cierra, el teléfono recibe un error claro y no una pantalla engañosa.
- [ ] El login, Productos, escáner y Ventas siguen funcionando a través del túnel.

## Fuera de alcance

- Migrar PosWeb o SQLite a un VPS.
- Exponer directamente la API .NET o la base de datos.
- Implementar Cloudflare Access hasta decidir quién debe superar esa segunda autenticación.
- Automatizar la compra o alta del dominio.

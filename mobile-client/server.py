"""Vendeto Mobile sidecar and constrained adapter for PosWeb."""

import datetime
import ipaddress
import os
import socket
import ssl
import sys
import tempfile
from pathlib import Path

from aiohttp import ClientSession, ClientTimeout, web
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


DEFAULT_PORT = 8543
POSWEB_API_BASE = os.getenv("POSWEB_API_BASE", "http://127.0.0.1:5196/api")
STATIC_DIR = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)) / "static"
CERT_DIR = Path(os.getenv("APPDATA", tempfile.gettempdir())) / "VendetoMobile"
PUBLIC_API_PATHS = ("/sucursales", "/auth/login")
AUTHENTICATED_API_PREFIXES = ("/productos", "/categorias", "/unidades-medida", "/medios-pago", "/cajas", "/ventas", "/stock", "/clientes")


async def health(_: web.Request) -> web.Response:
    return web.json_response({"ok": True, "service": "vendeto-mobile"})


async def index(_: web.Request) -> web.FileResponse:
    return web.FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-store"})


def is_allowed_api_path(path: str) -> bool:
    prefixes = (*PUBLIC_API_PATHS, *AUTHENTICATED_API_PREFIXES)
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in prefixes)


def requires_authentication(path: str) -> bool:
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in AUTHENTICATED_API_PREFIXES)


async def has_valid_posweb_session(session: ClientSession, authorization: str) -> bool:
    try:
        async with session.get(
            f"{POSWEB_API_BASE}/auth/me",
            headers={"Authorization": authorization},
        ) as response:
            return response.status == 200
    except Exception:
        return False


async def proxy_posweb(request: web.Request) -> web.Response:
    api_path = f"/{request.match_info['path']}"
    if not is_allowed_api_path(api_path):
        return web.json_response({"error": "Ruta no disponible en Vendeto Mobile"}, status=404)

    headers = {"Accept": "application/json"}
    authorization = request.headers.get("Authorization")
    session: ClientSession = request.app["posweb_session"]
    if requires_authentication(api_path):
        if not authorization:
            return web.json_response({"error": "Sesión requerida"}, status=401)
        if not await has_valid_posweb_session(session, authorization):
            return web.json_response({"error": "La sesión venció. Iniciá sesión nuevamente."}, status=401)
    if authorization:
        headers["Authorization"] = authorization
    if content_type := request.headers.get("Content-Type"):
        headers["Content-Type"] = content_type

    body = await request.read()
    target = f"{POSWEB_API_BASE}{api_path}"
    try:
        async with session.request(
            request.method,
            target,
            params=request.query,
            headers=headers,
            data=body or None,
        ) as response:
            response_body = await response.read()
            response_type = response.headers.get("Content-Type", "application/json")
            return web.Response(status=response.status, body=response_body, content_type=response_type.split(";", 1)[0])
    except Exception:
        return web.json_response({"error": "No se pudo conectar con PosWeb"}, status=503)


async def on_startup(app: web.Application) -> None:
    app["posweb_session"] = ClientSession(timeout=ClientTimeout(total=10))


async def on_cleanup(app: web.Application) -> None:
    await app["posweb_session"].close()


def create_app() -> web.Application:
    app = web.Application()
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    app.router.add_get("/", index)
    app.router.add_get("/health", health)
    app.router.add_static("/assets/", STATIC_DIR / "assets")
    app.router.add_route("*", "/api/{path:.*}", proxy_posweb)
    return app


def local_ip() -> str:
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("8.8.8.8", 80))
        return probe.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        probe.close()


def generate_certificate(ip: str, hostname: str, cert_path: Path, key_path: Path) -> None:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, ip)])
    alt_names = [
        x509.DNSName("localhost"),
        x509.DNSName(hostname),
        x509.DNSName(f"{hostname}.local"),
    ]
    for value in {ip, "127.0.0.1"}:
        try:
            alt_names.append(x509.IPAddress(ipaddress.ip_address(value)))
        except ValueError:
            pass

    now = datetime.datetime.now(datetime.timezone.utc)
    certificate = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=3650))
        .add_extension(x509.SubjectAlternativeName(alt_names), critical=False)
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )

    key_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    cert_path.write_bytes(certificate.public_bytes(serialization.Encoding.PEM))


def ensure_certificate(ip: str, hostname: str) -> tuple[Path, Path]:
    CERT_DIR.mkdir(parents=True, exist_ok=True)
    cert_path = CERT_DIR / "cert.pem"
    key_path = CERT_DIR / "key.pem"
    marker_path = CERT_DIR / "cert_marker.txt"
    marker = f"{ip}|{hostname}"

    if not (cert_path.exists() and key_path.exists() and marker_path.exists() and marker_path.read_text().strip() == marker):
        generate_certificate(ip, hostname, cert_path, key_path)
        marker_path.write_text(marker)

    return cert_path, key_path


def main() -> None:
    port = int(os.getenv("VENDETO_MOBILE_PORT", str(DEFAULT_PORT)))
    host = os.getenv("VENDETO_MOBILE_HOST", "127.0.0.1")
    use_tls = os.getenv("VENDETO_MOBILE_TLS", "false").lower() == "true"
    context = None

    if use_tls:
        ip = local_ip()
        hostname = socket.gethostname()
        cert_path, key_path = ensure_certificate(ip, hostname)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(str(cert_path), str(key_path))

    protocol = "https" if use_tls else "http"
    print(f"Vendeto Mobile disponible en {protocol}://{host}:{port}/")
    web.run_app(create_app(), host=host, port=port, ssl_context=context, print=None)


if __name__ == "__main__":
    main()

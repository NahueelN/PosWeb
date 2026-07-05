namespace PosWeb.Application.Exceptions;

public class ProveedorDocumentoDuplicadoException : ServiceException
{
    public string TipoDocumento { get; }
    public string NroDocumento { get; }

    public ProveedorDocumentoDuplicadoException(string tipoDocumento, string nroDocumento)
        : base($"Ya existe un proveedor activo con {tipoDocumento} {nroDocumento}")
    {
        TipoDocumento = tipoDocumento;
        NroDocumento = nroDocumento;
    }
}

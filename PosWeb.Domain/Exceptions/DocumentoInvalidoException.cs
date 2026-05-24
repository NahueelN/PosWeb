namespace PosWeb.Domain.Exceptions;

public class DocumentoInvalidoException : DomainException
{
    public DocumentoInvalidoException(string tipoDocumento, string detalle)
        : base($"{detalle}: {tipoDocumento}")
    {
    }
}

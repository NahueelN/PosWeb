namespace PosWeb.Contracts;

public class ProductoImportResponseDto
{
    public int Total { get; set; }
    public int Creados { get; set; }
    public int Saltados { get; set; }
    public List<ProductoImportErrorDto> Errores { get; set; } = new();
}

public class ProductoImportErrorDto
{
    public int Fila { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public ProductoImportFila Datos { get; set; } = new();
}

public class ImportarFilasRequest
{
    public List<ProductoImportFila> Filas { get; set; } = new();
    public int? SucursalId { get; set; }
    public bool ImportarSinCodigo { get; set; }
}

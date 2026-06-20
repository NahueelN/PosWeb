namespace PosWeb.Contracts;

public class CategoriaGastoDto
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
}

public class CrearCategoriaGastoRequest
{
    public string Descripcion { get; set; } = string.Empty;
}

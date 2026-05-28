namespace PosWeb.Domain;

public static class Roles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string UsuarioComun = "UsuarioComun";

    public static readonly string[] Todos = { SuperAdmin, Admin, UsuarioComun };
}

namespace VogaApi.Models;

public class Tenant
{
    public int Id { get; set; }
    public string NomeEscritorio { get; set; } = string.Empty;
    public string CorPrimaria { get; set; } = string.Empty;
    public string TelefoneWhatsApp { get; set; } = string.Empty;
}
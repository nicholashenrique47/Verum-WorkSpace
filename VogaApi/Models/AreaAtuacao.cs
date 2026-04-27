namespace VogaApi.Models;

public class AreaAtuacao
{
    public int Id { get; set; }
    public int TenantId { get; set; } // O ID do escritório
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
}
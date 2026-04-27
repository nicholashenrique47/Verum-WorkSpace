namespace VogaApi.Models;

public class Prazo
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataVencimento { get; set; }
    public string Status { get; set; } = "Pendente"; // Pendente, Concluido, Atrasado
    public string Prioridade { get; set; } = "Normal"; // Alta, Normal, Baixa
    public string ClienteAssociado { get; set; } = string.Empty;
}

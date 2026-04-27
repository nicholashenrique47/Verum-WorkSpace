namespace VogaApi.Models;

public class DocumentoGerado
{
    public int Id { get; set; }
    public int TenantId { get; set; } // A chave de ouro que separa os dados
    public string NomeClienteFinal { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public DateTime DataGeracao { get; set; } = DateTime.UtcNow;
    public bool Assinado { get; set; } = false;
}
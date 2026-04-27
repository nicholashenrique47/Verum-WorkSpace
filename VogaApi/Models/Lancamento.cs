namespace VogaApi.Models;

public class Lancamento
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Tipo { get; set; } = "Receita"; // Receita, Despesa
    public DateTime DataPagamento { get; set; }
    public bool Pago { get; set; } = false;
    public string Categoria { get; set; } = string.Empty; // Honorários, Custas, Operacional
}

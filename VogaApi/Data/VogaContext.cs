using Microsoft.EntityFrameworkCore;
using VogaApi.Models;

namespace VogaApi.Data;

public class VogaContext : DbContext
{
    public VogaContext(DbContextOptions<VogaContext> options) : base(options) { }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<DocumentoGerado> DocumentosGerados { get; set; }

    public DbSet<AreaAtuacao> AreasAtuacao { get; set; } // <--- ADICIONE ESTA LINHA
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Prazo> Prazos { get; set; }
    public DbSet<Lancamento> Lancamentos { get; set; }
}
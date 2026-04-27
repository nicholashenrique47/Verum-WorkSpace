using Microsoft.EntityFrameworkCore;
using VogaApi.Data;
using VogaApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. BANCO DE DADOS (AGORA NO MYSQL) E CORS
// 1. BANCO DE DADOS (AGORA NA NUVEM AIVEN) E CORS
string conexao = "Server=mysql-2c05ccc6-verum123.g.aivencloud.com;Port=18325;Database=defaultdb;Uid=avnadmin;Pwd=AVNS__luDWV1lGOFptZxME7m;SslMode=Required;";

builder.Services.AddDbContext<VogaContext>(options =>
    options.UseMySql(conexao, ServerVersion.AutoDetect(conexao)));

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("PermitirTudo");

// 2. RECRIANDO O BANCO E SEMEANDO OS DADOS NO MYSQL
// 2. RECRIANDO O BANCO E SEMEANDO OS DADOS NO MYSQL
// 2. RECRIANDO O BANCO E SEMEANDO OS DADOS NO MYSQL
// 2. RECRIANDO O BANCO E SEMEANDO OS DADOS NO MYSQL
// 2. RECRIANDO O BANCO E SEMEANDO OS DADOS NO MYSQL
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VogaContext>();

    // 1. Limpa absolutamente tudo para não haver conflitos
    try
    {
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Lancamentos;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Prazos;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Clientes;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS DocumentosGerados;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS AreasAtuacao;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Tenants;");
        db.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS __EFMigrationsHistory;");
    }
    catch { }

    // 2. Como o banco está 100% vazio, este comando vai ler a tua pasta Models 
    // e criar TODAS as gavetas automaticamente (Tenants, Clientes, Prazos, etc.)
    db.Database.EnsureCreated();

    // 3. Semeando os dados
    if (!db.Tenants.Any())
    {
        var primeiroEscritorio = new Tenant
        {
            NomeEscritorio = "Advocacia Fernandes & Associados",
            CorPrimaria = "#1C2541",
            TelefoneWhatsApp = "5541999999999"
        };
        db.Tenants.Add(primeiroEscritorio);
        db.SaveChanges();

        db.AreasAtuacao.AddRange(
            new AreaAtuacao { TenantId = primeiroEscritorio.Id, Titulo = "Direito Civil", Descricao = "Proteção patrimonial." },
            new AreaAtuacao { TenantId = primeiroEscritorio.Id, Titulo = "Direito Trabalhista", Descricao = "Garantia de direitos." },
            new AreaAtuacao { TenantId = primeiroEscritorio.Id, Titulo = "Direito Empresarial", Descricao = "Assessoria jurídica." }
        );
        db.SaveChanges();
    }
}

// 3. AS ROTAS DA VITRINE (GET)
app.MapGet("/api/tenant/{id}", async (int id, VogaContext db) =>
{
    var tenant = await db.Tenants.FindAsync(id);
    return tenant is null ? Results.NotFound() : Results.Ok(tenant);
});

app.MapGet("/api/areas/{tenantId}", async (int tenantId, VogaContext db) =>
{
    var areas = await db.AreasAtuacao.Where(a => a.TenantId == tenantId).ToListAsync();
    return Results.Ok(areas);
});

// 4. AS ROTAS DO PAINEL (POST)
app.MapPost("/api/documentos", async (DocumentoGerado novoDocumento, VogaContext db) =>
{
    novoDocumento.DataGeracao = DateTime.UtcNow;
    db.DocumentosGerados.Add(novoDocumento);
    await db.SaveChangesAsync();

    string conteudoDocumento = $@"
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Documento Voga</title></head>
        <body style='font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;'>
            <h2 style='text-align: center; color: #1C2541;'>DOCUMENTO GERADO PELO SISTEMA VOGA</h2>
            <hr style='border: 1px solid #ccc; margin-bottom: 30px;'>
            <p><strong>TIPO:</strong> {novoDocumento.TipoDocumento.ToUpper()}</p>
            <p><strong>DATA:</strong> {DateTime.Now.ToString("dd/MM/yyyy HH:mm")}</p><br>
            <p><strong>NOME DO CLIENTE:</strong> <span style='text-transform: uppercase;'>{novoDocumento.NomeClienteFinal}</span></p><br>
            <p style='text-align: justify;'>Pelo presente instrumento, os dados acima foram processados e registrados com sucesso na plataforma para os devidos fins de direito.</p>
        </body>
        </html>
    ";

    var bytesArquivo = System.Text.Encoding.UTF8.GetBytes(conteudoDocumento);
    string nomeArquivo = $"{novoDocumento.TipoDocumento.Replace(" ", "_")}_{novoDocumento.NomeClienteFinal.Replace(" ", "")}.doc";
    return Results.File(bytesArquivo, "application/msword", nomeArquivo);
});

app.MapGet("/api/documentos/{tenantId}", async (int tenantId, VogaContext db) =>
{
    var historico = await db.DocumentosGerados.Where(doc => doc.TenantId == tenantId).OrderByDescending(doc => doc.DataGeracao).ToListAsync();
    return Results.Ok(historico);
});

// 4.5. AS ROTAS DE CLIENTES
app.MapGet("/api/clientes/{tenantId}", async (int tenantId, VogaContext db) =>
{
    var clientes = await db.Clientes.Where(c => c.TenantId == tenantId).ToListAsync();
    return Results.Ok(clientes);
});

app.MapPost("/api/clientes", async (Cliente novoCliente, VogaContext db) =>
{
    db.Clientes.Add(novoCliente);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clientes/{novoCliente.TenantId}", novoCliente);
});

app.MapPut("/api/clientes/{id}", async (int id, Cliente clienteAtualizado, VogaContext db) =>
{
    var cliente = await db.Clientes.FindAsync(id);
    if (cliente is null) return Results.NotFound();
    
    cliente.Nome = clienteAtualizado.Nome;
    cliente.Cpf = clienteAtualizado.Cpf;
    cliente.Telefone = clienteAtualizado.Telefone;
    cliente.Email = clienteAtualizado.Email;
    cliente.Acao = clienteAtualizado.Acao;
    
    await db.SaveChangesAsync();
    return Results.Ok(cliente);
});

app.MapDelete("/api/clientes/{id}", async (int id, VogaContext db) =>
{
    var cliente = await db.Clientes.FindAsync(id);
    if (cliente is null) return Results.NotFound();
    
    db.Clientes.Remove(cliente);
    await db.SaveChangesAsync();
    return Results.Ok(new { Mensagem = "Cliente removido com sucesso" });
});

// 4.6. AS ROTAS DA AGENDA JUDICIAL (PRAZOS)
app.MapGet("/api/prazos/{tenantId}", async (int tenantId, VogaContext db) =>
{
    var prazos = await db.Prazos.Where(p => p.TenantId == tenantId).OrderBy(p => p.DataVencimento).ToListAsync();
    return Results.Ok(prazos);
});

app.MapPost("/api/prazos", async (Prazo novoPrazo, VogaContext db) =>
{
    db.Prazos.Add(novoPrazo);
    await db.SaveChangesAsync();
    return Results.Created($"/api/prazos/{novoPrazo.TenantId}", novoPrazo);
});

app.MapPut("/api/prazos/{id}/status", async (int id, Prazo prazoAtualizado, VogaContext db) =>
{
    var prazo = await db.Prazos.FindAsync(id);
    if (prazo is null) return Results.NotFound();
    
    prazo.Status = prazoAtualizado.Status;
    await db.SaveChangesAsync();
    return Results.Ok(prazo);
});

app.MapDelete("/api/prazos/{id}", async (int id, VogaContext db) =>
{
    var prazo = await db.Prazos.FindAsync(id);
    if (prazo is null) return Results.NotFound();
    
    db.Prazos.Remove(prazo);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// 4.7. AS ROTAS DO FINANCEIRO (LANCAMENTOS)
app.MapGet("/api/financeiro/{tenantId}", async (int tenantId, VogaContext db) =>
{
    var lancamentos = await db.Lancamentos.Where(l => l.TenantId == tenantId).OrderByDescending(l => l.DataPagamento).ToListAsync();
    return Results.Ok(lancamentos);
});

app.MapPost("/api/financeiro", async (Lancamento novoLancamento, VogaContext db) =>
{
    db.Lancamentos.Add(novoLancamento);
    await db.SaveChangesAsync();
    return Results.Created($"/api/financeiro/{novoLancamento.TenantId}", novoLancamento);
});

app.MapPut("/api/financeiro/{id}/pagar", async (int id, VogaContext db) =>
{
    var lancamento = await db.Lancamentos.FindAsync(id);
    if (lancamento is null) return Results.NotFound();
    
    lancamento.Pago = true;
    await db.SaveChangesAsync();
    return Results.Ok(lancamento);
});

app.MapDelete("/api/financeiro/{id}", async (int id, VogaContext db) =>
{
    var lancamento = await db.Lancamentos.FindAsync(id);
    if (lancamento is null) return Results.NotFound();
    
    db.Lancamentos.Remove(lancamento);
    await db.SaveChangesAsync();
    return Results.Ok();
});

// 6. ROTAS DO PORTAL DO CLIENTE
app.MapGet("/api/portal/cliente/{cpf}", async (string cpf, VogaContext db) =>
{
    var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Cpf == cpf);
    if (cliente is null) return Results.NotFound();

    var prazos = await db.Prazos
        .Where(p => p.ClienteAssociado == cliente.Nome)
        .OrderBy(p => p.DataVencimento)
        .ToListAsync();

    var documentos = await db.DocumentosGerados
        .Where(d => d.NomeClienteFinal == cliente.Nome)
        .OrderByDescending(d => d.DataGeracao)
        .ToListAsync();

    return Results.Ok(new
    {
        Cliente = cliente,
        Prazos = prazos,
        Documentos = documentos
    });
});

app.MapPut("/api/documentos/{id}/assinar", async (int id, VogaContext db) =>
{
    var documento = await db.DocumentosGerados.FindAsync(id);
    if (documento is null) return Results.NotFound();

    documento.Assinado = true;
    await db.SaveChangesAsync();
    return Results.Ok(documento);
});

// 5. A ROTA DE SEGURANÇA
app.MapPost("/api/login", (RequisicaoLogin login) =>
{
    if (login.Senha == "verum123")
    {
        return Results.Ok(new { Mensagem = "Acesso Permitido", Token = "voga-auth-master", TenantId = 1 });
    }
    return Results.Unauthorized();
});

app.Run();

record RequisicaoLogin(string Senha);

// CADEADO DE SEGURANÇA: Verifica se a pessoa passou pelo login
if (!sessionStorage.getItem('verum_token')) {
    window.location.href = 'login.html';
}

// ==========================================
// SISTEMA DE NOTIFICAÇÕES GLOBAIS
// ==========================================
let notificacoesNaoLidas = 1;
const badgeNotif = document.getElementById('badge-notificacoes');
const dropdownNotif = document.getElementById('dropdown-notificacoes');
const listaNotif = document.getElementById('lista-notificacoes');

document.getElementById('btn-notificacoes').addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownNotif.classList.toggle('active');
    if (notificacoesNaoLidas > 0) {
        notificacoesNaoLidas = 0;
        badgeNotif.style.display = 'none';
    }
});

document.addEventListener('click', () => {
    dropdownNotif.classList.remove('active');
});

function adicionarNotificacao(texto) {
    notificacoesNaoLidas++;
    badgeNotif.innerText = notificacoesNaoLidas;
    badgeNotif.style.display = 'flex';
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `<strong>Atividade</strong><br>${texto}`;
    listaNotif.prepend(item);
}
async function carregarHistorico() {
    try {
        // Busca o histórico real da API C#
        const resposta = await fetch('https://vogaapi.onrender.com/api/documentos/1');
        if (!resposta.ok) throw new Error("Erro ao buscar histórico");

        const documentos = await resposta.json();

        // 1. ATUALIZA O DASHBOARD (Visão Geral)
        const tbodyDashboard = document.getElementById('tabela-historico');
        if (tbodyDashboard) {
            tbodyDashboard.innerHTML = '';
            documentos.slice(0, 5).forEach(doc => { // Mostra apenas os 5 últimos no dashboard
                const dataFormatada = new Date(doc.dataGeracao).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                tr.innerHTML = `
                    <td style="padding: 10px; color: #ccc;">${dataFormatada}</td>
                    <td style="padding: 10px; font-weight: bold;">${doc.nomeClienteFinal}</td>
                    <td style="padding: 10px; color: #aaa;">${doc.tipoDocumento}</td>
                `;
                tbodyDashboard.appendChild(tr);
            });
        }

        // 2. ATUALIZA A ABA "DOCUMENTOS GERADOS" (Tabela Completa) - O QUE ESTAVA FALTANDO!
        const tbodyGeral = document.getElementById('tabela-documentos-geral');
        if (tbodyGeral) {
            tbodyGeral.innerHTML = '';
            documentos.forEach(doc => {
                const dataFormatada = new Date(doc.dataGeracao).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                const badgeAssinatura = doc.assinado ? '<span style="color: #2fd65e; font-size: 0.85rem;">✔ Assinado</span>' : '<span style="color: #ffcc00; font-size: 0.85rem;">⏳ Pendente</span>';
                tr.innerHTML = `
                    <td style="padding: 15px; color: #fff;">${dataFormatada}</td>
                    <td style="padding: 15px; font-weight: bold; color: #D4AF37;">${doc.nomeClienteFinal}</td>
                    <td style="padding: 15px; color: #ccc;">${doc.tipoDocumento}</td>
                    <td style="padding: 15px; text-align: center;">${badgeAssinatura}</td>
                    <td style="padding: 15px; text-align: right;">
                        <button class="btn-restrito" style="padding: 5px 12px;" onclick="window.print()">Visualizar</button>
                    </td>
                `;
                tbodyGeral.appendChild(tr);
            });
        }

        // Tabela de Central de Assinaturas
        const tbodyAssinaturas = document.querySelector('#view-assinaturas tbody');
        if (tbodyAssinaturas) {
            tbodyAssinaturas.innerHTML = '';
            documentos.forEach((doc) => {
                const dataFormatada = new Date(doc.dataGeracao).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                
                const statusHtml = doc.assinado 
                    ? `<span style="color: #2fd65e; border: 1px solid #2fd65e; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Assinado</span>` 
                    : `<span style="color: var(--cor-destaque); border: 1px solid var(--cor-destaque); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Pendente</span>`;

                tr.innerHTML = `
                    <td style="padding: 10px; font-weight: bold; color: #fff;">${doc.tipoDocumento.replace(/ /g, '_')}.doc</td>
                    <td style="padding: 10px; color: #aaa;">${doc.nomeClienteFinal}</td>
                    <td style="padding: 10px; color: #aaa;">${dataFormatada}</td>
                    <td style="padding: 10px;">${statusHtml}</td>
                `;
                tbodyAssinaturas.appendChild(tr);
            });
        }

        // 3. ATUALIZA OS INDICADORES (KPIs)
        const kpiTotal = document.getElementById('kpi-total-docs');
        if (kpiTotal) kpiTotal.innerText = documentos.length;

    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
    }
}
// Função global para abrir o modal de assinatura do documento
function abrirEditorAssinatura(idx) {
    let documentos = JSON.parse(localStorage.getItem('verum_documentos')) || [];
    if (documentos[idx].status === 'pendente') {
        document.getElementById('modal-assinatura').style.display = 'flex';
        // Armazena no canvas qual index está sendo assinado
        document.getElementById('modal-assinatura').setAttribute('data-doc-idx', idx);
        if (typeof ctx !== 'undefined' && typeof canvas !== 'undefined') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// carregarHistorico() agora é chamado diretamente no bloco da Fase J abaixo


let payloadGlobal = {};

// Ao submeter o form, APENAS abre o modal de preview
document.getElementById('form-documento').addEventListener('submit', function (e) {
    e.preventDefault();

    payloadGlobal = {
        tenantId: 1,
        nomeClienteFinal: document.getElementById('nome-cliente').value,
        cpfCliente: document.getElementById('cpf-cliente').value,
        acaoCliente: document.getElementById('acao-cliente').value,
        tipoDocumento: document.getElementById('tipo-doc').options[document.getElementById('tipo-doc').selectedIndex].text
    };

    // Gera um Mock Dinâmico rico simulando o documento Word/PDF
    let textoPreview = `<h3 style="text-align: center; text-transform: uppercase;">${payloadGlobal.tipoDocumento}</h3><br><br>`;
    textoPreview += `<p><strong>OUTORGANTE:</strong> <strong>${payloadGlobal.nomeClienteFinal}</strong>, inscrito(a) no CPF sob o nº ${payloadGlobal.cpfCliente}, residente e domiciliado(a) em endereço constante na ficha de atendimento.</p><br>`;
    textoPreview += `<p><strong>PODERES:</strong> Pelo presente instrumento, nomeia e constitui seus procuradores os advogados integrantes do escritório Verum Workspace, concedendo amplos poderes para o foro em geral, com a finalidade específica de propor e acompanhar até final decisão a <strong>${payloadGlobal.acaoCliente}</strong>.</p><br><br>`;
    textoPreview += `<p style="text-align: center;">Local e data.</p><br><br><p style="text-align: center;">_____________________________________<br><strong>${payloadGlobal.nomeClienteFinal}</strong></p>`;

    document.getElementById('conteudo-preview').innerHTML = textoPreview;
    document.getElementById('modal-preview').style.display = 'flex';
});

// Fechar o modal
document.getElementById('btn-cancelar-preview').addEventListener('click', () => {
    document.getElementById('modal-preview').style.display = 'none';
});

// Confirmar Geração Local (Local Storage)
// Confirmar Geração Real (API C#)
document.getElementById('btn-confirmar-geracao').addEventListener('click', async function () {
    const btnConfirmar = this;
    btnConfirmar.innerText = "Processando e Gerando...";
    btnConfirmar.style.opacity = "0.7";
    btnConfirmar.disabled = true;

    // O molde exato que a classe DocumentoGerado.cs espera
    const novoDocumento = {
        tenantId: 1,
        nomeClienteFinal: payloadGlobal.nomeClienteFinal,
        tipoDocumento: payloadGlobal.tipoDocumento
    };

    try {
        // Envia para a API gerar o documento de Word
        const resposta = await fetch('https://vogaapi.onrender.com/api/documentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoDocumento)
        });
        if (!resposta.ok) throw new Error("Erro ao gerar documento.");

        // === NOVA LÓGICA DE DOWNLOAD À PROVA DE FALHAS ===
        const blob = await resposta.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        // 1. Removemos o 'display: none' (alguns navegadores bloqueiam cliques invisíveis)
        a.href = url;

        // 2. Colocamos um nome limpo e fixo temporariamente para evitar erros de caracteres
        a.download = "Documento_Verum.doc";

        document.body.appendChild(a);

        // 3. Força o clique diretamente
        a.click();

        // 4. Remove da tela imediatamente após o clique
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // =================================================

        // Sucesso e fechar modal
        document.getElementById('modal-preview').style.display = 'none';
        await carregarHistorico();
    } catch (erro) {
        console.error("Falha ao salvar:", erro);
        Swal.fire('Erro', 'Não foi possível gerar a peça.', 'error');
    } finally {
        btnConfirmar.innerText = "Emitir Versão Final";
        btnConfirmar.style.opacity = "1";
        btnConfirmar.disabled = false;
    }
});

// Navegação SPA (Single Page Application)
document.querySelectorAll('.saas-menu a').forEach(link => {
    link.addEventListener('click', function (e) {
        if (this.getAttribute('href') === 'index.html') return;
        e.preventDefault();
        document.querySelectorAll('.saas-menu a').forEach(l => l.classList.remove('ativo'));
        this.classList.add('ativo');

        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('view-active');
            view.classList.remove('view-transition');
        });

        const targetId = this.getAttribute('href').substring(1);
        const targetView = document.getElementById('view-' + targetId) || document.getElementById('view-dashboard');

        targetView.classList.add('view-active');
        // Força o reflow para a animação reiniciar
        void targetView.offsetWidth;
        targetView.classList.add('view-transition');
    });
});

// ==========================================
// MINI-CRM LEGADO REMOVIDO (migrado para Fase J abaixo)
// ==========================================

// BARRA DE BUSCA GLOBAL
document.getElementById('input-busca-global').addEventListener('input', function () {
    const termo = this.value.toLowerCase();

    // Busca no histórico (Dashboard)
    const trsHist = document.querySelectorAll('#tabela-historico tr');
    trsHist.forEach(tr => {
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(termo) ? '' : 'none';
    });

    // Busca na tabela de clientes
    const trsCli = document.querySelectorAll('#tabela-clientes tr');
    trsCli.forEach(tr => {
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(termo) ? '' : 'none';
    });
});

// Inicializa os dados ao abrir
carregarClientes();
carregarHistorico();

// Inicializa Gráficos com dados reais do localStorage (Fase K)
document.addEventListener('DOMContentLoaded', () => {
    const documentos = JSON.parse(localStorage.getItem('verum_documentos')) || [];
    carregarClientes();
    carregarHistorico();
    carregarPrazos();      // Nova função para a Agenda
    carregarFinanceiro();  // Nova função para o Financeiro
    // Calcular docs por semana (últimas 4 semanas)
    const agora = new Date();
    const semanas = [0, 0, 0, 0];
    documentos.forEach(doc => {
        const data = new Date(doc.dataGeracao);
        const diffDias = Math.floor((agora - data) / (1000 * 60 * 60 * 24));
        const semana = Math.min(3, Math.floor(diffDias / 7));
        semanas[3 - semana]++;
    });

    const ctx = document.getElementById('graficoDocumentos').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
            datasets: [{
                label: 'Documentos Emitidos',
                data: semanas,
                backgroundColor: 'rgba(212, 175, 55, 0.7)',
                borderColor: 'rgba(212, 175, 55, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#ccc' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });

    // Gráfico de Pizza com dados reais
    const tipos = {};
    documentos.forEach(doc => {
        const t = doc.tipoDocumento || 'Outros';
        tipos[t] = (tipos[t] || 0) + 1;
    });
    const labels = Object.keys(tipos).length > 0 ? Object.keys(tipos) : ['Sem dados'];
    const values = Object.values(tipos).length > 0 ? Object.values(tipos) : [1];
    const cores = ['rgba(212, 175, 55, 0.8)', 'rgba(47, 214, 94, 0.8)', 'rgba(0, 195, 255, 0.8)', 'rgba(255, 77, 77, 0.8)', 'rgba(255, 255, 255, 0.5)'];

    const ctxTipos = document.getElementById('graficoTipos').getContext('2d');
    new Chart(ctxTipos, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: cores.slice(0, labels.length),
                borderColor: 'rgba(0,0,0,0.5)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
});

// ==========================================
// EXPORTAR DADOS (Fase D)
// ==========================================
window.exportarCSV = function () {
    let csvContent = "data:text/csv;charset=utf-8,ID,Nome,CPF\n";
    clientes.forEach(function (rowArray) {
        let row = rowArray.id + "," + rowArray.nome + "," + rowArray.cpf;
        csvContent += row + "\r\n";
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voga_clientes_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    adicionarNotificacao('Base de Clientes exportada para CSV.');
};

// ==========================================
// KANBAN DRAG AND DROP & SLIDE-OVER (Fase D)
// ==========================================
let draggedCard = null;

document.querySelectorAll('.kanban-card').forEach(card => {
    // Drag Start
    card.addEventListener('dragstart', function (e) {
        draggedCard = this;
        setTimeout(() => this.style.opacity = '0.5', 0);
    });

    // Drag End
    card.addEventListener('dragend', function () {
        setTimeout(() => {
            this.style.opacity = '1';
            draggedCard = null;
        }, 0);
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    });

    // Clique para abrir Slide-Over (Painel de Detalhes)
    card.addEventListener('click', function () {
        const titulo = this.querySelector('.kanban-card-title').innerText;
        const cliente = this.querySelector('.kanban-card-client').innerText;

        document.getElementById('conteudo-slide').innerHTML = `
                    <h4 style="color: var(--cor-destaque); margin-bottom: 10px;">${titulo}</h4>
                    <p>${cliente}</p>
                    <hr style="border:0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
                    <p style="color: #aaa; font-size: 0.85rem; margin-bottom: 15px;">Histórico de Movimentação</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                        <small>Hoje, 10:00 - Criado o processo</small><br>
                        <small>Hoje, 14:30 - Movido para andamento</small>
                    </div>
                    <button class="btn-primario" style="width: 100%;" onclick="alert('Funcionalidade de edição em breve!')">Editar Processo</button>
                `;
        document.getElementById('slide-detalhes').classList.add('open');
    });
});

// Eventos das Colunas para aceitar o Card
document.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    col.addEventListener('dragleave', function () {
        this.classList.remove('drag-over');
    });

    col.addEventListener('drop', function () {
        this.classList.remove('drag-over');
        if (draggedCard) {
            this.appendChild(draggedCard);

            // Se foi dropado na coluna concluído
            if (this.getAttribute('data-status') === 'concluido') {
                draggedCard.style.borderLeft = '3px solid #2fd65e';

                Swal.fire({
                    title: 'Tarefa Concluída!',
                    text: 'Processo movido com sucesso.',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    background: 'rgba(40, 167, 69, 0.9)',
                    color: '#fff'
                });

                adicionarNotificacao('Um processo foi marcado como Concluído!');
            }

            // Atualiza contadores (Visual)
            document.querySelectorAll('.kanban-col').forEach(c => {
                const count = c.querySelectorAll('.kanban-card').length;
                c.querySelector('.badge').innerText = count;
            });
        }
    });
});

// Fechar gaveta
document.getElementById('btn-fechar-slide').addEventListener('click', () => {
    document.getElementById('slide-detalhes').classList.remove('open');
});

// ==========================================
// VERUM AI CHATBOT (Fase F/G)
// ==========================================
const btnAiChat = document.getElementById('btn-ai-chat');
const aiChatWindow = document.getElementById('ai-chat-window');
const btnAiSend = document.getElementById('btn-ai-send');
const aiInput = document.getElementById('ai-input');
const aiChatBody = document.getElementById('ai-chat-body');

btnAiChat.addEventListener('click', () => {
    aiChatWindow.classList.toggle('open');
});

function sendAiMessage() {
    const text = aiInput.value.trim();
    if (!text) return;

    // User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.innerText = text;
    aiChatBody.appendChild(userMsg);
    aiInput.value = '';

    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    // Verum AI Typing Indicator
    const typingMsg = document.createElement('div');
    typingMsg.className = 'ai-msg system';
    typingMsg.innerHTML = `<em>Verum AI está digitando...</em>`;
    aiChatBody.appendChild(typingMsg);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    // IA Response Logic
    setTimeout(() => {
        aiChatBody.removeChild(typingMsg); // Remove o "digitando..."

        const sysMsg = document.createElement('div');
        sysMsg.className = 'ai-msg system';

        const lowerText = text.toLowerCase();
        if (lowerText.includes('resumo') || lowerText.includes('resumir')) {
            sysMsg.innerHTML = `<strong>Resumo do Caso:</strong><br>Ação Trabalhista (Reclamante: Mariana Silva). O processo trata de vínculo empregatício não reconhecido e horas extras. A última movimentação foi a juntada da contestação pela Reclamada.`;
        } else if (lowerText.includes('cláusula') || lowerText.includes('contrato')) {
            sysMsg.innerHTML = `Aqui está uma sugestão de <strong>Cláusula de Confidencialidade (NDA)</strong>:<br><br><em>"As Partes obrigam-se, por si, seus representantes e empregados, a manter o mais absoluto sigilo sobre quaisquer informações confidenciais que venham a ter acesso, sob pena de multa de R$ 50.000,00."</em><br><br>Deseja inserir no editor?`;
        } else if (lowerText.includes('jurisprudência') || lowerText.includes('decisão')) {
            sysMsg.innerHTML = `<strong>Jurisprudência Encontrada (STJ):</strong><br><em>"A responsabilidade civil em casos de dano moral presumido (in re ipsa) independe da prova do prejuízo..."</em> (REsp 1.234.567/SP). Posso formatar a citação para você colar na peça.`;
        } else {
            sysMsg.innerHTML = `Compreendi a sua solicitação. Posso aprofundar essa pesquisa em nossa base de dados ou redigir um documento com base nesse contexto. Qual prefere?`;
        }

        aiChatBody.appendChild(sysMsg);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }, 1500);
}

btnAiSend.addEventListener('click', sendAiMessage);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAiMessage();
});

// ==========================================
// ASSINATURA EM TELA (Fase F)
// ==========================================
const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
let isDrawing = false;

// Ajustar tamanho do canvas
canvas.width = 460;
canvas.height = 200;

ctx.strokeStyle = '#000';
ctx.lineWidth = 3;
ctx.lineCap = 'round';

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

document.getElementById('btn-limpar-assinatura').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('btn-salvar-assinatura').addEventListener('click', () => {
    document.getElementById('modal-assinatura').style.display = 'none';

    // Alterar o status do documento para assinado
    let idx = document.getElementById('modal-assinatura').getAttribute('data-doc-idx');
    if (idx !== null) {
        let documentos = JSON.parse(localStorage.getItem('verum_documentos')) || [];
        if (documentos[idx]) {
            documentos[idx].status = 'assinado';
            localStorage.setItem('verum_documentos', JSON.stringify(documentos));
            carregarHistorico(); // Atualiza a tabela
        }
    }

    Swal.fire({
        title: 'Assinatura Anexada',
        text: 'A rubrica foi digitalizada e embutida no documento com sucesso.',
        icon: 'success',
        background: 'rgba(11, 19, 43, 0.9)',
        color: '#fff',
        confirmButtonColor: '#D4AF37'
    });
    adicionarNotificacao('Assinatura digital inserida via tela de desenho.');
});

// Removendo listener fixo antigo já que a função agora é dinâmica via abrirEditorAssinatura()



// ==========================================
// FASE G: DARK/LIGHT MODE TOGGLE
// ==========================================
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const iconTheme = document.getElementById('icon-theme');

// Verifica preferência salva
if (localStorage.getItem('verum_theme') === 'light') {
    document.body.classList.add('light-mode');
    iconTheme.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
}

btnThemeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');

    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('verum_theme', 'light');
        // Ícone de Sol
        iconTheme.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        localStorage.setItem('verum_theme', 'dark');
        // Ícone de Lua
        iconTheme.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
});

// ==========================================
// FASE G: TO-DO LIST LOGIC
// ==========================================
const btnAddTodo = document.getElementById('btn-add-todo');
const inputTodo = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

function addTodo() {
    const text = inputTodo.value.trim();
    if (!text) return;

    const label = document.createElement('label');
    label.className = 'todo-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.innerText = text;

    label.appendChild(checkbox);
    label.appendChild(span);

    todoList.appendChild(label);
    inputTodo.value = '';
    adicionarNotificacao('Nova tarefa adicionada à checklist diária.');
}

btnAddTodo.addEventListener('click', addTodo);
inputTodo.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// ==========================================
// FASE J: PERSISTÊNCIA VIA LOCALSTORAGE (OPÇÃO A)
// ==========================================

// --- DECLARAÇÕES DE FUNÇÕES ---

// 1. Função para CARREGAR os clientes do Banco de Dados
async function carregarClientes() {
    try {
        // Pede a lista de clientes do escritório 1 à tua API
        const resposta = await fetch('https://vogaapi.onrender.com/api/clientes/1');

        if (!resposta.ok) {
            throw new Error("Erro ao buscar clientes da API");
        }

        const clientes = await resposta.json();
        // Atualiza o Número (KPI) no Dashboard
        const kpiClientes = document.getElementById('kpi-clientes');
        if (kpiClientes) kpiClientes.innerText = clientes.length;
        // Preenche a Tabela Visual
        const tbody = document.getElementById('tabela-clientes');
        if (tbody) {
            tbody.innerHTML = '';
            clientes.forEach((cli) => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                tr.innerHTML = `
                    <td style="padding: 10px; font-weight: bold; color: #fff;">${cli.nome}</td>
                    <td style="padding: 10px; color: #aaa;">${cli.cpf}</td>
                    <td style="padding: 10px; color: #aaa;">${cli.telefone || '—'}</td>
                    <td style="padding: 10px; color: #aaa;">${cli.acao || '—'}</td>
                    <td style="padding: 10px; text-align: right;">
                        <button class="btn-restrito" style="padding: 4px 10px; font-size: 0.8rem; margin-right: 5px;" onclick="abrirModalCliente(${cli.id})">Detalhes</button>
                        <button class="btn-restrito" style="padding: 4px 10px; font-size: 0.8rem; color: #ff4d4d; border-color: #ff4d4d;" onclick="removerCliente(${cli.id})">Remover</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Preenche o Seletor do "Emissor Ágil"
        const seletor = document.getElementById('seletor-cliente');
        if (seletor) {
            seletor.innerHTML = '<option value="">-- Selecione ou digite manualmente abaixo --</option>';
            clientes.forEach(cli => {
                const opt = document.createElement('option');
                opt.value = JSON.stringify(cli);
                opt.innerText = `${cli.nome} (${cli.acao || 'Sem ação cadastrada'})`;
                seletor.appendChild(opt);
            });
        }
    } catch (erro) {
        console.error("Falha ao carregar os clientes do banco de dados:", erro);
    }
}

async function removerCliente(id) {
    // Alerta de Confirmação usando SweetAlert2
    const confirmacao = await Swal.fire({
        title: 'Tem certeza?',
        text: "Essa ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        background: 'rgba(11, 19, 43, 0.9)',
        color: '#fff',
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#555',
        confirmButtonText: 'Sim, remover!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacao.isConfirmed) {
        try {
            const resposta = await fetch(`https://vogaapi.onrender.com/api/clientes/${id}`, {
                method: 'DELETE'
            });

            if (!resposta.ok) {
                throw new Error("Erro ao remover cliente na API");
            }

            carregarClientes();

            Swal.fire({
                title: 'Removido!',
                text: 'O cliente foi excluído da base de dados.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                background: 'rgba(47, 214, 94, 0.9)',
                color: '#fff'
            });
            adicionarNotificacao('Cliente excluído do sistema.');
        } catch (erro) {
            console.error(erro);
            Swal.fire('Erro', 'Não foi possível remover o cliente.', 'error');
        }
    }
}

async function abrirModalCliente(id) {
    try {
        const resposta = await fetch('https://vogaapi.onrender.com/api/clientes/1');
        const clientes = await resposta.json();
        const cli = clientes.find(c => c.id === id);

        if (cli) {
            document.getElementById('modal-cli-nome').innerText = cli.nome;
            document.getElementById('modal-cli-grid').innerHTML = `
                <div class="form-grupo">
                    <label>Nome</label>
                    <input type="text" id="edit-cli-nome" value="${cli.nome}">
                </div>
                <div class="form-grupo">
                    <label>CPF</label>
                    <input type="text" id="edit-cli-cpf" value="${cli.cpf}">
                </div>
                <div class="form-grupo">
                    <label>Telefone</label>
                    <input type="text" id="edit-cli-telefone" value="${cli.telefone}">
                </div>
                <div class="form-grupo">
                    <label>E-mail</label>
                    <input type="text" id="edit-cli-email" value="${cli.email}">
                </div>
                <div class="form-grupo" style="grid-column: span 2;">
                    <label>Ação Principal</label>
                    <input type="text" id="edit-cli-acao" value="${cli.acao}">
                </div>
            `;
            // Save ID for editing later
            document.getElementById('modal-cliente').setAttribute('data-id', id);
            document.getElementById('modal-cliente').classList.add('open');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Erro', 'Não foi possível carregar os detalhes do cliente.', 'error');
    }
}

async function editarClienteModal() {
    const id = document.getElementById('modal-cliente').getAttribute('data-id');
    if (!id) return;

    const clienteAtualizado = {
        tenantId: 1, // Fixado como exemplo
        nome: document.getElementById('edit-cli-nome').value.trim(),
        cpf: document.getElementById('edit-cli-cpf').value.trim(),
        telefone: document.getElementById('edit-cli-telefone').value.trim(),
        email: document.getElementById('edit-cli-email').value.trim(),
        acao: document.getElementById('edit-cli-acao').value.trim()
    };

    try {
        const resposta = await fetch(`https://vogaapi.onrender.com/api/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clienteAtualizado)
        });

        if (!resposta.ok) {
            throw new Error("Erro ao atualizar cliente na API");
        }

        document.getElementById('modal-cliente').classList.remove('open');
        carregarClientes(); // Atualiza a tabela com o dado novo

        Swal.fire({
            title: 'Cliente Atualizado!',
            text: 'As informações foram alteradas com sucesso.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            background: 'rgba(11, 19, 43, 0.9)',
            color: '#fff'
        });
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível salvar as alterações.', 'error');
    }
}

function initKanbanDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const cols = document.querySelectorAll('.kanban-col');
    let draggedCard = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', function () {
            draggedCard = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });
        card.addEventListener('dragend', function () {
            setTimeout(() => {
                this.style.opacity = '1';
                draggedCard = null;
                atualizarContadoresKanban();
            }, 0);
        });
    });

    cols.forEach(col => {
        col.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.style.background = 'rgba(255,255,255,0.05)';
        });
        col.addEventListener('dragleave', function () {
            this.style.background = 'transparent';
        });
        col.addEventListener('drop', function () {
            this.style.background = 'transparent';
            if (draggedCard) {
                this.appendChild(draggedCard);
            }
        });
    });
}

function atualizarContadoresKanban() {
    const cols = document.querySelectorAll('.kanban-col');
    cols.forEach(col => {
        const header = col.querySelector('.kanban-col-header');
        const badge = header.querySelector('.badge');
        const numCards = col.querySelectorAll('.kanban-card').length;
        if (badge) badge.innerText = numCards;
    });
}

// --- REGISTRAR LISTENERS ---

// Form CRM: Cadastro de Clientes (via onclick para evitar reload)
async function salvarCliente() {
    const nome = document.getElementById('novo-nome').value.trim();
    const cpf = document.getElementById('novo-cpf').value.trim();
    const telefone = document.getElementById('novo-telefone').value.trim();
    const email = document.getElementById('novo-email').value.trim();
    const acao = document.getElementById('novo-acao').value.trim();

    if (!nome || !cpf) {
        Swal.fire({
            title: 'Campos obrigatórios!',
            text: 'Preencha ao menos o nome e CPF do cliente.',
            icon: 'warning',
            background: 'rgba(11, 19, 43, 0.9)',
            color: '#fff',
            confirmButtonColor: '#D4AF37'
        });
        return;
    }

    // Molde exato que o teu C# (Cliente.cs) está à espera
    const novoCliente = {
        tenantId: 1,
        nome: nome,
        cpf: cpf,
        telefone: telefone,
        email: email,
        acao: acao
    };

    try {
        // Envia os dados para a Nuvem!
        const resposta = await fetch('https://vogaapi.onrender.com/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoCliente)
        });

        if (resposta.ok) {
            // Limpa o formulário
            document.getElementById('novo-nome').value = '';
            document.getElementById('novo-cpf').value = '';
            document.getElementById('novo-telefone').value = '';
            document.getElementById('novo-email').value = '';
            document.getElementById('novo-acao').value = '';

            // Atualiza a tabela chamando a API novamente
            carregarClientes();

            Swal.fire({
                title: 'Cliente Cadastrado!',
                text: nome + ' foi salvo na base de dados com sucesso.',
                icon: 'success',
                background: 'rgba(11, 19, 43, 0.9)',
                color: '#fff',
                confirmButtonColor: '#D4AF37',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            adicionarNotificacao('Novo cliente cadastrado no sistema: <b>' + nome + '</b>');
        } else {
            throw new Error("Falha ao salvar no servidor.");
        }
    } catch (erro) {
        console.error("Erro na API:", erro);
        Swal.fire('Erro', 'Não foi possível conectar ao servidor.', 'error');
    }
}

// Filtro inline de clientes
window.filtrarClientes = function () {
    const termo = (document.getElementById('filtro-clientes').value || '').toLowerCase();
    const trs = document.querySelectorAll('#tabela-clientes tr');
    trs.forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(termo) ? '' : 'none';
    });
};

// Modal de Detalhes do Cliente
let clienteEditandoIdx = null;
window.abrirDetalhesCliente = function (index) {
    const clientes = JSON.parse(localStorage.getItem('verum_clientes')) || [];
    const cli = clientes[index];
    if (!cli) return;
    clienteEditandoIdx = index;

    document.getElementById('modal-cli-nome').innerText = cli.nome;
    document.getElementById('modal-cli-grid').innerHTML = `
                <div class="detail-item"><label>Nome</label><input type="text" id="edit-cli-nome" value="${cli.nome}" style="width:100%;padding:8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;"></div>
                <div class="detail-item"><label>CPF</label><span>${cli.cpf}</span></div>
                <div class="detail-item"><label>Telefone</label><input type="text" id="edit-cli-tel" value="${cli.telefone || ''}" style="width:100%;padding:8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;"></div>
                <div class="detail-item"><label>E-mail</label><input type="text" id="edit-cli-email" value="${cli.email || ''}" style="width:100%;padding:8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;"></div>
                <div class="detail-item" style="grid-column: span 2;"><label>Tipo de Ação</label><input type="text" id="edit-cli-acao" value="${cli.acao || ''}" style="width:100%;padding:8px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;"></div>
            `;

    // Documentos vinculados
    const docs = JSON.parse(localStorage.getItem('verum_documentos')) || [];
    const docsCliente = docs.filter(d => d.nomeClienteFinal === cli.nome);
    const docsEl = document.getElementById('modal-cli-docs');
    if (docsCliente.length > 0) {
        docsEl.innerHTML = docsCliente.map(d => `
                    <div class="detail-history-item">
                        <span class="dot"></span>
                        <span>${d.tipoDocumento} — <span class="status-badge ${d.status === 'assinado' ? 'status-assinado' : 'status-pendente'}">${d.status === 'assinado' ? 'Assinado' : 'Pendente'}</span></span>
                    </div>
                `).join('');
    } else {
        docsEl.innerHTML = '<p style="color: #6c757d; font-size: 0.85rem;">Nenhum documento emitido para este cliente.</p>';
    }

    document.getElementById('modal-cliente').classList.add('open');
};

window.editarClienteModal = function () {
    if (clienteEditandoIdx === null) return;
    let clientes = JSON.parse(localStorage.getItem('verum_clientes')) || [];
    clientes[clienteEditandoIdx].nome = document.getElementById('edit-cli-nome').value.trim() || clientes[clienteEditandoIdx].nome;
    clientes[clienteEditandoIdx].telefone = document.getElementById('edit-cli-tel').value.trim();
    clientes[clienteEditandoIdx].email = document.getElementById('edit-cli-email').value.trim();
    clientes[clienteEditandoIdx].acao = document.getElementById('edit-cli-acao').value.trim();
    localStorage.setItem('verum_clientes', JSON.stringify(clientes));
    carregarClientes();
    document.getElementById('modal-cliente').classList.remove('open');
    Swal.fire({ title: 'Atualizado!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: 'rgba(11,19,43,0.9)', color: '#fff' });
};

// ==========================================
// FASE K: FINANCEIRO CRUD
// ==========================================
function carregarFaturas() {
    let faturas = JSON.parse(localStorage.getItem('verum_faturas'));
    if (!faturas || faturas.length === 0) {
        faturas = [
            { cliente: "Empresa XPTO", descricao: "Assessoria Mensal (Abr)", valor: 5000, vencimento: "2026-04-30", status: "pago" },
            { cliente: "Carlos Almeida", descricao: "Honorários Iniciais", valor: 3500, vencimento: "2026-04-15", status: "pendente" },
            { cliente: "Mariana Silva", descricao: "Contrato de Honorários", valor: 2500, vencimento: "2026-05-10", status: "pendente" }
        ];
        localStorage.setItem('verum_faturas', JSON.stringify(faturas));
    }

    const tbody = document.getElementById('tabela-faturas');
    if (tbody) {
        tbody.innerHTML = '';
        const hoje = new Date();
        faturas.forEach((fat, idx) => {
            const venc = new Date(fat.vencimento);
            const vencido = fat.status === 'pendente' && venc < hoje;
            let badgeClass = fat.status === 'pago' ? 'status-assinado' : (vencido ? 'status-pendente' : 'status-pendente');
            let badgeText = fat.status === 'pago' ? 'Pago' : (vencido ? 'Vencido' : 'A vencer');

            const tr = document.createElement('tr');
            tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
            tr.innerHTML = `
                        <td style="padding: 10px; font-weight: bold; color: #fff;">${fat.cliente}</td>
                        <td style="padding: 10px; color: #aaa;">${fat.descricao}</td>
                        <td style="padding: 10px; color: #fff;">R$ ${fat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td style="padding: 10px; color: #aaa;">${new Date(fat.vencimento).toLocaleDateString('pt-BR')}</td>
                        <td style="padding: 10px;"><span class="status-badge ${badgeClass}">${badgeText}</span></td>
                        <td style="padding: 10px; text-align: right;">
                            ${fat.status !== 'pago' ? `<button class="btn-restrito" style="padding: 4px 10px; font-size: 0.8rem; color: #2fd65e; border-color: #2fd65e; margin-right: 5px;" onclick="marcarPago(${idx})">Pagar</button>` : ''}
                            <button class="btn-restrito" style="padding: 4px 10px; font-size: 0.8rem; color: #ff4d4d; border-color: #ff4d4d;" onclick="removerFatura(${idx})">×</button>
                        </td>
                    `;
            tbody.appendChild(tr);
        });
    }

    // Atualizar KPIs Financeiros
    const pago = faturas.filter(f => f.status === 'pago').reduce((s, f) => s + f.valor, 0);
    const pendente = faturas.filter(f => f.status === 'pendente').reduce((s, f) => s + f.valor, 0);
    const hoje2 = new Date();
    const vencido = faturas.filter(f => f.status === 'pendente' && new Date(f.vencimento) < hoje2).reduce((s, f) => s + f.valor, 0);

    const elR = document.getElementById('kpi-receita');
    const elA = document.getElementById('kpi-a-receber');
    const elV = document.getElementById('kpi-vencido');
    if (elR) elR.innerText = 'R$ ' + pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    if (elA) elA.innerText = 'R$ ' + pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    if (elV) elV.innerText = 'R$ ' + vencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

window.marcarPago = function (idx) {
    let faturas = JSON.parse(localStorage.getItem('verum_faturas')) || [];
    if (faturas[idx]) { faturas[idx].status = 'pago'; }
    localStorage.setItem('verum_faturas', JSON.stringify(faturas));
    carregarFaturas();
    adicionarNotificacao('Fatura marcada como Paga!');
};

window.removerFatura = function (idx) {
    let faturas = JSON.parse(localStorage.getItem('verum_faturas')) || [];
    faturas.splice(idx, 1);
    localStorage.setItem('verum_faturas', JSON.stringify(faturas));
    carregarFaturas();
};

window.abrirModalFatura = function () {
    document.getElementById('modal-nova-fatura').classList.add('open');
};

window.salvarFatura = function () {
    const cli = document.getElementById('fat-cliente').value.trim();
    const desc = document.getElementById('fat-descricao').value.trim();
    const val = parseFloat(document.getElementById('fat-valor').value);
    const venc = document.getElementById('fat-vencimento').value;
    if (!cli || !desc || !val || !venc) {
        Swal.fire({ title: 'Preencha todos os campos!', icon: 'warning', background: 'rgba(11,19,43,0.9)', color: '#fff', confirmButtonColor: '#D4AF37' });
        return;
    }
    let faturas = JSON.parse(localStorage.getItem('verum_faturas')) || [];
    faturas.push({ cliente: cli, descricao: desc, valor: val, vencimento: venc, status: 'pendente' });
    localStorage.setItem('verum_faturas', JSON.stringify(faturas));
    document.getElementById('fat-cliente').value = '';
    document.getElementById('fat-descricao').value = '';
    document.getElementById('fat-valor').value = '';
    document.getElementById('fat-vencimento').value = '';
    document.getElementById('modal-nova-fatura').classList.remove('open');
    carregarFaturas();
    Swal.fire({ title: 'Fatura Criada!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, background: 'rgba(11,19,43,0.9)', color: '#fff' });
    adicionarNotificacao('Nova fatura: <b>' + desc + '</b> para ' + cli);
};

// Emissor Ágil: Auto-preenchimento ao selecionar cliente
const seletorCliente = document.getElementById('seletor-cliente');
if (seletorCliente) {
    seletorCliente.addEventListener('change', function (e) {
        if (!e.target.value) {
            document.getElementById('nome-cliente').value = "";
            document.getElementById('cpf-cliente').value = "";
            document.getElementById('acao-cliente').value = "";
            return;
        }
        const cli = JSON.parse(e.target.value);
        document.getElementById('nome-cliente').value = cli.nome;
        document.getElementById('cpf-cliente').value = cli.cpf;
        document.getElementById('acao-cliente').value = cli.acao || "";
    });
}

// --- INICIALIZAÇÃO (roda por último) ---
carregarClientes();
carregarHistorico();
carregarFaturas();
initKanbanDragAndDrop();

// ==========================================
// FASE K: SPLASH SCREEN
// ==========================================
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('hidden');
}, 1400);

// ==========================================
// FASE K: SIDEBAR TOGGLE
// ==========================================
const sidebarEl = document.querySelector('.saas-sidebar');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

// Restaurar estado salvo
if (localStorage.getItem('verum_sidebar') === 'collapsed') {
    sidebarEl.classList.add('collapsed');
}

btnToggleSidebar.addEventListener('click', () => {
    sidebarEl.classList.toggle('collapsed');
    localStorage.setItem('verum_sidebar', sidebarEl.classList.contains('collapsed') ? 'collapsed' : 'expanded');
});

// ==========================================
// FASE K: BREADCRUMBS
// ==========================================
const breadcrumbNames = {
    'dashboard': 'Visão Geral',
    'processos': 'Processos',
    'radar': 'Radar Oficial',
    'jurimetria': 'Jurimetria (IA)',
    'drive': 'Verum Drive',
    'agenda': 'Agenda Judicial',
    'financeiro': 'Financeiro',
    'emissor': 'Emissor Ágil',
    'clientes': 'Meus Clientes',
    'assinaturas': 'Assinaturas',
    'videocall': 'Verum Meet',
    'equipe': 'Equipe'
};

// Atualizar breadcrumb ao clicar no menu
document.querySelectorAll('.saas-menu a').forEach(link => {
    link.addEventListener('click', function () {
        const href = this.getAttribute('href');
        if (href === 'index.html') return;
        const key = href.substring(1);
        const el = document.getElementById('breadcrumb-current');
        if (el) el.innerText = breadcrumbNames[key] || key;
    });
});

// ==========================================
// FASE K: KPIs DINÂMICOS
// ==========================================
function atualizarKPIs() {
    const documentos = JSON.parse(localStorage.getItem('verum_documentos')) || [];
    const clientes = JSON.parse(localStorage.getItem('verum_clientes')) || [];

    const total = documentos.length;
    const assinados = documentos.filter(d => d.status === 'assinado').length;
    const pendentes = documentos.filter(d => d.status === 'pendente').length;

    const elTotal = document.getElementById('kpi-total-docs');
    const elAssinados = document.getElementById('kpi-assinados');
    const elPendentes = document.getElementById('kpi-pendentes');
    const elClientes = document.getElementById('kpi-clientes');
    const elTrend = document.getElementById('kpi-docs-trend');

    if (elTotal) elTotal.innerText = total;
    if (elAssinados) elAssinados.innerText = assinados;
    if (elPendentes) elPendentes.innerText = pendentes;
    if (elClientes) elClientes.innerText = clientes.length;
    if (elTrend && total > 0) elTrend.innerHTML = '↑ Ativo';
}
atualizarKPIs();

// Atualizar KPIs após gerar documento
const origCarregarHistorico = carregarHistorico;
carregarHistorico = function () {
    origCarregarHistorico();
    atualizarKPIs();
};

// ==========================================
// FASE 2: AGENDA JUDICIAL (PRAZOS)
// ==========================================
function abrirModalPrazo() {
    document.getElementById('modal-novo-prazo').style.display = 'flex';
}

async function carregarPrazos() {
    try {
        const resposta = await fetch('https://vogaapi.onrender.com/api/prazos/1');
        if (!resposta.ok) throw new Error("Erro na API de Prazos");
        const prazos = await resposta.json();

        // 1. Atualiza o Número (KPI) de Processos/Prazos
        const kpiProcessos = document.getElementById('kpi-processos');
        if (kpiProcessos) kpiProcessos.innerText = prazos.length;

        // 2. Preenche a Tabela da Agenda
        const tbody = document.getElementById('tabela-agenda');
        if (tbody) {
            tbody.innerHTML = '';
            prazos.forEach(prazo => {
                const dataFormatada = new Date(prazo.dataVencimento).toLocaleDateString('pt-BR');
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                tr.innerHTML = `
                    <td style="padding: 10px; font-weight: bold; color: #fff;">${prazo.titulo}</td>
                    <td style="padding: 10px; color: #aaa;">${prazo.clienteAssociado}</td>
                    <td style="padding: 10px; color: #ccc;">${dataFormatada}</td>
                    <td style="padding: 10px;"><span class="status-badge status-pendente">${prazo.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar prazos:", erro);
    }
}

async function salvarPrazo() {
    const titulo = document.getElementById('prazo-titulo').value;
    const data = document.getElementById('prazo-data').value;
    const cliente = document.getElementById('prazo-cliente').value;

    if (!titulo || !data) return Swal.fire('Aviso', 'Título e Data são obrigatórios', 'warning', { background: 'rgba(11, 19, 43, 0.9)', color: '#fff' });

    try {
        await fetch('https://vogaapi.onrender.com/api/prazos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: 1, titulo, dataVencimento: data, clienteAssociado: cliente })
        });
        document.getElementById('modal-novo-prazo').style.display = 'none';
        Swal.fire({ title: 'Salvo!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: 'rgba(47, 214, 94, 0.9)', color: '#fff' });
        carregarPrazos();
    } catch (e) { console.error(e); }
}

async function concluirPrazo(id) {
    try {
        await fetch(`https://vogaapi.onrender.com/api/prazos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Concluido' })
        });
        carregarPrazos();
        adicionarNotificacao('Prazo marcado como concluído.');
    } catch (e) { console.error(e); }
}

async function removerPrazo(id) {
    const confirmacao = await Swal.fire({
        title: 'Remover prazo?',
        icon: 'warning',
        showCancelButton: true,
        background: 'rgba(11, 19, 43, 0.9)', color: '#fff', confirmButtonColor: '#ff4d4d'
    });
    if (confirmacao.isConfirmed) {
        try {
            await fetch(`https://vogaapi.onrender.com/api/prazos/${id}`, { method: 'DELETE' });
            carregarPrazos();
        } catch (e) { console.error(e); }
    }
}

// ==========================================
// FASE 2: FINANCEIRO (LANÇAMENTOS)
// ==========================================
function abrirModalLancamento() {
    document.getElementById('modal-novo-lancamento').style.display = 'flex';
}

async function carregarFinanceiro() {
    try {
        const resposta = await fetch('https://vogaapi.onrender.com/api/financeiro/1');
        if (!resposta.ok) throw new Error("Erro na API Financeira");
        const lancamentos = await resposta.json();

        // 1. Calcula a Receita Total e Atualiza o KPI
        const kpiReceita = document.getElementById('kpi-receita');
        if (kpiReceita) {
            const totalReceita = lancamentos
                .filter(l => l.tipo === "Entrada" || l.tipo === "Receita") // Soma apenas as entradas
                .reduce((acc, l) => acc + l.valor, 0);
            kpiReceita.innerText = "R$ " + totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }

        // 2. Preenche a Tabela do Financeiro
        const tbody = document.getElementById('tabela-financeiro');
        if (tbody) {
            tbody.innerHTML = '';
            lancamentos.forEach(lanc => {
                const dataFormatada = new Date(lanc.dataPagamento).toLocaleDateString('pt-BR');
                const corValor = (lanc.tipo === "Saída" || lanc.tipo === "Despesa") ? "#ff4d4d" : "#4caf50";

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                tr.innerHTML = `
                    <td style="padding: 10px; color: #ccc;">${dataFormatada}</td>
                    <td style="padding: 10px; font-weight: bold; color: #fff;">${lanc.descricao}</td>
                    <td style="padding: 10px; color: #aaa;">${lanc.categoria}</td>
                    <td style="padding: 10px; font-weight: bold; color: ${corValor};">R$ ${lanc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style="padding: 10px; text-align: center;">${lanc.pago ? '✅' : '⏳'}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar financeiro:", erro);
    }
}

async function salvarLancamento() {
    const descricao = document.getElementById('lanc-descricao').value;
    const valor = parseFloat(document.getElementById('lanc-valor').value);
    const tipo = document.getElementById('lanc-tipo').value;
    const data = document.getElementById('lanc-data').value;

    if (!descricao || !valor || !data) return Swal.fire('Aviso', 'Preencha todos os campos.', 'warning', { background: 'rgba(11, 19, 43, 0.9)', color: '#fff' });

    try {
        await fetch('https://vogaapi.onrender.com/api/financeiro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: 1, descricao, valor, tipo, dataPagamento: data })
        });
        document.getElementById('modal-novo-lancamento').style.display = 'none';
        Swal.fire({ title: 'Lançamento Registrado!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: 'rgba(47, 214, 94, 0.9)', color: '#fff' });
        carregarFinanceiro();
    } catch (e) { console.error(e); }
}

async function pagarLancamento(id) {
    try {
        await fetch(`https://vogaapi.onrender.com/api/financeiro/${id}/pagar`, { method: 'PUT' });
        carregarFinanceiro();
        adicionarNotificacao('Lançamento baixado com sucesso no fluxo de caixa.');
    } catch (e) { console.error(e); }
}

async function removerLancamento(id) {
    const confirmacao = await Swal.fire({
        title: 'Remover lançamento?',
        icon: 'warning',
        showCancelButton: true,
        background: 'rgba(11, 19, 43, 0.9)', color: '#fff', confirmButtonColor: '#ff4d4d'
    });
    if (confirmacao.isConfirmed) {
        try {
            await fetch(`https://vogaapi.onrender.com/api/financeiro/${id}`, { method: 'DELETE' });
            carregarFinanceiro();
        } catch (e) { console.error(e); }
    }
}

// Inicializar carregamentos na Fase 2
document.addEventListener('DOMContentLoaded', () => {
    // Timeout para não travar a UI inicial
    setTimeout(() => {
        carregarPrazos();
        carregarFinanceiro();
    }, 1000);
});


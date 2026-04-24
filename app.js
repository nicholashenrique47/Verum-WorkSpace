/* =======================================================
   BLOCO 1: CONEXÃO COM A API C# E BANCO DE DADOS
======================================================= */
async function carregarDadosDoBanco() {
    try {
        // Faz a requisição para a sua API rodando no C#
        const resposta = await fetch('https://vogaapi.onrender.com/api/areas/1');

        if (!resposta.ok) {
            throw new Error("Erro ao buscar o escritório");
        }

        // Transforma o retorno em JSON
        const token = sessionStorage.getItem('verum_token');
        const dados = await resposta.json();

        // Chama a função para pintar a tela com os dados reais
        inicializarPlataforma(dados);

    } catch (erro) {
        console.error("Falha na conexão com a API:", erro);
        document.getElementById('nome-escritorio').innerText = "Verum Office";
    }
}

/* =======================================================
   BLOCO 2: CONTROLE DE INTERFACE (Drawer / Menu Lateral)
======================================================= */
const btnAbrirMenu = document.getElementById('btn-abrir-menu');
const btnFecharMenu = document.getElementById('btn-fechar-menu');
const menuDrawer = document.getElementById('menu-drawer');

btnAbrirMenu.addEventListener('click', () => {
    menuDrawer.classList.add('aberto');
});

btnFecharMenu.addEventListener('click', () => {
    menuDrawer.classList.remove('aberto');
});

const linksMenu = document.querySelectorAll('.links-drawer a');
linksMenu.forEach(link => {
    link.addEventListener('click', () => {
        menuDrawer.classList.remove('aberto');
    });
});

/* =======================================================
   BLOCO 3: INJEÇÃO DINÂMICA DE CONTEÚDO
======================================================= */
function inicializarPlataforma(dados) {
    // 1. Altera o Nome do Escritório no Header
    const nomeEl = document.getElementById('nome-escritorio');
    if (nomeEl) {
        nomeEl.innerText = dados.nomeEscritorio;
        nomeEl.classList.remove('skeleton-dark');
    }

    // 2. Atualiza o link do botão de WhatsApp dinamicamente
    const btnWhats = document.getElementById('btn-whatsapp');
    if (btnWhats) {
        const mensagem = encodeURIComponent(`Olá, vim pelo site e gostaria de agendar uma consulta.`);
        btnWhats.href = `https://wa.me/${dados.telefoneWhatsApp}?text=${mensagem}`;
    }
}

/* =======================================================
   O GATILHO INICIAL (Corrigido)
======================================================= */
// Assim que a página carregar, ele chama a API em vez da variável antiga
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoBanco();
});
// NOVA FUNÇÃO: Carregar os cards de serviço dinamicamente
async function carregarAreasAtuacao() {
    try {
        const resposta = await fetch('http://localhost:5170/api/areas/1');
        const areas = await resposta.json();

        // ATUALIZADO: Agora ele busca exatamente a div que você criou no HTML!
        const gridServicos = document.getElementById('container-areas-atuacao');

        if (gridServicos) {
            gridServicos.innerHTML = ''; // Limpa antes de preencher

            areas.forEach(area => {
                const card = document.createElement('div');
                // Se no seu style.css a classe for "card-glass", mantenha essa. 
                // Se for outra, é só trocar aqui:
                card.className = 'card-glass';
                card.innerHTML = `
                    <h3 style="color: var(--cor-destaque); margin-bottom: 10px;">${area.titulo}</h3>
                    <p style="color: #ccc; font-size: 0.95rem; line-height: 1.5;">${area.descricao}</p>
                `;
                gridServicos.appendChild(card);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar serviços:", erro);
    }
}
// Chame essa função logo abaixo de onde você chama o carregarDadosDoBanco()
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoBanco();
    carregarAreasAtuacao(); // <--- CHAME AQUI
    initScrollAnimations(); // <--- CHAME AQUI
});

/* =======================================================
   ANIMAÇÕES DE SCROLL (REVEAL)
======================================================= */
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Opcional: observer.unobserve(entry.target); se quiser animar só 1 vez
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}
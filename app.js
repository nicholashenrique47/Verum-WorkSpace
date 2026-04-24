/* =======================================================
   BLOCO 1: CONEXÃO COM A API C# E BANCO DE DADOS
======================================================= */
async function carregarDadosDoBanco() {
    try {
        // Ajuste o final da URL para a rota que devolve os dados do escritório (ex: /api/tenant/1 ou /api/escritorio/1)
        const resposta = await fetch('https://vogaapi.onrender.com/api/tenant/1');

        if (!resposta.ok) {
            throw new Error("Erro ao buscar o escritório");
        }

        const dados = await resposta.json();
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
   BLOCO 4: CARREGAR ÁREAS DE ATUAÇÃO
======================================================= */
async function carregarAreasAtuacao() {
    try {
        // TROCADO: O link do Render oficial no lugar do localhost
        const resposta = await fetch('https://vogaapi.onrender.com/api/areas/1');
        const areas = await resposta.json();

        const gridServicos = document.getElementById('container-areas-atuacao');

        if (gridServicos) {
            gridServicos.innerHTML = ''; // Limpa antes de preencher

            areas.forEach(area => {
                const card = document.createElement('div');
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

/* =======================================================
   O GATILHO INICIAL (Unificado)
======================================================= */
// Unificamos as chamadas num único bloco para o código ficar "Clean"
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoBanco();
    carregarAreasAtuacao();
    initScrollAnimations();
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
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}
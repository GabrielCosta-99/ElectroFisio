
// Tela de eletrodos: filtros, vista do corpo e seleção da região

// Nome de cada área da figura em cada vista do corpo
const REGIOES = {
    anterior: {
        cabeca: "Cabeça e face",
        pescoco: "Cervical anterior",
        tronco: "Peitoral",
        abdome: "Abdome",
        pelve: "Quadril",
        braco: "Braço",
        antebraco: "Antebraço",
        mao: "Mão",
        coxa: "Coxa",
        joelho: "Joelho",
        perna: "Perna",
        pe: "Pé"
    },
    posterior: {
        cabeca: "Cabeça",
        pescoco: "Cervical",
        tronco: "Dorsal",
        abdome: "Lombar",
        pelve: "Glúteos",
        braco: "Braço",
        antebraco: "Antebraço",
        mao: "Dorso da mão",
        coxa: "Coxa posterior",
        joelho: "Região poplítea",
        perna: "Panturrilha",
        pe: "Calcanhar"
    },
    lateral: {
        cabeca: "Cabeça",
        pescoco: "Cervical lateral",
        tronco: "Ombro",
        abdome: "Flanco",
        pelve: "Quadril lateral",
        braco: "Braço",
        antebraco: "Antebraço",
        mao: "Mão",
        coxa: "Coxa lateral",
        joelho: "Joelho lateral",
        perna: "Perna lateral",
        pe: "Tornozelo"
    }
};

// Exemplos de posicionamento (pranchas do caderno técnico de fisioterapia).
// Chave: "vista:area". Regiões sem exemplo mostram só a orientação geral.
const ELETRODO = "fill=\"#48BFAF\" stroke=\"#1F5F55\" stroke-width=\"1.5\" rx=\"4\"";
const TEXTO_SVG = "font-family=\"Arial\" font-size=\"11\" font-weight=\"bold\" fill=\"#173B35\" text-anchor=\"middle\"";
const PELE = "fill=\"#F3E3D6\" stroke=\"#C9B3A3\" stroke-width=\"1.5\"";

function eletrodo(x, y, rotulo) {
    return "<rect x=\"" + (x - 14) + "\" y=\"" + (y - 11) + "\" width=\"28\" height=\"22\" " + ELETRODO + "/>" +
        "<text x=\"" + x + "\" y=\"" + (y + 4) + "\" " + TEXTO_SVG + ">" + rotulo + "</text>";
}

const EXEMPLOS = {
    tens: {
        "posterior:abdome": {
            titulo: "TENS: região lombar",
            montagem: "Dois pares longitudinais, um de cada lado da coluna, sobre a musculatura paravertebral da região dolorosa. Canal 1: 1A e 1B; canal 2: 2A e 2B. Nenhum par atravessa o tórax.",
            resposta: "Formigamento confortável na área da dor. Gestação exige avaliação específica.",
            descricao: "Costas em esquema. Quatro eletrodos na região lombar, em duas colunas ao lado da coluna vertebral; cada coluna é um canal.",
            desenho: "<rect x=\"55\" y=\"10\" width=\"90\" height=\"140\" rx=\"20\" " + PELE + "/>" +
                "<line x1=\"100\" y1=\"16\" x2=\"100\" y2=\"144\" stroke=\"#9A8576\" stroke-width=\"3\" stroke-dasharray=\"6 4\"/>" +
                "<ellipse cx=\"100\" cy=\"88\" rx=\"38\" ry=\"30\" fill=\"#F2B8B0\" opacity=\"0.6\"/>" +
                eletrodo(78, 62, "1A") + eletrodo(78, 114, "1B") + eletrodo(122, 62, "2A") + eletrodo(122, 114, "2B")
        },
        "anterior:joelho": {
            titulo: "TENS: região do joelho",
            montagem: "Um par ao redor da área dolorosa: 1A acima e medial à patela, 1B abaixo e lateral. Ajuste conforme o mapa da dor e o conforto; não coloque sobre incisão ou pele lesionada.",
            resposta: "Formigamento confortável na região. Contração forte não é a meta da TENS convencional.",
            descricao: "Joelho esquerdo em vista anterior. Patela ao centro, um eletrodo acima e medial e outro abaixo e lateral, formando o canal 1.",
            desenho: "<rect x=\"70\" y=\"5\" width=\"60\" height=\"150\" rx=\"26\" " + PELE + "/>" +
                "<ellipse cx=\"100\" cy=\"80\" rx=\"17\" ry=\"21\" fill=\"#E6D0BF\" stroke=\"#9A8576\" stroke-width=\"1.5\"/>" +
                eletrodo(120, 42, "1A") + eletrodo(80, 120, "1B")
        }
    },
    fes: {
        "anterior:coxa": {
            titulo: "NMES/FES: quadríceps",
            montagem: "1A na região muscular proximal da face anterior da coxa; 1B na região distal, acima da patela (nunca sobre ela). Procure os pontos de melhor resposta antes de aumentar a amplitude.",
            resposta: "Contração útil para estender o joelho. É FES só quando integrada a uma tarefa; sozinha, é NMES.",
            descricao: "Coxa em vista anterior. Dois eletrodos no trajeto do quadríceps, um proximal e outro distal, acima da patela, formando o canal 1.",
            desenho: "<path d=\"M62 6 L138 6 L126 128 L74 128 Z\" " + PELE + "/>" +
                "<ellipse cx=\"100\" cy=\"142\" rx=\"16\" ry=\"13\" fill=\"#E6D0BF\" stroke=\"#9A8576\" stroke-width=\"1.5\"/>" +
                eletrodo(100, 36, "1A") + eletrodo(100, 104, "1B")
        },
        "anterior:perna": {
            titulo: "NMES/FES: tibial anterior",
            montagem: "Sobre o ventre do tibial anterior, lateral à crista da tíbia: 1A proximal e 1B mais distal, sem descer até o tendão. Sistemas para pé caído podem usar montagem perto do nervo fibular.",
            resposta: "Elevar o antepé. Na marcha, coordenar com o balanço; verificar inversão excessiva e fadiga.",
            descricao: "Perna em vista anterolateral. A crista da tíbia aparece em cinza e dois eletrodos ficam na região muscular lateral a ela.",
            desenho: "<path d=\"M72 4 L128 4 L118 150 L86 150 Z\" " + PELE + "/>" +
                "<line x1=\"92\" y1=\"10\" x2=\"96\" y2=\"146\" stroke=\"#8C8C8C\" stroke-width=\"4\"/>" +
                "<ellipse cx=\"112\" cy=\"64\" rx=\"12\" ry=\"46\" fill=\"#F2B8B0\" opacity=\"0.6\"/>" +
                eletrodo(113, 36, "1A") + eletrodo(110, 96, "1B")
        },
        "posterior:antebraco": {
            titulo: "NMES/FES: extensores de punho e dedos",
            montagem: "No compartimento posterior do antebraço: 1A na região proximal do ventre muscular, 1B mais distal, ainda sobre o músculo. Um único par não garante abrir todos os dedos.",
            resposta: "Extensão útil e confortável para abrir a mão e soltar um objeto leve.",
            descricao: "Antebraço e mão em vista dorsal, com dois eletrodos ao longo da região extensora, formando o canal 1.",
            desenho: "<path d=\"M78 4 L122 4 L116 112 L84 112 Z\" " + PELE + "/>" +
                "<rect x=\"78\" y=\"110\" width=\"44\" height=\"44\" rx=\"12\" " + PELE + "/>" +
                eletrodo(100, 32, "1A") + eletrodo(100, 82, "1B")
        }
    }
};

// O tibial anterior também aparece na vista lateral
EXEMPLOS.fes["lateral:perna"] = EXEMPLOS.fes["anterior:perna"];

// Orientação geral quando a região não tem exemplo
const ORIENTACAO_GERAL = {
    tens: "Em aplicações usuais, os eletrodos ficam próximos à região dolorosa, conforme a avaliação, separados e totalmente aderidos à pele.",
    fes: "O local depende do músculo, do nervo e do movimento desejado. A anatomia orienta a busca, mas o ponto motor de cada pessoa é confirmado pela resposta."
};

// Regiões que exigem atenção (aba Segurança)
function alertaRegiao(vista, area) {
    if (area === "cabeca") {
        return "Não posicione eletrodos sobre os olhos. Evite a cabeça em pessoas com epilepsia; aplicação na cabeça exige treinamento e equipamento específicos.";
    }
    if (area === "pescoco" && vista !== "posterior") {
        return "Não aplique sobre a região anterior e lateral do pescoço (seio carotídeo).";
    }
    if (area === "tronco" && vista === "anterior") {
        return "Evite trajetos de corrente que atravessem o tórax ou passem pela região cardíaca.";
    }
    if (area === "abdome" || area === "pelve") {
        return "Na gestação, evite abdome, pelve e lombar sem orientação obstétrica.";
    }
    return "";
}

// Opções do filtro de objetivo em cada modalidade
const OBJETIVOS = {
    tens: ["Analgesia"],
    fes: ["Ativação muscular", "Tarefa funcional"]
};

const filtroModalidade = document.getElementById("filtroModalidade");
const filtroRegiao = document.getElementById("filtroRegiao");
const filtroObjetivo = document.getElementById("filtroObjetivo");
const botoesVista = document.querySelectorAll(".botao-vista");
const areasCorpo = document.querySelectorAll(".regiao");
const regiaoEscolhida = document.getElementById("regiaoEscolhida");
const imagemExemplo = document.getElementById("imagemExemplo");
const legendaExemplo = document.getElementById("legendaExemplo");

const botaoSalvar = document.querySelector(".botao-salvar");
const CHAVE_SESSAO = "electrofisio-eletrodos";

const selecao = {
    vista: "anterior",
    area: "tronco",
    modalidade: document.body.dataset.modalidade || "tens"
};

// Mensagem logo abaixo do botão "Salvar os dados da sessão"
const mensagemSalvar = document.createElement("p");
mensagemSalvar.className = "mensagem-salvar";
mensagemSalvar.setAttribute("role", "status");
botaoSalvar.insertAdjacentElement("afterend", mensagemSalvar);

function preencherRegioes() {
    filtroRegiao.innerHTML = "";

    Object.entries(REGIOES[selecao.vista]).forEach(function ([area, nome]) {
        const opcao = document.createElement("option");
        opcao.value = area;
        opcao.textContent = nome;
        filtroRegiao.appendChild(opcao);
    });

    filtroRegiao.value = selecao.area;
}

function preencherObjetivos() {
    filtroObjetivo.innerHTML = "<option value=\"\">Objetivo do tratamento</option>";

    OBJETIVOS[selecao.modalidade].forEach(function (objetivo) {
        const opcao = document.createElement("option");
        opcao.value = objetivo;
        opcao.textContent = objetivo;
        filtroObjetivo.appendChild(opcao);
    });
}

function atualizarTela() {
    const nomeRegiao = REGIOES[selecao.vista][selecao.area];

    areasCorpo.forEach(function (forma) {
        forma.classList.toggle("selecionada", forma.dataset.area === selecao.area);
    });

    botoesVista.forEach(function (botao) {
        botao.classList.toggle("ativo", botao.dataset.vista === selecao.vista);
    });

    filtroRegiao.value = selecao.area;
    filtroModalidade.value = selecao.modalidade;
    regiaoEscolhida.textContent = nomeRegiao;

    mostrarExemplo(nomeRegiao);

    // Avisa o modelo 3D do corpo (js/corpo-3d.js) sobre a região e a vista
    document.body.dataset.area = selecao.area;
    document.body.dataset.vista = selecao.vista;
    document.dispatchEvent(new CustomEvent("corpo-atualizado", {
        detail: { area: selecao.area, vista: selecao.vista, nome: nomeRegiao }
    }));
}

// Desenho e texto do exemplo da região escolhida
function mostrarExemplo(nomeRegiao) {
    const exemplo = EXEMPLOS[selecao.modalidade][selecao.vista + ":" + selecao.area];
    const alerta = alertaRegiao(selecao.vista, selecao.area);

    imagemExemplo.dataset.modalidade = selecao.modalidade;
    imagemExemplo.dataset.regiao = selecao.area;
    imagemExemplo.classList.toggle("com-desenho", Boolean(exemplo));
    legendaExemplo.innerHTML = "";

    if (exemplo) {
        imagemExemplo.innerHTML =
            "<svg viewBox=\"0 0 200 160\" role=\"img\" aria-label=\"" + exemplo.descricao + "\">" +
            exemplo.desenho + "</svg>";

        adicionarLegenda("strong", exemplo.titulo);
        adicionarLegenda("p", exemplo.montagem);
        adicionarLegenda("p", "Resposta desejada: " + exemplo.resposta.charAt(0).toLowerCase() + exemplo.resposta.slice(1));
        adicionarLegenda("p", "Esquema sem escala; a posição final depende da avaliação e da resposta.", "nota-exemplo");
    } else {
        imagemExemplo.innerHTML = "<span>Sem exemplo cadastrado para " + nomeRegiao + "</span>";

        adicionarLegenda("p", ORIENTACAO_GERAL[selecao.modalidade]);
        adicionarLegenda("p", "Regiões com exemplo: " + listaComExemplo() + ".", "nota-exemplo");
    }

    if (alerta) {
        adicionarLegenda("p", "Atenção: " + alerta, "alerta-regiao");
    }
}

function adicionarLegenda(tag, texto, classe) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;
    if (classe) {
        elemento.className = classe;
    }
    legendaExemplo.appendChild(elemento);
}

// Ex.: "Lombar (posterior), Joelho (anterior)"
function listaComExemplo() {
    return Object.keys(EXEMPLOS[selecao.modalidade]).map(function (chave) {
        const [vista, area] = chave.split(":");
        return REGIOES[vista][area] + " (" + vista + ")";
    }).join(", ");
}

function escolherArea(area) {
    selecao.area = area;
    atualizarTela();
}

// Clique em uma parte do modelo 3D
document.addEventListener("corpo-clicado", function (evento) {
    if (REGIOES[selecao.vista][evento.detail]) {
        escolherArea(evento.detail);
    }
});

// Cliques e teclado nas áreas da figura
const areasComFoco = [];

areasCorpo.forEach(function (forma) {
    forma.addEventListener("click", function () {
        escolherArea(forma.dataset.area);
    });

    // Só a primeira forma de cada área recebe foco pelo teclado (braço, perna... têm duas)
    if (!areasComFoco.includes(forma.dataset.area)) {
        areasComFoco.push(forma.dataset.area);
        forma.setAttribute("tabindex", "0");
        forma.setAttribute("role", "button");
        forma.setAttribute("aria-label", REGIOES.anterior[forma.dataset.area]);

        forma.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                escolherArea(forma.dataset.area);
            }
        });
    }
});

// Filtros
filtroRegiao.addEventListener("change", function () {
    escolherArea(filtroRegiao.value);
});

filtroModalidade.addEventListener("change", function () {
    // Usa a mesma troca dos botões TENS / FES do topo
    trocarModalidade(filtroModalidade.value);
    history.replaceState(null, "", "?modalidade=" + filtroModalidade.value);
});

document.addEventListener("modalidade", function (evento) {
    selecao.modalidade = evento.detail;
    preencherObjetivos();
    atualizarTela();
});

botoesVista.forEach(function (botao) {
    botao.addEventListener("click", function () {
        selecao.vista = botao.dataset.vista;
        preencherRegioes();

        // Atualiza o nome lido pelo leitor de tela em cada área
        areasCorpo.forEach(function (forma) {
            if (forma.hasAttribute("aria-label")) {
                forma.setAttribute("aria-label", REGIOES[selecao.vista][forma.dataset.area]);
            }
        });

        atualizarTela();
    });
});

// Salvar os dados da sessão (por enquanto, só neste navegador)
botaoSalvar.addEventListener("click", function () {
    const dados = {
        modalidade: selecao.modalidade,
        vista: selecao.vista,
        area: selecao.area,
        objetivo: filtroObjetivo.value,
        salvoEm: new Date().toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        })
    };

    try {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
        mensagemSalvar.textContent = "Sessão salva em " + dados.salvoEm + ": " +
            dados.modalidade.toUpperCase() + " · " + REGIOES[dados.vista][dados.area] + ".";
    } catch (erro) {
        mensagemSalvar.textContent = "Não foi possível salvar neste navegador.";
    }
});

// Abre com a última sessão salva (a modalidade continua a escolhida no topo)
function carregarSessao() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
        if (salvo && REGIOES[salvo.vista] && REGIOES[salvo.vista][salvo.area]) {
            selecao.vista = salvo.vista;
            selecao.area = salvo.area;
            return salvo;
        }
    } catch (erro) {
        // Nada salvo ainda
    }
    return null;
}

const sessaoSalva = carregarSessao();

preencherRegioes();
preencherObjetivos();

if (sessaoSalva) {
    filtroObjetivo.value = sessaoSalva.objetivo || "";
    mensagemSalvar.textContent = "Última sessão salva em " + sessaoSalva.salvoEm + ".";
}

atualizarTela();

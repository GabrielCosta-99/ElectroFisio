
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

const selecao = {
    vista: "anterior",
    area: "tronco",
    modalidade: document.body.dataset.modalidade || "tens"
};

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

    // Imagem de exemplo ainda não definida: mostra o que foi escolhido
    imagemExemplo.querySelector("span").textContent =
        "Imagem do posicionamento · " + selecao.modalidade.toUpperCase() + " · " + nomeRegiao;
    imagemExemplo.dataset.modalidade = selecao.modalidade;
    imagemExemplo.dataset.regiao = selecao.area;
}

function escolherArea(area) {
    selecao.area = area;
    atualizarTela();
}

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

preencherRegioes();
preencherObjetivos();
atualizarTela();


// Modelo 3D do aparelho de TENS/FES e simulação dos controles

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ---------------------------------------------------------------
// Conteúdo (Caderno técnico, seções 07, 08, 09, 10 e 12)
// ---------------------------------------------------------------

export const INTENSIDADE_MAXIMA = 40; // limite didático do simulador; o limite real depende do manual
export const REFERENCIA_MANUAL = "Pendente: o aparelho de referência ainda não foi definido (Caderno, Anexo D).";

const PARAMETROS = {
    frequencia: { rotulo: "Frequência", unidade: "Hz", falado: "hertz", min: 1, max: 200, passo: 1 },
    rajadas: { rotulo: "Rajadas por segundo", unidade: "raj/s", falado: "rajadas por segundo", min: 1, max: 5, passo: 1 },
    largura: { rotulo: "Duração de fase", unidade: "µs", falado: "microssegundos", min: 50, max: 400, passo: 10 },
    tempo: { rotulo: "Tempo de sessão", unidade: "min", falado: "minutos", min: 1, max: 60, passo: 1 },
    subida: { rotulo: "Rampa de subida", unidade: "s", falado: "segundos", min: 0, max: 5, passo: 0.5 },
    plato: { rotulo: "Platô", unidade: "s", falado: "segundos", min: 1, max: 15, passo: 1 },
    descida: { rotulo: "Rampa de descida", unidade: "s", falado: "segundos", min: 0, max: 5, passo: 0.5 },
    repouso: { rotulo: "Repouso (OFF)", unidade: "s", falado: "segundos", min: 0, max: 60, passo: 1 },
    ciclos: { rotulo: "Ciclos", unidade: "ciclos", falado: "ciclos", min: 1, max: 30, passo: 1 }
};

export const MODOS = [
    {
        id: "convencional",
        nome: "TENS convencional",
        curto: "TENS CONV",
        padrao: { frequencia: 80, largura: 100, tempo: 20 },
        ordem: ["frequencia", "largura", "tempo"],
        objetivo: "Analgesia com parestesia forte, confortável e não dolorosa.",
        referencia: "Faixa educativa: 50–100 Hz; 50–200 µs [R1]. Exemplo do caderno: 80 Hz, 100 µs, 20 min."
    },
    {
        id: "acupuntura",
        nome: "TENS tipo acupuntura",
        curto: "TENS ACUP",
        padrao: { frequencia: 3, largura: 200, tempo: 20 },
        ordem: ["frequencia", "largura", "tempo"],
        objetivo: "Analgesia com contrações rítmicas toleráveis; exige seleção do contexto.",
        referencia: "Faixa educativa: 2–4 Hz; 100–400 µs [R1]."
    },
    {
        id: "burst",
        nome: "TENS burst (rajadas)",
        curto: "TENS BURST",
        padrao: { rajadas: 2, frequencia: 100, largura: 200, tempo: 20 },
        ordem: ["rajadas", "frequencia", "largura", "tempo"],
        objetivo: "Grupos de pulsos. Distinguir a frequência das rajadas da frequência dos pulsos internos.",
        referencia: "Faixa educativa: 2–4 rajadas/s; pulsos internos de 100–200 Hz [R1]."
    },
    {
        id: "nmes",
        nome: "NMES / FES",
        curto: "NMES/FES",
        padrao: { frequencia: 35, largura: 300, subida: 2, plato: 6, descida: 2, repouso: 30, ciclos: 8 },
        ordem: ["frequencia", "largura", "subida", "plato", "descida", "repouso", "ciclos"],
        objetivo: "Contração muscular. Só é FES quando a estimulação é coordenada a uma tarefa funcional.",
        referencia: "Exercício A do caderno: 35 Hz; 300 µs; subida 2 s, platô 6 s, descida 2 s, repouso 30 s; 8 ciclos [R3]."
    }
];

export const estado = {
    ligado: false,
    indiceModo: 0,
    valores: { ...MODOS[0].padrao },
    indiceParametro: 0,
    emCurso: false,
    canais: [0, 0],
    canalSelecionado: 0,
    decorrido: 0,
    velocidade: 1
};

export function formatar(numero) {
    return Number(Number(numero).toFixed(1)).toLocaleString("pt-BR");
}

export function modoAtual() {
    return MODOS[estado.indiceModo];
}

function parametroAtual() {
    return modoAtual().ordem[estado.indiceParametro];
}

export function minutosSegundos(segundos) {
    segundos = Math.max(0, Math.ceil(segundos));
    const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
    return minutos + ":" + String(segundos % 60).padStart(2, "0");
}

export function duracaoCiclo() {
    const v = estado.valores;
    return v.subida + v.plato + v.descida + v.repouso;
}

export function tempoTotal() {
    if (modoAtual().id === "nmes") {
        return duracaoCiclo() * estado.valores.ciclos;
    }
    return estado.valores.tempo * 60;
}

// Fase do ciclo de NMES/FES em um instante t (em segundos)
export function faseNmes(t) {
    const v = estado.valores;
    const ciclo = Math.min(v.ciclos, Math.floor(t / duracaoCiclo()) + 1);
    let x = t % duracaoCiclo();

    if (x < v.subida) {
        return { nome: "SUBIDA", rotulo: "subida", envelope: v.subida ? x / v.subida : 1, ciclo: ciclo };
    }
    x -= v.subida;
    if (x < v.plato) {
        return { nome: "PLATÔ", rotulo: "platô", envelope: 1, ciclo: ciclo };
    }
    x -= v.plato;
    if (x < v.descida) {
        return { nome: "DESCIDA", rotulo: "descida", envelope: v.descida ? 1 - x / v.descida : 0, ciclo: ciclo };
    }
    return { nome: "REPOUSO", rotulo: "repouso", envelope: 0, ciclo: ciclo };
}

function rotuloParametro(chave) {
    if (chave === "frequencia" && modoAtual().id === "burst") {
        return "Frequência interna";
    }
    return PARAMETROS[chave].rotulo;
}

function textoParametro(chave, comRotulo = true) {
    const valor = formatar(estado.valores[chave]) + " " + PARAMETROS[chave].unidade;
    return comRotulo ? rotuloParametro(chave) + ": " + valor : valor;
}

function falaParametro(chave) {
    return rotuloParametro(chave) + " alterada para " + formatar(estado.valores[chave]) + " " + PARAMETROS[chave].falado + ".";
}

function textoCanal(i) {
    if (estado.canais[i] === 0) {
        return "Canal " + (i + 1) + ": intensidade zero.";
    }
    return "Canal " + (i + 1) + ": intensidade " + estado.canais[i] + " miliampères.";
}

// ---------------------------------------------------------------
// Avisos para o painel da página
// ---------------------------------------------------------------

const ouvintes = [];

export function aoMudar(funcao) {
    ouvintes.push(funcao);
}

function avisar(mensagem = null, tipo = "info") {
    ouvintes.forEach(function (funcao) {
        funcao(mensagem, tipo);
    });
}

// origem: parte do 3D onde aparece a mensagem flutuante; tipo "aviso" para alertas
function falar(mensagem, origem = null, tipo = "info") {
    avisar(mensagem, tipo);
    mostrarMensagemFlutuante(mensagem, origem, tipo);
}

// ---------------------------------------------------------------
// Ações do simulador
// ---------------------------------------------------------------

function precisaLigar(origem) {
    if (!estado.ligado) {
        falar("Ligue o aparelho (controle 1) primeiro.", origem, "aviso");
        return true;
    }
    return false;
}

function zerarSaidas() {
    estado.canais = [0, 0];
}

export const acoes = {
    energia() {
        pressionar("energia");
        estado.ligado = !estado.ligado;
        estado.emCurso = false;
        estado.decorrido = 0;
        zerarSaidas();
        falar(estado.ligado
            ? "Aparelho ligado. A estimulação ainda não começou; intensidade zero nos dois canais."
            : "Aparelho desligado.", "energia");
        mudou();
    },

    trocarModo(indice) {
        if (precisaLigar("modo")) {
            return;
        }
        pressionar("modo");
        definirModo(indice ?? estado.indiceModo + 1);
        falar("Modo: " + modoAtual().nome + ". Intensidade reiniciada em zero nos dois canais.", "modo");
    },

    proximoParametro() {
        if (precisaLigar("parametro")) {
            return;
        }
        pressionar("parametro");
        estado.indiceParametro = (estado.indiceParametro + 1) % modoAtual().ordem.length;
        falar("Parâmetro selecionado: " + textoParametro(parametroAtual()) + ".", "parametro");
        mudou();
    },

    ajustarParametro(direcao) {
        if (precisaLigar("parametro")) {
            return;
        }
        pressionar("parametro");

        if (estado.emCurso) {
            falar("Pause a sessão (controle 6) antes de alterar parâmetros.", "parametro", "aviso");
            return;
        }

        const chave = parametroAtual();
        const definicao = PARAMETROS[chave];
        const novoValor = +(estado.valores[chave] + direcao * definicao.passo).toFixed(2);

        if (novoValor < definicao.min || novoValor > definicao.max) {
            falar("O valor está fora da faixa documentada para o aparelho selecionado.", "parametro", "aviso");
            return;
        }

        estado.valores[chave] = novoValor;
        estado.decorrido = 0;
        falar(falaParametro(chave), "parametro");
        mudou();
    },

    selecionarCanal(i) {
        estado.canalSelecionado = i;
        falar("Canal " + (i + 1) + " selecionado para ajuste de intensidade.", i ? "saida2" : "saida1");
        mudou();
    },

    ajustarIntensidade(direcao) {
        if (precisaLigar("intensidade")) {
            return;
        }
        pressionar("intensidade");

        if (!estado.emCurso) {
            falar("Inicie a sessão (controle 6) antes de ajustar a intensidade.", "intensidade", "aviso");
            return;
        }

        const i = estado.canalSelecionado;
        const novoValor = estado.canais[i] + direcao;

        if (novoValor < 0) {
            falar(textoCanal(i), "intensidade");
            return;
        }
        if (novoValor > INTENSIDADE_MAXIMA) {
            falar("Limite didático do simulador: " + INTENSIDADE_MAXIMA + " miliampères. O limite real depende do manual.", "intensidade", "aviso");
            return;
        }

        estado.canais[i] = novoValor;
        falar(textoCanal(i), "intensidade");
        mudou();
    },

    iniciarPausar() {
        if (precisaLigar("iniciar")) {
            return;
        }
        pressionar("iniciar");

        if (estado.emCurso) {
            estado.emCurso = false;
            falar("Simulação pausada.", "iniciar");
        } else {
            if (estado.decorrido >= tempoTotal()) {
                estado.decorrido = 0;
            }
            estado.emCurso = true;
            falar("Sessão iniciada. Aumente a intensidade aos poucos a partir de zero.", "iniciar");
        }
        mudou();
    },

    interromper() {
        if (precisaLigar("iniciar")) {
            return;
        }
        pressionar("iniciar");
        estado.emCurso = false;
        estado.decorrido = 0;
        zerarSaidas();
        falar("Saída interrompida. Intensidade zerada nos dois canais.", "iniciar");
        mudou();
    }
};

// Troca o modo sem exigir o aparelho ligado (usado pelos botões TENS / FES)
export function definirModo(indice) {
    estado.indiceModo = indice % MODOS.length;
    estado.valores = { ...modoAtual().padrao };
    estado.indiceParametro = 0;
    estado.emCurso = false;
    estado.decorrido = 0;
    zerarSaidas();
    mudou();
}

// ---------------------------------------------------------------
// Partes do aparelho (mesma numeração do caderno, seção 10)
// ---------------------------------------------------------------

export function valorDe(campo) {
    return typeof campo === "function" ? campo() : campo;
}

const ORIENTACAO_CABOS = "Um canal usualmente utiliza dois eletrodos; quantidade e independência dependem do aparelho. Interrompa a saída antes de modificar a montagem.";

export const ITENS = {
    energia: {
        numero: "1",
        titulo: "Liga/desliga",
        funcao: "Alimenta o equipamento; não equivale a iniciar a estimulação.",
        unidade: "—",
        valor: () => (estado.ligado ? "Ligado" : "Desligado"),
        orientacao: "Ao ligar, confira se a intensidade está em zero antes de conectar os eletrodos.",
        acoes: () => [{ id: "energia", rotulo: estado.ligado ? "Desligar" : "Ligar", funcao: acoes.energia, principal: true }]
    },
    visor: {
        numero: "2",
        titulo: "Visor",
        funcao: "Mostra modalidade, parâmetros, tempo e estado da saída.",
        unidade: "Hz, µs, mA, min",
        valor: () => (estado.ligado ? modoAtual().nome + " · " + minutosSegundos(tempoTotal() - estado.decorrido) : "Apagado"),
        orientacao: "As mesmas informações do visor aparecem neste painel.",
        acoes: () => []
    },
    modo: {
        numero: "3",
        titulo: "Seletor de modo",
        funcao: "Escolhe a modalidade ou o programa disponível.",
        unidade: "—",
        valor: () => modoAtual().nome,
        orientacao: () => modoAtual().objetivo + " " + modoAtual().referencia + " Trocar de modo reinicia a intensidade em zero.",
        acoes: () => MODOS.map((modo, i) => ({
            id: "modo-" + modo.id,
            rotulo: modo.nome,
            pressionado: estado.indiceModo === i,
            funcao: () => acoes.trocarModo(i)
        }))
    },
    parametro: {
        numero: "4",
        titulo: "Ajuste de parâmetros",
        funcao: "Navega entre os parâmetros e altera o valor selecionado. A disposição real depende do modelo.",
        unidade: () => PARAMETROS[parametroAtual()].unidade,
        valor: () => textoParametro(parametroAtual()),
        orientacao: "Pause a sessão para alterar parâmetros. As faixas deste simulador são conceituais; confira as do manual do aparelho.",
        acoes: () => [
            { id: "parametro-proximo", rotulo: "Próximo parâmetro", funcao: acoes.proximoParametro },
            { id: "parametro-menos", rotulo: "− Diminuir", funcao: () => acoes.ajustarParametro(-1) },
            { id: "parametro-mais", rotulo: "+ Aumentar", funcao: () => acoes.ajustarParametro(1) }
        ]
    },
    intensidade: {
        numero: "5",
        titulo: "Intensidade",
        funcao: "Ajusta a amplitude da saída do canal selecionado.",
        unidade: "mA (miliampères)",
        valor: () => "Canal " + (estado.canalSelecionado + 1) + ": " + estado.canais[estado.canalSelecionado] + " mA",
        orientacao: "Começa em zero. Aumente aos poucos até a resposta-alvo (TENS convencional: parestesia forte e confortável, sem dor). Não copie a intensidade de outra pessoa.",
        acoes: () => []
    },
    iniciar: {
        numero: "6",
        titulo: "Iniciar/pausar",
        funcao: "Inicia ou pausa a sessão conforme o manual; inclui o comando de interrupção.",
        unidade: "min:s",
        valor: () => {
            if (!estado.ligado) {
                return "—";
            }
            const restante = minutosSegundos(tempoTotal() - estado.decorrido);
            return estado.emCurso ? "Em curso · restam " + restante : "Parada · " + restante;
        },
        orientacao: "Em caso de ardência, dor inesperada ou mal-estar, interrompa a saída e avalie antes de retomar.",
        acoes: () => [
            { id: "iniciar", rotulo: estado.emCurso ? "Pausar" : "Iniciar", funcao: acoes.iniciarPausar, principal: true },
            { id: "interromper", rotulo: "Interromper saída", funcao: acoes.interromper }
        ]
    },
    saida1: {
        numero: "7",
        titulo: "Saída do canal 1",
        canal: 0,
        funcao: "Conecta o cabo do canal 1, com seu par de eletrodos (1A e 1B).",
        unidade: "mA",
        valor: () => estado.canais[0] + " mA",
        orientacao: ORIENTACAO_CABOS,
        acoes: () => [{ id: "canal-1", rotulo: "Ajustar este canal", pressionado: estado.canalSelecionado === 0, funcao: () => acoes.selecionarCanal(0) }]
    },
    saida2: {
        numero: "8",
        titulo: "Saída do canal 2",
        canal: 1,
        funcao: "Conecta o cabo do canal 2, com seu par de eletrodos (2A e 2B).",
        unidade: "mA",
        valor: () => estado.canais[1] + " mA",
        orientacao: ORIENTACAO_CABOS,
        acoes: () => [{ id: "canal-2", rotulo: "Ajustar este canal", pressionado: estado.canalSelecionado === 1, funcao: () => acoes.selecionarCanal(1) }]
    },
    cabo1: {
        numero: "C1",
        titulo: "Cabo bifurcado do canal 1",
        canal: 0,
        funcao: "Conduz os pulsos e conecta o par de eletrodos 1A e 1B à saída 7.",
        unidade: "—",
        valor: "Conectado (simulação)",
        orientacao: "Confira encaixe e integridade antes do uso. Não improvise adaptadores.",
        acoes: () => []
    },
    cabo2: {
        numero: "C2",
        titulo: "Cabo bifurcado do canal 2",
        canal: 1,
        funcao: "Conduz os pulsos e conecta o par de eletrodos 2A e 2B à saída 8.",
        unidade: "—",
        valor: "Conectado (simulação)",
        orientacao: "Confira encaixe e integridade antes do uso. Não improvise adaptadores.",
        acoes: () => []
    }
};

const ORIENTACAO_ELETRODOS = "A e B identificam eletrodos; não significam polo positivo ou negativo. Não sobrepor eletrodos nem permitir contato entre as bordas. Reutilização, conservação e vida útil seguem o fabricante.";

[["1A", 0], ["1B", 0], ["2A", 1], ["2B", 1]].forEach(function ([codigo, canal]) {
    ITENS["eletrodo" + codigo] = {
        numero: codigo,
        titulo: "Eletrodo autoadesivo " + codigo,
        canal: canal,
        funcao: "Superfície condutora com gel adesivo; faz a interface com a pele. " + (canal ? "2A e 2B" : "1A e 1B") + " formam o canal " + (canal + 1) + ".",
        unidade: "mA (do canal)",
        valor: () => estado.canais[canal] + " mA no canal " + (canal + 1),
        orientacao: ORIENTACAO_ELETRODOS,
        acoes: () => []
    };
});

// ---------------------------------------------------------------
// Cena 3D
// ---------------------------------------------------------------

const visualizador = document.getElementById("visualizador");

let renderizador = null;
try {
    renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (erro) {
    visualizador.insertAdjacentHTML("beforeend",
        "<p class=\"erro-3d\">Este navegador não conseguiu iniciar o 3D (WebGL). Use a lista de controles abaixo: ela tem todas as funções do modelo.</p>");
}

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
const renderizadorRotulos = new CSS2DRenderer();
renderizadorRotulos.domElement.className = "rotulos";
let controles = null;

if (renderizador) {
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    renderizador.toneMapping = THREE.ACESFilmicToneMapping;
    visualizador.prepend(renderizador.domElement);
    visualizador.appendChild(renderizadorRotulos.domElement);

    const geradorAmbiente = new THREE.PMREMGenerator(renderizador);
    cena.environment = geradorAmbiente.fromScene(new RoomEnvironment(), 0.04).texture;

    controles = new OrbitControls(camera, renderizador.domElement);
    controles.enableDamping = true;
    controles.minDistance = 12;
    controles.maxDistance = 90;
}

cena.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.5));
const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.4);
luzPrincipal.position.set(10, 18, 22);
cena.add(luzPrincipal);

const aparelho = new THREE.Group();
cena.add(aparelho);
const camadaRotulos = new THREE.Group();
cena.add(camadaRotulos);

const CORES = { canal1: 0x8b3a5a, canal2: 0x16807f, escuro: 0x1a2226, corpo: 0xe9eeec };

function texturaDesenhada(largura, altura, desenhar) {
    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const ctx = tela.getContext("2d");
    desenhar(ctx, largura, altura);

    const textura = new THREE.CanvasTexture(tela);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 8;
    return { ctx: ctx, textura: textura };
}

function material(cor, opcoes = {}) {
    return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, metalness: 0, ...opcoes });
}

// Cilindro deitado, virado para a frente
function cilindroFrontal(raioTopo, raioBase, altura, segmentos = 48) {
    return new THREE.CylinderGeometry(raioTopo, raioBase, altura, segmentos).rotateX(Math.PI / 2);
}

// Gabinete
const gabinete = new THREE.Mesh(
    new RoundedBoxGeometry(14, 9.5, 3, 6, 0.8),
    new THREE.MeshPhysicalMaterial({ color: CORES.corpo, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 })
);
aparelho.add(gabinete);

// Painel frontal com serigrafia (100 px = 1 cm)
const LARGURA_PAINEL = 12.2;
const ALTURA_PAINEL = 8.0;

function posicaoNoPainel(x, y) {
    return [(x + LARGURA_PAINEL / 2) * 100, (ALTURA_PAINEL / 2 - y) * 100];
}

const serigrafia = texturaDesenhada(1220, 800, function (ctx, largura, altura) {
    ctx.fillStyle = "#22343a";
    ctx.beginPath();
    ctx.roundRect(0, 0, largura, altura, 50);
    ctx.fill();

    function escrever(texto, x, y) {
        const [px, py] = posicaoNoPainel(x, y);
        ctx.fillText(texto, px, py);
    }

    ctx.fillStyle = "#c9d6d3";
    ctx.textAlign = "center";
    ctx.font = "600 30px system-ui, sans-serif";
    escrever("LIGA", -4.9, 1.65);
    escrever("MODO", -4.9, -0.35);
    escrever("PARÂMETRO", -3.4, -3.0);
    escrever("INTENSIDADE", 0, -3.25);
    escrever("INICIAR / PAUSAR", 3.4, -3.0);

    ctx.font = "700 32px system-ui, sans-serif";
    ctx.fillStyle = "#d77ea0";
    escrever("CH1", -2.0, -3.62);
    ctx.fillStyle = "#4fc1bd";
    escrever("CH2", 3.2, -3.62);

    ctx.fillStyle = "#7f9692";
    ctx.font = "600 22px system-ui, sans-serif";
    escrever("MODELO CONCEITUAL · SEM MARCA", 0.6, -3.65);
});

const painelFrontal = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGURA_PAINEL, ALTURA_PAINEL),
    new THREE.MeshStandardMaterial({ map: serigrafia.textura, roughness: 0.6, alphaTest: 0.5 })
);
painelFrontal.position.z = 1.502;
aparelho.add(painelFrontal);

// Registro das partes clicáveis
const gruposPorParte = {};
const clicaveis = [];

function registrar(id, grupo) {
    grupo.traverse(function (objeto) {
        if (!objeto.isMesh) {
            return;
        }
        objeto.material = objeto.material.clone();
        objeto.userData.parte = id;
        clicaveis.push(objeto);
    });
    gruposPorParte[id] = grupo;
    aparelho.add(grupo);
}

// Botões
function criarBotao(raio, cor, desenharIcone) {
    const grupo = new THREE.Group();

    const moldura = new THREE.Mesh(cilindroFrontal(raio + 0.15, raio + 0.2, 0.1), material(CORES.escuro, { roughness: 0.7 }));
    moldura.position.z = 0.05;

    const tampa = new THREE.Group();
    const corpoTampa = new THREE.Mesh(
        cilindroFrontal(raio, raio, 0.35),
        new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.35, clearcoat: 0.6 })
    );
    corpoTampa.position.z = 0.175;

    const icone = texturaDesenhada(256, 256, function (ctx) {
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        desenharIcone(ctx);
    });
    const topo = new THREE.Mesh(
        new THREE.CircleGeometry(raio * 0.92, 48),
        new THREE.MeshStandardMaterial({ map: icone.textura, transparent: true, roughness: 0.5 })
    );
    topo.position.z = 0.352;

    tampa.add(corpoTampa, topo);
    grupo.add(moldura, tampa);
    grupo.userData.tampa = tampa;
    return grupo;
}

const botaoEnergia = criarBotao(0.75, CORES.canal1, function (ctx) {
    ctx.beginPath();
    ctx.arc(128, 136, 62, -Math.PI * 0.32, Math.PI * 1.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 50);
    ctx.lineTo(128, 130);
    ctx.stroke();
});
botaoEnergia.position.set(-4.9, 2.7, 1.5);
registrar("energia", botaoEnergia);

const botaoModo = criarBotao(0.75, 0x4a5a60, function (ctx) {
    ctx.font = "700 120px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", 128, 136);
});
botaoModo.position.set(-4.9, 0.7, 1.5);
registrar("modo", botaoModo);

const botaoParametro = criarBotao(0.75, 0x4a5a60, function (ctx) {
    ctx.beginPath();
    ctx.moveTo(128, 46);
    ctx.lineTo(176, 100);
    ctx.lineTo(80, 100);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(128, 210);
    ctx.lineTo(176, 156);
    ctx.lineTo(80, 156);
    ctx.closePath();
    ctx.fill();
});
botaoParametro.position.set(-3.4, -1.8, 1.5);
registrar("parametro", botaoParametro);

const botaoIniciar = criarBotao(0.75, CORES.canal2, function (ctx) {
    ctx.beginPath();
    ctx.moveTo(62, 80);
    ctx.lineTo(128, 128);
    ctx.lineTo(62, 176);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(150, 80, 18, 96);
    ctx.fillRect(186, 80, 18, 96);
});
botaoIniciar.position.set(3.4, -1.8, 1.5);
registrar("iniciar", botaoIniciar);

// Botão giratório de intensidade (5)
const botaoGiratorio = new THREE.Group();
const parteGiratoria = new THREE.Group();
{
    const base = new THREE.Mesh(cilindroFrontal(1.15, 1.22, 0.15), material(CORES.escuro, { roughness: 0.7 }));
    base.position.z = 0.075;

    const corpo = new THREE.Mesh(
        cilindroFrontal(0.95, 1.0, 0.8),
        new THREE.MeshPhysicalMaterial({ color: 0x3a464b, roughness: 0.4, clearcoat: 0.4 })
    );
    corpo.position.z = 0.55;
    parteGiratoria.add(corpo);

    // Ranhuras em volta do botão
    for (let i = 0; i < 28; i++) {
        const angulo = (i / 28) * Math.PI * 2;
        const ranhura = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.7), material(0x2c3639));
        ranhura.position.set(Math.cos(angulo) * 0.98, Math.sin(angulo) * 0.98, 0.55);
        ranhura.rotation.z = angulo;
        parteGiratoria.add(ranhura);
    }

    const marca = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.55, 0.04),
        material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.2 })
    );
    marca.position.set(0, 0.55, 0.97);
    parteGiratoria.add(marca);

    botaoGiratorio.add(base, parteGiratoria);
}
botaoGiratorio.position.set(0, -1.8, 1.5);
registrar("intensidade", botaoGiratorio);

// Marcas fixas em volta do botão giratório
{
    const marcas = new THREE.Group();
    for (let i = 0; i <= 8; i++) {
        const angulo = THREE.MathUtils.degToRad(225 - i * (270 / 8));
        const marca = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.01), material(0xc9d6d3));
        marca.position.set(Math.cos(angulo) * 1.42, Math.sin(angulo) * 1.42, 0.01);
        marca.rotation.z = angulo - Math.PI / 2;
        marcas.add(marca);
    }
    marcas.position.set(0, -1.8, 1.503);
    aparelho.add(marcas);
}

// Visor (2)
const telaVisor = texturaDesenhada(720, 300, function () {});
const visor = new THREE.Group();
{
    const moldura = new THREE.Mesh(new RoundedBoxGeometry(7.6, 3.4, 0.16, 2, 0.12), material(0x0c1214, { roughness: 0.3 }));
    moldura.position.z = 0.08;

    const tela = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 3.0),
        new THREE.MeshBasicMaterial({ map: telaVisor.textura, toneMapped: false })
    );
    tela.position.z = 0.165;

    visor.add(moldura, tela);
}
visor.position.set(1.3, 1.9, 1.5);
registrar("visor", visor);

// LED de ligado
const ledEnergia = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 20, 12),
    material(0x333344, { emissive: 0x3ddc84, emissiveIntensity: 0 })
);
ledEnergia.position.set(-3.75, 2.7, 1.52);
aparelho.add(ledEnergia);

// Saídas (7, 8) na face inferior, com plugue e LED frontal
const X_SAIDAS = [-2.6, 2.6];
const ledsSaida = [];

for (let i = 0; i < 2; i++) {
    const cor = i ? CORES.canal2 : CORES.canal1;
    const grupo = new THREE.Group();

    const tomada = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.25, 32), material(0x111517, { roughness: 0.4 }));
    tomada.position.y = -0.1;

    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 12, 40).rotateX(Math.PI / 2), material(cor));
    anel.position.y = -0.2;

    const plugue = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 1.1, 32),
        new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.4, clearcoat: 0.5 })
    );
    plugue.position.y = -0.75;

    const protetor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.14, 0.6, 24), material(0x2a3236));
    protetor.position.y = -1.6;

    grupo.add(tomada, anel, plugue, protetor);
    grupo.position.set(X_SAIDAS[i], -4.75, 0);
    registrar(i ? "saida2" : "saida1", grupo);

    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 20, 12),
        material(0x222222, { emissive: cor, emissiveIntensity: 0 })
    );
    led.position.set(X_SAIDAS[i], -3.25, 1.52);
    aparelho.add(led);
    ledsSaida.push(led);
}

// Eletrodos
const eletrodos = {};
const brilhoEletrodos = [[], []];
const Y_ELETRODOS = -13.5;
const X_ELETRODOS = { "1B": -10, "1A": -5.2, "2A": 5.2, "2B": 10 };

Object.entries(X_ELETRODOS).forEach(function ([codigo, x]) {
    const canal = codigo[0] === "1" ? 0 : 1;
    const cor = canal ? CORES.canal2 : CORES.canal1;
    const grupo = new THREE.Group();

    const fundo = new THREE.Mesh(new RoundedBoxGeometry(3.8, 3.8, 0.22, 4, 0.3), material(cor, { roughness: 0.6 }));

    const etiqueta = texturaDesenhada(512, 512, function (ctx, largura, altura) {
        const gradiente = ctx.createRadialGradient(largura / 2, altura / 2, 40, largura / 2, altura / 2, 320);
        gradiente.addColorStop(0, "#e6edf0");
        gradiente.addColorStop(1, "#bfcbd0");
        ctx.fillStyle = gradiente;
        ctx.beginPath();
        ctx.roundRect(0, 0, largura, altura, 40);
        ctx.fill();

        ctx.fillStyle = canal ? "#16807f" : "#8b3a5a";
        ctx.font = "800 170px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(codigo, largura / 2, altura / 2 - 20);
        ctx.font = "600 50px system-ui, sans-serif";
        ctx.fillText("CANAL " + (canal + 1), largura / 2, altura / 2 + 110);
    });

    const gel = new THREE.Mesh(
        new THREE.PlaneGeometry(3.45, 3.45),
        new THREE.MeshStandardMaterial({ map: etiqueta.textura, roughness: 0.25, transparent: true, emissive: cor, emissiveIntensity: 0 })
    );
    gel.position.z = 0.115;
    gel.userData.brilho = canal;

    const encaixe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.35), material(0x2a3236));
    encaixe.position.set(0, 1.95, -0.05);

    grupo.add(fundo, gel, encaixe);
    grupo.position.set(x, Y_ELETRODOS, 0);
    grupo.rotation.x = -0.35;
    registrar("eletrodo" + codigo, grupo);
    eletrodos[codigo] = grupo;
});

aparelho.updateMatrixWorld(true);

// O gel dos eletrodos brilha conforme a saída do canal
["eletrodo1A", "eletrodo1B", "eletrodo2A", "eletrodo2B"].forEach(function (id) {
    gruposPorParte[id].traverse(function (objeto) {
        if (objeto.userData.brilho !== undefined) {
            brilhoEletrodos[objeto.userData.brilho].push(objeto);
        }
    });
});

// Cabos bifurcados
function tubo(pontos, raio) {
    const curva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(curva, 80, raio, 12, false), material(0x2a3236, { roughness: 0.55 }));
}

function topoEletrodo(codigo) {
    return eletrodos[codigo].localToWorld(new THREE.Vector3(0, 2.2, -0.05)).toArray();
}

for (let i = 0; i < 2; i++) {
    const lado = i ? 1 : -1;
    const cor = i ? CORES.canal2 : CORES.canal1;
    const [interno, externo] = i ? ["2A", "2B"] : ["1A", "1B"];
    const inicio = [X_SAIDAS[i], -6.65, 0];
    const divisao = [lado * 5.2, -9.0, 0.6];
    const grupo = new THREE.Group();

    grupo.add(tubo([inicio, [X_SAIDAS[i] + lado * 0.4, -7.7, 0.3], [lado * 4.2, -8.6, 0.6], divisao], 0.13));

    const divisor = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 6, 16), material(cor));
    divisor.position.set(...divisao);
    grupo.add(divisor);

    const a = topoEletrodo(interno);
    const b = topoEletrodo(externo);
    grupo.add(tubo([divisao, [lado * 5.3, -10.0, 0.4], [a[0], a[1] + 0.9, a[2] + 0.2], a], 0.09));
    grupo.add(tubo([divisao, [lado * 7.0, -9.7, 0.5], [lado * 9.4, -10.4, 0.2], [b[0], b[1] + 0.9, b[2] + 0.2], b], 0.09));

    registrar(i ? "cabo2" : "cabo1", grupo);
}

// ---------------------------------------------------------------
// Informações flutuantes
// Os balões repetem o que o painel já informa, por isso ficam
// ocultos para leitores de tela.
// ---------------------------------------------------------------

function criarBalao(classe) {
    const ancora = document.createElement("div");
    ancora.className = "balao-ancora";

    const elemento = document.createElement("div");
    elemento.className = "balao " + classe;
    elemento.setAttribute("aria-hidden", "true");
    ancora.appendChild(elemento);

    const objeto = new CSS2DObject(ancora);
    camadaRotulos.add(objeto);
    return { elemento: elemento, objeto: objeto };
}

const balaoInfo = criarBalao("balao-info");
const balaoMensagem = criarBalao("balao-mensagem");
let baloesAtivos = true;
let tempoMensagem = 0;

const ancorasCalculadas = {};

function pontosAncora(id) {
    if (!ancorasCalculadas[id]) {
        const caixa = new THREE.Box3().setFromObject(gruposPorParte[id]);
        const centroX = (caixa.min.x + caixa.max.x) / 2;
        ancorasCalculadas[id] = {
            cima: new THREE.Vector3(centroX, caixa.max.y, caixa.max.z),
            baixo: new THREE.Vector3(centroX, caixa.min.y, caixa.max.z)
        };
    }
    return ancorasCalculadas[id];
}

function atualizarBalaoInfo() {
    // O balão aparece com o mouse em cima da parte ou logo depois de selecioná-la
    const id = sobMouse || (balaoDoSelecionado ? selecionado : null);

    if (!baloesAtivos || !id) {
        balaoInfo.elemento.classList.remove("mostrar");
        return;
    }

    const item = ITENS[id];
    const numero = /^\d$/.test(item.numero) ? item.numero + " · " : "";

    idBalaoInfo = id;
    balaoInfo.objeto.position.copy(pontosAncora(id).cima);
    balaoInfo.elemento.innerHTML =
        "<strong>" + numero + item.titulo + "</strong>" +
        item.funcao +
        "<span class=\"valor\">" + valorDe(item.valor) + "</span>";
    balaoInfo.elemento.classList.add("mostrar");
}

function mostrarMensagemFlutuante(mensagem, origem, tipo) {
    if (!baloesAtivos || !origem || !gruposPorParte[origem]) {
        return;
    }

    origemMensagem = origem;
    balaoMensagem.objeto.position.copy(pontosAncora(origem).baixo);
    balaoMensagem.elemento.textContent = mensagem;
    balaoMensagem.elemento.classList.toggle("aviso", tipo === "aviso");
    balaoMensagem.elemento.classList.add("mostrar");

    clearTimeout(tempoMensagem);
    tempoMensagem = setTimeout(function () {
        balaoMensagem.elemento.classList.remove("mostrar");
    }, tipo === "aviso" ? 4000 : 2800);
}

// Parte a que cada balão está preso no momento
let idBalaoInfo = null;
let origemMensagem = null;

// Altura (em pixels, a partir do topo da área 3D) de um ponto da cena
const pontoNaTela = new THREE.Vector3();

function alturaNaTela(ponto) {
    pontoNaTela.copy(ponto).project(camera);
    return (-pontoNaTela.y * 0.5 + 0.5) * visualizador.clientHeight;
}

// Se o balão não cabe do lado normal, ele passa para o outro lado da parte:
// o de informação vai para baixo e o de mensagem vai para cima
function posicionarBaloes() {
    const margem = 8;
    const alturaArea = visualizador.clientHeight;

    if (idBalaoInfo && balaoInfo.elemento.classList.contains("mostrar")) {
        const ancoras = pontosAncora(idBalaoInfo);
        const alturaBalao = balaoInfo.elemento.offsetHeight + 16;
        const cabeEmCima = alturaNaTela(ancoras.cima) - alturaBalao > margem;

        balaoInfo.objeto.position.copy(cabeEmCima ? ancoras.cima : ancoras.baixo);
        balaoInfo.elemento.classList.toggle("invertido", !cabeEmCima);
    }

    if (origemMensagem && balaoMensagem.elemento.classList.contains("mostrar")) {
        const ancoras = pontosAncora(origemMensagem);
        const alturaBalao = balaoMensagem.elemento.offsetHeight + 16;
        const cabeEmBaixo = alturaNaTela(ancoras.baixo) + alturaBalao < alturaArea - margem;

        balaoMensagem.objeto.position.copy(cabeEmBaixo ? ancoras.baixo : ancoras.cima);
        balaoMensagem.elemento.classList.toggle("invertido", !cabeEmBaixo);
    }
}

// Mantém o balão dentro da área do 3D, deslocando-o na horizontal
function manterBalaoNaArea(elemento) {
    if (!elemento.classList.contains("mostrar")) {
        return;
    }

    elemento.style.setProperty("--deslocamento", "0px");
    const balao = elemento.getBoundingClientRect();
    const area = visualizador.getBoundingClientRect();
    let deslocamento = 0;

    if (balao.left < area.left + 8) {
        deslocamento = area.left + 8 - balao.left;
    } else if (balao.right > area.right - 8) {
        deslocamento = area.right - 8 - balao.right;
    }

    elemento.style.setProperty("--deslocamento", deslocamento + "px");
}

// ---------------------------------------------------------------
// Visor
// ---------------------------------------------------------------

function desenharVisor() {
    const ctx = telaVisor.ctx;
    const largura = 720;
    const altura = 300;

    ctx.clearRect(0, 0, largura, altura);

    if (!estado.ligado) {
        ctx.fillStyle = "#0a1113";
        ctx.fillRect(0, 0, largura, altura);
        telaVisor.textura.needsUpdate = true;
        return;
    }

    ctx.fillStyle = "#0b2a2c";
    ctx.fillRect(0, 0, largura, altura);

    const corTexto = "#c8f5ec";
    const corApagada = "#6fb3a8";
    const v = estado.valores;
    const modo = modoAtual().id;

    // Linha de cima: modo e situação
    ctx.textBaseline = "alphabetic";
    ctx.font = "700 34px ui-monospace, Consolas, monospace";
    ctx.fillStyle = corTexto;
    ctx.textAlign = "left";
    ctx.fillText(modoAtual().curto, 24, 50);

    ctx.textAlign = "right";
    if (estado.emCurso) {
        ctx.fillStyle = "#7dffb2";
        ctx.fillText("● EM CURSO", largura - 24, 50);
    } else {
        ctx.fillStyle = "#ffd479";
        ctx.fillText(estado.decorrido > 0 ? "❚❚ PAUSA" : "PRONTO", largura - 24, 50);
    }

    // Frequência e duração de fase em destaque
    ctx.textAlign = "left";
    ctx.fillStyle = corTexto;
    ctx.font = "700 52px ui-monospace, Consolas, monospace";
    const destaque = modo === "burst"
        ? v.rajadas + "/s " + v.frequencia + "Hz " + v.largura + "µs"
        : v.frequencia + " Hz  " + v.largura + " µs";
    ctx.fillText(destaque, 24, 125);

    ctx.font = "600 28px ui-monospace, Consolas, monospace";
    ctx.fillStyle = corApagada;
    ctx.fillText("▸ " + textoParametro(parametroAtual()), 24, 175);

    // Intensidade dos canais e tempo restante
    ctx.font = "700 34px ui-monospace, Consolas, monospace";
    for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i ? "#4fc1bd" : "#e79bb8";
        const marcador = estado.canalSelecionado === i ? "▶" : " ";
        ctx.fillText(marcador + "CH" + (i + 1) + " " + String(estado.canais[i]).padStart(2, " ") + "mA", 14 + i * 250, 240);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = corTexto;
    ctx.fillText(minutosSegundos(tempoTotal() - estado.decorrido), largura - 24, 240);

    if (modo === "nmes") {
        const fase = faseNmes(Math.min(estado.decorrido, tempoTotal() - 1e-6));
        ctx.font = "600 26px ui-monospace, Consolas, monospace";
        ctx.fillStyle = corApagada;
        ctx.fillText(fase.nome + " · ciclo " + fase.ciclo + "/" + v.ciclos, largura - 24, 285);
    }

    telaVisor.textura.needsUpdate = true;
}

// ---------------------------------------------------------------
// Seleção, destaque e animação de pressionar
// ---------------------------------------------------------------

let selecionado = null;
let sobMouse = null;

// Depois de selecionar uma parte, o balão dela fica visível por alguns segundos
const TEMPO_BALAO_SELECIONADO = 3500;
let balaoDoSelecionado = false;
let tempoBalaoSelecionado = 0;

export function parteSelecionada() {
    return selecionado;
}

const COR_DESTAQUE = new THREE.Color(0xe0a100);

function destacar(id, nivel) {
    const intensidade = [0, 0.18, 0.4][nivel];

    if (!gruposPorParte[id]) {
        return;
    }

    gruposPorParte[id].traverse(function (objeto) {
        if (!objeto.isMesh || objeto.userData.brilho !== undefined || !objeto.material.emissive) {
            return;
        }
        objeto.material.emissive.copy(COR_DESTAQUE);
        objeto.material.emissiveIntensity = intensidade;
    });
}

// mostrarBalao = false seleciona sem abrir o balão (usado ao carregar a página)
export function selecionar(id, mostrarBalao = true) {
    if (selecionado) {
        destacar(selecionado, 0);
    }
    selecionado = id;
    destacar(id, 2);

    clearTimeout(tempoBalaoSelecionado);
    balaoDoSelecionado = mostrarBalao;
    if (mostrarBalao) {
        tempoBalaoSelecionado = setTimeout(function () {
            balaoDoSelecionado = false;
            atualizarBalaoInfo();
        }, TEMPO_BALAO_SELECIONADO);
    }

    atualizarBalaoInfo();
    avisar();
}

const temposPressionado = {};

function pressionar(id) {
    temposPressionado[id] = 0.16;
}

function mudou() {
    desenharVisor();
    atualizarBalaoInfo();
    avisar();
}

const raio = new THREE.Raycaster();
const posicaoMouse = new THREE.Vector2();
let inicioClique = null;

function parteNaPosicao(evento) {
    const area = renderizador.domElement.getBoundingClientRect();
    posicaoMouse.set(
        ((evento.clientX - area.left) / area.width) * 2 - 1,
        -((evento.clientY - area.top) / area.height) * 2 + 1
    );
    raio.setFromCamera(posicaoMouse, camera);

    const acerto = raio.intersectObjects(clicaveis, false)[0];
    return acerto ? acerto.object.userData.parte : null;
}

function marcarSobMouse(id) {
    if (id === sobMouse) {
        return;
    }
    if (sobMouse && sobMouse !== selecionado) {
        destacar(sobMouse, 0);
    }
    sobMouse = id;
    if (id && id !== selecionado) {
        destacar(id, 1);
    }
    atualizarBalaoInfo();
}

if (renderizador) {
    const tela = renderizador.domElement;

    tela.addEventListener("pointerdown", function (evento) {
        inicioClique = [evento.clientX, evento.clientY];
    });

    tela.addEventListener("pointerup", function (evento) {
        if (!inicioClique) {
            return;
        }

        // Se arrastou, foi para girar o modelo e não para clicar
        const distancia = Math.hypot(evento.clientX - inicioClique[0], evento.clientY - inicioClique[1]);
        inicioClique = null;
        if (distancia > 5) {
            return;
        }

        const id = parteNaPosicao(evento);
        if (id) {
            selecionar(id);
        }
    });

    tela.addEventListener("pointermove", function (evento) {
        if (evento.buttons) {
            return;
        }
        const id = parteNaPosicao(evento);
        marcarSobMouse(id);
        tela.style.cursor = id ? "pointer" : "grab";
    });

    tela.addEventListener("pointerleave", function () {
        marcarSobMouse(null);
    });
}

// ---------------------------------------------------------------
// Câmera e botões da área 3D
// ---------------------------------------------------------------

let cameraMovida = false;

if (controles) {
    controles.addEventListener("start", function () {
        cameraMovida = true;
    });
}

function enquadrar() {
    const alvo = new THREE.Vector3(0, -5.2, 0);
    const tangente = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distancia = Math.max(22 / 2 / tangente, 26 / 2 / (tangente * camera.aspect)) * 1.08;
    const direcao = new THREE.Vector3(0.22, 0.16, 1).normalize();

    camera.position.copy(alvo).addScaledVector(direcao, distancia);

    if (controles) {
        controles.target.copy(alvo);
        controles.update();
    }
}

function redimensionar() {
    const largura = visualizador.clientWidth;
    const altura = visualizador.clientHeight;

    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();

    if (renderizador) {
        renderizador.setSize(largura, altura);
    }
    renderizadorRotulos.setSize(largura, altura);

    if (!cameraMovida) {
        enquadrar();
    }
}

new ResizeObserver(redimensionar).observe(visualizador);

document.getElementById("botaoCentralizar").addEventListener("click", function () {
    cameraMovida = false;
    enquadrar();
});

const botaoBaloes = document.getElementById("botaoBaloes");
botaoBaloes.addEventListener("click", function () {
    baloesAtivos = botaoBaloes.getAttribute("aria-pressed") !== "true";
    botaoBaloes.setAttribute("aria-pressed", String(baloesAtivos));
    renderizadorRotulos.domElement.classList.toggle("sem-baloes", !baloesAtivos);

    if (!baloesAtivos) {
        balaoMensagem.elemento.classList.remove("mostrar");
    }
    atualizarBalaoInfo();
});

// ---------------------------------------------------------------
// Animação
// ---------------------------------------------------------------

const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const relogio = new THREE.Clock();
let tempoAtualizacao = 0;

// Nível de saída de um canal (0 a 1) para o brilho dos eletrodos
function nivelSaida(i, tempo) {
    if (!estado.emCurso || !estado.canais[i]) {
        return 0;
    }

    const base = estado.canais[i] / INTENSIDADE_MAXIMA;
    const modo = modoAtual().id;
    const v = estado.valores;

    if (modo === "nmes") {
        return base * faseNmes(estado.decorrido).envelope;
    }
    if (reduzirMovimento) {
        return base;
    }
    if (modo === "acupuntura") {
        return base * ((tempo * v.frequencia) % 1 < 0.18 ? 1 : 0.2);
    }
    if (modo === "burst") {
        return base * ((tempo * v.rajadas) % 1 < 0.3 ? 1 : 0.2);
    }
    return base * (0.85 + 0.15 * Math.sin(tempo * 40));
}

function animar() {
    const intervalo = Math.min(relogio.getDelta(), 0.1);
    const tempo = relogio.elapsedTime;

    // Contagem do tempo da sessão
    if (estado.emCurso) {
        estado.decorrido += intervalo * estado.velocidade;

        if (estado.decorrido >= tempoTotal()) {
            estado.decorrido = tempoTotal();
            estado.emCurso = false;
            zerarSaidas();
            falar("Sessão concluída. Registre a condição da pele, a resposta e os ajustes realizados.", "iniciar");
            mudou();
        }

        tempoAtualizacao += intervalo;
        if (tempoAtualizacao > 0.25) {
            tempoAtualizacao = 0;
            mudou();
        }
    }

    // LEDs e brilho dos eletrodos
    for (let i = 0; i < 2; i++) {
        const nivel = nivelSaida(i, tempo);

        brilhoEletrodos[i].forEach(function (malha) {
            malha.material.emissiveIntensity = nivel * 1.1;
        });

        if (!estado.ligado) {
            ledsSaida[i].material.emissiveIntensity = 0;
        } else if (estado.emCurso && estado.canais[i]) {
            ledsSaida[i].material.emissiveIntensity = 0.6 + nivel * 2;
        } else {
            ledsSaida[i].material.emissiveIntensity = 0.05;
        }
    }
    ledEnergia.material.emissiveIntensity = estado.ligado ? 1.6 : 0;

    // Botão giratório acompanha a intensidade do canal selecionado
    const anguloAlvo = THREE.MathUtils.degToRad(135 - 270 * (estado.canais[estado.canalSelecionado] / INTENSIDADE_MAXIMA));
    parteGiratoria.rotation.z += (anguloAlvo - parteGiratoria.rotation.z) * Math.min(1, intervalo * 12);

    // Botões afundam rapidamente quando pressionados
    Object.keys(temposPressionado).forEach(function (id) {
        temposPressionado[id] -= intervalo;
        const afundado = temposPressionado[id] > 0;
        const tampa = gruposPorParte[id] ? gruposPorParte[id].userData.tampa : null;

        if (tampa) {
            tampa.position.z = afundado ? -0.12 : 0;
        }
        if (id === "intensidade") {
            botaoGiratorio.position.z = afundado ? 1.44 : 1.5;
        }
        if (!afundado) {
            delete temposPressionado[id];
        }
    });

    if (renderizador) {
        controles.update();
        renderizador.render(cena, camera);
        posicionarBaloes();
        renderizadorRotulos.render(cena, camera);
        manterBalaoNaArea(balaoInfo.elemento);
        manterBalaoNaArea(balaoMensagem.elemento);
    }

    requestAnimationFrame(animar);
}

redimensionar();
enquadrar();
desenharVisor();
animar();

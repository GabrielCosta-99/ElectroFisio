
// Tela do aparelho: painel de informações, intensidade e desenho do pulso

import {
    INTENSIDADE_MAXIMA,
    REFERENCIA_MANUAL,
    ITENS,
    estado,
    acoes,
    aoMudar,
    definirModo,
    duracaoCiclo,
    formatar,
    modoAtual,
    parteSelecionada,
    selecionar,
    valorDe
} from "./aparelho-3d.js";

const campoNome = document.getElementById("campoNome");
const campoUnidade = document.getElementById("campoUnidade");
const campoValor = document.getElementById("campoValor");
const campoOrientacao = document.getElementById("campoOrientacao");
const campoManual = document.getElementById("campoManual");
const acoesControle = document.getElementById("acoesControle");
const textoEstado = document.getElementById("textoEstado");
const indicadorEstado = document.getElementById("indicadorEstado");
const valorIntensidade = document.getElementById("valorIntensidade");
const barraIntensidade = document.getElementById("barraIntensidade");
const mensagem = document.getElementById("mensagem");
const botaoEnergia = document.getElementById("botaoEnergia");
const botaoIniciar = document.getElementById("botaoIniciar");
const botaoDiminuir = document.getElementById("diminuir");
const botaoAumentar = document.getElementById("aumentar");
const botoesControle = document.querySelectorAll(".botao-controle");
const botoesCanal = document.querySelectorAll(".botao-canal");
const botoesModo = document.querySelectorAll(".botao-modo");
const graficoPulso = document.getElementById("graficoPulso");
const descricaoPulso = document.getElementById("descricaoPulso");

// Modo do aparelho usado em cada modalidade (0 = TENS convencional, 3 = NMES/FES)
const MODO_POR_MODALIDADE = { tens: 0, fes: 3 };

// ---------------------------------------------------------------
// Painel de informações
// ---------------------------------------------------------------

function atualizarAcoes(parte) {
    // Guarda o botão com foco para não perder a posição de quem usa teclado
    const focado = document.activeElement ? document.activeElement.dataset.acao : null;

    acoesControle.innerHTML = "";

    ITENS[parte].acoes().forEach(function (acao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "botao-acao-controle";
        botao.dataset.acao = acao.id;
        botao.textContent = acao.rotulo;

        if (acao.principal) {
            botao.classList.add("principal");
        }
        if (acao.pressionado !== undefined) {
            botao.setAttribute("aria-pressed", String(acao.pressionado));
        }

        botao.addEventListener("click", acao.funcao);
        acoesControle.appendChild(botao);
    });

    if (focado) {
        const mesmoBotao = acoesControle.querySelector("[data-acao=\"" + focado + "\"]");
        if (mesmoBotao) {
            mesmoBotao.focus();
        }
    }
}

function atualizarPainel() {
    const parte = parteSelecionada();

    if (parte) {
        const item = ITENS[parte];
        campoNome.textContent = item.titulo;
        campoUnidade.textContent = valorDe(item.unidade);
        campoValor.textContent = valorDe(item.valor);
        campoOrientacao.textContent = valorDe(item.orientacao);
        campoManual.textContent = "Manual: " + REFERENCIA_MANUAL;
        atualizarAcoes(parte);
    }

    botoesControle.forEach(function (botao) {
        botao.classList.toggle("selecionado", botao.dataset.parte === parte);
    });

    // Estado do aparelho
    let texto = "Desligado";
    if (estado.ligado) {
        texto = estado.emCurso ? "Em curso" : "Ligado";
    }
    textoEstado.textContent = texto;
    indicadorEstado.classList.toggle("ligado", estado.ligado && !estado.emCurso);
    indicadorEstado.classList.toggle("em-curso", estado.emCurso);

    // Intensidade do canal em ajuste
    const intensidade = estado.canais[estado.canalSelecionado];
    valorIntensidade.textContent = intensidade + " mA";
    barraIntensidade.style.width = (intensidade / INTENSIDADE_MAXIMA * 100) + "%";

    botoesCanal.forEach(function (botao) {
        botao.classList.toggle("ativo", Number(botao.dataset.canal) === estado.canalSelecionado);
    });

    botaoEnergia.textContent = estado.ligado ? "Desligar" : "Ligar";
    botaoEnergia.classList.toggle("ativo", estado.ligado);
    botaoIniciar.textContent = estado.emCurso ? "Pausar" : "Iniciar";
    botaoIniciar.classList.toggle("ativo", estado.emCurso);
    botaoIniciar.disabled = !estado.ligado;

    desenharPulso();
}

function mostrarMensagem(texto, tipo) {
    if (!texto) {
        return;
    }
    mensagem.textContent = texto;
    mensagem.classList.toggle("aviso", tipo === "aviso");
}

// ---------------------------------------------------------------
// Desenho do pulso
// ---------------------------------------------------------------

function desenharPulso() {
    const escala = Math.min(window.devicePixelRatio, 2);
    const largura = graficoPulso.clientWidth || 340;
    const altura = graficoPulso.clientHeight || 120;

    if (graficoPulso.width !== largura * escala) {
        graficoPulso.width = largura * escala;
        graficoPulso.height = altura * escala;
    }

    const ctx = graficoPulso.getContext("2d");
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.clearRect(0, 0, largura, altura);

    const estilos = getComputedStyle(document.documentElement);
    const corCanal = estilos.getPropertyValue(estado.canalSelecionado ? "--canal2" : "--canal1").trim();
    const corApagada = "#6B7370";

    const v = estado.valores;
    const modo = modoAtual().id;
    const intensidade = estado.canais[estado.canalSelecionado];

    const meio = altura / 2 + 6;
    const alturaMaxima = altura / 2 - 18;
    const amplitude = (intensidade / INTENSIDADE_MAXIMA) * alturaMaxima;
    const margem = 10;
    const larguraUtil = largura - margem * 2;

    // Linha de base
    ctx.font = "11px Arial, sans-serif";
    ctx.strokeStyle = corApagada;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(margem, meio);
    ctx.lineTo(largura - margem, meio);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = corCanal;
    ctx.fillStyle = corCanal;
    ctx.lineWidth = 1.5;

    let descricao;
    let janela;

    if (modo === "nmes") {
        // Um ciclo completo: subida, platô, descida e repouso
        const ciclo = duracaoCiclo();
        const x = (t) => margem + (t / ciclo) * larguraUtil;
        const h = amplitude || alturaMaxima;

        ctx.globalAlpha = amplitude ? 0.85 : 0.25;
        ctx.beginPath();
        ctx.moveTo(x(0), meio);
        ctx.lineTo(x(v.subida), meio - h);
        ctx.lineTo(x(v.subida + v.plato), meio - h);
        ctx.lineTo(x(v.subida + v.plato + v.descida), meio);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        for (let px = x(0); px < x(ciclo); px += 3) {
            ctx.fillRect(px, meio - h, 1, h * 2);
        }
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(x(0), meio);
        ctx.lineTo(x(v.subida), meio - h);
        ctx.lineTo(x(v.subida + v.plato), meio - h);
        ctx.lineTo(x(v.subida + v.plato + v.descida), meio);
        ctx.stroke();
        ctx.globalAlpha = 1;

        const ligadoCiclo = v.subida + v.plato + v.descida;
        janela = "janela: 1 ciclo (" + formatar(ciclo) + " s)";
        descricao = "Ciclo de " + formatar(ciclo) + " s: subida " + formatar(v.subida) + " s, platô " + formatar(v.plato) +
            " s, descida " + formatar(v.descida) + " s e repouso " + formatar(v.repouso) + " s (ON " + formatar(ligadoCiclo) +
            " s; ciclo de trabalho " + formatar((ligadoCiclo / ciclo) * 100) + "%). Pulsos a " + formatar(v.frequencia) +
            " Hz com fase de " + formatar(v.largura) + " µs.";
    } else {
        // Pulsos bifásicos em uma janela de 100 ms (convencional) ou 1 s
        const duracaoJanela = modo === "convencional" ? 0.1 : 1;
        const instantes = [];

        if (modo === "burst") {
            for (let k = 0; k < v.rajadas * duracaoJanela; k++) {
                for (let j = 0; j < 7; j++) {
                    instantes.push(k / v.rajadas + 0.05 + j / v.frequencia);
                }
            }
        } else {
            for (let t = 0.004; t < duracaoJanela; t += 1 / v.frequencia) {
                instantes.push(t);
            }
        }

        const larguraPulso = Math.max(2, ((v.largura * 1e-6) / duracaoJanela) * larguraUtil);
        const h = amplitude || 0;

        ctx.beginPath();
        ctx.moveTo(margem, meio);
        for (const t of instantes) {
            const px = margem + (t / duracaoJanela) * larguraUtil;
            if (px + larguraPulso * 2 > largura - margem) {
                break;
            }
            ctx.lineTo(px, meio);
            ctx.lineTo(px, meio - h);
            ctx.lineTo(px + larguraPulso, meio - h);
            ctx.lineTo(px + larguraPulso, meio + h);
            ctx.lineTo(px + larguraPulso * 2, meio + h);
            ctx.lineTo(px + larguraPulso * 2, meio);
        }
        ctx.lineTo(largura - margem, meio);
        ctx.stroke();

        janela = "janela: " + (duracaoJanela === 1 ? "1 s" : "100 ms");

        if (modo === "burst") {
            descricao = formatar(v.rajadas) + " rajadas por segundo; dentro de cada rajada, pulsos bifásicos a " +
                formatar(v.frequencia) + " Hz com fase de " + formatar(v.largura) + " µs.";
        } else {
            descricao = "Pulsos bifásicos a " + formatar(v.frequencia) + " Hz (um pulso a cada " +
                formatar(1000 / v.frequencia) + " ms), com fase de " + formatar(v.largura) + " µs.";
        }
        descricao += " A largura do pulso foi ampliada no desenho para ficar visível.";
    }

    // Legendas
    ctx.fillStyle = corApagada;
    ctx.fillText(janela, margem, 14);
    ctx.textAlign = "right";
    ctx.fillText("Canal " + (estado.canalSelecionado + 1) + ": " + intensidade + " mA", largura - margem, 14);
    ctx.textAlign = "left";

    if (intensidade === 0) {
        descricao += " Canal " + (estado.canalSelecionado + 1) + " com intensidade zero: sem saída.";
    } else {
        descricao += " Canal " + (estado.canalSelecionado + 1) + ": " + intensidade + " mA.";
    }
    if (!estado.ligado) {
        descricao = "Aparelho desligado. " + descricao;
    }

    descricaoPulso.textContent = descricao;
}

new ResizeObserver(desenharPulso).observe(graficoPulso);

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

aoMudar(function (texto, tipo) {
    mostrarMensagem(texto, tipo);
    atualizarPainel();
});

botoesControle.forEach(function (botao) {
    botao.addEventListener("click", function () {
        selecionar(botao.dataset.parte);
    });
});

botaoEnergia.addEventListener("click", function () {
    acoes.energia();
});

botaoIniciar.addEventListener("click", function () {
    acoes.iniciarPausar();
});

botoesCanal.forEach(function (botao) {
    botao.addEventListener("click", function () {
        acoes.selecionarCanal(Number(botao.dataset.canal));
    });
});

botaoDiminuir.addEventListener("click", function () {
    acoes.ajustarIntensidade(-1);
});

botaoAumentar.addEventListener("click", function () {
    acoes.ajustarIntensidade(1);
});

botoesModo.forEach(function (botao) {
    botao.addEventListener("click", function () {
        botoesModo.forEach(function (outro) {
            outro.classList.remove("ativo");
        });
        botao.classList.add("ativo");
    });
});

// Botões TENS / FES do topo trocam o modo do aparelho
document.addEventListener("modalidade", function (evento) {
    definirModo(MODO_POR_MODALIDADE[evento.detail]);
    mensagem.textContent = "";
});

// Começa no modo da modalidade escolhida e com a intensidade selecionada
definirModo(MODO_POR_MODALIDADE[document.body.dataset.modalidade] || 0);
selecionar("intensidade", false);

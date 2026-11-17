
// Aplica as preferências de acessibilidade salvas em todas as telas.
// Este arquivo deve ser carregado no <head> para a página já abrir ajustada.

const CHAVE_ACESSIBILIDADE = "electrofisio-acessibilidade";

const ACESSIBILIDADE_PADRAO = {
    tamanhoTexto: "padrao", // padrao, grande ou muito-grande
    altoContraste: false,
    leitorTela: false,
    legendas: false
};

const TAMANHOS_TEXTO = ["padrao", "grande", "muito-grande"];

function lerAcessibilidade() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_ACESSIBILIDADE)) || {};

        // Versão anterior guardava só "textoGrande: true/false"
        if (!salvo.tamanhoTexto && salvo.textoGrande) {
            salvo.tamanhoTexto = "grande";
        }
        delete salvo.textoGrande;

        return Object.assign({}, ACESSIBILIDADE_PADRAO, salvo);
    } catch (erro) {
        return Object.assign({}, ACESSIBILIDADE_PADRAO);
    }
}

function salvarAcessibilidade(preferencias) {
    try {
        localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(preferencias));
        return true;
    } catch (erro) {
        return false;
    }
}

// Cada preferência vira uma classe no <html>, usada pelo css/acessibilidade.css
function aplicarAcessibilidade(preferencias) {
    const raiz = document.documentElement;

    TAMANHOS_TEXTO.forEach(function (tamanho) {
        raiz.classList.toggle("texto-" + tamanho, preferencias.tamanhoTexto === tamanho);
    });

    raiz.classList.toggle("alto-contraste", preferencias.altoContraste);
    raiz.classList.toggle("leitor-tela", preferencias.leitorTela);
    raiz.classList.toggle("legendas", preferencias.legendas);

    if (!preferencias.leitorTela && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    if (document.body) {
        mostrarLegendas(preferencias.legendas);
    }
}

// ---------------------------------------------------------------
// Leitura em voz alta (opção "Leitor de tela e áudio")
// ---------------------------------------------------------------

function leitorAtivo() {
    return document.documentElement.classList.contains("leitor-tela") && "speechSynthesis" in window;
}

// Também usada pelo simulador do aparelho para falar os avisos
function lerEmVozAlta(texto) {
    if (!leitorAtivo() || !texto) {
        return;
    }

    const fala = new SpeechSynthesisUtterance(texto.replace(/\s+/g, " ").trim());
    fala.lang = "pt-BR";
    fala.rate = 1.05;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
}

// Elementos que são lidos ao passar o mouse ou receber o foco
const ITENS_LEITURA = "h1, h2, h3, p, li, label, summary, figcaption, th, td, button, a, " +
    "input, select, textarea, [role='img'], [aria-label]";

function textoParaLer(elemento) {
    if (elemento.matches("input, select, textarea")) {
        const rotulo = elemento.labels && elemento.labels[0] ? elemento.labels[0].textContent : "";
        const valor = elemento.tagName === "SELECT" && elemento.selectedOptions[0]
            ? elemento.selectedOptions[0].textContent
            : elemento.value;
        return (elemento.getAttribute("aria-label") || rotulo || elemento.placeholder || "") +
            (valor ? ". " + valor : "");
    }

    return elemento.getAttribute("aria-label") || elemento.textContent;
}

let ultimoLido = null;
let esperaLeitura = null;

function lerElemento(evento) {
    if (!leitorAtivo() || !evento.target.closest) {
        return;
    }

    const elemento = evento.target.closest(ITENS_LEITURA);

    if (!elemento || elemento === ultimoLido) {
        return;
    }

    ultimoLido = elemento;
    clearTimeout(esperaLeitura);

    // Pequena espera para não ler tudo que o mouse atravessa
    esperaLeitura = setTimeout(function () {
        lerEmVozAlta(textoParaLer(elemento));
    }, evento.type === "focusin" ? 0 : 350);
}

document.addEventListener("mouseover", lerElemento);
document.addEventListener("focusin", lerElemento);

// ---------------------------------------------------------------
// Legendas (opção "Texto equivalente e legendas"):
// mostra em texto a descrição das imagens e dos modelos 3D
// ---------------------------------------------------------------

function mostrarLegendas(ativo) {
    document.querySelectorAll(".legenda-acessivel").forEach(function (legenda) {
        legenda.remove();
    });

    if (!ativo) {
        return;
    }

    document.querySelectorAll("[role='img'][aria-label]").forEach(function (imagem) {
        const legenda = document.createElement("p");
        legenda.className = "legenda-acessivel";
        legenda.textContent = imagem.getAttribute("aria-label");
        imagem.insertAdjacentElement("afterend", legenda);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    mostrarLegendas(lerAcessibilidade().legendas);
});

aplicarAcessibilidade(lerAcessibilidade());

// Ao voltar pelo navegador, a página pode vir da memória sem rodar
// este arquivo de novo: aplica as preferências outra vez.
window.addEventListener("pageshow", function () {
    aplicarAcessibilidade(lerAcessibilidade());
});

// Alterações feitas em outra aba
window.addEventListener("storage", function (evento) {
    if (evento.key === CHAVE_ACESSIBILIDADE) {
        aplicarAcessibilidade(lerAcessibilidade());
    }
});

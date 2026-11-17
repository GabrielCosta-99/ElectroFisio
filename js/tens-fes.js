
// Troca entre TENS e FES nas telas do módulo

const botoesModalidade = document.querySelectorAll(".botao-modalidade");
const conteudos = document.querySelectorAll("[data-conteudo]");
const linksModalidade = document.querySelectorAll(".link-modalidade");

function trocarModalidade(modalidade) {
    document.body.dataset.modalidade = modalidade;

    botoesModalidade.forEach(function (botao) {
        botao.classList.toggle("ativo", botao.dataset.modalidade === modalidade);
    });

    conteudos.forEach(function (conteudo) {
        conteudo.classList.toggle("escondido", conteudo.dataset.conteudo !== modalidade);
    });

    // Mantém a modalidade escolhida ao trocar de aba
    linksModalidade.forEach(function (link) {
        const endereco = link.getAttribute("href").split("?")[0];
        link.setAttribute("href", endereco + "?modalidade=" + modalidade);
    });

    // Avisa outras partes da página (ex.: modelo 3D)
    document.dispatchEvent(new CustomEvent("modalidade", { detail: modalidade }));
}

botoesModalidade.forEach(function (botao) {
    botao.addEventListener("click", function () {
        trocarModalidade(botao.dataset.modalidade);
        history.replaceState(null, "", "?modalidade=" + botao.dataset.modalidade);
    });
});

// Lê a modalidade da URL (visao-geral.html?modalidade=fes)
const parametros = new URLSearchParams(window.location.search);
const modalidadeInicial = parametros.get("modalidade") === "fes" ? "fes" : "tens";

trocarModalidade(modalidadeInicial);

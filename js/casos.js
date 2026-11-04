
// Tela de casos: responder e ver a resposta comentada de cada caso

const cardsCaso = document.querySelectorAll(".card-caso");

cardsCaso.forEach(function (card) {
    const botaoResponder = card.querySelector(".botao-responder");
    const botaoComentario = card.querySelector(".botao-comentario");
    const areaResposta = card.querySelector(".area-resposta");
    const campoResposta = areaResposta.querySelector("textarea");
    const retorno = areaResposta.querySelector(".retorno-resposta");
    const respostaComentada = card.querySelector(".resposta-comentada");

    // Abre ou fecha o campo de resposta
    botaoResponder.addEventListener("click", function () {
        const abrir = areaResposta.classList.contains("escondido");
        areaResposta.classList.toggle("escondido", !abrir);
        botaoResponder.textContent = abrir ? "Fechar resposta" : "Responder";

        if (abrir) {
            campoResposta.focus();
        }
    });

    // Mostra ou esconde a resposta comentada
    botaoComentario.addEventListener("click", function () {
        const mostrar = respostaComentada.classList.contains("escondido");
        respostaComentada.classList.toggle("escondido", !mostrar);
        botaoComentario.textContent = mostrar ? "Ocultar resposta comentada" : "Ver resposta comentada";
    });

    // A resposta ainda não é salva: só confirma e sugere comparar
    areaResposta.addEventListener("submit", function (evento) {
        evento.preventDefault();
        retorno.textContent = "Resposta registrada. Compare com a resposta comentada.";
        respostaComentada.classList.remove("escondido");
        botaoComentario.textContent = "Ocultar resposta comentada";
    });
});

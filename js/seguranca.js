
// Tela de segurança: contador da lista "Antes de começar a sessão"

const listas = document.querySelectorAll(".lista-conferencia");

listas.forEach(function (lista) {
    const caixas = lista.querySelectorAll("input[type=\"checkbox\"]");
    const progresso = lista.nextElementSibling;

    function atualizarProgresso() {
        const marcadas = lista.querySelectorAll("input:checked").length;

        if (marcadas === caixas.length) {
            progresso.textContent = caixas.length + " de " + caixas.length + " itens conferidos. A conferência não libera o tratamento: a decisão é do profissional.";
            progresso.classList.add("completo");
        } else {
            progresso.textContent = marcadas + " de " + caixas.length + " itens conferidos";
            progresso.classList.remove("completo");
        }
    }

    caixas.forEach(function (caixa) {
        caixa.addEventListener("change", atualizarProgresso);
    });

    atualizarProgresso();
});

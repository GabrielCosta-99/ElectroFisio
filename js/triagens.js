
// Tela de triagens feitas: escolher uma triagem e abrir na aba certa

document.addEventListener("DOMContentLoaded", () => {

    const itens = document.querySelectorAll(".item-triagem");
    const botaoAbrir = document.getElementById("botaoAbrir");
    const mensagem = document.getElementById("mensagemTriagens");

    let abaEscolhida = null;

    function escolher(item) {
        abaEscolhida = item.dataset.aba;

        itens.forEach(outro => {
            const selecionado = outro === item;
            outro.classList.toggle("selecionado", selecionado);
            outro.setAttribute("aria-pressed", String(selecionado));
        });

        botaoAbrir.disabled = false;
        mensagem.textContent = item.querySelector("span").textContent + " selecionado.";
    }

    function abrir() {
        if (abaEscolhida) {
            window.location.href = "triagem.html?aba=" + abaEscolhida;
        }
    }

    itens.forEach(item => {
        item.addEventListener("click", () => escolher(item));

        // Duplo clique já abre a triagem
        item.addEventListener("dblclick", () => {
            escolher(item);
            abrir();
        });
    });

    botaoAbrir.addEventListener("click", abrir);

});

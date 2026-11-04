
// Tela de sair: "Cancelar" volta para a tela anterior

const botaoCancelar = document.getElementById("botaoCancelar");

botaoCancelar.addEventListener("click", function (evento) {
    evento.preventDefault();

    if (history.length > 1) {
        history.back();
    } else {
        window.location.href = "inicio.html";
    }
});


document.addEventListener("DOMContentLoaded", () => {

    const botoes = document.querySelectorAll(".botao-perfil");

    const camposProfissional = document.getElementById("camposProfissional");
    const camposEstudante = document.getElementById("camposEstudante");

    const tipoPerfil = document.getElementById("tipoPerfil");
    const formulario = document.getElementById("formularioCadastro");

    function selecionarPerfil(perfil) {

        tipoPerfil.value = perfil;

        botoes.forEach(botao => {
            const selecionado = botao.dataset.perfil === perfil;

            botao.classList.toggle("selecionado", selecionado);
            botao.setAttribute("aria-pressed", String(selecionado));
        });

        camposProfissional.hidden = perfil !== "profissional";
        camposEstudante.hidden = perfil !== "estudante";

        camposProfissional.querySelectorAll("input").forEach(input => {
            input.disabled = perfil !== "profissional";
        });

        camposEstudante.querySelectorAll("input").forEach(input => {
            input.disabled = perfil !== "estudante";
        });
    }

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarPerfil(botao.dataset.perfil);
        });
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        if (!tipoPerfil.value) {
            alert("Selecione Profissional ou Estudante.");
            return;
        }

        // O cadastro ainda não é salvo: por enquanto é só uma etapa de acesso.
        // Guarda apenas o tipo de perfil e segue para o sistema.
        try {
            localStorage.setItem("electrofisio-perfil", tipoPerfil.value);
        } catch (erro) {
            // Sem armazenamento disponível: segue mesmo assim
        }

        window.location.href = "carregamento.html";
    });

});

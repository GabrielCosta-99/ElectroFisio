
document.addEventListener("DOMContentLoaded", () => {

    const seletor = document.getElementById("tipoPerfilTeste");

    const profissionais = document.getElementById("dadosProfissionais");
    const academicos = document.getElementById("dadosAcademicos");

    const tipoResumo = document.getElementById("tipoResumo");
    const nomeResumo = document.getElementById("nomeResumo");
    const nomePerfil = document.getElementById("nomePerfil");

    const formulario = document.getElementById("formularioPerfil");
    const botaoCancelar = document.getElementById("botaoCancelar");

    const linkDadosEspecificos = document.querySelector(
        '.perfil-menu a[href="#dadosEspecificos"]'
    );

    function atualizarPerfil(tipo) {

        const profissional = tipo === "profissional";

        profissionais.hidden = !profissional;
        academicos.hidden = profissional;

        profissionais.querySelectorAll("input").forEach(input => {
            input.disabled = !profissional;
        });

        academicos.querySelectorAll("input").forEach(input => {
            input.disabled = profissional;
        });

        tipoResumo.textContent = profissional
            ? "Profissional"
            : "Estudante";

        linkDadosEspecificos.textContent = profissional
            ? "Dados profissionais"
            : "Dados acadêmicos";

        linkDadosEspecificos.href = profissional
            ? "#dadosProfissionais"
            : "#dadosAcademicos";
    }

    seletor.addEventListener("change", () => {
        atualizarPerfil(seletor.value);
    });

    nomePerfil.addEventListener("input", () => {
        nomeResumo.textContent =
            nomePerfil.value.trim() || "Nome do usuário";
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        alert(
            "Perfil demonstrativo. O salvamento será implementado posteriormente."
        );
    });

    botaoCancelar.addEventListener("click", () => {
        formulario.reset();

        nomeResumo.textContent = "Nome do usuário";
        atualizarPerfil(seletor.value);
    });

    atualizarPerfil(seletor.value);

});

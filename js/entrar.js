
// Tela de login (entrar.html)
// Por enquanto o login é só uma etapa de acesso: não confere usuário nem senha.

document.addEventListener("DOMContentLoaded", () => {

    const botoes = document.querySelectorAll(".botao-perfil");
    const instrucao = document.getElementById("instrucaoEntrar");
    const campoUsuario = document.getElementById("campoUsuario");
    const formulario = document.getElementById("formularioEntrar");

    // Texto do campo de usuário em cada perfil
    const textos = {
        profissional: {
            instrucao: "Acesse sua conta com CREFITO e senha",
            campo: "CREFITO"
        },
        estudante: {
            instrucao: "Acesse sua conta com RA e senha",
            campo: "Registro acadêmico (RA)"
        }
    };

    let perfilSelecionado = "profissional";

    function selecionarPerfil(perfil) {

        perfilSelecionado = perfil;

        botoes.forEach(botao => {
            const selecionado = botao.dataset.perfil === perfil;

            botao.classList.toggle("selecionado", selecionado);
            botao.setAttribute("aria-pressed", String(selecionado));
        });

        instrucao.textContent = textos[perfil].instrucao;
        campoUsuario.placeholder = textos[perfil].campo;
        campoUsuario.setAttribute("aria-label", textos[perfil].campo);
    }

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarPerfil(botao.dataset.perfil);
        });
    });

    // O navegador só chega aqui com os campos preenchidos (required).
    // Guarda apenas o tipo de perfil, nunca a senha.
    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        try {
            localStorage.setItem("electrofisio-perfil", perfilSelecionado);
        } catch (erro) {
            // Sem armazenamento disponível: segue mesmo assim
        }

        window.location.href = "carregamento.html";
    });

    selecionarPerfil(perfilSelecionado);

});

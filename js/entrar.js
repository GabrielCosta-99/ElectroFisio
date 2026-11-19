import {
    db,
    collection,
    getDocs,
    query,
    where
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {

    const botoes = document.querySelectorAll(".botao-perfil");
    const instrucao = document.getElementById("instrucaoEntrar");
    const campoUsuario = document.getElementById("campoUsuario");
    const formulario = document.getElementById("formularioEntrar");
    const botaoEntrar = formulario.querySelector(".botao-cadastrar");

    // Texto do campo de usuário em cada perfil
    const textos = {
        profissional: {
            instrucao: "Acesse sua conta com CREFITO e senha",
            campo: "CREFITO",
            nomeInput: "crefito",
            erroCredencial: "CREFITO ou senha inválidos."
        },
        estudante: {
            instrucao: "Acesse sua conta com RA e senha",
            campo: "Registro acadêmico (RA)",
            nomeInput: "ra",
            erroCredencial: "RA ou senha inválidos."
        }
    };

    let perfilSelecionado = "profissional";

    // Mensagem de aviso/erro abaixo do link "Esqueceu sua senha?"
    const linkEsqueci = document.querySelector(".link-esqueci-senha");
    const avisoSenha = document.createElement("p");
    avisoSenha.className = "aviso-senha";
    avisoSenha.setAttribute("role", "status");
    linkEsqueci.insertAdjacentElement("afterend", avisoSenha);

    function selecionarPerfil(perfil) {

        perfilSelecionado = perfil;

        botoes.forEach(botao => {
            const selecionado = botao.dataset.perfil === perfil;

            botao.classList.toggle("selecionado", selecionado);
            botao.setAttribute("aria-pressed", String(selecionado));
        });

        instrucao.textContent = textos[perfil].instrucao;
        campoUsuario.placeholder = textos[perfil].campo;
        campoUsuario.name = textos[perfil].nomeInput;
        campoUsuario.setAttribute("aria-label", textos[perfil].campo);
        avisoSenha.textContent = "";
    }

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            selecionarPerfil(botao.dataset.perfil);
        });
    });

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const identificadorDigitado = String(campoUsuario.value || "").trim();
        const identificadorNormalizado = identificadorDigitado.toUpperCase();
        const senhaDigitada = String(formulario.elements.senha.value || "");

        if (!identificadorDigitado || !senhaDigitada) {
            avisoSenha.textContent = "Preencha todos os campos para entrar.";
            return;
        }

        const textoOriginal = botaoEntrar.textContent;
        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Entrando...";
        avisoSenha.textContent = "";

        try {
            const qPerfil = query(
                collection(db, "usuarios"),
                where("tipoPerfil", "==", perfilSelecionado)
            );
            const snapshot = await getDocs(qPerfil);

            let usuarioEncontrado = null;

            snapshot.forEach(docSnap => {
                if (usuarioEncontrado) return;
                const dados = docSnap.data();

                const chaveBanco = perfilSelecionado === "profissional"
                    ? String(dados.crefitoNormalizado || dados.crefito || "").trim().toUpperCase()
                    : String(dados.raNormalizado || dados.ra || "").trim().toUpperCase();

                if (chaveBanco === identificadorNormalizado && String(dados.senha || "") === senhaDigitada) {
                    const { senha, ...dadosSemSenha } = dados;
                    usuarioEncontrado = {
                        id: docSnap.id,
                        ...dadosSemSenha
                    };
                }
            });

            if (!usuarioEncontrado) {
                avisoSenha.textContent = textos[perfilSelecionado].erroCredencial;
                return;
            }

            try {
                localStorage.setItem("electrofisio-perfil", perfilSelecionado);
                localStorage.setItem("electrofisio-usuario", JSON.stringify(usuarioEncontrado));

                const salvosPerfil = JSON.parse(localStorage.getItem("electrofisio-dados-perfil")) || {};
                salvosPerfil[perfilSelecionado] = usuarioEncontrado;
                localStorage.setItem("electrofisio-dados-perfil", JSON.stringify(salvosPerfil));
            } catch (erro) {
                // Sem armazenamento disponível: segue mesmo assim
            }

            window.location.href = "carregamento.html";

        } catch (erro) {
            console.error("Erro ao autenticar no Firebase:", erro);
            avisoSenha.textContent = "Erro ao conectar com o servidor. Tente novamente.";
        } finally {
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = textoOriginal;
        }
    });

    linkEsqueci.addEventListener("click", evento => {
        evento.preventDefault();
        avisoSenha.textContent = "A recuperação de senha estará disponível em uma próxima versão. "
            + "Por enquanto, procure o responsável pelo sistema.";
    });

    selecionarPerfil(perfilSelecionado);

});
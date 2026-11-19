import {
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {

    const botoes = document.querySelectorAll(".botao-perfil");

    const camposProfissional = document.getElementById("camposProfissional");
    const camposEstudante = document.getElementById("camposEstudante");

    const tipoPerfil = document.getElementById("tipoPerfil");
    const formulario = document.getElementById("formularioCadastro");
    const botaoCadastrar = formulario.querySelector(".botao-cadastrar");

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

    // CPF, telefone e e-mail: máscara e mensagem de erro
    Validacao.protegerFormulario(formulario);

    // Consulta genérica para impedir duplicidade no Firestore
    async function jaExisteNoBanco(colecao, campo, valor) {
        const q = query(
            collection(db, colecao),
            where(campo, "==", valor)
        );
        const resultado = await getDocs(q);
        return !resultado.empty;
    }

    formulario.addEventListener("submit", async evento => {
        const bloqueadoPelaValidacao = evento.defaultPrevented;
        evento.preventDefault();

        if (bloqueadoPelaValidacao) {
            return;
        }

        if (!tipoPerfil.value) {
            alert("Selecione Profissional ou Estudante.");
            return;
        }

        const formData = new FormData(formulario);
        const perfil = tipoPerfil.value;

        const nome = String(formData.get("nome") || "").trim();
        const cpfFormatado = String(formData.get("cpf") || "").trim();
        const cpfNumeros = cpfFormatado.replace(/\D/g, "");
        const nascimento = String(formData.get("nascimento") || "").trim();
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const telefone = String(formData.get("telefone") || "").trim();
        const senha = String(formData.get("senha") || "");

        const textoOriginalBotao = botaoCadastrar.textContent;
        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = "Cadastrando...";

        try {
            // 1. Verifica unicidade do CPF em todo o sistema
            const cpfDuplicado = await jaExisteNoBanco("usuarios", "cpfNumeros", cpfNumeros);
            if (cpfDuplicado) {
                alert("Este CPF já está cadastrado no sistema.");
                return;
            }

            // Objeto base com todas as informações comuns
            const dadosUsuario = {
                tipoPerfil: perfil,
                nome,
                cpf: cpfFormatado,
                cpfNumeros,
                nascimento,
                email,
                telefone,
                senha,
                criadoEm: serverTimestamp()
            };

            // 2. Validação e campos específicos por perfil
            if (perfil === "profissional") {
                const crefito = String(formData.get("crefito") || "").trim();
                const crefitoNormalizado = crefito.toUpperCase();
                const regiao = String(formData.get("regiao") || "").trim();
                const especialidade = String(formData.get("especialidade") || "").trim();
                const vinculo = String(formData.get("vinculo") || "").trim();

                const crefitoDuplicado = await jaExisteNoBanco(
                    "usuarios",
                    "crefitoNormalizado",
                    crefitoNormalizado
                );

                if (crefitoDuplicado) {
                    alert("Este CREFITO já está cadastrado para outro profissional.");
                    return;
                }

                dadosUsuario.crefito = crefito;
                dadosUsuario.crefitoNormalizado = crefitoNormalizado;
                dadosUsuario.regiao = regiao;
                dadosUsuario.especialidade = especialidade;
                dadosUsuario.vinculo = vinculo;

            } else if (perfil === "estudante") {
                const ra = String(formData.get("ra") || "").trim();
                const raNormalizado = ra.toUpperCase();
                const curso = String(formData.get("curso") || "").trim();
                const instituicao = String(formData.get("instituicao") || "").trim();
                const semestre = String(formData.get("semestre") || "").trim();

                const raDuplicado = await jaExisteNoBanco(
                    "usuarios",
                    "raNormalizado",
                    raNormalizado
                );

                if (raDuplicado) {
                    alert("Este RA já está cadastrado para outro estudante.");
                    return;
                }

                dadosUsuario.ra = ra;
                dadosUsuario.raNormalizado = raNormalizado;
                dadosUsuario.curso = curso;
                dadosUsuario.instituicao = instituicao;
                dadosUsuario.semestre = semestre;
            }

            // 3. Salva o cadastro completo no Firestore
            const docRef = await addDoc(collection(db, "usuarios"), dadosUsuario);

            // 4. Mantém o fluxo atual de sessão e redirecionamento por perfil
            try {
                localStorage.setItem("electrofisio-perfil", perfil);
                localStorage.setItem("electrofisio-usuario", JSON.stringify({
                    id: docRef.id,
                    tipoPerfil: perfil,
                    nome,
                    cpf: cpfFormatado,
                    email,
                    crefito: dadosUsuario.crefito || null,
                    ra: dadosUsuario.ra || null
                }));
            } catch (erro) {
                // Sem armazenamento disponível: segue mesmo assim
            }

            window.location.href = "carregamento.html";

        } catch (erro) {
            console.error("Erro ao cadastrar no Firebase:", erro);
            alert("Ocorreu um erro ao salvar o cadastro. Verifique sua conexão e tente novamente.");
        } finally {
            botaoCadastrar.disabled = false;
            botaoCadastrar.textContent = textoOriginalBotao;
        }
    });

});

// Tela Meu perfil: mostra os dados do usuário que entrou
// Ainda não há banco de dados: os dados ficam salvos só neste navegador.

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE_DADOS = "electrofisio-dados-perfil";

    // Perfis de teste para a apresentação (usados enquanto nada for salvo)
    const PERFIS_TESTE = {
        profissional: {
            nome: "Ana Souza",
            cpf: "123.456.789-09",
            nascimento: "1990-03-15",
            email: "ana.souza@exemplo.com",
            telefone: "(31) 98765-4321",
            crefito: "123456-F",
            regiao: "CREFITO-4 (MG)",
            especialidade: "Fisioterapia neurofuncional",
            vinculo: "Clínica-escola"
        },
        estudante: {
            nome: "João Pereira",
            cpf: "987.654.321-00",
            nascimento: "2003-08-21",
            email: "joao.pereira@exemplo.com",
            telefone: "(31) 99876-5432",
            instituicao: "Centro Universitário de Belo Horizonte",
            curso: "Fisioterapia",
            semestre: "6º período"
        }
    };

    const seletor = document.getElementById("tipoPerfilTeste");

    const profissionais = document.getElementById("dadosProfissionais");
    const academicos = document.getElementById("dadosAcademicos");

    const tipoResumo = document.getElementById("tipoResumo");
    const nomeResumo = document.getElementById("nomeResumo");
    const nomePerfil = document.getElementById("nomePerfil");

    const formulario = document.getElementById("formularioPerfil");
    const botaoCancelar = document.getElementById("botaoCancelar");
    const botaoVoltar = document.getElementById("botaoVoltar");

    const linkDadosEspecificos = document.querySelector(
        '.perfil-menu a[href="#dadosEspecificos"]'
    );

    // Mensagem abaixo dos botões do formulário
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-perfil";
    mensagem.setAttribute("role", "status");
    formulario.appendChild(mensagem);

    // CPF, telefone e e-mail: máscara e mensagem de erro
    Validacao.protegerFormulario(formulario);

    function lerSalvos() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_DADOS)) || {};
        } catch (erro) {
            return {};
        }
    }

    function preencher(tipo) {
        const dados = Object.assign({}, PERFIS_TESTE[tipo], lerSalvos()[tipo]);

        Object.keys(dados).forEach(campo => {
            const input = formulario.elements[campo];
            if (input) {
                input.value = dados[campo];
            }
        });

        nomeResumo.textContent = dados.nome || "Nome do usuário";
    }

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

        preencher(tipo);
    }

    seletor.addEventListener("change", () => {
        mensagem.textContent = "";
        atualizarPerfil(seletor.value);
    });

    nomePerfil.addEventListener("input", () => {
        nomeResumo.textContent =
            nomePerfil.value.trim() || "Nome do usuário";
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const salvos = lerSalvos();
        const dados = {};

        Array.from(formulario.elements).forEach(input => {
            if (input.name && !input.disabled) {
                dados[input.name] = input.value.trim();
            }
        });

        salvos[seletor.value] = dados;

        try {
            localStorage.setItem(CHAVE_DADOS, JSON.stringify(salvos));
            mensagem.textContent = "Perfil salvo neste navegador.";
        } catch (erro) {
            mensagem.textContent = "Não foi possível salvar neste navegador.";
        }
    });

    botaoCancelar.addEventListener("click", () => {
        mensagem.textContent = "Alterações descartadas.";
        atualizarPerfil(seletor.value);
    });

    // Voltar para a tela anterior (ou para o início do perfil)
    botaoVoltar.addEventListener("click", evento => {
        evento.preventDefault();

        if (document.referrer && history.length > 1) {
            history.back();
        } else {
            window.location.href = seletor.value === "estudante"
                ? "inicio.html"
                : "inicio-profissional.html";
        }
    });

    // Abre no perfil que entrou no login
    try {
        seletor.value = localStorage.getItem("electrofisio-perfil") === "estudante"
            ? "estudante"
            : "profissional";
    } catch (erro) {
        // Sem armazenamento: fica como profissional
    }

    atualizarPerfil(seletor.value);

});

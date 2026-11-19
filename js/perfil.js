import {
    db,
    collection,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {

    const CHAVE_DADOS = "electrofisio-dados-perfil";
    const CHAVE_USUARIO = "electrofisio-usuario";

    // Fallback caso ninguém esteja logado
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
    const botaoSalvar = formulario.querySelector(".botao-perfil-salvar");
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

    let usuarioLogado = null;
    try {
        usuarioLogado = JSON.parse(localStorage.getItem(CHAVE_USUARIO)) || null;
    } catch (erro) {
        usuarioLogado = null;
    }

    function lerSalvos() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_DADOS)) || {};
        } catch (erro) {
            return {};
        }
    }

    function preencher(tipo) {
        const ehPerfilReal = usuarioLogado && (usuarioLogado.tipoPerfil || "profissional") === tipo;
        const dados = ehPerfilReal
            ? Object.assign({}, usuarioLogado)
            : Object.assign({}, PERFIS_TESTE[tipo], lerSalvos()[tipo]);

        Object.keys(dados).forEach(campo => {
            const input = formulario.elements[campo];
            if (input && dados[campo] !== null && dados[campo] !== undefined) {
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

    formulario.addEventListener("submit", async evento => {
        const bloqueadoPelaValidacao = evento.defaultPrevented;
        evento.preventDefault();

        if (bloqueadoPelaValidacao) {
            return;
        }

        const tipoAtual = seletor.value;
        const dados = {};

        Array.from(formulario.elements).forEach(input => {
            if (input.name && !input.disabled) {
                dados[input.name] = input.value.trim();
            }
        });

        const textoOriginal = botaoSalvar.textContent;
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";
        mensagem.textContent = "";

        try {
            // Se há usuário autenticado no Firestore, atualiza o registro no banco
            if (usuarioLogado && usuarioLogado.id) {
                const atualizacaoBanco = {
                    ...dados,
                    updatedAt: serverTimestamp()
                };

                if (dados.cpf) {
                    atualizacaoBanco.cpfNumeros = dados.cpf.replace(/\D/g, "");
                }
                if (tipoAtual === "profissional" && dados.crefito) {
                    atualizacaoBanco.crefitoNormalizado = dados.crefito.toUpperCase();
                }

                await updateDoc(doc(db, "usuarios", usuarioLogado.id), atualizacaoBanco);

                usuarioLogado = {
                    ...usuarioLogado,
                    ...dados,
                    tipoPerfil: tipoAtual
                };

                try {
                    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioLogado));
                    localStorage.setItem("electrofisio-perfil", tipoAtual);
                } catch (erro) {
                    // Ignora se localStorage estiver bloqueado
                }
            }

            const salvos = lerSalvos();
            salvos[tipoAtual] = dados;
            try {
                localStorage.setItem(CHAVE_DADOS, JSON.stringify(salvos));
            } catch (erro) {
                // Ignora se localStorage estiver bloqueado
            }

            nomeResumo.textContent = dados.nome || "Nome do usuário";
            mensagem.textContent = "Alterações salvas com sucesso.";

        } catch (erro) {
            console.error("Erro ao atualizar perfil no Firebase:", erro);
            mensagem.textContent = "Erro ao salvar alterações no banco de dados.";
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = textoOriginal;
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

    // Define o perfil inicial a partir do usuário logado
    if (usuarioLogado && usuarioLogado.tipoPerfil) {
        seletor.value = usuarioLogado.tipoPerfil === "estudante" ? "estudante" : "profissional";
    } else {
        try {
            seletor.value = localStorage.getItem("electrofisio-perfil") === "estudante"
                ? "estudante"
                : "profissional";
        } catch (erro) {
            // Sem armazenamento: fica como profissional
        }
    }

    atualizarPerfil(seletor.value);

    // Sincroniza todos os campos do usuário logado direto do Firestore
    if (usuarioLogado) {
        try {
            const snapUsuarios = await getDocs(collection(db, "usuarios"));
            let dadosCompletos = null;

            snapUsuarios.forEach(docSnap => {
                if (dadosCompletos) return;
                const d = docSnap.data();

                const mesmoId = usuarioLogado.id && docSnap.id === usuarioLogado.id;
                const mesmoCpf = usuarioLogado.cpf && d.cpf === usuarioLogado.cpf;
                const mesmoCrefito = usuarioLogado.crefito && d.crefito === usuarioLogado.crefito;
                const mesmoRa = usuarioLogado.ra && d.ra === usuarioLogado.ra;

                if (mesmoId || mesmoCpf || mesmoCrefito || mesmoRa) {
                    const { senha, ...semSenha } = d;
                    dadosCompletos = { id: docSnap.id, ...semSenha };
                }
            });

            if (dadosCompletos) {
                usuarioLogado = dadosCompletos;
                try {
                    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioLogado));
                } catch (erro) {
                    // Ignora se localStorage estiver bloqueado
                }
                seletor.value = usuarioLogado.tipoPerfil === "estudante" ? "estudante" : "profissional";
                atualizarPerfil(seletor.value);
            }
        } catch (erro) {
            console.error("Erro ao sincronizar dados do perfil com o Firebase:", erro);
        }
    }

});
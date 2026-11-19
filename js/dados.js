import {
    db,
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    serverTimestamp
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {

    const DIAS_SEMANA = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"
    ];

    const botaoEditar = document.getElementById("botaoEditar");
    const botaoSalvar = document.getElementById("botaoSalvar");
    const valores = document.querySelectorAll(".lista-dados .dado-item p");
    const containerPacienteDados = document.querySelector(".paciente-dados");
    const topoProfissional = document.querySelector(".profissional-info");
    const listaAtendimentos = document.querySelector(".lista-atendimentos");

    // Mensagem abaixo do cabeçalho do quadro
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-dados";
    mensagem.setAttribute("role", "status");
    document.querySelector(".dados-cabecalho").insertAdjacentElement("afterend", mensagem);

    let pacienteAtual = null;
    let pacienteDocId = null;

    // Utilitários
    function somenteNumeros(texto) {
        return String(texto || "").replace(/\D/g, "").slice(0, 11);
    }

    function formatarCpf(numeros) {
        const limpo = somenteNumeros(numeros);
        if (limpo.length !== 11) return numeros || "—";
        return limpo
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function formatarDataBr(data) {
        if (!data) return "—";
        if (data.includes("/")) return data;
        const partes = data.split("-");
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return data;
    }

    function converterDataParaIso(dataBr) {
        const limpo = String(dataBr || "").trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return limpo;
        const match = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) return null;

        const dia = Number(match[1]);
        const mes = Number(match[2]);
        const ano = Number(match[3]);
        const dt = new Date(ano, mes - 1, dia);

        if (
            dt.getFullYear() !== ano ||
            dt.getMonth() !== mes - 1 ||
            dt.getDate() !== dia
        ) {
            return null;
        }
        return `${match[3]}-${match[2]}-${match[1]}`;
    }

    function obterDiaSemanaPorDataBr(dataBr, fallbackMs) {
        const match = String(dataBr || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
            const dt = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
            if (!Number.isNaN(dt.getTime())) {
                return DIAS_SEMANA[dt.getDay()];
            }
        }
        if (fallbackMs) {
            const dt = new Date(fallbackMs);
            if (!Number.isNaN(dt.getTime())) {
                return DIAS_SEMANA[dt.getDay()];
            }
        }
        return "";
    }

    function extrairDiaDataHora(sessao) {
        let data = "";
        let hora = "";

        if (sessao.dataSessao && sessao.horaSessao) {
            data = sessao.dataSessao;
            hora = sessao.horaSessao.slice(0, 5);
        } else if (sessao.salvaEm && sessao.salvaEm.includes(",")) {
            const [d, h] = sessao.salvaEm.split(",");
            data = d.trim();
            hora = h.trim().slice(0, 5);
        } else if (sessao.criadoEmMs) {
            const dt = new Date(sessao.criadoEmMs);
            data = dt.toLocaleDateString("pt-BR");
            hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        }

        const diaSemana = obterDiaSemanaPorDataBr(data, sessao.criadoEmMs);
        return {
            diaSemana,
            data: data || "—",
            hora: hora || "—"
        };
    }

    function obterUsuarioLogado() {
        try {
            return JSON.parse(localStorage.getItem("electrofisio-usuario")) || null;
        } catch (erro) {
            return null;
        }
    }

    // Atualiza o topo com o profissional logado
    const usuarioLogado = obterUsuarioLogado();
    if (topoProfissional && usuarioLogado) {
        const spans = topoProfissional.querySelectorAll("span");
        if (spans[0] && usuarioLogado.nome) {
            spans[0].textContent = usuarioLogado.nome;
        }
        if (spans[1]) {
            spans[1].textContent = usuarioLogado.crefito
                ? "CREFITO: " + usuarioLogado.crefito
                : (usuarioLogado.ra ? "RA: " + usuarioLogado.ra : "CREFITO: 000000");
        }
    }

    // Recupera o paciente selecionado
    function obterPacienteInicial() {
        const cpfUrl = somenteNumeros(new URLSearchParams(window.location.search).get("cpf"));
        let salvoLocal = null;

        try {
            salvoLocal = JSON.parse(localStorage.getItem("electrofisio-paciente-selecionado"));
        } catch (erro) {
            salvoLocal = null;
        }

        if (cpfUrl.length === 11) {
            if (salvoLocal && somenteNumeros(salvoLocal.cpfNumeros || salvoLocal.cpf) === cpfUrl) {
                return salvoLocal;
            }
            return { cpfNumeros: cpfUrl, cpf: formatarCpf(cpfUrl) };
        }

        if (salvoLocal) {
            const cpfSalvo = somenteNumeros(salvoLocal.cpfNumeros || salvoLocal.cpf);
            return { ...salvoLocal, cpfNumeros: cpfSalvo, cpf: formatarCpf(cpfSalvo) };
        }

        return null;
    }

    // Mantém o parâmetro ?cpf= nos links do menu lateral
    function atualizarLinksMenuLateral(cpfNumeros) {
        if (!cpfNumeros || cpfNumeros.length !== 11) return;
        document.querySelectorAll(".menu-prontuario a").forEach(link => {
            const url = new URL(link.getAttribute("href"), window.location.href);
            url.searchParams.set("cpf", cpfNumeros);
            link.setAttribute("href", url.pathname.split("/").pop() + url.search);
        });
    }

    // Coluna esquerda: Nome, CPF e Nome da mãe (igual às outras páginas)
    function renderizarColunaEsquerda(paciente) {
        if (!containerPacienteDados) return;

        containerPacienteDados.replaceChildren();

        const pNome = document.createElement("p");
        pNome.className = "paciente-nome";
        pNome.textContent = (paciente && paciente.nome) ? paciente.nome : "Paciente não selecionado";

        const pCpf = document.createElement("p");
        const cpfTexto = paciente && (paciente.cpfNumeros || paciente.cpf)
            ? formatarCpf(paciente.cpfNumeros || paciente.cpf)
            : "—";
        pCpf.textContent = "CPF: " + cpfTexto;

        const pMae = document.createElement("p");
        pMae.textContent = "Mãe: " + ((paciente && paciente.mae) ? paciente.mae : "Não informada");

        containerPacienteDados.append(pNome, pCpf, pMae);
    }

    // Preenche os 8 campos do quadro central "Dados do paciente"
    function preencherQuadroDados(paciente) {
        const mapaPorRotulo = {
            "Nome completo": paciente?.nome || "—",
            "CPF": paciente?.cpfNumeros ? formatarCpf(paciente.cpfNumeros) : (paciente?.cpf || "—"),
            "Data de nascimento": formatarDataBr(paciente?.nascimento),
            "Endereço": paciente?.endereco || "—",
            "E-mail": paciente?.email || "—",
            "Telefone 1": paciente?.telefone1 || "—",
            "Telefone 2": paciente?.telefone2 || "—",
            "Nome da mãe": paciente?.mae || "—"
        };

        valores.forEach(valor => {
            const rotulo = valor.previousElementSibling ? valor.previousElementSibling.textContent.trim() : "";
            if (Object.prototype.hasOwnProperty.call(mapaPorRotulo, rotulo)) {
                valor.textContent = mapaPorRotulo[rotulo];
            }
        });
    }

    // Renderiza as últimas sessões com dia, data, hora e o que foi preenchido
    function renderizarUltimosAtendimentos(sessoes) {
        if (!listaAtendimentos) return;

        listaAtendimentos.replaceChildren();

        if (!sessoes || sessoes.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "mensagem-dados";
            vazio.textContent = "Nenhuma sessão registrada para este paciente até o momento.";
            listaAtendimentos.appendChild(vazio);
            return;
        }

        const ultimasSessoes = sessoes.slice(0, 5);

        ultimasSessoes.forEach((sessao, idx) => {
            const artigo = document.createElement("article");
            artigo.className = "atendimento-item";

            const icone = document.createElement("i");
            icone.setAttribute("data-lucide", "clipboard-list");

            const infoDiv = document.createElement("div");

            const num = sessao.numeroSessao || sessao.numeroTriagem || (sessoes.length - idx);
            const oQueFoiPreenchido = sessao.oQueFoiUsado || sessao.modalidadesUsadas || "Triagem inicial";

            const titulo = document.createElement("h3");
            titulo.textContent = `Sessão ${num} — ${oQueFoiPreenchido}`;

            const { diaSemana, data, hora } = extrairDiaDataHora(sessao);
            const prefixoDia = diaSemana ? `${diaSemana}, ` : "";

            const subtitulo = document.createElement("p");
            subtitulo.textContent = `${prefixoDia}${data} • ${hora}`;

            infoDiv.append(titulo, subtitulo);
            artigo.append(icone, infoDiv);
            listaAtendimentos.appendChild(artigo);
        });

        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    // Modo de edição ativado/desativado pelo ícone de lápis
    function modoEdicao(editando) {
        valores.forEach(valor => {
            valor.contentEditable = editando ? "true" : "false";
            valor.classList.toggle("editavel", editando);
            if (editando && valor.textContent.trim() === "—") {
                valor.textContent = "";
            }
        });

        botaoEditar.disabled = editando;
        botaoSalvar.disabled = !editando;
    }

    botaoEditar.addEventListener("click", () => {
        if (!pacienteAtual) {
            mensagem.textContent = "Selecione um paciente antes de editar.";
            return;
        }
        modoEdicao(true);
        mensagem.textContent = "Editando: clique em um dado para alterar e depois clique em Salvar.";
        if (valores[0]) valores[0].focus();
    });

    // Valida todos os campos editados antes de salvar no Firebase
    function conferirDados() {
        for (const valor of valores) {
            const rotulo = valor.previousElementSibling ? valor.previousElementSibling.textContent.trim() : "";
            const texto = valor.textContent.trim();
            let erro = "";

            if (rotulo === "Nome completo" && !texto) {
                erro = "Informe o nome completo do paciente.";
            } else if (rotulo === "CPF") {
                erro = Validacao.erroCpf(texto);
                if (!erro) valor.textContent = Validacao.formatarCpf(texto);
            } else if (rotulo === "Data de nascimento") {
                if (!texto || !converterDataParaIso(texto)) {
                    erro = "Informe uma data válida no formato DD/MM/AAAA.";
                }
            } else if (rotulo === "E-mail") {
                erro = Validacao.erroEmail(texto);
            } else if (rotulo.indexOf("Telefone") === 0 && texto) {
                erro = Validacao.erroTelefone(texto);
                if (!erro) valor.textContent = Validacao.formatarTelefone(texto);
            } else if (rotulo === "Nome da mãe" && !texto) {
                erro = "Informe o nome da mãe do paciente.";
            }

            valor.classList.toggle("campo-invalido", Boolean(erro));

            if (erro) {
                mensagem.textContent = rotulo + ": " + erro;
                valor.focus();
                return false;
            }
        }
        return true;
    }

    // Salva as alterações no Firebase Firestore
    botaoSalvar.addEventListener("click", async () => {
        if (!conferirDados()) {
            return;
        }

        const lidos = {};
        valores.forEach(valor => {
            const rotulo = valor.previousElementSibling ? valor.previousElementSibling.textContent.trim() : "";
            lidos[rotulo] = valor.textContent.trim();
        });

        const cpfNumeros = somenteNumeros(lidos["CPF"]);
        const cpfFormatado = formatarCpf(cpfNumeros);
        const nascimentoIso = converterDataParaIso(lidos["Data de nascimento"]) || "";

        const dadosAtualizados = {
            nome: lidos["Nome completo"],
            cpf: cpfFormatado,
            cpfNumeros,
            nascimento: nascimentoIso,
            endereco: lidos["Endereço"],
            email: lidos["E-mail"],
            telefone1: lidos["Telefone 1"],
            telefone2: lidos["Telefone 2"],
            mae: lidos["Nome da mãe"]
        };

        botaoSalvar.disabled = true;
        mensagem.textContent = "Salvando alterações no banco de dados...";

        try {
            if (pacienteDocId) {
                await updateDoc(doc(db, "pacientes", pacienteDocId), {
                    ...dadosAtualizados,
                    atualizadoEm: serverTimestamp()
                });
            } else {
                const novoDoc = await addDoc(collection(db, "pacientes"), {
                    ...dadosAtualizados,
                    profissionalId: usuarioLogado ? usuarioLogado.id : null,
                    profissionalCrefito: usuarioLogado ? usuarioLogado.crefito : null,
                    criadoEmMs: Date.now(),
                    criadoEm: serverTimestamp()
                });
                pacienteDocId = novoDoc.id;
            }

            pacienteAtual = {
                ...(pacienteAtual || {}),
                ...dadosAtualizados
            };

            try {
                localStorage.setItem("electrofisio-paciente-selecionado", JSON.stringify(pacienteAtual));
            } catch (erro) {
                // Segue mesmo sem localStorage
            }

            atualizarLinksMenuLateral(cpfNumeros);
            renderizarColunaEsquerda(pacienteAtual);
            preencherQuadroDados(pacienteAtual);
            modoEdicao(false);
            mensagem.textContent = "Dados do paciente salvos com sucesso.";

        } catch (erro) {
            console.error("Erro ao atualizar dados do paciente no Firebase:", erro);
            botaoSalvar.disabled = false;
            mensagem.textContent = "Erro ao salvar no Firebase. Verifique sua conexão e tente novamente.";
        }
    });

    // Enter confirma o campo em vez de quebrar a linha
    valores.forEach(valor => {
        valor.addEventListener("keydown", evento => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                valor.blur();
            }
        });
    });

    // Carrega dados do paciente e suas sessões do Firebase
    async function carregarTelaDados() {
        modoEdicao(false);

        let paciente = obterPacienteInicial();
        if (!paciente || !paciente.cpfNumeros) {
            renderizarColunaEsquerda(null);
            renderizarUltimosAtendimentos([]);
            botaoEditar.disabled = true;
            mensagem.textContent = "Nenhum paciente selecionado em Pacientes.";
            return;
        }

        const cpf = paciente.cpfNumeros;
        atualizarLinksMenuLateral(cpf);
        renderizarColunaEsquerda(paciente);
        mensagem.textContent = "Carregando dados do paciente...";

        try {
            // 1. Busca cadastro na coleção "pacientes"
            const qPaciente = query(
                collection(db, "pacientes"),
                where("cpfNumeros", "==", cpf)
            );
            const snapPaciente = await getDocs(qPaciente);
            if (!snapPaciente.empty) {
                pacienteDocId = snapPaciente.docs[0].id;
                paciente = {
                    ...paciente,
                    ...snapPaciente.docs[0].data(),
                    cpfNumeros: cpf
                };
            }

            // 2. Busca sessões na coleção "triagens"
            const qTriagens = query(
                collection(db, "triagens"),
                where("cpfNumeros", "==", cpf)
            );
            const snapTriagens = await getDocs(qTriagens);

            const sessoes = [];
            snapTriagens.forEach(docSnap => {
                sessoes.push({ id: docSnap.id, ...docSnap.data() });
            });

            sessoes.sort((a, b) => {
                const diffTempo = (b.criadoEmMs || 0) - (a.criadoEmMs || 0);
                if (diffTempo !== 0) return diffTempo;
                return (b.numeroSessao || 0) - (a.numeroSessao || 0);
            });

            // Complementa eventuais campos faltantes com a triagem mais recente
            if (sessoes.length > 0) {
                const dadosMaisRecentes = sessoes[0].dados || sessoes[0].respostas || {};
                paciente = {
                    ...dadosMaisRecentes,
                    ...paciente,
                    nome: paciente.nome || dadosMaisRecentes.nome || sessoes[0].pacienteNome,
                    mae: paciente.mae || dadosMaisRecentes.mae || "",
                    cpfNumeros: cpf,
                    cpf: formatarCpf(cpf)
                };
            }

            pacienteAtual = paciente;

            try {
                localStorage.setItem("electrofisio-paciente-selecionado", JSON.stringify(pacienteAtual));
            } catch (erro) {
                // Ignora se localStorage estiver bloqueado
            }

            renderizarColunaEsquerda(pacienteAtual);
            preencherQuadroDados(pacienteAtual);
            renderizarUltimosAtendimentos(sessoes);
            mensagem.textContent = "";

        } catch (erro) {
            console.error("Erro ao carregar dados do paciente no Firebase:", erro);
            mensagem.textContent = "Erro ao carregar os dados do paciente no banco de dados.";
        }
    }

    await carregarTelaDados();
});
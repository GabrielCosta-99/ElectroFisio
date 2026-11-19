// Partes comuns das telas do paciente e integração com Firebase na tela de Evolução (prontuario.html)

document.addEventListener("DOMContentLoaded", async () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    const pagina = window.location.pathname.split("/").pop();

    // Em triagens.html e dados.html, os scripts próprios (triagens.js e dados.js) gerenciam a página
    if (pagina === "triagens.html" || pagina === "dados.html") {
        return;
    }

    // Mantém os exemplos na tela de Receituário enquanto ela ainda não for conectada ao banco
    if (pagina === "receituario.html") {
        const textosReceituario = [
            "Orientação: exercícios de fortalecimento de quadríceps, 3 séries de 10, em dias alternados.",
            "Orientação: manter atividades com pausas e aplicar compressa fria por 15 minutos se houver dor.",
            "Orientação: caminhada leve de 20 minutos, 3 vezes por semana."
        ];

        document.querySelectorAll(".registro-item").forEach((registro, indice) => {
            const detalhe = document.createElement("p");
            detalhe.className = "registro-detalhe";
            detalhe.textContent = textosReceituario[indice % textosReceituario.length];
            detalhe.hidden = true;
            registro.appendChild(detalhe);

            registro.tabIndex = 0;
            registro.setAttribute("role", "button");
            registro.setAttribute("aria-expanded", "false");

            function alternar() {
                const abrir = detalhe.hidden;
                detalhe.hidden = !abrir;
                registro.classList.toggle("aberto", abrir);
                registro.setAttribute("aria-expanded", String(abrir));
            }

            registro.addEventListener("click", alternar);
            registro.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    alternar();
                }
            });
        });
        return;
    }

    // =========================================================================
    // TELA DE EVOLUÇÃO (prontuario.html) — CONECTADA AO FIREBASE FIRESTORE
    // =========================================================================
    if (pagina !== "prontuario.html") {
        return;
    }

    const firebase = await import("./firebase-config.js");
    const {
        db,
        collection,
        getDocs,
        addDoc,
        query,
        where,
        serverTimestamp
    } = firebase;

    const ROTULOS_DOR = {
        "0": "Sem dor",
        "1": "Leve",
        "2": "Moderada",
        "3": "Intensa",
        "4": "Muito intensa"
    };

    const formulario = document.getElementById("formularioAnamnese");
    const painelRegistros = document.querySelector(".prontuario-registros");
    const containerPacienteDados = document.querySelector(".paciente-dados");
    const topoProfissional = document.querySelector(".profissional-info");
    const containerAcoes = document.querySelector(".acoes-prontuario");

    const botaoNovo = containerAcoes?.querySelector('[data-acao="novo"]');
    const botaoSalvar = containerAcoes?.querySelector('[data-acao="salvar"]');
    const botaoAssinar = containerAcoes?.querySelector('[data-acao="assinar"]');
    const botaoCancelar = containerAcoes?.querySelector('[data-acao="cancelar"]');
    const botaoCopiar = containerAcoes?.querySelector('[data-acao="copiar"]');

    // Mensagem de status logo abaixo dos botões de ação
    const statusRegistro = document.createElement("p");
    statusRegistro.className = "status-registro";
    statusRegistro.setAttribute("role", "status");
    if (containerAcoes) {
        containerAcoes.insertAdjacentElement("afterend", statusRegistro);
    }

    let pacienteAtual = null;
    let sessoesEvolucao = [];
    let aguardandoCopia = false;
    let assinaturaProfissional = null;

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

    function extrairDataHora(sessao) {
        if (sessao.dataSessao && sessao.horaSessao) {
            return {
                data: sessao.dataSessao,
                hora: sessao.horaSessao.slice(0, 5)
            };
        }
        if (sessao.salvaEm && sessao.salvaEm.includes(",")) {
            const [d, h] = sessao.salvaEm.split(",");
            return {
                data: d.trim(),
                hora: h.trim().slice(0, 5)
            };
        }
        if (sessao.criadoEmMs) {
            const dt = new Date(sessao.criadoEmMs);
            return {
                data: dt.toLocaleDateString("pt-BR"),
                hora: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            };
        }
        return { data: "—", hora: "—" };
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

    // Coluna esquerda: Nome, CPF e Nome da mãe
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

    // Limpa todo o formulário da tela de Evolução
    function limparFormulario() {
        if (!formulario) return;
        formulario.reset();

        formulario.querySelectorAll("input, textarea").forEach(campo => {
            if (campo.type === "radio" || campo.type === "checkbox") {
                campo.checked = false;
            } else {
                campo.value = "";
            }
        });

        assinaturaProfissional = null;
    }

    // Controla o modo Copiar ("clicar em copiar na sequencia em alguma sessao")
    function definirModoCopia(ativo) {
        aguardandoCopia = Boolean(ativo);
        if (botaoCopiar) {
            botaoCopiar.classList.toggle("ativo", aguardandoCopia);
            botaoCopiar.setAttribute("aria-pressed", String(aguardandoCopia));
        }
        if (painelRegistros) {
            painelRegistros.classList.toggle("modo-copia", aguardandoCopia);
        }
    }

    // Preenche o formulário com os dados da sessão clicada
    function aplicarDadosSessaoNoFormulario(sessao) {
        if (!formulario || !sessao) return;

        limparFormulario();

        if (sessao.recurso) {
            const radioRecurso = formulario.querySelector(`input[name="recurso"][value="${sessao.recurso}"]`);
            if (radioRecurso) radioRecurso.checked = true;
        }

        if (formulario.elements.frequencia) {
            formulario.elements.frequencia.value = sessao.frequencia || "";
        }
        if (formulario.elements.larguraPulso) {
            formulario.elements.larguraPulso.value = sessao.larguraPulso || "";
        }
        if (formulario.elements.temposFes) {
            formulario.elements.temposFes.value = sessao.temposFes || "";
        }
        if (formulario.elements.tempoAplicacao) {
            formulario.elements.tempoAplicacao.value = sessao.tempoAplicacao || "";
        }

        if (sessao.dor !== undefined && sessao.dor !== null && sessao.dor !== "") {
            const radioDor = formulario.querySelector(`input[name="dor"][value="${sessao.dor}"]`);
            if (radioDor) radioDor.checked = true;
        }

        if (formulario.elements.observacoes) {
            formulario.elements.observacoes.value = sessao.observacoes || "";
        }
    }

    // Monta o texto resumo exibido no cartão da direita (ex: "Sessão 3: TENS (40 Hz, 150 µs, 30 min)...")
    function gerarTextoResumoSessao(sessao, numeroExibicao) {
        const num = sessao.numeroSessao || numeroExibicao;
        const partesParams = [];

        if (sessao.frequencia) partesParams.push(`${sessao.frequencia} Hz`);
        if (sessao.larguraPulso) partesParams.push(`${sessao.larguraPulso} µs`);
        if (sessao.temposFes) partesParams.push(`FES: ${sessao.temposFes}`);
        if (sessao.tempoAplicacao) partesParams.push(`${sessao.tempoAplicacao} min`);

        const recursoTexto = sessao.recurso ? sessao.recurso : "Conduta";
        const paramsTexto = partesParams.length > 0 ? ` (${partesParams.join(", ")})` : "";
        const dorTexto = ROTULOS_DOR[sessao.dor] ? ` Dor pós-sessão: ${ROTULOS_DOR[sessao.dor]}.` : "";
        const obsTexto = sessao.observacoes ? ` ${sessao.observacoes}` : "";

        return `Sessão ${num}: ${recursoTexto}${paramsTexto}.${dorTexto}${obsTexto}`.trim();
    }

    // Renderiza a lista exclusiva de registros de evolução na coluna da direita
    function renderizarRegistrosDireita(lista) {
        if (!painelRegistros) return;

        const titulo = painelRegistros.querySelector("h2") || document.createElement("h2");
        titulo.textContent = "Registros";
        painelRegistros.replaceChildren(titulo);

        if (!lista || lista.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "mensagem-triagens";
            vazio.textContent = "Nenhuma evolução registrada para este paciente.";
            painelRegistros.appendChild(vazio);
            return;
        }

        lista.forEach((sessao, idx) => {
            const num = sessao.numeroSessao || (lista.length - idx);
            const artigo = document.createElement("article");
            artigo.className = "registro-item";
            artigo.tabIndex = 0;
            artigo.setAttribute("role", "button");

            const pNome = document.createElement("p");
            pNome.className = "registro-nome";
            pNome.textContent = sessao.profissionalNome || (usuarioLogado && usuarioLogado.nome) || "Profissional";

            const pCrefito = document.createElement("p");
            const crefitoValor = sessao.profissionalCrefito || (usuarioLogado && usuarioLogado.crefito) || "Não informado";
            pCrefito.textContent = "CREFITO: " + crefitoValor;

            const { data, hora } = extrairDataHora(sessao);

            const pData = document.createElement("p");
            pData.textContent = "Data: " + data;

            const pHorario = document.createElement("p");
            pHorario.textContent = "Horário: " + hora;

            const pResumo = document.createElement("p");
            pResumo.className = "registro-detalhe";
            pResumo.textContent = sessao.resumoTexto || gerarTextoResumoSessao(sessao, num);

            artigo.append(pNome, pCrefito, pData, pHorario, pResumo);

            function acionarSessao() {
                // Se clicou em "Copiar" antes, copia imediatamente os dados desta sessão para o formulário
                if (aguardandoCopia) {
                    aplicarDadosSessaoNoFormulario(sessao);
                    definirModoCopia(false);
                    statusRegistro.textContent = `Informações da Sessão ${num} copiadas para o formulário.`;
                    if (formulario.elements.observacoes) {
                        formulario.elements.observacoes.focus();
                    }
                    return;
                }

                // Caso contrário, destaca a sessão clicada na direita
                painelRegistros.querySelectorAll(".registro-item").forEach(item => {
                    item.classList.toggle("aberto", item === artigo);
                });
                statusRegistro.textContent = `Sessão ${num} selecionada. Clique em Copiar e depois nela para reutilizar seus parâmetros.`;
            }

            artigo.addEventListener("click", acionarSessao);
            artigo.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    acionarSessao();
                }
            });

            painelRegistros.appendChild(artigo);
        });
    }

    // Botão Novo
    if (botaoNovo) {
        botaoNovo.addEventListener("click", () => {
            definirModoCopia(false);
            limparFormulario();
            statusRegistro.textContent = "Nova evolução iniciada.";
        });
    }

    // Botão Cancelar
    if (botaoCancelar) {
        botaoCancelar.addEventListener("click", () => {
            definirModoCopia(false);
            limparFormulario();
            statusRegistro.textContent = "Preenchimento cancelado.";
        });
    }

    // Botão Assinar
    if (botaoAssinar) {
        botaoAssinar.addEventListener("click", () => {
            const nomeProf = (usuarioLogado && usuarioLogado.nome) || "Profissional";
            const crefitoProf = (usuarioLogado && usuarioLogado.crefito) || "000000";
            assinaturaProfissional = `${nomeProf} (CREFITO: ${crefitoProf})`;
            statusRegistro.textContent = `Evolução assinada digitalmente por ${assinaturaProfissional}. Clique em Salvar para registrar.`;
        });
    }

    // Botão Copiar: ativa o modo cópia para clicar na sequência em alguma sessão à direita
    if (botaoCopiar) {
        botaoCopiar.addEventListener("click", () => {
            if (sessoesEvolucao.length === 0) {
                statusRegistro.textContent = "Não há sessões registradas para copiar.";
                return;
            }

            const proximoEstado = !aguardandoCopia;
            definirModoCopia(proximoEstado);

            if (proximoEstado) {
                statusRegistro.textContent = "Clique em uma das sessões registradas à direita para copiar suas informações.";
            } else {
                statusRegistro.textContent = "Modo cópia cancelado.";
            }
        });
    }

    // Botão Salvar: salva exclusivamente na coleção "evolucoes", atualiza a direita e limpa o formulário
    if (botaoSalvar) {
        botaoSalvar.addEventListener("click", async () => {
            if (!pacienteAtual || !pacienteAtual.cpfNumeros) {
                statusRegistro.textContent = "Nenhum paciente selecionado. Volte em Pacientes e selecione um cadastro.";
                return;
            }

            const formData = new FormData(formulario);
            const recurso = String(formData.get("recurso") || "").trim();
            const frequencia = String(formData.get("frequencia") || "").trim();
            const larguraPulso = String(formData.get("larguraPulso") || "").trim();
            const temposFes = String(formData.get("temposFes") || "").trim();
            const tempoAplicacao = String(formData.get("tempoAplicacao") || "").trim();
            const dor = String(formData.get("dor") || "").trim();
            const observacoes = String(formData.get("observacoes") || "").trim();

            if (!recurso && !frequencia && !larguraPulso && !temposFes && !tempoAplicacao && !dor && !observacoes) {
                statusRegistro.textContent = "Preencha a conduta ou as observações da sessão antes de salvar.";
                return;
            }

            definirModoCopia(false);
            botaoSalvar.disabled = true;
            statusRegistro.textContent = "Salvando evolução...";

            try {
                const cpfNumeros = pacienteAtual.cpfNumeros;

                // Calcula o número da sessão exclusivo desta tela (coleção "evolucoes") para este CPF
                const qExistentes = query(
                    collection(db, "evolucoes"),
                    where("cpfNumeros", "==", cpfNumeros)
                );
                const snapExistentes = await getDocs(qExistentes);

                let maiorSessaoAnterior = 0;
                snapExistentes.forEach(docSnap => {
                    const num = Number(docSnap.data().numeroSessao || 0);
                    if (num > maiorSessaoAnterior) {
                        maiorSessaoAnterior = num;
                    }
                });

                const numeroSessao = Math.max(maiorSessaoAnterior, snapExistentes.size) + 1;

                const agora = new Date();
                const dataSessao = agora.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });
                const horaSessao = agora.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
                const salvaEm = `${dataSessao}, ${horaSessao.slice(0, 5)}`;

                const novaEvolucao = {
                    numeroSessao,
                    cpfNumeros,
                    cpf: formatarCpf(cpfNumeros),
                    pacienteNome: pacienteAtual.nome || "Paciente",
                    profissionalId: usuarioLogado ? usuarioLogado.id : null,
                    profissionalNome: (usuarioLogado && usuarioLogado.nome) || "Profissional",
                    profissionalCrefito: (usuarioLogado && usuarioLogado.crefito) || "Não informado",
                    assinadoPor: assinaturaProfissional || null,
                    dataSessao,
                    horaSessao,
                    salvaEm,
                    criadoEmMs: agora.getTime(),
                    criadoEm: serverTimestamp(),
                    recurso,
                    frequencia,
                    larguraPulso,
                    temposFes,
                    tempoAplicacao,
                    dor,
                    observacoes
                };

                novaEvolucao.resumoTexto = gerarTextoResumoSessao(novaEvolucao, numeroSessao);

                const docRef = await addDoc(collection(db, "evolucoes"), novaEvolucao);
                novaEvolucao.id = docRef.id;

                // Adiciona no topo da lista da direita e renderiza
                sessoesEvolucao.unshift(novaEvolucao);
                renderizarRegistrosDireita(sessoesEvolucao);

                // Limpa a tela após salvar
                limparFormulario();

                statusRegistro.textContent =
                    `Sessão ${numeroSessao} salva em ${dataSessao} às ${horaSessao.slice(0, 5)}. Tela limpa para o próximo registro.`;

            } catch (erro) {
                console.error("Erro ao salvar evolução no Firebase:", erro);
                statusRegistro.textContent = "Erro ao salvar no Firebase. Verifique sua conexão e tente novamente.";
            } finally {
                botaoSalvar.disabled = false;
            }
        });
    }

    // Carrega dados do paciente na esquerda e histórico exclusivo da tela de Evolução na direita
    async function carregarTelaEvolucao() {
        let paciente = obterPacienteInicial();

        if (!paciente || !paciente.cpfNumeros) {
            renderizarColunaEsquerda(null);
            renderizarRegistrosDireita([]);
            statusRegistro.textContent = "Nenhum paciente selecionado em Pacientes.";
            return;
        }

        const cpf = paciente.cpfNumeros;
        atualizarLinksMenuLateral(cpf);
        renderizarColunaEsquerda(paciente);
        statusRegistro.textContent = "Carregando registros de evolução...";

        try {
            // 1. Busca o cadastro do paciente (Nome, CPF e Nome da mãe)
            const qPaciente = query(
                collection(db, "pacientes"),
                where("cpfNumeros", "==", cpf)
            );
            const snapPaciente = await getDocs(qPaciente);
            if (!snapPaciente.empty) {
                paciente = {
                    ...paciente,
                    ...snapPaciente.docs[0].data(),
                    cpfNumeros: cpf
                };
            }

            pacienteAtual = {
                ...paciente,
                cpfNumeros: cpf,
                cpf: formatarCpf(cpf)
            };

            try {
                localStorage.setItem("electrofisio-paciente-selecionado", JSON.stringify(pacienteAtual));
            } catch (erro) {
                // Ignora se localStorage estiver bloqueado
            }

            renderizarColunaEsquerda(pacienteAtual);

            // 2. Busca exclusivamente as evoluções salvas desta tela para este CPF
            const qEvolucoes = query(
                collection(db, "evolucoes"),
                where("cpfNumeros", "==", cpf)
            );
            const snapEvolucoes = await getDocs(qEvolucoes);

            const lista = [];
            snapEvolucoes.forEach(docSnap => {
                lista.push({ id: docSnap.id, ...docSnap.data() });
            });

            lista.sort((a, b) => {
                const diffTempo = (b.criadoEmMs || 0) - (a.criadoEmMs || 0);
                if (diffTempo !== 0) return diffTempo;
                return (b.numeroSessao || 0) - (a.numeroSessao || 0);
            });

            sessoesEvolucao = lista;
            renderizarRegistrosDireita(sessoesEvolucao);
            statusRegistro.textContent = "";

        } catch (erro) {
            console.error("Erro ao carregar evolução do Firebase:", erro);
            statusRegistro.textContent = "Erro ao carregar os registros do banco de dados.";
        }
    }

    await carregarTelaEvolucao();
});
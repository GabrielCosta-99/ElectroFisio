import {
    db,
    collection,
    getDocs,
    addDoc,
    query,
    where,
    serverTimestamp
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    const campoTexto = document.getElementById("textoReceituario");
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
    let receitasPaciente = [];
    let aguardandoCopia = false;
    let assinaturaProfissional = null;

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

    function formatarDataBr(dataStr) {
        if (!dataStr) return "—";
        if (String(dataStr).includes("/")) return dataStr;
        const partes = String(dataStr).split("-");
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataStr;
    }

    function calcularIdade(dataStr) {
        if (!dataStr) return "—";
        let dia, mes, ano;
        if (String(dataStr).includes("/")) {
            [dia, mes, ano] = String(dataStr).split("/").map(Number);
        } else if (String(dataStr).includes("-")) {
            [ano, mes, dia] = String(dataStr).split("-").map(Number);
        }
        if (!ano || !mes || !dia) return "—";

        const hoje = new Date();
        let idade = hoje.getFullYear() - ano;
        const jaFezAniversario =
            hoje.getMonth() + 1 > mes ||
            (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);

        if (!jaFezAniversario) idade--;
        return idade >= 0 ? `${idade} anos` : "—";
    }

    function extrairDataHora(registro) {
        if (registro.dataSessao && registro.horaSessao) {
            return {
                data: registro.dataSessao,
                hora: registro.horaSessao.slice(0, 5)
            };
        }

        if (registro.salvaEm && registro.salvaEm.includes(",")) {
            const [d, h] = registro.salvaEm.split(",");
            return {
                data: d.trim(),
                hora: h.trim().slice(0, 5)
            };
        }

        if (registro.criadoEmMs) {
            const dt = new Date(registro.criadoEmMs);
            return {
                data: dt.toLocaleDateString("pt-BR"),
                hora: dt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
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

    function obterPacienteInicial() {
        const cpfUrl = somenteNumeros(
            new URLSearchParams(window.location.search).get("cpf")
        );

        let salvoLocal = null;

        try {
            salvoLocal = JSON.parse(
                localStorage.getItem("electrofisio-paciente-selecionado")
            );
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
            return {
                ...salvoLocal,
                cpfNumeros: cpfSalvo,
                cpf: formatarCpf(cpfSalvo)
            };
        }

        return null;
    }

    function atualizarLinksMenuLateral(cpfNumeros) {
        if (!cpfNumeros || cpfNumeros.length !== 11) return;

        document.querySelectorAll(".menu-prontuario a").forEach(link => {
            const url = new URL(link.getAttribute("href"), window.location.href);
            url.searchParams.set("cpf", cpfNumeros);
            link.setAttribute("href", url.pathname.split("/").pop() + url.search);
        });
    }

    function renderizarColunaEsquerda(paciente) {
        if (!containerPacienteDados) return;

        containerPacienteDados.replaceChildren();

        const pNome = document.createElement("p");
        pNome.className = "paciente-nome";
        pNome.textContent = (paciente && paciente.nome)
            ? paciente.nome
            : "Paciente não selecionado";

        const pCpf = document.createElement("p");
        const cpfTexto = paciente && (paciente.cpfNumeros || paciente.cpf)
            ? formatarCpf(paciente.cpfNumeros || paciente.cpf)
            : "—";
        pCpf.textContent = "CPF: " + cpfTexto;

        const pMae = document.createElement("p");
        pMae.textContent = "Mãe: " + ((paciente && paciente.mae) ? paciente.mae : "Não informada");

        containerPacienteDados.append(pNome, pCpf, pMae);
    }

    function limparFormulario() {
        if (campoTexto) {
            campoTexto.value = "";
        }
        assinaturaProfissional = null;
    }

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

    function renderizarRegistrosDireita(lista) {
        if (!painelRegistros) return;

        const titulo = painelRegistros.querySelector("h2") || document.createElement("h2");
        titulo.textContent = "Registros de receitas";
        painelRegistros.replaceChildren(titulo);

        if (!lista || lista.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "mensagem-triagens";
            vazio.textContent = "Nenhum receituário registrado para este paciente.";
            painelRegistros.appendChild(vazio);
            return;
        }

        lista.forEach((receita, idx) => {
            const artigo = document.createElement("article");
            artigo.className = "registro-item";
            artigo.tabIndex = 0;
            artigo.dataset.indice = String(idx);
            artigo.setAttribute("role", "button");

            const pNome = document.createElement("p");
            pNome.className = "registro-nome";
            pNome.textContent = receita.profissionalNome
                || (usuarioLogado && usuarioLogado.nome)
                || "Profissional";

            const pCrefito = document.createElement("p");
            const crefitoValor = receita.profissionalCrefito
                || (usuarioLogado && usuarioLogado.crefito)
                || "Não informado";
            pCrefito.textContent = "CREFITO: " + crefitoValor;

            const { data, hora } = extrairDataHora(receita);

            const pData = document.createElement("p");
            pData.textContent = "Data: " + data;

            const pHorario = document.createElement("p");
            pHorario.textContent = "Horário: " + hora;

            const pDescricao = document.createElement("p");
            pDescricao.className = "registro-detalhe";
            pDescricao.textContent = receita.descricao || "";

            artigo.append(pNome, pCrefito, pData, pHorario, pDescricao);

            function acionarReceita() {
                if (aguardandoCopia) {
                    if (campoTexto) {
                        campoTexto.value = receita.descricao || "";
                        campoTexto.focus();
                    }

                    definirModoCopia(false);
                    statusRegistro.textContent = "Descrição do receituário copiada para o campo de edição.";
                    return;
                }

                painelRegistros.querySelectorAll(".registro-item").forEach(item => {
                    item.classList.toggle("aberto", item === artigo);
                });

                statusRegistro.textContent =
                    `Receita #${lista.length - idx} selecionada. Clique em Copiar e depois nela para reutilizar a descrição.`;
            }

            artigo.addEventListener("click", acionarReceita);
            artigo.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    acionarReceita();
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
            if (campoTexto) campoTexto.focus();
            statusRegistro.textContent = "Novo receituário iniciado.";
        });
    }

    // Botão Cancelar
    if (botaoCancelar) {
        botaoCancelar.addEventListener("click", () => {
            definirModoCopia(false);
            limparFormulario();
            statusRegistro.textContent = "Edição cancelada.";
        });
    }

    // Botão Assinar
    if (botaoAssinar) {
        botaoAssinar.addEventListener("click", () => {
            const nomeProf = (usuarioLogado && usuarioLogado.nome) || "Profissional";
            const crefitoProf = (usuarioLogado && usuarioLogado.crefito) || "000000";
            assinaturaProfissional = `${nomeProf} (CREFITO: ${crefitoProf})`;

            statusRegistro.textContent =
                `Receituário assinado digitalmente por ${assinaturaProfissional}. Clique em Salvar para registrar.`;
        });
    }

    // Botão Imprimir (estilo carregado externamente via receituario.css)
    const botaoImprimir = document.createElement("button");
    botaoImprimir.type = "button";
    botaoImprimir.className = "botao-icone";
    botaoImprimir.title = "Imprimir receituário";
    botaoImprimir.setAttribute("aria-label", botaoImprimir.title);

    const iconeImprimir = document.createElement("i");
    iconeImprimir.setAttribute("data-lucide", "printer");
    iconeImprimir.setAttribute("aria-hidden", "true");

    botaoImprimir.appendChild(iconeImprimir);
    containerAcoes?.appendChild(botaoImprimir);
    window.lucide?.createIcons();

    botaoImprimir.addEventListener("click", () => {
        // Prioriza o texto em edição. Com o campo vazio, usa a receita selecionada.
        const emEdicao = campoTexto.value.trim();
        const indice = painelRegistros.querySelector(".registro-item.aberto")?.dataset.indice;
        const registro = emEdicao ? null : receitasPaciente[indice];
        const descricao = emEdicao || registro?.descricao;

        if (!descricao?.trim()) {
            statusRegistro.textContent = "Digite o receituário ou selecione um registro para imprimir.";
            return;
        }

        const janela = window.open("", "_blank", "popup");

        if (!janela) {
            statusRegistro.textContent = "Permita a abertura da janela de impressão neste site.";
            return;
        }

        janela.opener = null;

        const pagina = janela.document;
        pagina.documentElement.lang = "pt-BR";
        pagina.title = "Receituário — ElectroFisio";
        pagina.body.className = "pagina-impressao-receituario";

        // Vincula o arquivo CSS externo (receituario.css) sem CSS inline no JS
        const linkCssOriginal = document.querySelector('link[href*="receituario.css"]');
        const linkCss = pagina.createElement("link");
        linkCss.rel = "stylesheet";
        linkCss.href = linkCssOriginal
            ? linkCssOriginal.href
            : new URL("../css/receituario.css", window.location.href).href;
        pagina.head.appendChild(linkCss);

        const nomePaciente = registro?.pacienteNome || pacienteAtual?.nome || "—";
        const maePaciente = pacienteAtual?.mae || "Não informada";
        const cpfPaciente = formatarCpf(pacienteAtual?.cpfNumeros || pacienteAtual?.cpf || registro?.cpf);
        const nascPaciente = pacienteAtual?.nascimento || "";
        const codigoPaciente = somenteNumeros(cpfPaciente).slice(0, 8) || "00000001";

        const profNome = (registro ? registro.profissionalNome : usuarioLogado?.nome) || "Profissional";
        const profCrefito = (registro ? registro.profissionalCrefito : (usuarioLogado?.crefito || usuarioLogado?.ra)) || "Não informado";
        const especialidade = usuarioLogado?.especialidade || "Fisioterapia";

        const numAtendimento = registro
            ? String(receitasPaciente.length - Number(indice)).padStart(7, "0")
            : String(receitasPaciente.length + 1).padStart(7, "0");

        let dataHoraTexto;
        if (registro) {
            const dh = extrairDataHora(registro);
            dataHoraTexto = `${dh.data} ${dh.hora}`;
        } else {
            const agora = new Date();
            dataHoraTexto = `${agora.toLocaleDateString("pt-BR")} ${agora.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            })}`;
        }

        // 1. Faixa superior (Logo ElectroFisio + Título RECEITUÁRIO)
        const faixaTopo = pagina.createElement("div");
        faixaTopo.className = "cabecalho-topo";

        const logoBox = pagina.createElement("div");
        logoBox.className = "logo-box";
        logoBox.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="30" height="30" rx="6" stroke="#31524A" stroke-width="2"/>
                <path d="M18 6L10 17H16L14 26L22 15H16L18 6Z" fill="#67AB9F" stroke="#31524A" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            <div class="logo-marca">
                <span class="logo-nome"><span class="electro">Electro</span><span class="fisio">Fisio</span></span>
                <span class="logo-sub">Fisioterapia e Eletroterapia</span>
            </div>
        `;

        const tituloDoc = pagina.createElement("h1");
        tituloDoc.className = "doc-titulo";
        tituloDoc.textContent = "RECEITUÁRIO";
        faixaTopo.append(logoBox, tituloDoc);

        // 2. Quadro de metadados em 2 colunas
        const quadroMeta = pagina.createElement("div");
        quadroMeta.className = "quadro-meta";

        function montarColunaMeta(itens) {
            const dl = pagina.createElement("dl");
            dl.className = "col-meta";
            itens.forEach(([rotulo, valor, negrito]) => {
                const dt = pagina.createElement("dt");
                dt.textContent = rotulo;
                const dd = pagina.createElement("dd");
                if (negrito) dd.className = "negrito";
                dd.textContent = valor;
                dl.append(dt, dd);
            });
            return dl;
        }

        const colEsquerda = montarColunaMeta([
            ["PACIENTE:", `${codigoPaciente}  ${String(nomePaciente).toUpperCase()}`, true],
            ["NOME DA MÃE:", String(maePaciente).toUpperCase(), false],
            ["ATENDIMENTO:", numAtendimento, false],
            ["LOCAL:", "ELECTROFISIO - FISIOTERAPIA", false],
            ["PROFISSIONAL:", String(profNome).toUpperCase(), false],
            ["CREFITO:", String(profCrefito).toUpperCase(), false]
        ]);

        const colDireita = montarColunaMeta([
            ["IDADE:", calcularIdade(nascPaciente), false],
            ["DATA NASC:", formatarDataBr(nascPaciente), false],
            ["CPF:", cpfPaciente, false],
            ["ESPECIALIDADE:", String(especialidade).toUpperCase(), false],
            ["DATA:", dataHoraTexto, false]
        ]);

        quadroMeta.append(colEsquerda, colDireita);

        // 3. Conteúdo do receituário
        const secaoTitulo = pagina.createElement("h2");
        secaoTitulo.className = "secao-titulo";
        secaoTitulo.textContent = "Prescrição / Orientações";

        const paragrafoDescricao = pagina.createElement("p");
        paragrafoDescricao.className = "descricao";
        paragrafoDescricao.textContent = descricao;

        // 4. Assinatura
        const assBox = pagina.createElement("div");
        assBox.className = "assinatura-box";

        const assLinha = pagina.createElement("div");
        assLinha.className = "assinatura-linha";

        const assNome = pagina.createElement("p");
        const strongNome = pagina.createElement("strong");
        strongNome.textContent = profNome;
        assNome.appendChild(strongNome);

        const assReg = pagina.createElement("p");
        assReg.textContent = `Fisioterapeuta · CREFITO: ${profCrefito}`;

        assBox.append(assLinha, assNome, assReg);

        const assinatura = registro ? registro.assinadoPor : assinaturaProfissional;
        if (assinatura) {
            const pDig = pagina.createElement("p");
            pDig.className = "assinatura-digital";
            pDig.textContent = "Assinado digitalmente por: " + assinatura;
            assBox.appendChild(pDig);
        }

        pagina.body.append(faixaTopo, quadroMeta, secaoTitulo, paragrafoDescricao, assBox);

        let jaImprimiu = false;
        function dispararImpressao() {
            if (jaImprimiu) return;
            jaImprimiu = true;
            janela.focus();
            janela.print();
        }

        linkCss.addEventListener("load", dispararImpressao);
        linkCss.addEventListener("error", dispararImpressao);
        setTimeout(dispararImpressao, 350);
    });

    // Botão Copiar
    if (botaoCopiar) {
        botaoCopiar.addEventListener("click", () => {
            if (receitasPaciente.length === 0) {
                statusRegistro.textContent = "Não há receituários registrados para copiar.";
                return;
            }

            const proximoEstado = !aguardandoCopia;
            definirModoCopia(proximoEstado);

            if (proximoEstado) {
                statusRegistro.textContent = "Clique em um dos receituários registrados à direita para copiar sua descrição.";
            } else {
                statusRegistro.textContent = "Modo cópia cancelado.";
            }
        });
    }

    // Botão Salvar
    if (botaoSalvar) {
        botaoSalvar.addEventListener("click", async () => {
            if (!pacienteAtual || !pacienteAtual.cpfNumeros) {
                statusRegistro.textContent = "Nenhum paciente selecionado. Volte em Pacientes e selecione um cadastro.";
                return;
            }

            const descricao = String(campoTexto ? campoTexto.value : "").trim();

            if (!descricao) {
                statusRegistro.textContent = "Digite a descrição do receituário antes de salvar.";
                if (campoTexto) campoTexto.focus();
                return;
            }

            definirModoCopia(false);
            botaoSalvar.disabled = true;
            statusRegistro.textContent = "Salvando receituário...";

            try {
                const cpfNumeros = pacienteAtual.cpfNumeros;
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

                const novoReceituario = {
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
                    descricao
                };

                const docRef = await addDoc(collection(db, "receituarios"), novoReceituario);
                novoReceituario.id = docRef.id;

                receitasPaciente.unshift(novoReceituario);
                renderizarRegistrosDireita(receitasPaciente);
                limparFormulario();

                statusRegistro.textContent =
                    `Receituário salvo em ${dataSessao} às ${horaSessao.slice(0, 5)}. Campo limpo para um novo registro.`;
            } catch (erro) {
                console.error("Erro ao salvar receituário no Firebase:", erro);
                statusRegistro.textContent = "Erro ao salvar no Firebase. Verifique sua conexão e tente novamente.";
            } finally {
                botaoSalvar.disabled = false;
            }
        });
    }

    async function carregarTelaReceituario() {
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
        statusRegistro.textContent = "Carregando receituários...";

        try {
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
            } else {
                // Procura na triagem quando o cadastro do paciente está apenas nessa coleção.
                const qTriagens = query(
                    collection(db, "triagens"),
                    where("cpfNumeros", "==", cpf)
                );

                const snapTriagens = await getDocs(qTriagens);

                if (!snapTriagens.empty) {
                    const maisRecente = snapTriagens.docs
                        .map(d => d.data())
                        .sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0))[0];

                    const dadosRecentes = maisRecente.dados || maisRecente.respostas || {};

                    paciente = {
                        ...dadosRecentes,
                        ...paciente,
                        nome: paciente.nome || dadosRecentes.nome || maisRecente.pacienteNome,
                        mae: paciente.mae || dadosRecentes.mae || "",
                        cpfNumeros: cpf
                    };
                }
            }

            pacienteAtual = {
                ...paciente,
                cpfNumeros: cpf,
                cpf: formatarCpf(cpf)
            };

            try {
                localStorage.setItem(
                    "electrofisio-paciente-selecionado",
                    JSON.stringify(pacienteAtual)
                );
            } catch (erro) {
                // Ignora se localStorage estiver bloqueado.
            }

            renderizarColunaEsquerda(pacienteAtual);

            const qReceituarios = query(
                collection(db, "receituarios"),
                where("cpfNumeros", "==", cpf)
            );

            const snapReceituarios = await getDocs(qReceituarios);
            const lista = [];

            snapReceituarios.forEach(docSnap => {
                lista.push({ id: docSnap.id, ...docSnap.data() });
            });

            lista.sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0));

            receitasPaciente = lista;
            renderizarRegistrosDireita(receitasPaciente);
            statusRegistro.textContent = "";
        } catch (erro) {
            console.error("Erro ao carregar receituários do Firebase:", erro);
            statusRegistro.textContent = "Erro ao carregar os registros do banco de dados.";
        }
    }

    await carregarTelaReceituario();
});
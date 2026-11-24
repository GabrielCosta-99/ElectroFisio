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

    const ESCALA_DOR = {
        "0": "0 - Sem dor",
        "1": "1 - Leve",
        "2": "2 - Moderada",
        "3": "3 - Intensa",
        "4": "4 - Muito intensa"
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
    let evolucoesPaciente = [];
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

    function lerDadosFormulario() {
        if (!formulario) return {};

        const recursoEl = formulario.querySelector('input[name="recurso"]:checked');
        const dorEl = formulario.querySelector('input[name="dor"]:checked');

        return {
            recurso: recursoEl ? recursoEl.value : "",
            frequencia: String(formulario.elements.frequencia?.value || "").trim(),
            larguraPulso: String(formulario.elements.larguraPulso?.value || "").trim(),
            temposFes: String(formulario.elements.temposFes?.value || "").trim(),
            tempoAplicacao: String(formulario.elements.tempoAplicacao?.value || "").trim(),
            dor: dorEl ? dorEl.value : "",
            observacoes: String(formulario.elements.observacoes?.value || "").trim()
        };
    }

    function formularioEstaPreenchido(dados) {
        return Boolean(
            dados.recurso ||
            dados.frequencia ||
            dados.larguraPulso ||
            dados.temposFes ||
            dados.tempoAplicacao ||
            dados.dor ||
            dados.observacoes
        );
    }

    function preencherFormulario(dados) {
        if (!formulario || !dados) return;

        formulario.querySelectorAll('input[name="recurso"]').forEach(radio => {
            radio.checked = radio.value === (dados.recurso || "");
        });

        if (formulario.elements.frequencia) formulario.elements.frequencia.value = dados.frequencia || "";
        if (formulario.elements.larguraPulso) formulario.elements.larguraPulso.value = dados.larguraPulso || "";
        if (formulario.elements.temposFes) formulario.elements.temposFes.value = dados.temposFes || "";
        if (formulario.elements.tempoAplicacao) formulario.elements.tempoAplicacao.value = dados.tempoAplicacao || "";

        formulario.querySelectorAll('input[name="dor"]').forEach(radio => {
            radio.checked = radio.value === String(dados.dor ?? "");
        });

        if (formulario.elements.observacoes) {
            formulario.elements.observacoes.value = dados.observacoes || "";
        }
    }

    function limparFormulario() {
        if (formulario) {
            formulario.reset();
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

    function resumirEvolucao(ev) {
        const partes = [];
        if (ev.recurso) partes.push(`Recurso: ${ev.recurso}`);
        if (ev.frequencia) partes.push(`${ev.frequencia} Hz`);
        if (ev.larguraPulso) partes.push(`${ev.larguraPulso} µs`);
        if (ev.tempoAplicacao) partes.push(`${ev.tempoAplicacao} min`);
        if (ev.dor !== "" && ev.dor !== undefined && ev.dor !== null) {
            partes.push(`Dor: ${ESCALA_DOR[String(ev.dor)] || ev.dor}`);
        }
        const linhaParametros = partes.join(" · ");
        if (linhaParametros && ev.observacoes) {
            return `${linhaParametros}\n${ev.observacoes}`;
        }
        return linhaParametros || ev.observacoes || "";
    }

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

        lista.forEach((evolucao, idx) => {
            const artigo = document.createElement("article");
            artigo.className = "registro-item";
            artigo.tabIndex = 0;
            artigo.dataset.indice = String(idx);
            artigo.setAttribute("role", "button");

            const pNome = document.createElement("p");
            pNome.className = "registro-nome";
            pNome.textContent = evolucao.profissionalNome
                || (usuarioLogado && usuarioLogado.nome)
                || "Profissional";

            const pCrefito = document.createElement("p");
            const crefitoValor = evolucao.profissionalCrefito
                || (usuarioLogado && usuarioLogado.crefito)
                || "Não informado";
            pCrefito.textContent = "CREFITO: " + crefitoValor;

            const { data, hora } = extrairDataHora(evolucao);

            const pData = document.createElement("p");
            pData.textContent = "Data: " + data;

            const pHorario = document.createElement("p");
            pHorario.textContent = "Horário: " + hora;

            const pDescricao = document.createElement("p");
            pDescricao.className = "registro-detalhe";
            pDescricao.textContent = resumirEvolucao(evolucao);

            artigo.append(pNome, pCrefito, pData, pHorario, pDescricao);

            function acionarEvolucao() {
                if (aguardandoCopia) {
                    preencherFormulario(evolucao);
                    definirModoCopia(false);
                    statusRegistro.textContent = "Dados da evolução copiados para o formulário.";
                    return;
                }

                painelRegistros.querySelectorAll(".registro-item").forEach(item => {
                    item.classList.toggle("aberto", item === artigo);
                });

                statusRegistro.textContent =
                    `Evolução #${lista.length - idx} selecionada. Clique em Copiar para reutilizar ou em Imprimir.`;
            }

            artigo.addEventListener("click", acionarEvolucao);
            artigo.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    acionarEvolucao();
                }
            });

            painelRegistros.appendChild(artigo);
        });
    }

    if (formulario) {
        formulario.addEventListener("submit", evento => evento.preventDefault());
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
                `Evolução assinada digitalmente por ${assinaturaProfissional}. Clique em Salvar para registrar.`;
        });
    }

    // Botão Imprimir (mesmo padrão visual de ícone do Receituário + cabeçalho clínico padronizado)
    const botaoImprimir = document.createElement("button");
    botaoImprimir.type = "button";
    botaoImprimir.className = "botao-icone";
    botaoImprimir.dataset.acao = "imprimir";
    botaoImprimir.title = "Imprimir evolução";
    botaoImprimir.setAttribute("aria-label", botaoImprimir.title);

    const iconeImprimir = document.createElement("i");
    iconeImprimir.setAttribute("data-lucide", "printer");
    iconeImprimir.setAttribute("aria-hidden", "true");
    iconeImprimir.style.width = "21px";
    iconeImprimir.style.height = "21px";

    botaoImprimir.appendChild(iconeImprimir);
    containerAcoes?.appendChild(botaoImprimir);
    window.lucide?.createIcons();

    botaoImprimir.addEventListener("click", () => {
        const dadosAtual = lerDadosFormulario();
        const temFormulario = formularioEstaPreenchido(dadosAtual);
        const indiceAberto = painelRegistros?.querySelector(".registro-item.aberto")?.dataset.indice;
        const registroSalvo = !temFormulario && indiceAberto !== undefined
            ? evolucoesPaciente[Number(indiceAberto)]
            : null;

        const alvo = temFormulario ? dadosAtual : registroSalvo;

        if (!alvo) {
            statusRegistro.textContent = "Preencha a evolução ou selecione um registro à direita para imprimir.";
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
        pagina.title = "Evolução Fisioterapêutica — ElectroFisio";

        const estilo = pagina.createElement("style");
        estilo.textContent = `
            @page {
                size: A4;
                margin: 12mm 14mm;
            }
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                font-family: Arial, Helvetica, sans-serif;
                color: #111111;
                background: #FFFFFF;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .cabecalho-topo {
                display: flex;
                align-items: center;
                border: 1.5px solid #222222;
                padding: 10px 16px;
                margin-bottom: 3px;
            }
            .logo-box {
                display: flex;
                align-items: center;
                gap: 9px;
                min-width: 185px;
            }
            .logo-marca {
                display: flex;
                flex-direction: column;
                line-height: 1.1;
            }
            .logo-nome {
                font-size: 18px;
                font-weight: 700;
            }
            .logo-nome .electro { color: #31524A; }
            .logo-nome .fisio { color: #67AB9F; }
            .logo-sub {
                font-size: 8.5px;
                color: #4A5552;
                margin-top: 2px;
            }
            .doc-titulo {
                flex: 1;
                text-align: center;
                font-size: 17px;
                font-weight: 700;
                letter-spacing: 0.4px;
                padding-right: 90px;
                text-transform: uppercase;
            }
            .quadro-meta {
                display: grid;
                grid-template-columns: 1.45fr 1fr;
                gap: 4px 16px;
                border: 1.5px solid #222222;
                padding: 9px 14px;
                margin-bottom: 16px;
            }
            .col-meta {
                display: grid;
                grid-template-columns: 102px 1fr;
                row-gap: 3px;
                column-gap: 8px;
                font-size: 10.5px;
                line-height: 1.35;
            }
            .col-meta dt {
                text-align: right;
                font-weight: 400;
                color: #222222;
            }
            .col-meta dd {
                margin: 0;
                color: #111111;
                word-break: break-word;
            }
            .col-meta dd.negrito {
                font-weight: 700;
            }
            .secao-titulo {
                font-size: 12px;
                font-weight: 700;
                color: #31524A;
                border-bottom: 1px solid #888888;
                padding-bottom: 4px;
                margin: 14px 0 8px;
                text-transform: uppercase;
            }
            table.tabela-dados {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 14px;
                font-size: 11px;
            }
            table.tabela-dados th,
            table.tabela-dados td {
                border: 1px solid #CCCCCC;
                padding: 6px 9px;
                text-align: left;
                vertical-align: top;
            }
            table.tabela-dados th {
                width: 40%;
                background: #F4F7F6;
                color: #263C35;
                font-weight: 700;
            }
            .bloco-observacoes {
                border: 1px solid #CCCCCC;
                padding: 10px 12px;
                min-height: 110px;
                font-size: 11.5px;
                line-height: 1.55;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }
            .assinatura-box {
                margin-top: 44px;
                text-align: center;
                font-size: 11px;
                page-break-inside: avoid;
            }
            .assinatura-linha {
                width: 260px;
                margin: 0 auto 6px;
                border-top: 1px solid #222222;
            }
            .assinatura-digital {
                margin-top: 4px;
                font-size: 10px;
                color: #4A5552;
            }
        `;
        pagina.head.appendChild(estilo);

        const nomePaciente = (registroSalvo && registroSalvo.pacienteNome) || (pacienteAtual && pacienteAtual.nome) || "—";
        const maePaciente = (pacienteAtual && pacienteAtual.mae) || "Não informada";
        const cpfPaciente = formatarCpf((pacienteAtual && (pacienteAtual.cpfNumeros || pacienteAtual.cpf)) || (registroSalvo && registroSalvo.cpf));
        const nascPaciente = (pacienteAtual && pacienteAtual.nascimento) || "";
        const codigoPaciente = somenteNumeros(cpfPaciente).slice(0, 8) || "00000001";

        const profNome = (registroSalvo && registroSalvo.profissionalNome) || (usuarioLogado && usuarioLogado.nome) || "Profissional";
        const profCrefito = (registroSalvo && registroSalvo.profissionalCrefito) || (usuarioLogado && (usuarioLogado.crefito || usuarioLogado.ra)) || "Não informado";
        const especialidade = (usuarioLogado && usuarioLogado.especialidade) || "Fisioterapia";

        const numAtendimento = registroSalvo
            ? String(evolucoesPaciente.length - Number(indiceAberto)).padStart(7, "0")
            : String(evolucoesPaciente.length + 1).padStart(7, "0");

        let dataHoraTexto;
        if (registroSalvo) {
            const dh = extrairDataHora(registroSalvo);
            dataHoraTexto = `${dh.data} ${dh.hora}`;
        } else {
            const agora = new Date();
            dataHoraTexto = `${agora.toLocaleDateString("pt-BR")} ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
        }

        // Faixa superior (Logo + Título)
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

        const h1 = pagina.createElement("h1");
        h1.className = "doc-titulo";
        h1.textContent = "EVOLUÇÃO FISIOTERAPÊUTICA";
        faixaTopo.append(logoBox, h1);

        // Quadro de metadados em 2 colunas
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

        const colEsq = montarColunaMeta([
            ["PACIENTE:", `${codigoPaciente}  ${String(nomePaciente).toUpperCase()}`, true],
            ["NOME DA MÃE:", String(maePaciente).toUpperCase(), false],
            ["ATENDIMENTO:", numAtendimento, false],
            ["LOCAL:", "ELECTROFISIO - FISIOTERAPIA", false],
            ["PROFISSIONAL:", String(profNome).toUpperCase(), false],
            ["CREFITO:", String(profCrefito).toUpperCase(), false]
        ]);

        const colDir = montarColunaMeta([
            ["IDADE:", calcularIdade(nascPaciente), false],
            ["DATA NASC:", formatarDataBr(nascPaciente), false],
            ["CPF:", cpfPaciente, false],
            ["ESPECIALIDADE:", String(especialidade).toUpperCase(), false],
            ["DATA:", dataHoraTexto, false]
        ]);

        quadroMeta.append(colEsq, colDir);
        pagina.body.append(faixaTopo, quadroMeta);

        // Tabela de Conduta e Parâmetros
        const h2Conduta = pagina.createElement("h2");
        h2Conduta.className = "secao-titulo";
        h2Conduta.textContent = "Conduta Adotada e Parâmetros Ajustados";

        const tabela = pagina.createElement("table");
        tabela.className = "tabela-dados";
        const tbody = pagina.createElement("tbody");

        const dorTexto = alvo.dor !== "" && alvo.dor !== undefined && alvo.dor !== null
            ? (ESCALA_DOR[String(alvo.dor)] || String(alvo.dor))
            : "Não informada";

        const linhasConduta = [
            ["Recurso utilizado", alvo.recurso || "Não informado"],
            ["Frequência (Hz)", alvo.frequencia ? `${alvo.frequencia} Hz` : "—"],
            ["Largura de pulso (µs)", alvo.larguraPulso ? `${alvo.larguraPulso} µs` : "—"],
            ["Subida / descida / ON / OFF (FES)", alvo.temposFes || "—"],
            ["Tempo de aplicação (min)", alvo.tempoAplicacao ? `${alvo.tempoAplicacao} min` : "—"],
            ["Classificação da dor (pós-sessão)", dorTexto]
        ];

        linhasConduta.forEach(([rotulo, valor]) => {
            const tr = pagina.createElement("tr");
            const th = pagina.createElement("th");
            th.textContent = rotulo;
            const td = pagina.createElement("td");
            td.textContent = valor;
            tr.append(th, td);
            tbody.appendChild(tr);
        });

        tabela.appendChild(tbody);
        pagina.body.append(h2Conduta, tabela);

        // Bloco de Observações / Evolução
        const h2Obs = pagina.createElement("h2");
        h2Obs.className = "secao-titulo";
        h2Obs.textContent = "Evolução Clínica / Observações";

        const blocoObs = pagina.createElement("div");
        blocoObs.className = "bloco-observacoes";
        blocoObs.textContent = alvo.observacoes || "Sem observações adicionais registradas.";
        pagina.body.append(h2Obs, blocoObs);

        // Assinatura
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

        const assDigital = registroSalvo ? registroSalvo.assinadoPor : assinaturaProfissional;
        if (assDigital) {
            const pDig = pagina.createElement("p");
            pDig.className = "assinatura-digital";
            pDig.textContent = "Assinado digitalmente por: " + assDigital;
            assBox.appendChild(pDig);
        }

        pagina.body.appendChild(assBox);

        janela.focus();
        janela.print();
    });

    // Botão Copiar
    if (botaoCopiar) {
        botaoCopiar.addEventListener("click", () => {
            if (evolucoesPaciente.length === 0) {
                statusRegistro.textContent = "Não há evoluções registradas para copiar.";
                return;
            }

            const proximoEstado = !aguardandoCopia;
            definirModoCopia(proximoEstado);

            if (proximoEstado) {
                statusRegistro.textContent = "Clique em um dos registros à direita para copiar os dados da evolução.";
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

            const dados = lerDadosFormulario();

            if (!formularioEstaPreenchido(dados)) {
                statusRegistro.textContent = "Preencha a conduta ou as observações antes de salvar.";
                return;
            }

            definirModoCopia(false);
            botaoSalvar.disabled = true;
            statusRegistro.textContent = "Salvando evolução...";

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

                const novaEvolucao = {
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
                    ...dados
                };

                const docRef = await addDoc(collection(db, "evolucoes"), novaEvolucao);
                novaEvolucao.id = docRef.id;

                evolucoesPaciente.unshift(novaEvolucao);
                renderizarRegistrosDireita(evolucoesPaciente);
                limparFormulario();

                statusRegistro.textContent =
                    `Evolução salva em ${dataSessao} às ${horaSessao.slice(0, 5)}. Formulário limpo para um novo registro.`;
            } catch (erro) {
                console.error("Erro ao salvar evolução no Firebase:", erro);
                statusRegistro.textContent = "Erro ao salvar no Firebase. Verifique sua conexão e tente novamente.";
            } finally {
                botaoSalvar.disabled = false;
            }
        });
    }

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
        statusRegistro.textContent = "Carregando evoluções...";

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

            const qEvolucoes = query(
                collection(db, "evolucoes"),
                where("cpfNumeros", "==", cpf)
            );

            const snapEvolucoes = await getDocs(qEvolucoes);
            const lista = [];

            snapEvolucoes.forEach(docSnap => {
                lista.push({ id: docSnap.id, ...docSnap.data() });
            });

            lista.sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0));

            evolucoesPaciente = lista;
            renderizarRegistrosDireita(evolucoesPaciente);
            statusRegistro.textContent = "";
        } catch (erro) {
            console.error("Erro ao carregar evoluções do Firebase:", erro);
            statusRegistro.textContent = "Erro ao carregar os registros do banco de dados.";
        }
    }

    await carregarTelaEvolucao();
});
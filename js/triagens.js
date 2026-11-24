import {
    db,
    collection,
    getDocs,
    query,
    where
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    // Dicionários para exibir os valores salvos em português legível
    const TEXTOS_REGIAO = {
        cabeca: "cabeça / face",
        pescocoAnterior: "pescoço anterior / lateral",
        cervical: "cervical posterior",
        torax: "tórax anterior",
        ombro: "ombro",
        membroSuperior: "membro superior",
        dorsal: "região dorsal",
        lombar: "região lombar",
        abdome: "abdome",
        pelve: "pelve / quadril",
        coxa: "coxa",
        joelho: "joelho",
        perna: "perna, tornozelo ou pé"
    };

    const TEXTOS_LADO = {
        direito: "direito",
        esquerdo: "esquerdo",
        bilateral: "bilateral"
    };

    const TEXTOS_SIM_NAO = {
        sim: "Sim",
        nao: "Não",
        nao_avaliado: "Não avaliado",
        nao_sabe: "Não sabe",
        nao_aplica: "Não se aplica",
        auxilio: "Com auxílio",
        confirmado: "Confirmado pelo profissional"
    };

    const TEXTOS_SENSIBILIDADE = {
        preservada: "Preservada",
        diminuida: "Diminuída",
        ausente: "Ausente",
        nao_avaliado: "Não avaliada"
    };

    const TEXTOS_DOR = {
        "0": "Sem dor (0)",
        "1": "Leve (1)",
        "2": "Moderada (2)",
        "3": "Intensa (3)",
        "4": "Muito intensa (4)"
    };

    const TEXTOS_CRONICIDADE = {
        aguda: "Aguda (menos de 6 semanas)",
        subaguda: "Subaguda (6 a 12 semanas)",
        cronica: "Crônica (mais de 3 meses)",
        nao_informada: "Não informada"
    };

    const TEXTOS_TIPO_DOR = {
        mecanica: "Nociceptiva (mecânica / inflamatória)",
        neuropatica: "Neuropática / radicular",
        nociplastica: "Nociplástica",
        mista: "Mista",
        indefinido: "Não definido"
    };

    const TEXTOS_OBJETIVO_TENS = {
        atividade: "Alívio da dor durante a atividade",
        sessao: "Analgesia durante a sessão",
        outro: "Outro"
    };

    const TEXTOS_TOLERANCIA_TENS = {
        boa: "Boa",
        desconforto: "Desconforto",
        nao_testada: "Não testada"
    };

    const TEXTOS_EQUIPAMENTO_TENS = {
        neurodyn2: "IBRAMED Neurodyn II (modelo e limites confirmados)",
        outro: "Outro aparelho ou modelo não confirmado"
    };

    const TEXTOS_TESTE_TENS = {
        nao_realizado: "Não realizado",
        confortavel: "Sensação forte e confortável",
        insuficiente: "Resposta insuficiente",
        desconforto: "Desconforto",
        evento: "Evento adverso"
    };

    const TEXTOS_CONDICAO_FES = {
        avc: "AVC",
        lesaoMedular: "Lesão medular",
        esclerose: "Esclerose múltipla",
        paralisiaCerebral: "Paralisia cerebral",
        outra: "Outra condição neurológica",
        indefinida: "Diagnóstico não definido"
    };

    const TEXTOS_TECIDO_FES = {
        semLesao: "Sem lesão estrutural conhecida",
        posOperatorio: "Pós-operatório imediato",
        neurologica: "Sequela neurológica",
        outra: "Outra condição"
    };

    const TEXTOS_INERVACAO_FES = {
        preservada: "Preservada",
        parcial: "Parcialmente comprometida",
        desnervacao: "Suspeita de desnervação",
        nao_avaliado: "Não avaliada"
    };

    const TEXTOS_FORCA_FES = {
        "0": "Grau 0 — nenhuma contração",
        "1": "Grau 1 — contração palpável, sem movimento",
        "2": "Grau 2 — movimento com gravidade eliminada",
        "3": "Grau 3 — movimento contra a gravidade",
        "4": "Grau 4 — movimento contra resistência",
        "5": "Grau 5 — força considerada normal"
    };

    const TEXTOS_NIVEL_FES = {
        nao: "Não",
        ausente: "Ausente",
        leve: "Leve",
        moderada: "Moderada",
        importante: "Importante",
        nao_avaliado: "Não avaliada"
    };

    const TEXTOS_MOVIMENTO_FES = {
        dorsiflexao: "Dorsiflexão na marcha",
        punhoDedos: "Extensão de punho e dedos",
        preensao: "Preensão / liberação de objetos",
        joelho: "Extensão do joelho em tarefa",
        ombroCotovelo: "Movimento de ombro / cotovelo",
        outro: "Outro"
    };

    const TEXTOS_OBJETIVO_FES = {
        assistir: "Assistir o movimento",
        desempenho: "Melhorar o desempenho funcional",
        treino: "Facilitar treino repetitivo",
        fortalecimento: "Só fortalecimento, sem tarefa funcional"
    };

    const TEXTOS_ACIONAMENTO_FES = {
        marcha: "Sincronizada à marcha (sensor)",
        manual: "Comando manual",
        emg: "EMG",
        ciclos: "Ciclos programados (ON/OFF)",
        outro: "Outro"
    };

    const TEXTOS_RESPOSTA_FES = {
        funcional: "Contração funcional",
        insuficiente: "Presente, mas insuficiente",
        inadequada: "Inadequada / compensatória",
        ausente: "Ausente",
        nao_testada: "Não testada"
    };

    const TEXTOS_TOLERANCIA_FES = {
        boa: "Boa",
        limitada: "Limitada por desconforto",
        nao_avaliado: "Não avaliada"
    };

    const TEXTOS_EQUIPAMENTO_FES = {
        confirmado: "Modelo, canais e formas de acionamento confirmados",
        outro: "Equipamento não confirmado"
    };

    const TEXTOS_ESTADOS = {
        EDUCATIVO: "Modo educativo",
        DADOS_INSUFICIENTES: "Dados insuficientes",
        NAO_PROSSEGUIR: "Não prosseguir nesta região",
        AVALIACAO_NECESSARIA: "Avaliação profissional necessária",
        HARDWARE_NAO_VALIDADO: "Equipamento não validado",
        INTERROMPER: "Interromper e reavaliar",
        SEM_ASSOCIACAO_AUTOMATICA: "Sem associação automática",
        SEM_PRESET_ESPECIFICO: "Sem preset específico",
        SEM_PROTOCOLO_VALIDADO: "Sem protocolo validado para este perfil",
        TRILHA_NMES: "Trilha NMES (fortalecimento sem tarefa funcional)",
        REAVALIAR: "Reavaliar antes de configurar",
        ESCOLHA_PROFISSIONAL: "Aguardando escolha profissional",
        REVISAO_PROFISSIONAL: "Em revisão profissional",
        INCOMPATIVEL: "Incompatível com o aparelho",
        CONFIRMADO_PELO_PROFISSIONAL: "Confirmado pelo profissional"
    };

    // Elementos da página
    const itensAbas = document.querySelectorAll(".item-triagem");
    const botaoAbrir = document.getElementById("botaoAbrir");
    const botaoImprimir = document.getElementById("botaoImprimir");
    const mensagem = document.getElementById("mensagemTriagens");
    const quadro = document.querySelector(".quadro-triagens");
    const painelRegistros = document.querySelector(".prontuario-registros");
    const containerPacienteDados = document.querySelector(".paciente-dados");
    const topoProfissional = document.querySelector(".profissional-info");

    // Quadro onde a aba escolhida da sessão selecionada é exibida (somente leitura)
    const documento = document.createElement("article");
    documento.className = "quadro-prontuario documento-triagem";
    documento.id = "documentoTriagem";
    documento.tabIndex = -1;
    documento.hidden = true;
    quadro.insertAdjacentElement("afterend", documento);

    let pacienteAtual = null;
    let ultimas3Sessoes = [];
    let sessaoSelecionada = null;
    let abaEscolhida = null;

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

    // Recupera o paciente selecionado em pacientes.html
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

    function atualizarLinksMenuLateral(cpfNumeros) {
        if (!cpfNumeros || cpfNumeros.length !== 11) return;

        document.querySelectorAll(".menu-prontuario a").forEach(link => {
            const url = new URL(link.getAttribute("href"), window.location.href);
            url.searchParams.set("cpf", cpfNumeros);
            link.setAttribute("href", url.pathname.split("/").pop() + url.search);
        });
    }

    // Coluna 1 (Esquerda): Nome, CPF e Nome da mãe
    function renderizarDadosPacienteEsquerda(paciente) {
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

    // Resumo de cada sessão para os cartões da direita ("Registros de triagens")
    function gerarResumosSessao(sessao) {
        const linhas = [];
        const q = sessao.questionario || sessao.respostas || {};
        const regiaoBase = TEXTOS_REGIAO[q.regiaoEletrodos] || q.regiaoEletrodos || "";
        const ladoBase = TEXTOS_LADO[q.lado] ? ` (${TEXTOS_LADO[q.lado]})` : "";
        const localRegiao = regiaoBase ? `${regiaoBase}${ladoBase}` : "região avaliada";

        const usouTens = Boolean(sessao.usouTens || sessao.tens);
        const usouFes = Boolean(sessao.usouFes || sessao.fes);

        if (!usouTens && !usouFes) {
            const temAlerta =
                q.neoplasia === "sim" ||
                q.pele === "sim" ||
                q.vascular === "sim" ||
                q.dispositivo === "sim" ||
                ["cabeca", "pescocoAnterior", "torax"].includes(q.regiaoEletrodos);

            linhas.push(
                temAlerta
                    ? "Triagem inicial: dados cadastrais conferidos e questionário de segurança com pontos de atenção."
                    : "Triagem inicial: dados cadastrais conferidos e questionário de segurança sem alertas."
            );
            return linhas;
        }

        if (usouTens) {
            const t = sessao.tens || sessao.respostas || {};
            const statusTens = TEXTOS_ESTADOS[sessao.resultadoTens] || "registrado";
            let presetTexto = "";

            if (t.pontoGatilho === "confirmado") {
                presetTexto = "protocolo IBR-GATILHO-03";
            } else if (t.cronicidade === "aguda" && !["neuropatica", "mista", "indefinido"].includes(t.tipoDor)) {
                presetTexto = "protocolo IBR-AGUDA-01";
            } else if (t.cronicidade === "cronica" && !["neuropatica", "mista", "indefinido"].includes(t.tipoDor)) {
                presetTexto = "protocolo IBR-CRONICA-02";
            }

            if (presetTexto) {
                linhas.push(`Mapeamento TENS (${localRegiao}): ${presetTexto} — ${statusTens.toLowerCase()}.`);
            } else {
                linhas.push(`Mapeamento TENS (${localRegiao}): ${statusTens.toLowerCase()}.`);
            }
        }

        if (usouFes) {
            const f = sessao.fes || sessao.respostas || {};
            const respostaTexto = (TEXTOS_RESPOSTA_FES[f.respostaTeste] || "").toLowerCase();
            const statusFes = TEXTOS_ESTADOS[sessao.resultadoFes] || "registrado";

            if (respostaTexto) {
                linhas.push(`Mapeamento FES: ${respostaTexto}. ${statusFes}.`);
            } else {
                linhas.push(`Mapeamento FES (${localRegiao}): ${statusFes.toLowerCase()}.`);
            }
        }

        return linhas;
    }

    // Atualiza as 3 opções do centro conforme a sessão selecionada na direita
    function atualizarOpcoesCentro() {
        const temSessao = Boolean(sessaoSelecionada);
        const { data, hora } = temSessao ? extrairDataHora(sessaoSelecionada) : { data: "", hora: "" };
        const dataHoraTexto = `${data} - ${hora}`;

        const usouTens = temSessao && Boolean(sessaoSelecionada.usouTens || sessaoSelecionada.tens);
        const usouFes = temSessao && Boolean(sessaoSelecionada.usouFes || sessaoSelecionada.fes);

        itensAbas.forEach(item => {
            const aba = item.dataset.aba;
            const spanData = item.querySelector(".data-triagem");

            item.disabled = !temSessao;

            if (!temSessao) {
                if (spanData) spanData.textContent = "Selecione uma sessão";
                item.classList.remove("selecionado");
                item.setAttribute("aria-pressed", "false");
                return;
            }

            if (spanData) {
                if (aba === "questionario") {
                    spanData.textContent = dataHoraTexto;
                } else if (aba === "tens") {
                    spanData.textContent = usouTens ? dataHoraTexto : "Não realizado nesta sessão";
                } else if (aba === "fes") {
                    spanData.textContent = usouFes ? dataHoraTexto : "Não realizado nesta sessão";
                }
            }
        });

        botaoAbrir.disabled = !(temSessao && abaEscolhida);
        if (botaoImprimir) {
            botaoImprimir.disabled = !temSessao;
        }
    }

    // Seleciona uma das 3 sessões na coluna da direita
    function selecionarSessaoDireita(indice) {
        sessaoSelecionada = ultimas3Sessoes[indice] || null;
        if (!sessaoSelecionada) return;

        painelRegistros.querySelectorAll(".sessao-clicavel").forEach((card, idx) => {
            const ativo = idx === indice;
            card.classList.toggle("selecionado", ativo);
            card.setAttribute("aria-pressed", String(ativo));
        });

        atualizarOpcoesCentro();

        const num = sessaoSelecionada.numeroSessao || sessaoSelecionada.numeroTriagem || (ultimas3Sessoes.length - indice);
        const { data, hora } = extrairDataHora(sessaoSelecionada);

        if (!documento.hidden && abaEscolhida) {
            abrirDocumentoAba();
        } else {
            mensagem.textContent = `Sessão #${num} (${data} - ${hora}) selecionada. Escolha uma das 3 abas acima para abrir ou clique em Imprimir.`;
        }
    }

    // Coluna 3 (Direita): mostra APENAS as 3 últimas sessões (clicáveis)
    function renderizarRegistrosDireita(sessoes) {
        if (!painelRegistros) return;

        const titulo = painelRegistros.querySelector("h2") || document.createElement("h2");
        titulo.textContent = "Registros de triagens";
        painelRegistros.replaceChildren(titulo);

        ultimas3Sessoes = sessoes.slice(0, 3);

        if (ultimas3Sessoes.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "mensagem-triagens";
            vazio.textContent = "Nenhuma sessão registrada para este paciente.";
            painelRegistros.appendChild(vazio);
            return;
        }

        ultimas3Sessoes.forEach((sessao, idx) => {
            const artigo = document.createElement("article");
            artigo.className = "registro-item sessao-clicavel";
            artigo.tabIndex = 0;
            artigo.setAttribute("role", "button");
            artigo.setAttribute("aria-pressed", "false");

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

            artigo.append(pNome, pCrefito, pData, pHorario);

            const resumos = gerarResumosSessao(sessao);
            resumos.forEach(textoResumo => {
                const pResumo = document.createElement("p");
                pResumo.textContent = textoResumo;
                artigo.appendChild(pResumo);
            });

            artigo.addEventListener("click", () => selecionarSessaoDireita(idx));
            artigo.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    selecionarSessaoDireita(idx);
                }
            });

            painelRegistros.appendChild(artigo);
        });
    }

    // Coluna 2 (Centro): escolha de uma das 3 abas da sessão selecionada
    function escolherAbaCentro(item) {
        if (!sessaoSelecionada) {
            mensagem.textContent = "Selecione primeiro uma sessão nos Registros de triagens à direita.";
            return;
        }

        abaEscolhida = item.dataset.aba;

        itensAbas.forEach(outro => {
            const selecionado = outro === item;
            outro.classList.toggle("selecionado", selecionado);
            outro.setAttribute("aria-pressed", String(selecionado));
        });

        botaoAbrir.disabled = false;
        if (botaoImprimir) botaoImprimir.disabled = false;
        mensagem.textContent = item.querySelector("span").textContent + " selecionado. Clique em Abrir para visualizar ou em Imprimir.";
    }

    // Monta os dados detalhados da aba escolhida para a sessão selecionada
    function montarDadosAbaSessao(sessao, aba) {
        const { data, hora } = extrairDataHora(sessao);
        const profNome = sessao.profissionalNome || "Profissional";
        const profCrefito = sessao.profissionalCrefito ? ` · CREFITO ${sessao.profissionalCrefito}` : "";
        const num = sessao.numeroSessao || sessao.numeroTriagem || 1;
        const responsavel = `${profNome}${profCrefito} · Sessão #${num} · ${data} - ${hora}`;

        if (aba === "questionario") {
            const q = sessao.questionario || sessao.respostas || {};
            const regiao = TEXTOS_REGIAO[q.regiaoEletrodos] || q.regiaoEletrodos || "—";
            const lado = TEXTOS_LADO[q.lado] ? ` (${TEXTOS_LADO[q.lado]})` : "";

            return {
                titulo: "Questionário de segurança",
                responsavel,
                linhas: [
                    ["Avaliação profissional", TEXTOS_SIM_NAO[q.avaliacaoProfissional] || q.avaliacaoProfissional || "—"],
                    ["Região dos eletrodos", `${regiao}${lado}`],
                    ["Tecido neoplásico", TEXTOS_SIM_NAO[q.neoplasia] || q.neoplasia || "—"],
                    ["Integridade da pele", TEXTOS_SIM_NAO[q.pele] || q.pele || "—"],
                    ["Sensibilidade na região", TEXTOS_SENSIBILIDADE[q.sensibilidade] || q.sensibilidade || "—"],
                    ["Comunicação de desconforto", TEXTOS_SIM_NAO[q.comunicacao] || q.comunicacao || "—"],
                    ["Dispositivos eletrônicos implantados", TEXTOS_SIM_NAO[q.dispositivo] || q.dispositivo || "—"],
                    ["Gestação", TEXTOS_SIM_NAO[q.gestacao] || q.gestacao || "—"],
                    ["Implantes metálicos locais", TEXTOS_SIM_NAO[q.metal] || q.metal || "—"],
                    ["Circulação / vascular", TEXTOS_SIM_NAO[q.vascular] || q.vascular || "—"],
                    ["Histórico neurológico", TEXTOS_SIM_NAO[q.epilepsia] || q.epilepsia || "—"],
                    ["Condição cardiovascular", TEXTOS_SIM_NAO[q.cardiaco] || q.cardiaco || "—"],
                    ["Cirurgia ou fratura recente", TEXTOS_SIM_NAO[q.cirurgia] || q.cirurgia || "—"]
                ]
            };
        }

        if (aba === "tens") {
            const usouTens = Boolean(sessao.usouTens || sessao.tens);
            if (!usouTens) {
                return {
                    titulo: "Mapeamento TENS",
                    responsavel,
                    linhas: [
                        ["Situação", "O Mapeamento TENS não foi preenchido nesta sessão."]
                    ]
                };
            }

            const t = sessao.tens || sessao.respostas || {};
            return {
                titulo: "Mapeamento TENS",
                responsavel,
                linhas: [
                    ["Localização da dor", t.localizacaoDor || "—"],
                    ["Nível da dor hoje", TEXTOS_DOR[t.dor] || t.dor || "—"],
                    ["Duração da dor", TEXTOS_CRONICIDADE[t.cronicidade] || t.cronicidade || "—"],
                    ["Mecanismo predominante", TEXTOS_TIPO_DOR[t.tipoDor] || t.tipoDor || "—"],
                    ["Objetivo", TEXTOS_OBJETIVO_TENS[t.objetivoTens] || t.objetivoTens || "—"],
                    ["Ponto-gatilho miofascial", TEXTOS_SIM_NAO[t.pontoGatilho] || t.pontoGatilho || "—"],
                    ["Tolerância à sensação elétrica", TEXTOS_TOLERANCIA_TENS[t.toleranciaTens] || t.toleranciaTens || "—"],
                    ["Equipamento", TEXTOS_EQUIPAMENTO_TENS[t.equipamentoTens] || t.equipamentoTens || "—"],
                    ["Teste supervisionado", TEXTOS_TESTE_TENS[t.testeTens] || t.testeTens || "—"],
                    ["Resultado da calculadora", TEXTOS_ESTADOS[sessao.resultadoTens] || sessao.resultadoTens || "Registrado"]
                ]
            };
        }

        if (aba === "fes") {
            const usouFes = Boolean(sessao.usouFes || sessao.fes);
            if (!usouFes) {
                return {
                    titulo: "Mapeamento FES",
                    responsavel,
                    linhas: [
                        ["Situação", "O Mapeamento FES não foi preenchido nesta sessão."]
                    ]
                };
            }

            const f = sessao.fes || sessao.respostas || {};
            return {
                titulo: "Mapeamento FES",
                responsavel,
                linhas: [
                    ["Condição clínica", TEXTOS_CONDICAO_FES[f.condicaoFes] || f.condicaoFes || "—"],
                    ["Condição do tecido muscular", TEXTOS_TECIDO_FES[f.tecidoMuscular] || f.tecidoMuscular || "—"],
                    ["Inervação periférica", TEXTOS_INERVACAO_FES[f.inervacao] || f.inervacao || "—"],
                    ["Grau de força muscular atual", TEXTOS_FORCA_FES[f.forcaMuscular] || f.forcaMuscular || "—"],
                    ["Limitação da amplitude articular passiva", TEXTOS_NIVEL_FES[f.amplitude] || f.amplitude || "—"],
                    ["Espasticidade ou alteração do tônus", TEXTOS_NIVEL_FES[f.espasticidade] || f.espasticidade || "—"],
                    ["Movimento desejado", TEXTOS_MOVIMENTO_FES[f.movimento] || f.movimento || "—"],
                    ["Objetivo do tratamento", TEXTOS_OBJETIVO_FES[f.objetivoFes] || f.objetivoFes || "—"],
                    ["Acionamento da estimulação", TEXTOS_ACIONAMENTO_FES[f.acionamento] || f.acionamento || "—"],
                    ["Resposta no teste supervisionado", TEXTOS_RESPOSTA_FES[f.respostaTeste] || f.respostaTeste || "—"],
                    ["Tolerância", TEXTOS_TOLERANCIA_FES[f.toleranciaFes] || f.toleranciaFes || "—"],
                    ["Fadiga durante a estimulação", TEXTOS_NIVEL_FES[f.fadiga] || f.fadiga || "—"],
                    ["Equipamento", TEXTOS_EQUIPAMENTO_FES[f.equipamentoFes] || f.equipamentoFes || "—"],
                    ["Resultado da calculadora", TEXTOS_ESTADOS[sessao.resultadoFes] || sessao.resultadoFes || "Registrado"]
                ]
            };
        }

        return null;
    }

    // ---------- Impressão com cabeçalho clínico padronizado ----------
    function imprimirTriagem() {
        if (!sessaoSelecionada) {
            mensagem.textContent = "Selecione uma sessão à direita antes de imprimir.";
            return;
        }

        const janela = window.open("", "_blank", "popup");
        if (!janela) {
            mensagem.textContent = "Permita a abertura da janela de impressão neste site.";
            return;
        }

        janela.opener = null;
        const pagina = janela.document;
        pagina.documentElement.lang = "pt-BR";
        pagina.title = "Triagem Fisioterapêutica — ElectroFisio";

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
                padding: 5px 9px;
                text-align: left;
                vertical-align: top;
            }
            table.tabela-dados th {
                width: 40%;
                background: #F4F7F6;
                color: #263C35;
                font-weight: 700;
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
        `;
        pagina.head.appendChild(estilo);

        const dadosSessao = sessaoSelecionada.dados || sessaoSelecionada.respostas || {};
        const nomePaciente = (pacienteAtual && pacienteAtual.nome) || dadosSessao.nome || sessaoSelecionada.pacienteNome || "—";
        const maePaciente = (pacienteAtual && pacienteAtual.mae) || dadosSessao.mae || "Não informada";
        const cpfPaciente = formatarCpf((pacienteAtual && (pacienteAtual.cpfNumeros || pacienteAtual.cpf)) || sessaoSelecionada.cpfNumeros || sessaoSelecionada.cpf);
        const nascPaciente = (pacienteAtual && pacienteAtual.nascimento) || dadosSessao.nascimento || "";
        const codigoPaciente = somenteNumeros(cpfPaciente).slice(0, 8) || "00000001";

        const profNome = sessaoSelecionada.profissionalNome || (usuarioLogado && usuarioLogado.nome) || "Profissional";
        const profCrefito = sessaoSelecionada.profissionalCrefito || (usuarioLogado && (usuarioLogado.crefito || usuarioLogado.ra)) || "Não informado";
        const especialidade = (usuarioLogado && usuarioLogado.especialidade) || "Fisioterapia";

        const numSessao = String(sessaoSelecionada.numeroSessao || sessaoSelecionada.numeroTriagem || 1).padStart(7, "0");
        const { data, hora } = extrairDataHora(sessaoSelecionada);
        const dataHoraTexto = `${data} ${hora}`;

        const secoesParaImprimir = [];
        if (abaEscolhida) {
            const bloco = montarDadosAbaSessao(sessaoSelecionada, abaEscolhida);
            if (bloco) secoesParaImprimir.push(bloco);
        } else {
            secoesParaImprimir.push(montarDadosAbaSessao(sessaoSelecionada, "questionario"));
            if (sessaoSelecionada.usouTens || sessaoSelecionada.tens) {
                secoesParaImprimir.push(montarDadosAbaSessao(sessaoSelecionada, "tens"));
            }
            if (sessaoSelecionada.usouFes || sessaoSelecionada.fes) {
                secoesParaImprimir.push(montarDadosAbaSessao(sessaoSelecionada, "fes"));
            }
        }

        const tituloPrincipal = abaEscolhida && secoesParaImprimir[0]
            ? `TRIAGEM — ${secoesParaImprimir[0].titulo}`
            : "TRIAGEM FISIOTERAPÊUTICA";

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
        h1.textContent = tituloPrincipal;
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
            ["ATENDIMENTO:", numSessao, false],
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

        // Seções de respostas
        secoesParaImprimir.forEach(secao => {
            if (!secao) return;
            const h2 = pagina.createElement("h2");
            h2.className = "secao-titulo";
            h2.textContent = secao.titulo;

            const tabela = pagina.createElement("table");
            tabela.className = "tabela-dados";
            const tbody = pagina.createElement("tbody");

            secao.linhas.forEach(([rotulo, valor]) => {
                const tr = pagina.createElement("tr");
                const th = pagina.createElement("th");
                th.textContent = rotulo;
                const td = pagina.createElement("td");
                td.textContent = valor;
                tr.append(th, td);
                tbody.appendChild(tr);
            });

            tabela.appendChild(tbody);
            pagina.body.append(h2, tabela);
        });

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
        pagina.body.appendChild(assBox);

        janela.focus();
        janela.print();
    }

    function abrirDocumentoAba() {
        if (!sessaoSelecionada || !abaEscolhida) return;

        const dados = montarDadosAbaSessao(sessaoSelecionada, abaEscolhida);
        if (!dados) return;

        documento.replaceChildren();

        const titulo = document.createElement("h2");
        titulo.textContent = dados.titulo;

        const responsavel = document.createElement("p");
        responsavel.className = "responsavel-triagem";
        responsavel.textContent = "Registrado por " + dados.responsavel;

        const tabela = document.createElement("dl");
        tabela.className = "dados-triagem";

        dados.linhas.forEach(([rotulo, valor]) => {
            const termo = document.createElement("dt");
            termo.textContent = rotulo;
            const descricao = document.createElement("dd");
            descricao.textContent = valor;
            tabela.append(termo, descricao);
        });

        const barraBotoes = document.createElement("div");
        barraBotoes.className = "acoes-triagens";

        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "botao-triagens";
        fechar.textContent = "Fechar";
        fechar.addEventListener("click", () => {
            documento.hidden = true;
            botaoAbrir.focus();
        });

        const imprimirDoc = document.createElement("button");
        imprimirDoc.type = "button";
        imprimirDoc.className = "botao-triagens principal";
        imprimirDoc.textContent = "Imprimir";
        imprimirDoc.addEventListener("click", imprimirTriagem);

        barraBotoes.append(fechar, imprimirDoc);

        documento.append(titulo, responsavel, tabela, barraBotoes);
        documento.hidden = false;
        documento.focus();
        mensagem.textContent = dados.titulo + " aberto abaixo (somente leitura).";
    }

    itensAbas.forEach(item => {
        item.addEventListener("click", () => escolherAbaCentro(item));

        item.addEventListener("dblclick", () => {
            escolherAbaCentro(item);
            abrirDocumentoAba();
        });
    });

    botaoAbrir.addEventListener("click", abrirDocumentoAba);

    if (botaoImprimir) {
        botaoImprimir.addEventListener("click", imprimirTriagem);
    }

    // Carrega dados do paciente e as 3 últimas sessões do Firebase
    async function carregarTelaTriagens() {
        atualizarOpcoesCentro();

        let paciente = obterPacienteInicial();

        if (!paciente || !paciente.cpfNumeros) {
            renderizarDadosPacienteEsquerda(null);
            renderizarRegistrosDireita([]);
            mensagem.textContent = "Nenhum paciente selecionado em Pacientes.";
            return;
        }

        const cpf = paciente.cpfNumeros;
        pacienteAtual = paciente;
        atualizarLinksMenuLateral(cpf);
        renderizarDadosPacienteEsquerda(paciente);
        mensagem.textContent = "Carregando sessões do paciente...";

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
            }

            const qTriagens = query(
                collection(db, "triagens"),
                where("cpfNumeros", "==", cpf)
            );
            const snapTriagens = await getDocs(qTriagens);

            const lista = [];
            snapTriagens.forEach(docSnap => {
                lista.push({ id: docSnap.id, ...docSnap.data() });
            });

            lista.sort((a, b) => {
                const diffTempo = (b.criadoEmMs || 0) - (a.criadoEmMs || 0);
                if (diffTempo !== 0) return diffTempo;
                return (b.numeroSessao || 0) - (a.numeroSessao || 0);
            });

            if (lista.length > 0) {
                const dadosMaisRecentes = lista[0].dados || lista[0].respostas || {};
                paciente = {
                    ...dadosMaisRecentes,
                    ...paciente,
                    nome: paciente.nome || dadosMaisRecentes.nome || lista[0].pacienteNome,
                    mae: paciente.mae || dadosMaisRecentes.mae || "",
                    cpfNumeros: cpf,
                    cpf: formatarCpf(cpf)
                };
            }

            pacienteAtual = paciente;

            try {
                localStorage.setItem("electrofisio-paciente-selecionado", JSON.stringify(paciente));
            } catch (erro) {
                // Ignora se armazenamento local estiver bloqueado
            }

            renderizarDadosPacienteEsquerda(paciente);
            renderizarRegistrosDireita(lista);

            if (lista.length === 0) {
                mensagem.textContent = "Nenhuma sessão salva para este paciente. Clique em Novo para iniciar.";
            } else {
                mensagem.textContent = "Selecione uma das sessões à direita para escolher a aba.";
            }

        } catch (erro) {
            console.error("Erro ao carregar triagens do Firebase:", erro);
            mensagem.textContent = "Erro ao carregar as sessões do banco de dados.";
        }
    }

    await carregarTelaTriagens();
});
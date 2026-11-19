import {
    db,
    collection,
    getDocs,
    query,
    where
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {

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

        // Quando apenas o questionário foi preenchido -> "Triagem inicial"
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

        // Resultado do Mapeamento TENS
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

        // Resultado do Mapeamento FES
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

        // Se uma aba já estiver aberta abaixo, atualiza automaticamente para a sessão clicada
        if (!documento.hidden && abaEscolhida) {
            abrirDocumentoAba();
        } else {
            mensagem.textContent = `Sessão #${num} (${data} - ${hora}) selecionada. Escolha uma das 3 abas acima e clique em Abrir.`;
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
        mensagem.textContent = item.querySelector("span").textContent + " selecionado. Clique em Abrir para visualizar.";
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

        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "botao-triagens";
        fechar.textContent = "Fechar";
        fechar.addEventListener("click", () => {
            documento.hidden = true;
            botaoAbrir.focus();
        });

        documento.append(titulo, responsavel, tabela, fechar);
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
        renderizarDadosPacienteEsquerda(paciente);
        mensagem.textContent = "Carregando sessões do paciente...";

        try {
            // 1. Busca o cadastro completo do paciente (incluindo nome da mãe)
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

            // 2. Busca as sessões deste CPF na coleção "triagens"
            const qTriagens = query(
                collection(db, "triagens"),
                where("cpfNumeros", "==", cpf)
            );
            const snapTriagens = await getDocs(qTriagens);

            const lista = [];
            snapTriagens.forEach(docSnap => {
                lista.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Ordena da mais recente para a mais antiga
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
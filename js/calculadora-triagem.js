
// Calculadora da triagem (abas Mapeamento TENS e Mapeamento FES)
//
// Segue as especificações enviadas pela equipe de fisioterapia:
// - TENS: "Especificação técnica e clínica - Calculadora TENS", versão 2.0 (01/11/2026)
// - FES: "Guia completo para desenvolver a calculadora de FES" (01/11/2026)
//
// Regra principal: a calculadora NÃO prescreve. Ela confere a segurança, mostra protocolos
// de referência com a fonte e exige teste supervisionado e confirmação do profissional.
// Nunca preenche intensidade em mA.

const VERSAO_TENS = "Calculadora TENS v2.0 (especificação de 01/11/2026)";
const VERSAO_FES = "Calculadora FES v1.0 (guia de 01/11/2026)";

// Estados possíveis e o tom usado na tela
const ESTADOS = {
    EDUCATIVO: { rotulo: "Modo educativo", tom: "atencao" },
    DADOS_INSUFICIENTES: { rotulo: "Dados insuficientes", tom: "atencao" },
    NAO_PROSSEGUIR: { rotulo: "Não prosseguir nesta região", tom: "bloqueio" },
    AVALIACAO_NECESSARIA: { rotulo: "Avaliação necessária", tom: "bloqueio" },
    HARDWARE_NAO_VALIDADO: { rotulo: "Equipamento não validado", tom: "atencao" },
    INTERROMPER: { rotulo: "Interromper e reavaliar", tom: "bloqueio" },
    SEM_ASSOCIACAO_AUTOMATICA: { rotulo: "Sem associação automática", tom: "atencao" },
    SEM_PRESET_ESPECIFICO: { rotulo: "Sem preset específico", tom: "atencao" },
    SEM_PROTOCOLO_VALIDADO: { rotulo: "Sem protocolo validado", tom: "atencao" },
    TRILHA_NMES: { rotulo: "Trilha NMES", tom: "atencao" },
    REAVALIAR: { rotulo: "Reavaliar antes de configurar", tom: "atencao" },
    ESCOLHA_PROFISSIONAL: { rotulo: "Escolha profissional", tom: "revisao" },
    REVISAO_PROFISSIONAL: { rotulo: "Revisão profissional", tom: "revisao" },
    INCOMPATIVEL: { rotulo: "Incompatível com o aparelho", tom: "bloqueio" },
    CONFIRMADO_PELO_PROFISSIONAL: { rotulo: "Confirmado pelo profissional", tom: "ok" }
};

// ---------------------------------------------------------------
// Protocolos de referência
// ---------------------------------------------------------------

// Limites do aparelho de referência (Neurodyn II, manual do fabricante [23])
const APARELHO_TENS = {
    nome: "IBRAMED Neurodyn II",
    hz: [0.5, 250],
    us: [50, 500],
    minutos: [1, 60]
};

// Presets do fabricante (manual do Neurodyn II, programas 1, 2 e 3)
const PRESETS_TENS = {
    aguda: {
        id: "IBR-AGUDA-01",
        nome: "Neurodyn II — preset do fabricante: dor aguda",
        modo: "TENS convencional",
        hz: 170,
        us: 50,
        minutos: 30,
        eletrodos: "Área dolorosa; confirmar posicionamento e segurança com o profissional.",
        fonte: "Manual Neurodyn II, protocolo pré-programado 1 [23]"
    },
    cronica: {
        id: "IBR-CRONICA-02",
        nome: "Neurodyn II — preset do fabricante: dor crônica",
        modo: "TENS convencional",
        hz: 40,
        us: 150,
        minutos: 30,
        eletrodos: "Avaliar área e dermátomo; não posicionar sobre raiz nervosa sem avaliação.",
        fonte: "Manual Neurodyn II, protocolo pré-programado 2 [23]"
    },
    gatilho: {
        id: "IBR-GATILHO-03",
        nome: "Neurodyn II — preset do fabricante: ponto-gatilho",
        modo: "TENS convencional",
        hz: 10,
        us: 500,
        minutos: 2,
        eletrodos: "Sobre o ponto-gatilho confirmado; o manual cita eletrodos separados por cerca de 7 cm.",
        fonte: "Manual Neurodyn II, protocolo pré-programado 3 [23]"
    }
};

// Biblioteca informativa (faixas da literatura, sem associação a diagnóstico)
const BIBLIOTECA_TENS = [
    "TENS convencional: 50–130 Hz; 50–200 µs; intensidade forte, confortável e não dolorosa [24].",
    "TENS tipo acupuntura: 2–4 Hz; 100–400 µs; intensidade maior e tolerável [24, 25].",
    "Burst: trens de baixa frequência (~2–4 Hz) com pulsos internos de ~100–200 Hz [24]."
];

const PROTOCOLOS_FES = {
    dorsiflexao: {
        id: "FES-DORSI-01",
        nome: "Dorsiflexão na marcha (referência pós-AVC)",
        faixaHz: "30–50 Hz",
        faixaUs: "300 µs",
        acionamento: "Sincronizado à marcha: estimular no balanço do passo.",
        eletrodos: "Próximo ao nervo fibular comum e ao ponto motor do tibial anterior, com ajuste para dorsiflexão equilibrada.",
        evidencia: "Revisões e diretriz de FES e órtese pós-AVC [7, 10, 19]",
        limitacao: "Valores de exemplo; não são configuração automática para toda pessoa após AVC."
    },
    mao: {
        id: "FES-MAO-EDU",
        nome: "Função da mão (referência educacional)",
        faixaHz: "12–40 Hz",
        faixaUs: "200–350 µs",
        acionamento: "Conforme a tarefa (abrir a mão para soltar um objeto, preensão).",
        eletrodos: "Grupo extensor no compartimento posterior do antebraço; confirmar o ponto de melhor resposta.",
        evidencia: "Faixa educacional sem referência primária verificada no guia",
        limitacao: "Precisa ser confrontada com estudos da população, do músculo e da tarefa antes de uso clínico."
    }
};

// ---------------------------------------------------------------
// Leitura das respostas
// ---------------------------------------------------------------

const formularioCalculadora = document.getElementById("formularioTriagem");

function resposta(nome) {
    const campo = formularioCalculadora.elements[nome];
    return campo ? campo.value : "";
}

function textoOpcao(nome) {
    const marcado = formularioCalculadora.querySelector("[name='" + nome + "']:checked");
    if (marcado) {
        return marcado.parentElement.textContent.trim();
    }
    const lista = formularioCalculadora.elements[nome];
    if (lista && lista.tagName === "SELECT" && lista.value) {
        return lista.selectedOptions[0].textContent;
    }
    return "—";
}

// Perguntas obrigatórias do questionário de segurança
const PERGUNTAS_SEGURANCA = {
    avaliacaoProfissional: "Avaliação profissional",
    regiaoEletrodos: "Região dos eletrodos",
    neoplasia: "Tecido neoplásico",
    pele: "Integridade da pele",
    sensibilidade: "Sensibilidade na região",
    comunicacao: "Comunicação de desconforto",
    dispositivo: "Dispositivos implantados",
    gestacao: "Gestação",
    metal: "Implantes metálicos",
    vascular: "Circulação / vascular",
    epilepsia: "Histórico neurológico",
    cardiaco: "Condição cardiovascular",
    cirurgia: "Cirurgia ou fratura recente"
};

function faltando(perguntas) {
    return Object.keys(perguntas)
        .filter(nome => !resposta(nome))
        .map(nome => perguntas[nome]);
}

// Confere o questionário de segurança e devolve bloqueios e avaliações pendentes
function conferirSeguranca(modalidade) {
    const regiao = resposta("regiaoEletrodos");
    const bloqueios = [];
    const avaliacoes = [];
    const avisos = [];

    // Regiões proibidas (S6)
    if (regiao === "cabeca") {
        bloqueios.push("Cabeça e olhos: não posicionar eletrodos sobre os olhos nem fazer aplicação transcraniana convencional.");
    }
    if (regiao === "pescocoAnterior") {
        bloqueios.push("Pescoço anterior/lateral: risco sobre o seio carotídeo.");
    }
    if (regiao === "torax") {
        bloqueios.push("Tórax anterior: a corrente não pode atravessar o tórax nem a região cardíaca.");
    }

    // Condições na região (S4)
    if (resposta("neoplasia") === "sim") bloqueios.push("Tumor ativo na região de aplicação.");
    if (resposta("pele") === "sim") bloqueios.push("Pele lesionada, infectada ou com sangramento na região.");
    if (resposta("vascular") === "sim") bloqueios.push("Trombose ativa ou suspeita na região: encaminhar para avaliação médica.");

    // Gestação (S2)
    const gestacao = resposta("gestacao");
    if (gestacao === "sim" || gestacao === "nao_avaliado") {
        if (["abdome", "pelve", "lombar"].includes(regiao)) {
            bloqueios.push("Gestação (ou possibilidade): não aplicar em abdome, pelve ou lombar sem orientação obstétrica.");
        } else {
            avaliacoes.push(modalidade === "fes"
                ? "Gestação: a segurança da FES não está estabelecida; discutir com o obstetra."
                : "Gestação: avaliar local e orientação obstétrica.");
        }
    }

    // Epilepsia (S3)
    const epilepsia = resposta("epilepsia");
    if (epilepsia === "sim" && ["cabeca", "pescocoAnterior", "cervical"].includes(regiao)) {
        bloqueios.push("Epilepsia: não aplicar em cabeça ou pescoço.");
    } else if (epilepsia === "sim") {
        avaliacoes.push("Epilepsia: avaliar o controle das crises e a região estimulada.");
    }

    // Dispositivos implantados (S1)
    if (resposta("dispositivo") === "sim") avaliacoes.push("Dispositivo eletrônico implantado: exige liberação da equipe responsável (cardiologista).");
    if (resposta("dispositivo") === "nao_sabe") avaliacoes.push("Dispositivo implantado desconhecido: confirmar antes de prosseguir.");

    if (resposta("metal") === "sim") avaliacoes.push("Implante metálico na região: avaliar com o profissional.");
    if (resposta("cardiaco") === "sim") avaliacoes.push("Condição cardiovascular: avaliar antes" + (modalidade === "fes" ? " e conferir a tolerância ao exercício." : "."));
    if (resposta("cirurgia") === "sim") {
        avaliacoes.push(modalidade === "fes"
            ? "Cirurgia, fratura ou instabilidade recente: a contração não pode prejudicar a cicatrização."
            : "Cirurgia ou fratura recente na região: avaliar antes.");
    }

    // Sensibilidade e comunicação (S5)
    const sensibilidade = resposta("sensibilidade");
    const comunicacao = resposta("comunicacao");

    if (modalidade === "tens") {
        if (sensibilidade === "diminuida" || sensibilidade === "ausente") {
            avaliacoes.push("Sensibilidade alterada: a TENS depende da percepção do paciente para ajustar a intensidade.");
        }
        if (comunicacao === "nao") {
            avaliacoes.push("Paciente não consegue comunicar desconforto: não prosseguir com ajuste sensorial.");
        }
    } else {
        if (sensibilidade === "ausente") {
            avisos.push("Sensibilidade ausente: não impede a FES, mas exige parâmetros individualizados e vigilância da pele.");
        }
        if (comunicacao === "nao") {
            avaliacoes.push("Paciente não consegue comunicar desconforto: definir supervisão próxima e monitoramento.");
        }
    }
    if (comunicacao === "auxilio") {
        avisos.push("Comunicação com auxílio: manter supervisão direta durante toda a sessão.");
    }

    // Itens não avaliados (R01)
    Object.keys(PERGUNTAS_SEGURANCA).forEach(nome => {
        if (resposta(nome) === "nao_avaliado" && nome !== "gestacao") {
            avaliacoes.push(PERGUNTAS_SEGURANCA[nome] + ": não avaliado.");
        }
    });

    return { bloqueios: bloqueios, avaliacoes: avaliacoes, avisos: avisos };
}

// ---------------------------------------------------------------
// Calculadora TENS
// ---------------------------------------------------------------

function dentroDosLimites(preset) {
    return preset.hz >= APARELHO_TENS.hz[0] && preset.hz <= APARELHO_TENS.hz[1] &&
        preset.us >= APARELHO_TENS.us[0] && preset.us <= APARELHO_TENS.us[1] &&
        preset.minutos >= APARELHO_TENS.minutos[0] && preset.minutos <= APARELHO_TENS.minutos[1];
}

function calcularTens() {
    const resultado = { versao: VERSAO_TENS, motivos: [], avisos: [], protocolos: [], biblioteca: [] };

    const pendentes = faltando(PERGUNTAS_SEGURANCA).concat(faltando({
        cronicidade: "Duração da dor",
        tipoDor: "Mecanismo da dor",
        pontoGatilho: "Ponto-gatilho",
        toleranciaTens: "Tolerância",
        equipamentoTens: "Equipamento",
        testeTens: "Teste supervisionado"
    }));

    if (pendentes.length) {
        resultado.estado = "DADOS_INSUFICIENTES";
        resultado.mensagem = "Responda todos os campos antes de calcular. O sistema não preenche respostas por padrão.";
        resultado.motivos = pendentes.map(item => "Falta responder: " + item);
        return resultado;
    }

    // R00: sem avaliação profissional, só modo educativo
    if (resposta("avaliacaoProfissional") === "nao") {
        resultado.estado = "EDUCATIVO";
        resultado.mensagem = "Sem avaliação de um profissional habilitado, a calculadora mostra apenas a biblioteca informativa, sem proposta de parâmetros.";
        resultado.biblioteca = BIBLIOTECA_TENS;
        return resultado;
    }

    const seguranca = conferirSeguranca("tens");
    resultado.avisos = seguranca.avisos;

    if (seguranca.bloqueios.length) {
        resultado.estado = "NAO_PROSSEGUIR";
        resultado.mensagem = "Não é possível sugerir parâmetros de TENS para esta região. Escolha outro local apenas após avaliação profissional.";
        resultado.motivos = seguranca.bloqueios.concat(seguranca.avaliacoes);
        return resultado;
    }

    if (seguranca.avaliacoes.length) {
        resultado.estado = "AVALIACAO_NECESSARIA";
        resultado.mensagem = "Não é possível sugerir parâmetros de TENS com as informações fornecidas. É necessária avaliação profissional antes de prosseguir.";
        resultado.motivos = seguranca.avaliacoes;
        return resultado;
    }

    // R03: aparelho sem perfil verificado
    if (resposta("equipamentoTens") !== "neurodyn2") {
        resultado.estado = "HARDWARE_NAO_VALIDADO";
        resultado.mensagem = "O aparelho não tem perfil verificado. A calculadora mostra apenas a informação bibliográfica e não libera configuração.";
        resultado.biblioteca = BIBLIOTECA_TENS;
        return resultado;
    }

    // R11: teste com desconforto ou evento adverso
    const teste = resposta("testeTens");
    if (teste === "desconforto" || teste === "evento") {
        resultado.estado = "INTERROMPER";
        resultado.mensagem = "Interromper o teste. Reavaliar o local, o contato dos eletrodos, os parâmetros e a indicação, e registrar o ocorrido.";
        return resultado;
    }

    // R04 a R07: candidatos apenas pelos rótulos dos presets
    const mecanismo = resposta("tipoDor");
    const mecanismoIncerto = ["neuropatica", "mista", "indefinido"].includes(mecanismo);
    const candidatos = [];

    if (resposta("pontoGatilho") === "confirmado") {
        candidatos.push(PRESETS_TENS.gatilho);
    }

    if (!mecanismoIncerto) {
        if (resposta("cronicidade") === "aguda") candidatos.push(PRESETS_TENS.aguda);
        if (resposta("cronicidade") === "cronica") candidatos.push(PRESETS_TENS.cronica);
    }

    if (candidatos.length === 0) {
        if (mecanismoIncerto) {
            resultado.estado = "SEM_ASSOCIACAO_AUTOMATICA";
            resultado.mensagem = "Dor neuropática, mista ou de mecanismo indefinido não tem preset específico comprovado. O sistema não converte o caso em outro preset nem inventa protocolo.";
        } else {
            resultado.estado = "SEM_PRESET_ESPECIFICO";
            resultado.mensagem = "Não foi identificado protocolo pré-programado compatível com as informações fornecidas. Não serão atribuídos valores automaticamente.";
        }
        resultado.biblioteca = BIBLIOTECA_TENS;
        return resultado;
    }

    // R10: confere os limites do aparelho
    const incompativel = candidatos.filter(preset => !dentroDosLimites(preset));
    if (incompativel.length) {
        resultado.estado = "INCOMPATIVEL";
        resultado.mensagem = "Parâmetro fora dos limites do aparelho. A configuração foi bloqueada.";
        return resultado;
    }

    resultado.protocolos = candidatos;
    resultado.estado = candidatos.length > 1 ? "ESCOLHA_PROFISSIONAL" : "REVISAO_PROFISSIONAL";
    resultado.mensagem = candidatos.length > 1
        ? "Mais de um preset pode se aplicar. A escolha é do profissional; o sistema não escolhe."
        : "Preset do fabricante para revisão. Não representa prescrição automática nem eficácia superior comprovada.";

    if (teste === "nao_realizado") {
        resultado.avisos.push("Pendente de confirmação: realize o teste supervisionado antes de usar o protocolo.");
    } else if (teste === "insuficiente") {
        resultado.avisos.push("Resposta insuficiente no teste: reavalie o local, o contato e a indicação antes de confirmar.");
    } else if (teste === "confortavel" && resposta("toleranciaTens") !== "desconforto") {
        // Com mais de um candidato, só confirma depois que o profissional escolher
        resultado.testeAprovado = true;
        resultado.podeConfirmar = candidatos.length === 1;
    }

    if (resposta("toleranciaTens") === "desconforto") {
        resultado.avisos.push("Tolerância limitada: ajuste a intensidade aos poucos, sempre sem dor.");
    }

    return resultado;
}

// ---------------------------------------------------------------
// Calculadora FES
// ---------------------------------------------------------------

function calcularFes() {
    const resultado = { versao: VERSAO_FES, motivos: [], avisos: [], protocolos: [], biblioteca: [] };

    const pendentes = faltando(PERGUNTAS_SEGURANCA).concat(faltando({
        condicaoFes: "Condição clínica",
        tecidoMuscular: "Condição do tecido muscular",
        inervacao: "Inervação periférica",
        forcaMuscular: "Grau de força",
        movimento: "Movimento desejado",
        objetivoFes: "Objetivo do tratamento",
        acionamento: "Acionamento",
        respostaTeste: "Resposta no teste",
        toleranciaFes: "Tolerância",
        fadiga: "Fadiga",
        equipamentoFes: "Equipamento"
    }));

    if (pendentes.length) {
        resultado.estado = "DADOS_INSUFICIENTES";
        resultado.mensagem = "Responda todos os campos antes de calcular. O sistema não preenche respostas por padrão.";
        resultado.motivos = pendentes.map(item => "Falta responder: " + item);
        return resultado;
    }

    if (resposta("avaliacaoProfissional") === "nao") {
        resultado.estado = "EDUCATIVO";
        resultado.mensagem = "Sem avaliação de um profissional habilitado, a calculadora não gera parâmetros. Consulte a aba Parâmetros para estudar as faixas.";
        return resultado;
    }

    // 1. Segurança
    const seguranca = conferirSeguranca("fes");
    resultado.avisos = seguranca.avisos;

    if (resposta("tecidoMuscular") === "posOperatorio") {
        seguranca.avaliacoes.push("Pós-operatório imediato: respeitar as restrições do cirurgião antes de produzir contrações.");
    }

    if (seguranca.bloqueios.length) {
        resultado.estado = "NAO_PROSSEGUIR";
        resultado.mensagem = "Não foi possível gerar parâmetros para esta região. Escolha outro local apenas após avaliação profissional.";
        resultado.motivos = seguranca.bloqueios.concat(seguranca.avaliacoes);
        return resultado;
    }

    if (seguranca.avaliacoes.length) {
        resultado.estado = "AVALIACAO_NECESSARIA";
        resultado.mensagem = "Há condições que exigem avaliação antes da FES. O sistema não gerará parâmetros até essa avaliação.";
        resultado.motivos = seguranca.avaliacoes;
        return resultado;
    }

    // 2. Inervação periférica
    const inervacao = resposta("inervacao");
    if (inervacao === "desnervacao" || inervacao === "nao_avaliado") {
        resultado.estado = "AVALIACAO_NECESSARIA";
        resultado.mensagem = "A FES convencional precisa de inervação motora periférica funcional.";
        resultado.motivos = [inervacao === "desnervacao"
            ? "Suspeita de desnervação: encaminhar para avaliação específica."
            : "Inervação periférica não avaliada."];
        return resultado;
    }

    // Sem tarefa funcional não é FES
    if (resposta("objetivoFes") === "fortalecimento") {
        resultado.estado = "TRILHA_NMES";
        resultado.mensagem = "O objetivo é fortalecimento sem tarefa funcional: isso é NMES, não FES. Considere a trilha de estimulação neuromuscular.";
        resultado.biblioteca = ["Referência educativa de NMES: 20–50 Hz e 200–300 µs, com repouso suficiente para reduzir a fadiga [10]."];
        return resultado;
    }

    // 3 e 4. Tarefa e protocolo compatível
    const movimento = resposta("movimento");
    let protocolo = null;

    if (movimento === "dorsiflexao" && resposta("condicaoFes") === "avc") {
        protocolo = PROTOCOLOS_FES.dorsiflexao;
    } else if (movimento === "punhoDedos" || movimento === "preensao") {
        protocolo = PROTOCOLOS_FES.mao;
    }

    if (!protocolo) {
        resultado.estado = "SEM_PROTOCOLO_VALIDADO";
        resultado.mensagem = "Não foi identificado protocolo validado para este perfil. É necessária avaliação profissional específica. O sistema não gerará parâmetros automaticamente.";
        if (movimento === "dorsiflexao") {
            resultado.motivos.push("O protocolo de dorsiflexão cadastrado é de referência pós-AVC; para outras condições ainda não há protocolo aprovado.");
        }
        return resultado;
    }

    // Equipamento
    if (resposta("equipamentoFes") !== "confirmado") {
        resultado.estado = "HARDWARE_NAO_VALIDADO";
        resultado.mensagem = "Equipamento não confirmado: o protocolo aparece só como referência, sem configuração liberada.";
        resultado.protocolos = [protocolo];
        return resultado;
    }

    // Avisos que mudam a decisão
    if (movimento === "dorsiflexao" && resposta("acionamento") !== "marcha") {
        resultado.avisos.push("Para auxiliar a marcha, a estimulação precisa ser sincronizada ao passo. Sem gatilho, o aparelho não deve ser apresentado como sistema automático de marcha.");
    }
    if (resposta("amplitude") === "importante") {
        resultado.avisos.push("Limitação importante da amplitude: contraturas fixas podem impedir o movimento esperado.");
    }
    if (resposta("espasticidade") === "importante") {
        resultado.avisos.push("Espasticidade importante: pode interferir na resposta e na seletividade do movimento.");
    }
    if (["4", "5"].includes(resposta("forcaMuscular"))) {
        resultado.avisos.push("Força funcional preservada: avalie se a FES é necessária para esta tarefa.");
    }
    if (resposta("fadiga") === "importante") {
        resultado.avisos.push("Fadiga importante: revise ON/OFF, pausas e o tempo de sessão; não aumente a corrente continuamente.");
    }
    if (resposta("toleranciaFes") === "limitada") {
        resultado.avisos.push("Tolerância limitada: reveja posicionamento e rampas antes de aumentar a intensidade.");
    }

    // 5. Teste supervisionado
    const teste = resposta("respostaTeste");
    resultado.protocolos = [protocolo];

    if (teste === "ausente" || teste === "inadequada") {
        resultado.estado = "REAVALIAR";
        resultado.mensagem = teste === "ausente"
            ? "Sem resposta no teste: revise o posicionamento, o ponto motor e a inervação antes de configurar."
            : "Resposta inadequada ou compensatória: revise o posicionamento dos eletrodos antes de aumentar a intensidade.";
        return resultado;
    }

    resultado.estado = "REVISAO_PROFISSIONAL";
    resultado.mensagem = "Protocolo de referência para revisão. A configuração final é individual e depende do teste supervisionado.";

    if (teste === "nao_testada") {
        resultado.avisos.push("Pendente de confirmação: realize o teste supervisionado (contração, movimento, conforto e fadiga).");
    } else if (teste === "insuficiente") {
        resultado.avisos.push("Contração insuficiente: reavalie posição e parâmetros; retorne às etapas anteriores se necessário.");
    } else if (teste === "funcional" && resposta("toleranciaFes") === "boa" && resposta("fadiga") !== "importante") {
        resultado.podeConfirmar = true;
    }

    return resultado;
}

// ---------------------------------------------------------------
// Tela de resultado
// ---------------------------------------------------------------

function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function lista(itens, classe) {
    const ul = criar("ul", classe);
    itens.forEach(item => ul.appendChild(criar("li", "", item)));
    return ul;
}

function linhaDado(rotulo, valor) {
    const linha = document.createDocumentFragment();
    linha.append(criar("dt", "", rotulo), criar("dd", "", valor));
    return linha;
}

function nomeProfissional() {
    try {
        const salvos = JSON.parse(localStorage.getItem("electrofisio-dados-perfil")) || {};
        return (salvos.profissional && salvos.profissional.nome) || "Ana Souza";
    } catch (erro) {
        return "Ana Souza";
    }
}

function cartaoProtocoloTens(preset) {
    const cartao = criar("article", "protocolo-calculado");
    cartao.appendChild(criar("h4", "", "Protocolo de referência: " + preset.id));

    const dados = criar("dl", "dados-protocolo");
    dados.append(
        linhaDado("Nome", preset.nome),
        linhaDado("Modo", preset.modo),
        linhaDado("Frequência", preset.hz + " Hz"),
        linhaDado("Largura de pulso", preset.us + " µs"),
        linhaDado("Duração", preset.minutos + " min"),
        linhaDado("Intensidade", "Ajustar individualmente até sensação forte, confortável e não dolorosa, sob supervisão."),
        linhaDado("Eletrodos", preset.eletrodos),
        linhaDado("Tipo de evidência", "Preset do fabricante"),
        linhaDado("Fonte", preset.fonte),
        linhaDado("Equipamento compatível", APARELHO_TENS.nome)
    );
    cartao.appendChild(dados);
    return cartao;
}

function cartaoProtocoloFes(protocolo) {
    const cartao = criar("article", "protocolo-calculado");
    cartao.appendChild(criar("h4", "", "Protocolo de referência: " + protocolo.id));

    const dados = criar("dl", "dados-protocolo");
    dados.append(
        linhaDado("Nome", protocolo.nome),
        linhaDado("Frequência", protocolo.faixaHz),
        linhaDado("Largura de pulso", protocolo.faixaUs),
        linhaDado("Intensidade", "Ajustar até o movimento funcional desejado, com tolerância; não existe mA universal."),
        linhaDado("Acionamento", protocolo.acionamento),
        linhaDado("Eletrodos", protocolo.eletrodos),
        linhaDado("Monitorar", "Resposta motora, conforto, pele e fadiga."),
        linhaDado("Evidência", protocolo.evidencia),
        linhaDado("Limitação", protocolo.limitacao)
    );
    cartao.appendChild(dados);
    return cartao;
}

function mostrarResultado(alvo, resultado, modalidade) {
    const estado = ESTADOS[resultado.estado];
    alvo.replaceChildren();
    alvo.hidden = false;

    const topo = criar("div", "topo-resultado");
    topo.append(
        criar("h3", "", "Resultado da calculadora " + modalidade.toUpperCase()),
        criar("span", "etiqueta-resultado " + estado.tom, estado.rotulo)
    );
    alvo.appendChild(topo);

    alvo.appendChild(criar("p", "mensagem-resultado", resultado.mensagem));

    if (resultado.motivos.length) {
        alvo.appendChild(criar("p", "subtitulo-resultado", "Motivos:"));
        alvo.appendChild(lista(resultado.motivos, "lista-motivos"));
    }

    resultado.protocolos.forEach(protocolo => {
        const cartao = modalidade === "tens" ? cartaoProtocoloTens(protocolo) : cartaoProtocoloFes(protocolo);

        // R09: com mais de um candidato, o profissional escolhe qual seguir
        if (resultado.estado === "ESCOLHA_PROFISSIONAL") {
            const escolher = criar("button", "botao-secundario botao-escolher", "Escolher este protocolo");
            escolher.type = "button";
            escolher.addEventListener("click", () => {
                resultado.protocolos = [protocolo];
                resultado.estado = "REVISAO_PROFISSIONAL";
                resultado.mensagem = "Protocolo escolhido pelo profissional para revisão. Não representa prescrição automática nem eficácia superior comprovada.";
                resultado.podeConfirmar = Boolean(resultado.testeAprovado);
                mostrarResultado(alvo, resultado, modalidade);
            });
            cartao.appendChild(escolher);
        }

        alvo.appendChild(cartao);
    });

    if (resultado.biblioteca.length) {
        alvo.appendChild(criar("p", "subtitulo-resultado", "Biblioteca informativa (faixas da literatura, não prescrição):"));
        alvo.appendChild(lista(resultado.biblioteca, "lista-biblioteca"));
    }

    if (resultado.avisos.length) {
        alvo.appendChild(criar("p", "subtitulo-resultado", "Atenção:"));
        alvo.appendChild(lista(resultado.avisos, "lista-avisos"));
    }

    // R12: teste tolerado e confirmação do profissional
    if (resultado.podeConfirmar) {
        const confirmar = criar("button", "botao-principal botao-confirmar", "Confirmar protocolo (profissional)");
        confirmar.type = "button";
        confirmar.addEventListener("click", () => {
            const etiqueta = alvo.querySelector(".etiqueta-resultado");
            etiqueta.className = "etiqueta-resultado ok";
            etiqueta.textContent = ESTADOS.CONFIRMADO_PELO_PROFISSIONAL.rotulo;

            const agora = new Date().toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            });
            confirmar.replaceWith(criar("p", "confirmacao-resultado",
                "Confirmado por " + nomeProfissional() + " em " + agora + ". Registre os parâmetros realmente usados e a resposta do paciente."));

            resultado.estado = "CONFIRMADO_PELO_PROFISSIONAL";
            ultimoResultado[modalidade] = resultado;
        });
        alvo.appendChild(confirmar);
    }

    // Campos sempre visíveis
    const rodape = criar("dl", "rodape-resultado");
    rodape.append(
        linhaDado("Data", new Date().toLocaleDateString("pt-BR")),
        linhaDado("Paciente", (resposta("nome") || "—") + " · CPF " + (resposta("cpf") || "—")),
        linhaDado("Profissional", nomeProfissional()),
        linhaDado("Região", textoOpcao("regiaoEletrodos") + (resposta("lado") ? " · " + textoOpcao("lado") : ""))
    );
    if (modalidade === "tens") {
        rodape.append(linhaDado("Dor antes (escala)", textoOpcao("dor")));
    } else {
        rodape.append(linhaDado("Movimento", textoOpcao("movimento")));
    }
    rodape.append(linhaDado("Versão", resultado.versao));
    alvo.appendChild(rodape);

    alvo.appendChild(criar("p", "aviso-resultado",
        "Ambiente educativo. A calculadora não aciona equipamentos e não substitui a avaliação e a decisão do fisioterapeuta."));

    alvo.focus();
}

// Último resultado de cada calculadora (usado ao salvar a triagem)
const ultimoResultado = { tens: null, fes: null };

document.getElementById("calcularTens").addEventListener("click", () => {
    ultimoResultado.tens = calcularTens();
    mostrarResultado(document.getElementById("resultadoTens"), ultimoResultado.tens, "tens");
});

document.getElementById("calcularFes").addEventListener("click", () => {
    ultimoResultado.fes = calcularFes();
    mostrarResultado(document.getElementById("resultadoFes"), ultimoResultado.fes, "fes");
});

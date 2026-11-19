import {
    db,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {

    const abas = ["dados", "questionario", "tens", "fes"];
    const NOMES_ABAS = {
        dados: "Dados",
        questionario: "Questionário",
        tens: "Mapeamento TENS",
        fes: "Mapeamento FES"
    };

    const botoesAbas = document.querySelectorAll(".aba-triagem");
    const paineis = document.querySelectorAll(".painel-aba");

    const botaoNovo = document.getElementById("botaoNovo");
    const botaoSalvar = document.getElementById("botaoSalvar");
    const botaoProximo = document.getElementById("botaoProximo");
    const botaoBuscar = document.getElementById("botaoBuscar");

    const formulario = document.getElementById("formularioTriagem");
    const campoBusca = document.getElementById("cpfBusca");
    const pacienteEncontrado = document.getElementById("pacienteEncontrado");
    const tituloPacienteLateral = document.getElementById("tituloPacienteLateral");
    const mensagemTriagem = document.getElementById("mensagemTriagem");

    let abaAtual = "dados";
    let cpfSelecionadoLateral = null;

    // CPF, telefone e e-mail do cadastro do paciente
    const validarCadastro = Validacao.prepararCampos(document.getElementById("aba-dados"));
    Validacao.prepararCampos(document.getElementById("cpfBusca").parentElement);

    // Campos mapeados por aba
    const CAMPOS_DADOS = [
        { nome: "nome", rotulo: "Nome completo" },
        { nome: "cpf", rotulo: "CPF" },
        { nome: "nascimento", rotulo: "Data de nascimento" },
        { nome: "mae", rotulo: "Nome da mãe" },
        { nome: "endereco", rotulo: "Endereço" },
        { nome: "email", rotulo: "E-mail" },
        { nome: "telefone1", rotulo: "Telefone 1" },
        { nome: "telefone2", rotulo: "Telefone 2" }
    ];

    const CAMPOS_QUESTIONARIO = [
        { nome: "avaliacaoProfissional", rotulo: "Avaliação profissional" },
        { nome: "regiaoEletrodos", rotulo: "Região dos eletrodos" },
        { nome: "lado", rotulo: "Lado da aplicação" },
        { nome: "neoplasia", rotulo: "Tecido neoplásico" },
        { nome: "pele", rotulo: "Integridade da pele" },
        { nome: "sensibilidade", rotulo: "Sensibilidade na região" },
        { nome: "comunicacao", rotulo: "Comunicação de desconforto" },
        { nome: "dispositivo", rotulo: "Dispositivos eletrônicos implantados" },
        { nome: "gestacao", rotulo: "Gestação" },
        { nome: "metal", rotulo: "Implantes metálicos locais" },
        { nome: "vascular", rotulo: "Circulação / vascular" },
        { nome: "epilepsia", rotulo: "Histórico neurológico" },
        { nome: "cardiaco", rotulo: "Condição cardiovascular" },
        { nome: "cirurgia", rotulo: "Cirurgia ou fratura recente" }
    ];

    const CAMPOS_TENS = [
        { nome: "localizacaoDor", rotulo: "Localização da dor" },
        { nome: "dor", rotulo: "Nível da dor hoje" },
        { nome: "cronicidade", rotulo: "Duração da dor" },
        { nome: "tipoDor", rotulo: "Mecanismo predominante" },
        { nome: "objetivoTens", rotulo: "Objetivo (TENS)" },
        { nome: "pontoGatilho", rotulo: "Ponto-gatilho miofascial" },
        { nome: "toleranciaTens", rotulo: "Tolerância à sensação elétrica" },
        { nome: "equipamentoTens", rotulo: "Equipamento (TENS)" },
        { nome: "testeTens", rotulo: "Teste supervisionado (TENS)" }
    ];

    const CAMPOS_FES = [
        { nome: "condicaoFes", rotulo: "Condição clínica" },
        { nome: "tecidoMuscular", rotulo: "Condição do tecido muscular" },
        { nome: "inervacao", rotulo: "Inervação periférica" },
        { nome: "forcaMuscular", rotulo: "Grau de força muscular atual" },
        { nome: "amplitude", rotulo: "Limitação da amplitude articular passiva" },
        { nome: "espasticidade", rotulo: "Espasticidade ou alteração do tônus" },
        { nome: "movimento", rotulo: "Movimento que se pretende facilitar" },
        { nome: "objetivoFes", rotulo: "Objetivo do tratamento (FES)" },
        { nome: "acionamento", rotulo: "Como a estimulação será acionada" },
        { nome: "respostaTeste", rotulo: "Resposta no teste supervisionado (FES)" },
        { nome: "toleranciaFes", rotulo: "Tolerância (FES)" },
        { nome: "fadiga", rotulo: "Fadiga durante a estimulação" },
        { nome: "equipamentoFes", rotulo: "Equipamento (FES)" }
    ];

    function abrirAba(nomeAba) {

        if (!abas.includes(nomeAba)) return;

        abaAtual = nomeAba;

        botoesAbas.forEach(botao => {
            const ativa = botao.dataset.aba === nomeAba;

            botao.classList.toggle("ativa", ativa);
            botao.setAttribute("aria-selected", String(ativa));
            botao.tabIndex = ativa ? 0 : -1;
        });

        paineis.forEach(painel => {
            painel.hidden = painel.id !== `aba-${nomeAba}`;
        });

        const ultimaAba = nomeAba === "fes";

        botaoNovo.hidden = ultimaAba;
        botaoProximo.hidden = ultimaAba;
    }

    botoesAbas.forEach(botao => {

        botao.addEventListener("click", () => {
            abrirAba(botao.dataset.aba);
        });

        botao.addEventListener("keydown", evento => {

            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) {
                return;
            }

            evento.preventDefault();

            let indice = abas.indexOf(abaAtual);

            if (evento.key === "ArrowRight") {
                indice = (indice + 1) % abas.length;
            } else if (evento.key === "ArrowLeft") {
                indice = (indice - 1 + abas.length) % abas.length;
            } else if (evento.key === "Home") {
                indice = 0;
            } else {
                indice = abas.length - 1;
            }

            abrirAba(abas[indice]);
            botoesAbas[indice].focus();
        });
    });

    botaoProximo.addEventListener("click", () => {

        const indiceAtual = abas.indexOf(abaAtual);

        if (indiceAtual < abas.length - 1) {
            abrirAba(abas[indiceAtual + 1]);
        }
    });

    // ---------- Utilitários do usuário logado e preenchimento ----------

    function obterUsuarioLogado() {
        try {
            return JSON.parse(localStorage.getItem("electrofisio-usuario")) || null;
        } catch (erro) {
            return null;
        }
    }

    function formatarDataBr(dataIso) {
        if (!dataIso) return "—";
        if (dataIso.includes("/")) return dataIso;
        return dataIso.split("-").reverse().join("/");
    }

    // Preenche SOMENTE os campos da aba "Dados"
    function preencherApenasAbaDados(paciente) {
        if (!paciente) return;

        const cpfLimpo = String(paciente.cpf || paciente.cpfNumeros || "").replace(/\D/g, "");

        formulario.elements.nome.value = paciente.nome || "";
        formulario.elements.cpf.value = cpfLimpo ? Validacao.formatarCpf(cpfLimpo) : (paciente.cpf || "");
        formulario.elements.nascimento.value = paciente.nascimento || "";
        formulario.elements.mae.value = paciente.mae || "";
        formulario.elements.endereco.value = paciente.endereco || "";
        formulario.elements.email.value = paciente.email || "";
        formulario.elements.telefone1.value = paciente.telefone1 || "";
        formulario.elements.telefone2.value = paciente.telefone2 || "";

        abrirAba("dados");
    }

    // Limpa todas as abas clínicas (Questionário, TENS e FES), mantendo a aba "Dados"
    function limparAbasExcetoDados() {
        const abasClinicas = ["aba-questionario", "aba-tens", "aba-fes"];

        abasClinicas.forEach(idPainel => {
            const painel = document.getElementById(idPainel);
            if (!painel) return;

            painel.querySelectorAll("input, select, textarea").forEach(campo => {
                if (campo.type === "radio" || campo.type === "checkbox") {
                    campo.checked = false;
                } else {
                    campo.value = "";
                }
            });
        });

        document.querySelectorAll(".resultado-calculadora").forEach(resultado => {
            resultado.hidden = true;
            resultado.replaceChildren();
        });

        if (typeof ultimoResultado !== "undefined") {
            ultimoResultado.tens = null;
            ultimoResultado.fes = null;
        }
        if (window.ultimoResultado) {
            window.ultimoResultado.tens = null;
            window.ultimoResultado.fes = null;
        }
    }

    // ---------- Lateral: 5 últimos pacientes salvos e busca por CPF ----------

    const PACIENTES_EXEMPLO = [
        { cpf: "11122233344", nome: "Paciente de Exemplo 1", nascimento: "1980-05-10" },
        { cpf: "55566677788", nome: "Paciente de Exemplo 2", nascimento: "1995-08-22" }
    ];

    const mensagemBusca = document.createElement("p");
    mensagemBusca.className = "mensagem-busca-triagem";
    mensagemBusca.setAttribute("role", "status");
    botaoBuscar.insertAdjacentElement("afterend", mensagemBusca);

    function criarCartaoLateralPaciente(paciente, ativo = false) {
        const cpfLimpo = String(paciente.cpf || paciente.cpfNumeros || "").replace(/\D/g, "");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "cartao-paciente-lateral" + (ativo ? " selecionado" : "");
        botao.dataset.cpf = cpfLimpo;

        const nome = document.createElement("strong");
        nome.className = "nome-paciente-triagem";
        nome.textContent = paciente.nome || "Paciente sem nome";

        const cpfSpan = document.createElement("span");
        cpfSpan.textContent = "CPF: " + (cpfLimpo ? Validacao.formatarCpf(cpfLimpo) : (paciente.cpf || "—"));

        const nascSpan = document.createElement("span");
        nascSpan.textContent = "Nascimento: " + formatarDataBr(paciente.nascimento);

        botao.append(nome, cpfSpan, nascSpan);

        if (paciente.ultimaSessao || paciente.totalSessoes) {
            const sessaoSpan = document.createElement("span");
            const num = paciente.ultimaSessao || paciente.totalSessoes;
            sessaoSpan.textContent = "Sessões salvas: " + num;
            botao.appendChild(sessaoSpan);
        }

        botao.addEventListener("click", () => {
            cpfSelecionadoLateral = cpfLimpo;
            pacienteEncontrado.querySelectorAll(".cartao-paciente-lateral").forEach(card => {
                card.classList.toggle("selecionado", card.dataset.cpf === cpfLimpo);
            });
            preencherApenasAbaDados(paciente);
            mensagemTriagem.textContent = "Dados de " + (paciente.nome || "paciente") + " carregados na aba Dados.";
        });

        return botao;
    }

    function mostrarPaciente(paciente) {
        pacienteEncontrado.replaceChildren();

        if (!paciente) {
            if (tituloPacienteLateral) {
                tituloPacienteLateral.textContent = "Paciente";
            }
            const vazio = document.createElement("p");
            vazio.textContent = "Nenhum paciente selecionado.";
            pacienteEncontrado.appendChild(vazio);
            return;
        }

        if (tituloPacienteLateral) {
            tituloPacienteLateral.textContent = "Paciente encontrado";
        }

        const cpfLimpo = String(paciente.cpf || paciente.cpfNumeros || "").replace(/\D/g, "");
        cpfSelecionadoLateral = cpfLimpo;

        const lista = document.createElement("div");
        lista.className = "lista-pacientes-recentes";
        lista.appendChild(criarCartaoLateralPaciente(paciente, true));
        pacienteEncontrado.appendChild(lista);
    }

    async function carregarUltimosPacientesSalvos() {
        try {
            const usuario = obterUsuarioLogado();
            let registros = [];

            if (usuario && usuario.id) {
                const qUsuario = query(
                    collection(db, "triagens"),
                    where("profissionalId", "==", usuario.id)
                );
                const snapUsuario = await getDocs(qUsuario);
                snapUsuario.forEach(docSnap => {
                    registros.push({ id: docSnap.id, ...docSnap.data() });
                });
            }

            if (registros.length === 0) {
                const snapGeral = await getDocs(collection(db, "triagens"));
                snapGeral.forEach(docSnap => {
                    registros.push({ id: docSnap.id, ...docSnap.data() });
                });
            }

            registros.sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0));

            const pacientesUnicos = [];
            const cpfsVistos = new Set();

            for (const item of registros) {
                const dados = item.dados || item.respostas || {};
                const cpfLimpo = String(item.cpfNumeros || dados.cpf || "").replace(/\D/g, "");
                const chave = cpfLimpo || item.id;

                if (!cpfsVistos.has(chave) && dados.nome) {
                    cpfsVistos.add(chave);
                    pacientesUnicos.push({
                        nome: dados.nome,
                        cpf: dados.cpf || cpfLimpo,
                        cpfNumeros: cpfLimpo,
                        nascimento: dados.nascimento || "",
                        mae: dados.mae || "",
                        endereco: dados.endereco || "",
                        email: dados.email || "",
                        telefone1: dados.telefone1 || "",
                        telefone2: dados.telefone2 || "",
                        ultimaSessao: item.numeroSessao || item.numeroTriagem || 1
                    });
                }

                if (pacientesUnicos.length === 5) break;
            }

            if (pacientesUnicos.length === 0) {
                mostrarPaciente(null);
                return;
            }

            if (tituloPacienteLateral) {
                tituloPacienteLateral.textContent = "Últimos pacientes";
            }

            pacienteEncontrado.replaceChildren();
            const lista = document.createElement("div");
            lista.className = "lista-pacientes-recentes";

            pacientesUnicos.forEach(pac => {
                const ativo = Boolean(cpfSelecionadoLateral && pac.cpfNumeros === cpfSelecionadoLateral);
                lista.appendChild(criarCartaoLateralPaciente(pac, ativo));
            });

            pacienteEncontrado.appendChild(lista);

        } catch (erro) {
            console.error("Erro ao carregar últimos pacientes:", erro);
        }
    }

    botaoBuscar.addEventListener("click", async () => {

        const cpf = campoBusca.value.replace(/\D/g, "");

        if (Validacao.erroCpf(cpf)) {
            mensagemBusca.textContent = "Digite os 11 números do CPF do paciente.";
            campoBusca.focus();
            return;
        }

        const textoOriginal = botaoBuscar.textContent;
        botaoBuscar.disabled = true;
        botaoBuscar.textContent = "Buscando...";
        mensagemBusca.textContent = "";

        try {
            let paciente = null;

            const qPacientes = query(
                collection(db, "pacientes"),
                where("cpfNumeros", "==", cpf)
            );
            const snapPacientes = await getDocs(qPacientes);

            if (!snapPacientes.empty) {
                paciente = snapPacientes.docs[0].data();
            } else {
                const qTriagens = query(
                    collection(db, "triagens"),
                    where("cpfNumeros", "==", cpf)
                );
                const snapTriagens = await getDocs(qTriagens);

                if (!snapTriagens.empty) {
                    const listaTriagens = snapTriagens.docs
                        .map(d => d.data())
                        .sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0));
                    const dadosSalvos = listaTriagens[0].dados || listaTriagens[0].respostas || {};
                    paciente = {
                        ...dadosSalvos,
                        cpfNumeros: cpf,
                        ultimaSessao: listaTriagens[0].numeroSessao || listaTriagens.length
                    };
                }
            }

            if (!paciente) {
                paciente = PACIENTES_EXEMPLO.find(item => item.cpf === cpf) || null;
            }

            if (!paciente) {
                await carregarUltimosPacientesSalvos();
                mensagemBusca.textContent = "Paciente não encontrado. Preencha os dados cadastrais para uma nova triagem.";
                formulario.elements.cpf.value = Validacao.formatarCpf(cpf);
                abrirAba("dados");
                return;
            }

            preencherApenasAbaDados(paciente);
            mostrarPaciente(paciente);
            mensagemBusca.textContent = "Paciente encontrado.";

        } catch (erro) {
            console.error("Erro ao buscar paciente por CPF:", erro);
            mensagemBusca.textContent = "Erro ao buscar paciente no banco de dados.";
        } finally {
            botaoBuscar.disabled = false;
            botaoBuscar.textContent = textoOriginal;
        }
    });

    // ---------- Inspeção individual de cada aba ----------

    function inspecionarAba(abaId, listaCampos) {
        let preenchidos = 0;
        let primeiroFaltante = null;

        for (const item of listaCampos) {
            const controle = formulario.elements[item.nome];
            if (!controle) continue;

            let estaPreenchido = false;
            let elementoFoco = null;

            if (typeof RadioNodeList !== "undefined" && controle instanceof RadioNodeList) {
                estaPreenchido = Boolean(controle.value);
                elementoFoco = controle[0] || null;
            } else {
                estaPreenchido = Boolean(String(controle.value || "").trim());
                elementoFoco = controle;
            }

            if (estaPreenchido) {
                preenchidos++;
            } else if (!primeiroFaltante) {
                primeiroFaltante = {
                    aba: abaId,
                    nome: item.nome,
                    rotulo: item.rotulo,
                    elemento: elementoFoco
                };
            }
        }

        return {
            total: listaCampos.length,
            preenchidos,
            iniciado: preenchidos > 0,
            completo: preenchidos === listaCampos.length,
            primeiroFaltante
        };
    }

    // ---------- Salvar e Novo ----------

    const CHAVE_TRIAGENS = "electrofisio-triagens";

    botaoSalvar.addEventListener("click", async () => {
        const statusDados = inspecionarAba("dados", CAMPOS_DADOS);
        const statusQuestionario = inspecionarAba("questionario", CAMPOS_QUESTIONARIO);
        const statusTens = inspecionarAba("tens", CAMPOS_TENS);
        const statusFes = inspecionarAba("fes", CAMPOS_FES);

        // 1. Aba Dados é obrigatória por completo
        if (!statusDados.completo) {
            abrirAba("dados");
            mensagemTriagem.textContent =
                "Preencha todos os campos da aba Dados antes de salvar. Falta: " +
                statusDados.primeiroFaltante.rotulo + ".";
            if (statusDados.primeiroFaltante.elemento && typeof statusDados.primeiroFaltante.elemento.focus === "function") {
                statusDados.primeiroFaltante.elemento.focus();
            }
            return;
        }

        // Valida formato de CPF, e-mail e telefones na aba Dados
        if (!validarCadastro()) {
            abrirAba("dados");
            validarCadastro();
            mensagemTriagem.textContent = "Corrija os campos inválidos na aba Dados antes de salvar.";
            return;
        }

        const cpfNumeros = String(formulario.elements.cpf.value || "").replace(/\D/g, "");
        if (Validacao.erroCpf(cpfNumeros)) {
            abrirAba("dados");
            mensagemTriagem.textContent = "Informe um CPF válido com 11 números.";
            formulario.elements.cpf.focus();
            return;
        }

        // 2. Aba Questionário é obrigatória por completo
        if (!statusQuestionario.completo) {
            abrirAba("questionario");
            mensagemTriagem.textContent =
                "Preencha todos os campos da aba Questionário antes de salvar. Falta: " +
                statusQuestionario.primeiroFaltante.rotulo + ".";
            if (statusQuestionario.primeiroFaltante.elemento && typeof statusQuestionario.primeiroFaltante.elemento.focus === "function") {
                statusQuestionario.primeiroFaltante.elemento.focus();
            }
            return;
        }

        // 3. Se Mapeamento TENS foi iniciado, precisa estar 100% preenchido
        if (statusTens.iniciado && !statusTens.completo) {
            abrirAba("tens");
            mensagemTriagem.textContent =
                "Você iniciou o Mapeamento TENS, mas ainda faltam campos. Preencha toda a aba ou limpe-a antes de salvar. Falta: " +
                statusTens.primeiroFaltante.rotulo + ".";
            if (statusTens.primeiroFaltante.elemento && typeof statusTens.primeiroFaltante.elemento.focus === "function") {
                statusTens.primeiroFaltante.elemento.focus();
            }
            return;
        }

        // 4. Se Mapeamento FES foi iniciado, precisa estar 100% preenchido
        if (statusFes.iniciado && !statusFes.completo) {
            abrirAba("fes");
            mensagemTriagem.textContent =
                "Você iniciou o Mapeamento FES, mas ainda faltam campos. Preencha toda a aba ou limpe-a antes de salvar. Falta: " +
                statusFes.primeiroFaltante.rotulo + ".";
            if (statusFes.primeiroFaltante.elemento && typeof statusFes.primeiroFaltante.elemento.focus === "function") {
                statusFes.primeiroFaltante.elemento.focus();
            }
            return;
        }

        // 5. Identifica exatamente o que foi usado nesta sessão
        const usouTens = statusTens.completo;
        const usouFes = statusFes.completo;

        let oQueFoiUsado = "Apenas Questionário";
        if (usouTens && usouFes) {
            oQueFoiUsado = "Questionário, TENS e FES";
        } else if (usouTens) {
            oQueFoiUsado = "Questionário e TENS";
        } else if (usouFes) {
            oQueFoiUsado = "Questionário e FES";
        }

        const respostas = {};
        new FormData(formulario).forEach((valor, campo) => {
            respostas[campo] = String(valor).trim();
        });

        // Garante resultado atualizado somente das calculadoras que foram utilizadas
        const refResultado = typeof ultimoResultado !== "undefined"
            ? ultimoResultado
            : (window.ultimoResultado || { tens: null, fes: null });

        if (usouTens && !refResultado.tens && typeof calcularTens === "function") {
            refResultado.tens = calcularTens();
        }
        if (usouFes && !refResultado.fes && typeof calcularFes === "function") {
            refResultado.fes = calcularFes();
        }

        const textoOriginalSalvar = botaoSalvar.textContent;
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        try {
            const usuario = obterUsuarioLogado();

            // Calcula o número sequencial da sessão individualmente para este CPF
            const qExistentes = query(
                collection(db, "triagens"),
                where("cpfNumeros", "==", cpfNumeros)
            );
            const snapExistentes = await getDocs(qExistentes);

            let maiorSessaoAnterior = 0;
            snapExistentes.forEach(docSnap => {
                const dadosDoc = docSnap.data();
                const num = Number(dadosDoc.numeroSessao || dadosDoc.numeroTriagem || 0);
                if (num > maiorSessaoAnterior) {
                    maiorSessaoAnterior = num;
                }
            });

            const numeroSessao = Math.max(maiorSessaoAnterior, snapExistentes.size) + 1;

            // Data e hora exatas da sessão
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
            const salvaEm = agora.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            const dataHoraSessao = `${dataSessao} às ${horaSessao}`;

            const dadosAba1 = {
                nome: respostas.nome,
                cpf: Validacao.formatarCpf(cpfNumeros),
                cpfNumeros,
                nascimento: respostas.nascimento,
                mae: respostas.mae,
                endereco: respostas.endereco,
                email: respostas.email,
                telefone1: respostas.telefone1,
                telefone2: respostas.telefone2
            };

            const dadosAba2 = {
                avaliacaoProfissional: respostas.avaliacaoProfissional,
                regiaoEletrodos: respostas.regiaoEletrodos,
                lado: respostas.lado,
                neoplasia: respostas.neoplasia,
                pele: respostas.pele,
                sensibilidade: respostas.sensibilidade,
                comunicacao: respostas.comunicacao,
                dispositivo: respostas.dispositivo,
                gestacao: respostas.gestacao,
                metal: respostas.metal,
                vascular: respostas.vascular,
                epilepsia: respostas.epilepsia,
                cardiaco: respostas.cardiaco,
                cirurgia: respostas.cirurgia
            };

            const dadosAba3 = usouTens ? {
                localizacaoDor: respostas.localizacaoDor,
                dor: respostas.dor,
                cronicidade: respostas.cronicidade,
                tipoDor: respostas.tipoDor,
                objetivoTens: respostas.objetivoTens,
                pontoGatilho: respostas.pontoGatilho,
                toleranciaTens: respostas.toleranciaTens,
                equipamentoTens: respostas.equipamentoTens,
                testeTens: respostas.testeTens
            } : null;

            const dadosAba4 = usouFes ? {
                condicaoFes: respostas.condicaoFes,
                tecidoMuscular: respostas.tecidoMuscular,
                inervacao: respostas.inervacao,
                forcaMuscular: respostas.forcaMuscular,
                amplitude: respostas.amplitude,
                espasticidade: respostas.espasticidade,
                movimento: respostas.movimento,
                objetivoFes: respostas.objetivoFes,
                acionamento: respostas.acionamento,
                respostaTeste: respostas.respostaTeste,
                toleranciaFes: respostas.toleranciaFes,
                fadiga: respostas.fadiga,
                equipamentoFes: respostas.equipamentoFes
            } : null;

            const triagemIndividual = {
                numeroSessao,
                numeroTriagem: numeroSessao,
                cpfNumeros,
                cpf: dadosAba1.cpf,
                pacienteNome: dadosAba1.nome,
                profissionalId: usuario ? usuario.id : null,
                profissionalNome: usuario ? usuario.nome : null,
                profissionalCrefito: usuario ? usuario.crefito : null,
                dataSessao,
                horaSessao,
                dataHoraSessao,
                salvaEm,
                criadoEmMs: agora.getTime(),
                criadoEm: serverTimestamp(),
                oQueFoiUsado,
                modalidadesUsadas: oQueFoiUsado,
                usouQuestionario: true,
                usouTens,
                usouFes,
                dados: dadosAba1,
                questionario: dadosAba2,
                tens: dadosAba3,
                fes: dadosAba4,
                respostas,
                resultadoTens: usouTens && refResultado.tens ? refResultado.tens.estado : null,
                resultadoFes: usouFes && refResultado.fes ? refResultado.fes.estado : null
            };

            // Salva individualmente na coleção "triagens"
            await addDoc(collection(db, "triagens"), triagemIndividual);

            // Cria ou atualiza o cadastro do paciente na coleção "pacientes"
            const qPaciente = query(
                collection(db, "pacientes"),
                where("cpfNumeros", "==", cpfNumeros)
            );
            const snapPaciente = await getDocs(qPaciente);
            if (snapPaciente.empty) {
                await addDoc(collection(db, "pacientes"), {
                    ...dadosAba1,
                    totalSessoes: numeroSessao,
                    ultimaSessao: numeroSessao,
                    ultimaSessaoDataHora: dataHoraSessao,
                    ultimaSessaoTipo: oQueFoiUsado,
                    profissionalId: usuario ? usuario.id : null,
                    profissionalCrefito: usuario ? usuario.crefito : null,
                    criadoEmMs: agora.getTime(),
                    criadoEm: serverTimestamp()
                });
            } else {
                const pacienteDocRef = doc(db, "pacientes", snapPaciente.docs[0].id);
                await updateDoc(pacienteDocRef, {
                    ...dadosAba1,
                    totalSessoes: numeroSessao,
                    ultimaSessao: numeroSessao,
                    ultimaSessaoDataHora: dataHoraSessao,
                    ultimaSessaoTipo: oQueFoiUsado,
                    atualizadoEm: serverTimestamp()
                });
            }

            // Mantém compatibilidade local com as demais telas
            try {
                const salvas = JSON.parse(localStorage.getItem(CHAVE_TRIAGENS)) || [];
                salvas.unshift(triagemIndividual);
                localStorage.setItem(CHAVE_TRIAGENS, JSON.stringify(salvas));
            } catch (erro) {
                // Sem armazenamento local disponível
            }

            cpfSelecionadoLateral = cpfNumeros;
            await carregarUltimosPacientesSalvos();

            // Limpa apenas Questionário, TENS e FES, mantendo Dados preenchidos para nova sessão
            limparAbasExcetoDados();
            abrirAba("dados");

            mensagemTriagem.textContent =
                `Sessão #${numeroSessao} (${oQueFoiUsado}) de ${respostas.nome} salva em ${dataHoraSessao}. Abas clínicas limpas para nova sessão.`;

        } catch (erro) {
            console.error("Erro ao salvar triagem no Firebase:", erro);
            mensagemTriagem.textContent = "Erro ao salvar no Firebase. Verifique sua conexão e as regras do banco.";
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = textoOriginalSalvar;
        }
    });

    botaoNovo.addEventListener("click", async () => {
        // Limpa tudo escrito e marcado em todas as 4 abas
        formulario.reset();

        formulario.querySelectorAll("input, select, textarea").forEach(campo => {
            if (campo.type === "radio" || campo.type === "checkbox") {
                campo.checked = false;
            } else {
                campo.value = "";
            }
        });

        campoBusca.value = "";
        mensagemBusca.textContent = "";
        cpfSelecionadoLateral = null;

        document.querySelectorAll(".resultado-calculadora").forEach(resultado => {
            resultado.hidden = true;
            resultado.replaceChildren();
        });

        if (typeof ultimoResultado !== "undefined") {
            ultimoResultado.tens = null;
            ultimoResultado.fes = null;
        }
        if (window.ultimoResultado) {
            window.ultimoResultado.tens = null;
            window.ultimoResultado.fes = null;
        }

        await carregarUltimosPacientesSalvos();
        abrirAba("dados");
        mensagemTriagem.textContent = "Nova triagem iniciada.";
    });

    // Carrega os 5 últimos pacientes salvos na lateral ao abrir a página
    carregarUltimosPacientesSalvos();

    // Abre na aba pedida pela tela de triagens (triagem.html?aba=tens)
    const abaPedida = new URLSearchParams(window.location.search).get("aba");
    abrirAba(abas.includes(abaPedida) ? abaPedida : "dados");
});

/* =========================================
   TREINAMENTO COM FISIS
========================================= */

// Endereço da API durante o desenvolvimento local
const API_BASE_URL = "https://electrofisio-api.onrender.com";

// Elementos da página
const botaoGerar = document.getElementById("botao-gerar-caso");
const botaoEnviar = document.getElementById("botao-enviar-resposta");

const dificuldade = document.getElementById("dificuldade");
const statusTreinamento = document.getElementById("status-treinamento");

const areaCaso = document.getElementById("area-caso");
const areaResposta = document.getElementById("area-resposta");
const areaResultado = document.getElementById("area-resultado");

const formResposta = document.getElementById("form-resposta");

const tituloCaso = document.getElementById("titulo-caso");
const perfilPaciente = document.getElementById("perfil-paciente");
const historicoCaso = document.getElementById("historico-caso");
const queixaCaso = document.getElementById("queixa-caso");
const objetivoCaso = document.getElementById("objetivo-caso");
const nivelCaso = document.getElementById("nivel-caso");

const conteudoResultado = document.getElementById("conteudo-resultado");

// Controle da sessão atual
let idSessaoAtual = null;

let modalidadeAtual =
    document.body.dataset.modalidade === "fes" ? "FES" : "TENS";

let requisicaoEmAndamento = false;


// =========================================
// CONTROLE DE INTERAÇÃO
// =========================================

function bloquearControles(bloqueado) {
    requisicaoEmAndamento = bloqueado;

    botaoGerar.disabled = bloqueado;
    dificuldade.disabled = bloqueado;

    document.querySelectorAll(".botao-modalidade").forEach(function (botao) {
        botao.disabled = bloqueado;
    });
}


// =========================================
// TRATAMENTO DE RESPOSTAS DA API
// =========================================

async function lerRespostaAPI(resposta) {
    try {
        return await resposta.json();
    } catch {
        return {};
    }
}

function obterErroAPI(resposta, dados) {
    if (dados.detail) {
        return new Error(dados.detail);
    }

    const mensagens = {
        400: "A solicitação é inválida. Confira os dados e tente novamente.",
        500: "Ocorreu um erro interno. Tente novamente mais tarde.",
        502: "A Fisis não conseguiu processar a solicitação.",
        503: "A Fisis está temporariamente indisponível. Tente novamente mais tarde."
    };

    return new Error(
        mensagens[resposta.status] ||
        "Não foi possível concluir a solicitação."
    );
}

function exibirErroConexao(erro) {
    console.error("Erro na comunicação com a API:", erro);

    if (erro instanceof TypeError) {
        statusTreinamento.textContent =
            "Não foi possível conectar à API. Verifique se o servidor está funcionando.";
        return;
    }

    statusTreinamento.textContent = erro.message;
}


// =========================================
// ATUALIZAÇÃO DA MODALIDADE
// =========================================

document.addEventListener("modalidade", function (evento) {
    if (requisicaoEmAndamento) {
        return;
    }

    modalidadeAtual = evento.detail === "fes" ? "FES" : "TENS";

    idSessaoAtual = null;

    areaCaso.classList.add("escondido");
    areaResposta.classList.add("escondido");
    areaResultado.classList.add("escondido");

    formResposta.reset();

    statusTreinamento.textContent =
        `Modalidade selecionada: ${modalidadeAtual}. Gere um novo caso para começar.`;
});


// =========================================
// INICIAR TREINAMENTO
// =========================================

botaoGerar.addEventListener("click", async function () {

    bloquearControles(true);

    botaoGerar.textContent = "Gerando caso...";

    idSessaoAtual = null;

    areaCaso.classList.add("escondido");
    areaResposta.classList.add("escondido");
    areaResultado.classList.add("escondido");

    formResposta.reset();

    statusTreinamento.textContent =
        "A Fisis está preparando seu caso clínico...";

    try {

        const resposta = await fetch(
            `${API_BASE_URL}/api/treinamento/iniciar`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    modalidade: modalidadeAtual,
                    dificuldade: dificuldade.value
                })
            }
        );

        const dados = await lerRespostaAPI(resposta);

        if (!resposta.ok) {
            throw obterErroAPI(resposta, dados);
        }

        idSessaoAtual = dados.id_sessao;

        exibirCaso(dados.caso_clinico, dificuldade.value);

        areaCaso.classList.remove("escondido");
        areaResposta.classList.remove("escondido");

        statusTreinamento.textContent =
            "Caso clínico gerado! Analise as informações e registre sua resposta.";

    } catch (erro) {

        exibirErroConexao(erro);

    } finally {

        bloquearControles(false);
        botaoGerar.textContent = "Gerar novo caso";

    }
});


// =========================================
// EXIBIR CASO CLÍNICO
// =========================================

function exibirCaso(caso, nivel) {

    tituloCaso.textContent = caso.titulo;

    perfilPaciente.textContent =
        `${caso.perfil_paciente.idade} anos — ${caso.perfil_paciente.contexto_funcional}`;

    historicoCaso.textContent = caso.historico_relevante;
    queixaCaso.textContent = caso.queixa_principal;
    objetivoCaso.textContent = caso.objetivo_aprendizagem;

    const niveis = {
        iniciante: "Iniciante",
        intermediario: "Intermediário",
        avancado: "Avançado"
    };

    nivelCaso.textContent = niveis[nivel] || nivel;
}


// =========================================
// ENVIAR RESPOSTA
// =========================================

formResposta.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    if (requisicaoEmAndamento) {
        return;
    }

    if (!idSessaoAtual) {
        statusTreinamento.textContent =
            "Gere um caso clínico antes de enviar sua resposta.";
        return;
    }

    const respostaClinica =
        document.getElementById("resposta-clinica").value.trim();

    const justificativa =
        document.getElementById("justificativa").value.trim();

    if (!respostaClinica) {
        statusTreinamento.textContent =
            "Escreva sua resposta antes de enviá-la.";
        return;
    }

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Avaliando resposta...";

    bloquearControles(true);

    statusTreinamento.textContent =
        "A Fisis está analisando sua resposta...";

    try {

        const resposta = await fetch(
            `${API_BASE_URL}/api/treinamento/avaliar`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id_sessao: idSessaoAtual,
                    modalidade: modalidadeAtual,
                    parametros: {
                        resposta: respostaClinica
                    },
                    justificativa: justificativa || null
                })
            }
        );

        const dados = await lerRespostaAPI(resposta);

        if (!resposta.ok) {
            throw obterErroAPI(resposta, dados);
        }

        exibirResultado(dados);

        areaResultado.classList.remove("escondido");

        statusTreinamento.textContent =
            "Avaliação concluída! Confira o feedback da Fisis.";

        // A sessão foi finalizada. Evita novo envio da mesma resposta.
        idSessaoAtual = null;

    } catch (erro) {

        exibirErroConexao(erro);

    } finally {

        bloquearControles(false);

        botaoEnviar.disabled = false;
        botaoEnviar.textContent = "Enviar resposta para avaliação";

    }

});


// =========================================
// EXIBIR RETORNO DA API
// =========================================

function exibirResultado(dados) {

    conteudoResultado.replaceChildren();

    const resultado = dados.resultado;

    if (!resultado) {
        conteudoResultado.textContent =
            "A avaliação foi recebida, mas não retornou um resultado válido.";
        return;
    }

    const classificacoes = {
        adequada: "Resposta adequada",
        parcialmente_adequada: "Resposta parcialmente adequada",
        precisa_revisao: "Resposta precisa de revisão"
    };

    const titulo = document.createElement("h3");

    titulo.textContent =
        classificacoes[resultado.classificacao] ||
        "Resultado da avaliação";

    const resumo = document.createElement("p");
    resumo.textContent = resultado.resumo;

    conteudoResultado.append(titulo, resumo);


    // Criação das listas de feedback
    function criarLista(tituloTexto, itens) {

        if (!itens || itens.length === 0) {
            return;
        }

        const secao = document.createElement("div");

        const tituloSecao = document.createElement("h4");
        tituloSecao.textContent = tituloTexto;

        const lista = document.createElement("ul");

        itens.forEach(function (item) {
            const elemento = document.createElement("li");
            elemento.textContent = item;
            lista.appendChild(elemento);
        });

        secao.append(tituloSecao, lista);

        conteudoResultado.appendChild(secao);
    }

    criarLista("Pontos positivos", resultado.pontos_positivos);

    criarLista("Pontos a melhorar", resultado.pontos_melhorar);


    // Feedback educativo
    const feedbackTitulo = document.createElement("h4");
    feedbackTitulo.textContent = "Feedback da Fisis";

    const feedbackTexto = document.createElement("p");
    feedbackTexto.textContent = resultado.feedback;

    conteudoResultado.append(feedbackTitulo, feedbackTexto);


    // Limitações da avaliação
    if (resultado.limitacoes) {

        const limitacoes = document.createElement("p");

        limitacoes.textContent =
            "Limitações: " + resultado.limitacoes;

        conteudoResultado.appendChild(limitacoes);
    }
}

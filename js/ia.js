
document.addEventListener("DOMContentLoaded", () => {

    const casos = [
        {
            descricao: "Paciente do sexo masculino, 52 anos, com diagnóstico de lombalgia crônica inespecífica, relata dor lombar de intensidade moderada (EVA 6/10), sem sinais de déficits neurológicos. O objetivo do tratamento é o alívio da dor e a melhora da funcionalidade."
        },
        {
            descricao: "Paciente fictícia, 45 anos, relata dor persistente na região cervical, associada a desconforto durante atividades de escritório. Não apresenta sinais neurológicos relatados. O objetivo educacional é discutir recursos de eletroterapia para controle da dor."
        },
        {
            descricao: "Paciente fictício, 60 anos, em acompanhamento de reabilitação após evento neurológico, apresenta dificuldade para realizar dorsiflexão ativa do tornozelo. O objetivo educacional é analisar o uso da estimulação elétrica funcional."
        },
        {
            descricao: "Paciente fictícia, 34 anos, em processo de reabilitação musculoesquelética, apresenta dificuldade de ativação voluntária de determinado grupo muscular. O desafio é discutir a indicação e as limitações da estimulação elétrica."
        },
        {
            descricao: "Paciente fictício, 48 anos, apresenta queixa de dor musculoesquelética persistente e histórico de tratamentos anteriores. O objetivo é comparar possibilidades de eletroterapia e justificar a escolha considerando segurança e avaliação clínica."
        }
    ];

    let indiceAtual = 0;

    const numeroCaso = document.getElementById("numeroCaso");
    const descricaoCaso = document.getElementById("descricaoCaso");
    const indicadores = document.getElementById("indicadoresCaso");

    const resposta = document.getElementById("respostaEstudante");
    const contador = document.getElementById("contadorCaracteres");
    const feedback = document.getElementById("textoFeedback");

    const anterior = document.getElementById("casoAnterior");
    const proximo = document.getElementById("proximoCaso");
    const limpar = document.getElementById("limparResposta");
    const enviar = document.getElementById("enviarResposta");

    function atualizarContador() {
        contador.textContent = `${resposta.value.length} / 1000`;
    }

    function atualizarCaso() {
        numeroCaso.textContent = `Caso ${indiceAtual + 1} de ${casos.length}`;
        descricaoCaso.textContent = casos[indiceAtual].descricao;

        indicadores.replaceChildren();

        casos.forEach((_, indice) => {
            const ponto = document.createElement("span");

            if (indice === indiceAtual) {
                ponto.classList.add("ativo");
            }

            indicadores.appendChild(ponto);
        });

        anterior.disabled = indiceAtual === 0;
        proximo.disabled = indiceAtual === casos.length - 1;

        resposta.value = "";
        atualizarContador();

        feedback.textContent =
            "A avaliação da sua resposta aparecerá aqui após o envio.";
    }

    anterior.addEventListener("click", () => {
        if (indiceAtual > 0) {
            indiceAtual--;
            atualizarCaso();
        }
    });

    proximo.addEventListener("click", () => {
        if (indiceAtual < casos.length - 1) {
            indiceAtual++;
            atualizarCaso();
        }
    });

    resposta.addEventListener("input", atualizarContador);

    limpar.addEventListener("click", () => {
        resposta.value = "";
        atualizarContador();

        feedback.textContent =
            "A avaliação da sua resposta aparecerá aqui após o envio.";
    });

    enviar.addEventListener("click", () => {
        if (!resposta.value.trim()) {
            feedback.textContent =
                "Digite sua resposta antes de enviar para avaliação.";
            resposta.focus();
            return;
        }

        feedback.textContent =
            "Sua resposta foi preenchida, mas ainda não foi enviada.\n\n" +
            "A avaliação automática estará disponível quando integrarmos " +
            "o ElectroFisio à API de Inteligência Artificial.";
    });

    atualizarCaso();
});


// Tela "Enviar caso para a IA"
// A integração com a API de IA ainda não existe: a resposta é montada a partir
// do conteúdo revisado das abas de TENS e FES, na estrutura pedida pela equipe de fisioterapia.

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("formCaso");
    const mensagem = document.getElementById("mensagemCaso");
    const resposta = document.getElementById("respostaIa");
    const botaoExemplo = document.getElementById("botaoExemplo");

    // Caso de exemplo do material de fisioterapia
    const EXEMPLO = {
        geral: "Paciente fictício, 58 anos, dor crônica no ombro direito",
        queixa: "Dor principalmente ao elevar o braço, com dificuldade nas atividades domésticas há 6 meses.",
        avaliacao: "Pele íntegra, sensibilidade preservada, limitação funcional para elevar o braço.",
        objetivo: "dor",
        modalidade: "TENS",
        duvida: "A TENS pode ser considerada como recurso complementar?"
    };

    // Trechos da resposta, conforme a modalidade
    const CONTEUDO = {
        TENS: {
            fundamentacao: "A TENS estimula fibras nervosas sensitivas e modula o processamento da dor na medula e no cérebro, incluindo a ativação de sistemas inibitórios do próprio organismo.",
            discussao: "A TENS pode ser discutida como recurso complementar para o controle da dor, desde que a avaliação confirme sua adequação. Ela não substitui a investigação da causa da dor nem o tratamento voltado à recuperação funcional.",
            parametros: "Na TENS convencional, faixas educativas de cerca de 50–100 Hz e 50–200 µs, com intensidade até formigamento forte, confortável e não doloroso. Não existe configuração única para todos: frequência, duração do pulso e tempo dependem do equipamento, da condição e da tolerância.",
            avaliacao: "Comparar a dor (escala de 0 a 10) antes e depois, durante as atividades que provocavam desconforto, e observar a pele após a sessão.",
            referencias: "[1] Johnson et al., 2022 (meta-TENS); [2] Vance et al., 2022; [13] Houghton et al., 2010."
        },
        FES: {
            fundamentacao: "A FES estimula nervos motores periféricos para produzir contrações coordenadas com uma tarefa. Ela depende da integridade do nervo periférico e da resposta muscular.",
            discussao: "A FES pode ser discutida quando há uma tarefa funcional definida (por exemplo, levantar o pé no balanço da marcha ou abrir a mão). Contração isolada, sem tarefa, é NMES. A escolha considera órteses, treino e preferências.",
            parametros: "Faixas comuns de 20–50 Hz e 200–300 µs, com rampas que acompanhem a tarefa. A intensidade deve produzir o movimento pretendido com tolerância; não há valor único em mA. Em tarefas como a marcha, a estimulação acompanha as fases do passo.",
            avaliacao: "Avaliar a qualidade do movimento, a fadiga e o desempenho na tarefa, com e sem o auxílio da estimulação (por exemplo, teste de caminhada de 10 metros).",
            referencias: "[7] Marquez-Chin e Popovic, 2020; [10] Nussbaum et al., 2017; [19] Johnston et al., 2021."
        }
    };

    const PROBLEMA = {
        dor: "dor que limita as atividades do dia a dia",
        contracao: "dificuldade de ativação muscular",
        funcional: "dificuldade em um movimento funcional"
    };

    function paragrafo(titulo, texto) {
        const bloco = document.createElement("div");
        bloco.className = "bloco-resposta";

        const h3 = document.createElement("h3");
        h3.textContent = titulo;

        const p = document.createElement("p");
        p.textContent = texto;

        bloco.append(h3, p);
        return bloco;
    }

    // Possíveis dados pessoais no texto enviado
    function temDadosPessoais(texto) {
        return /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(texto) || /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/.test(texto);
    }

    function montarResposta(dados) {
        // Sem modalidade definida: o objetivo orienta a discussão
        const modalidade = dados.modalidade === "duvida"
            ? (dados.objetivo === "dor" ? "TENS" : "FES")
            : dados.modalidade;
        const conteudo = CONTEUDO[modalidade];

        let discussao = conteudo.discussao;
        if (dados.modalidade === "duvida") {
            discussao = "Pelo objetivo informado, a modalidade mais relacionada é a " + modalidade + ". " + discussao;
        } else if (dados.modalidade === "TENS" && dados.objetivo !== "dor") {
            discussao = "Atenção: o objetivo informado é motor, e a TENS tem finalidade principalmente analgésica. Reveja se a FES ou a NMES não seriam mais adequadas. " + discussao;
        } else if (dados.modalidade === "FES" && dados.objetivo === "dor") {
            discussao = "Atenção: o objetivo informado é reduzir a dor, finalidade principal da TENS, e não da FES. " + discussao;
        }

        resposta.replaceChildren();

        const titulo = document.createElement("h2");
        titulo.textContent = "Resposta educativa";
        resposta.appendChild(titulo);

        resposta.append(
            paragrafo("1. Resumo do caso", dados.geral + ". " + dados.queixa),
            paragrafo("2. Problema principal", "O caso descreve " + PROBLEMA[dados.objetivo] + "." +
                (dados.duvida ? " Dúvida apresentada: " + dados.duvida : "")),
            paragrafo("3. Fundamentação", conteudo.fundamentacao),
            paragrafo("4. Uso de " + modalidade, discussao),
            paragrafo("5. Parâmetros envolvidos", conteudo.parametros),
            paragrafo("6. Segurança", "Antes de aplicar, investigue dispositivos implantados, gestação, epilepsia, trombose, tumor na região, pele e sensibilidade. " +
                "Nunca posicione eletrodos sobre os olhos, a região anterior do pescoço ou com corrente atravessando o tórax." +
                (dados.avaliacao ? "" : " A avaliação do cenário não foi informada: esses itens precisam ser verificados.")),
            paragrafo("7. Como avaliar o resultado", conteudo.avaliacao),
            paragrafo("8. Referências para aprofundar", conteudo.referencias + " Lista completa na biblioteca.")
        );

        const aviso = document.createElement("p");
        aviso.className = "nota-resposta";
        aviso.textContent = "Resposta educativa baseada no conteúdo revisado do ElectroFisio. Não é diagnóstico nem prescrição; discuta o caso com o professor ou profissional responsável.";
        resposta.appendChild(aviso);
    }

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const dados = {
            geral: formulario.geral.value.trim().replace(/\.$/, ""),
            queixa: formulario.queixa.value.trim(),
            avaliacao: formulario.avaliacao.value.trim(),
            objetivo: formulario.objetivo.value,
            modalidade: formulario.modalidade.value,
            duvida: formulario.duvida.value.trim()
        };

        if (temDadosPessoais(Object.values(dados).join(" "))) {
            mensagem.textContent = "Parece haver CPF ou telefone no texto. Retire os dados pessoais antes de enviar.";
            return;
        }

        mensagem.textContent = "Caso enviado. Veja a resposta ao lado.";
        montarResposta(dados);
        resposta.focus();
    });

    botaoExemplo.addEventListener("click", () => {
        Object.keys(EXEMPLO).forEach(campo => {
            formulario[campo].value = EXEMPLO[campo];
        });
        mensagem.textContent = "Exemplo preenchido. Clique em Enviar caso.";
    });

});

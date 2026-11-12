
// Tela de triagens feitas: escolher uma triagem e ver o que foi registrado
// Ainda não há banco de dados: as triagens abaixo são exemplos para a apresentação.

document.addEventListener("DOMContentLoaded", () => {

    const DOCUMENTOS = {
        questionario: {
            titulo: "Questionário de segurança",
            responsavel: "Ana Souza · CREFITO 123456-F · 28/10/2026 - 08:45",
            linhas: [
                ["Avaliação profissional", "Sim"],
                ["Região dos eletrodos", "Joelho (direito)"],
                ["Tumor ou câncer ativo na região", "Não"],
                ["Ferida, infecção ou sangramento na região", "Não"],
                ["Sensibilidade na região", "Preservada"],
                ["Comunica desconforto", "Sim"],
                ["Dispositivos eletrônicos implantados", "Não"],
                ["Gestação", "Não se aplica"],
                ["Implantes metálicos locais", "Não"],
                ["Trombose na região", "Não"],
                ["Epilepsia ou convulsões", "Não"],
                ["Condição cardiovascular", "Não"],
                ["Cirurgia ou fratura recente", "Não"],
                ["Conclusão", "Sem alertas de segurança para a região do joelho direito."]
            ]
        },
        tens: {
            titulo: "Mapeamento TENS",
            responsavel: "Ana Souza · CREFITO 123456-F · 28/10/2026 - 09:00",
            linhas: [
                ["Localização da dor", "Joelho direito"],
                ["Nível da dor hoje", "Moderada"],
                ["Duração da dor", "Crônica (mais de 3 meses)"],
                ["Mecanismo predominante", "Nociceptiva (mecânica / inflamatória)"],
                ["Ponto-gatilho miofascial", "Não"],
                ["Equipamento", "IBRAMED Neurodyn II"],
                ["Teste supervisionado", "Sensação forte e confortável"],
                ["Resultado da calculadora", "IBR-CRONICA-02: 40 Hz, 150 µs, 30 min (preset do fabricante)"],
                ["Situação", "Confirmado pelo profissional"]
            ]
        },
        fes: {
            titulo: "Mapeamento FES",
            responsavel: "Ana Souza · CREFITO 123456-F · 28/10/2026 - 09:10",
            linhas: [
                ["Condição clínica", "Outra condição (dor no joelho, sem doença neurológica)"],
                ["Inervação periférica", "Preservada"],
                ["Movimento desejado", "Extensão do joelho ao levantar da cadeira"],
                ["Resposta no teste", "Contração presente, ainda insuficiente para a tarefa"],
                ["Tolerância", "Boa"],
                ["Resultado da calculadora", "Sem protocolo validado para este perfil"],
                ["Observação", "Por enquanto, sem indicação de FES: seguir com treino ativo e reavaliar."]
            ]
        }
    };

    const itens = document.querySelectorAll(".item-triagem");
    const botaoAbrir = document.getElementById("botaoAbrir");
    const mensagem = document.getElementById("mensagemTriagens");
    const quadro = document.querySelector(".quadro-triagens");

    // Quadro onde a triagem escolhida é mostrada (só leitura)
    const documento = document.createElement("article");
    documento.className = "quadro-prontuario documento-triagem";
    documento.id = "documentoTriagem";
    documento.tabIndex = -1;
    documento.hidden = true;
    quadro.insertAdjacentElement("afterend", documento);

    let abaEscolhida = null;

    function escolher(item) {
        abaEscolhida = item.dataset.aba;

        itens.forEach(outro => {
            const selecionado = outro === item;
            outro.classList.toggle("selecionado", selecionado);
            outro.setAttribute("aria-pressed", String(selecionado));
        });

        botaoAbrir.disabled = false;
        mensagem.textContent = item.querySelector("span").textContent + " selecionado.";
    }

    function abrir() {
        const dados = DOCUMENTOS[abaEscolhida];
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

    itens.forEach(item => {
        item.addEventListener("click", () => escolher(item));

        // Duplo clique já abre a triagem
        item.addEventListener("dblclick", () => {
            escolher(item);
            abrir();
        });
    });

    botaoAbrir.addEventListener("click", abrir);

});

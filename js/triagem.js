
document.addEventListener("DOMContentLoaded", () => {

    const abas = ["dados", "questionario", "tens", "fes"];

    const botoesAbas = document.querySelectorAll(".aba-triagem");
    const paineis = document.querySelectorAll(".painel-aba");

    const botaoNovo = document.getElementById("botaoNovo");
    const botaoSalvar = document.getElementById("botaoSalvar");
    const botaoProximo = document.getElementById("botaoProximo");
    const botaoBuscar = document.getElementById("botaoBuscar");

    let abaAtual = "dados";

    // CPF, telefone e e-mail do cadastro do paciente
    const validarCadastro = Validacao.prepararCampos(document.getElementById("aba-dados"));
    Validacao.prepararCampos(document.getElementById("cpfBusca").parentElement);

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

    // A busca será integrada ao cadastro de pacientes.
    botaoBuscar.addEventListener("click", () => {

        const cpf = document.getElementById("cpfBusca").value.trim();

        if (Validacao.erroCpf(cpf)) {
            alert("Digite os 11 números do CPF do paciente.");
            return;
        }

        alert("A busca de pacientes será implementada na integração.");
    });

    // Salvamento ainda não implementado.
    botaoSalvar.addEventListener("click", () => {
        if (!validarCadastro()) {
            abrirAba("dados");
            validarCadastro(); // de novo, para focar o campo já visível
            return;
        }

        alert("O salvamento da triagem será implementado na próxima etapa.");
    });

    // Novo registro ainda não implementado.
    botaoNovo.addEventListener("click", () => {
        alert("A função Novo será implementada na próxima etapa.");
    });

    // Abre na aba pedida pela tela de triagens (triagem.html?aba=tens)
    const abaPedida = new URLSearchParams(window.location.search).get("aba");
    abrirAba(abas.includes(abaPedida) ? abaPedida : "dados");
});

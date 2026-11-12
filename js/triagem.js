
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

    // ---------- Busca do paciente ----------
    // Ainda não há banco de dados: usa os mesmos pacientes de exemplo da tela Pacientes.

    const PACIENTES_EXEMPLO = [
        { cpf: "11122233344", nome: "Paciente de Exemplo 1", nascimento: "1980-05-10" },
        { cpf: "55566677788", nome: "Paciente de Exemplo 2", nascimento: "1995-08-22" }
    ];

    const formulario = document.getElementById("formularioTriagem");
    const campoBusca = document.getElementById("cpfBusca");
    const pacienteEncontrado = document.getElementById("pacienteEncontrado");
    const mensagemTriagem = document.getElementById("mensagemTriagem");

    const mensagemBusca = document.createElement("p");
    mensagemBusca.className = "mensagem-busca-triagem";
    mensagemBusca.setAttribute("role", "status");
    botaoBuscar.insertAdjacentElement("afterend", mensagemBusca);

    function mostrarPaciente(paciente) {
        pacienteEncontrado.replaceChildren();

        if (!paciente) {
            const vazio = document.createElement("p");
            vazio.textContent = "Nenhum paciente selecionado.";
            pacienteEncontrado.appendChild(vazio);
            return;
        }

        const nome = document.createElement("p");
        nome.className = "nome-paciente-triagem";
        nome.textContent = paciente.nome;

        const cpf = document.createElement("p");
        cpf.textContent = "CPF: " + Validacao.formatarCpf(paciente.cpf);

        const nascimento = document.createElement("p");
        nascimento.textContent = "Nascimento: " + paciente.nascimento.split("-").reverse().join("/");

        pacienteEncontrado.append(nome, cpf, nascimento);
    }

    botaoBuscar.addEventListener("click", () => {

        const cpf = campoBusca.value.replace(/\D/g, "");

        if (Validacao.erroCpf(cpf)) {
            mensagemBusca.textContent = "Digite os 11 números do CPF do paciente.";
            campoBusca.focus();
            return;
        }

        const paciente = PACIENTES_EXEMPLO.find(item => item.cpf === cpf);

        if (!paciente) {
            mostrarPaciente(null);
            mensagemBusca.textContent = "Paciente não encontrado. Preencha os dados cadastrais para uma nova triagem.";
            formulario.elements.cpf.value = Validacao.formatarCpf(cpf);
            abrirAba("dados");
            return;
        }

        // Preenche os dados cadastrais com o paciente encontrado
        formulario.elements.nome.value = paciente.nome;
        formulario.elements.cpf.value = Validacao.formatarCpf(paciente.cpf);
        formulario.elements.nascimento.value = paciente.nascimento;

        mostrarPaciente(paciente);
        mensagemBusca.textContent = "Paciente encontrado.";
    });

    // ---------- Salvar e Novo ----------
    // Ainda não há banco de dados: a triagem fica salva só neste navegador.

    const CHAVE_TRIAGENS = "electrofisio-triagens";

    botaoSalvar.addEventListener("click", () => {
        if (!validarCadastro()) {
            abrirAba("dados");
            validarCadastro(); // de novo, para focar o campo já visível
            return;
        }

        if (!formulario.elements.nome.value.trim()) {
            abrirAba("dados");
            mensagemTriagem.textContent = "Informe ao menos o nome do paciente para salvar.";
            formulario.elements.nome.focus();
            return;
        }

        const respostas = {};
        new FormData(formulario).forEach((valor, campo) => {
            respostas[campo] = valor;
        });

        const triagem = {
            salvaEm: new Date().toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }),
            respostas: respostas,
            resultadoTens: ultimoResultado.tens ? ultimoResultado.tens.estado : null,
            resultadoFes: ultimoResultado.fes ? ultimoResultado.fes.estado : null
        };

        try {
            const salvas = JSON.parse(localStorage.getItem(CHAVE_TRIAGENS)) || [];
            salvas.unshift(triagem);
            localStorage.setItem(CHAVE_TRIAGENS, JSON.stringify(salvas));
            mensagemTriagem.textContent = "Triagem de " + respostas.nome + " salva em " + triagem.salvaEm + ".";
        } catch (erro) {
            mensagemTriagem.textContent = "Não foi possível salvar neste navegador.";
        }
    });

    botaoNovo.addEventListener("click", () => {
        formulario.reset();
        campoBusca.value = "";
        mensagemBusca.textContent = "";
        mostrarPaciente(null);

        document.querySelectorAll(".resultado-calculadora").forEach(resultado => {
            resultado.hidden = true;
            resultado.replaceChildren();
        });
        ultimoResultado.tens = null;
        ultimoResultado.fes = null;

        abrirAba("dados");
        mensagemTriagem.textContent = "Nova triagem iniciada.";
    });

    // Abre na aba pedida pela tela de triagens (triagem.html?aba=tens)
    const abaPedida = new URLSearchParams(window.location.search).get("aba");
    abrirAba(abas.includes(abaPedida) ? abaPedida : "dados");
});

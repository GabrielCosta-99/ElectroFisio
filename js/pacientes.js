
// Tela de pacientes: busca por CPF
// Ainda não há banco de dados: a busca usa uma lista de pacientes fictícios.

document.addEventListener("DOMContentLoaded", () => {

    const PACIENTES_EXEMPLO = [
        { cpf: "11122233344", nome: "Paciente de Exemplo 1", nascimento: "10/05/1980" },
        { cpf: "55566677788", nome: "Paciente de Exemplo 2", nascimento: "22/08/1995" }
    ];

    const formulario = document.querySelector(".formulario-busca");
    const campoCpf = document.getElementById("cpfBusca");
    const resultadoCpf = document.getElementById("resultadoCpf");
    const resultadoNome = document.getElementById("resultadoNome");
    const resultadoNascimento = document.getElementById("resultadoNascimento");
    const botoesTopo = document.querySelectorAll(".pacientes-acoes .botao-aba");

    // Mensagem logo abaixo da busca
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-busca";
    mensagem.setAttribute("role", "status");
    formulario.closest(".pacientes-busca").insertAdjacentElement("afterend", mensagem);

    function somenteNumeros(texto) {
        return texto.replace(/\D/g, "").slice(0, 11);
    }

    // 12345678901 -> 123.456.789-01
    function formatarCpf(numeros) {
        return numeros
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function limparResultado() {
        resultadoCpf.textContent = "—";
        resultadoNome.textContent = "—";
        resultadoNascimento.textContent = "—";
    }

    // Máscara enquanto digita
    campoCpf.addEventListener("input", () => {
        campoCpf.value = formatarCpf(somenteNumeros(campoCpf.value));
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const cpf = somenteNumeros(campoCpf.value);
        limparResultado();
        mensagem.innerHTML = "";

        if (cpf.length !== 11) {
            mensagem.textContent = "Digite os 11 números do CPF.";
            campoCpf.focus();
            return;
        }

        const paciente = PACIENTES_EXEMPLO.find(item => item.cpf === cpf);

        if (!paciente) {
            mensagem.textContent = "Nenhum paciente encontrado com esse CPF.";
            return;
        }

        resultadoCpf.textContent = formatarCpf(paciente.cpf);
        resultadoNome.textContent = paciente.nome;
        resultadoNascimento.textContent = paciente.nascimento;

        mensagem.innerHTML = "Paciente encontrado. <a href=\"dados.html\">Abrir dados do paciente</a>";
    });

    // Botões "Triagem" e "Pacientes" do topo
    botoesTopo.forEach(botao => {
        const texto = botao.textContent.trim();

        if (texto === "Triagem") {
            botao.addEventListener("click", () => {
                window.location.href = "triagem.html";
            });
        } else {
            botao.classList.add("ativo");
            botao.setAttribute("aria-current", "page");
        }
    });

});

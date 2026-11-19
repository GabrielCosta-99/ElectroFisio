import {
    db,
    collection,
    getDocs,
    query,
    where
} from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {

    const PACIENTES_EXEMPLO = [
        { cpf: "11122233344", nome: "Paciente de Exemplo 1", nascimento: "10/05/1980" },
        { cpf: "55566677788", nome: "Paciente de Exemplo 2", nascimento: "22/08/1995" }
    ];

    const formulario = document.querySelector(".formulario-busca");
    const campoCpf = document.getElementById("cpfBusca");
    const botaoBuscar = formulario.querySelector(".botao-buscar");
    const resultadoCpf = document.getElementById("resultadoCpf");
    const resultadoNome = document.getElementById("resultadoNome");
    const resultadoNascimento = document.getElementById("resultadoNascimento");
    const botoesTopo = document.querySelectorAll(".pacientes-acoes .botao-aba");
    const cartaoResultado = document.querySelector(".pacientes-resultado");

    const elProfissionalNome = document.querySelector(".profissional-nome");
    const elProfissionalCrefito = document.querySelector(".profissional-crefito");

    let pacienteAtual = null;
    let buscandoAgora = false;

    // Preenche o cabeçalho com os dados do profissional logado, se disponíveis
    try {
        const usuarioLogado = JSON.parse(localStorage.getItem("electrofisio-usuario"));
        if (usuarioLogado) {
            if (elProfissionalNome && usuarioLogado.nome) {
                elProfissionalNome.textContent = usuarioLogado.nome;
            }
            if (elProfissionalCrefito) {
                elProfissionalCrefito.textContent = usuarioLogado.crefito
                    ? "CREFITO: " + usuarioLogado.crefito
                    : (usuarioLogado.ra ? "RA: " + usuarioLogado.ra : "CREFITO: 000000");
            }
        }
    } catch (erro) {
        // Mantém os textos padrão caso não haja sessão armazenada
    }

    // O cartão com as 3 informações funciona como link para triagens.html
    function abrirTriagens() {
        if (cartaoResultado.classList.contains("encontrado") && pacienteAtual) {
            try {
                localStorage.setItem("electrofisio-paciente-selecionado", JSON.stringify(pacienteAtual));
            } catch (erro) {
                // Segue mesmo sem localStorage
            }
            window.location.href = "triagens.html?cpf=" + encodeURIComponent(pacienteAtual.cpfNumeros);
        }
    }

    cartaoResultado.addEventListener("click", abrirTriagens);
    cartaoResultado.addEventListener("keydown", evento => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            abrirTriagens();
        }
    });

    // Mensagem logo abaixo da busca
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-busca";
    mensagem.setAttribute("role", "status");
    formulario.closest(".pacientes-busca").insertAdjacentElement("afterend", mensagem);

    function somenteNumeros(texto) {
        return String(texto || "").replace(/\D/g, "").slice(0, 11);
    }

    // 12345678901 -> 123.456.789-01
    function formatarCpf(numeros) {
        return numeros
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function formatarDataBr(data) {
        if (!data) return "—";
        if (data.includes("/")) return data;
        const partes = data.split("-");
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return data;
    }

    function limparResultado() {
        pacienteAtual = null;
        cartaoResultado.classList.remove("encontrado");
        cartaoResultado.removeAttribute("tabindex");
        cartaoResultado.removeAttribute("role");
        cartaoResultado.removeAttribute("aria-label");
        resultadoCpf.textContent = "—";
        resultadoNome.textContent = "—";
        resultadoNascimento.textContent = "—";
    }

    async function buscarPacientePorCpf(cpf) {
        if (buscandoAgora) return;

        limparResultado();
        mensagem.textContent = "";

        if (cpf.length !== 11) {
            mensagem.textContent = "Digite os 11 números do CPF.";
            campoCpf.focus();
            return;
        }

        buscandoAgora = true;
        const textoOriginalBotao = botaoBuscar ? botaoBuscar.textContent : "Buscar";
        if (botaoBuscar) {
            botaoBuscar.disabled = true;
            botaoBuscar.textContent = "Buscando...";
        }

        try {
            let paciente = null;

            // 1. Busca na coleção "pacientes" do Firebase
            const qPacientes = query(
                collection(db, "pacientes"),
                where("cpfNumeros", "==", cpf)
            );
            const snapPacientes = await getDocs(qPacientes);

            if (!snapPacientes.empty) {
                const dados = snapPacientes.docs[0].data();
                paciente = {
                    ...dados,
                    cpfNumeros: cpf,
                    cpf: formatarCpf(cpf),
                    nome: dados.nome || "Paciente sem nome",
                    nascimento: dados.nascimento || ""
                };
            } else {
                // 2. Caso não esteja em "pacientes", busca nas "triagens" salvas no Firebase
                const qTriagens = query(
                    collection(db, "triagens"),
                    where("cpfNumeros", "==", cpf)
                );
                const snapTriagens = await getDocs(qTriagens);

                if (!snapTriagens.empty) {
                    const listaTriagens = snapTriagens.docs
                        .map(docSnap => docSnap.data())
                        .sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0));

                    const dadosSalvos = listaTriagens[0].dados || listaTriagens[0].respostas || {};
                    paciente = {
                        ...dadosSalvos,
                        cpfNumeros: cpf,
                        cpf: formatarCpf(cpf),
                        nome: dadosSalvos.nome || listaTriagens[0].pacienteNome || "Paciente sem nome",
                        nascimento: dadosSalvos.nascimento || ""
                    };
                }
            }

            // 3. Fallback nos pacientes de exemplo locais
            if (!paciente) {
                const exemplo = PACIENTES_EXEMPLO.find(item => item.cpf === cpf);
                if (exemplo) {
                    paciente = {
                        ...exemplo,
                        cpfNumeros: cpf,
                        cpf: formatarCpf(cpf)
                    };
                }
            }

            if (!paciente) {
                mensagem.textContent = "Nenhum paciente encontrado com esse CPF.";
                return;
            }

            // Exibe as 3 informações no cartão
            pacienteAtual = paciente;
            resultadoCpf.textContent = formatarCpf(cpf);
            resultadoNome.textContent = paciente.nome;
            resultadoNascimento.textContent = formatarDataBr(paciente.nascimento);

            // Limpa a barra de pesquisa assim que o paciente aparece
            campoCpf.value = "";

            // Transforma o cartão com as 3 informações em link para triagens.html
            cartaoResultado.classList.add("encontrado");
            cartaoResultado.setAttribute("tabindex", "0");
            cartaoResultado.setAttribute("role", "link");
            cartaoResultado.setAttribute("aria-label", "Abrir triagens de " + paciente.nome);
            mensagem.textContent = "Paciente encontrado. Clique nas informações para abrir as triagens.";

        } catch (erro) {
            console.error("Erro ao buscar paciente no Firebase:", erro);
            mensagem.textContent = "Erro ao buscar paciente no banco de dados.";
        } finally {
            buscandoAgora = false;
            if (botaoBuscar) {
                botaoBuscar.disabled = false;
                botaoBuscar.textContent = textoOriginalBotao;
            }
        }
    }

    // Máscara enquanto digita e busca automática ao completar os 11 dígitos do CPF
    campoCpf.addEventListener("input", () => {
        const numeros = somenteNumeros(campoCpf.value);
        campoCpf.value = formatarCpf(numeros);

        if (numeros.length === 11) {
            buscarPacientePorCpf(numeros);
        }
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        const cpf = somenteNumeros(campoCpf.value);
        buscarPacientePorCpf(cpf);
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
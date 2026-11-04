
// Tela de dados do paciente: editar e salvar
// Ainda não há banco de dados: os dados ficam salvos só neste navegador.

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE = "electrofisio-dados-paciente";

    const botaoEditar = document.getElementById("botaoEditar");
    const botaoSalvar = document.getElementById("botaoSalvar");
    const valores = document.querySelectorAll(".lista-dados .dado-item p");

    // Mensagem abaixo do cabeçalho do quadro
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-dados";
    mensagem.setAttribute("role", "status");
    document.querySelector(".dados-cabecalho").insertAdjacentElement("afterend", mensagem);

    function carregarSalvos() {
        try {
            const salvos = JSON.parse(localStorage.getItem(CHAVE));
            if (Array.isArray(salvos)) {
                valores.forEach((valor, indice) => {
                    if (salvos[indice] !== undefined) {
                        valor.textContent = salvos[indice];
                    }
                });
            }
        } catch (erro) {
            // Nada salvo ainda
        }
    }

    function modoEdicao(editando) {
        valores.forEach(valor => {
            valor.contentEditable = editando ? "true" : "false";
            valor.classList.toggle("editavel", editando);
        });

        botaoEditar.disabled = editando;
        botaoSalvar.disabled = !editando;
    }

    botaoEditar.addEventListener("click", () => {
        modoEdicao(true);
        mensagem.textContent = "Editando: clique em um dado para alterar.";
        valores[0].focus();
    });

    botaoSalvar.addEventListener("click", () => {
        const lista = Array.from(valores).map(valor => valor.textContent.trim());

        try {
            localStorage.setItem(CHAVE, JSON.stringify(lista));
            mensagem.textContent = "Dados salvos neste navegador.";
        } catch (erro) {
            mensagem.textContent = "Não foi possível salvar neste navegador.";
        }

        modoEdicao(false);
    });

    // Enter confirma o campo em vez de quebrar a linha
    valores.forEach(valor => {
        valor.addEventListener("keydown", evento => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                valor.blur();
            }
        });
    });

    carregarSalvos();
    modoEdicao(false);

});

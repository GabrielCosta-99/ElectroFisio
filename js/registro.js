
// Botões de ação do prontuário (anamnese) e do receituário:
// Novo, Salvar, Assinar, Cancelar e Copiar.
// Ainda não há banco de dados: o registro fica salvo só neste navegador.

document.addEventListener("DOMContentLoaded", () => {

    const area = document.querySelector("[data-registro]");
    if (!area) return;

    const CHAVE = "electrofisio-" + area.dataset.registro;

    const campos = area.querySelectorAll("input, textarea, select");
    const botoes = document.querySelectorAll(".acoes-prontuario [data-acao]");
    const barraAcoes = document.querySelector(".acoes-prontuario");

    // Mensagem logo abaixo dos botões
    const mensagem = document.createElement("p");
    mensagem.className = "status-registro";
    mensagem.setAttribute("role", "status");
    barraAcoes.insertAdjacentElement("afterend", mensagem);

    let assinadoEm = null;

    // ---------- Ler e preencher os campos ----------

    function lerValores() {
        const valores = {};

        campos.forEach(campo => {
            const nome = campo.name || campo.id;
            if (!nome) return;

            if (campo.type === "radio" || campo.type === "checkbox") {
                if (campo.checked) valores[nome] = campo.value;
            } else {
                valores[nome] = campo.value;
            }
        });

        return valores;
    }

    function preencher(valores) {
        campos.forEach(campo => {
            const nome = campo.name || campo.id;
            const valor = valores[nome];

            if (campo.type === "radio" || campo.type === "checkbox") {
                campo.checked = valor === campo.value;
            } else {
                campo.value = valor || "";
            }
        });
    }

    function estaVazio() {
        return Object.values(lerValores()).every(valor => !String(valor).trim());
    }

    function travar(travado) {
        campos.forEach(campo => {
            campo.disabled = travado;
        });
    }

    // ---------- Salvamento no navegador ----------

    function lerSalvo() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE));
        } catch (erro) {
            return null;
        }
    }

    function gravar() {
        try {
            localStorage.setItem(CHAVE, JSON.stringify({
                valores: lerValores(),
                assinadoEm: assinadoEm
            }));
            return true;
        } catch (erro) {
            return false;
        }
    }

    function agora() {
        return new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ---------- Texto para copiar ----------

    // Nome legível de um campo: legenda do grupo ou texto do rótulo
    function rotuloDoCampo(campo) {
        const grupo = campo.closest("fieldset");
        if ((campo.type === "radio" || campo.type === "checkbox") && grupo) {
            const legenda = grupo.querySelector("legend");
            if (legenda) return legenda.textContent.replace(":", "").trim();
        }

        const rotulo = campo.id
            ? area.querySelector("label[for=\"" + campo.id + "\"]")
            : null;
        const texto = (rotulo || campo.closest("label") || {}).textContent || campo.name;
        return texto.replace(/\s+/g, " ").replace(":", "").trim();
    }

    function textoParaCopiar() {
        const linhas = [];
        const vistos = [];

        campos.forEach(campo => {
            const nome = campo.name || campo.id;
            if (vistos.includes(nome)) return;

            let valor = campo.value;

            if (campo.type === "radio") {
                const marcado = area.querySelector("input[name=\"" + nome + "\"]:checked");
                if (!marcado) return;
                vistos.push(nome);
                valor = marcado.closest("label").textContent.replace(/\s+/g, " ").trim();
            }

            if (!String(valor).trim()) return;

            // Receituário: só o texto, sem rótulo
            if (campos.length === 1) {
                linhas.push(valor);
            } else {
                linhas.push(rotuloDoCampo(campo) + ": " + valor);
            }
        });

        if (assinadoEm) {
            linhas.push("", "Assinado em " + assinadoEm);
        }

        return linhas.join("\n");
    }

    // ---------- Ações ----------

    const acoes = {

        novo() {
            assinadoEm = null;
            preencher({});
            travar(false);
            mensagem.textContent = "Novo registro iniciado. Clique em Salvar para guardar.";
            const primeiro = area.querySelector("input, textarea");
            if (primeiro) primeiro.focus();
        },

        salvar() {
            if (assinadoEm) {
                mensagem.textContent = "Este registro já foi assinado e não pode ser alterado.";
                return;
            }
            mensagem.textContent = gravar()
                ? "Salvo neste navegador em " + agora() + "."
                : "Não foi possível salvar neste navegador.";
        },

        assinar() {
            if (assinadoEm) {
                mensagem.textContent = "Registro já assinado em " + assinadoEm + ".";
                return;
            }
            if (estaVazio()) {
                mensagem.textContent = "Preencha o registro antes de assinar.";
                return;
            }
            assinadoEm = agora();
            gravar();
            travar(true);
            mensagem.textContent = "Registro assinado em " + assinadoEm + ". Para fazer outro, use Novo.";
        },

        cancelar() {
            const salvo = lerSalvo();
            assinadoEm = salvo ? salvo.assinadoEm : null;
            preencher(salvo ? salvo.valores : {});
            travar(Boolean(assinadoEm));
            mensagem.textContent = "Alterações desfeitas.";
        },

        copiar() {
            const texto = textoParaCopiar();

            if (!texto) {
                mensagem.textContent = "Não há nada para copiar.";
                return;
            }

            if (!navigator.clipboard) {
                mensagem.textContent = "Este navegador não permite copiar automaticamente.";
                return;
            }

            navigator.clipboard.writeText(texto)
                .then(() => {
                    mensagem.textContent = "Registro copiado.";
                })
                .catch(() => {
                    mensagem.textContent = "Não foi possível copiar.";
                });
        }
    };

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            acoes[botao.dataset.acao]();
        });
    });

    // Um formulário sem botão de envio não deve recarregar a página
    if (area.tagName === "FORM") {
        area.addEventListener("submit", evento => evento.preventDefault());
    }

    // Abre com o último registro salvo
    const salvo = lerSalvo();
    if (salvo) {
        assinadoEm = salvo.assinadoEm;
        preencher(salvo.valores);
        travar(Boolean(assinadoEm));
        mensagem.textContent = assinadoEm
            ? "Registro assinado em " + assinadoEm + "."
            : "Último registro salvo carregado.";
    }

});

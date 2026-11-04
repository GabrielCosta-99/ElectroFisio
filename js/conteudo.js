
// Tela de conteúdo do estudante: materiais de estudo e envio de caso para a IA
// Ainda não há banco de dados: os materiais ficam salvos só neste navegador.

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE = "electrofisio-materiais";

    const abas = document.querySelectorAll(".abas-conteudo .botao-aba");
    const formMaterial = document.getElementById("formMaterial");
    const tituloForm = document.getElementById("tituloFormMaterial");
    const estadoMaterial = document.getElementById("estadoMaterial");
    const mensagemMaterial = document.getElementById("mensagemMaterial");
    const botaoNovo = document.getElementById("botaoNovoMaterial");
    const lista = document.getElementById("listaMateriais");
    const formCaso = document.getElementById("formCaso");
    const mensagemCaso = document.getElementById("mensagemCaso");

    let materialEditado = null;

    // ---------- Abas: levam até a seção escolhida ----------

    abas.forEach(aba => {
        aba.addEventListener("click", () => {
            abas.forEach(outra => outra.classList.toggle("ativo", outra === aba));

            const secao = document.getElementById(aba.dataset.secao);
            secao.scrollIntoView({ behavior: "smooth", block: "start" });
            secao.focus({ preventScroll: true });
        });
    });

    // ---------- Materiais salvos ----------

    function lerMateriais() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE)) || [];
        } catch (erro) {
            return [];
        }
    }

    function gravarMateriais(materiais) {
        try {
            localStorage.setItem(CHAVE, JSON.stringify(materiais));
            return true;
        } catch (erro) {
            return false;
        }
    }

    function mostrarLista() {
        const materiais = lerMateriais();
        lista.replaceChildren();

        if (materiais.length === 0) {
            const vazio = document.createElement("li");
            vazio.className = "lista-vazia";
            vazio.textContent = "Nenhum material criado ainda.";
            lista.appendChild(vazio);
            return;
        }

        materiais.forEach(material => {
            const item = document.createElement("li");
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "item-material";
            botao.classList.toggle("editando", material.id === materialEditado);

            const texto = document.createElement("span");
            texto.textContent = material.modalidade + " — " + material.titulo;

            const detalhe = document.createElement("small");
            detalhe.textContent = "Atualizado em " + material.atualizado;
            texto.appendChild(detalhe);

            const etiqueta = document.createElement("span");
            etiqueta.className = "etiqueta-estado " + (material.estado === "Rascunho" ? "rascunho" : "revisao");
            etiqueta.textContent = material.estado;

            botao.append(texto, etiqueta);
            botao.setAttribute("aria-label", "Editar " + material.titulo + " (" + material.estado + ")");
            botao.addEventListener("click", () => editarMaterial(material.id));

            item.appendChild(botao);
            lista.appendChild(item);
        });
    }

    // ---------- Formulário do material ----------

    function limparFormulario() {
        materialEditado = null;
        formMaterial.reset();
        tituloForm.textContent = "Novo material de estudo";
        estadoMaterial.textContent = "Rascunho";
        botaoNovo.classList.add("escondido");
        mostrarLista();
    }

    function editarMaterial(id) {
        const material = lerMateriais().find(item => item.id === id);
        if (!material) return;

        materialEditado = id;
        formMaterial.titulo.value = material.titulo;
        formMaterial.modalidade.value = material.modalidade;
        formMaterial.tema.value = material.tema;
        formMaterial.texto.value = material.texto;
        formMaterial.referencias.value = material.referencias;

        tituloForm.textContent = "Editando material";
        estadoMaterial.textContent = material.estado;
        mensagemMaterial.textContent = material.anexo ? "Anexo: " + material.anexo : "";
        botaoNovo.classList.remove("escondido");

        mostrarLista();
        document.getElementById("novoMaterial").scrollIntoView({ behavior: "smooth" });
    }

    formMaterial.addEventListener("submit", evento => {
        evento.preventDefault();

        // O botão clicado define o estado: rascunho ou revisão
        const estado = evento.submitter ? evento.submitter.dataset.estado : "Rascunho";
        const materiais = lerMateriais();
        const arquivo = formMaterial.anexo.files[0];
        const existente = materiais.find(item => item.id === materialEditado);

        const material = {
            id: materialEditado || Date.now(),
            titulo: formMaterial.titulo.value.trim(),
            modalidade: formMaterial.modalidade.value,
            tema: formMaterial.tema.value.trim(),
            texto: formMaterial.texto.value.trim(),
            referencias: formMaterial.referencias.value.trim(),
            anexo: arquivo ? arquivo.name : (existente ? existente.anexo : ""),
            estado: estado,
            atualizado: new Date().toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            })
        };

        if (existente) {
            materiais[materiais.indexOf(existente)] = material;
        } else {
            materiais.unshift(material);
        }

        if (!gravarMateriais(materiais)) {
            mensagemMaterial.textContent = "Não foi possível salvar neste navegador.";
            return;
        }

        limparFormulario();
        mensagemMaterial.textContent = estado === "Rascunho"
            ? "Rascunho salvo em Meus materiais."
            : "Material enviado para revisão.";
    });

    botaoNovo.addEventListener("click", () => {
        limparFormulario();
        mensagemMaterial.textContent = "";
        formMaterial.titulo.focus();
    });

    // ---------- Enviar caso para a IA ----------
    // A integração com a IA ainda não existe: por enquanto só confirma o envio.

    formCaso.addEventListener("submit", evento => {
        evento.preventDefault();

        mensagemCaso.textContent =
            "Caso registrado, mas ainda não foi enviado.\n" +
            "A resposta da IA estará disponível quando o ElectroFisio for integrado à API de Inteligência Artificial.";
    });

    mostrarLista();

});


// Tela de conteúdo do estudante: criar materiais de estudo e acompanhar a revisão
// Ainda não há banco de dados: os materiais ficam salvos só neste navegador.

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE = "electrofisio-materiais";

    const abas = document.querySelectorAll(".abas-conteudo [role='tab']");
    const formMaterial = document.getElementById("formMaterial");
    const tituloForm = document.getElementById("tituloFormMaterial");
    const estadoMaterial = document.getElementById("estadoMaterial");
    const mensagemMaterial = document.getElementById("mensagemMaterial");
    const botaoNovo = document.getElementById("botaoNovoMaterial");
    const lista = document.getElementById("listaMateriais");

    let materialEditado = null;

    const CLASSE_ESTADO = {
        "Rascunho": "rascunho",
        "Em revisão": "revisao",
        "Aprovado": "aprovado",
        "Devolvido": "devolvido"
    };

    // Mensagem abaixo da lista de materiais
    const mensagemLista = document.createElement("p");
    mensagemLista.className = "mensagem-conteudo";
    mensagemLista.setAttribute("role", "status");
    lista.insertAdjacentElement("afterend", mensagemLista);

    // ---------- Abas: mostram uma seção por vez ----------

    function abrirAba(secao) {
        abas.forEach(aba => {
            const ativa = aba.dataset.secao === secao;
            aba.classList.toggle("ativo", ativa);
            aba.setAttribute("aria-selected", String(ativa));
            document.getElementById(aba.dataset.secao).hidden = !ativa;
        });
    }

    abas.forEach(aba => {
        aba.addEventListener("click", () => abrirAba(aba.dataset.secao));
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
            item.className = "linha-material";
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
            etiqueta.className = "etiqueta-estado " + CLASSE_ESTADO[material.estado];
            etiqueta.textContent = material.estado;

            if (material.observacao) {
                const observacao = document.createElement("small");
                observacao.textContent = "Revisão: " + material.observacao;
                texto.appendChild(observacao);
            }

            botao.append(texto, etiqueta);
            botao.setAttribute("aria-label", "Editar " + material.titulo + " (" + material.estado + ")");
            botao.addEventListener("click", () => editarMaterial(material.id));

            item.appendChild(botao);

            // Rascunhos e materiais devolvidos podem ser excluídos
            if (material.estado !== "Em revisão" && material.estado !== "Aprovado") {
                const excluir = document.createElement("button");
                excluir.type = "button";
                excluir.className = "botao-excluir";
                excluir.textContent = "Excluir";
                excluir.setAttribute("aria-label", "Excluir " + material.titulo);
                excluir.addEventListener("click", () => excluirMaterial(material));
                item.appendChild(excluir);
            }

            lista.appendChild(item);
        });
    }

    function excluirMaterial(material) {
        if (!confirm("Excluir \"" + material.titulo + "\"? Essa ação não pode ser desfeita.")) {
            return;
        }

        gravarMateriais(lerMateriais().filter(item => item.id !== material.id));

        if (materialEditado === material.id) {
            limparFormulario();
        } else {
            mostrarLista();
        }

        mensagemLista.textContent = "Material excluído.";
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
        abrirAba("novoMaterial");
        formMaterial.titulo.focus();
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
            observacao: "",
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
            : "Material enviado para revisão. Um professor ou profissional vai aprovar ou devolver.";
    });

    botaoNovo.addEventListener("click", () => {
        limparFormulario();
        mensagemMaterial.textContent = "";
        formMaterial.titulo.focus();
    });

    mostrarLista();

});

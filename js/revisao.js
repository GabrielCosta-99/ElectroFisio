
// Tela do profissional: aprovar ou devolver os materiais enviados pelos estudantes
// Usa os mesmos materiais da tela Conteúdo (salvos só neste navegador).

document.addEventListener("DOMContentLoaded", () => {

    const CHAVE = "electrofisio-materiais";

    const listaRevisao = document.getElementById("listaRevisao");
    const listaRevisados = document.getElementById("listaRevisados");
    const materialAberto = document.getElementById("materialAberto");

    // Material de exemplo para a apresentação, quando ninguém enviou nada ainda
    const EXEMPLO = {
        id: 1,
        titulo: "Resumo: TENS convencional",
        modalidade: "TENS",
        tema: "parâmetros",
        texto: "A TENS convencional usa frequências de cerca de 50 a 100 Hz e pulsos de 50 a 200 µs. A intensidade deve gerar formigamento forte e confortável, sem dor e sem contração visível.",
        referencias: "Johnson et al., 2022; Vance et al., 2022.",
        anexo: "",
        estado: "Em revisão",
        observacao: "",
        atualizado: "12/11/2026 09:00"
    };

    function lerMateriais() {
        try {
            const materiais = JSON.parse(localStorage.getItem(CHAVE));
            return Array.isArray(materiais) ? materiais : [EXEMPLO];
        } catch (erro) {
            return [EXEMPLO];
        }
    }

    function gravarMateriais(materiais) {
        try {
            localStorage.setItem(CHAVE, JSON.stringify(materiais));
        } catch (erro) {
            // Sem armazenamento: a revisão vale só até recarregar
        }
    }

    function itemLista(material) {
        const item = document.createElement("li");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "item-material";

        const texto = document.createElement("span");
        texto.textContent = material.modalidade + " — " + material.titulo;

        const detalhe = document.createElement("small");
        detalhe.textContent = "Enviado em " + material.atualizado;
        texto.appendChild(detalhe);

        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta-estado " +
            ({ "Em revisão": "revisao", "Aprovado": "aprovado", "Devolvido": "devolvido" })[material.estado];
        etiqueta.textContent = material.estado;

        botao.append(texto, etiqueta);
        botao.addEventListener("click", () => abrirMaterial(material.id));

        item.appendChild(botao);
        return item;
    }

    function vazio(texto) {
        const item = document.createElement("li");
        item.className = "lista-vazia";
        item.textContent = texto;
        return item;
    }

    function mostrarListas() {
        const materiais = lerMateriais();
        const pendentes = materiais.filter(material => material.estado === "Em revisão");
        const revisados = materiais.filter(material => material.estado === "Aprovado" || material.estado === "Devolvido");

        listaRevisao.replaceChildren(...(pendentes.length ? pendentes.map(itemLista) : [vazio("Nenhum material aguardando revisão.")]));
        listaRevisados.replaceChildren(...(revisados.length ? revisados.map(itemLista) : [vazio("Nenhum material revisado ainda.")]));
    }

    function linha(rotulo, valor) {
        const p = document.createElement("p");
        const forte = document.createElement("strong");
        forte.textContent = rotulo + ": ";
        p.append(forte, document.createTextNode(valor || "—"));
        return p;
    }

    function abrirMaterial(id) {
        const material = lerMateriais().find(item => item.id === id);
        if (!material) return;

        materialAberto.replaceChildren();

        const titulo = document.createElement("h2");
        titulo.textContent = material.titulo;

        materialAberto.append(
            titulo,
            linha("Modalidade", material.modalidade),
            linha("Tema", material.tema),
            linha("Texto", material.texto),
            linha("Referências", material.referencias),
            linha("Anexo", material.anexo),
            linha("Situação", material.estado)
        );

        if (material.estado === "Em revisão") {
            const rotulo = document.createElement("label");
            rotulo.className = "campo-observacao";
            rotulo.textContent = "Observação para o estudante";

            const observacao = document.createElement("textarea");
            observacao.rows = 3;
            observacao.placeholder = "Obrigatória ao devolver: diga o que precisa ser ajustado.";
            rotulo.appendChild(observacao);

            const acoes = document.createElement("div");
            acoes.className = "acoes acoes-card";

            const aprovar = document.createElement("button");
            aprovar.type = "button";
            aprovar.className = "botao-acao principal";
            aprovar.textContent = "Aprovar";

            const devolver = document.createElement("button");
            devolver.type = "button";
            devolver.className = "botao-acao";
            devolver.textContent = "Devolver para ajustes";

            const aviso = document.createElement("p");
            aviso.className = "mensagem-conteudo";
            aviso.setAttribute("role", "status");

            aprovar.addEventListener("click", () => revisar(material.id, "Aprovado", observacao.value.trim()));
            devolver.addEventListener("click", () => {
                if (!observacao.value.trim()) {
                    aviso.textContent = "Escreva uma observação para o estudante antes de devolver.";
                    observacao.focus();
                    return;
                }
                revisar(material.id, "Devolvido", observacao.value.trim());
            });

            acoes.append(aprovar, devolver);
            materialAberto.append(rotulo, acoes, aviso);
        } else if (material.observacao) {
            materialAberto.appendChild(linha("Observação", material.observacao));
        }

        materialAberto.focus();
    }

    function revisar(id, estado, observacao) {
        const materiais = lerMateriais();
        const material = materiais.find(item => item.id === id);

        material.estado = estado;
        material.observacao = observacao;

        gravarMateriais(materiais);
        mostrarListas();
        abrirMaterial(id);
    }

    mostrarListas();

});

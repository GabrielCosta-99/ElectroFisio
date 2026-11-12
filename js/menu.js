
// Ajusta o menu do topo conforme o perfil que entrou no login:
// o estudante vê "Conteúdo" no lugar de "Pacientes" e cada perfil tem seu Início.

document.addEventListener("DOMContentLoaded", () => {

    let perfil = "profissional";

    try {
        perfil = localStorage.getItem("electrofisio-perfil") || "profissional";
    } catch (erro) {
        // Sem armazenamento: usa o menu do profissional
    }

    const estudante = perfil === "estudante";
    const inicio = estudante ? "inicio.html" : "inicio-profissional.html";

    document.querySelectorAll(".cabecalho-navegacao a").forEach(link => {
        const destino = link.getAttribute("href");

        if (destino === "inicio.html" || destino === "inicio-profissional.html") {
            link.setAttribute("href", inicio);
        }

        if (estudante && destino === "pacientes.html") {
            link.setAttribute("href", "conteudo.html");
            link.textContent = "Conteúdo";
        }

        if (!estudante && destino === "conteudo.html") {
            link.setAttribute("href", "pacientes.html");
            link.textContent = "Pacientes";
        }
    });

    // Botão "Menu" para o celular: mostra e esconde os links do topo
    const cabecalho = document.querySelector(".cabecalho");
    const navegacao = document.querySelector(".cabecalho-navegacao");

    if (cabecalho && navegacao) {
        navegacao.id = navegacao.id || "navegacaoPrincipal";

        const botaoMenu = document.createElement("button");
        botaoMenu.type = "button";
        botaoMenu.className = "botao-menu";
        botaoMenu.setAttribute("aria-expanded", "false");
        botaoMenu.setAttribute("aria-controls", navegacao.id);
        botaoMenu.innerHTML = "<span class=\"icone-menu\" aria-hidden=\"true\">☰</span> Menu";

        botaoMenu.addEventListener("click", () => {
            const aberto = cabecalho.classList.toggle("menu-aberto");
            botaoMenu.setAttribute("aria-expanded", String(aberto));
        });

        navegacao.insertAdjacentElement("beforebegin", botaoMenu);
        cabecalho.classList.add("com-menu");
    }

    // Nome e CREFITO no topo das telas do paciente (vêm do Meu perfil)
    const infoProfissional = document.querySelector(".profissional-info");

    if (infoProfissional) {
        let dados = { nome: "Ana Souza", crefito: "123456-F" };

        try {
            const salvos = JSON.parse(localStorage.getItem("electrofisio-dados-perfil")) || {};
            dados = Object.assign(dados, salvos.profissional);
        } catch (erro) {
            // Sem armazenamento: usa o perfil de teste
        }

        const linhas = infoProfissional.querySelectorAll("span");
        if (linhas.length >= 2) {
            linhas[0].textContent = dados.nome;
            linhas[1].textContent = "CREFITO: " + dados.crefito;
        }
    }

});

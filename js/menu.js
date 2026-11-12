
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


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

});

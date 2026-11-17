
// Tela de carregamento: espera um instante e segue para a próxima tela.
// O destino pode ser passado na URL: carregamento.html?destino=visao-geral.html

const TEMPO_CARREGAMENTO = 2500; // milissegundos
// Cada perfil tem a sua tela de início (o perfil é guardado no login)
let perfilAtual = "profissional";
try {
    perfilAtual = localStorage.getItem("electrofisio-perfil") || "profissional";
} catch (erro) {
    // Sem armazenamento: usa o início do profissional
}

const DESTINO_PADRAO = perfilAtual === "estudante" ? "inicio.html" : "inicio-profissional.html";

const parametros = new URLSearchParams(window.location.search);
let destino = parametros.get("destino") || DESTINO_PADRAO;

// Só aceita páginas do próprio sistema (sem endereços de outros sites)
if (!/^[a-z0-9-]+\.html$/i.test(destino)) {
    destino = DESTINO_PADRAO;
}

setTimeout(function () {
    window.location.href = destino;
}, TEMPO_CARREGAMENTO);

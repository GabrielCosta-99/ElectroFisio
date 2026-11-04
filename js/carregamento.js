
// Tela de carregamento: espera um instante e segue para a próxima tela.
// O destino pode ser passado na URL: carregamento.html?destino=visao-geral.html

const TEMPO_CARREGAMENTO = 2500; // milissegundos
const DESTINO_PADRAO = "inicio.html";

const parametros = new URLSearchParams(window.location.search);
let destino = parametros.get("destino") || DESTINO_PADRAO;

// Só aceita páginas do próprio sistema (sem endereços de outros sites)
if (!/^[a-z0-9-]+\.html$/i.test(destino)) {
    destino = DESTINO_PADRAO;
}

setTimeout(function () {
    window.location.href = destino;
}, TEMPO_CARREGAMENTO);


// Aplica as preferências de acessibilidade salvas em todas as telas.
// Este arquivo deve ser carregado no <head> para a página já abrir ajustada.

const CHAVE_ACESSIBILIDADE = "electrofisio-acessibilidade";

const ACESSIBILIDADE_PADRAO = {
    textoGrande: false,
    altoContraste: false,
    leitorTela: false,
    legendas: false
};

function lerAcessibilidade() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_ACESSIBILIDADE));
        return Object.assign({}, ACESSIBILIDADE_PADRAO, salvo);
    } catch (erro) {
        return Object.assign({}, ACESSIBILIDADE_PADRAO);
    }
}

function salvarAcessibilidade(preferencias) {
    try {
        localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(preferencias));
        return true;
    } catch (erro) {
        return false;
    }
}

// Cada preferência vira uma classe no <html>, usada pelo css/acessibilidade.css
function aplicarAcessibilidade(preferencias) {
    const raiz = document.documentElement;
    raiz.classList.toggle("texto-grande", preferencias.textoGrande);
    raiz.classList.toggle("alto-contraste", preferencias.altoContraste);
    raiz.classList.toggle("leitor-tela", preferencias.leitorTela);
    raiz.classList.toggle("legendas", preferencias.legendas);
}

aplicarAcessibilidade(lerAcessibilidade());


// Tela de configurações de acessibilidade

const botoesTamanho = document.querySelectorAll(".botao-tamanho");
const interruptores = document.querySelectorAll(".interruptor");
const botaoSalvar = document.getElementById("botaoSalvar");
const botaoRestaurar = document.getElementById("botaoRestaurar");
const mensagemSalvo = document.getElementById("mensagemSalvo");
const linkVoltar = document.getElementById("linkVoltar");

// Começa com o que já estava salvo
let preferencias = lerAcessibilidade();

function mostrarPreferencias() {
    botoesTamanho.forEach(function (botao) {
        const grande = botao.dataset.tamanho === "grande";
        botao.classList.toggle("ativo", grande === preferencias.textoGrande);
        botao.setAttribute("aria-pressed", String(grande === preferencias.textoGrande));
    });

    interruptores.forEach(function (interruptor) {
        interruptor.setAttribute("aria-checked", String(preferencias[interruptor.dataset.opcao]));
    });

    // A própria tela já mostra como vai ficar
    aplicarAcessibilidade(preferencias);
}

botoesTamanho.forEach(function (botao) {
    botao.addEventListener("click", function () {
        preferencias.textoGrande = botao.dataset.tamanho === "grande";
        mensagemSalvo.textContent = "";
        mostrarPreferencias();
    });
});

interruptores.forEach(function (interruptor) {
    interruptor.addEventListener("click", function () {
        const opcao = interruptor.dataset.opcao;
        preferencias[opcao] = !preferencias[opcao];
        mensagemSalvo.textContent = "";
        mostrarPreferencias();
    });
});

botaoSalvar.addEventListener("click", function () {
    if (salvarAcessibilidade(preferencias)) {
        mensagemSalvo.textContent = "Alterações salvas.";
    } else {
        mensagemSalvo.textContent = "Não foi possível salvar neste navegador.";
    }
});

botaoRestaurar.addEventListener("click", function () {
    preferencias = Object.assign({}, ACESSIBILIDADE_PADRAO);
    salvarAcessibilidade(preferencias);
    mostrarPreferencias();
    mensagemSalvo.textContent = "Configurações padrão restauradas.";
});

// Voltar para a tela anterior (ou para o início, se abriu direto)
linkVoltar.addEventListener("click", function (evento) {
    evento.preventDefault();
    if (history.length > 1) {
        history.back();
    } else {
        window.location.href = "inicio-profissional.html";
    }
});

// Se sair sem salvar, a próxima tela usa o que estava salvo
mostrarPreferencias();

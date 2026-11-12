
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
        const ativo = botao.dataset.tamanho === preferencias.tamanhoTexto;
        botao.classList.toggle("ativo", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });

    interruptores.forEach(function (interruptor) {
        interruptor.setAttribute("aria-checked", String(preferencias[interruptor.dataset.opcao]));
    });

    // A própria tela já mostra como vai ficar
    aplicarAcessibilidade(preferencias);
}

botoesTamanho.forEach(function (botao) {
    botao.addEventListener("click", function () {
        preferencias.tamanhoTexto = botao.dataset.tamanho;
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

        // Confirma por voz que o leitor foi ligado
        if (opcao === "leitorTela" && preferencias.leitorTela) {
            lerEmVozAlta("Leitor de tela ativado. Passe o mouse sobre um texto para ouvir.");
        }
    });
});

botaoSalvar.addEventListener("click", function () {
    if (salvarAcessibilidade(preferencias)) {
        mensagemSalvo.textContent = "Alterações salvas. Elas valem para todas as telas.";
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

    // Sem salvar, a tela anterior continua com o que estava salvo
    if (document.referrer && history.length > 1) {
        history.back();
        return;
    }

    let perfil = "profissional";
    try {
        perfil = localStorage.getItem("electrofisio-perfil") || perfil;
    } catch (erro) {
        // Sem armazenamento: vai para o início do profissional
    }

    window.location.href = perfil === "estudante" ? "inicio.html" : "inicio-profissional.html";
});

// Se sair sem salvar, a próxima tela usa o que estava salvo
mostrarPreferencias();


// Formatação e validação de CPF, telefone e e-mail.
// Usado no cadastro, no perfil, na triagem e nos dados do paciente.

const Validacao = (function () {

    function somenteNumeros(texto, limite) {
        return String(texto).replace(/\D/g, "").slice(0, limite);
    }

    // 12345678901 -> 123.456.789-01
    function formatarCpf(texto) {
        return somenteNumeros(texto, 11)
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    // 31912345678 -> (31) 91234-5678 / 3132345678 -> (31) 3234-5678
    function formatarTelefone(texto) {
        const numeros = somenteNumeros(texto, 11);

        if (numeros.length <= 2) {
            return numeros.length ? "(" + numeros : "";
        }

        const ddd = numeros.slice(0, 2);
        const resto = numeros.slice(2);
        const meio = resto.length > 8 ? 5 : 4;

        if (resto.length <= meio) {
            return "(" + ddd + ") " + resto;
        }
        return "(" + ddd + ") " + resto.slice(0, meio) + "-" + resto.slice(meio);
    }

    // Retorna a mensagem de erro, ou "" se estiver certo
    function erroCpf(texto) {
        const numeros = somenteNumeros(texto, 20);

        if (numeros.length !== 11) {
            return "O CPF deve ter 11 números.";
        }
        if (/^(\d)\1{10}$/.test(numeros)) {
            return "CPF inválido.";
        }
        return "";
    }

    function erroTelefone(texto) {
        const numeros = somenteNumeros(texto, 20);

        if (numeros.length !== 10 && numeros.length !== 11) {
            return "Informe DDD + número (ex.: (31) 91234-5678).";
        }
        if (numeros.length === 11 && numeros[2] !== "9") {
            return "Celular deve começar com 9 depois do DDD.";
        }
        return "";
    }

    function erroEmail(texto) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(texto).trim())
            ? ""
            : "Informe um e-mail válido (ex.: nome@exemplo.com).";
    }

    const TIPOS = {
        cpf: { formatar: formatarCpf, erro: erroCpf, tamanho: 14 },
        telefone: { formatar: formatarTelefone, erro: erroTelefone, tamanho: 15 },
        email: { formatar: null, erro: erroEmail, tamanho: null }
    };

    function tipoDoCampo(campo) {
        const nome = (campo.name || campo.id || "").toLowerCase();

        if (nome.indexOf("cpf") !== -1) return "cpf";
        if (nome.indexOf("telefone") !== -1 || campo.type === "tel") return "telefone";
        if (nome.indexOf("email") !== -1 || campo.type === "email") return "email";
        return null;
    }

    // Mensagem de erro logo abaixo do campo
    function mostrarErro(campo, texto) {
        let aviso = campo.nextElementSibling;

        if (!aviso || !aviso.classList.contains("erro-campo")) {
            aviso = document.createElement("small");
            aviso.className = "erro-campo";
            aviso.id = (campo.id || campo.name) + "Erro";
            aviso.setAttribute("aria-live", "polite");
            campo.insertAdjacentElement("afterend", aviso);
            campo.setAttribute("aria-describedby", aviso.id);
        }

        aviso.textContent = texto;
        campo.classList.toggle("campo-invalido", Boolean(texto));
        campo.setAttribute("aria-invalid", String(Boolean(texto)));
    }

    function validarCampo(campo) {
        const tipo = TIPOS[tipoDoCampo(campo)];

        // Campo vazio e não obrigatório não mostra erro
        if (!tipo || campo.disabled || (!campo.value.trim() && !campo.required)) {
            mostrarErro(campo, "");
            return true;
        }

        const erro = tipo.erro(campo.value);
        mostrarErro(campo, erro);
        return !erro;
    }

    // Liga máscara e validação em todos os campos de CPF, telefone e e-mail
    function prepararCampos(raiz) {
        const campos = Array.from(raiz.querySelectorAll("input")).filter(campo => tipoDoCampo(campo));

        campos.forEach(campo => {
            const tipo = TIPOS[tipoDoCampo(campo)];

            if (tipo.tamanho) {
                campo.maxLength = tipo.tamanho;
                campo.inputMode = "numeric";
            }

            campo.addEventListener("input", () => {
                if (tipo.formatar) {
                    campo.value = tipo.formatar(campo.value);
                }
                if (campo.classList.contains("campo-invalido")) {
                    validarCampo(campo);
                }
            });

            campo.addEventListener("blur", () => validarCampo(campo));
        });

        // Valida tudo; devolve true se estiver certo e foca o primeiro erro
        return function validarTodos() {
            const invalidos = campos.filter(campo => !validarCampo(campo));
            if (invalidos.length) {
                invalidos[0].focus();
            }
            return invalidos.length === 0;
        };
    }

    // Bloqueia o envio do formulário enquanto houver erro
    function protegerFormulario(formulario) {
        const validarTodos = prepararCampos(formulario);

        formulario.addEventListener("submit", evento => {
            if (!validarTodos()) {
                evento.preventDefault();
                evento.stopImmediatePropagation();
            }
        }, true);

        return validarTodos;
    }

    return {
        formatarCpf: formatarCpf,
        formatarTelefone: formatarTelefone,
        erroCpf: erroCpf,
        erroTelefone: erroTelefone,
        erroEmail: erroEmail,
        prepararCampos: prepararCampos,
        protegerFormulario: protegerFormulario
    };

})();


// Partes comuns das telas do paciente (dados, prontuário, receituário e triagens)

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    // Registros dos profissionais: cada um abre um exemplo do que foi registrado.
    // Ainda não há banco de dados: os textos são exemplos para a apresentação.
    const EXEMPLOS = {
        "prontuario.html": [
            "Evolução: sessão de TENS convencional no joelho direito (80 Hz, 100 µs, 20 min). Dor ao subir escadas passou de 6 para 3 (0 a 10). Pele sem alterações.",
            "Evolução: reavaliação da dor e orientação de exercícios domiciliares. Paciente relata melhora para caminhar.",
            "Avaliação inicial: dor no joelho direito há 4 meses, pele íntegra e sensibilidade preservada. Plano: TENS como recurso complementar."
        ],
        "receituario.html": [
            "Orientação: exercícios de fortalecimento de quadríceps, 3 séries de 10, em dias alternados.",
            "Orientação: manter atividades com pausas e aplicar compressa fria por 15 minutos se houver dor.",
            "Orientação: caminhada leve de 20 minutos, 3 vezes por semana."
        ],
        "triagens.html": [
            "Triagem: questionário de segurança sem alertas e mapeamento TENS do joelho direito.",
            "Triagem: mapeamento FES; contração presente, ainda insuficiente para a tarefa.",
            "Triagem inicial: dados cadastrais conferidos."
        ]
    };

    const pagina = window.location.pathname.split("/").pop();
    const textos = EXEMPLOS[pagina];

    if (!textos) {
        return;
    }

    document.querySelectorAll(".registro-item").forEach((registro, indice) => {
        const detalhe = document.createElement("p");
        detalhe.className = "registro-detalhe";
        detalhe.textContent = textos[indice % textos.length];
        detalhe.hidden = true;
        registro.appendChild(detalhe);

        registro.tabIndex = 0;
        registro.setAttribute("role", "button");
        registro.setAttribute("aria-expanded", "false");

        function alternar() {
            const abrir = detalhe.hidden;
            detalhe.hidden = !abrir;
            registro.classList.toggle("aberto", abrir);
            registro.setAttribute("aria-expanded", String(abrir));
        }

        registro.addEventListener("click", alternar);
        registro.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                alternar();
            }
        });
    });
});

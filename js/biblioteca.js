// Para cadastrar um novo PDF:
// 1. Coloque o arquivo na pasta pdfs do projeto.
// 2. Adicione um objeto na lista "materiais" da categoria desejada.
// 3. Em "arquivo", escreva o nome exato do PDF, incluindo a extensão .pdf.

const catalogoBiblioteca = [
  {
    "categoria": "TENS e dor",
    "descricao": "Casos e especificações da calculadora TENS.",
    "icone": "⚡",
    "materiais": [
      {
        "titulo": "Casos de TENS — estudos de caso e respostas comentadas",
        "descricao": "Dois casos fictícios propõem situações para discutir: dor no joelho durante atividades do dia a dia e queimação sob o eletrodo. As respostas comentadas explicam o raciocínio por trás de cada decisão.",
        "arquivo": "ElectroFisio_Casos_TENS_com_Imagem.pdf"
      },
      {
        "titulo": "Calculadora TENS — especificação clínica e funcional (v1.0)",
        "descricao": "A primeira versão descreve o que a calculadora deve perguntar na triagem, quando solicitar revisão profissional e como registrar a resposta à estimulação. É uma proposta para discussão com especialistas.",
        "arquivo": "Especificacao_Clinica_TENS_Para_TI.pdf"
      },
      {
        "titulo": "Calculadora TENS — especificação técnica e clínica (v2.0)",
        "descricao": "Voltada à equipe de desenvolvimento, esta versão detalha o questionário, as condições de cada regra e os resultados esperados nos testes do protótipo. Os exemplos usam o Neurodyn II como equipamento de referência.",
        "arquivo": "Especificacao_TENS_Completa_Valores_Regras_Referencias_TI.pdf"
      }
    ]
  },
  {
    "categoria": "FES e estimulação motora",
    "descricao": "Desenvolvimento da calculadora de estimulação elétrica funcional.",
    "icone": "⚡",
    "materiais": [
      {
        "titulo": "Guia completo para desenvolver a calculadora de FES",
        "descricao": "O guia parte do movimento que se deseja produzir para organizar as perguntas sobre função muscular, resposta à estimulação e equipamento disponível. Inclui um fluxograma e uma proposta de validação da calculadora.",
        "arquivo": "Guia_Integral_Calculadora_FES.pdf"
      }
    ]
  },
  {
    "categoria": "Segurança",
    "descricao": "Cuidados com a eletroestimulação e fundamentos de primeiros socorros.",
    "icone": "🛡️",
    "materiais": [
      {
        "titulo": "Segurança em TENS e FES",
        "descricao": "Uma lista de seis itens organiza a conferência antes da sessão. O material também aborda a avaliação da pele, a presença de dispositivos implantáveis e os cuidados durante e após a estimulação.",
        "arquivo": "ElectroFisio_Seguranca_TENS_FES_com_Imagem.pdf"
      },
      {
        "titulo": "Noções básicas de anatomia, fisiologia humana e primeiros socorros",
        "descricao": "Este e-book do programa Saúde com Agente apresenta os sistemas do corpo humano e suas funções. A parte de primeiros socorros aborda situações como queimaduras e diferencia exemplos de origem química e térmica.",
        "arquivo": "e-book-disc-22-nocoes-basicas-de-anatomia-fisiologia-humana-e-nocoes-de-primeiros-socorros-1685547601.pdf"
      }
    ]
  },
  {
    "categoria": "Equipamentos",
    "descricao": "Instruções de uso e boas práticas com equipamentos clínicos.",
    "icone": "📘",
    "materiais": [
      {
        "titulo": "Manual do Neurodyn Portable System e Neurodyn Portable TENS/FES",
        "descricao": "Manual da IBRAMED para a linha Neurodyn Portable. A 12ª edição identifica os modelos, explica os símbolos dos rótulos e reúne as instruções de uso do fabricante.",
        "arquivo": "Manual_Neurodyn_Portable_TENS_FES.pdf"
      },
      {
        "titulo": "Boas práticas na atenção primária à saúde — equipamentos clínicos e gerais",
        "descricao": "Guia do Ministério da Saúde para profissionais da atenção primária. Apresenta equipamentos usados no serviço, entre eles o eletroestimulador TENS/FES, o aparelho digital de pressão arterial e o oxímetro.",
        "arquivo": "boas_praticas_aps_equipamentos_clinicos_profissional.pdf"
      }
    ]
  },
  {
    "categoria": "Fundamentos de TENS e FES",
    "descricao": "Guias e parâmetros comuns às duas modalidades.",
    "icone": "📚",
    "materiais": [
      {
        "titulo": "TENS e FES — conteúdo educativo completo do ElectroFisio",
        "descricao": "Percorre as seis abas do ElectroFisio, da visão geral aos casos fictícios. Reúne em um só documento as explicações sobre aparelho, eletrodos, parâmetros e segurança, com tabelas e perguntas frequentes.",
        "arquivo": "ElectroFisio_TENS_FES_Conteudo_Completo_com_Imagem.pdf"
      },
      {
        "titulo": "Parâmetros de TENS e FES",
        "descricao": "O dicionário explica o que cada ajuste do aparelho representa e em qual unidade ele é medido. Os exercícios do simulador permitem praticar a leitura desses valores nos modos Explorar e Praticar.",
        "arquivo": "ElectroFisio_Parametros_TENS_FES_com_Imagem.pdf"
      },
      {
        "titulo": "Guia de eletrotermofototerapia — TENS e FES",
        "descricao": "O livro dedica o capítulo 2 à TENS e o capítulo 5 à FES. Também apresenta outros recursos da fisioterapia, como o ultrassom e o laser terapêutico.",
        "arquivo": "Guia_Eletrotermofototerapia_TENS_FES.pdf"
      }
    ]
  }
];

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) elemento.className = classe;
  if (texto) elemento.textContent = texto;

  return elemento;
}

function criarMaterial({ titulo, descricao, arquivo }) {
  const item = document.createElement("li");

  const ler = criarElemento("a", "", "Ler PDF");
  ler.href = "../pdfs/" + encodeURIComponent(arquivo);
  ler.target = "_blank";
  ler.rel = "noopener";
  ler.setAttribute("aria-label", "Ler PDF: " + titulo);

  const baixar = criarElemento("a", "", "Baixar PDF");
  baixar.href = ler.href;
  baixar.download = arquivo;
  baixar.setAttribute("aria-label", "Baixar PDF: " + titulo);

  const links = document.createElement("div");
  links.append(ler, " · ", baixar);

  item.append(
    criarElemento("strong", "", titulo),
    criarElemento("p", "", descricao),
    links
  );

  return item;
}

function criarCategoria({ categoria, descricao, icone, materiais }) {
  const painel = criarElemento("details", "biblioteca-tema");
  const cabecalho = criarElemento("summary", "tema-cabecalho");

  const simbolo = criarElemento("span", "tema-icone", icone);
  simbolo.setAttribute("aria-hidden", "true");

  const textos = criarElemento("span", "tema-textos");
  textos.append(
    criarElemento("span", "tema-titulo", categoria),
    criarElemento("span", "tema-descricao", descricao)
  );

  const total = materiais.length;
  const contagem = criarElemento(
    "span",
    "tema-contagem",
    total + (total === 1 ? " PDF" : " PDFs")
  );

  const seta = criarElemento("span", "tema-seta", "⌄");
  seta.setAttribute("aria-hidden", "true");

  cabecalho.append(simbolo, textos, contagem, seta);

  const conteudo = criarElemento("div", "tema-conteudo");
  const lista = criarElemento("ul", "lista-referencias");

  lista.append(...materiais.map(criarMaterial));
  conteudo.append(lista);
  painel.append(cabecalho, conteudo);

  return painel;
}

document.querySelector(".biblioteca-grade").append(
  ...catalogoBiblioteca.map(criarCategoria)
);
# ElectroFisio

O **ElectroFisio** é uma plataforma educacional desenvolvida para apoiar estudantes de Fisioterapia no aprendizado sobre recursos de eletroterapia, oferecendo funcionalidades voltadas à organização de informações, acompanhamento de pacientes e treinamento acadêmico.

O projeto surgiu de uma iniciativa interdisciplinar entre estudantes de Fisioterapia e Tecnologia da Informação, buscando integrar conhecimentos das duas áreas por meio da tecnologia.

## Objetivo do projeto

Desenvolver uma plataforma que utilize recursos tecnológicos para auxiliar a formação acadêmica em Fisioterapia, proporcionando ferramentas de apoio ao estudo, organização de informações clínicas e simulação de situações relacionadas à prática profissional.

## Tecnologias utilizadas

- **HTML5:** estruturação das páginas.
- **CSS3:** estilização, identidade visual e responsividade.
- **JavaScript:** funcionalidades e interações da plataforma.
- **Git e GitHub:** versionamento e gerenciamento do código-fonte.
- **GitHub Pages:** hospedagem do frontend.

## Estrutura do projeto

```text
ElectroFisio/
├── assets/
├── css/
├── js/
├── pages/
├── pdfs/
├── index.html
└── README.md
```

**Organização das pastas:**

- `assets/`: imagens, ícones e recursos visuais.
- `css/`: arquivos responsáveis pela estilização e organização visual.
- `js/`: scripts responsáveis pelas funcionalidades e interações.
- `pages/`: páginas e telas da plataforma.
- `pdfs/`: documentos e materiais em PDF.
- `index.html`: página inicial da aplicação.
- `README.md`: documentação do projeto.

## Funcionalidades

- Interface de apresentação da plataforma.
- Telas de login e cadastro.
- Área de gerenciamento e consulta de pacientes.
- Triagem e prontuário do paciente.
- Registro de informações e anamnese.
- Conteúdos sobre os recursos de eletroterapia TENS e FES.
- Treinamento acadêmico com a assistente educacional Fisis.

## Assistente educacional Fisis

A **Fisis** é uma assistente educacional integrada ao ElectroFisio, desenvolvida para auxiliar estudantes por meio de casos clínicos simulados e avaliações de respostas.

Seu funcionamento é realizado por uma API independente, desenvolvida em Python com FastAPI, que integra serviços de inteligência artificial, recuperação documental e armazenamento de dados.

A separação entre frontend e backend permite organizar as responsabilidades da aplicação e facilitar sua manutenção e evolução.

## Arquitetura da aplicação

O ElectroFisio utiliza uma arquitetura separada entre frontend e backend.

- **Frontend:** responsável pela interface visual, navegação e interação com os usuários.
- **Backend:** responsável pelo processamento das informações, regras de negócio, autenticação e integrações com serviços externos.
- **API da Fisis:** responsável pelas funcionalidades de treinamento educacional, geração de casos e avaliação das respostas.

## Acesso à plataforma

- **Aplicação:** https://gabrielcosta-99.github.io/ElectroFisio/
- **API da Fisis:** https://electrofisio-api.onrender.com
- **Documentação da API:** https://electrofisio-api.onrender.com/docs

## Equipe e contribuições

O projeto foi idealizado e desenvolvido de forma colaborativa por estudantes das áreas de Fisioterapia e Tecnologia da Informação.

### Idealização e concepção

Participaram da idealização do projeto e da definição inicial de suas funcionalidades:

- [Gabriel da Silva Oliveira Costa](https://github.com/GabrielCosta-99)
- [Luiz Gustavo D. Lacerda](https://github.com/Luiz-Gustavo-D-Lacerda)
- [Daniel de Moura](https://github.com/DanielDeMouraRenda)
- [Agda da Silva Cavalcanti](https://github.com/Agda-Cavalcanti)
- Luis Felipe Rabelo
- Gabriela Falcão
- Débora Santos

### Planejamento e prototipação

Os integrantes participaram da elaboração dos esboços e do planejamento visual das telas por meio do Figma, contribuindo para a definição da interface e da experiência de utilização da plataforma.

### Desenvolvimento técnico

**Frontend e interface**
- Gabriel da Silva Oliveira Costa.
- Luiz Gustavo D. Lacerda.

**API de funcionalidades clínicas e administrativas**
- Daniel de Moura — desenvolvimento da API relacionada à autenticação, gerenciamento de usuários, anamnese, triagem e funcionalidades correspondentes.

**API da assistente educacional Fisis**
- Gabriel da Silva Oliveira Costa — desenvolvimento individual da arquitetura, implementação do backend, integração com OpenAI, busca documental e Firebase.

## Finalidade do projeto

O ElectroFisio possui finalidade educacional e acadêmica. Suas funcionalidades têm como objetivo apoiar o processo de aprendizagem e a simulação de situações clínicas, não substituindo a avaliação, orientação ou tomada de decisão de profissionais habilitados.

## Direitos e atribuições

Os créditos deste projeto reconhecem as contribuições de seus integrantes nas etapas de idealização, planejamento, prototipação e desenvolvimento técnico.

O código-fonte e as contribuições originais de cada desenvolvedor permanecem sujeitos aos respectivos direitos autorais e às licenças aplicáveis.

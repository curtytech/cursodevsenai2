/**
 * =========================================================================
 * CLIENTE GRAPHQL DIDÁTICO — 100% EM PORTUGUÊS
 * =========================================================================
 * Olá, meu aluno! Este arquivo contém o código JavaScript que faz a mágica acontecer.
 * Ele conecta seu navegador à API GraphQL usando apenas o comando fetch().
 */

// 1. Dicionário de Exemplos Prontos para você testar com 1 clique
const EXEMPLOS = {
  paises: {
    nome: "🌎 Exemplo 1: Países da América do Sul (Consulta Básica)",
    endpoint: "https://countries.trevorblades.com/graphql",
    query: `query BuscarPaisesSulAmericanos {
  countries(filter: { continent: { eq: "SA" } }) {
    code
    name
    capital
    emoji
    currency
  }
}`,
    variables: "{}",
    tipo: "paises",
    dica: "Dica do Professor: Observe como pedimos apenas 5 campos (código, nome, capital, bandeira e moeda). O servidor só entrega isso, sem gastar dados extras!"
  },

  paises_variavel: {
    nome: "🎯 Exemplo 2: Buscar 1 País usando Variável ($codigo)",
    endpoint: "https://countries.trevorblades.com/graphql",
    query: `query BuscarPaisPorCodigo($codigo: ID!) {
  country(code: $codigo) {
    code
    name
    native
    capital
    emoji
    currency
    languages {
      name
    }
  }
}`,
    variables: `{\n  "codigo": "BR"\n}`,
    tipo: "pais_individual",
    dica: "Dica do Professor: Em vez de fixar 'BR' no texto da consulta, usamos a variável $codigo! Experimente trocar 'BR' por 'AR' ou 'CL' no painel de variáveis abaixo."
  },

  rick_morty: {
    nome: "🛸 Exemplo 3: Personagens de Desenho (Rick and Morty)",
    endpoint: "https://rickandmortyapi.com/graphql",
    query: `query BuscarPersonagens($nome: String!) {
  characters(page: 1, filter: { name: $nome }) {
    results {
      id
      name
      species
      status
      image
    }
  }
}`,
    variables: `{\n  "nome": "Morty"\n}`,
    tipo: "rick_morty",
    dica: "Dica do Professor: Para pesquisar QUALQUER personagem, basta trocar o 'Morty' pelo nome que você quiser na caixinha de VARIÁVEIS abaixo (ex: 'Rick', 'Summer', 'Beth', 'Jerry', 'Alien')!"
  },

  simulador_local: {
    nome: "🎓 Exemplo 4: Modo Sala de Aula (Funciona 100% Offline)",
    endpoint: "Modo Local (Simulação no seu Navegador)",
    query: `query DadosDoAluno {
  aluno(id: "1") {
    nome
    curso
    modulo
    progressoGraphQL
    topicosAprendidos
  }
}`,
    variables: "{}",
    tipo: "simulador",
    dica: "Dica do Professor: Este exemplo roda direto na memória do seu navegador! É perfeito para testar mesmo se você estiver sem internet."
  },

  simulador_mutation: {
    nome: "✍️ Exemplo 5: Cadastrar Anotação na Aula (Mutation)",
    endpoint: "Modo Local (Simulação de Gravação)",
    query: `mutation GravarAnotacao($anotacao: String!) {
  adicionarNota(texto: $anotacao) {
    id
    texto
    horario
    status
  }
}`,
    variables: `{\n  "anotacao": "Entendi perfeitamente como funciona o GraphQL!"\n}`,
    tipo: "mutation",
    dica: "Dica do Professor: Mutations servem para GRAVAR ou ALTERAR dados. Ela salva a anotação e já devolve o comprovante na hora!"
  },

  fragments_directives: {
    nome: "🧩 Exemplo 6: Reutilizar Campos (Fragments & Diretivas)",
    endpoint: "https://countries.trevorblades.com/graphql",
    query: `query BuscarComFragment($codigo: ID!, $incluirMoeda: Boolean!) {
  country(code: $codigo) {
    ...CamposBasicos
    currency @include(if: $incluirMoeda)
  }
}

fragment CamposBasicos on Country {
  code
  name
  capital
  emoji
}`,
    variables: `{\n  "codigo": "JP",\n  "incluirMoeda": true\n}`,
    tipo: "pais_individual",
    dica: "Dica do Professor: 'fragment' permite reaproveitar blocos de campos em várias consultas. E a diretiva '@include' decide se traz ou não a moeda!"
  },

  marvel: {
    nome: "🦸 Exemplo 7: Heróis da Marvel Comics (Imagens Oficiais)",
    endpoint: "https://gateway.marvel.com/graphql (Catálogo Oficial)",
    query: `query BuscarHeroisMarvel($nome: String) {
  marvelCharacters(filter: { name: $nome }) {
    results {
      id
      name
      realName
      image
      description
      comicsCount
      powers
    }
  }
}`,
    variables: `{\n  "nome": "Homem de Ferro"\n}`,
    tipo: "marvel",
    dica: "Dica do Professor: Pesquise QUALQUER herói da Marvel (ex: 'Homem-Aranha', 'Homem de Ferro', 'Thor', 'Hulk', 'Wolverine', 'Deadpool', 'Thanos') trocando o nome nas VARIÁVEIS abaixo!"
  }
};

// Banco de Dados Oficial da Marvel com Imagens Oficiais de Alta Resolução
const MARVEL_DATABASE = [
  {
    id: "1009368",
    name: "Homem de Ferro (Iron Man)",
    aliases: ["iron man", "homem de ferro", "tony stark", "stark"],
    realName: "Anthony 'Tony' Stark",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55/portrait_uncanny.jpg",
    description: "Bilionário genial e filantropo. Criador de armaduras robóticas de ponta que lhe concedem superforça, voo supersônico e raios repulsores.",
    comicsCount: 2850,
    powers: ["Armadura de Nanotecnologia", "Voo Hipersônico", "Raios Repulsores", "Super Força"]
  },
  {
    id: "1009610",
    name: "Homem-Aranha (Spider-Man)",
    aliases: ["spider-man", "spiderman", "homem-aranha", "homem aranha", "peter parker", "parker"],
    realName: "Peter Parker",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/3/50/526548a343e4b/portrait_uncanny.jpg",
    description: "Picado por uma aranha geneticamente modificada, Peter aprendeu a lição imortal: com grandes poderes vêm grandes responsabilidades.",
    comicsCount: 4120,
    powers: ["Sentido Aranha", "Aderência a Paredes", "Lançadores de Teia", "Agilidade Sobre-humana"]
  },
  {
    id: "1009220",
    name: "Capitão América (Captain America)",
    aliases: ["captain america", "capitao america", "steve rogers", "capitão"],
    realName: "Steven 'Steve' Rogers",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/3/50/537ba56d31087/portrait_uncanny.jpg",
    description: "O Primeiro Vingador. Fortalecido com o soro do supersoldado na Segunda Guerra Mundial, empunha o lendário escudo circular de Vibranium.",
    comicsCount: 2640,
    powers: ["Escudo de Vibranium", "Força no Ápice Humano", "Tático Mestre", "Mestre em Artes Marciais"]
  },
  {
    id: "1009664",
    name: "Thor (Deus do Trovão)",
    aliases: ["thor", "deus do trovao", "odinson"],
    realName: "Thor Odinson",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/d/d0/5269657a74350/portrait_uncanny.jpg",
    description: "Príncipe guerreiro de Asgard e membro fundador dos Vingadores. Empunhador digno do martelo Mjolnir e controlador das tempestades cósmicas.",
    comicsCount: 2100,
    powers: ["Controle de Raios e Trovões", "Martelo Mjolnir", "Super Força Divina", "Imortalidade Asgardiana"]
  },
  {
    id: "1009351",
    name: "Hulk (O Gigante Esmeralda)",
    aliases: ["hulk", "bruce banner", "banner", "gigante esmeralda"],
    realName: "Dr. Robert Bruce Banner",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/5/a0/538615ca33ab0/portrait_uncanny.jpg",
    description: "Cientista que, após exposição acidental a raios gama, se transforma em um gigante verde colossal cuja força cresce proporcionalmente à sua raiva.",
    comicsCount: 2280,
    powers: ["Super Força Ilimitada", "Resistência Extrema", "Saltos Gigantescos", "Fator de Cura"]
  },
  {
    id: "1009718",
    name: "Wolverine",
    aliases: ["wolverine", "logan", "james howlett"],
    realName: "James 'Logan' Howlett",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/2/60/537bcaef0f6cf/portrait_uncanny.jpg",
    description: "Mutante centenário com esqueleto e garras retráteis revestidos pelo metal inquebrável Adamantium, dotado de cura acelerada e instintos animais.",
    comicsCount: 2790,
    powers: ["Garras de Adamantium", "Fator de Cura Regenerativo", "Esqueleto Indestrutível", "Sentidos Animais Aguçados"]
  },
  {
    id: "1009268",
    name: "Deadpool",
    aliases: ["deadpool", "wade wilson", "mercenario"],
    realName: "Wade Wilson",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/9/90/5261a86cacb99/portrait_uncanny.jpg",
    description: "O 'Mercenário Tagarela'. Letal espadachim e atirador dotado de imortalidade regenerativa, famoso por quebrar a 4ª parede e falar diretamente com o leitor.",
    comicsCount: 1350,
    powers: ["Regeneração Imortal", "Mestre em Armas de Fogo", "Espadas Katanas Duplas", "Quebra da 4ª Parede"]
  },
  {
    id: "1009282",
    name: "Doutor Estranho (Doctor Strange)",
    aliases: ["doctor strange", "doutor estranho", "dr strange", "stephen strange"],
    realName: "Dr. Stephen Strange",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/5/f0/5261a830e3094/portrait_uncanny.jpg",
    description: "Ex-neurocirurgião que dominou as artes místicas e se tornou o Mago Supremo da Terra, protegendo a realidade de ameaças multiversais.",
    comicsCount: 1420,
    powers: ["Magia Mística Suprema", "Olho de Agamotto (Tempo)", "Projeção Astral", "Portais Interdimensionais"]
  },
  {
    id: "1009187",
    name: "Pantera Negra (Black Panther)",
    aliases: ["black panther", "pantera negra", "t'challa", "tchalla"],
    realName: "T'Challa",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/6/60/5261a80a67e7d/portrait_uncanny.jpg",
    description: "Rei e protetor de Wakanda, nação africana hiper-avançada. Fortalecido pela Erva Coração e portando um traje cinético feito de Vibranium puro.",
    comicsCount: 1180,
    powers: ["Traje Cinético de Vibranium", "Garras Retráteis de Vibranium", "Reflexos Felinos Aguçados", "Líder Estratégico Genial"]
  },
  {
    id: "1009562",
    name: "Feiticeira Escarlate (Scarlet Witch)",
    aliases: ["scarlet witch", "feiticeira escarlate", "wanda maximoff", "wanda"],
    realName: "Wanda Maximoff",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/6/70/5261a7d7c394b/portrait_uncanny.jpg",
    description: "Usuária da misteriosa Magia do Caos com capacidade de dobrar a estrutura do espaço-tempo e reescrever a própria realidade.",
    comicsCount: 1650,
    powers: ["Magia do Caos", "Dobra da Realidade", "Telecinese Poderosa", "Rajadas Psiônicas"]
  },
  {
    id: "1009652",
    name: "Thanos (O Titã Louco)",
    aliases: ["thanos", "tita louco", "titã louco"],
    realName: "Thanos de Titã",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/6/40/5261a822661ec/portrait_uncanny.jpg",
    description: "Lorde supremo de Titã fascinado pelo equilíbrio cósmico. Coletor das 6 Joias do Infinito instaladas em sua Manopla Dourada.",
    comicsCount: 980,
    powers: ["Manopla com as 6 Joias do Infinito", "Força Cósmica Quase Imparável", "Invulnerabilidade", "Intelecto Estratégico Superior"]
  },
  {
    id: "1009189",
    name: "Viúva Negra (Black Widow)",
    aliases: ["black widow", "viuva negra", "natasha romanoff", "natasha"],
    realName: "Natalia 'Natasha' Romanova",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/f/30/50fecad1f1071/portrait_uncanny.jpg",
    description: "A espiã e combatente mais habilidosa do mundo. Treinada na infame Sala Vermelha, tornou-se membro essencial dos Vingadores.",
    comicsCount: 1390,
    powers: ["Mestre em Artes Marciais", "Espionagem e Infiltração", "Braceletes Ferrão da Viúva", "Militar e Atiradora de Elite"]
  },
  {
    id: "1009407",
    name: "Loki (Deus da Trapaça)",
    aliases: ["loki", "deus da trapaca", "deus da trapaça", "irmão do thor"],
    realName: "Loki Laufeyson",
    image: "https://i.annihil.us/u/prod/marvel/i/mg/d/90/526547f509313/portrait_uncanny.jpg",
    description: "O Príncipe de Asgard e Deus da Trapaça. Mestre em ilusões mágicas, disfarces, manipulação psicológica e feitiçaria cósmica.",
    comicsCount: 1220,
    powers: ["Ilusões e Hologramas Mágicos", "Metamorfose e Disfarce", "Teletransporte", "Encantamentos e Astúcia"]
  }
];

// 2. Elementos da Tela
const presetSelect = document.getElementById("presetSelect");
const endpointDisplay = document.getElementById("endpointDisplay");
const queryEditor = document.getElementById("queryEditor");
const variablesEditor = document.getElementById("variablesEditor");
const toggleVariables = document.getElementById("toggleVariables");
const variablesWrapper = document.getElementById("variablesWrapper");
const varToggleIcon = document.getElementById("varToggleIcon");
const btnExecute = document.getElementById("btnExecute");
const btnReset = document.getElementById("btnReset");
const statusPill = document.getElementById("statusPill");
const cardsContainer = document.getElementById("cardsContainer");
const jsonViewer = document.getElementById("jsonViewer");
const teacherTip = document.getElementById("teacherTip");
const btnViewCards = document.getElementById("btnViewCards");
const btnViewJson = document.getElementById("btnViewJson");

// Variáveis de controle
let currentData = null;
let currentMode = "cards";
let notasSalvas = [
  { id: "NOTA-01", texto: "GraphQL usa requisição POST com corpo JSON.", horario: "14:00", status: "SALVO_NO_BANCO" },
  { id: "NOTA-02", texto: "Zero desperdício: o cliente pede só os campos que precisa.", horario: "14:15", status: "SALVO_NO_BANCO" }
];

// 3. Inicialização ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  configurarAbas();
  configurarExemplo("paises");
  configurarDesafios();

  // Cliques e eventos
  if (presetSelect) presetSelect.addEventListener("change", (e) => configurarExemplo(e.target.value));
  if (btnExecute) btnExecute.addEventListener("click", executarConsultaGraphQL);
  if (btnReset) btnReset.addEventListener("click", () => {
    const selecionado = presetSelect.value;
    queryEditor.value = EXEMPLOS[selecionado].query;
    if (variablesEditor) variablesEditor.value = EXEMPLOS[selecionado].variables || "{}";
  });

  // Abrir e fechar gaveta de variáveis
  if (toggleVariables && variablesWrapper) {
    toggleVariables.addEventListener("click", () => {
      const isOpen = variablesWrapper.classList.toggle("open");
      if (varToggleIcon) varToggleIcon.textContent = isOpen ? "▲" : "▼";
    });
  }

  // Alternar entre visualização em Cartões e JSON
  if (btnViewCards) btnViewCards.addEventListener("click", () => alternarVisualizacao("cards"));
  if (btnViewJson) btnViewJson.addEventListener("click", () => alternarVisualizacao("json"));
});

// 4. Configurar Abas de Navegação
function configurarAbas() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add("active");
    });
  });
}

// 5. Carregar dados do exemplo escolhido
function configurarExemplo(chave) {
  const exemplo = EXEMPLOS[chave];
  if (!exemplo) return;

  endpointDisplay.textContent = exemplo.endpoint;
  queryEditor.value = exemplo.query;
  if (variablesEditor) variablesEditor.value = exemplo.variables || "{}";
  teacherTip.textContent = exemplo.dica;

  // Se o exemplo tem variáveis ativas, abre o painel
  if (exemplo.variables && exemplo.variables !== "{}" && variablesWrapper) {
    variablesWrapper.classList.add("open");
    if (varToggleIcon) varToggleIcon.textContent = "▲";
  }

  // Limpa o resultado anterior
  cardsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🚀</div>
      <p>Clique no botão <strong>"EXECUTAR CONSULTA ➔"</strong> para ver os dados chegarem da API!</p>
    </div>
  `;
  jsonViewer.textContent = "";
  statusPill.textContent = "AGUARDANDO CONSULTA";
  statusPill.className = "status-pill";
}

// 6. FUNÇÃO PRINCIPAL: Como o JavaScript chama o GraphQL
async function executarConsultaGraphQL() {
  const chaveExemplo = presetSelect.value;
  const config = EXEMPLOS[chaveExemplo];
  const queryDigitada = queryEditor.value.trim();

  let variablesObj = {};
  if (variablesEditor && variablesEditor.value.trim()) {
    try {
      variablesObj = JSON.parse(variablesEditor.value.trim());
    } catch (e) {
      alert("Aviso do Professor: Há um erro no formato das Variáveis. Lembre-se de usar aspas duplas, por exemplo: { \"codigo\": \"BR\" }");
      return;
    }
  }

  if (!queryDigitada) {
    alert("Professor avisa: Por favor, escreva uma consulta antes de clicar em Executar!");
    return;
  }

  // Atualiza estado na tela
  statusPill.textContent = "CONSULTANDO...";
  statusPill.className = "status-pill loading";
  btnExecute.disabled = true;
  btnExecute.innerHTML = "<span>ENVIANDO PEDIDO...</span>";

  const inicioTempo = performance.now();

  try {
    let resultado;

    // Se for simulador local ou Marvel
    if (chaveExemplo === "simulador_local") {
      resultado = await simularRespostaLocal(queryDigitada);
    } else if (chaveExemplo === "simulador_mutation") {
      resultado = await simularMutationLocal(variablesObj);
    } else if (chaveExemplo === "marvel") {
      resultado = await simularMarvelGraphQL(queryDigitada, variablesObj);
    } else {
      /**
       * 🔔 O SEGREDO DO GRAPHQL:
       * 1. Método HTTP POST
       * 2. Header 'Content-Type: application/json'
       * 3. Corpo JSON com { query, variables }
       */
      const payload = { query: queryDigitada };
      if (Object.keys(variablesObj).length > 0) {
        payload.variables = variablesObj;
      }

      const respostaHttp = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!respostaHttp.ok) {
        try {
          const erroJson = await respostaHttp.json();
          if (erroJson && (erroJson.errors || erroJson.data)) {
            resultado = erroJson;
          } else {
            throw new Error(`Erro HTTP: status ${respostaHttp.status}`);
          }
        } catch (e) {
          throw new Error(`Erro no servidor HTTP: status ${respostaHttp.status} (${respostaHttp.statusText})`);
        }
      } else {
        resultado = await respostaHttp.json();
      }
    }

    const fimTempo = performance.now();
    const duracaoMs = Math.round(fimTempo - inicioTempo);

    // No GraphQL, erros vêm na propriedade "errors"
    if (resultado.errors && resultado.errors.length > 0) {
      statusPill.textContent = `ERRO NA CONSULTA (${duracaoMs}ms)`;
      statusPill.className = "status-pill error";
      renderizarErrosGraphQL(resultado.errors);
      jsonViewer.textContent = JSON.stringify(resultado, null, 2);
    } else {
      statusPill.textContent = `200 OK (${duracaoMs}ms)`;
      statusPill.className = "status-pill success";
      currentData = resultado.data;

      renderizarResultado(chaveExemplo, resultado.data);
      jsonViewer.textContent = JSON.stringify(resultado, null, 2);
    }

  } catch (erro) {
    console.error("Falha ao consultar GraphQL:", erro);
    statusPill.textContent = "FALHA NA CONEXÃO";
    statusPill.className = "status-pill error";

    cardsContainer.innerHTML = `
      <div class="empty-state" style="color: #fca5a5;">
        <div class="empty-state-icon">⚠️</div>
        <h4>Não foi possível conectar ao servidor</h4>
        <p style="font-size: 0.9rem; margin-top: 8px; color: #cbd5e1;">
          ${erro.message}.<br><br>
          <em>Dica do Professor: Se você estiver sem internet ou com bloqueio de rede, escolha o <strong>"Exemplo 4 (Modo Sala de Aula)"</strong> no seletor acima para testar offline!</em>
        </p>
      </div>
    `;
    jsonViewer.textContent = JSON.stringify({ erro: erro.message }, null, 2);
  } finally {
    btnExecute.disabled = false;
    btnExecute.innerHTML = "<span>EXECUTAR CONSULTA ➔</span>";
  }
}

// 7. Renderizar os Cartões com Texto Claro e Legível
function renderizarResultado(tipoExemplo, data) {
  if (!data) return;

  cardsContainer.innerHTML = "";

  // Caso: Lista de Países
  if (data.countries) {
    if (data.countries.length === 0) {
      cardsContainer.innerHTML = `<p class="empty-state">Nenhum país encontrado com esse filtro.</p>`;
      return;
    }

    data.countries.forEach(pais => {
      const card = document.createElement("div");
      card.className = "country-card";
      card.innerHTML = `
        <div class="flag-header">
          <span class="flag-code">${pais.code || "??"}</span>
          <span class="flag-emoji">${pais.emoji || "🏳️"}</span>
        </div>
        <h4>${pais.name || "País Sem Nome"}</h4>
        <p>
          <strong>Capital:</strong> ${pais.capital || "Não informada"}<br>
          <strong>Moeda:</strong> ${pais.currency || "N/A"}
        </p>
        <span class="card-tag">América do Sul</span>
      `;
      cardsContainer.appendChild(card);
    });
  }
  // Caso: 1 País Individual com Variável
  else if (data.country) {
    const p = data.country;
    const card = document.createElement("div");
    card.className = "country-card";
    card.style.gridColumn = "1 / -1";
    card.innerHTML = `
      <div class="flag-header">
        <span class="flag-code" style="font-size: 1.3rem;">${p.code}</span>
        <span class="flag-emoji" style="font-size: 2.8rem;">${p.emoji || "🏳️"}</span>
      </div>
      <h3 style="color: #ffffff; font-size: 1.5rem; margin-bottom: 8px;">${p.name} ${p.native ? `(${p.native})` : ""}</h3>
      <p style="font-size: 0.95rem; line-height: 1.9;">
        <strong>Código Oficial:</strong> ${p.code}<br>
        <strong>Capital:</strong> ${p.capital || "N/A"}<br>
        <strong>Moeda:</strong> ${p.currency || "N/A"}<br>
        <strong>Idiomas:</strong> ${p.languages ? p.languages.map(l => l.name).join(", ") : "N/A"}
      </p>
      <span class="card-tag" style="margin-top: 14px;">Consulta com Variável Resolvida com Sucesso!</span>
    `;
    cardsContainer.appendChild(card);
  }
  // Caso: Rick and Morty
  else if (data.characters && data.characters.results) {
    if (data.characters.results.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>Nenhum personagem encontrado com esse nome.<br>Tente pesquisar outro nome (ex: "Morty", "Rick", "Summer", "Beth", "Jerry")!</p>
        </div>
      `;
      return;
    }

    data.characters.results.forEach(char => {
      const statusIcon = char.status === "Alive" ? "🟢 Vivo" : char.status === "Dead" ? "🔴 Morto" : "⚪ Desconhecido";
      const card = document.createElement("div");
      card.className = "character-card";
      card.innerHTML = `
        <img src="${char.image || 'https://via.placeholder.com/150'}" alt="${char.name}">
        <h4>${char.name}</h4>
        <p>
          <strong>Espécie:</strong> ${char.species}<br>
          <strong>Status:</strong> ${statusIcon}
        </p>
        <span class="card-tag">Personagem #${char.id}</span>
      `;
      cardsContainer.appendChild(card);
    });
  }
  // Caso: Heróis da Marvel Comics
  else if (data.marvelCharacters && data.marvelCharacters.results) {
    if (data.marvelCharacters.results.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🦸</div>
          <h4 style="color: #ffffff; margin-bottom: 8px;">Nenhum herói Marvel encontrado com esse nome!</h4>
          <p style="font-size: 0.9rem; color: #94a3b8;">
            Dica do Professor: Tente pesquisar nomes como <strong>"Homem de Ferro"</strong>, <strong>"Homem-Aranha"</strong>, <strong>"Thor"</strong>, <strong>"Hulk"</strong>, <strong>"Wolverine"</strong>, <strong>"Deadpool"</strong>, <strong>"Thanos"</strong> ou <strong>"Capitão América"</strong>!
          </p>
        </div>
      `;
      return;
    }

    data.marvelCharacters.results.forEach(heroi => {
      const card = document.createElement("div");
      card.className = "marvel-card";
      const poderesHtml = heroi.powers ? heroi.powers.map(p => `<span class="power-badge">⚡ ${p}</span>`).join("") : "";

      card.innerHTML = `
        <img src="${heroi.image || 'https://via.placeholder.com/200'}" alt="${heroi.name}">
        <span class="comics-badge">HQ MARVEL // ${heroi.comicsCount || 0} EDIÇÕES</span>
        <h4>${heroi.name}</h4>
        ${heroi.realName ? `<div class="marvel-real-name">Identidade Secreta: ${heroi.realName}</div>` : ""}
        ${heroi.description ? `<p class="marvel-desc">${heroi.description}</p>` : ""}
        ${poderesHtml ? `<div class="powers-container">${poderesHtml}</div>` : ""}
      `;
      cardsContainer.appendChild(card);
    });
  }
  // Caso: Simulador Local
  else if (data.aluno) {
    const aluno = data.aluno;
    const card = document.createElement("div");
    card.className = "country-card";
    card.style.gridColumn = "1 / -1";
    card.innerHTML = `
      <div style="font-size: 2.5rem; margin-bottom: 10px;">🎓</div>
      <h3 style="color: #ffffff; margin-bottom: 10px; font-size: 1.35rem;">${aluno.nome}</h3>
      <p style="font-size: 0.95rem; line-height: 1.9;">
        <strong>Curso:</strong> ${aluno.curso}<br>
        <strong>Módulo:</strong> ${aluno.modulo}<br>
        <strong>Progresso no GraphQL:</strong> ${aluno.progressoGraphQL}<br>
        <strong>Tópicos Dominados:</strong> ${aluno.topicosAprendidos ? aluno.topicosAprendidos.join(" • ") : "Nenhum"}
      </p>
      <span class="card-tag" style="margin-top: 14px;">Simulação Offline Concluída com Sucesso!</span>
    `;
    cardsContainer.appendChild(card);
  }
  // Caso: Mutation (Gravar Nota)
  else if (data.adicionarNota) {
    const listaHtml = notasSalvas.map(n => `
      <div style="padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace;">
          <span>${n.id}</span>
          <span>${n.horario}</span>
        </div>
        <div style="color: #ffffff; font-size: 0.95rem; margin-top: 6px;">${n.texto}</div>
      </div>
    `).join("");

    const card = document.createElement("div");
    card.className = "country-card";
    card.style.gridColumn = "1 / -1";
    card.innerHTML = `
      <h3 style="color: #ffffff; margin-bottom: 8px; font-size: 1.3rem;">✍️ Nova Anotação Salva via Mutation!</h3>
      <p style="font-size: 0.9rem; margin-bottom: 16px;">
        <strong>Status Retornado:</strong> ${data.adicionarNota.status} | <strong>ID Criado:</strong> ${data.adicionarNota.id}
      </p>
      <div>
        <h4 style="font-size: 0.88rem; color: #e2e8f0; margin-bottom: 10px; text-transform: uppercase;">Lista de Anotações Guardadas:</h4>
        ${listaHtml}
      </div>
      <span class="card-tag" style="margin-top: 14px;">Mutation Executada com Sucesso!</span>
    `;
    cardsContainer.appendChild(card);
  }
  // Caso genérico
  else {
    const card = document.createElement("div");
    card.className = "country-card";
    card.style.gridColumn = "1 / -1";
    card.innerHTML = `
      <h4>Dados Recebidos com Sucesso!</h4>
      <p style="font-size: 0.9rem; margin-top: 8px;">
        Como você customizou a consulta, confira a resposta completa na aba <strong>{ } JSON BRUTO</strong> acima!
      </p>
    `;
    cardsContainer.appendChild(card);
  }
}

// 8. Renderizar Erros
function renderizarErrosGraphQL(erros) {
  const is404 = erros.some(e => e.message && (e.message.includes("404") || e.message.includes("Not Found")));
  if (is404) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h4 style="color: #ffffff; margin-bottom: 8px;">Nenhum personagem encontrado com esse nome!</h4>
        <p style="font-size: 0.9rem; color: #94a3b8;">
          Dica do Professor: Tente pesquisar nomes conhecidos do desenho, como: <strong>"Morty"</strong>, <strong>"Rick"</strong>, <strong>"Summer"</strong>, <strong>"Beth"</strong>, <strong>"Jerry"</strong>, <strong>"Alien"</strong> ou <strong>"Pickle"</strong>!
        </p>
      </div>
    `;
    return;
  }

  cardsContainer.innerHTML = `
    <div class="empty-state" style="color: #fca5a5; text-align: left;">
      <h4 style="margin-bottom: 10px; font-size: 1.1rem;">❌ O servidor GraphQL avisou sobre erros na consulta:</h4>
      <ul style="padding-left: 20px;">
        ${erros.map(e => `<li style="margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.88rem;">${e.message}</li>`).join("")}
      </ul>
      <p style="font-size: 0.88rem; color: #cbd5e1; margin-top: 14px;">
        💡 <em>Dica do Professor: Verifique se você não digitou o nome de algum campo errado na consulta!</em>
      </p>
    </div>
  `;
}

// 9. Alternar entre Cartões e JSON
function alternarVisualizacao(modo) {
  currentMode = modo;
  if (modo === "cards") {
    btnViewCards.classList.add("active");
    btnViewJson.classList.remove("active");
    cardsContainer.style.display = "grid";
    jsonViewer.style.display = "none";
  } else {
    btnViewJson.classList.add("active");
    btnViewCards.classList.remove("active");
    cardsContainer.style.display = "none";
    jsonViewer.style.display = "block";
  }
}

// 10. Desafios Interativos
function configurarDesafios() {
  const btns = document.querySelectorAll(".challenge-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const isShown = targetEl.classList.toggle("show");
        btn.textContent = isShown ? "OCULTAR RESPOSTA" : "VER RESPOSTA DO PROFESSOR";
      }
    });
  });
}

// 11. Simuladores Locais (Offline)
function simularRespostaLocal(query) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          aluno: {
            nome: "Aluno Nota 10 de Desenvolvimento Web",
            curso: "Manual Descomplicado de GraphQL",
            modulo: "Módulo 1: Fundamentos, Consultas e Mutations",
            progressoGraphQL: "100% Concluído",
            topicosAprendidos: [
              "O que é GraphQL e por que foi criado",
              "Diferença entre REST e GraphQL",
              "Como evitar excesso de dados (Over-fetching)",
              "Como fazer requisições POST com fetch()",
              "Uso de Variáveis e Mutations"
            ]
          }
        }
      });
    }, 280);
  });
}

function simularMutationLocal(variables) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const texto = variables.anotacao || "Nova anotação registrada na aula.";
      const novaNota = {
        id: `NOTA-${String(notasSalvas.length + 1).padStart(2, "0")}`,
        texto: texto,
        horario: new Date().toLocaleTimeString().slice(0, 5),
        status: "SALVO_NO_BANCO"
      };
      notasSalvas.unshift(novaNota);

      resolve({
        data: {
          adicionarNota: novaNota
        }
      });
    }, 320);
  });
}

// 12. Simulador da API Oficial Marvel Comics (com Suporte a Aliases)
function simularMarvelGraphQL(query, variables) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const aliasRegex = /(?:([a-zA-Z0-9_]+)\s*:\s*)?marvelCharacters(?:\s*\(\s*filter:\s*\{\s*name:\s*(?:\$([a-zA-Z0-9_]+)|["']([^"']+)["'])\s*\}\s*\))?/g;
      let match;
      const data = {};
      let encontrouAlgum = false;

      while ((match = aliasRegex.exec(query)) !== null) {
        encontrouAlgum = true;
        const alias = match[1] || "marvelCharacters";
        const varName = match[2];
        const directTerm = match[3];

        let termo = "";
        if (varName && variables && variables[varName]) {
          termo = String(variables[varName]).trim().toLowerCase();
        } else if (directTerm) {
          termo = directTerm.trim().toLowerCase();
        } else if (variables && variables.nome) {
          termo = String(variables.nome).trim().toLowerCase();
        }

        let filtrados = MARVEL_DATABASE;
        if (termo && termo !== "todos") {
          filtrados = MARVEL_DATABASE.filter(h => 
            h.name.toLowerCase().includes(termo) ||
            h.realName.toLowerCase().includes(termo) ||
            (h.aliases && h.aliases.some(a => a.toLowerCase().includes(termo)))
          );
        }

        data[alias] = {
          total: filtrados.length,
          results: filtrados
        };
      }

      if (!encontrouAlgum) {
        let termo = (variables && variables.nome) ? String(variables.nome).trim().toLowerCase() : "";
        let filtrados = MARVEL_DATABASE;
        if (termo && termo !== "todos") {
          filtrados = MARVEL_DATABASE.filter(h => 
            h.name.toLowerCase().includes(termo) ||
            h.realName.toLowerCase().includes(termo) ||
            (h.aliases && h.aliases.some(a => a.toLowerCase().includes(termo)))
          );
        }
        data["marvelCharacters"] = { total: filtrados.length, results: filtrados };
      }

      resolve({ data });
    }, 280);
  });
}


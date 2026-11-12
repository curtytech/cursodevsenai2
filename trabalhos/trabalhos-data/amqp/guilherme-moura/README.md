# Projeto Acadêmico: AMQP via Broker RabbitMQ

> **Tema:** Comunicação Assíncrona e Engenharia de Filas com o Protocolo AMQP 0-9-1 e Broker RabbitMQ 4  
> **Identidade Visual:** Fundo Azul-Marinho Profundo (`#070D1E`), Destaques em Verde Vibrante (`#00FF88`), Textos em Branco Puro (`#FFFFFF`) e Cinza Claro (`#CBD5E1`), Acentos em Ciano (`#38BDF8`).  
> **Padrão dos Slides:** Proporção Panorâmica 16:9, editável nativamente.  

---

## 📋 Sumário Geral do Pacote

Este repositório reúne um projeto acadêmico completo voltado ao ensino e demonstração prática de **Sistemas Distribuídos**, **Arquitetura Orientada a Mensagens (MOM)** e **Engenharia de Software**. 

O pacote é composto por 5 materiais integrados e alinhados sob a mesma identidade visual:

| Arquivo | Formato | Finalidade Principal |
| :--- | :--- | :--- |
| **[`index.html`](file:///c:/Users/NIT0268879/OneDrive%20-%20Firjan/Área%20de%20Trabalho/AMQP/index.html)** | HTML5 / CSS3 / JS | **Manual Técnico Completo e Interativo:** Documento acadêmico com barra de navegação responsiva, 11 capítulos detalhados, diagramas vetoriais embutidos, blocos de código com botão de cópia e funcionalidade nativa para salvar em PDF ou imprimir. |
| **`apresentacao-amqp.pptx`** | PowerPoint (PPTX 16:9) | **Apresentação de Slides Editável:** 12 slides profissionais com visual tecnológico moderno, baixo volume de texto por slide, cartões modulares, fluxo arquitetural e espaços reservados para screenshots reais. |
| **[`roteiro-de-fala.md`](file:///c:/Users/NIT0268879/OneDrive%20-%20Firjan/Área%20de%20Trabalho/AMQP/roteiro-de-fala.md)** | Markdown | **Roteiro de Apresentação Oral:** Fala completa e natural slide a slide (como um aluno explicando ao professor), tempos sugeridos, transições fluídas e banco de perguntas e respostas da banca examinadora. |
| **[`demonstracao-rabbitmq.md`](file:///c:/Users/NIT0268879/OneDrive%20-%20Firjan/Área%20de%20Trabalho/AMQP/demonstracao-rabbitmq.md)** | Markdown | **Guia Prático de Laboratório:** Tutorial passo a passo com Docker (`rabbitmq:4-management`), criação da fila `fila_teste`, roteamento via Default Exchange, publicação e confirmações manuais (ACK). |
| **`assets/`** | Diretório de Mídias | Diagramas vetoriais em SVG de alta fidelidade e modelos estruturados de espaços reservados para screenshots reais da execução. |

---

## 📁 Estrutura de Diretórios e Arquivos

```text
AMQP/
├── assets/
│   ├── amqp-architecture.svg          # Diagrama vetorial dos 5 pilares do AMQP 0-9-1
│   ├── default-exchange-flow.svg      # Diagrama do mecanismo do Nameless Exchange ("")
│   ├── docker-ports.svg               # Diagrama de rede das portas 5672 e 15672
│   ├── queue-lifecycle.svg            # Diagrama de estados da mensagem (Ready, Unacked, ACK)
│   ├── placeholder-dashboard.svg      # Espaço reservado para screenshot do Overview
│   ├── placeholder-queue-create.svg   # Espaço reservado para screenshot da fila_teste
│   ├── placeholder-publish.svg        # Espaço reservado para screenshot de publicação
│   └── placeholder-consume.svg        # Espaço reservado para screenshot de consumo e ACK
├── apresentacao-amqp.pptx             # Slides editáveis da apresentação (12 slides 16:9)
├── demonstracao-rabbitmq.md           # Roteiro prático da bancada Docker e testes
├── index.html                         # Manual técnico interativo e salvável em PDF
├── README.md                          # Guia de uso e documentação do projeto (este arquivo)
└── roteiro-de-fala.md                 # Roteiro de fala slide a slide com perguntas da banca
```

---

## 🚀 Como Abrir e Utilizar Cada Material

### 1. Manual Técnico HTML (`index.html`)

O manual técnico foi desenvolvido em HTML5 puro, sem dependências externas pesadas (sem frameworks volumosos que necessitem de build), com responsividade total para celulares, tablets e desktops.

* **Como abrir no navegador:**
  * Dê um duplo clique no arquivo `index.html` ou clique com o botão direito e escolha seu navegador (Chrome, Edge, Firefox, Safari).
  * No PowerShell ou Terminal:
    ```powershell
    Start-Process index.html
    ```
* **Recursos interativos:**
  * **Barra de Leitura:** Indicador superior de progresso da leitura.
  * **Menu Lateral Fixo:** Acesso imediato a qualquer um dos 11 capítulos técnicos.
  * **Copiar Blocos de Código:** Botões "Copiar Código" em todos os snippets de Docker, TypeScript e Python.
  * **Salvar em PDF / Imprimir:** Clique no botão verde **"Salvar em PDF / Imprimir"** no topo da barra lateral. O documento possui uma folha de estilos `@media print` dedicada que otimiza as quebras de página, remove menus e garante legibilidade acadêmica em A4.

---

### 2. Apresentação PowerPoint (`apresentacao-amqp.pptx`)

A apresentação foi construída com formato nativo OpenXML (16:9) contendo 12 slides técnicos. Todos os elementos (títulos, caixas de texto, cartões, divisores, números e formas) são **100% editáveis**.

* **Como abrir e editar:**
  * Dê um duplo clique em `apresentacao-amqp.pptx` para abrir no Microsoft PowerPoint, Google Apresentações (Google Slides), LibreOffice Impress ou Keynote.
* **Preenchimento dos Campos Acadêmicos (Slide 1):**
  * Clique nas caixas de texto editáveis do Slide 1 para preencher:
    * `[Nome da Instituição / Curso]`
    * `[Nome dos Alunos / Matrículas]`
    * `[Nome do Professor Orientador]`
* **Estrutura dos 12 Slides:**
  1. **Slide 1:** Capa AMQP via Broker RabbitMQ.
  2. **Slide 2:** Introdução ao protocolo AMQP (padrão aberto, protocolo binário, desacoplamento).
  3. **Slide 3:** O que é RabbitMQ e o que é um broker (analogia da triagem, motor Erlang/OTP).
  4. **Slide 4:** Arquitetura Producer, Exchange, Binding, Queue e Consumer (a regra de ouro).
  5. **Slide 5:** Funcionamento das filas e mensagens (durabilidade, persistência delivery_mode 2, ACKs).
  6. **Slide 6:** Instalação do RabbitMQ usando Docker (`rabbitmq:4-management`, portas 5672/15672).
  7. **Slide 7:** Criação de uma fila chamada `fila_teste` (Classic Durable, métricas iniciais).
  8. **Slide 8:** Publicação de mensagens (Default Exchange, routing key `fila_teste`, status Ready = 1).
  9. **Slide 9:** Recebimento e confirmação de mensagens (Get messages, requeue vs auto ack, drenagem).
  10. **Slide 10:** Demonstração prática completa (linha do tempo das 4 etapas validadas).
  11. **Slide 11:** Vantagens e aplicações (background tasks, load leveling, microsserviços, scale-out).
  12. **Slide 12:** Conclusão e referências oficiais (OASIS, RabbitMQ docs, padrões EIP).

---

### 3. Roteiro de Fala Oral (`roteiro-de-fala.md`)

Criado especificamente para guiar a fala do aluno durante a apresentação do seminário ou banca de avaliação.

* **Como utilizar:**
  * Abra o arquivo em qualquer leitor de Markdown (VS Code, Obsidian, GitHub ou navegador).
  * Estude a fala proposta para cada um dos 12 slides. O texto adota uma linguagem em primeira pessoa, fluída e sem jargões soltos, demonstrando autoridade técnica sem ser cansativa.
  * **Atenção especial às perguntas da banca:** O arquivo inclui as perguntas mais frequentes que professores de Redes e Sistemas Distribuídos costumam fazer ao final de cada tópico (como a diferença entre Canais e Conexões TCP, o funcionamento do Default Exchange, o que é Prefetch Count e como evitar poison messages com Dead Letter Exchanges).

---

### 4. Demonstração Prática de Laboratório (`demonstracao-rabbitmq.md`)

Este arquivo é o manual operacional da bancada prática. Ele contém os comandos exatos de Docker, explicações linha a linha, resolução de problemas comuns e procedimentos para registrar as evidências da execução.

* **Comando central do laboratório:**
  ```bash
  docker run -d --name rabbitmq-lab -p 5672:5672 -p 15672:15672 rabbitmq:4-management
  ```
* **Acesso Web:** `http://localhost:15672`
* **Credenciais padrão:** Usuário `guest`, Senha `guest` (restrito a conexões locais).

---

### 5. Inclusão das Capturas de Tela Reais nos Espaços Reservados

Para respeitar as diretrizes acadêmicas de rigor, os materiais contêm **espaços reservados (placeholders) padronizados** com as dimensões e instruções exatas do que deve ser capturado durante a execução real:

1. **`assets/screenshot-01-dashboard.png`**: Captura da visão geral do painel (Overview) com o RabbitMQ 4 rodando.
2. **`assets/screenshot-02-queue-create.png`**: Captura da criação da fila `fila_teste` na aba Queues.
3. **`assets/screenshot-03-publish.png`**: Captura da publicação com a confirmação "Message published" e o contador Ready em 1.
4. **`assets/screenshot-04-consume.png`**: Captura da mensagem lida via "Get messages" com o contador Ready zerado após o ACK.

Para substituir nos slides ou no manual, basta capturar a imagem da sua tela durante o laboratório e salvá-la com os nomes acima ou arrastá-la diretamente para o PowerPoint sobre as caixas indicadas!

---

## 🧠 Conceitos Teóricos Centrais Abordados

1. **O que é o AMQP 0-9-1:** Um protocolo de camada de aplicação, binário e aberto, projetado para orientar mensagens de forma desacoplada no tempo e no espaço.
2. **A Soberania dos Exchanges:** No AMQP 0-9-1, **o produtor nunca deposita mensagens diretamente em uma fila**. Toda publicação é enviada a um Exchange, que inspeciona a Routing Key e as regras de Binding para direcionar as mensagens às filas correspondentes.
3. **O Mecanismo do Default Exchange (`""`):** O RabbitMQ cria automaticamente um Exchange padrão sem nome do tipo `direct`. Toda fila declarada no broker é implicitamente vinculada a este Exchange tendo como chave de ligação o próprio nome da fila.
4. **Garantias de Não-Perda:**
   * **Fila Durável (`durable: true`):** Os metadados da fila resistem a reinicializações.
   * **Mensagem Persistente (`delivery_mode: 2`):** O corpo da mensagem é escrito no journal em disco.
   * **Confirmação Manual (`manual ACK`):** O broker só desaloca a mensagem quando o consumidor confirma o término do processamento com sucesso.

---

## 📚 Referências Oficiais

* **OASIS Standard:** *Advanced Message Queuing Protocol (AMQP) 0-9-1 Specification*. Disponível em: [amqp.org](https://www.amqp.org).
* **RabbitMQ Documentation:** *Official Documentation and Tutorials*. Disponível em: [rabbitmq.com/docs](https://www.rabbitmq.com/docs).
* **Enterprise Integration Patterns (EIP):** Gregor Hohpe & Bobby Woolf. Addison-Wesley, 2003.
* **Docker Hub:** *Official RabbitMQ 4 Image with Management Plugin* (`rabbitmq:4-management`).

---
*Projeto concluído com sucesso. Todos os arquivos estão prontos para uso acadêmico formal.*

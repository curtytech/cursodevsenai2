# Estrutura Detalhada dos 12 Slides: AMQP via Broker RabbitMQ

> **Identidade Visual:** Fundo Azul-Marinho (`#070D1E`), Acentos em Verde Vibrante (`#00FF88`), Ciano (`#38BDF8`), Branco (`#FFFFFF`) e Cinza (`#CBD5E1`)  
> **Proporção:** 16:9 Widescreen  
> **Arquivo Correspondente:** `apresentacao-amqp.pptx` (gerado e editável na raiz do projeto)

---

## Mapa Geral da Apresentação (12 Slides)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                BLOCO 1: FUNDAMENTAÇÃO                       │
│  Slide 1: Capa Acadêmica       Slide 2: Protocolo AMQP    Slide 3: RabbitMQ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                BLOCO 2: ARQUITETURA CORE                    │
│  Slide 4: 5 Componentes AMQP   Slide 5: Filas, Mensagens e ACKs             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                BLOCO 3: LABORATÓRIO PRÁTICO                 │
│  Slide 6: Docker & Portas      Slide 7: Criação da Fila   Slide 8: Publish  │
│  Slide 9: Consumo & ACK        Slide 10: Demonstração Ponta a Ponta         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                BLOCO 4: ENCERRAMENTO                        │
│  Slide 11: Casos de Uso Reais  Slide 12: Conclusão & Referências Oficiais   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detalhamento Estrutural Slide a Slide

### 🟦 Slide 1: Capa do Projeto Acadêmico
* **Objetivo:** Estabelecer a seriedade acadêmica, apresentar o tema tecnológico e identificar autores, curso e professor.
* **Layout / Wireframe:**
  ```text
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ ▌ PROJETO ACADÊMICO • SISTEMAS DISTRIBUÍDOS & ENGENHARIA DE SOFTWARE     │
  │   AMQP VIA BROKER RABBITMQ                                               │
  │   Arquitetura de Mensageria, Filas Confiáveis e Implementação Prática    │
  │ ──────────────────────────────────────────────────────────────────────── │
  │ ┌───────────────────────────────┐  ┌───────────────────────────────────┐ │
  │ │ INSTITUIÇÃO & CURSO           │  │ DISCIPLINA                        │ │
  │ │ [Nome da Instituição / Curso] │  │ [Sistemas Distribuídos / Redes]   │ │
  │ └───────────────────────────────┘  └───────────────────────────────────┘ │
  │ ┌───────────────────────────────┐  ┌───────────────────────────────────┐ │
  │ │ ALUNO(S) / INTEGRANTES        │  │ PROFESSOR / ORIENTADOR            │ │
  │ │ [Nome dos Alunos / Matrículas]│  │ [Nome do Professor Orientador]    │ │
  │ └───────────────────────────────┘  └───────────────────────────────────┘ │
  │ ┌──────────────────────────────────────────────────────────────────────┐ │
  │ │ Ambiente: RabbitMQ 4 (Docker Oficial: rabbitmq:4-management)         │ │
  │ └──────────────────────────────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────────────────────────────┘
  ```
* **Elementos Chave:**
  * Barra vertical de destaque verde (`#00FF88`) no título.
  * Título com tamanho 32pt em caixa alta.
  * 4 cartões com bordas sutis e campos editáveis entre colchetes.
  * Barra de rodapé com a versão do broker utilizada.

---

### 🟦 Slide 2: Introdução ao Protocolo AMQP
* **Objetivo:** Explicar o que é o AMQP, por que ele foi inventado e qual a diferença paradigmática em relação ao HTTP REST.
* **Layout / Wireframe:** 3 colunas balanceadas (cards verticais) + banner de síntese.
  * **Card 1 (Verde):** *Padrão Aberto & Binário*
    * Padronizado por OASIS e ISO/IEC 19464.
    * Protocolo de fios binário (wire-level), compacto e de alta performance.
    * Fim do aprisionamento tecnológico (lock-in) de ferramentas proprietárias.
  * **Card 2 (Ciano):** *Desacoplamento Total*
    * Desacoplamento espacial e temporal.
    * Emissor e receptor não precisam estar ligados no mesmo instante.
    * Comunicação orientada a eventos e tarefas de segundo plano.
  * **Card 3 (Âmbar):** *AMQP vs HTTP/REST*
    * HTTP REST: síncrono, bloqueante e com acoplamento temporal forte.
    * AMQP: assíncrono, não-bloqueante e tolerante a indisponibilidade.
    * Broker atua como buffer elástico que absorve picos (load leveling).
  * **Banner Inferior:** Frase de síntese sobre interoperabilidade entre linguagens.

---

### 🟦 Slide 3: O Que É RabbitMQ e o Papel do Broker
* **Objetivo:** Apresentar a metáfora da central de triagem postal e o diferencial técnico do Erlang/OTP.
* **Layout / Wireframe:** 2 grandes blocos horizontais (50% / 50%) + 4 pills de tags.
  * **Bloco Esquerdo (Ciano):** *O Conceito de Message Broker*
    * Analogia da Agência Postal (recebe pacotes com etiqueta, armazena e entrega com comprovante).
    * Gerenciamento de buffers seguros (Filas).
    * Controle de fluxo e amortecimento de tráfego (*Backpressure*).
  * **Bloco Direito (Verde):** *A Engenharia do RabbitMQ*
    * Construído sobre Erlang/OTP e máquina virtual BEAM.
    * Processos ultraleves: gerencia centenas de milhares de conexões com pouca RAM.
    * Tolerância a falhas nativa com árvores de supervisão (*Crash-Only Design*).
    * Implementação de referência mundial para AMQP 0-9-1.
  * **Pills de Rodapé:** `[Erlang/OTP & BEAM]` `[Open Source Líder]` `[Referência AMQP 0-9-1]` `[Multi-Linguagem]`

---

### 🟦 Slide 4: Arquitetura Producer, Exchange, Binding, Queue e Consumer
* **Objetivo:** Fixar os 5 componentes core do modelo AMQP 0-9-1 e reforçar que o produtor nunca envia mensagens diretamente para a fila.
* **Layout / Wireframe:** 5 cartões sequenciais de fluxo horizontal + caixa de nota técnica.
  * **Card 1 (Produtor):** Aplicação cliente que gera o dado e publica no Exchange com uma Routing Key.
  * **Card 2 (Exchange):** Cérebro roteador; inspeciona metadados e regras de binding.
  * **Card 3 (Binding):** Regra de amarração ou contrato entre Exchange e Fila.
  * **Card 4 (Queue):** Buffer FIFO em memória/disco onde as mensagens aguardam o consumo.
  * **Card 5 (Consumer):** Worker que processa o trabalho e emite o sinal de confirmação (ACK).
  * **Caixa Inferior de Destaque:** *Canais (Channels) vs Conexões TCP* — multiplexação de múltiplos canais lógicos dentro de uma única conexão física de rede.
* **Diagrama Vinculado:** `assets/amqp-architecture.svg`.

---

### 🟦 Slide 5: Funcionamento das Filas e Mensagens
* **Objetivo:** Explicar durabilidade, persistência e a máquina de estados das mensagens (como evitar perda de dados).
* **Layout / Wireframe:** 3 cartões técnicos verticais + alerta de boas práticas.
  * **Card 1 (Ciano):** *Durabilidade da Fila*
    * Fila declarada como `durable: true`.
    * A estrutura da fila sobrevive a reinicializações completas do servidor RabbitMQ.
  * **Card 2 (Verde):** *Persistência do Payload*
    * Propriedade `delivery_mode: 2` (Persistent).
    * O broker grava o corpo da mensagem em disco físico (journal) antes de confirmar.
    * Fila Durável + Mensagem Persistente = Tolerância total a falhas.
  * **Card 3 (Âmbar):** *Ciclo de Confirmações (ACK)*
    * Estado `Ready`: aguardando na fila.
    * Estado `Unacked`: em processamento pelo consumidor.
    * `Basic.Ack`: confirmação de sucesso (remove da fila).
    * `Basic.Nack`: rejeição com requeue ou desvio para Dead Letter Exchange.
  * **Alerta Inferior:** Aviso sobre uso obrigatório de Manual Ack (`autoAck = false`) em ambientes de missão crítica.
* **Diagrama Vinculado:** `assets/queue-lifecycle.svg`.

---

### 🟦 Slide 6: Instalação do RabbitMQ Usando Docker
* **Objetivo:** Demonstrar o comando oficial de subida do RabbitMQ 4 e detalhar as portas AMQP e HTTP.
* **Layout / Wireframe:** 2 colunas (Comando & Portas à esquerda | Placeholder para Screenshot 1 à direita).
  * **Coluna Esquerda:**
    * Bloco de código em destaque:
      ```bash
      docker run -d --name rabbitmq-lab \
        -p 5672:5672 -p 15672:15672 \
        rabbitmq:4-management
      ```
    * Explicação da Porta `5672`: Protocolo binário AMQP 0-9-1.
    * Explicação da Porta `15672`: Painel Web do Management Plugin.
    * URL e credenciais: `http://localhost:15672` com login `guest/guest` restrito a localhost.
  * **Coluna Direita:**
    * Moldura de navegador com espaço reservado para screenshot: `screenshot-01-dashboard.png`.
* **Diagrama Vinculado:** `assets/docker-ports.svg` e `assets/placeholder-dashboard.svg`.

---

### 🟦 Slide 7: Criação de uma Fila Chamada fila_teste
* **Objetivo:** Explicar o processo de declaração da fila durável no painel administrativo e a verificação dos contadores.
* **Layout / Wireframe:** 2 colunas (Passo a passo à esquerda | Placeholder para Screenshot 2 à direita).
  * **Coluna Esquerda:**
    * Navegação: Aba *Queues* ➔ *Add a new queue*.
    * Parâmetros técnicos configurados:
      * **Type:** `Classic`
      * **Name:** `fila_teste`
      * **Durability:** `Durable`
      * **Auto delete:** `No`
    * Contadores iniciais exibidos: `Ready: 0`, `Unacked: 0`, `Total: 0`.
  * **Coluna Direita:**
    * Moldura de tela para o print da criação: `screenshot-02-queue-create.png`.
* **Diagrama Vinculado:** `assets/placeholder-queue-create.svg`.

---

### 🟦 Slide 8: Publicação de Mensagens e o Default Exchange
* **Objetivo:** Demonstrar como uma mensagem é publicada e explicar a regra da especificação AMQP para o Nameless Exchange.
* **Layout / Wireframe:** 2 colunas (Mecanismo do Default Exchange à esquerda | Placeholder para Screenshot 3 à direita).
  * **Coluna Esquerda:**
    * **Regra da Especificação AMQP 0-9-1:** Toda fila criada no broker é automaticamente ligada ao Default Exchange (`""`) com uma chave de roteamento idêntica ao próprio nome da fila.
    * Parâmetros do envio:
      * Exchange: `""` (vazio)
      * Routing Key: `fila_teste`
      * Delivery Mode: `2 - Persistent`
      * Payload: `{"id": 101, "evento": "MATRICULA_CONFIRMADA"}`
    * Resultado imediato: Notificação *Message published* e contador **Ready passa para 1**.
  * **Coluna Direita:**
    * Moldura de tela para o print da publicação: `screenshot-03-publish.png`.
* **Diagrama Vinculado:** `assets/default-exchange-flow.svg` e `assets/placeholder-publish.svg`.

---

### 🟦 Slide 9: Recebimento e Confirmação de Mensagens
* **Objetivo:** Apresentar a leitura via ferramenta "Get messages", contrastando Requeue True com Automatic Ack.
* **Layout / Wireframe:** 2 colunas (Operação de consumo à esquerda | Placeholder para Screenshot 4 à direita).
  * **Coluna Esquerda:**
    * **Nack message requeue true:** Inspeciona o payload sem consumir (a mensagem continua na fila, Ready = 1).
    * **Automatic ack:** Consome a mensagem e confirma a entrega definitiva ao broker (a mensagem é expurgada da memória e disco, Ready volta a 0).
    * Metadados inspecionados: Exchange `(AMQP default)`, Routing Key `fila_teste`, Payload JSON decodificado.
  * **Coluna Direita:**
    * Moldura de tela para o print do consumo: `screenshot-04-consume.png`.
* **Diagrama Vinculado:** `assets/placeholder-consume.svg`.

---

### 🟦 Slide 10: Demonstração Prática Completa (Linha do Tempo)
* **Objetivo:** Sintetizar em uma linha cronológica visual as 4 fases do teste executado no laboratório.
* **Layout / Wireframe:** Linha do tempo com 4 etapas em colunas horizontais + banner de sucesso.
  * **Etapa 1 (Ciano):** `Docker Up` — Contêiner RabbitMQ 4 ativo nas portas 5672 e 15672.
  * **Etapa 2 (Verde):** `Fila Criada` — Fila `fila_teste` Classic Durable declarada e pronta.
  * **Etapa 3 (Âmbar):** `Msg Publicada` — Default Exchange roteia por routing key e buffer registra Ready = 1.
  * **Etapa 4 (Roxo):** `Consumo & ACK` — Mensagem inspecionada, ACK positivo confirmado e fila drenada com êxito.
  * **Banner Inferior:** Validação experimental comprovando perda zero e ciclo de vida completo.

---

### 🟦 Slide 11: Vantagens e Aplicações no Mercado
* **Objetivo:** Situar o RabbitMQ no mundo real da arquitetura de software empresarial e microsserviços.
* **Layout / Wireframe:** Grade 2x2 com 4 quadrantes ilustrados com ícones.
  * **Quadrante 1 (Verde):** *Processamento em Segundo Plano (Background Jobs)*
    * Envio de e-mails, relatórios contábeis e notas fiscais sem bloquear a resposta ao usuário web.
  * **Quadrante 2 (Ciano):** *Amortecimento de Picos de Carga (Load Leveling)*
    * Em promoções (Black Friday), a fila atua como reservatório elástico, impedindo que o banco de dados caia.
  * **Quadrante 3 (Âmbar):** *Resiliência e Desacoplamento em Microsserviços*
    * Se o serviço de destino estiver fora do ar para manutenção, as mensagens permanecem no broker aguardando.
  * **Quadrante 4 (Roxo):** *Escalabilidade Horizontal Justa (Competing Consumers)*
    * Múltiplos trabalhadores dividem as mensagens da mesma fila em Round-Robin respeitando o prefetch de cada nó.
  * **Rodapé:** Principais padrões corporativos (*Work Queues, Pub/Sub, Routing Topics, Sagas*).

---

### 🟦 Slide 12: Conclusão e Referências Oficiais
* **Objetivo:** Fechar a apresentação com síntese acadêmica formal e citar as fontes oficiais da literatura técnica.
* **Layout / Wireframe:** 2 blocos (50% / 50%) + barra de agradecimento acadêmico.
  * **Bloco Esquerdo (Verde):** *Conclusão do Trabalho*
    * O AMQP 0-9-1 oferece arquitetura formal para desacoplamento de software.
    * Exchanges são os roteadores soberanos do protocolo; filas são buffers confiáveis.
    * O RabbitMQ 4 em contêiner Docker une alta performance em Erlang com facilidade de operação.
  * **Bloco Direito (Ciano):** *Referências Oficiais*
    * OASIS: Especificação do Protocolo AMQP 0-9-1 (`amqp.org`).
    * VMware Tanzu / Broadcom: Documentação Oficial do RabbitMQ 4 (`rabbitmq.com/docs`).
    * Gregor Hohpe & Bobby Woolf: Enterprise Integration Patterns (Addison-Wesley, 2003).
    * Martin Fowler: Patterns of Enterprise Application Architecture.
    * Docker Hub: Repositório oficial `rabbitmq:4-management`.
  * **Barra de Fechamento:** *"Agradecemos a atenção de todos. Estamos à disposição para perguntas da banca examinadora!"*

---

## 💡 Como os Slides se Conectam com o Roteiro Oral

Cada slide desta estrutura possui sua **fala correspondente pronta** no arquivo [`roteiro-de-fala.md`](file:///c:/Users/NIT0268879/OneDrive%20-%20Firjan/Área%20de%20Trabalho/AMQP/roteiro-de-fala.md). Você pode abrir o PowerPoint em uma tela e o roteiro de fala em outra para ensaiar a apresentação com precisão cronometrada.

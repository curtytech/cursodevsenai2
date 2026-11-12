# Guia de Demonstração Prática: RabbitMQ 4 via Docker

> **Projeto Acadêmico:** AMQP via Broker RabbitMQ  
> **Tema:** Laboratório Prático de Instalação, Configuração de Filas, Publicação e Consumo de Mensagens  
> **Identidade Visual:** Fundo Azul-Marinho (`#070D1E`), Destaques em Verde Vibrante (`#00FF88`), Textos em Branco/Cinza Claro  

---

## 1. Visão Geral do Laboratório

Este documento orienta passo a passo a execução da bancada de testes prática de mensageria com o **RabbitMQ 4**, utilizando contêineres Docker. 

O objetivo é reproduzir integralmente o ciclo de vida de uma mensagem no modelo **AMQP 0-9-1**:
1. Inicialização do broker em contêiner isolado.
2. Reconhecimento das portas de serviço e acesso ao painel administrativo web.
3. Declaração e parametrização de uma fila denominada `fila_teste`.
4. Publicação de uma mensagem direcionada ao **Default Exchange** com a chave de roteamento (Routing Key) `fila_teste`.
5. Inspeção, leitura e envio de confirmação manual (ACK) de processamento.

---

## 2. Pré-requisitos do Sistema

* **Docker Engine** ou **Docker Desktop** devidamente instalado e em execução na máquina host (Windows, Linux ou macOS).
* Portas de rede locais **5672** e **15672** livres e desimpedidas de outros serviços locais.
* Navegador de internet moderno (Google Chrome, Mozilla Firefox, Microsoft Edge ou Safari).

---

## 3. Passo 1: Inicialização do Contêiner RabbitMQ 4

Abra seu terminal preferido (PowerShell, Windows Terminal ou Bash) e execute o comando abaixo:

```bash
docker run -d --name rabbitmq-lab -p 5672:5672 -p 15672:15672 rabbitmq:4-management
```

### Anatomia e Justificativa Técnica de Cada Flag:

| Flag / Parâmetro | Significado Técnico | Justificativa no Laboratório |
| :--- | :--- | :--- |
| `docker run` | Comando base de execução do Docker | Cria e inicializa uma nova instância de contêiner. |
| `-d` (detach) | Execução desacoplada em background | Libera o prompt do terminal enquanto o serviço executa em segundo plano. |
| `--name rabbitmq-lab` | Nome do contêiner | Define um identificador determinístico para fácil parada, consulta de logs e limpeza. |
| `-p 5672:5672` | Mapeamento de porta AMQP | Encaminha o tráfego da porta `5672` da máquina host para a porta `5672` interna do contêiner. Esta é a **porta oficial do protocolo binário AMQP 0-9-1**, utilizada por produtores e consumidores de software. |
| `-p 15672:15672` | Mapeamento de porta Web HTTP | Encaminha requisições da porta `15672` para o **Management Web Plugin**, permitindo acesso à interface visual de gestão via navegador. |
| `rabbitmq:4-management` | Imagem oficial | Baixa e executa a imagem oficial baseada na versão **RabbitMQ 4**, pré-configurada com Erlang moderno e painel web ativado de fábrica. |

### Diagrama de Rede e Mapeamento de Portas:

```
[ HOST (Sua Máquina) ]
 │
 ├── Porta 15672 (HTTP) ───> [ Navegador: http://localhost:15672 ]
 │                                    │
 │                                    ▼ (Management UI)
 │                           ┌───────────────────────────────┐
 └── Porta 5672 (AMQP) ────> │ CONTÊINER DOCKER:             │
                             │ rabbitmq-lab                  │
                             │ (Protocolo AMQP 0-9-1)        │
                             └───────────────────────────────┘
```
*(Diagrama vetorial detalhado disponível em: `assets/docker-ports.svg`)*

---

## 4. Passo 2: Verificação do Status e Acesso ao Painel

### 4.1. Verificação no Terminal

Para confirmar que o contêiner subiu sem anormalidades, execute:

```bash
docker ps --filter "name=rabbitmq-lab"
```

Para visualizar o log de inicialização do broker e do Erlang runtime:

```bash
docker logs rabbitmq-lab
```
> **Saída esperada:** Linhas indicando `Server startup complete; 4 plugins started`, incluindo `rabbitmq_management`.

### 4.2. Autenticação na Interface Web

1. Abra o navegador e acesse a URL:  
   👉 **`http://localhost:15672`**
2. O sistema apresentará a tela de login do **RabbitMQ Management**.
3. Utilize as credenciais padrão de fábrica:
   * **Username:** `guest`
   * **Password:** `guest`
4. Clique em **Login**.

> ⚠️ **Aviso Acadêmico de Segurança:** O usuário `guest:guest` é restrito estritamente a conexões originadas de endereços locais (`localhost` ou `127.0.0.1`). Qualquer tentativa de login remoto através de IP de rede externa é bloqueada nativamente pelo broker por motivos de segurança.

---

### [Espaço Reservado para Captura de Tela 1]
> **Ação para o Aluno:** Tire um print da tela inicial do painel após o login e salve nesta pasta como `assets/screenshot-01-dashboard.png`.  
> *Elementos a demonstrar:* Visão geral (Overview), versão do RabbitMQ (4.x), versão do Erlang e nós ativos.  
> *(Consulte o modelo vetorial em: `assets/placeholder-dashboard.svg`)*

---

## 5. Passo 3: Criação da Fila `fila_teste`

No AMQP, as filas são buffers FIFO que armazenam mensagens em memória e/ou disco até o consumo.

1. No menu de abas superior, clique em **Queues**.
2. Clique na seção retrátil **Add a new queue** para expandir o formulário.
3. Preencha os campos exatamente como especificado:
   * **Type:** `Classic`
   * **Name:** `fila_teste`
   * **Durability:** `Durable` *(garante que a definição da fila sobreviva se o contêiner for reiniciado)*
   * **Auto delete:** `No`
   * **Arguments:** *(deixar em branco)*
4. Clique no botão verde **Add queue**.

Após o clique, a fila `fila_teste` constará na tabela de filas ativas, exibindo contadores zerados:
* **Ready:** `0` (nenhuma mensagem aguardando)
* **Unacked:** `0` (nenhuma mensagem entregue pendente de confirmação)
* **Total:** `0`

---

### [Espaço Reservado para Captura de Tela 2]
> **Ação para o Aluno:** Tire um print do formulário preenchido e da linha da fila criada na tabela e salve como `assets/screenshot-02-queue-create.png`.  
> *(Consulte o modelo vetorial em: `assets/placeholder-queue-create.svg`)*

---

## 6. Passo 4: Publicação de Mensagens e o Default Exchange

### 6.1. O Conceito Fundamental de Roteamento no AMQP 0-9-1

> 💡 **Conceito Chave:** No protocolo AMQP 0-9-1, **o produtor NUNCA envia mensagens diretamente para uma fila**. O produtor sempre publica no **Exchange**, e o Exchange se encarrega de rotear para as filas de acordo com os **Bindings** e a **Routing Key**.

Como então conseguimos enviar para a fila `fila_teste` sem criar um Exchange customizado?
Através do **Default Exchange** (Exchange Padrão):
* Trata-se de um Exchange pré-declarado pelo broker do tipo `direct` cujo nome é uma **string vazia `""`** (nameless exchange).
* Por especificação AMQP 0-9-1, **toda fila criada no broker é vinculada automaticamente ao Default Exchange com uma chave de roteamento idêntica ao próprio nome da fila**.
* Portanto, ao publicar no Exchange `""` com routing key `fila_teste`, a mensagem chega perfeitamente na fila `fila_teste`.

### 6.2. Publicando a Mensagem no Painel:

1. Na lista da aba **Queues**, clique em cima do nome **fila_teste**.
2. Role a página até encontrar o acordeão **Publish message** e expanda-o.
3. Configure os parâmetros da mensagem:
   * **Routing key:** `fila_teste`
   * **Delivery mode:** `2 - Persistent` *(grava a mensagem em disco físico)*
   * **Headers:** *(opcional)* `content_type=application/json`
   * **Payload:** Digite o conteúdo textual ou JSON, por exemplo:
     ```json
     {
       "id": 1001,
       "evento": "PEDIDO_GERADO",
       "cliente": "Empresa ABC",
       "valor": 1450.00,
       "data": "2026-11-11T16:00:00Z"
     }
     ```
4. Clique no botão **Publish message**.

O RabbitMQ exibirá a notificação verde **Message published**.  
Olhe o gráfico e a tabela de contadores no topo da página:
* O contador **Ready** sobe de `0` para `1`.
* O contador **Total** sobe para `1`.

---

### [Espaço Reservado para Captura de Tela 3]
> **Ação para o Aluno:** Tire um print da mensagem preenchida no formulário de publicação e do aviso "Message published" com o contador Ready em 1. Salve como `assets/screenshot-03-publish.png`.  
> *(Consulte o modelo vetorial em: `assets/placeholder-publish.svg`)*

---

## 7. Passo 5: Inspeção, Consumo e Confirmações (ACK)

A mensagem agora está protegida no buffer da fila aguardando um consumidor. Vamos consumi-la pelo próprio painel.

1. Na mesma página de detalhes da `fila_teste`, role até a seção **Get messages** e expanda-a.
2. Observe o campo **Ack Mode**:
   * **Nack message requeue true:** Faz a leitura da mensagem para você inspecioná-la, mas a devolve à fila (o contador Ready permanece em 1).
   * **Automatic ack:** Lê a mensagem e envia confirmação positiva de exclusão (o contador Ready cai para 0).
3. Selecione a opção **Automatic ack** (ou faça primeiro com requeue true para demonstrar o estado Ready e depois com Automatic ack para drenar).
4. No campo **Messages**, mantenha `1`.
5. Clique no botão **Get Message(s)**.

O painel abrirá a caixa com o resultado detalhado:
* **Exchange:** `(AMQP default)`
* **Routing Key:** `fila_teste`
* **Redelivered:** `false`
* **Payload:** O corpo JSON original transmitido com fidelidade.

Após o Automatic Ack, a métrica da fila retornará a **Ready: 0** e **Total: 0**, confirmando a entrega e liberação de memória com sucesso.

---

### [Espaço Reservado para Captura de Tela 4]
> **Ação para o Aluno:** Tire um print da mensagem inspecionada na tela com seus metadados e o contador zerado, e salve como `assets/screenshot-04-consume.png`.  
> *(Consulte o modelo vetorial em: `assets/placeholder-consume.svg`)*

---

## 8. Procedimentos de Limpeza e Finalização

Ao término da apresentação ou dos testes, finalize o laboratório com os comandos Docker correspondentes:

```bash
# Pausar o contêiner temporariamente
docker stop rabbitmq-lab

# Reiniciar o contêiner posteriormente
docker start rabbitmq-lab

# Remover o contêiner e liberar recursos definitivamente
docker rm -f rabbitmq-lab
```

---

## 9. Tabela de Diagnóstico Rápido de Falhas (Troubleshooting)

| Sintoma Observado | Causa Mais Provável | Procedimento de Resolução |
| :--- | :--- | :--- |
| `Bind for 0.0.0.0:15672 failed: port is already allocated` | A porta 15672 já está em uso por outro processo local. | Descubra o processo com `Get-NetTCPConnection -LocalPort 15672` (PowerShell) ou encerre instâncias antigas com `docker rm -f $(docker ps -aq)`. |
| Login falha com `guest:guest` | Tentativa de login por endereço IP remoto e não por `localhost`. | Acesse estritamente por `http://localhost:15672` ou configure um novo usuário administrativo no terminal via `rabbitmqctl add_user`. |
| Mensagem publicada não aparece na fila | Routing Key informada incorretamente ou com espaço extra. | Verifique se a Routing Key digitada é exatamente idêntica ao nome da fila: `fila_teste`. |
| O painel não carrega | O contêiner ainda está inicializando ou parou por falta de memória. | Verifique com `docker ps` e consulte o log com `docker logs rabbitmq-lab`. |

---
*Manual elaborado para o projeto acadêmico de Sistemas Distribuídos e Engenharia de Software.*

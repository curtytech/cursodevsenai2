# Guia do professor — SSH (Secure Shell)

## Objetivo da aula
Apresentar o SSH como protocolo de acesso remoto seguro, explicar seus componentes e demonstrar onde ele é usado em atividades de redes e desenvolvimento.

## Público e duração sugerida
Material introdutório para estudantes que estão começando a estudar redes ou administração de sistemas. Duração sugerida: 15 a 25 minutos, ajustável conforme as perguntas da turma.

## O que o estudante deve compreender
Ao final, espera-se que o estudante consiga:
- Explicar, com as próprias palavras, o que é SSH.
- Diferenciar cliente SSH e servidor SSH.
- Explicar por que o SSH é preferível ao Telnet em redes não confiáveis.
- Reconhecer o formato básico de uma conexão.
- Diferenciar chave pública e chave privada.
- Identificar usos de SCP e SFTP e citar boas práticas de segurança.

## Organização da apresentação

| Parte | Conteúdo | Orientação para explicar |
|---|---|---|
| 1 | O que é SSH | Comece com a ideia de acessar um computador sem estar no mesmo local. |
| 2 | Aplicações | Dê exemplos: manutenção de servidor, hospedagem e transferência de arquivos. |
| 3 | Telnet x SSH | Destaque que a principal diferença é a proteção da comunicação. |
| 4 | Funcionamento | Explique a sequência: contato, negociação, identificação, autenticação e sessão. |
| 5 | Componentes | Mostre cliente, servidor, endereço e porta 22. |
| 6 | Comando | Leia o comando por partes: programa, usuário e endereço. |
| 7–9 | Autenticação e chaves | Reforce que a chave pública pode ser cadastrada; a privada permanece protegida. |
| 10 | Arquivos | Apresente `known_hosts` e `authorized_keys` sem aprofundar em configuração. |
| 11 | SCP e SFTP | Diferencie cópia por comando e transferência em sessão própria. |
| 12 | Segurança | Termine com boas práticas e limites da proteção oferecida pelo SSH. |

## Roteiro de fala sugerido

**Abertura:**  
“Hoje vamos conhecer o SSH. Pensem em uma situação: um servidor está em outra cidade e alguém precisa administrar esse computador. Em vez de ir até ele, é possível acessar o terminal pela rede. O SSH faz isso com proteção para a comunicação.”

**Diferença entre Telnet e SSH:**  
“O Telnet tradicional não criptografa a sessão. Isso significa que informações poderiam ser observadas durante o caminho. O SSH foi desenvolvido para proteger essa comunicação. Portanto, não é só uma maneira diferente de abrir o terminal: é uma maneira mais segura de se conectar.”

**Funcionamento:**  
“Primeiro, o computador que inicia a conexão encontra o servidor. Os dois negociam os recursos de segurança, o cliente confere a identidade do servidor e depois o servidor verifica se o usuário tem autorização. Com tudo certo, começa a sessão protegida.”

**Par de chaves:**  
“Na autenticação por chave, existe uma chave pública e uma privada. A pública é cadastrada no servidor. A privada fica protegida com o usuário. Não devemos compartilhar a chave privada.”

**Encerramento:**  
“O SSH é muito usado para administrar servidores e transferir arquivos. Ele protege a comunicação, mas ainda precisamos usar boas senhas, proteger nossas chaves, conferir a identidade do servidor e manter os sistemas atualizados.”

## Cuidados e correções conceituais importantes
- Não diga que a criptografia é “impenetrável”. Prefira dizer que o SSH usa criptografia para proteger a comunicação.
- Não diga que a chave pública é uma senha. Ela participa de um processo criptográfico de autenticação.
- Não diga que a chave privada deve ser copiada para o servidor. O servidor recebe a chave pública.
- A porta padrão é 22, mas pode ser alterada na configuração.
- Alterar a porta não torna o servidor seguro por si só.
- O SSH não garante que o computador cliente esteja livre de malware nem corrige permissões mal configuradas.
- A mensagem de mudança de chave do servidor em `known_hosts` deve ser investigada; não recomende ignorá-la automaticamente.

## Sugestão de demonstração em sala
A apresentação foi planejada para funcionar sem simulado. Se houver um ambiente autorizado disponível, o professor pode apenas mostrar o formato de um comando SSH e explicar cada parte, sem realizar conexões externas. Não é necessário fornecer IP real, senha ou chave privada para a turma.

## Como abrir o material
1. Extraia a pasta do projeto.
2. Abra `index.html` no navegador ou use a extensão Live Server no VS Code.
3. Use **Apresentação** para avançar pelos tópicos com os botões ou setas do teclado.
4. Use **Manual completo** para leitura contínua e impressão/salvamento em PDF.
5. O link “Guia do professor” abre este documento.

## Estrutura dos arquivos
- `index.html`: estrutura da página.
- `css/style.css`: cores, layout, responsividade e efeitos visuais.
- `js/script.js`: conteúdo dos slides, manual, navegação e cópia de comandos.
- `MANUAL_DO_PROFESSOR.md`: orientação de apresentação e notas didáticas.

## Fontes para consulta
- OpenSSH — página oficial do projeto: https://www.openssh.com/
- OpenSSH Manual Pages: https://man.openbsd.org/ssh
- IETF — RFC 4251, The Secure Shell (SSH) Protocol Architecture: https://www.rfc-editor.org/rfc/rfc4251

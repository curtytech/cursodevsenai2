const chapters = [
{
title:"O que é SSH?",
tag:"01 · CONCEITO",
html:`<h3>Uma forma segura de acessar outro computador à distância.</h3>
<p>SSH é a sigla de <strong>Secure Shell</strong>. É um protocolo que permite conectar a outro computador pela rede e executar comandos nele, mesmo que você esteja em outro lugar.</p>
<div class="info-grid">
 <div class="info-card"><div class="icon">💻</div><h4>Seu computador</h4><p>É o cliente: a máquina de onde parte a conexão.</p></div>
 <div class="info-card"><div class="icon">🖥️</div><h4>Computador remoto</h4><p>É o servidor: a máquina que recebe a conexão e oferece o acesso autorizado.</p></div>
</div>
<div class="callout"><strong>Um exemplo simples:</strong> uma pessoa responsável por um site pode acessar o servidor da hospedagem sem precisar estar fisicamente perto dele.</div>`
},
{
title:"Para que ele é usado?",
tag:"02 · APLICAÇÕES",
html:`<h3>SSH aparece em tarefas comuns de infraestrutura e desenvolvimento.</h3>
<div class="info-grid">
 <div class="info-card"><div class="icon">🛠️</div><h4>Administrar servidores</h4><p>Verificar serviços, consultar arquivos e executar tarefas de manutenção.</p></div>
 <div class="info-card"><div class="icon">🚀</div><h4>Publicar projetos</h4><p>Acessar uma máquina de hospedagem e atualizar aplicações ou sites.</p></div>
 <div class="info-card"><div class="icon">📦</div><h4>Transferir arquivos</h4><p>Usar ferramentas como SCP e SFTP para enviar ou baixar arquivos.</p></div>
 <div class="info-card"><div class="icon">🔗</div><h4>Acessar serviços internos</h4><p>Criar túneis protegidos para serviços que não ficam expostos diretamente à internet.</p></div>
</div>
<p>O SSH não é um programa de acesso remoto com interface gráfica por padrão. Normalmente, ele é usado pelo terminal.</p>`
},
{
title:"Por que não usar Telnet?",
tag:"03 · CONTEXTO",
html:`<h3>O SSH foi criado para resolver um problema importante: proteger a comunicação.</h3>
<p>O Telnet é um protocolo antigo de acesso remoto. Na configuração tradicional, os dados trafegam sem criptografia, o que pode expor informações a quem consiga observar a comunicação.</p>
<div class="compare">
 <div class="old"><h4>Telnet</h4><p>Não protege a sessão com criptografia. Por isso, não é indicado para transmitir credenciais ou administrar sistemas em redes não confiáveis.</p></div>
 <div class="new"><h4>SSH</h4><p>Criptografa a comunicação e ajuda a verificar a identidade do servidor, oferecendo proteção contra leitura e alteração dos dados no caminho.</p></div>
</div>
<div class="callout"><strong>Para apresentar:</strong> a diferença principal não é a aparência do terminal. É a proteção que existe durante a comunicação.</div>`
},
{
title:"Como funciona a conexão?",
tag:"04 · FUNCIONAMENTO",
html:`<h3>Antes de abrir o terminal remoto, cliente e servidor precisam estabelecer confiança.</h3>
<div class="steps">
 <div class="step"><p><strong>Contato inicial:</strong> o cliente encontra o servidor pelo endereço e pela porta configurada.</p></div>
 <div class="step"><p><strong>Negociação:</strong> os dois lados combinam algoritmos e estabelecem chaves de sessão para proteger a comunicação.</p></div>
 <div class="step"><p><strong>Identidade do servidor:</strong> o cliente verifica a chave de host apresentada pelo servidor. Na primeira conexão, pode pedir confirmação.</p></div>
 <div class="step"><p><strong>Autenticação do usuário:</strong> o servidor verifica se a pessoa pode entrar, por senha ou por chave pública, conforme a configuração.</p></div>
 <div class="step"><p><strong>Sessão protegida:</strong> depois da autenticação, os comandos e respostas trafegam de forma criptografada.</p></div>
</div>
<p>Essas etapas acontecem rapidamente. O usuário normalmente percebe apenas a conexão sendo aberta no terminal.</p>`
},
{
title:"Cliente, servidor e porta 22",
tag:"05 · COMPONENTES",
html:`<h3>Três termos ajudam a entender qualquer conexão SSH.</h3>
<div class="info-grid">
 <div class="info-card"><h4>Cliente SSH</h4><p>Programa usado para iniciar a conexão. Exemplo: o comando <code>ssh</code> no PowerShell, Terminal ou Linux.</p></div>
 <div class="info-card"><h4>Servidor SSH</h4><p>Serviço que recebe conexões remotas. Em muitos sistemas, o serviço é chamado <code>sshd</code>.</p></div>
 <div class="info-card"><h4>Endereço IP ou domínio</h4><p>Indica qual máquina será acessada, como <code>192.0.2.10</code> ou <code>servidor.exemplo.com</code>.</p></div>
 <div class="info-card"><h4>Porta 22</h4><p>É a porta padrão do SSH. Um administrador pode configurar outra porta, então é importante confirmar qual está em uso.</p></div>
</div>
<div class="callout"><strong>Atenção:</strong> mudar a porta não substitui senhas fortes, chaves, atualizações ou regras de firewall. É apenas uma configuração de rede.</div>`
},
{
title:"O comando de conexão",
tag:"06 · PRIMEIRO COMANDO",
html:`<h3>O formato mais conhecido é curto e fácil de identificar.</h3>
<div class="code-block"><code>ssh usuario@servidor.exemplo.com</code><button class="copy-btn" data-copy="ssh usuario@servidor.exemplo.com">Copiar</button></div>
<ul>
 <li><strong>ssh:</strong> chama o cliente SSH.</li>
 <li><strong>usuario:</strong> conta existente no computador remoto.</li>
 <li><strong>servidor.exemplo.com:</strong> endereço da máquina de destino.</li>
</ul>
<p>Se o servidor usar uma porta diferente da padrão, informe-a com <code>-p</code>:</p>
<div class="code-block"><code>ssh -p 2222 usuario@servidor.exemplo.com</code><button class="copy-btn" data-copy="ssh -p 2222 usuario@servidor.exemplo.com">Copiar</button></div>
<p>Os nomes e endereços acima são exemplos. Para uma conexão real, você precisa receber os dados corretos do administrador ou do serviço de hospedagem.</p>`
},
{
title:"Senha ou par de chaves?",
tag:"07 · AUTENTICAÇÃO",
html:`<h3>Existem diferentes formas de provar que você tem permissão para entrar.</h3>
<div class="info-grid">
 <div class="info-card"><div class="icon">🔐</div><h4>Autenticação por senha</h4><p>O usuário informa a senha da conta remota. A conexão continua protegida pelo SSH, mas a senha precisa ser forte e exclusiva.</p></div>
 <div class="info-card"><div class="icon">🗝️</div><h4>Autenticação por chave</h4><p>Usa um par de chaves criptográficas: uma pública, cadastrada no servidor, e uma privada, mantida em segurança pelo usuário.</p></div>
</div>
<p>O servidor pode permitir uma forma, a outra ou ambas. Isso depende da configuração de segurança adotada.</p>
<div class="callout"><strong>Não confunda:</strong> a chave pública pode ser cadastrada no servidor. A chave privada não deve ser compartilhada nem enviada para outras pessoas.</div>`
},
{
title:"Chave pública e chave privada",
tag:"08 · PAR DE CHAVES",
html:`<h3>As duas chaves trabalham juntas, mas não têm o mesmo papel.</h3>
<div class="compare">
 <div class="new"><h4>Chave pública · .pub</h4><p>É a parte que pode ser cadastrada no servidor para autorizar aquela identidade. Em sistemas OpenSSH, costuma ficar em <code>authorized_keys</code>.</p></div>
 <div class="old"><h4>Chave privada</h4><p>Fica sob controle do usuário, normalmente protegida no próprio computador. Não deve ser enviada ao servidor nem publicada.</p></div>
</div>
<p>Uma analogia útil é pensar na chave pública como um cadeado que pode ser instalado na porta, enquanto a chave privada fica com a pessoa autorizada. A analogia ajuda a memorizar, mas o processo real é matemático.</p>
<h4>Arquivos comuns</h4>
<div class="code-block"><code>~/.ssh/id_ed25519       # chave privada
~/.ssh/id_ed25519.pub   # chave pública</code><button class="copy-btn" data-copy="~/.ssh/id_ed25519\n~/.ssh/id_ed25519.pub">Copiar</button></div>`
},
{
title:"Criando um par de chaves",
tag:"09 · SSH-KEYGEN",
html:`<h3>O OpenSSH oferece o comando <code>ssh-keygen</code> para criar as chaves.</h3>
<div class="code-block"><code>ssh-keygen -t ed25519 -C "seu_email@exemplo.com"</code><button class="copy-btn" data-copy='ssh-keygen -t ed25519 -C "seu_email@exemplo.com"'>Copiar</button></div>
<p>O parâmetro <code>-t ed25519</code> escolhe o tipo de chave. O comentário ajuda a identificar a chave depois.</p>
<p>Durante o processo, o programa pergunta onde salvar os arquivos e se você deseja definir uma frase secreta (passphrase). Essa frase adiciona uma camada de proteção à chave privada.</p>
<div class="callout"><strong>Importante:</strong> não compartilhe a chave privada. Se estiver usando um computador compartilhado, pense bem antes de deixar uma chave pessoal salva nele.</div>`
},
{
title:"Arquivos e comandos importantes",
tag:"10 · CONSULTA",
html:`<h3>Alguns nomes aparecem com frequência quando se trabalha com SSH.</h3>
<div class="info-grid">
 <div class="info-card"><h4><code>known_hosts</code></h4><p>Arquivo local que registra chaves de host já conhecidas. Ajuda a perceber mudanças inesperadas na identidade de um servidor.</p></div>
 <div class="info-card"><h4><code>authorized_keys</code></h4><p>Arquivo no lado do servidor que pode listar as chaves públicas autorizadas para uma conta.</p></div>
 <div class="info-card"><h4><code>ssh-keygen</code></h4><p>Cria e gerencia pares de chaves SSH.</p></div>
 <div class="info-card"><h4><code>whoami</code> e <code>exit</code></h4><p><code>whoami</code> mostra o usuário atual. <code>exit</code> encerra a sessão remota.</p></div>
</div>
<p>Se o SSH avisar que a chave de host mudou, não ignore automaticamente. Confirme a alteração com o responsável pelo servidor antes de continuar.</p>`
},
{
title:"Transferência de arquivos",
tag:"11 · SCP E SFTP",
html:`<h3>O SSH também serve de base para transferir arquivos com segurança.</h3>
<div class="info-grid">
 <div class="info-card"><h4>SCP</h4><p>Permite copiar arquivos pela linha de comando usando uma conexão SSH.</p></div>
 <div class="info-card"><h4>SFTP</h4><p>Permite navegar e transferir arquivos em uma sessão própria, também protegida por SSH.</p></div>
</div>
<p>Exemplo de cópia de uma pasta local para uma pasta remota:</p>
<div class="code-block"><code>scp -r ./meu-site usuario@servidor.exemplo.com:/var/www/html/</code><button class="copy-btn" data-copy="scp -r ./meu-site usuario@servidor.exemplo.com:/var/www/html/">Copiar</button></div>
<p>O caminho remoto depende do sistema e das permissões da conta. Em alguns servidores, o usuário não terá autorização para gravar diretamente na pasta do site.</p>`
},
{
title:"Segurança e boas práticas",
tag:"12 · FECHAMENTO",
html:`<h3>Uma conexão criptografada ainda precisa ser bem administrada.</h3>
<ul>
 <li>Use senhas fortes e diferentes para cada serviço.</li>
 <li>Proteja a chave privada e considere usar uma passphrase.</li>
 <li>Confira a identidade do servidor, especialmente na primeira conexão ou quando aparecer um aviso de mudança.</li>
 <li>Mantenha o cliente e o servidor atualizados.</li>
 <li>Conceda apenas as permissões necessárias a cada conta.</li>
 <li>Evite compartilhar contas e credenciais.</li>
 <li>Use firewall e regras de acesso adequadas ao ambiente.</li>
</ul>
<div class="callout"><strong>Para concluir:</strong> SSH permite administrar computadores à distância com uma comunicação protegida. Entender cliente, servidor, autenticação e chaves já dá uma boa base para compreender seu uso em redes e desenvolvimento.</div>
<p>O SSH protege o caminho da comunicação, mas não corrige sozinho uma senha fraca, um computador comprometido ou uma configuração mal feita.</p>`
}
];

let currentSlide = 0;
const $ = (id) => document.getElementById(id);

function renderSlide(index){
  currentSlide = Math.max(0, Math.min(index, chapters.length - 1));
  const chapter = chapters[currentSlide];
  $("slideTitle").textContent = chapter.title;
  $("slideNumber").textContent = String(currentSlide + 1).padStart(2,"0");
  $("slideTotal").textContent = String(chapters.length).padStart(2,"0");
  $("slideContent").innerHTML = `<div class="section-kicker">${chapter.tag}</div>${chapter.html}`;
  $("progressBar").style.width = `${((currentSlide + 1) / chapters.length) * 100}%`;
  $("prevBtn").disabled = currentSlide === 0;
  $("nextBtn").disabled = currentSlide === chapters.length - 1;
  $("slideDots").innerHTML = "";
  chapters.forEach((item, i) => {
    const dot = document.createElement("button");
    dot.className = `dot ${i === currentSlide ? "active" : ""}`;
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para o slide ${i + 1}: ${item.title}`);
    dot.addEventListener("click", () => renderSlide(i));
    $("slideDots").appendChild(dot);
  });
}
function renderManual(){
  $("contentsLinks").innerHTML = "";
  $("manualContent").innerHTML = "";
  chapters.forEach((chapter, i) => {
    const id = `topico-${i+1}`;
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = `${String(i+1).padStart(2,"0")} · ${chapter.title}`;
    $("contentsLinks").appendChild(link);
    const section = document.createElement("section");
    section.className = "manual-section";
    section.id = id;
    section.innerHTML = `<div class="section-kicker">${chapter.tag}</div><h3>${chapter.title}</h3>${chapter.html}`;
    $("manualContent").appendChild(section);
  });
}
function switchMode(mode){
  const slides = mode === "slides";
  $("slidesView").classList.toggle("active", slides);
  $("manualView").classList.toggle("active", !slides);
  $("tabSlides").classList.toggle("active", slides);
  $("tabManual").classList.toggle("active", !slides);
  if(!slides) window.scrollTo({top:0,behavior:"smooth"});
}
$("prevBtn").addEventListener("click", () => renderSlide(currentSlide - 1));
$("nextBtn").addEventListener("click", () => renderSlide(currentSlide + 1));
$("tabSlides").addEventListener("click", () => switchMode("slides"));
$("tabManual").addEventListener("click", () => switchMode("manual"));
$("themeToggle").addEventListener("click", () => document.body.classList.toggle("light"));
document.addEventListener("keydown", (event) => {
  if(!$("slidesView").classList.contains("active")) return;
  if(event.key === "ArrowRight") renderSlide(currentSlide + 1);
  if(event.key === "ArrowLeft") renderSlide(currentSlide - 1);
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if(!button) return;
  try{
    await navigator.clipboard.writeText(button.dataset.copy);
    const old = button.textContent;
    button.textContent = "Copiado!";
    setTimeout(() => button.textContent = old, 1300);
  }catch{
    button.textContent = "Copie manualmente";
  }
});
renderManual();
renderSlide(0);

/**
 * Guia do Curso — Modo Live Total Nativo na Vercel (100% Google Gemini Live)
 * ---------------------------------------------------------------------------
 * - Arquitetura 100% nativa na Vercel (sem servidor WebSocket persistente,
 *   sem `node server.js`, sem expor a GEMINI_API_KEY):
 *     1. Pede um Token Efêmero de uso único à Vercel Function `POST /api/live-token`
 *        (com `systemInstruction`, voz e VAD criptograficamente travados no Google).
 *     2. Conecta o navegador DIRETAMENTE à borda do Google Gemini Live
 *        (`BidiGenerateContentConstrained?access_token=...`) com latência mínima.
 * - ZERO TTS do computador e ZERO voz sintética do sistema operacional.
 * - Áudio bidirecional full-duplex: Microfone 16kHz PCM (40ms) ⇄ Gemini 24kHz PCM.
 * - Interrupção natural (*barge-in*), Orb líquido 60fps e Guardrail 2 estágios.
 */
(() => {
  const SESSION_STATE_KEY = 'devsenai-guide-state-v1';
  const SESSION_DISMISSED_KEY = 'devsenai-guide-dismissed-v1';
  const VOICE_PREF_KEY = 'devsenai-guide-live-voice-v1';
  const COOLDOWN_SECONDS = 30;
  const VALID_VOICES = ['Kore', 'Aoede', 'Puck', 'Zephyr', 'Fenrir'];

  function getRootPrefix() {
    const attr = document.body.getAttribute('data-root-prefix');
    return attr !== null ? attr : '';
  }

  function isLocalHostEnv() {
    return (
      window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  function getTokenEndpoints() {
    const endpoints = [];
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      endpoints.push('/api/live-token');
    }
    if (isLocalHostEnv() && window.location.port !== '3000') {
      endpoints.push('http://localhost:3000/api/live-token');
    }
    return endpoints;
  }

  function normalizeText(input) {
    return String(input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
  }

  function uint8ToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function base64ToUint8(base64) {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function resolveLinkHref(href, prefix) {
    if (!href || /^(https?:|#|mailto:)/i.test(href)) return href;
    if (prefix && !href.startsWith(prefix) && !href.startsWith('../')) {
      return `${prefix}${href}`;
    }
    return href;
  }

  // Guardrail em tempo real (além da systemInstruction travada no Token Efêmero do Google)
  const BYPASS_PATTERNS = [
    /ignor[ae]\s+(todas?\s+)?(as\s+|suas\s+)?(instruc|regras|diretriz|comand|restri)/,
    /esquec[ae]\s+(tudo|todas?|as\s+|suas\s+)?(regras|instruc|limit|papel|escopo)?/,
    /desconsider[ae]\s+(as\s+|suas\s+)?(regras|instruc|restri)/,
    /(aja|atue|finja|finge|comporte-se)\s+(como|ser|que)/,
    /(modo\s+desenvolvedor|developer\s+mode|jailbreak|\bdan\b|god\s+mode|unrestricted)/,
    /(system\s+prompt|prompt\s+do\s+sistema|mostre\s+suas\s+instruc|revele\s+o\s+prompt)/,
    /(sem\s+restri|sem\s+limit|burlar|quebrar\s+a?\s*regra|bypass|override)/,
    /(ignore\s+previous|forget\s+your\s+instructions|pretend\s+to\s+be|act\s+as\s+a)/,
    /(so\s+dessa\s+vez|responda\s+mesmo\s+assim|finge\s+que\s+e\s+sobre\s+o\s+projeto)/
  ];

  const OFF_TOPIC_PATTERNS = [
    /\b(receita|bolo|comida|cozinhar|culinaria|almoco|jantar|pizza|cafe)\b/,
    /\b(futebol|flamengo|corinthians|palmeiras|vasco|copa|gol|basquete|esporte)\b/,
    /\b(politica|presidente|eleicao|partido|deputado|senador|governo|guerra)\b/,
    /\b(clima|tempo\s+hoje|vai\s+chover|previsao\s+do\s+tempo|temperatura)\b/,
    /\b(piada|conte\s+uma\s+historia|poema|poesia|musica|letra\s+de|filme|serie|novela|anime)\b/,
    /\b(horoscopo|signo|tarot|loteria|aposta|bet|cassino)\b/,
    /\b(remedio|doenca|sintoma|medico|dieta|emagrecer|treino\s+academia)\b/,
    /\b(namoro|relacionamento|paquera|fofoca|celebridade)\b/,
    /\b(bitcoin|criptomoeda|bolsa\s+de\s+valores|investimento|dolar\s+hoje)\b/,
    /\b(redacao\s+enem|capital\s+da|quem\s+descobriu)\b/
  ];

  const PROJECT_KEYWORDS = [
    'projeto', 'curso', 'senai', 'devtarde', 'devsenai', 'repositorio', 'portal', 'modulo',
    'aluno', 'alunos', 'curriculo', 'trabalho', 'trabalhos', 'portfolio', 'pin', 'video', 'aula', 'aulas', 'player',
    'html', 'css', 'tailwind', 'vue', 'javascript', 'node', 'express', 'api', 'rest', 'rota', 'rotas',
    'sqlite', 'banco', 'dados', 'sql', 'migration', 'tarefa', 'tarefas', 'todo', 'firebase', 'firestore', 'supabase',
    'vercel', 'github', 'git', 'slide', 'manual', 'iconsax', 'live', 'guia'
  ];

  function checkStrictGuardrail(rawMessage) {
    const text = normalizeText(rawMessage);
    if (!text) return null;

    for (const pattern of BYPASS_PATTERNS) {
      if (pattern.test(text)) {
        return { kind: 'bypass', reason: 'Tentativa de contorno das diretrizes do Guia do Curso detectada.' };
      }
    }

    const hasProjectTerm = PROJECT_KEYWORDS.some((kw) => new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|$)`).test(text));
    if (!hasProjectTerm && OFF_TOPIC_PATTERNS.some((p) => p.test(text))) {
      return { kind: 'off_topic', reason: 'Assunto fora do escopo exclusivo do projeto Curso DEV SENAI.' };
    }
    return null;
  }

  function isAssistantScopeRefusal(assistantSpeech) {
    const text = normalizeText(assistantSpeech);
    if (!text) return false;
    return /(fora\s+do\s+escopo|apenas\s+sobre\s+o\s+projeto|so\s+posso\s+(conversar|falar|ajudar|responder)\s+sobre\s+o\s+(projeto|curso)|exclusiv[ao]\s+(para|do)\s+(este\s+)?(projeto|curso)|nao\s+posso\s+(ajudar|falar|responder)\s+sobre\s+(esse\s+assunto|isso|temas?\s+externos?))/.test(text);
  }

  function detectProjectShortcut(combinedText) {
    const text = normalizeText(combinedText);
    if (/\b(front-vue|task\s*list|lista\s+de\s+tarefas|tarefas)\b/.test(text)) {
      return { label: 'Abrir Task List Vue', href: 'projects/front-vue/index.html' };
    }
    if (/\b(banco\s+de\s+dados|sqlite|sql|migration|modelagem|sgbd)\b/.test(text)) {
      return { label: 'Módulo Banco de Dados', href: 'Modulos/BancoDeDados/repositorio.html' };
    }
    if (/\b(trabalho|trabalhos|portfolio|pin|upload|r2)\b/.test(text)) {
      return { label: 'Trabalhos da Turma', href: 'trabalhos/trabalhos.html' };
    }
    if (/\b(curso|cursos|videoaula|playlist|player)\b/.test(text)) {
      return { label: 'Cursos & Vídeos', href: 'cursos/index.html' };
    }
    if (/\b(firebase|firestore|nosql)\b/.test(text)) {
      return { label: 'Manual Firebase & Firestore', href: 'documents/manual-firebase-firestore.html' };
    }
    if (/\b(express|node\.?js|slides|camadas|controller)\b/.test(text)) {
      return { label: 'Slides Node.js & Express', href: 'documents/nodejs-slide.html' };
    }
    if (/\b(alunos?\s+devtarde|curriculos?|matricula)\b/.test(text)) {
      return { label: 'Alunos DevTarde', href: '#trilhas', action: 'open-students' };
    }
    return null;
  }

  function loadSessionState() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_STATE_KEY) || '{}');
      return {
        sessionId: parsed.sessionId || `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        violations: Number(parsed.violations || 0),
        locked: Boolean(parsed.locked),
        lockReason: parsed.lockReason || '',
        lockUntil: Number(parsed.lockUntil || 0)
      };
    } catch {
      return {
        sessionId: `sess_${Date.now().toString(36)}`,
        violations: 0,
        locked: false,
        lockReason: '',
        lockUntil: 0
      };
    }
  }

  function saveSessionState(st) {
    try { sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(st)); } catch {}
  }

  function loadPreferredVoice() {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY);
      if (saved && VALID_VOICES.includes(saved)) return saved;
    } catch {}
    return 'Kore';
  }

  // AudioWorklet inline: resampling limpo em chunks rápidos de 40ms (640 amostras @ 16kHz Int16)
  const MIC_WORKLET_CODE = `
    class Pcm16kLiveProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.targetRate = 16000;
        this.ratio = sampleRate / this.targetRate;
        this.frac = 0;
        this.chunkSize = 640; // 40ms @ 16kHz
        this.buf = new Int16Array(this.chunkSize);
        this.offset = 0;
      }
      process(inputs) {
        const input = inputs[0] && inputs[0][0];
        if (!input || input.length === 0) return true;
        let idx = this.frac;
        while (idx < input.length) {
          const i0 = Math.floor(idx);
          const i1 = Math.min(i0 + 1, input.length - 1);
          const alpha = idx - i0;
          const s = input[i0] + (input[i1] - input[i0]) * alpha;
          const clamped = s < -1 ? -1 : s > 1 ? 1 : s;
          this.buf[this.offset++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
          if (this.offset >= this.chunkSize) {
            const out = this.buf.slice(0);
            this.port.postMessage(out.buffer, [out.buffer]);
            this.offset = 0;
          }
          idx += this.ratio;
        }
        this.frac = idx - input.length;
        return true;
      }
    }
    registerProcessor('pcm-16k-live-processor', Pcm16kLiveProcessor);
  `;

  function initAssistant() {
    if (document.getElementById('devsenaiGuideDrawer')) return;

    const prefix = getRootPrefix();
    const autoOpen = document.body.getAttribute('data-assistant-auto-open') === 'true';
    const state = loadSessionState();
    saveSessionState(state);

    let selectedVoice = loadPreferredVoice();
    let liveActive = false;
    let liveConnecting = false;
    let liveMuted = false;
    let liveState = 'idle';
    let liveWs = null;
    let pendingPromptOnConnect = null;
    let lastGuardrailTs = 0;
    let lastShortcutHref = '';

    // Web Audio API full-duplex
    let micStream = null;
    let micCtx = null;
    let micAnalyser = null;
    let micNode = null;
    let playCtx = null;
    let outputAnalyser = null;
    let nextPlayTime = 0;
    const activeSources = new Set();

    // Transcrições ao vivo
    let userDraftText = '';
    let assistantDraftText = '';
    let userDraftBubble = null;
    let assistantDraftBubble = null;

    // Launcher discreto
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'devsenaiGuideLauncher';
    launcher.className = 'guide-launcher';
    launcher.setAttribute('aria-label', 'Abrir Guia do Curso — Google Gemini Live');
    launcher.innerHTML = `
      <span class="guide-launcher-dot" aria-hidden="true"></span>
      <isax-anim name="microphone" size="17"></isax-anim>
      <span id="guideLauncherLabel">Gemini Live</span>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'devsenaiGuideBackdrop';
    backdrop.className = 'guide-backdrop';

    const drawer = document.createElement('aside');
    drawer.id = 'devsenaiGuideDrawer';
    drawer.className = 'guide-drawer';
    drawer.setAttribute('role', 'complementary');
    drawer.setAttribute('aria-label', 'Guia do Curso — Conversa ao Vivo Google Gemini');
    drawer.innerHTML = `
      <div class="guide-header">
        <div class="guide-header-brand">
          <div class="guide-emblem">
            <isax-anim name="compass" size="20" trigger="ambient"></isax-anim>
          </div>
          <div>
            <h2 class="guide-title">Guia do Curso</h2>
            <p class="guide-subtitle">Google Gemini Live • Exclusiva do projeto</p>
          </div>
        </div>
        <div class="guide-header-actions">
          <select id="guideVoiceSelect" class="guide-voice-select" aria-label="Escolher voz do Google Gemini Live" title="Voz nativa do Google Gemini Live">
            <option value="Kore">Voz Kore</option>
            <option value="Aoede">Voz Aoede</option>
            <option value="Puck">Voz Puck</option>
            <option value="Zephyr">Voz Zephyr</option>
            <option value="Fenrir">Voz Fenrir</option>
          </select>
          <button type="button" id="guideCloseBtn" class="ux-btn ux-btn-ghost"
            style="width:2rem;height:2rem;border-radius:0.65rem;" aria-label="Recolher Guia do Curso">
            <isax-anim name="close" size="16"></isax-anim>
          </button>
        </div>
      </div>

      <div class="guide-scope-bar">
        <span id="guideScopeBadge" class="guide-scope-badge">
          <isax-anim name="shield-tick" size="15"></isax-anim>
          <span id="guideScopeText">Escopo fechado ao projeto</span>
        </span>
        <span id="guideEngineTag" class="ds-mono" style="font-size:0.67rem;">Verificando Gemini Live...</span>
      </div>

      <!-- Palco Full-Stage Google Gemini Live -->
      <section id="guideLiveStage" class="guide-live-stage" aria-label="Conversa ao vivo por voz">
        <button type="button" id="guideLiveOrbBtn" class="guide-live-orb-btn"
          aria-label="Iniciar ou interromper conversa ao vivo" title="Clique para iniciar a conversa ao vivo ou interromper a fala">
          <canvas id="guideLiveOrbCanvas" class="guide-live-orb-canvas" width="448" height="448"></canvas>
          <span id="guideLiveOrbIcon" class="guide-live-orb-icon">
            <isax-anim name="microphone" size="34"></isax-anim>
          </span>
        </button>

        <div id="guideLiveStatusPill" class="guide-live-status-pill">
          <span class="guide-live-status-dot" aria-hidden="true"></span>
          <span id="guideLiveStatusText">Toque abaixo para conversar ao vivo</span>
        </div>

        <div id="guideLiveCaption" class="guide-live-caption" aria-live="polite">
          Conversa natural em tempo real direto no <strong>Google Gemini Live</strong> — fale normalmente e interrompa quando quiser.
        </div>

        <a id="guideLiveShortcut" class="guide-live-shortcut" href="#">
          <span id="guideLiveShortcutLabel">Abrir página</span>
          <isax-anim name="arrow-right" size="14"></isax-anim>
        </a>

        <div class="guide-live-starters" aria-label="Sugestões para começar">
          <button type="button" class="guide-chip" data-live-prompt="Oi! Me apresenta rapidinho o que tem neste portal do Curso DEV SENAI.">Apresentar o portal</button>
          <button type="button" class="guide-chip" data-live-prompt="Me explica como funciona a lista de tarefas em Vue e a API do curso.">Task List &amp; API</button>
          <button type="button" class="guide-chip" data-live-prompt="Quais aulas existem no módulo de Banco de Dados?">Aulas de SQL</button>
          <button type="button" class="guide-chip" data-live-prompt="Como faço para publicar um trabalho da turma?">Publicar trabalho</button>
        </div>
      </section>

      <!-- Gaveta Expansível de Transcrição & Teclado -->
      <section id="guideTranscriptPanel" class="guide-transcript-panel" aria-label="Transcrição da conversa">
        <div id="guideMessages" class="guide-messages" aria-live="polite"></div>
        <form id="guideForm" class="guide-form" autocomplete="off">
          <input id="guideInput" type="text" class="ux-input guide-input"
            placeholder="Envie uma pergunta para o Gemini Live responder em voz..." aria-label="Enviar mensagem ao Gemini Live" />
          <button id="guideSendBtn" type="submit" class="ux-btn ux-btn-primary guide-send-btn" aria-label="Enviar ao Gemini Live">
            <isax-anim name="send" size="16"></isax-anim>
          </button>
        </form>
      </section>

      <!-- Dock Inferior Estilo Google Gemini Live -->
      <div class="guide-live-dock">
        <button type="button" id="guideMuteBtn" class="guide-dock-circle" disabled
          aria-label="Silenciar ou retomar microfone" title="Silenciar / Retomar microfone">
          <isax-anim id="guideMuteIcon" name="microphone" size="19"></isax-anim>
        </button>

        <button type="button" id="guideCallBtn" class="guide-dock-primary is-start">
          <isax-anim id="guideCallIcon" name="microphone" size="18"></isax-anim>
          <span id="guideCallLabel">Conversar ao Vivo</span>
        </button>

        <button type="button" id="guideTranscriptToggleBtn" class="guide-dock-circle"
          aria-label="Mostrar ou ocultar transcrição e teclado" title="Ver transcrição e teclado">
          <isax-anim name="message" size="19"></isax-anim>
        </button>
      </div>
    `;

    document.body.append(backdrop, drawer, launcher);

    // Referências de DOM
    const launcherLabelEl = document.getElementById('guideLauncherLabel');
    const voiceSelectEl = document.getElementById('guideVoiceSelect');
    const closeBtnEl = document.getElementById('guideCloseBtn');
    const scopeBadgeEl = document.getElementById('guideScopeBadge');
    const scopeTextEl = document.getElementById('guideScopeText');
    const engineTagEl = document.getElementById('guideEngineTag');

    const liveStageEl = document.getElementById('guideLiveStage');
    const orbBtnEl = document.getElementById('guideLiveOrbBtn');
    const orbCanvasEl = document.getElementById('guideLiveOrbCanvas');
    const orbIconEl = document.getElementById('guideLiveOrbIcon');
    const statusPillEl = document.getElementById('guideLiveStatusPill');
    const statusTextEl = document.getElementById('guideLiveStatusText');
    const captionEl = document.getElementById('guideLiveCaption');
    const shortcutEl = document.getElementById('guideLiveShortcut');
    const shortcutLabelEl = document.getElementById('guideLiveShortcutLabel');

    const messagesEl = document.getElementById('guideMessages');
    const formEl = document.getElementById('guideForm');
    const inputEl = document.getElementById('guideInput');
    const sendBtnEl = document.getElementById('guideSendBtn');

    const muteBtnEl = document.getElementById('guideMuteBtn');
    const muteIconEl = document.getElementById('guideMuteIcon');
    const callBtnEl = document.getElementById('guideCallBtn');
    const callIconEl = document.getElementById('guideCallIcon');
    const callLabelEl = document.getElementById('guideCallLabel');
    const transcriptToggleBtnEl = document.getElementById('guideTranscriptToggleBtn');

    voiceSelectEl.value = selectedVoice;

    // =========================================================================
    // Orb Líquido Acústico em Canvas (60fps reativo a Microfone & Voz 24kHz)
    // =========================================================================
    const orbCtx = orbCanvasEl.getContext('2d');
    const micBins = new Uint8Array(64);
    const outBins = new Uint8Array(64);
    let smoothEnergy = 0;
    let phase = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function sampleAnalyserEnergy(analyser, bins) {
      if (!analyser) return 0;
      analyser.getByteFrequencyData(bins);
      let total = 0;
      const len = Math.min(40, bins.length);
      for (let i = 0; i < len; i++) total += bins[i];
      return Math.min(1, total / (len * 135));
    }

    function renderOrbFrame() {
      const w = orbCanvasEl.width;
      const h = orbCanvasEl.height;
      const cx = w / 2;
      const cy = h / 2;
      orbCtx.clearRect(0, 0, w, h);

      const isSpeaking = activeSources.size > 0 || liveState === 'speaking';
      const micEnergy = liveActive && !liveMuted ? sampleAnalyserEnergy(micAnalyser, micBins) : 0;
      const outEnergy = isSpeaking ? sampleAnalyserEnergy(outputAnalyser, outBins) : 0;

      const targetEnergy = isSpeaking
        ? Math.max(0.28, outEnergy * 1.45)
        : liveState === 'user-speaking'
        ? Math.max(0.24, micEnergy * 1.65)
        : liveActive && !liveMuted
        ? Math.max(0.08, micEnergy * 1.5)
        : liveState === 'thinking' || liveConnecting
        ? 0.22
        : 0.05;

      smoothEnergy += (targetEnergy - smoothEnergy) * 0.16;
      phase += reducedMotion ? 0.008 : 0.028 + smoothEnergy * 0.058;

      let r = 217, g = 119, b = 6;
      if (state.locked || liveState === 'error') {
        r = 244; g = 63; b = 94;
      } else if (isSpeaking) {
        r = 217; g = 119; b = 6;
      } else if (liveState === 'thinking' || liveConnecting) {
        r = 99; g = 102; b = 241;
      } else if (liveActive && liveMuted) {
        r = 148; g = 163; b = 184;
      } else if (liveActive) {
        r = 16; g = 185; b = 129;
      }

      const haloR = 92 + smoothEnergy * 78;
      const halo = orbCtx.createRadialGradient(cx, cy, 24, cx, cy, haloR);
      halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.28 + smoothEnergy * 0.3})`);
      halo.addColorStop(0.58, `rgba(${r}, ${g}, ${b}, ${0.09 + smoothEnergy * 0.12})`);
      halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      orbCtx.fillStyle = halo;
      orbCtx.beginPath();
      orbCtx.arc(cx, cy, haloR, 0, Math.PI * 2);
      orbCtx.fill();

      const rings = [
        { base: 74, amp: 10 + smoothEnergy * 30, speed: 1.0, alpha: 0.62, lw: 3.0 },
        { base: 92, amp: 8 + smoothEnergy * 24, speed: -0.78, alpha: 0.36, lw: 2.1 },
        { base: 112, amp: 6 + smoothEnergy * 18, speed: 0.55, alpha: 0.18, lw: 1.5 }
      ];

      for (const ring of rings) {
        orbCtx.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const ang = (i / steps) * Math.PI * 2;
          const wave =
            Math.sin(ang * 3 + phase * ring.speed) * (ring.amp * 0.55) +
            Math.cos(ang * 5 - phase * ring.speed * 1.25) * (ring.amp * 0.35);
          const rad = ring.base + smoothEnergy * 18 + wave;
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad;
          if (i === 0) orbCtx.moveTo(x, y);
          else orbCtx.lineTo(x, y);
        }
        orbCtx.closePath();
        orbCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ring.alpha})`;
        orbCtx.lineWidth = ring.lw;
        orbCtx.stroke();
      }

      if (liveActive && !liveMuted && !reducedMotion) {
        const activeBins = isSpeaking ? outBins : micBins;
        const barCount = 24;
        for (let i = 0; i < barCount; i++) {
          const val = (activeBins[i] || 0) / 255;
          const angle = (i / barCount) * Math.PI * 2 + phase * 0.25;
          const innerR = 58 + smoothEnergy * 8;
          const barLen = 4 + val * 26;
          orbCtx.beginPath();
          orbCtx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
          orbCtx.lineTo(cx + Math.cos(angle) * (innerR + barLen), cy + Math.sin(angle) * (innerR + barLen));
          orbCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.28 + val * 0.6})`;
          orbCtx.lineWidth = 3;
          orbCtx.lineCap = 'round';
          orbCtx.stroke();
        }
      }

      const core = orbCtx.createRadialGradient(cx - 14, cy - 14, 6, cx, cy, 62);
      core.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.34 + smoothEnergy * 0.24})`);
      core.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);
      orbCtx.fillStyle = core;
      orbCtx.beginPath();
      orbCtx.arc(cx, cy, 56 + smoothEnergy * 9, 0, Math.PI * 2);
      orbCtx.fill();

      requestAnimationFrame(renderOrbFrame);
    }
    requestAnimationFrame(renderOrbFrame);

    // =========================================================================
    // Estados Visuais da Interface Gemini Live
    // =========================================================================
    let lastIconName = 'microphone';

    function setOrbIcon(name, ambient = false) {
      if (lastIconName === name && ambient === (orbIconEl.dataset.ambient === '1')) return;
      lastIconName = name;
      orbIconEl.dataset.ambient = ambient ? '1' : '0';
      orbIconEl.innerHTML = `<isax-anim name="${name}" size="32"${ambient ? ' trigger="ambient"' : ''}></isax-anim>`;
    }

    function setLiveVisualState(nextState, statusLabel, captionHtml = null) {
      liveState = nextState;
      liveStageEl.classList.remove('is-session-on', 'is-listening', 'is-speaking', 'is-thinking');
      statusPillEl.classList.remove('is-listening', 'is-speaking', 'is-thinking', 'is-error');
      launcher.classList.remove('is-live');

      const inCall = liveActive || liveConnecting;
      if (inCall) liveStageEl.classList.add('is-session-on');

      muteBtnEl.disabled = !liveActive;
      callBtnEl.classList.toggle('is-start', !inCall);
      callBtnEl.classList.toggle('is-hangup', inCall);
      callIconEl.setAttribute('name', inCall ? 'stop-circle' : 'microphone');
      callLabelEl.textContent = inCall ? 'Encerrar Live' : 'Conversar ao Vivo';

      if (nextState === 'connecting' || nextState === 'thinking') {
        liveStageEl.classList.add('is-thinking');
        statusPillEl.classList.add('is-thinking');
        launcher.classList.add('is-live');
        launcherLabelEl.textContent = nextState === 'connecting' ? 'Conectando...' : 'Pensando...';
        setOrbIcon('radar', true);
      } else if (nextState === 'speaking') {
        liveStageEl.classList.add('is-speaking');
        statusPillEl.classList.add('is-speaking');
        launcher.classList.add('is-live');
        launcherLabelEl.textContent = 'Ao Vivo • Falando';
        setOrbIcon('volume-high', true);
      } else if (nextState === 'listening' || nextState === 'user-speaking') {
        liveStageEl.classList.add('is-listening');
        statusPillEl.classList.add('is-listening');
        launcher.classList.add('is-live');
        launcherLabelEl.textContent = nextState === 'user-speaking' ? 'Ouvindo você...' : 'Gemini Live';
        setOrbIcon('microphone', true);
      } else if (nextState === 'muted') {
        launcher.classList.add('is-live');
        launcherLabelEl.textContent = 'Live • Mic pausado';
        setOrbIcon('volume-slash', false);
      } else if (nextState === 'error') {
        statusPillEl.classList.add('is-error');
        launcherLabelEl.textContent = 'Gemini Live';
        setOrbIcon('warning', false);
      } else {
        launcherLabelEl.textContent = 'Gemini Live';
        setOrbIcon('microphone', false);
      }

      if (statusLabel) statusTextEl.textContent = statusLabel;
      if (captionHtml !== null) captionEl.innerHTML = captionHtml;
    }

    function updateScopeIndicator() {
      const icon = scopeBadgeEl.querySelector('isax-anim');
      scopeBadgeEl.classList.remove('is-warn', 'is-blocked');
      if (state.locked) {
        scopeBadgeEl.classList.add('is-blocked');
        if (icon) icon.setAttribute('name', 'lock');
        scopeTextEl.textContent = 'Sessão bloqueada (2/2)';
      } else if (state.violations === 1) {
        scopeBadgeEl.classList.add('is-warn');
        if (icon) icon.setAttribute('name', 'warning');
        scopeTextEl.textContent = 'Aviso ativo (1/2)';
      } else {
        if (icon) icon.setAttribute('name', 'shield-tick');
        scopeTextEl.textContent = 'Escopo fechado ao projeto';
      }
    }

    function appendTranscriptMessage(role, htmlContent, { isDraft = false, link = null } = {}) {
      const bubble = document.createElement('div');
      bubble.className = `guide-msg guide-msg--${role}${isDraft ? ' guide-msg--live-draft' : ''}`;
      bubble.innerHTML = htmlContent;

      if (link) {
        const a = document.createElement('a');
        a.className = 'guide-msg-link';
        a.href = resolveLinkHref(link.href || '#', prefix);
        if (link.action === 'open-students') {
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            const btn = document.getElementById('openStudentsApp');
            if (btn) btn.click();
          });
        }
        a.innerHTML = `<span>${escapeHtml(link.label)}</span><isax-anim name="arrow-right" size="13"></isax-anim>`;
        bubble.appendChild(document.createElement('br'));
        bubble.appendChild(a);
      }

      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return bubble;
    }

    function showLiveShortcut(link) {
      if (!link || link.href === lastShortcutHref) return;
      lastShortcutHref = link.href;
      shortcutLabelEl.textContent = link.label;
      shortcutEl.href = resolveLinkHref(link.href || '#', prefix);
      shortcutEl.onclick = link.action === 'open-students'
        ? (ev) => {
            ev.preventDefault();
            const btn = document.getElementById('openStudentsApp');
            if (btn) btn.click();
          }
        : null;
      shortcutEl.classList.add('is-visible');
      appendTranscriptMessage('assistant', 'Atalho citado na conversa:', { link });
    }

    function finalizeDrafts() {
      if (userDraftBubble) {
        userDraftBubble.classList.remove('guide-msg--live-draft');
        userDraftBubble = null;
        userDraftText = '';
      }
      if (assistantDraftBubble) {
        assistantDraftBubble.classList.remove('guide-msg--live-draft');
        assistantDraftBubble = null;
        assistantDraftText = '';
      }
    }

    // =========================================================================
    // Playback Gapless PCM 24kHz (100% Áudio Nativo Google Gemini Live)
    // =========================================================================
    function ensurePlaybackContext() {
      if (!playCtx || playCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        try {
          playCtx = new AudioCtx({ sampleRate: 24000 });
        } catch {
          playCtx = new AudioCtx();
        }
        outputAnalyser = playCtx.createAnalyser();
        outputAnalyser.fftSize = 128;
        outputAnalyser.smoothingTimeConstant = 0.72;
        outputAnalyser.connect(playCtx.destination);
      }
      if (playCtx.state === 'suspended') {
        playCtx.resume().catch(() => {});
      }
      return playCtx;
    }

    function flushPlaybackQueue() {
      activeSources.forEach((src) => {
        try { src.stop(); } catch {}
      });
      activeSources.clear();
      nextPlayTime = 0;
      if (liveActive) {
        setLiveVisualState(
          liveMuted ? 'muted' : 'listening',
          liveMuted ? 'Microfone silenciado' : 'Pode falar — ouvindo em tempo real'
        );
      }
    }

    function enqueueLivePcmAudio(base64Data, sampleRate = 24000) {
      const ctx = ensurePlaybackContext();
      const rawBytes = base64ToUint8(base64Data);
      const sampleCount = Math.floor(rawBytes.byteLength / 2);
      if (sampleCount <= 0) return;

      const int16 = new Int16Array(rawBytes.buffer, rawBytes.byteOffset, sampleCount);
      const float32 = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuffer = ctx.createBuffer(1, sampleCount, sampleRate);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAnalyser);

      const now = ctx.currentTime;
      if (nextPlayTime < now + 0.015) {
        nextPlayTime = now + 0.02;
      }

      activeSources.add(source);
      if (liveState !== 'speaking') {
        setLiveVisualState('speaking', 'Guia falando — fale para interromper');
      }

      source.onended = () => {
        activeSources.delete(source);
        if (activeSources.size === 0 && liveActive) {
          setLiveVisualState(
            liveMuted ? 'muted' : 'listening',
            liveMuted ? 'Microfone silenciado' : 'Pode falar — ouvindo em tempo real'
          );
        }
      };

      source.start(nextPlayTime);
      nextPlayTime += audioBuffer.duration;
    }

    // =========================================================================
    // Captura de Microfone Full-Duplex → PCM 16kHz Int16 (40ms)
    // =========================================================================
    async function startMicrophoneCapture(onPcmChunk) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem acesso ao microfone (HTTPS ou localhost necessário).');
      }

      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      micCtx = new AudioCtx();
      if (micCtx.state === 'suspended') await micCtx.resume();

      const source = micCtx.createMediaStreamSource(micStream);
      micAnalyser = micCtx.createAnalyser();
      micAnalyser.fftSize = 128;
      micAnalyser.smoothingTimeConstant = 0.72;
      source.connect(micAnalyser);

      const silentSink = micCtx.createGain();
      silentSink.gain.value = 0;
      silentSink.connect(micCtx.destination);

      let workletOk = false;
      if (micCtx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        try {
          const blob = new Blob([MIC_WORKLET_CODE], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          await micCtx.audioWorklet.addModule(blobUrl);
          URL.revokeObjectURL(blobUrl);

          const workletNode = new AudioWorkletNode(micCtx, 'pcm-16k-live-processor');
          workletNode.port.onmessage = (ev) => {
            if (!liveActive || liveMuted) return;
            onPcmChunk(new Uint8Array(ev.data));
          };
          source.connect(workletNode);
          workletNode.connect(silentSink);
          micNode = workletNode;
          workletOk = true;
        } catch {
          workletOk = false;
        }
      }

      if (!workletOk) {
        const processor = micCtx.createScriptProcessor(2048, 1, 1);
        const ratio = micCtx.sampleRate / 16000;
        let frac = 0;
        processor.onaudioprocess = (ev) => {
          if (!liveActive || liveMuted) return;
          const input = ev.inputBuffer.getChannelData(0);
          const outLen = Math.floor((input.length - frac) / ratio);
          if (outLen <= 0) return;
          const out = new Int16Array(outLen);
          let idx = frac;
          for (let i = 0; i < outLen; i++) {
            const i0 = Math.floor(idx);
            const s = Math.max(-1, Math.min(1, input[i0] || 0));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            idx += ratio;
          }
          frac = idx - input.length;
          onPcmChunk(new Uint8Array(out.buffer));
        };
        source.connect(processor);
        processor.connect(silentSink);
        micNode = processor;
      }
    }

    function stopMicrophoneCapture() {
      if (micNode) {
        try { micNode.disconnect(); } catch {}
        micNode = null;
      }
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }
      if (micCtx) {
        try { micCtx.close(); } catch {}
        micCtx = null;
      }
      micAnalyser = null;
    }

    function stopLiveSession(captionHtml = null, isError = false) {
      liveActive = false;
      liveConnecting = false;
      liveMuted = false;
      pendingPromptOnConnect = null;

      if (liveWs) {
        try { liveWs.close(); } catch {}
        liveWs = null;
      }
      stopMicrophoneCapture();
      flushPlaybackQueue();
      finalizeDrafts();

      muteBtnEl.classList.remove('is-muted');
      muteIconEl.setAttribute('name', 'microphone');

      setLiveVisualState(
        isError ? 'error' : 'idle',
        isError ? 'Conexão Gemini Live indisponível' : 'Toque abaixo para conversar ao vivo',
        captionHtml || 'Conversa natural em tempo real direto no <strong>Google Gemini Live</strong> — fale normalmente e interrompa quando quiser.'
      );
    }

    // =========================================================================
    // Emissão de Token Efêmero via Vercel Function (/api/live-token)
    // =========================================================================
    async function requestEphemeralLiveToken(voice) {
      const endpoints = getTokenEndpoints();
      let lastError = 'Endpoint /api/live-token indisponível.';

      for (const url of endpoints) {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 9000);
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voice }),
            signal: controller.signal
          });
          clearTimeout(t);

          const data = await res.json().catch(() => ({}));
          if (res.ok && data && data.wsUrl) {
            return data;
          }
          if (res.status === 503) {
            throw new Error(
              'Configure a variável <code>GEMINI_API_KEY</code> em <strong>Vercel → Settings → Environment Variables</strong> e faça um novo deploy.'
            );
          }
          lastError = data.error || `Erro HTTP ${res.status} em ${url}`;
        } catch (err) {
          clearTimeout(t);
          if (err.message && err.message.includes('GEMINI_API_KEY')) throw err;
          lastError = err.message || lastError;
        }
      }

      throw new Error(
        isLocalHostEnv()
          ? 'Para testar o Gemini Live localmente, execute <code>vercel dev</code> na raiz do projeto (ou publique direto na Vercel com <code>GEMINI_API_KEY</code> configurada).'
          : lastError
      );
    }

    // =========================================================================
    // Conexão Direta Browser → Google Gemini Live Edge (Token Efêmero)
    // =========================================================================
    async function startLiveSession({ initialPrompt = null } = {}) {
      if (state.locked) {
        showSecurityLockOverlay();
        return;
      }

      if (liveActive) {
        if (initialPrompt && liveWs && liveWs.readyState === WebSocket.OPEN) {
          sendTextIntoLive(initialPrompt);
        }
        return;
      }
      if (liveConnecting) {
        if (initialPrompt) pendingPromptOnConnect = initialPrompt;
        return;
      }

      pendingPromptOnConnect = initialPrompt;
      ensurePlaybackContext();
      liveConnecting = true;
      liveMuted = false;
      lastShortcutHref = '';
      shortcutEl.classList.remove('is-visible');
      setLiveVisualState(
        'connecting',
        'Conectando ao Google Gemini Live...',
        `Autenticando sessão segura (voz <strong>${escapeHtml(selectedVoice)}</strong>)...`
      );

      // 1. Solicita microfone + token efêmero na Vercel em paralelo
      let tokenInfo;
      try {
        const [, fetchedToken] = await Promise.all([
          startMicrophoneCapture((pcmBytes) => {
            if (liveWs && liveWs.readyState === WebSocket.OPEN && liveActive && !liveMuted) {
              liveWs.send(
                JSON.stringify({
                  realtimeInput: {
                    audio: {
                      mimeType: 'audio/pcm;rate=16000',
                      data: uint8ToBase64(pcmBytes)
                    }
                  }
                })
              );
            }
          }),
          requestEphemeralLiveToken(selectedVoice)
        ]);
        tokenInfo = fetchedToken;
      } catch (err) {
        liveConnecting = false;
        stopLiveSession(err.message || 'Não foi possível iniciar o Google Gemini Live.', true);
        return;
      }

      // 2. Conecta DIRETAMENTE ao WebSocket do Google Gemini Live (BidiGenerateContentConstrained)
      let setupDone = false;
      const wsTimeout = setTimeout(() => {
        if (!setupDone && liveConnecting) {
          stopLiveSession('Tempo limite ao conectar com o Google Gemini Live. Tente novamente.', true);
        }
      }, 10000);

      try {
        liveWs = new WebSocket(tokenInfo.wsUrl);
      } catch {
        clearTimeout(wsTimeout);
        stopLiveSession('Não foi possível abrir a conexão WebSocket com o Google Gemini Live.', true);
        return;
      }

      liveWs.onopen = () => {
        // As configurações completas (systemInstruction, voz, VAD) já estão travadas no token efêmero
        liveWs.send(
          JSON.stringify({
            setup: {
              model: `models/${tokenInfo.model || 'gemini-3.1-flash-live-preview'}`
            }
          })
        );
      };

      liveWs.onmessage = async (ev) => {
        let msg;
        try {
          const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text();
          msg = JSON.parse(raw);
        } catch {
          return;
        }

        if (msg.setupComplete) {
          clearTimeout(wsTimeout);
          setupDone = true;
          liveConnecting = false;
          liveActive = true;
          engineTagEl.textContent = `${tokenInfo.model || 'gemini-live'} • ${tokenInfo.voice || selectedVoice}`;
          setLiveVisualState(
            'listening',
            'Ao vivo — pode falar naturalmente',
            'Conectado direto ao <strong>Google Gemini Live</strong>! Fale normalmente — pode interromper quando quiser.'
          );

          if (pendingPromptOnConnect) {
            const firstMsg = pendingPromptOnConnect;
            pendingPromptOnConnect = null;
            sendTextIntoLive(firstMsg);
          } else {
            const pageTitle = (document.title || 'Portal Curso DEV SENAI').slice(0, 80);
            liveWs.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: 'user',
                      parts: [
                        {
                          text: `O aluno acabou de abrir a conversa ao vivo na página "${pageTitle}". Dê um oi bem caloroso, natural e curto em 1 frase convidando-o a conversar sobre o projeto Curso DEV SENAI.`
                        }
                      ]
                    }
                  ],
                  turnComplete: true
                }
              })
            );
          }
          return;
        }

        // Eventos VAD nativos do Google Gemini Live
        if (msg.voiceActivity && msg.voiceActivity.type) {
          if (msg.voiceActivity.type === 'ACTIVITY_START' && !liveMuted) {
            setLiveVisualState('user-speaking', 'Ouvindo você...');
          } else if (msg.voiceActivity.type === 'ACTIVITY_END' && activeSources.size === 0 && !liveMuted) {
            setLiveVisualState('thinking', 'Pensando...');
          }
        }

        const sc = msg.serverContent;
        if (!sc) return;

        // Interrupção natural (barge-in)
        if (sc.interrupted) {
          flushPlaybackQueue();
          finalizeDrafts();
          setLiveVisualState('user-speaking', 'Ouvindo você...', '<em>Você interrompeu — pode falar!</em>');
          return;
        }

        // Transcrição ao vivo da fala do aluno
        if (sc.inputTranscription && sc.inputTranscription.text) {
          if (assistantDraftBubble) {
            assistantDraftBubble.classList.remove('guide-msg--live-draft');
            assistantDraftBubble = null;
            assistantDraftText = '';
          }
          userDraftText += sc.inputTranscription.text;
          const clean = userDraftText.trim();
          if (clean) {
            captionEl.innerHTML = `<strong>Você:</strong> ${escapeHtml(clean)}`;
            if (!userDraftBubble) {
              userDraftBubble = appendTranscriptMessage('user', escapeHtml(clean), { isDraft: true });
            } else {
              userDraftBubble.textContent = clean;
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }

            const violation = checkStrictGuardrail(clean);
            if (violation) {
              registerViolation(violation.reason);
              if (state.locked) return;
            }
          }
        }

        // Transcrição ao vivo da fala da Guia
        if (sc.outputTranscription && sc.outputTranscription.text) {
          if (userDraftBubble) {
            userDraftBubble.classList.remove('guide-msg--live-draft');
            userDraftBubble = null;
            userDraftText = '';
          }
          assistantDraftText += sc.outputTranscription.text;
          const clean = assistantDraftText.trim();
          if (clean) {
            captionEl.innerHTML = `<strong>Guia:</strong> ${escapeHtml(clean)}`;
            if (!assistantDraftBubble) {
              assistantDraftBubble = appendTranscriptMessage('assistant', escapeHtml(clean), { isDraft: true });
            } else {
              assistantDraftBubble.textContent = clean;
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }

            if (isAssistantScopeRefusal(clean)) {
              registerViolation('Assunto fora do escopo exclusivo do projeto Curso DEV SENAI.');
              if (state.locked) return;
            }
          }
        }

        // Áudio PCM 24kHz nativo do Google Gemini Live
        if (sc.modelTurn && Array.isArray(sc.modelTurn.parts)) {
          for (const part of sc.modelTurn.parts) {
            if (part.inlineData && part.inlineData.data) {
              const mime = part.inlineData.mimeType || 'audio/pcm;rate=24000';
              const rateMatch = /rate=(\d+)/.exec(mime);
              enqueueLivePcmAudio(part.inlineData.data, rateMatch ? Number(rateMatch[1]) : 24000);
            }
          }
        }

        if (sc.turnComplete) {
          const link = detectProjectShortcut(`${userDraftText} ${assistantDraftText}`);
          if (link) showLiveShortcut(link);
          finalizeDrafts();
          if (activeSources.size === 0 && liveActive) {
            setLiveVisualState(
              liveMuted ? 'muted' : 'listening',
              liveMuted ? 'Microfone silenciado' : 'Pode falar — ouvindo em tempo real'
            );
          }
        }
      };

      liveWs.onerror = () => {
        clearTimeout(wsTimeout);
        if (!setupDone) {
          stopLiveSession('Não foi possível conectar ao Google Gemini Live. Verifique sua conexão e tente novamente.', true);
        }
      };

      liveWs.onclose = () => {
        clearTimeout(wsTimeout);
        if (!setupDone && liveConnecting) {
          stopLiveSession('Conexão encerrada antes da inicialização do Gemini Live. Tente novamente.', true);
        } else if (liveActive) {
          stopLiveSession('Conversa ao vivo encerrada. Clique em <strong>Conversar ao Vivo</strong> para continuar quando quiser.');
        }
      };
    }

    function sendTextIntoLive(rawText) {
      const trimmed = String(rawText || '').trim();
      if (!trimmed) return;
      if (state.locked) {
        showSecurityLockOverlay();
        return;
      }

      const violation = checkStrictGuardrail(trimmed);
      if (violation) {
        appendTranscriptMessage('user', escapeHtml(trimmed));
        registerViolation(violation.reason);
        if (state.locked) return;
        if (liveActive && liveWs && liveWs.readyState === WebSocket.OPEN) {
          flushPlaybackQueue();
          liveWs.send(
            JSON.stringify({
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: `[AVISO: O aluno enviou tema fora do projeto (${violation.reason}). Aviso 1 de 2 registrado. Lembre-o em uma frase natural e simpática que você só conversa sobre o Curso DEV SENAI e que insistir bloqueia a sessão.]`
                      }
                    ]
                  }
                ],
                turnComplete: true
              }
            })
          );
        }
        return;
      }

      if (!liveActive || !liveWs || liveWs.readyState !== WebSocket.OPEN) {
        startLiveSession({ initialPrompt: trimmed });
        return;
      }

      appendTranscriptMessage('user', escapeHtml(trimmed));
      captionEl.innerHTML = `<strong>Você:</strong> ${escapeHtml(trimmed)}`;
      flushPlaybackQueue();
      setLiveVisualState('thinking', 'Pensando...');
      liveWs.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: trimmed }] }],
            turnComplete: true
          }
        })
      );
    }

    // =========================================================================
    // Bloqueio Anti-Burla em 2 Estágios (Guardrail Rigoroso)
    // =========================================================================
    let lockTimerInterval = null;

    function showSecurityLockOverlay() {
      stopLiveSession('Sessão bloqueada por tentativa fora do escopo do projeto.', true);
      closeDrawer();
      document.body.style.overflow = 'hidden';

      let overlay = document.getElementById('devsenaiLockOverlay');
      if (overlay) overlay.remove();

      overlay = document.createElement('div');
      overlay.id = 'devsenaiLockOverlay';
      overlay.className = 'guide-lock-overlay';
      overlay.setAttribute('role', 'alertdialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'guideLockTitle');
      overlay.innerHTML = `
        <div class="guide-lock-card">
          <div class="guide-lock-icon">
            <isax-anim name="lock" size="26" trigger="ambient"></isax-anim>
          </div>
          <h2 id="guideLockTitle" class="ds-display" style="font-size:1.3rem;font-weight:700;color:var(--ds-ink);">
            Avanço bloqueado por tentativa fora de escopo
          </h2>
          <p style="margin-top:0.55rem;font-size:0.86rem;line-height:1.6;color:var(--ds-ink-secondary);">
            A <strong>Guia do Curso</strong> é exclusiva para conversas sobre o projeto <strong>DEV SENAI</strong>.
            Após o primeiro aviso, uma nova tentativa de burla ou tema externo foi registrada e o acesso desta sessão foi interrompido.
          </p>
          <div class="guide-lock-log">
            <div><strong>Status:</strong> BLOQUEADO (2/2 violações)</div>
            <div style="margin-top:0.25rem;"><strong>Motivo:</strong> ${escapeHtml(state.lockReason || 'Tentativa de desvio do escopo do projeto.')}</div>
          </div>
          <label class="guide-lock-consent">
            <input id="guideLockCheck" type="checkbox" style="margin-top:0.2rem;accent-color:var(--ds-accent);" />
            <span>Comprometo-me a utilizar a Guia do Curso exclusivamente para dúvidas, códigos e materiais deste projeto.</span>
          </label>
          <div style="margin-top:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;">
            <span id="guideLockCountdown" class="ds-mono" style="font-size:0.76rem;color:var(--ds-ink-muted);"></span>
            <button id="guideLockReleaseBtn" type="button" class="ux-btn ux-btn-primary" style="padding:0.65rem 1.15rem;border-radius:0.85rem;font-size:0.82rem;" disabled>
              <isax-anim name="shield-tick" size="16"></isax-anim>
              <span>Reiniciar sessão legítima</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const checkEl = document.getElementById('guideLockCheck');
      const countdownEl = document.getElementById('guideLockCountdown');
      const releaseBtn = document.getElementById('guideLockReleaseBtn');

      function refreshLockControls() {
        const remaining = Math.max(0, Math.ceil((state.lockUntil - Date.now()) / 1000));
        if (remaining > 0) {
          countdownEl.textContent = `Aguarde ${remaining}s para reabilitar...`;
          releaseBtn.disabled = true;
        } else {
          countdownEl.textContent = 'Resfriamento concluído.';
          releaseBtn.disabled = !checkEl.checked;
        }
      }

      checkEl.addEventListener('change', refreshLockControls);
      refreshLockControls();
      clearInterval(lockTimerInterval);
      lockTimerInterval = setInterval(refreshLockControls, 500);

      releaseBtn.addEventListener('click', () => {
        if (Date.now() < state.lockUntil || !checkEl.checked) return;
        clearInterval(lockTimerInterval);
        state.sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        state.violations = 0;
        state.locked = false;
        state.lockReason = '';
        state.lockUntil = 0;
        saveSessionState(state);
        overlay.remove();
        document.body.style.overflow = '';
        callBtnEl.disabled = false;
        inputEl.disabled = false;
        sendBtnEl.disabled = false;
        updateScopeIndicator();
        setLiveVisualState(
          'idle',
          'Sessão reiniciada — pronta para conversar ao vivo',
          'Sessão liberada! Clique em <strong>Conversar ao Vivo</strong> para falar sobre o projeto <strong>Curso DEV SENAI</strong>.'
        );
        openDrawer();
      });
    }

    function registerViolation(reason) {
      const now = Date.now();
      if (now - lastGuardrailTs < 2400) return;
      lastGuardrailTs = now;

      state.violations += 1;
      if (state.violations >= 2) {
        state.locked = true;
        state.lockReason = reason || 'Reincidência fora do escopo do projeto.';
        state.lockUntil = Date.now() + COOLDOWN_SECONDS * 1000;
        saveSessionState(state);
        callBtnEl.disabled = true;
        inputEl.disabled = true;
        sendBtnEl.disabled = true;
        updateScopeIndicator();
        appendTranscriptMessage('blocked', `<strong>Sessão bloqueada (2/2):</strong> ${escapeHtml(state.lockReason)}`);
        stopLiveSession('Sessão bloqueada (2/2) por política de escopo fechado.', true);
        setTimeout(showSecurityLockOverlay, 400);
      } else {
        saveSessionState(state);
        updateScopeIndicator();
        appendTranscriptMessage(
          'warn',
          `<strong>Aviso de escopo (1/2):</strong> ${escapeHtml(reason || 'Assunto fora do projeto.')}<br>Uma nova tentativa fora do escopo <strong>bloqueará o avanço</strong>.`
        );
      }
    }

    async function checkLiveStatus() {
      const endpoints = getTokenEndpoints();
      for (const url of endpoints) {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 2500);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(t);
          if (res.ok) {
            const data = await res.json();
            engineTagEl.textContent = data.liveReady
              ? `Gemini Live • ${selectedVoice}`
              : 'Configure GEMINI_API_KEY';
            return;
          }
        } catch {
          clearTimeout(t);
        }
      }
      engineTagEl.textContent = isLocalHostEnv() ? 'Use vercel dev / Vercel' : 'Gemini Live';
    }

    function openDrawer() {
      if (state.locked) return;
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      launcher.classList.add('is-hidden');
      try { sessionStorage.removeItem(SESSION_DISMISSED_KEY); } catch {}
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      launcher.classList.remove('is-hidden');
      try { sessionStorage.setItem(SESSION_DISMISSED_KEY, '1'); } catch {}
    }

    updateScopeIndicator();
    checkLiveStatus();

    // =========================================================================
    // Eventos da Interface
    // =========================================================================
    launcher.addEventListener('click', openDrawer);
    closeBtnEl.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    callBtnEl.addEventListener('click', () => {
      if (liveActive || liveConnecting) {
        stopLiveSession();
      } else {
        startLiveSession();
      }
    });

    orbBtnEl.addEventListener('click', () => {
      if (state.locked) {
        showSecurityLockOverlay();
        return;
      }
      if (!liveActive && !liveConnecting) {
        startLiveSession();
      } else if (activeSources.size > 0) {
        flushPlaybackQueue();
      }
    });

    muteBtnEl.addEventListener('click', () => {
      if (!liveActive) return;
      liveMuted = !liveMuted;
      muteBtnEl.classList.toggle('is-muted', liveMuted);
      muteIconEl.setAttribute('name', liveMuted ? 'volume-slash' : 'microphone');
      if (liveMuted && liveWs && liveWs.readyState === WebSocket.OPEN) {
        liveWs.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      }
      setLiveVisualState(
        liveMuted ? 'muted' : activeSources.size > 0 ? 'speaking' : 'listening',
        liveMuted ? 'Microfone silenciado (Live ativo)' : 'Pode falar — ouvindo em tempo real'
      );
    });

    transcriptToggleBtnEl.addEventListener('click', () => {
      const open = drawer.classList.toggle('has-transcript-open');
      transcriptToggleBtnEl.classList.toggle('is-active', open);
      if (open) messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    voiceSelectEl.addEventListener('change', () => {
      selectedVoice = voiceSelectEl.value;
      try { localStorage.setItem(VOICE_PREF_KEY, selectedVoice); } catch {}
      checkLiveStatus();
      if (liveActive) {
        stopLiveSession(`Trocando para a voz <strong>${escapeHtml(selectedVoice)}</strong>...`);
        setTimeout(() => startLiveSession(), 250);
      }
    });

    drawer.querySelectorAll('[data-live-prompt]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-live-prompt') || '';
        startLiveSession({ initialPrompt: prompt });
      });
    });

    formEl.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      sendTextIntoLive(text);
    });

    document.querySelectorAll('[data-open-guide]').forEach((btn) => {
      btn.addEventListener('click', openDrawer);
    });

    document.querySelectorAll('[data-open-voice-guide]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openDrawer();
        if (!liveActive && !liveConnecting) {
          startLiveSession();
        }
      });
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && drawer.classList.contains('is-open') && !state.locked) {
        closeDrawer();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (liveWs) try { liveWs.close(); } catch {}
      stopMicrophoneCapture();
    });

    if (state.locked) {
      callBtnEl.disabled = true;
      inputEl.disabled = true;
      sendBtnEl.disabled = true;
      showSecurityLockOverlay();
      return;
    }

    const wasDismissed = (() => {
      try { return sessionStorage.getItem(SESSION_DISMISSED_KEY) === '1'; } catch { return false; }
    })();

    if (autoOpen && !wasDismissed) {
      setTimeout(() => {
        if (!state.locked) openDrawer();
      }, 550);
    }

    window.DevSenaiGuide = {
      open: openDrawer,
      close: closeDrawer,
      startLive: () => { openDrawer(); startLiveSession(); },
      stopLive: stopLiveSession,
      startVoice: () => { openDrawer(); startLiveSession(); }
    };
  }

  document.addEventListener('DOMContentLoaded', initAssistant);
})();

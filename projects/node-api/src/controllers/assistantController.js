const assistantService = require('../services/assistantService');

function status(req, res) {
  return res.json(assistantService.getStatus());
}

async function ask(req, res) {
  try {
    const { message, sessionId, violations } = req.body || {};
    const result = await assistantService.askAssistant({ message, sessionId, violations });

    if (result.blocked) {
      return res.status(403).json(result);
    }

    return res.json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro no assistente do projeto:', error);
    return res.status(500).json({ error: 'Erro ao processar mensagem no Guia do Curso' });
  }
}

async function tts(req, res) {
  try {
    const { text, voice } = req.body || {};
    const audio = await assistantService.synthesizeSpeech({ text, voice });
    return res.json(audio);
  } catch (error) {
    const code = error.statusCode || 500;
    console.error('Erro na síntese de voz Gemini:', error.message);
    return res.status(code).json({ error: error.message });
  }
}

async function transcribe(req, res) {
  try {
    const { audioBase64, mimeType } = req.body || {};
    const result = await assistantService.transcribeAudio({ audioBase64, mimeType });
    return res.json(result);
  } catch (error) {
    const code = error.statusCode || 500;
    console.error('Erro na transcrição de áudio Gemini:', error.message);
    return res.status(code).json({ error: error.message });
  }
}

async function liveTokenStatus(req, res) {
  const st = assistantService.getStatus();
  return res.json({
    liveReady: st.liveReady,
    mode: 'local-ephemeral-token',
    model: st.liveModel,
    voice: st.voice
  });
}

async function liveTokenCreate(req, res) {
  try {
    const { voice } = req.body || {};
    const result = await assistantService.createLiveEphemeralToken({ voice });
    return res.json(result);
  } catch (error) {
    const code = error.statusCode || 500;
    console.error('Erro ao emitir token Gemini Live:', error.message);
    return res.status(code).json({ error: error.message });
  }
}

function reset(req, res) {
  const { sessionId } = req.body || {};
  assistantService.resetSession(sessionId);
  return res.json({ ok: true });
}

module.exports = {
  status,
  ask,
  tts,
  transcribe,
  liveTokenStatus,
  liveTokenCreate,
  reset
};

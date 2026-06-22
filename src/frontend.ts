// Serves the single-page frontend for ShortLink + TypeScript quiz.
// Inlined HTML/CSS/JS — no build step, Workers-compatible.

export function renderFrontend(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Interview — ShortLink + TS Quiz</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --surface2: #22263a;
      --border: #2e3248;
      --accent: #6c63ff;
      --accent-dim: #4b44cc;
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #f59e0b;
      --text: #e2e8f0;
      --muted: #64748b;
      --radius: 12px;
      --font: 'Inter', system-ui, sans-serif;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    .container { max-width: 680px; margin: 0 auto; }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    header h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6c63ff, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.4rem;
    }
    header p { color: var(--muted); font-size: 0.95rem; }

    nav {
      display: flex;
      gap: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.35rem;
      margin-bottom: 1.5rem;
    }
    nav button {
      flex: 1;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    nav button.active {
      background: var(--accent);
      color: #fff;
    }
    nav button:hover:not(.active) { background: var(--surface2); color: var(--text); }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.75rem;
      margin-bottom: 1rem;
    }

    .card h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1.25rem; }

    .field { margin-bottom: 1rem; }
    .field label { display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.4rem; }

    input[type="url"], input[type="text"] {
      width: 100%;
      padding: 0.7rem 1rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus { border-color: var(--accent); }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.7rem 1.4rem;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-dim); }
    .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: var(--border); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }

    .result {
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: none;
    }
    .result.show { display: block; }
    .result .label { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.3rem; }
    .result .value { font-family: var(--mono); font-size: 0.9rem; color: var(--text); word-break: break-all; }
    .result .short-url { color: var(--accent); font-size: 1rem; font-weight: 600; }
    .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem; }
    .result-grid .stat { text-align: center; }
    .result-grid .stat .num { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
    .result-grid .stat .lbl { font-size: 0.78rem; color: var(--muted); }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-easy { background: rgba(34,197,94,0.15); color: var(--green); }
    .badge-medium { background: rgba(245,158,11,0.15); color: var(--yellow); }
    .badge-hard { background: rgba(239,68,68,0.15); color: var(--red); }

    .question-text {
      font-size: 1.05rem;
      line-height: 1.65;
      margin: 1rem 0;
    }

    .file-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-family: var(--mono);
      font-size: 0.78rem;
      color: var(--muted);
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.2rem 0.6rem;
      margin-bottom: 1rem;
    }

    .hint-box {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(108,99,255,0.08);
      border: 1px solid rgba(108,99,255,0.25);
      border-radius: 8px;
      font-size: 0.9rem;
      color: #a78bfa;
      display: none;
    }
    .hint-box.show { display: block; }

    .answer-box {
      margin-top: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(34,197,94,0.06);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 8px;
      font-size: 0.95rem;
      line-height: 1.65;
      color: var(--text);
      display: none;
    }
    .answer-box.show { display: block; }
    .answer-box .answer-label {
      font-size: 0.78rem;
      color: var(--green);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .error-msg { color: var(--red); font-size: 0.88rem; margin-top: 0.5rem; }

    .copy-btn {
      font-size: 0.78rem;
      padding: 0.3rem 0.7rem;
      margin-top: 0.5rem;
    }

    .progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }
    .progress-bar {
      flex: 1;
      height: 4px;
      background: var(--surface2);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 99px;
      transition: width 0.3s;
    }

    .tab { display: none; }
    .tab.active { display: block; }

    @media (max-width: 480px) {
      header h1 { font-size: 1.5rem; }
      .result-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="container">
  <header>
    <h1>AI Interview</h1>
    <p>URL shortener · TypeScript quiz · Built on Cloudflare Workers + D1</p>
  </header>

  <nav>
    <button class="active" onclick="showTab('shortlink')">🔗 ShortLink</button>
    <button onclick="showTab('quiz')">🧠 TS Quiz</button>
  </nav>

  <!-- SHORTLINK TAB -->
  <div id="tab-shortlink" class="tab active">
    <div class="card">
      <h2>Shorten a URL</h2>
      <div class="field">
        <label>URL</label>
        <input type="url" id="url-input" placeholder="https://example.com" />
      </div>
      <button class="btn btn-primary" onclick="shorten()">Shorten →</button>
      <div id="shorten-error" class="error-msg"></div>
      <div id="shorten-result" class="result">
        <div class="label">Short URL</div>
        <div class="value short-url" id="short-url"></div>
        <button class="btn btn-secondary copy-btn" onclick="copy()">Copy</button>
        <div style="margin-top:1rem">
          <div class="label">Original</div>
          <div class="value" id="target-url"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Check Stats</h2>
      <div class="field">
        <label>Slug</label>
        <input type="text" id="stats-slug" placeholder="AW4jQFy" />
      </div>
      <button class="btn btn-primary" onclick="checkStats()">Get Stats →</button>
      <div id="stats-error" class="error-msg"></div>
      <div id="stats-result" class="result">
        <div class="label">Stats</div>
        <div class="result-grid">
          <div class="stat">
            <div class="num" id="stats-clicks">0</div>
            <div class="lbl">clicks</div>
          </div>
          <div class="stat">
            <div class="num" style="font-size:1rem;padding-top:0.4rem" id="stats-target"></div>
            <div class="lbl">target</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- QUIZ TAB -->
  <div id="tab-quiz" class="tab">
    <div class="card">
      <nav style="margin-bottom:1.25rem">
        <button class="active" onclick="selectTopic('typescript',this)">TypeScript</button>
        <button onclick="selectTopic('react',this)">React</button>
        <button onclick="selectTopic('python',this)">Python</button>
        <button onclick="selectTopic('ai',this)">AI</button>
      </nav>

      <div class="progress">
        <span id="q-counter">Question — of 11</span>
        <div class="progress-bar"><div class="progress-fill" id="q-progress" style="width:0%"></div></div>
      </div>

      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
        <span class="badge" id="q-badge">easy</span>
        <span class="file-tag" id="q-file"></span>
      </div>

      <p class="question-text" id="q-text">Loading…</p>

      <div class="hint-box" id="q-hint"></div>

      <div class="answer-box" id="q-answer">
        <div class="answer-label">Answer</div>
        <div id="q-answer-text"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="toggleHint()">💡 Hint</button>
        <button class="btn btn-secondary" onclick="toggleAnswer()">👁 Reveal</button>
        <button class="btn btn-primary" onclick="nextQuestion()">Next →</button>
      </div>
    </div>
  </div>
</div>

<script>
  const BASE = '${baseUrl}';
  let currentQ = null;
  let hintVisible = false;
  let answerVisible = false;
  let usedIds = [];

  function showTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    event.target.classList.add('active');
    if (name === 'quiz' && !currentQ) loadQuestion();
  }

  // --- SHORTLINK ---
  async function shorten() {
    const url = document.getElementById('url-input').value.trim();
    const err = document.getElementById('shorten-error');
    const res = document.getElementById('shorten-result');
    err.textContent = '';
    res.classList.remove('show');
    if (!url) { err.textContent = 'Enter a URL.'; return; }
    try {
      const r = await fetch(BASE + '/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await r.json();
      if (!r.ok) { err.textContent = data.error === 'invalid_url' ? 'Invalid URL.' : data.error; return; }
      document.getElementById('short-url').textContent = data.shortUrl;
      document.getElementById('target-url').textContent = data.targetUrl;
      document.getElementById('stats-slug').value = data.slug;
      res.classList.add('show');
    } catch { err.textContent = 'Request failed.'; }
  }

  function copy() {
    const val = document.getElementById('short-url').textContent;
    navigator.clipboard.writeText(val).then(() => {
      const btn = event.target;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    });
  }

  async function checkStats() {
    const slug = document.getElementById('stats-slug').value.trim();
    const err = document.getElementById('stats-error');
    const res = document.getElementById('stats-result');
    err.textContent = '';
    res.classList.remove('show');
    if (!slug) { err.textContent = 'Enter a slug.'; return; }
    try {
      const r = await fetch(BASE + '/api/links/' + slug + '/stats');
      const data = await r.json();
      if (!r.ok) { err.textContent = 'Slug not found.'; return; }
      document.getElementById('stats-clicks').textContent = data.clicks;
      document.getElementById('stats-target').textContent = new URL(data.targetUrl).hostname;
      res.classList.add('show');
    } catch { err.textContent = 'Request failed.'; }
  }

  // --- QUIZ ---
  let currentTopic = 'typescript';

  function selectTopic(topic, btn) {
    currentTopic = topic;
    usedIds = [];
    btn.closest('nav').querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadQuestion();
  }

  async function loadQuestion() {
    hintVisible = false; answerVisible = false;
    document.getElementById('q-hint').classList.remove('show');
    document.getElementById('q-answer').classList.remove('show');

    try {
      const r = await fetch(BASE + '/api/quiz/' + currentTopic);
      currentQ = await r.json();
      renderQuestion();
    } catch { document.getElementById('q-text').textContent = 'Failed to load question.'; }
  }

  function renderQuestion() {
    if (!currentQ) return;
    if (!usedIds.includes(currentQ.id)) usedIds.push(currentQ.id);
    const pct = Math.round((usedIds.length / 11) * 100);
    document.getElementById('q-counter').textContent = 'Question ' + usedIds.length + ' of 11';
    document.getElementById('q-progress').style.width = pct + '%';
    document.getElementById('q-text').textContent = currentQ.question;
    const fileEl = document.getElementById('q-file');
    fileEl.textContent = currentQ.file ?? currentQ.topic ?? '';
    const badge = document.getElementById('q-badge');
    badge.textContent = currentQ.difficulty;
    badge.className = 'badge badge-' + currentQ.difficulty;
    document.getElementById('q-hint').textContent = currentQ.hint;
  }

  function toggleHint() {
    hintVisible = !hintVisible;
    document.getElementById('q-hint').classList.toggle('show', hintVisible);
  }

  async function toggleAnswer() {
    if (answerVisible) { document.getElementById('q-answer').classList.remove('show'); answerVisible = false; return; }
    try {
      const r = await fetch(BASE + '/api/quiz/' + currentTopic + '/' + currentQ.id + '/answer');
      const data = await r.json();
      document.getElementById('q-answer-text').textContent = data.answer;
      document.getElementById('q-answer').classList.add('show');
      answerVisible = true;
    } catch {}
  }

  function nextQuestion() { loadQuestion(); }

  // enter to shorten
  document.getElementById('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') shorten(); });
  document.getElementById('stats-slug').addEventListener('keydown', e => { if (e.key === 'Enter') checkStats(); });
</script>
</body>
</html>`;
}

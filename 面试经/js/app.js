/* ===========================================
   app.js — 应用入口与共享工具
   =========================================== */

/* ---- Navigation ---- */
function initNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('active');
    else a.classList.remove('active');
  });
}

/* ---- Toast ---- */
function showToast(message, type) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type || ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

/* ---- Loading ---- */
function showLoading(text) {
  let el = document.getElementById('global-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loading';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    el.innerHTML = `<div style="background:var(--surface);padding:24px 32px;border-radius:12px;border:1px solid var(--border);text-align:center">
      <div style="width:24px;height:24px;border:3px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px"></div>
      <div style="font-size:14px;color:var(--fg-2)" id="loading-text">${text || '加载中…'}</div>
    </div>`;
    document.body.appendChild(el);
  }
  const lt = document.getElementById('loading-text');
  if (lt) lt.textContent = text || '加载中…';
}

function hideLoading() {
  const el = document.getElementById('global-loading');
  if (el) el.remove();
}

/* ---- Formatting ---- */
function formatDate(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function formatDateTime(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function truncateText(text, max) {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '…';
}

/* ---- Copy to clipboard ---- */
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板', 'success');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板', 'success');
  });
}

/* ---- UUID generator ---- */
function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/* ---- Init on DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
/* ===========================================
   设置面板 & 数据管理
   =========================================== */

/* ---- Settings Modal ---- */
function openSettings() {
  const existing = document.getElementById('settingsModal');
  if (existing) { existing.style.display = 'flex'; return; }

  const settings = STORAGE.get(KEYS.SETTINGS, {});
  const providers = ['deepseek', 'qwen', 'glm', 'moonshot'];
  const providerNames = { deepseek: 'DeepSeek', qwen: '通义千问', glm: '智谱 GLM', moonshot: '月之暗面' };
  const modelOptions = {
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    glm: ['glm-4', 'glm-4-plus', 'glm-4-flash'],
    moonshot: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  };

  const curProvider = settings.aiProvider || 'deepseek';
  const curModel = settings.aiModel || modelOptions[curProvider][0];
  const curKey = settings.apiKey || '';

  const modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';

  modal.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-8);width:480px;max-width:90vw;max-height:80vh;overflow-y:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
      <h2 style="font-size:var(--text-xl);font-weight:500">设置</h2>
      <button onclick="closeSettings()" style="background:none;border:none;color:var(--meta);font-size:20px;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-4)">
      <div class="settings-row">
        <label style="flex:0 0 100px;font-size:var(--text-sm);color:var(--fg-2)">AI 提供商</label>
        <select id="selProvider" style="flex:1;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);font-size:var(--text-sm)">
          ${providers.map(p => `<option value="${p}" ${p === curProvider ? 'selected' : ''}>${providerNames[p]}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <label style="flex:0 0 100px;font-size:var(--text-sm);color:var(--fg-2)">模型</label>
        <select id="selModel" style="flex:1;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);font-size:var(--text-sm)">
          ${modelOptions[curProvider].map(m => `<option value="${m}" ${m === curModel ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <label style="flex:0 0 100px;font-size:var(--text-sm);color:var(--fg-2)">API Key</label>
        <input id="iptApiKey" type="password" value="${curKey}" placeholder="sk-..." style="flex:1;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);font-size:var(--text-sm)">
      </div>
      <div class="settings-row">
        <label style="flex:0 0 100px"></label>
        <button onclick="testConnection(event)" class="test-btn">测试连接</button>
        <span id="testResult" style="font-size:var(--text-xs);color:var(--meta)"></span>
      </div>
      <div style="border-top:1px solid var(--border-soft);padding-top:var(--space-4);margin-top:var(--space-2)">
        <div style="font-size:var(--text-sm);font-weight:500;margin-bottom:var(--space-3);color:var(--fg-2)">数据管理</div>
        <div style="display:flex;gap:var(--space-3)">
          <button onclick="exportData()" class="test-btn" style="font-size:var(--text-xs)">📤 导出数据</button>
          <button onclick="document.getElementById('importInput').click()" class="test-btn" style="font-size:var(--text-xs)">📥 导入数据</button>
          <input id="importInput" type="file" accept=".json" style="display:none" onchange="importData(event)">
          <button onclick="clearAllData()" class="test-btn" style="font-size:var(--text-xs);color:var(--danger)">🗑️ 清除数据</button>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--border-soft)">
        <button onclick="closeSettings()" class="btn-secondary">取消</button>
        <button onclick="saveSettings()" class="btn-primary">保存</button>
      </div>
    </div>
  </div>`;

  document.body.appendChild(modal);

  // Provider change → update model options
  document.getElementById('selProvider').addEventListener('change', function() {
    const models = modelOptions[this.value] || ['default'];
    const sel = document.getElementById('selModel');
    sel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
  });

  // Click outside to close
  modal.addEventListener('click', function(e) {
    if (e.target === this) closeSettings();
  });
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.remove();
}
window.closeSettings = closeSettings;

function saveSettings() {
  const settings = {
    aiProvider: document.getElementById('selProvider').value,
    aiModel: document.getElementById('selModel').value,
    apiKey: document.getElementById('iptApiKey').value
  };
  STORAGE.set(KEYS.SETTINGS, settings);
  showToast('设置已保存', 'success');
  closeSettings();
}
window.saveSettings = saveSettings;

async function testConnection(event) {
  const btn = event.target;
  const resultEl = document.getElementById('testResult');
  btn.disabled = true;
  resultEl.textContent = '测试中…';
  
  const ai = new AIAdapter({
    provider: document.getElementById('selProvider').value,
    model: document.getElementById('selModel').value,
    apiKey: document.getElementById('iptApiKey').value
  });
  
  const result = await ai.testConnection();
  resultEl.textContent = result.ok ? '✅ 连接成功' : '❌ ' + result.message;
  resultEl.style.color = result.ok ? 'var(--accent)' : 'var(--danger)';
  btn.disabled = false;
}
window.testConnection = testConnection;

/* ---- Data Export/Import ---- */
function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: STORAGE.get(KEYS.SETTINGS, {}),
    resumes: STORAGE.get(KEYS.RESUMES, []),
    activeResume: STORAGE.get(KEYS.ACTIVE_RESUME),
    analyses: STORAGE.get(KEYS.ANALYSES, []),
    questionBanks: STORAGE.get(KEYS.QUESTION_BANKS, [])
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mianpu-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出', 'success');
}
window.exportData = exportData;

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) { showToast('无效的备份文件', 'error'); return; }
      
      if (data.settings) STORAGE.set(KEYS.SETTINGS, data.settings);
      if (data.resumes) STORAGE.set(KEYS.RESUMES, data.resumes);
      if (data.activeResume) STORAGE.set(KEYS.ACTIVE_RESUME, data.activeResume);
      if (data.analyses) STORAGE.set(KEYS.ANALYSES, data.analyses);
      if (data.questionBanks) STORAGE.set(KEYS.QUESTION_BANKS, data.questionBanks);

      showToast('数据导入成功！' + (data.resumes?.length || 0) + ' 份简历，' + (data.analyses?.length || 0) + ' 条分析', 'success');
      closeSettings();
      setTimeout(() => location.reload(), 1000);
    } catch {
      showToast('文件解析失败，请检查文件格式', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
window.importData = importData;

function clearAllData() {
  if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
  const keys = Object.values(KEYS);
  keys.forEach(k => localStorage.removeItem(k));
  showToast('所有数据已清除', 'warn');
  closeSettings();
  setTimeout(() => location.reload(), 1000);
}
window.clearAllData = clearAllData;


/* ---- Shared AI Utilities ---- */
async function callAI(prompt, timeout) {
  try {
    const ai = createAIFromSettings();
    const r = await ai.chat([
      { role: 'system', content: '你是一个专业的面试辅助AI助手。请严格按照要求的格式返回结果，不要添加额外说明。' },
      { role: 'user', content: prompt }
    ], { timeout: timeout || 60000 });
    return r;
  } catch (err) {
    showToast('AI 分析出错: ' + err.message, 'error');
    return null;
  }
}

function extractJSON(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : text;
}

function tryParseJSON(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    try { return JSON.parse(extractJSON(text)); }
    catch { return null; }
  }
}
/* ---- Override init to add settings link handler ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();

  // Settings link
  document.querySelectorAll('.header-nav a').forEach(a => {
    if (a.textContent.trim() === '设置' || a.getAttribute('href') === '#') {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        openSettings();
      });
    }
  });

  // Also handle "设置" in index/dashboard specifically if there's no settings link
  const hasSettingsLink = Array.from(document.querySelectorAll('.header-nav a'))
    .some(a => a.textContent.trim() === '设置');
  if (!hasSettingsLink) {
    const nav = document.querySelector('.header-nav');
    if (nav) {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = '设置';
      link.addEventListener('click', function(e) {
        e.preventDefault();
        openSettings();
      });
      nav.appendChild(link);
    }
  }
});


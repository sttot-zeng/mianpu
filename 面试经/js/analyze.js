/* ===========================================
   analyze.js — 岗位分析模块
   =========================================== */

// ====== analyze-new.html ======

const STEP_DELAY = 800; // ms between steps for visual effect

const EXAMPLE_JDS = {
  fe: `公司：XXX科技有限公司
岗位：高级前端工程师
薪资：35K-50K · 16薪
地点：北京

职位描述：
1. 负责公司核心业务的前端架构设计与开发
2. 主导前端工程化建设，优化构建流程和开发效率
3. 参与技术选型，推动新技术落地
4. 指导初中级工程师成长

任职要求：
1. 5 年以上前端开发经验
2. 精通 React 技术栈，熟悉 Next.js 等 SSR 框架
3. 熟悉 TypeScript，有大型项目类型系统设计经验
4. 有性能优化实战经验，了解 Chrome DevTools Performance 面板
5. 了解 Node.js，有后端开发经验者优先
6. 计算机相关专业本科及以上学历
7. 具备良好的沟通协作能力和技术方案文档撰写能力
8. 有微前端实践经验者优先`,

  fullstack: `公司：ABC 科技集团
岗位：全栈工程师
薪资：30K-45K · 14薪
地点：上海

职位描述：
1. 负责产品前后端功能开发与维护
2. 参与系统架构设计和技术方案评审
3. 编写单元测试和集成测试
4. 参与 Code Review 和技术分享

任职要求：
1. 3 年以上全栈开发经验
2. 熟悉 React 或 Vue 前端框架
3. 熟悉 Node.js / Python 后端开发
4. 有数据库设计经验（MySQL / PostgreSQL）
5. 了解 Docker 和 CI/CD 流程
6. 有云服务（AWS / 阿里云）使用经验者优先`
};

function fillExample() {
  document.getElementById('jdInput').value = EXAMPLE_JDS.fe;
}

function fillExample2() {
  document.getElementById('jdInput').value = EXAMPLE_JDS.fullstack;
}

async function startAnalysis() {
  const jdText = document.getElementById('jdInput').value.trim();
  if (!jdText || jdText.length < 50) {
    showToast('请粘贴完整的职位描述（至少 50 字）', 'warn');
    return;
  }

  // Check if resume exists
  const resumes = STORAGE.get(KEYS.RESUMES, []);
  const activeId = STORAGE.get(KEYS.ACTIVE_RESUME);
  if (!activeId || !resumes.find(r => r.id === activeId)) {
    showToast('请先上传并保存简历', 'warn');
    return;
  }

  // Check AI config
  const settings = STORAGE.get(KEYS.SETTINGS, {});
  if (!settings.apiKey) {
    showToast('请先在设置中配置 AI API Key', 'warn');
    return;
  }

  showProgress();

  // Step 1: Parse JD
  updateStep(1, 'active');
  const parseResult = await callAI(`你是一位招聘分析师。请从以下 JD 文本中提取结构化信息，以 JSON 格式返回：
{
  "company_name": "",
  "position_name": "",
  "salary_range": "",
  "location": "",
  "requirements": [{"text": "", "category": "hard_skill|soft_skill|experience|education"}],
  "responsibilities": [],
  "benefits": [],
  "industry": ""
}

JD 文本：
${jdText}`, 30000);
  updateStep(1, 'done');

  if (!parseResult) {
    hideProgress();
    return;
  }

  let parsedJD;
  try {
    parsedJD = JSON.parse(extractJSON(parseResult));
  } catch {
    parsedJD = { company_name: '', position_name: '', requirements: [] };
  }

  STORAGE.set('mianpu_temp_jd', { raw: jdText, parsed: parsedJD });

  // Step 2: Company analysis
  updateStep(2, 'active');
  const companyReport = await callAI(`你是一位公司分析专家。基于以下 JD 信息，对公司进行全面分析。
请用 JSON 格式返回，包含以下字段：
{
  "basic_info": {"company_name": "", "industry": "", "scale": "", "stage": ""},
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "development_prospect": "发展前景分析（200字左右）",
  "risks": [{"risk": "风险描述", "severity": "high|medium|low"}],
  "culture_inference": "从 JD 措辞推断公司文化",
  "interview_difficulty": "easy|medium|hard",
  "overall_assessment": "综合评价（200字左右）"
}

JD 信息：
公司：${parsedJD.company_name || '未识别'}
岗位：${parsedJD.position_name || '未识别'}
要求：${(parsedJD.requirements || []).map(r => r.text).join('；')}
职责：${(parsedJD.responsibilities || []).join('；')}
福利：${(parsedJD.benefits || []).join('；')}`, 30000);
  updateStep(2, 'done');

  // Step 3: Match analysis
  updateStep(3, 'active');
  const resumeData = resumes.find(r => r.id === activeId)?.parsedData || {};
  const skills = (resumeData.skills || []).map(s => s.name).join(', ');
  const workExp = (resumeData.workExperience || []).map(w => `${w.company} - ${w.title} (${w.startDate}~${w.endDate || '至今'})`).join('；');

  const matchResult = await callAI(`你是一位招聘匹配专家。请对比求职者简历和目标 JD，给出详细匹配分析。
用 JSON 格式返回：
{
  "matchScore": 72,
  "overall": "胜任|基本胜任|有差距|差距较大",
  "hardSkillMatch": [
    {"requirement": "精通 React", "status": "match|partial|miss", "detail": "说明匹配情况"}
  ],
  "softSkillMatch": [],
  "experienceMatch": {"assessment": "评估", "detail": "详细说明"},
  "educationMatch": {"assessment": "满足|基本满足|不满足", "detail": ""}
}

求职者简历摘要：
技能：${skills}
工作经历：${workExp}

JD 要求：
${(parsedJD.requirements || []).map(r => `[${r.category}] ${r.text}`).join('\n')}`, 30000);
  updateStep(3, 'done');

  // Step 4: Gap analysis
  updateStep(4, 'active');
  const gapResult = await callAI(`基于前面的匹配分析结果，请为求职者生成差距补齐方案。
用 JSON 格式返回：
{
  "gaps": [
    {
      "gap": "不满足的要求描述",
      "priority": "高|中|低",
      "suggestion": "具体的学习路径和资源推荐",
      "estimatedTime": "预估时间",
      "alternative": "替代策略"
    }
  ]
}

匹配分析结果：
${matchResult}`, 30000);
  updateStep(4, 'done');

  setTimeout(() => {
    hideProgress();
    showDoneState();

    // Save analysis
    const analysis = {
      id: genId(),
      rawJdText: jdText,
      parsedJD,
      companyReport: tryParseJSON(companyReport),
      matchAnalysis: tryParseJSON(matchResult),
      gapAnalysis: tryParseJSON(gapResult),
      matchScore: tryParseJSON(matchResult)?.matchScore || 0,
      resumeArchiveId: activeId,
      createdAt: new Date().toISOString()
    };

    const all = STORAGE.get(KEYS.ANALYSES, []);
    all.unshift(analysis);
    STORAGE.set(KEYS.ANALYSES, all);
    STORAGE.set(KEYS.ACTIVE_ANALYSIS, analysis.id);
  }, 500);
}

function showProgress() {
  document.getElementById('inputCard').style.display = 'none';
  document.getElementById('doneState').classList.remove('show');
  document.getElementById('progressOverlay').classList.add('show');
  document.querySelector('.stepper .step:nth-child(1)').classList.remove('active');
  document.querySelector('.stepper .step:nth-child(3)').classList.add('active');

  ['step1', 'step2', 'step3', 'step4'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (i === 0) {
      el.className = 'progress-step active';
      el.querySelector('.step-status').innerHTML = '<span class="spinner"></span>';
    } else {
      el.className = 'progress-step pending';
      el.querySelector('.step-status').innerHTML = '<span class="circle"></span>';
    }
  });
}

function updateStep(num, status) {
  const el = document.getElementById('step' + num);
  if (!el) return;
  el.className = 'progress-step ' + status;
  if (status === 'active') {
    el.querySelector('.step-status').innerHTML = '<span class="spinner"></span>';
    document.getElementById('progressTitle').textContent = `正在${['解析 JD', '分析公司', '对比要求', '生成方案'][num-1]}…`;
  } else if (status === 'done') {
    el.querySelector('.step-status').innerHTML = '<span class="check">✓</span>';
    const timeEl = el.querySelector('.step-time');
    if (timeEl) timeEl.textContent = '完成';
  }
  document.getElementById('progressStatus').textContent = `第 ${num}/4 步`;
}

function hideProgress() {
  document.getElementById('progressOverlay').classList.remove('show');
}

function showDoneState() {
  document.getElementById('doneState').classList.add('show');
  document.querySelector('.stepper .step:nth-child(3)').classList.add('done');
}

function resetForm() {
  document.getElementById('jdInput').value = '';
  document.getElementById('inputCard').style.display = 'block';
  document.getElementById('doneState').classList.remove('show');
  document.querySelector('.stepper .step:nth-child(1)').classList.add('active');
  document.querySelector('.stepper .step:nth-child(3)').classList.remove('active', 'done');
  ['step1', 'step2', 'step3', 'step4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'progress-step pending';
      el.querySelector('.step-status').innerHTML = '<span class="circle"></span>';
    }
  });
}

// ====== analyze-detail.html ======

function loadAnalysisDetail() {
  const id = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!id) { document.querySelector('.page-header')?.insertAdjacentHTML('afterend', '<div class="container" style="text-align:center;padding:48px;color:var(--muted)">未找到分析记录</div>'); return; }
  const all = STORAGE.get(KEYS.ANALYSES, []);
  const analysis = all.find(a => a.id === id);
  if (!analysis) return;

  const pjd = analysis.parsedJD || {};
  const cr = analysis.companyReport || {};
  const mr = analysis.matchAnalysis || {};
  const gr = analysis.gapAnalysis || {};

  // Update header
  const titleEl = document.querySelector('.page-job-title');
  const metaEl = document.querySelector('.page-job-meta');
  if (titleEl) titleEl.textContent = pjd.position_name || '未知岗位';
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="meta-item">🏢 ${pjd.company_name || '未知公司'}</span>
      <span class="meta-item">💰 ${pjd.salary_range || '薪资未说明'}</span>
      <span class="meta-item">📍 ${pjd.location || '地点未说明'}</span>
      <span class="meta-item"><span class="sep">·</span> ${analysis.createdAt ? formatDateTime(analysis.createdAt) : ''}</span>`;
  }

  // Match score
  const scoreEl = document.querySelector('.match-score-large .score-value');
  if (scoreEl) {
    const score = mr.matchScore || 0;
    scoreEl.textContent = score + '%';
    scoreEl.className = 'score-value ' + (score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low');
  }
  const scoreLabel = document.querySelector('.match-score-large .score-label');
  if (scoreLabel) scoreLabel.textContent = mr.overall || '待评估';

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
    });
  });

  // Render company report
  renderCompanyReport(cr);
  renderMatchAnalysis(mr);
  renderGapAnalysis(gr);
}

function renderCompanyReport(cr) {
  const tab = document.getElementById('tab-company');
  if (!tab) return;

  const sections = tab.querySelectorAll('.report-card');
  if (sections[0]) {
    const title = sections[0].querySelector('.rc-title');
    if (title) title.innerHTML = `🏢 ${cr.basic_info?.company_name || '目标公司'} <span class="badge ${cr.interview_difficulty === 'hard' ? 'red' : cr.interview_difficulty === 'medium' ? 'amber' : 'green'}">面试难度: ${cr.interview_difficulty === 'hard' ? '较高' : cr.interview_difficulty === 'medium' ? '中等' : '较低'}</span>`;
    const p = sections[0].querySelector('p');
    if (p) p.textContent = cr.overall_assessment || '分析中…';
    const meta = sections[0].querySelector('.rc-meta');
    if (meta) {
      meta.innerHTML = `
        <span class="rc-meta-item"><strong>行业</strong> ${cr.basic_info?.industry || '-'}</span>
        <span class="rc-meta-item"><strong>规模</strong> ${cr.basic_info?.scale || '-'}</span>
        <span class="rc-meta-item"><strong>阶段</strong> ${cr.basic_info?.stage || '-'}</span>
        <span class="rc-meta-item"><strong>文化推断</strong> ${cr.culture_inference || '-'}</span>`;
    }
  }

  // Strengths & Weaknesses
  if (sections[1]) {
    const title = sections[1].querySelector('.rc-title');
    if (title) title.innerHTML = '💪 核心优势';
    const list = sections[1].querySelector('.rc-meta') || sections[1];
    if (list) {
      list.innerHTML = (cr.strengths || []).map(s => `<p style="margin-bottom:8px;padding-left:12px;border-left:2px solid var(--accent)">${s}</p>`).join('') || '<p style="color:var(--meta)">暂无数据</p>';
    }
  }

  if (sections[2]) {
    const title = sections[2].querySelector('.rc-title');
    if (title) title.innerHTML = '⚠️ 潜在风险';
    const riskList = tab.querySelector('.risk-list');
    if (riskList) {
      riskList.innerHTML = (cr.risks || []).map(r => `
        <div class="risk-item ${r.severity}">
          <span class="risk-level ${r.severity}">${r.severity === 'high' ? '高风险' : r.severity === 'medium' ? '中风险' : '低风险'}</span>
          <span class="risk-text">${r.risk}</span>
        </div>
      `).join('') || '<p style="color:var(--meta);padding:16px">暂无数据</p>';
    }
  }

  if (sections[3]) {
    const title = sections[3].querySelector('.rc-title');
    if (title) title.innerHTML = '📈 发展前景';
    const p = sections[3].querySelector('p');
    if (p) p.textContent = cr.development_prospect || '分析中…';
  }
}

function renderMatchAnalysis(mr) {
  const tab = document.getElementById('tab-match');
  if (!tab) return;

  const items = [];
  (mr.hardSkillMatch || []).forEach(m => items.push({ ...m, category: '硬技能' }));
  (mr.softSkillMatch || []).forEach(m => items.push({ ...m, category: '软技能' }));

  const matchList = tab.querySelector('.match-list');
  if (matchList) {
    matchList.innerHTML = items.map(m => {
      const icon = m.status === 'match' ? '✅' : m.status === 'partial' ? '⚠️' : '❌';
      const cls = m.status === 'match' ? 'match' : m.status === 'partial' ? 'partial' : 'miss';
      return `
        <div class="match-item">
          <span class="match-status ${cls}">${icon}</span>
          <div class="match-info">
            <div class="match-req">${m.requirement}</div>
            <div class="match-detail">${m.detail || ''}</div>
          </div>
        </div>`;
    }).join('') || '<p style="color:var(--meta);padding:16px">暂无匹配数据</p>';
  }

  // Experience & education
  const extraCards = tab.querySelectorAll('.report-card');
  if (extraCards[0]) {
    const p = extraCards[0].querySelector('p');
    if (p) p.textContent = (mr.experienceMatch?.detail || '') + (mr.educationMatch?.detail ? '\n学历: ' + mr.educationMatch.detail : '');
  }
}

function renderGapAnalysis(gr) {
  const tab = document.getElementById('tab-gap');
  if (!tab) return;

  const gapList = tab.querySelector('.gap-list');
  if (gapList) {
    gapList.innerHTML = (gr.gaps || []).map(g => `
      <div class="gap-card">
        <div class="gap-header">
          <span class="gap-title">${g.gap}</span>
          <span class="gap-time">⏱ ${g.estimatedTime || '待评估'}</span>
        </div>
        <div class="gap-desc">优先级：${g.priority || '中'} · ${g.suggestion || ''}</div>
        ${g.alternative ? `<div class="gap-alt">💡 替代策略：${g.alternative}</div>` : ''}
      </div>
    `).join('') || '<p style="color:var(--meta);padding:16px">无法生成补齐方案</p>';
  }
}

// ====== Dashboard ======

function loadDashboard() {
  // Load resume data for summary card
  var resumes = STORAGE.get(KEYS.RESUMES, []);
  var activeId = STORAGE.get(KEYS.ACTIVE_RESUME);
  var activeResume = null;
  if (activeId) {
    for (var i = 0; i < resumes.length; i++) {
      if (resumes[i].id === activeId) { activeResume = resumes[i]; break; }
    }
  }
  if (activeResume && activeResume.parsedData) {
    var pd = activeResume.parsedData;
    var b = pd.basic || {};
    var nameEl = document.querySelector('.summary-left .summary-name');
    var titleEl = document.querySelector('.summary-left .summary-title');
    if (nameEl) nameEl.textContent = b.name || '未命名';
    if (titleEl) titleEl.textContent = b.title || '';
    if (pd.skills && pd.skills.length > 0) {
      var tagsEl = document.querySelector('.summary-left .summary-tags');
      if (tagsEl) {
        tagsEl.innerHTML = '';
        for (var s = 0; s < Math.min(pd.skills.length, 5); s++) {
          var tag = document.createElement('span');
          tag.className = 'tag accent';
          tag.textContent = pd.skills[s].name;
          tagsEl.appendChild(tag);
        }
      }
    }
    var metaEl = document.querySelector('.summary-left .summary-meta');
    if (metaEl) {
      metaEl.textContent = '最近更新：' + (activeResume.updatedAt ? activeResume.updatedAt.slice(0,10) : '-')
        + ' · 共 ' + (pd.skills ? pd.skills.length : 0) + ' 项技能'
        + ' · ' + (pd.workExperience ? pd.workExperience.length : 0) + ' 段工作经历'
        + ' · ' + (pd.projects ? pd.projects.length : 0) + ' 个项目';
    }
  }

  // Load analysis records
  var analyses = STORAGE.get(KEYS.ANALYSES, []);
  var list = document.querySelector('.analysis-list');
  if (!list) return;
  if (analyses.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:48px;color:var(--meta)">暂无分析记录 — 去「新增分析」开始吧</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < Math.min(analyses.length, 5); i++) {
    var a = analyses[i];
    var pjd = a.parsedJD || {};
    var score = a.matchScore || 0;
    var cls = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    html += '<a href="analyze-detail.html" class="analysis-card" onclick="STORAGE.set(\'' + KEYS.ACTIVE_ANALYSIS + '\',\'' + a.id + '\')">'
      + '<div class="analysis-info"><div class="analysis-company">' + (pjd.company_name || '未知公司') + '</div>'
      + '<div class="analysis-position">' + (pjd.position_name || '未知岗位') + (pjd.salary_range ? ' · ' + pjd.salary_range : '') + '</div>'
      + '<div class="analysis-time">' + formatDateTime(a.createdAt) + '</div></div>'
      + '<div class="analysis-right"><span class="match-badge ' + cls + '">' + score + '%</span>'
      + '<span class="analysis-arrow">→</span></div></a>';
  }
  list.innerHTML = html;

}


// ====== Action Bar Functions ======

function reanalyze() {
  var id = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!id) { showToast('未找到当前分析记录', 'warn'); return; }
  var all = STORAGE.get(KEYS.ANALYSES, []);
  var analysis = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) { analysis = all[i]; break; }
  }
  if (!analysis) { showToast('分析记录未找到', 'warn'); return; }
  STORAGE.set('mianpu_temp_jd', { raw: analysis.rawJdText || '' });
  STORAGE.set('mianpu_auto_start', true);
  window.location.href = 'analyze-new.html';
}

function deleteCurrentAnalysis() {
  var id = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!id) return;
  if (!confirm('确定删除当前分析记录？')) return;
  var all = STORAGE.get(KEYS.ANALYSES, []);
  var updated = [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].id !== id) updated.push(all[i]);
  }
  STORAGE.set(KEYS.ANALYSES, updated);
  if (updated.length > 0) {
    STORAGE.set(KEYS.ACTIVE_ANALYSIS, updated[0].id);
    window.location.reload();
  } else {
    STORAGE.remove(KEYS.ACTIVE_ANALYSIS);
    window.location.href = 'dashboard.html';
  }
}

function exportAnalysis() {
  var id = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!id) return;
  var all = STORAGE.get(KEYS.ANALYSES, []);
  var analysis = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) { analysis = all[i]; break; }
  }
  if (!analysis) return;
  var blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'analysis-' + id.slice(0, 8) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('报告已导出', 'success');
}
// ====== Init ======
document.addEventListener('DOMContentLoaded', () => {
  // Run page-specific init based on which page we're on
  const page = window.location.pathname.split('/').pop();
  if (page === 'analyze-new.html') {
    var temp = STORAGE.get('mianpu_temp_jd');
    if (temp && temp.raw) {
      document.getElementById('jdInput').value = temp.raw;
      STORAGE.remove('mianpu_temp_jd');
      var autoStart = STORAGE.get('mianpu_auto_start');
      if (autoStart) {
        STORAGE.remove('mianpu_auto_start');
        setTimeout(function() { startAnalysis(); }, 500);
      }
      showToast('已自动填充上次分析的 JD', 'info');
    }
  } else if (page === 'analyze-detail.html') {
    loadAnalysisDetail();
  } else if (page === 'dashboard.html' || page === 'index.html') {
    loadDashboard();
  }
});




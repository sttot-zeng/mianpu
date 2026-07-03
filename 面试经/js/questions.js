/* ===========================================
   questions.js — 面试题库模块
   =========================================== */

// ---- Section Toggle ----
function toggleSection(header) {
  header.classList.toggle('collapsed');
  try {
    localStorage.setItem('qb_section_' + header.parentElement.dataset.section, 
      header.classList.contains('collapsed') ? 'collapsed' : 'open');
  } catch(e) {}
}
window.toggleSection = toggleSection;

// ---- Answer Toggle ----
function toggleAnswer(btn) {
  const answer = btn.closest('.q-card').querySelector('.q-answer');
  const isOpen = answer.classList.contains('open');
  answer.classList.toggle('open');
  btn.textContent = isOpen ? '👁 查看答案' : '👁 隐藏答案';
}
window.toggleAnswer = toggleAnswer;

// ---- Global Answer Toggle ----
let allShown = false;
function toggleAllAnswers() {
  allShown = !allShown;
  document.querySelectorAll('.q-answer').forEach(a => a.classList.toggle('open', allShown));
  document.querySelectorAll('.q-expand-btn').forEach(btn => {
    btn.textContent = allShown ? '👁 隐藏答案' : '👁 查看答案';
  });
  const btn = document.getElementById('global-toggle-btn');
  if (btn) btn.textContent = allShown ? '👁 隐藏全部答案' : '👁 显示全部答案';
}
window.toggleAllAnswers = toggleAllAnswers;

// ---- Total Count ----
function updateTotalCount() {
  let t = 0;
  document.querySelectorAll('.section-card .q-card').forEach(() => t++);
  document.getElementById('totalCount').textContent = t;
}
window.updateTotalCount = updateTotalCount;

// ---- Filter ----
function filterSection(type) {
  document.querySelectorAll('[id^=filter-]').forEach(x => {
    x.classList.remove('toggle-on'); x.style.color = ''; x.style.borderColor = '';
  });
  const activeEl = document.getElementById('filter-' + type);
  if (activeEl) { activeEl.classList.add('toggle-on'); activeEl.style.color = 'var(--accent)'; activeEl.style.borderColor = 'var(--accent)'; }

  document.querySelectorAll('.section-card').forEach(s => {
    if (type === 'all') { s.style.display = ''; return; }
    const key = type === 'starred' ? 'star' : 'review';
    const c = s.querySelectorAll('.q-status-btn.' + key + '.active').length;
    s.style.display = c > 0 ? '' : 'none';
  });
}
window.filterSection = filterSection;

// ---- Question Status ----
function toggleQuestionStatus(btn, statusKey) {
  btn.classList.toggle('active');
  const qid = btn.closest('.q-card').dataset.qid;
  if (!qid) return;
  const statusKeyFull = KEYS.QB_STATUS + '_' + (new URLSearchParams(window.location.search).get('id') || '');
  const status = STORAGE.get(statusKeyFull, {});
  if (!status[qid]) status[qid] = { star: false, done: false, review: false };
  status[qid][statusKey] = btn.classList.contains('active');
  STORAGE.set(statusKeyFull, status);
}
window.toggleQuestionStatus = toggleQuestionStatus;

// ---- More Question Data Pool ----
const MORE_QUESTIONS_POOL = {
  self_intro: [
    { q: "工作中你最擅长的技术领域是什么？", d: "easy", a: "前端工程化与性能优化，擅长从系统层面解决性能瓶颈。" },
    { q: "你是如何保持技术更新的？", d: "easy", a: "关注技术博客、参与开源项目、定期做技术分享来巩固学习成果。" },
    { q: "你如何看待代码评审？", d: "easy", a: "代码评审是知识共享和集体质量把关的重要环节，要积极参与并保持开放心态。" },
    { q: "你平时如何规划自己的职业发展？", d: "easy", a: "短期聚焦当前项目的技术深度，中期拓宽技术广度学习后端和架构知识，长期目标是成为能独当一面的技术负责人。" },
    { q: "你倾向于在什么样的团队文化中工作？", d: "medium", a: "透明开放、有建设性反馈文化、技术驱动同时注重业务价值的团队。团队有技术追求但不过度工程化。" }
  ],
  professional: [
    { q: "React 中 useEffect 的 cleanup 函数在什么情况下会被调用？", d: "easy", a: "组件卸载时、依赖变化重新执行副作用前都会调用上一次的 cleanup 函数。" },
    { q: "解释 JavaScript 的事件循环机制。", d: "medium", a: "Call Stack 执行同步代码，异步任务注册回调到 Task/Microtask Queue，Event Loop 在 Call Stack 为空时先清空 Microtask 再取一个 Task 执行。" },
    { q: "Webpack 和 Vite 的核心区别是什么？", d: "easy", a: "Webpack 开发阶段也需要打包，Vite 利用 ESM 原生支持实现按需编译，开发服务器启动和热更新速度远快于 Webpack。" },
    { q: "什么是 React 的 Fiber 架构？它解决了什么问题？", d: "hard", a: "Fiber 是 React 16 引入的新的协调引擎。它将渲染拆分为可中断的小任务单元，实现了增量渲染、任务优先级调度，解决了同步递归遍历 VDOM 时阻塞主线程的问题。" },
    { q: "CSS containment 属性有什么作用？如何使用？", d: "medium", a: "contain 属性通过限制元素子树在布局、样式、绘制上的隔离范围，减少浏览器计算量。常用值：layout（隔离布局）、paint（隔离绘制）、size（固定尺寸）、strict（所有隔离）。适合长列表、大表格等性能敏感场景。" }
  ],
  project: [
    { q: "项目中最复杂的组件是什么？你是如何设计的？", d: "hard", a: "低代码平台的属性面板，采用 Schema 驱动 + 注册器模式，每种组件类型注册自己的属性编辑配置。" },
    { q: "项目中有做过哪些性能优化工作？效果如何？", d: "medium", a: "首页加载从 4s 优化到 1.2s：代码分割、关键 CSS 内联、图片 WebP 化、CDN 预热。" },
    { q: "你是如何保证项目代码质量的？", d: "easy", a: "ESLint + Prettier 自动化格式化、Commit 规范、Code Review 流程、单元测试覆盖率检查。" },
    { q: "项目中遇到过最棘手的技术债务是什么？如何处理的？", d: "hard", a: "早期项目为了快速上线使用了大量第三方 jQuery 插件，导致维护成本急剧上升。制定渐进式迁移计划：先封装适配层隔离依赖，然后逐个模块用 React 重写，最后移除旧依赖。整个过程历时 3 个月，零故障。" },
    { q: "你在项目中做过最难的技术决策是什么？", d: "hard", a: "在项目中期决定推翻原有单体架构，采用微前端方案。这是一个需要巨大勇气的决策：短期会增加开发成本，但长期来看能支持 5 个团队并行开发。通过小范围 POC 验证 + 渐进式迁移，最终说服团队接受方案。" }
  ],
  behavioral: [
    { q: "讲一个你在紧急需求下保证交付质量的经历。", d: "medium", a: "先确认核心功能需求做 MVP，基础设施和监控先行，上线后持续迭代补全次要功能。" },
    { q: "如何处理团队内部的分歧？", d: "easy", a: "数据和原型驱动讨论，如果两种方案各有优劣，定好评估周期快速验证。" },
    { q: "遇到不合理的需求时你是怎么处理的？", d: "medium", a: "理解需求背后的真实目标，提供可量化的替代方案，让决策者基于数据做判断。" },
    { q: "你如何带领新人融入团队？", d: "easy", a: "制定清晰的 onboarding 文档和路线图，指定 mentor 制度，前两周以代码走读和小任务为主，逐步过渡到独立开发。定期 1-1 跟进，确保新人顺利融入。" },
    { q: "如果让你主持一次技术分享，你会选择什么主题？", d: "medium", a: "会选择当前团队遇到的实际问题作为切入点，比如性能优化实战或架构演进经验。从实际场景出发，配合具体数据和代码示例，让听众能直接应用到工作中。" }
  ],
  values: [
    { q: "你如何看待远程办公？", d: "easy", a: "远程办公需要更高的自律性和沟通能力，适合深度编码工作。" },
    { q: "你如何定义优秀的代码？", d: "medium", a: "可读性 > 性能（在可接受范围内），单一职责、可测试、易于修改的代码就是好代码。" },
    { q: "什么情况下你会选择离开现在的团队？", d: "medium", a: "技术天花板明显、团队文化长期不良、个人成长停滞，出现这些情况会认真考虑离开。" },
    { q: "工作之余你如何保持学习和成长？", d: "easy", a: "参与开源项目贡献、阅读技术书籍和博客、参加技术会议分享。最近在读《Designing Data-Intensive Applications》扩展系统设计视野。" },
    { q: "你如何看待行业内的 996 文化？", d: "medium", a: "不认同强制加班文化。高效的 8 小时产出远胜低效的 12 小时。理解项目关键期短期冲刺，但长期来看需要可持续的节奏。" }
  ],
  open: [
    { q: "如何设计一个前端错误监控系统？", d: "hard", a: "采集层 → 采样聚合层 → 存储与查询层 → 可视化告警层，附加 sourcemap 还原和用户行为回放。" },
    { q: "如何看待 AI 辅助编程工具的前景？", d: "medium", a: "AI 是效率放大器。初级编程工作会减少，但架构设计、系统思考层面的价值会更高。" },
    { q: "从输入 URL 到页面渲染，中间发生了什么？", d: "medium", a: "DNS 解析 → TCP 连接 → TLS 握手 → HTTP 请求 → 服务器响应 → HTML 解析 → 渲染树 → Layout → Paint → Composite。" },
    { q: "如何设计一个高可用的前端架构？", d: "hard", a: "关注三个维度：稳定性（错误边界、灰度发布、监控告警）、扩展性（插件化、模块化、微前端）、性能（CDN、懒加载、缓存策略）。架构设计需要根据业务阶段持续演进，不过度设计。" },
    { q: "你认为好的软件工程师和普通开发者的区别是什么？", d: "medium", a: "好的工程师不仅写能运行的代码，更关注代码的可维护性、系统边界、技术选型的长期影响。他们主动思考为什么做（业务价值）、做什么（技术方案）、怎么做（实现细节）三个层面的问题。" }
  ]
};

// ---- Generate More Questions ----
function generateMore(sectionId) {
  const container = document.getElementById('qsec-' + sectionId);
  const pool = MORE_QUESTIONS_POOL[sectionId];
  if (!pool || pool.length === 0) {
    document.getElementById('more-section-' + sectionId).innerHTML = '所有额外题目已全部生成';
    return;
  }
  const count = Math.min(3, pool.length);
  const added = pool.splice(0, count);
  added.forEach((q, i) => {
    const diffLabel = q.d === 'easy' ? '简单' : q.d === 'medium' ? '中等' : '困难';
    const html = '<div class="q-card q-card-new"><div class="q-card-header"><div class="q-card-title">' + q.q + '</div><div class="q-card-tags"><span class="q-difficulty ' + q.d + '">' + diffLabel + '</span></div></div><div class="q-answer"><div class="q-answer-text">' + q.a + '</div></div><div style="display:flex;gap:var(--space-2);margin-top:var(--space-2)"><button class="q-expand-btn" onclick="toggleAnswer(this)">👁 查看答案</button></div></div>';
    container.insertAdjacentHTML('beforeend', html);
  });
  // Update count
  const meta = container.closest('.section-card').querySelector('.section-meta');
  if (meta) {
    const m = meta.textContent.match(/(\d+)/);
    if (m) meta.textContent = meta.textContent.replace(m[1], parseInt(m[1]) + count);
  }
  if (pool.length === 0) {
    document.getElementById('more-section-' + sectionId).innerHTML = '所有额外题目已全部生成';
  }
  updateTotalCount();
}
window.generateMore = generateMore;

// ---- AI Question Generation (from analyze-detail) ----
async function generateQuestions() {
  const analysisId = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!analysisId) { showToast('请先选择分析记录', 'warn'); return; }
  const all = STORAGE.get(KEYS.ANALYSES, []);
  const analysis = all.find(a => a.id === analysisId);
  if (!analysis) { showToast('分析记录未找到', 'warn'); return; }

  showLoading('AI 正在生成面试题库…');

  const resumes = STORAGE.get(KEYS.RESUMES, []);
  const resume = resumes.find(r => r.id === analysis.resumeArchiveId);
  const resumeText = JSON.stringify(resume?.parsedData || {}, null, 2);
  const jdText = analysis.rawJdText || '';

  const result = await callAI(
    '你是一位资深面试官。基于求职者简历和目标 JD，生成一份定制化的面试题库。\n'
    + '题库包含6个章节，每章至少4-6道题，问题必须针对简历和JD定制。\n'
    + '用 JSON 格式返回，结构：{"sections":[{"section":"self_intro","sectionName":"...","timing":"...","questions":[{"id":"q_001","question":"...","answer":"...","difficulty":"easy|medium|hard"}]},...]}\n\n'
    + '求职者简历：\n' + resumeText + '\n\n目标 JD：\n' + jdText,
    60000
  );

  hideLoading();
  if (!result) { showToast('题库生成失败，请重试', 'error'); return; }

  const parsed = tryParseJSON(result);
  if (!parsed || !parsed.sections) { showToast('题库格式异常，请重试', 'error'); return; }

  let count = 0;
  parsed.sections.forEach(s => count += (s.questions || []).length);
  if (count === 0) { showToast('题库生成异常，请重试', 'error'); return; }

  const qb = {
    id: genId(),
    jobAnalysisId: analysisId,
    targetPosition: (analysis.parsedJD?.company_name || '') + ' · ' + (analysis.parsedJD?.position_name || ''),
    sections: parsed.sections,
    questionCount: count,
    createdAt: new Date().toISOString()
  };

  const qbs = STORAGE.get(KEYS.QUESTION_BANKS, []);
  qbs.unshift(qb);
  STORAGE.set(KEYS.QUESTION_BANKS, qbs);
  STORAGE.set('mianpu_active_question_bank', qb.id);
  STORAGE.set('qb_generated', 'true');
  showToast('题库生成成功！共 ' + count + ' 题', 'success');

  setTimeout(() => { window.location.href = 'question-bank.html?id=' + qb.id; }, 1500);
}
window.generateQuestions = generateQuestions;

// ---- Load Question Bank Page ----
function loadQuestionBank() {
  var qbId = new URLSearchParams(window.location.search).get("id") || STORAGE.get("mianpu_active_question_bank");
  if (!qbId) return;
  var qbs = STORAGE.get(KEYS.QUESTION_BANKS, []);
  var qb = null;
  for (var i = 0; i < qbs.length; i++) { if (qbs[i].id === qbId) { qb = qbs[i]; break; } }
  if (!qb || !qb.sections) return;

  var titleEl = document.querySelector(".page-title .count");
  if (titleEl) titleEl.textContent = qb.questionCount + " \u9898";
  var subtitle = document.querySelector(".page-subtitle");
  if (subtitle) subtitle.textContent = qb.targetPosition || "\u5b9a\u5236\u9762\u8bd5\u9898\u5e93";

  // Render sections from AI data
  var container = document.querySelector(".action-bar");
  if (!container) return;
  var parent = container.parentNode;

  // Remove existing section cards
  var oldSections = parent.querySelectorAll(".section-card");
  oldSections.forEach(function(s) { s.remove(); });

  var sectionIcons = ["\ud83d\udcdd", "\u2699\ufe0f", "\ud83c\udfd7\ufe0f", "\ud83e\udd1d", "\ud83d\udca1", "\ud83d\udd2e"];

  qb.sections.forEach(function(sec, idx) {
    var diffLabels = { easy: "\u7b80\u5355", medium: "\u4e2d\u7b49", hard: "\u56f0\u96be" };
    var sectionId = sec.section || "sec_" + idx;

    var html = '<div class="section-card" data-section="' + sectionId + '">';
    html += '<div class="section-header" onclick="toggleSection(this)">';
    html += '<div class="section-header-left">';
    html += '<div class="section-icon si-' + ((idx % 6) + 1) + '">' + (sectionIcons[idx % 6] || "\ud83d\udcdd") + "</div>";
    html += "<div>";
    html += '<div class="section-name">' + (sec.sectionName || sectionId) + "</div>";
    html += '<div class="section-meta" id="count-' + sectionId + '">' + (sec.timing || "") + " \u00b7 " + sec.questions.length + " \u9898</div>";
    html += "</div></div>";
    html += '<span class="section-toggle">\u25bc</span></div>';
    html += '<div class="section-body" id="qsec-' + sectionId + '">';

    sec.questions.forEach(function(q) {
      var qid = q.id || "q_" + genId();
      var diffLabel = diffLabels[q.difficulty] || "\u4e2d\u7b49";
      html += '<div class="q-card" data-qid="' + qid + '">';
      html += '<div class="q-card-header"><div class="q-text">' + q.question + "</div>";
      html += '<span class="q-difficulty ' + q.difficulty + '">' + diffLabel + "</span></div>";
      html += '<div class="q-answer"><div class="q-answer-text">' + q.answer + "</div></div>";
      html += '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-2)">';
      html += '<button class="q-expand-btn" onclick="toggleAnswer(this)">\ud83d\udc41 \u67e5\u770b\u7b54\u6848</button></div></div>';
    });

    html += '<div class=\"more-questions\" style=\"text-align:center;padding:var(--space-3) 0\" id=\"more-section-' + sectionId + '\">';
    html += '<button class=\"action-btn\" onclick=\"generateMore(&quot;' + sectionId + '&quot;)\" style=\"color:var(--accent);border-color:var(--accent)\">➕ \u518d\u591a\u751f\u6210 3 \u6761</button>';
    html += '</div>';
    html += '</div></div>';
    parent.insertBefore(dom(html), container.nextSibling);
  });

  updateTotalCount();
}

function dom(html) {
  var d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild;
}


// ---- Generate question bank from this page ----
function generateFromHere() {
  var analysisId = STORAGE.get(KEYS.ACTIVE_ANALYSIS);
  if (!analysisId) {
    showToast("\u8bf7\u5148\u5728\u5206\u6790\u8be6\u60c5\u9875\u5206\u6790\u4e00\u4e2a\u5c97\u4f4d", "warn");
    setTimeout(function() { window.location.href = "analyze-new.html"; }, 2000);
    return;
  }
  var all = STORAGE.get(KEYS.ANALYSES, []);
  var found = false;
  for (var i = 0; i < all.length; i++) { if (all[i].id === analysisId) { found = true; break; } }
  if (!found) { showToast("\u5206\u6790\u8bb0\u5f55\u672a\u627e\u5230", "warn"); return; }
  generateQuestions();
}
// ---- Init ----
document.addEventListener('DOMContentLoaded', function() {
  var page = window.location.pathname.split("/").pop();
  if (page === "question-bank.html") {
    var qbId = new URLSearchParams(window.location.search).get("id") || STORAGE.get("mianpu_active_question_bank");
    var hasAiData = false;
    if (qbId) {
      var qbs = STORAGE.get(KEYS.QUESTION_BANKS, []);
      for (var i = 0; i < qbs.length; i++) { if (qbs[i].id === qbId) { hasAiData = true; break; } }
    }
    if (hasAiData) {
      loadQuestionBank();
    } else if (localStorage.getItem("qb_generated") === "true") {
      localStorage.removeItem("qb_generated");
      if (typeof generateQuestions === "function") { generateQuestions(); }
    }
    setTimeout(function() {
      document.querySelectorAll("[data-section]").forEach(function(sec) {
        var saved = localStorage.getItem("qb_section_" + sec.dataset.section);
        if (saved === "collapsed") sec.querySelector(".section-header").classList.add("collapsed");
      });
    }, 0);
  }
});



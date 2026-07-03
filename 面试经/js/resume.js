/* ===========================================
   resume.js — 个人档案模块
   =========================================== */
function findField(labelText) {
  const labels = document.querySelectorAll(".field-label");
  for (const label of labels) {
    if (label.textContent.trim() === labelText) {
      const parent = label.closest("div"); if (!parent) return null;
      const input = parent.querySelector("input, textarea, select");
      if (input && !input.closest(".skill-input-wrap")) return input;
    }
  } return null;
}
function findFieldInExp(expCard, labelText) {
  if (!expCard) return null;
  const labels = expCard.querySelectorAll(".field-label");
  for (const label of labels) {
    const text = label.textContent.trim();
    if (text === labelText || text.startsWith(labelText)) {
      const parent = label.closest("div"); if (!parent) return null;
      const input = parent.querySelector("input, textarea, select");
      if (input && !input.closest(".skill-input-wrap")) return input;
      return expCard.querySelector("input[placeholder='⾄今']") || null;
    }
  } return null;
}
function collectResumeData() {
  const data = {
    basic: { name: findField("姓名")?.value||"", phone: findField("手机号")?.value||"", email: findField("邮箱")?.value||"",
      location: findField("所在地")?.value||"", title: findField("当前职位")?.value||"", summary: findField("个人简介")?.value||"" },
    education: { school: findField("学校")?.value||"", degree: findField("学位")?.value||"", major: findField("专业")?.value||"", period: findField("时间")?.value||"" },
    workExperience: [], projects: [], skills: []
  };
  const sections = document.querySelectorAll(".form-section");
  let workSec = null, projSec = null;
  sections.forEach(function(s) {
    const t = s.querySelector(".form-section-title"); if (!t) return;
    const txt = t.textContent.trim();
    if (txt.startsWith("工作经历")) workSec = s;
    if (txt.startsWith("项目经验")) projSec = s;
  });
  if (workSec) {
    workSec.querySelectorAll(".exp-card").forEach(function(card) {
      const co = findFieldInExp(card, "公司"); if (!co || !co.value) return;
      const cur = card.querySelector("input[type='checkbox']")?.checked || false;
      const ef = findFieldInExp(card, "结束时间");
      data.workExperience.push({ company: co.value, title: findFieldInExp(card, "职位")?.value||"",
        startDate: findFieldInExp(card, "开始时间")?.value||"", endDate: cur ? "" : (ef?.value||""), isCurrent: cur,
        description: findFieldInExp(card, "工作描述")?.value||"" });
    });
  }
  if (projSec) {
    projSec.querySelectorAll(".exp-card").forEach(function(card) {
      const ne = findFieldInExp(card, "项目名称"); if (!ne || !ne.value) return;
      data.projects.push({ name: ne.value, role: findFieldInExp(card, "角色")?.value||"",
        techStack: findFieldInExp(card, "技术栈")?.value||"", relatedCompany: findFieldInExp(card, "关联工作")?.value||"",
        description: findFieldInExp(card, "项目描述")?.value||"", link: findFieldInExp(card, "链接")?.value||"" });
    });
  }
  document.querySelectorAll(".skill-tag").forEach(function(el) {
    const txt = el.textContent.replace(/\u00d7/g,"").trim(); if (txt) data.skills.push({ name: txt });
  });
  return data;
}
function populateFromData(data) {
  if (!data) return;
  var set = function(l, v) { var f = findField(l); if (f) f.value = v || ""; };
  var b = data.basic || {}; set("姓名", b.name); set("手机号", b.phone); set("邮箱", b.email);
  set("所在地", b.location); set("当前职位", b.title); set("个人简介", b.summary);
  var edu = data.education || {}; set("学校", edu.school); set("学位", edu.degree); set("专业", edu.major); set("时间", edu.period);

  var getSec = function(prefix) {
    var secs = document.querySelectorAll(".form-section");
    for (var i = 0; i < secs.length; i++) {
      var t = secs[i].querySelector(".form-section-title");
      if (t && t.textContent.trim().startsWith(prefix)) return secs[i];
    } return null;
  };
  var fillExpCard = function(card, fields) {
    for (var label in fields) {
      if (!fields.hasOwnProperty(label)) continue;
      var inp = findFieldInExp(card, label);
      if (inp) { inp.value = fields[label] || ""; }
    }
  };
  var createCard = function(template) {
    var card = template.cloneNode(true);
    card.querySelectorAll("input, textarea, select").forEach(function(el) {
      if (el.type !== "checkbox") { if (el.tagName === "SELECT") el.selectedIndex = 0; else el.value = ""; }
      else el.checked = false;
    });
    var delBtn = card.querySelector(".delete");
    if (delBtn) delBtn.addEventListener("click", function() { deleteCard(this); });
    return card;
  };

  // Work experience
  var workSec = getSec("工作经历");
  if (workSec && data.workExperience) {
    var addBtn = workSec.querySelector(".add-btn");
    var tpl = workSec.querySelector(".exp-card");
    if (tpl) {
      workSec.querySelectorAll(".exp-card").forEach(function(c) { if (c !== tpl) c.remove(); });
      tpl.remove();
      data.workExperience.forEach(function(exp) {
        var card = createCard(tpl);
        fillExpCard(card, { "公司": exp.company, "职位": exp.title, "开始时间": exp.startDate, "工作描述": exp.description });
        if (exp.isCurrent) {
          var chk = card.querySelector("input[type='checkbox']");
          if (chk) { chk.checked = true; var inp = card.querySelector("input[placeholder='⾄今']"); if (inp) inp.disabled = true; }
        } else { fillExpCard(card, { "结束时间": exp.endDate }); }
          wireEndTimeCheckbox(card);
    workSec.insertBefore(card, addBtn);
      });
    }
  }

  // Project experience
  var projSec = getSec("项目经验");
  if (projSec && data.projects) {
    var addBtn2 = projSec.querySelector(".add-btn");
    projSec.querySelectorAll(".exp-card").forEach(function(c) { c.remove(); });
    var tmplFields = ["项目名称","角色","技术栈","项目描述","链接"];
    data.projects.forEach(function(proj) {
      var card = document.createElement("div"); card.className = "exp-card";
      var html = '<div class="exp-body"><div class="field-group">';
      html += '<div><label class="field-label">项目名称</label><input class="field-input"></div>';
      html += '<div><label class="field-label">角色</label><input class="field-input"></div></div>';
      html += '<div class="field-group"><div><label class="field-label">技术栈</label><input class="field-input"></div>';
      html += '<div><label class="field-label">关联工作</label><input class="field-input" placeholder="请输入关联公司"></div></div>';
      html += '<div class="field-group single"><div><label class="field-label">项目描述</label><textarea class="field-input" rows="3"></textarea></div></div>';
      html += '<div class="field-group single"><div><label class="field-label">链接(选填)</label><input class="field-input"></div></div>';
      html += '<div class="exp-actions"><button class="delete">删除</button></div></div>';
      card.innerHTML = html;
      fillExpCard(card, { "项目名称": proj.name, "角色": proj.role, "技术栈": proj.techStack, "关联工作": proj.relatedCompany, "项目描述": proj.description, "链接": proj.link });
      var delBtn2 = card.querySelector(".delete");
      if (delBtn2) delBtn2.addEventListener("click", function() { deleteCard(this); });
      
      projSec.insertBefore(card, addBtn2);
    });
  }

  // Skill tags
  if (data.skills) {
    var container = document.querySelector(".skill-tags");
    if (container) {
      var wrap = container.querySelector(".skill-input-wrap");
      container.querySelectorAll(".skill-tag").forEach(function(t) { t.remove(); });
      data.skills.forEach(function(s) {
        if (s.name) {
          var tag = document.createElement("span"); tag.className = "skill-tag";
          tag.innerHTML = s.name + ' <span class="remove">\u00d7</span>';
          tag.querySelector(".remove").addEventListener("click", function() { tag.remove(); });
          container.insertBefore(tag, wrap);
        }
      });
    }
  }
}
function saveResume() {
  var data = collectResumeData();
  var id = STORAGE.get(KEYS.ACTIVE_RESUME) || genId();
  var label = (document.querySelector(".version-tab.active")?.textContent?.trim()) || "未命名";
  var archive = { id: id, versionLabel: label, isActive: true, parsedData: data,
    skillModel: collectDimensionData(), updatedAt: new Date().toISOString() };
  var all = STORAGE.get(KEYS.RESUMES, []);
  var idx = all.findIndex(function(r) { return r.id === id; });
  if (idx >= 0) all[idx] = archive; else all.push(archive);
  STORAGE.set(KEYS.RESUMES, all); STORAGE.set(KEYS.ACTIVE_RESUME, id);
  showToast("简历已保存", "success");
  return archive;
}
function loadResume() {
  var id = STORAGE.get(KEYS.ACTIVE_RESUME);
  if (!id) return null;
  var all = STORAGE.get(KEYS.RESUMES, []);
  var archive = all.find(function(r) { return r.id === id; });
  if (archive) populateFromData(archive.parsedData);
  return archive || null;
}
function initSkillTags() {
  var container = document.querySelector(".skill-tags");
  var wrap = document.querySelector(".skill-input-wrap");
  if (!container || !wrap) return;
  var input = wrap.querySelector(".field-input");
  var addBtn = wrap.querySelector(".add-skill-btn");
  function addTag(name) {
    if (!name.trim()) return;
    var existing = container.querySelectorAll(".skill-tag");
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].textContent.replace("\u00d7","").trim() === name.trim()) return;
    }
    var tag = document.createElement("span"); tag.className = "skill-tag";
    tag.innerHTML = name.trim() + ' <span class="remove">\u00d7</span>';
    tag.querySelector(".remove").addEventListener("click", function() { tag.remove(); });
    container.insertBefore(tag, wrap);
  }
  if (addBtn) addBtn.addEventListener("click", function() { addTag(input?.value||""); if (input) input.value = ""; });
  if (input) input.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); addTag(input.value); input.value = ""; } });
  container.querySelectorAll(".skill-tag .remove").forEach(function(btn) {
    btn.addEventListener("click", function() { var t = btn.closest(".skill-tag"); if (t) t.remove(); });
  });
}
function collectDimensionData() {
  var dims = [];
  document.querySelectorAll(".dimension-row").forEach(function(row) {
    var n = row.querySelector(".dimension-name")?.textContent?.trim()||"";
    var s = row.querySelector(".dimension-score")?.textContent?.trim()||"0";
    var f = row.querySelector(".dimension-fill");
    dims.push({ name: n, score: parseInt(s), width: f?.style?.width||"0%" });
  });
  return { dimensions: dims, generatedAt: new Date().toISOString() };
}
function initDimensionEdit() {
  document.querySelectorAll(".dimension-edit").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var row = btn.closest(".dimension-row");
      var scoreEl = row?.querySelector(".dimension-score");
      var fillEl = row?.querySelector(".dimension-fill");
      if (!scoreEl || !fillEl) return;
      var cur = parseInt(scoreEl.textContent);
      var nv = prompt("输入新分数 (0-100):", cur); if (nv === null) return;
      var num = parseInt(nv); if (isNaN(num) || num < 0 || num > 100) { showToast("请输入 0-100 之间的数字","warn"); return; }
      scoreEl.textContent = num; fillEl.style.width = num + "%";
      showToast("分数已更新","success");
    });
  });
}
// ====== 添加/删除/取消卡片 ======
function getSectionByTitle(prefix) {
  var secs = document.querySelectorAll(".form-section");
  for (var i = 0; i < secs.length; i++) {
    var t = secs[i].querySelector(".form-section-title");
    if (t && t.textContent.trim().startsWith(prefix)) return secs[i];
  } return null;
}
function addWorkCard() {
  var sec = getSectionByTitle("工作经历"); if (!sec) return;
  var cards = sec.querySelectorAll(".exp-card"); if (cards.length === 0) return;
  var btn = sec.querySelector(".add-btn"); if (!btn) return;
  var newCard = cards[0].cloneNode(true);
  newCard.querySelectorAll("input,textarea,select").forEach(function(el) {
    if (el.type !== "checkbox") { if (el.tagName === "SELECT") el.selectedIndex = 0; else el.value = ""; }
    else el.checked = false;
  });
  var delBtn = newCard.querySelector(".delete");
  if (delBtn) delBtn.addEventListener("click", function() { deleteCard(this); });
    wireEndTimeCheckbox(newCard);
  sec.insertBefore(newCard, btn);
}
function addProjectCard() {
  var sec = getSectionByTitle("项目经验"); if (!sec) return;
  var cards = sec.querySelectorAll(".exp-card"); if (cards.length === 0) return;
  var btn = sec.querySelector(".add-btn"); if (!btn) return;
  var newCard = cards[0].cloneNode(true);
  newCard.querySelectorAll("input,textarea,select").forEach(function(el) {
    if (el.type !== "checkbox") { if (el.tagName === "SELECT") el.selectedIndex = 0; else el.value = ""; }
    else el.checked = false;
  });
  var delBtn = newCard.querySelector(".delete");
  if (delBtn) delBtn.addEventListener("click", function() { deleteCard(this); });
    wireEndTimeCheckbox(newCard);
  sec.insertBefore(newCard, btn);
}
function deleteCard(btn) {
  var card = btn.closest(".exp-card"); if (!card) return;
  var sec = card.closest(".form-section");
  var remaining = sec ? sec.querySelectorAll(".exp-card").length : 0;
  if (remaining <= 1) { showToast("至少保留一条记录","warn"); return; }
  card.remove(); showToast("已删除","success");
}
function resetForm() { loadResume(); showToast("已重置","info"); }
// ====== 版本管理 ======
function refreshVersionTabs() {
  var all = STORAGE.get(KEYS.RESUMES, []);
  var bar = document.querySelector(".version-bar"); if (!bar) return;
  var uploadBtn = bar.querySelector(".version-upload");
  bar.querySelectorAll(".version-tab").forEach(function(t) { t.remove(); });
  if (all.length === 0) {
    var tab = document.createElement("div"); tab.className = "version-tab active";
    tab.innerHTML = '<span class="status-dot green"></span>默认版本';
    tab.addEventListener("click", function() { switchVersion(tab); });
    bar.insertBefore(tab, uploadBtn); return;
  }
  var activeId = STORAGE.get(KEYS.ACTIVE_RESUME);
  all.forEach(function(r) {
    var tab = document.createElement("div");
    tab.className = "version-tab" + (r.id === activeId ? " active" : "");
    tab.setAttribute("data-version-id", r.id);
    tab.innerHTML = '<span class="status-dot green"></span>' + r.versionLabel;
    tab.addEventListener("click", function() { switchVersion(tab); });
    bar.insertBefore(tab, uploadBtn);
  });
}
function switchVersion(tab) {
  document.querySelectorAll(".version-tab").forEach(function(t) { t.classList.remove("active"); });
  tab.classList.add("active");
  var id = tab.getAttribute("data-version-id");
  if (id) {
    STORAGE.set(KEYS.ACTIVE_RESUME, id);
    document.querySelectorAll(".field-input").forEach(function(el) { el.value = ""; });
    var all = STORAGE.get(KEYS.RESUMES, []);
    var match = all.find(function(r) { return r.id === id; });
    if (match) { populateFromData(match.parsedData); showToast("已切换版本","success"); }
  }
}
function createVersion() {
  var data = collectResumeData();
  var now = new Date();
  var label = now.toISOString().slice(0,10) + "-版本" + (STORAGE.get(KEYS.RESUMES,[]).length+1);
  var id = genId();
  var archive = { id: id, versionLabel: label, isActive: true, parsedData: data,
    skillModel: collectDimensionData(), updatedAt: now.toISOString() };
  var all = STORAGE.get(KEYS.RESUMES, []); all.push(archive);
  STORAGE.set(KEYS.RESUMES, all); STORAGE.set(KEYS.ACTIVE_RESUME, id);
  refreshVersionTabs(); showToast("已创建新版本: " + label, "success");
}
function deleteCurrentVersion() {
  var id = STORAGE.get(KEYS.ACTIVE_RESUME); if (!id) return;
  var all = STORAGE.get(KEYS.RESUMES, []);
  if (all.length <= 1) { showToast("至少保留一个版本","warn"); return; }
  if (!confirm("确定删除当前版本？")) return;
  var updated = all.filter(function(r) { return r.id !== id; });
  STORAGE.set(KEYS.RESUMES, updated);
  STORAGE.set(KEYS.ACTIVE_RESUME, updated[0] ? updated[0].id : null);
  refreshVersionTabs();
  var active = updated[0];
  if (active) { document.querySelectorAll(".field-input").forEach(function(el) { el.value = ""; }); populateFromData(active.parsedData); }
  showToast("版本已删除","success");
}
function initVersionBar() {
  refreshVersionTabs();
  var uploadBtn = document.querySelector(".version-upload");
  if (uploadBtn) uploadBtn.addEventListener("click", createVersion);
  if (!document.querySelector(".version-delete")) {
    var bar = document.querySelector(".version-bar");
    if (bar) {
      var delBtn = document.createElement("div"); delBtn.className = "version-delete";
      delBtn.textContent = "\ud83d\uddd1 删除版本";
      delBtn.style.cssText = "cursor:pointer;padding:var(--space-2) var(--space-4);border-radius:var(--radius-pill);font-size:var(--text-sm);color:var(--danger);border:1px solid var(--border)";
      delBtn.addEventListener("click", deleteCurrentVersion);
      bar.appendChild(delBtn);
    }
  }
}

function wireEndTimeCheckbox(card) {
  var cb = card.querySelector("input[type='checkbox']");
  var inp = card.querySelector('input[placeholder="\u81f3\u4eca"]');
  if (cb && inp) {
    cb.addEventListener("change", function() {
      inp.disabled = cb.checked;
      if (cb.checked) inp.value = "";
    });
    inp.disabled = cb.checked;
    if (cb.checked) inp.value = "";
  }
}
// ====== Init ======
document.addEventListener("DOMContentLoaded", function() {
  loadResume(); initSkillTags(); initDimensionEdit(); initVersionBar();
  document.querySelectorAll(".exp-card input[type='checkbox']").forEach(function(cb) {
    wireEndTimeCheckbox(cb.closest(".exp-card"));
  });

  var saveBtn = document.querySelector(".save-bar .btn-primary");
  if (saveBtn) saveBtn.addEventListener("click", saveResume);
  var cancelBtn = document.querySelector(".save-bar .btn-secondary");
  if (cancelBtn) cancelBtn.addEventListener("click", resetForm);
  var addWork = document.querySelector(".form-section .add-btn");
  if (addWork) addWork.addEventListener("click", addWorkCard);
  document.querySelectorAll(".exp-card .delete").forEach(function(btn) {
    btn.addEventListener("click", function() { deleteCard(this); });
  });
});
// Wire project add button separately
var projSec = document.querySelectorAll(".form-section");
for (var i = 0; i < projSec.length; i++) {
  var pt = projSec[i].querySelector(".form-section-title");
  if (pt && pt.textContent.trim().startsWith("项目经验")) {
    var addProj = projSec[i].querySelector(".add-btn");
    if (addProj) addProj.addEventListener("click", addProjectCard);
    break;
  }
}

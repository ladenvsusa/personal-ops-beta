const storeKey = "personal-os-v3";
const oldStoreKeys = ["personal-os-v2", "personal-os-v1"];
const todayISO = localISODate(new Date());

let state = loadState();
let activeTravelMode = "record";
let activePeopleFilter = "";

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function localISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadState() {
  const saved = localStorage.getItem(storeKey) || oldStoreKeys.map(key => localStorage.getItem(key)).find(Boolean);
  const base = saved ? JSON.parse(saved) : seedState();
  const migrated = migrateState(base);
  localStorage.setItem(storeKey, JSON.stringify(migrated));
  return migrated;
}

function seedState() {
  const now = new Date().toISOString();
  return {
    dashboard: ["steps", "sleep", "weeklyExercise", "daySpend"],
    people: [
      {
        id: id(),
        name: "张三",
        relation: "同事",
        intro: "数据治理协同人",
        likes: "高效沟通",
        events: "第一次会议沟通数据治理工具",
        photos: [],
        updatedAt: now
      }
    ],
    networks: [],
    activeNetworkId: "",
    sport: [],
    studyNotes: "",
    studyIdeas: [],
    work: [
      {
        id: id(),
        title: "数据治理管控工具周例会",
        progress: 30,
        start: todayISO,
        end: todayISO,
        notes: "统一口径、跟踪闭环、收集困难。"
      }
    ],
    recurringTasks: [
      { id: id(), title: "会议材料", ruleType: "weekly", weekday: "4", dayOfMonth: "", notes: "每周四固定提醒" },
      { id: id(), title: "周报", ruleType: "weekly", weekday: "5", dayOfMonth: "", notes: "每周五固定提醒" },
      { id: id(), title: "工单提醒", ruleType: "weekly", weekday: "2", dayOfMonth: "", notes: "每周二固定提醒" },
      { id: id(), title: "专项奖励制作", ruleType: "monthly", weekday: "", dayOfMonth: "18", notes: "每月18号固定提醒" }
    ],
    expenses: [
      { id: id(), date: todayISO, name: "午餐", amount: "14.9", category: "餐饮", account: "手动", status: "已审核", notes: "", photos: [] }
    ],
    trips: []
  };
}

function migrateState(data) {
  data.dashboard ||= ["steps", "sleep", "weeklyExercise", "daySpend"];
  data.people ||= [];
  data.networks ||= [];
  data.sport ||= [];
  data.studyNotes ||= "";
  data.studyIdeas ||= [];
  data.work ||= [];
  data.recurringTasks ||= [];
  data.expenses ||= [];
  data.trips ||= [];

  const now = new Date().toISOString();
  data.people.forEach((person, index) => {
    person.photos ||= [];
    person.updatedAt ||= now;
    person.x ??= 28 + index * 16;
    person.y ??= 28 + index * 16;
  });
  data.expenses.forEach(expense => {
    expense.photos ||= [];
    expense.status ||= "已审核";
  });
  data.trips.forEach((trip, index) => {
    trip.photos ||= [];
    trip.mode ||= "record";
    trip.canvasX ??= 16 + (index % 2) * 246;
    trip.canvasY ??= 16 + Math.floor(index / 2) * 150;
  });

  if (!data.recurringTasks.length) {
    data.recurringTasks = seedState().recurringTasks;
  }

  if (!data.networks.length) {
    const positions = {};
    data.people.forEach((person, index) => {
      positions[person.id] = { x: Number(person.x ?? 28 + index * 16), y: Number(person.y ?? 28 + index * 16) };
    });
    data.networks.push({ id: id(), name: "默认关系网", positions, links: [] });
  }
  data.activeNetworkId ||= data.networks[0]?.id || "";
  return data;
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  renderAll();
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);
  bindTabs();
  bindActions();
  renderAll();
}

function updateClock() {
  const now = new Date();
  const text = now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  document.querySelector("#nowText").textContent = text.replace(/\//g, "-");
}

function bindTabs() {
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
  document.querySelectorAll("[data-tab-target]").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.dataset.tabTarget));
  });
}

function showTab(tab) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.dataset.view === tab));
  document.querySelectorAll("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
}

function bindActions() {
  document.querySelector("#dashboardConfigBtn").addEventListener("click", openDashboardSettings);
  document.querySelector("#exportBtn").addEventListener("click", () => downloadText(`个人运营系统备份-${todayISO}.json`, JSON.stringify(state, null, 2)));

  document.querySelector("#addPersonBtn").addEventListener("click", () => openPersonEditor());
  document.querySelector("#personSearch").addEventListener("input", renderPeople);
  document.querySelector("#personCategory").addEventListener("change", event => {
    activePeopleFilter = event.target.value;
    renderPeople();
  });
  document.querySelector("#clearPeopleFilterBtn").addEventListener("click", () => {
    activePeopleFilter = "";
    document.querySelector("#personCategory").value = "";
    renderPeople();
  });
  document.querySelector("#downloadPeopleTemplate").addEventListener("click", () => {
    downloadText("人物导入模板.csv", "姓名,关系,简介,事件,喜好\n李四,朋友,认识很久,一起吃饭,咖啡\n");
  });
  document.querySelector("#peopleImport").addEventListener("change", importPeople);
  document.querySelector("#networkSelect").addEventListener("change", event => {
    state.activeNetworkId = event.target.value;
    saveState();
  });
  document.querySelector("#addNetworkBtn").addEventListener("click", addNetwork);
  document.querySelector("#addLinkBtn").addEventListener("click", addLink);

  document.querySelector("#saveSportBtn").addEventListener("click", saveSport);
  document.querySelector("#studyNotes").addEventListener("input", event => {
    state.studyNotes = event.target.value;
    localStorage.setItem(storeKey, JSON.stringify(state));
  });
  document.querySelector("#addEnglishIdea").addEventListener("click", saveStudyIdea);

  document.querySelector("#addWorkBtn").addEventListener("click", () => openWorkEditor());
  document.querySelector("#addRecurringBtn").addEventListener("click", () => openRecurringEditor());
  document.querySelector("#generatePromptBtn").addEventListener("click", generateWorkPrompt);

  document.querySelector("#addExpenseBtn").addEventListener("click", () => openExpenseEditor());
  document.querySelector("#quickExpenseBtn").addEventListener("click", quickAddExpense);
  document.querySelector("#downloadExpenseTemplate").addEventListener("click", () => {
    downloadText("流水导入模板.csv", "日期,名称,金额,类别,账户,备注\n2026-07-14,午餐,25,餐饮,微信,\n");
  });
  document.querySelector("#expenseImport").addEventListener("change", importExpenses);
  document.querySelector("#billImage").addEventListener("change", addBillImages);

  document.querySelector("#addTripBtn").addEventListener("click", () => openTripEditor());
  document.querySelectorAll("[data-travel-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTravelMode = btn.dataset.travelMode;
      document.querySelectorAll("[data-travel-mode]").forEach(item => item.classList.toggle("active", item === btn));
      renderTrips();
    });
  });
}

function renderAll() {
  renderDashboard();
  renderPeople();
  renderSport();
  renderStudy();
  renderWork();
  renderFinance();
  renderTrips();
}

function dashboardOptions() {
  const latestSport = state.sport.at(-1) || {};
  const activeTasks = state.work.filter(task => Number(task.progress || 0) < 100);
  return {
    steps: { label: "今日步数", value: `${latestSport.steps || 0}`, note: "步" },
    calories: { label: "热量消耗", value: `${latestSport.calories || 0}`, note: "千卡" },
    sleep: { label: "睡眠", value: latestSport.sleep || "待录入", note: "昨晚" },
    weeklyExercise: { label: "本周运动", value: `${weeklyExerciseMinutes()}`, note: "分钟" },
    sportLoad: { label: "运动负荷", value: latestSport.heart ? `${latestSport.heart}` : "待录入", note: "当前心率" },
    weight: { label: "体重", value: latestSport.weight ? `${latestSport.weight}` : "待录入", note: "kg" },
    daySpend: { label: "日支出", value: money(daySpend(), 0), note: "今天" },
    monthSpend: { label: "月支出", value: money(monthSpend(), 0), note: "本月" },
    activeTasks: { label: "重点任务", value: `${activeTasks.length}`, note: "未完成" }
  };
}

function renderDashboard() {
  const options = dashboardOptions();
  const selected = normalizeDashboard();
  document.querySelector("#dashboardGrid").innerHTML = selected.map(key => {
    const item = options[key] || options.steps;
    return `<article class="metric-card"><span>${item.label}</span><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.note)}</small></article>`;
  }).join("");

  const activeTasks = state.work.filter(task => Number(task.progress || 0) < 100).slice(0, 4);
  document.querySelector("#todayTasks").innerHTML = activeTasks.length
    ? activeTasks.map(task => compactRow(task.title, `${task.progress || 0}% ｜ ${task.end || "未设截止"}`, "work")).join("")
    : `<div class="empty-list">暂无重点任务</div>`;

  const latestSport = state.sport.at(-1);
  const recentTrip = state.trips.at(-1);
  document.querySelector("#recentTimeline").innerHTML = [
    latestSport ? `运动记录更新：${latestSport.date}` : "运动数据待录入",
    activeTasks[0] ? `最近任务：${activeTasks[0].title}` : "工作任务待补充",
    recentTrip ? `出行记录待补充：${recentTrip.name}` : "出行记录待补充"
  ].map(text => `<div class="timeline-item">${escapeHtml(text)}</div>`).join("");
}

function normalizeDashboard() {
  const valid = Object.keys(dashboardOptions());
  const selected = (state.dashboard || []).filter(key => valid.includes(key)).slice(0, 4);
  while (selected.length < 4) selected.push(["steps", "sleep", "weeklyExercise", "daySpend"][selected.length]);
  state.dashboard = selected;
  return selected;
}

function openDashboardSettings() {
  const options = dashboardOptions();
  const selected = normalizeDashboard();
  document.querySelector("#dashboardFields").innerHTML = selected.map((key, index) => `
    <label class="dashboard-setting-row">
      <span>${index + 1}</span>
      <select name="metric${index}">
        ${Object.entries(options).map(([optionKey, option]) => `<option value="${optionKey}" ${optionKey === key ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </label>
  `).join("");
  document.querySelector("#saveDashboardBtn").onclick = event => {
    event.preventDefault();
    const form = new FormData(document.querySelector("#dashboardForm"));
    state.dashboard = [0, 1, 2, 3].map(index => form.get(`metric${index}`));
    saveState();
    document.querySelector("#dashboardDialog").close();
  };
  document.querySelector("#dashboardDialog").showModal();
}

function renderPeople() {
  const relationSelect = document.querySelector("#personCategory");
  const current = activePeopleFilter || relationSelect.value;
  const relations = relationCounts();
  relationSelect.innerHTML = `<option value="">全部关系</option>` + relations.map(item => `<option value="${escapeHtml(item.relation)}" ${item.relation === current ? "selected" : ""}>${escapeHtml(item.relation)}</option>`).join("");

  const recent = [...state.people].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 3);
  document.querySelector("#recentPeople").innerHTML = recent.length
    ? recent.map(person => `<button class="mini-person" onclick="openPersonEditor('${person.id}')"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.relation || "未分类")}</small></button>`).join("")
    : `<div class="empty-list">暂无人物</div>`;

  document.querySelector("#relationStats").innerHTML = relations.slice(0, 3).map(item => `
    <button class="category-card" data-relation="${escapeAttr(item.relation)}">
      <strong>${escapeHtml(item.relation)}</strong>
      <small>${item.count} 人</small>
    </button>
  `).join("") || `<div class="empty-list">暂无分类</div>`;
  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => filterPeopleByRelation(card.dataset.relation));
  });

  const keyword = document.querySelector("#personSearch").value.trim();
  const relation = activePeopleFilter || relationSelect.value;
  const list = state.people.filter(person => {
    const text = [person.name, person.relation, person.intro, person.likes, person.events].join(" ");
    return (!keyword || text.includes(keyword)) && (!relation || person.relation === relation);
  });
  document.querySelector("#peopleListTitle").textContent = relation ? `${relation}（${list.length}人）` : `全部人物（${list.length}人）`;
  document.querySelector("#peopleList").innerHTML = list.map(person => `
    <article class="person-card">
      <h3>${escapeHtml(person.name)}</h3>
      <small>${escapeHtml(person.relation || "未分类")}</small>
      <p>${escapeHtml(person.intro || "")}</p>
      ${renderPhotos(person.photos)}
      <div class="tag-row">
        ${(person.likes || "").split(/[，,]/).filter(Boolean).slice(0, 4).map(item => `<span class="tag">${escapeHtml(item.trim())}</span>`).join("")}
      </div>
      <button onclick="openPersonEditor('${person.id}')">编辑</button>
    </article>
  `).join("") || `<div class="empty-list">暂无人物</div>`;

  renderNetworkControls();
  renderRelationshipMap();
}

function relationCounts() {
  const map = new Map();
  state.people.forEach(person => {
    const relation = person.relation || "未分类";
    map.set(relation, (map.get(relation) || 0) + 1);
  });
  return [...map.entries()].map(([relation, count]) => ({ relation, count })).sort((a, b) => b.count - a.count);
}

function filterPeopleByRelation(relation) {
  activePeopleFilter = relation;
  document.querySelector("#personCategory").value = relation;
  renderPeople();
}

function renderNetworkControls() {
  const active = getActiveNetwork();
  document.querySelector("#networkSelect").innerHTML = state.networks.map(network => `<option value="${network.id}" ${network.id === active.id ? "selected" : ""}>${escapeHtml(network.name)}</option>`).join("");
  const options = state.people.map(person => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join("");
  document.querySelector("#linkFrom").innerHTML = options;
  document.querySelector("#linkTo").innerHTML = options;
}

function getActiveNetwork() {
  let network = state.networks.find(item => item.id === state.activeNetworkId);
  if (!network) {
    network = state.networks[0] || { id: id(), name: "默认关系网", positions: {}, links: [] };
    state.networks = [network];
    state.activeNetworkId = network.id;
  }
  network.positions ||= {};
  network.links ||= [];
  return network;
}

function addNetwork() {
  const name = prompt("给这张关系网起个名字", `关系网${state.networks.length + 1}`);
  if (!name) return;
  const positions = {};
  state.people.forEach((person, index) => {
    positions[person.id] = { x: 28 + index * 20, y: 28 + index * 20 };
  });
  const network = { id: id(), name, positions, links: [] };
  state.networks.push(network);
  state.activeNetworkId = network.id;
  saveState();
}

function addLink() {
  const from = document.querySelector("#linkFrom").value;
  const to = document.querySelector("#linkTo").value;
  const label = document.querySelector("#linkLabel").value.trim();
  if (!from || !to || from === to) return;
  const network = getActiveNetwork();
  const exists = network.links.some(link => link.from === from && link.to === to && link.label === label);
  if (!exists) network.links.push({ id: id(), from, to, label });
  document.querySelector("#linkLabel").value = "";
  saveState();
}

function renderRelationshipMap() {
  const network = getActiveNetwork();
  const map = document.querySelector("#relationshipMap");
  const lines = network.links.map(link => {
    const a = getPosition(link.from);
    const b = getPosition(link.to);
    const x1 = a.x + 63;
    const y1 = a.y + 30;
    const x2 = b.x + 63;
    const y2 = b.y + 30;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>${link.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}">${escapeHtml(link.label)}</text>` : ""}`;
  }).join("");
  const nodes = state.people.map((person, index) => {
    const pos = getPosition(person.id, index);
    return `<div class="map-node" data-id="${person.id}" style="left:${pos.x}px;top:${pos.y}px"><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.relation || "未分类")}</small></div>`;
  }).join("");
  map.innerHTML = `<svg class="map-lines">${lines}</svg>${nodes}`;
  map.querySelectorAll(".map-node").forEach(node => node.addEventListener("pointerdown", startDragNode));
}

function getPosition(personId, fallbackIndex = 0) {
  const network = getActiveNetwork();
  if (!network.positions[personId]) {
    network.positions[personId] = { x: 28 + fallbackIndex * 20, y: 28 + fallbackIndex * 20 };
  }
  return network.positions[personId];
}

function startDragNode(event) {
  const node = event.currentTarget;
  node.setPointerCapture(event.pointerId);
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = parseFloat(node.style.left);
  const initialY = parseFloat(node.style.top);
  const move = moveEvent => {
    node.style.left = `${Math.max(0, initialX + moveEvent.clientX - startX)}px`;
    node.style.top = `${Math.max(0, initialY + moveEvent.clientY - startY)}px`;
  };
  const end = () => {
    getActiveNetwork().positions[node.dataset.id] = { x: parseFloat(node.style.left), y: parseFloat(node.style.top) };
    localStorage.setItem(storeKey, JSON.stringify(state));
    renderRelationshipMap();
    node.removeEventListener("pointermove", move);
    node.removeEventListener("pointerup", end);
  };
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", end);
}

function renderSport() {
  const latest = state.sport.at(-1) || {};
  const mapping = { height: "height", weight: "weight", heart: "heart", steps: "steps", calorie: "calories", exerciseMinutes: "minutes", sleep: "sleep" };
  Object.entries(mapping).forEach(([input, key]) => {
    const el = document.querySelector(`#${input}Input`);
    if (el && document.activeElement !== el) el.value = latest[key] || "";
  });
  document.querySelector("#sportHistory").innerHTML = state.sport.slice().reverse().map(record => compactRow(record.date, `体重 ${record.weight || "-"}kg ｜ 心率 ${record.heart || "-"} ｜ ${record.steps || 0}步 ｜ ${record.minutes || 0}分钟`, "sport")).join("") || `<div class="empty-list">暂无运动记录</div>`;
  drawWeightChart();
}

function drawWeightChart() {
  const canvas = document.querySelector("#weightChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#dce4df";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 24 + i * 38;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(canvas.width - 24, y);
    ctx.stroke();
  }
  const points = state.sport.filter(item => item.weight).slice(-12);
  if (points.length < 2) {
    ctx.fillStyle = "#68746f";
    ctx.fillText("录入两次以上体重后显示趋势", 36, 108);
    return;
  }
  const weights = points.map(item => Number(item.weight));
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  ctx.strokeStyle = "#1f7a5c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = 36 + index * ((canvas.width - 72) / (points.length - 1));
    const y = 190 - ((Number(point.weight) - min) / (max - min)) * 150;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function saveSport() {
  state.sport.push({
    id: id(),
    date: todayISO,
    height: value("#heightInput"),
    weight: value("#weightInput"),
    heart: value("#heartInput"),
    steps: value("#stepsInput"),
    calories: value("#calorieInput"),
    minutes: value("#exerciseMinutesInput"),
    sleep: value("#sleepInput")
  });
  saveState();
}

function renderStudy() {
  document.querySelector("#studyNotes").value = state.studyNotes || "";
  document.querySelector("#studyIdeaHistory").innerHTML = state.studyIdeas.slice().reverse().map(idea => compactRow(idea.text, formatDateTime(idea.createdAt), "study")).join("") || `<div class="empty-list">暂无想法历史</div>`;
}

function saveStudyIdea() {
  const text = document.querySelector("#studyNotes").value.trim();
  const feedback = document.querySelector("#studyFeedback");
  if (!text) {
    feedback.textContent = "先写一点想法，再点记录。";
    return;
  }
  state.studyIdeas.push({ id: id(), text, createdAt: new Date().toISOString() });
  state.studyNotes = "";
  feedback.textContent = "已记录到想法历史。";
  saveState();
  setTimeout(() => { feedback.textContent = ""; }, 1800);
}

function renderWork() {
  const sorted = [...state.work].sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0));
  document.querySelector("#workList").innerHTML = sorted.map(task => `
    <article class="work-item compact-work">
      <div class="compact-row">
        <div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.end || "未设截止")} ｜ ${Number(task.progress || 0)}%</small></div>
        <button onclick="openWorkEditor('${task.id}')">编辑</button>
      </div>
      <div class="progress"><i style="width:${Number(task.progress || 0)}%"></i></div>
      ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ""}
    </article>
  `).join("") || `<div class="empty-list">暂无工作任务</div>`;

  document.querySelector("#recurringList").innerHTML = state.recurringTasks.map(item => compactRow(item.title, `${recurringText(item)} ｜ ${item.notes || ""}`, "repeat", `<button onclick="openRecurringEditor('${item.id}')">编辑</button>`)).join("") || `<div class="empty-list">暂无固定提醒</div>`;
}

function recurringText(item) {
  if (item.ruleType === "monthly") return `每月${item.dayOfMonth || "-"}号`;
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `每${names[Number(item.weekday || 1)]}`;
}

function generateWorkPrompt() {
  const start = value("#workStart");
  const end = value("#workEnd");
  const rows = state.work.filter(task => {
    const taskStart = task.start || task.end || "";
    const taskEnd = task.end || task.start || "";
    return (!start || taskEnd >= start) && (!end || taskStart <= end);
  });
  const text = `请根据以下工作任务，帮我生成一份阶段性工作总结，要求：突出重点工作、完成进度、问题困难、下一步计划，语气务实，适合单位内部汇报。\n\n时间范围：${start || "未限定"} 至 ${end || "未限定"}\n\n任务清单：\n${rows.map((task, index) => `${index + 1}. ${task.title}，进度${task.progress || 0}%，时间：${task.start || ""}至${task.end || ""}，说明：${task.notes || ""}`).join("\n")}`;
  document.querySelector("#promptOutput").value = text;
}

function renderFinance() {
  document.querySelector("#daySpend").textContent = money(daySpend(), 2);
  document.querySelector("#monthSpend").textContent = money(monthSpend(), 2);
  renderFinanceWeekChart();
  document.querySelector("#expenseList").innerHTML = state.expenses.slice().reverse().map(expense => `
    <article class="expense-card">
      <h3>${escapeHtml(expense.name)}</h3>
      <small>${escapeHtml(expense.date || "")} ｜ ${escapeHtml(expense.category || "未分类")} ｜ ${escapeHtml(expense.account || "")}</small>
      ${renderPhotos(expense.photos)}
      <div class="tag-row">
        <span class="tag">${money(expense.amount, 2)}</span>
        <span class="tag">${escapeHtml(expense.status || "已审核")}</span>
        <button onclick="openExpenseEditor('${expense.id}')">编辑</button>
      </div>
    </article>
  `).join("") || `<div class="empty-list">暂无流水</div>`;
}

function quickAddExpense() {
  const name = value("#quickExpenseName").trim();
  const amount = value("#quickExpenseAmount");
  const category = value("#quickExpenseCategory");
  if (!name || !amount) return;
  state.expenses.push({ id: id(), date: todayISO, name, amount, category, account: "手动", status: "已审核", notes: "", photos: [] });
  document.querySelector("#quickExpenseName").value = "";
  document.querySelector("#quickExpenseAmount").value = "";
  saveState();
}

function renderFinanceWeekChart() {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const iso = localISODate(date);
    const sum = state.expenses.filter(expense => expense.date === iso && expense.status !== "待补全").reduce((acc, expense) => acc + Number(expense.amount || 0), 0);
    return { iso, sum, label: date.toLocaleDateString("zh-CN", { weekday: "short" }) };
  });
  const max = Math.max(...days.map(day => day.sum), 1);
  document.querySelector("#weekSpendTotal").textContent = `总计 ${money(days.reduce((acc, day) => acc + day.sum, 0), 2)}`;
  document.querySelector("#financeWeekChart").innerHTML = days.map(day => `
    <div class="bar-item">
      <small>${day.sum ? money(day.sum, 0) : ""}</small>
      <div class="bar" style="height:${Math.max(6, Math.round(day.sum / max * 120))}px"></div>
      <span>${day.label}</span>
    </div>
  `).join("");
}

function renderTrips() {
  const rows = state.trips.filter(trip => trip.mode === activeTravelMode);
  document.querySelector("#tripCanvas").innerHTML = rows.map((trip, index) => {
    trip.canvasX ??= 16 + (index % 2) * 246;
    trip.canvasY ??= 16 + Math.floor(index / 2) * 150;
    return `
      <article class="canvas-card" data-id="${trip.id}" style="transform:translate(${trip.canvasX}px, ${trip.canvasY}px)">
        <h3>${escapeHtml(trip.name || "未命名出行")}</h3>
        <small>${escapeHtml(trip.category || "未分类")} ｜ ${escapeHtml(trip.location || "未定位")}</small>
        <p>${escapeHtml(trip.start || "")} 至 ${escapeHtml(trip.end || "")}</p>
        ${trip.feishuUrl ? `<a href="${escapeAttr(trip.feishuUrl)}" target="_blank">飞书文档</a>` : "<small>未链接飞书文档</small>"}
      </article>
    `;
  }).join("") || `<div class="empty-list">暂无${activeTravelMode === "record" ? "出行记录" : "出行规划"}</div>`;
  document.querySelectorAll(".canvas-card").forEach(card => card.addEventListener("pointerdown", startTripDrag));

  document.querySelector("#tripList").innerHTML = rows.map(trip => `
    <article class="trip-card">
      <h3>${escapeHtml(trip.name)}</h3>
      <small>${escapeHtml(trip.category || "")} ｜ ${escapeHtml(trip.location || "")}</small>
      <p>${escapeHtml(trip.start || "")} 至 ${escapeHtml(trip.end || "")}</p>
      ${renderPhotos(trip.photos)}
      <div class="tag-row">
        ${trip.feishuUrl ? `<a class="tag" href="${escapeAttr(trip.feishuUrl)}" target="_blank">飞书文档</a>` : ""}
        <button onclick="openTripEditor('${trip.id}')">编辑</button>
      </div>
    </article>
  `).join("") || `<div class="empty-list">暂无${activeTravelMode === "record" ? "出行记录" : "出行规划"}</div>`;
}

function startTripDrag(event) {
  const card = event.currentTarget;
  card.setPointerCapture(event.pointerId);
  const trip = state.trips.find(item => item.id === card.dataset.id);
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = Number(trip.canvasX || 0);
  const initialY = Number(trip.canvasY || 0);
  const move = moveEvent => {
    trip.canvasX = Math.max(0, initialX + moveEvent.clientX - startX);
    trip.canvasY = Math.max(0, initialY + moveEvent.clientY - startY);
    card.style.transform = `translate(${trip.canvasX}px, ${trip.canvasY}px)`;
  };
  const end = () => {
    localStorage.setItem(storeKey, JSON.stringify(state));
    card.removeEventListener("pointermove", move);
    card.removeEventListener("pointerup", end);
  };
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", end);
}

function openPersonEditor(personId) {
  const item = state.people.find(person => person.id === personId) || {};
  openEditor("人物", [
    field("姓名", "name", item.name),
    field("关系", "relation", item.relation),
    field("简介", "intro", item.intro, "textarea"),
    field("事件", "events", item.events, "textarea"),
    field("喜好", "likes", item.likes),
    field("照片", "photos", item.photos || [], "files")
  ], values => {
    values.updatedAt = new Date().toISOString();
    if (personId) Object.assign(item, values);
    else {
      const person = { id: id(), ...values };
      state.people.push(person);
      state.networks.forEach((network, index) => {
        network.positions ||= {};
        network.positions[person.id] = { x: 32 + index * 18, y: 32 + index * 18 };
      });
    }
    saveState();
  });
}

function openWorkEditor(workId) {
  const item = state.work.find(task => task.id === workId) || {};
  openEditor("工作任务", [
    field("任务名称", "title", item.title),
    field("开始日期", "start", item.start, "date"),
    field("结束日期", "end", item.end, "date"),
    field("完成进度", "progress", item.progress, "number"),
    field("事项说明", "notes", item.notes, "textarea")
  ], values => {
    if (workId) Object.assign(item, values);
    else state.work.push({ id: id(), ...values });
    saveState();
  });
}

function openRecurringEditor(taskId) {
  const item = state.recurringTasks.find(task => task.id === taskId) || {};
  openEditor("周期任务", [
    field("任务名称", "title", item.title),
    field("规则类型", "ruleType", item.ruleType || "weekly", "select", [["weekly", "每周"], ["monthly", "每月"]]),
    field("星期", "weekday", item.weekday || "4", "select", [["1", "周一"], ["2", "周二"], ["3", "周三"], ["4", "周四"], ["5", "周五"], ["6", "周六"], ["0", "周日"]]),
    field("每月几号", "dayOfMonth", item.dayOfMonth || "", "number"),
    field("备注", "notes", item.notes, "textarea")
  ], values => {
    if (taskId) Object.assign(item, values);
    else state.recurringTasks.push({ id: id(), ...values });
    saveState();
  });
}

function openExpenseEditor(expenseId) {
  const item = state.expenses.find(expense => expense.id === expenseId) || {};
  openEditor("消费流水", [
    field("日期", "date", item.date || todayISO, "date"),
    field("名称", "name", item.name),
    field("金额", "amount", item.amount, "number"),
    field("类别", "category", item.category),
    field("账户", "account", item.account),
    field("状态", "status", item.status || "已审核"),
    field("照片", "photos", item.photos || [], "files"),
    field("备注", "notes", item.notes, "textarea")
  ], values => {
    if (expenseId) Object.assign(item, values);
    else state.expenses.push({ id: id(), ...values });
    saveState();
  });
}

function openTripEditor(tripId) {
  const item = state.trips.find(trip => trip.id === tripId) || {};
  openEditor(activeTravelMode === "record" ? "出行记录" : "出行规划", [
    field("名称", "name", item.name),
    field("分类", "category", item.category),
    field("地图定位", "location", item.location),
    field("开始时间", "start", item.start, "datetime-local"),
    field("结束时间", "end", item.end, "datetime-local"),
    field("飞书文档链接", "feishuUrl", item.feishuUrl),
    field("照片", "photos", item.photos || [], "files"),
    field("备注", "notes", item.notes, "textarea")
  ], values => {
    if (tripId) Object.assign(item, values);
    else state.trips.push({ id: id(), mode: activeTravelMode, canvasX: 16, canvasY: 16, ...values });
    saveState();
  });
}

function field(label, name, val = "", type = "text", options = []) {
  return { label, name, val, type, options };
}

function openEditor(title, fields, onSave) {
  const dialog = document.querySelector("#editorDialog");
  document.querySelector("#dialogTitle").textContent = title;
  document.querySelector("#editorFields").innerHTML = fields.map(renderField).join("");
  document.querySelector("#saveDialogBtn").onclick = async event => {
    event.preventDefault();
    const form = document.querySelector("#editorForm");
    const values = Object.fromEntries(new FormData(form).entries());
    for (const item of fields.filter(fieldItem => fieldItem.type === "files")) {
      const input = form.querySelector(`input[name="${item.name}"]`);
      const oldPhotos = Array.isArray(item.val) ? item.val : [];
      const newPhotos = await readImageFiles(input.files);
      values[item.name] = [...oldPhotos, ...newPhotos];
    }
    onSave(values);
    dialog.close();
  };
  dialog.showModal();
}

function renderField(item) {
  if (item.type === "textarea") {
    return `<label class="wide">${item.label}<textarea name="${item.name}">${escapeHtml(item.val || "")}</textarea></label>`;
  }
  if (item.type === "files") {
    return `<label class="wide">${item.label}<span class="upload-box"><input name="${item.name}" type="file" accept="image/*" multiple><span>上传照片</span></span>${renderPhotos(item.val)}</label>`;
  }
  if (item.type === "select") {
    return `<label>${item.label}<select name="${item.name}">${item.options.map(([value, label]) => `<option value="${value}" ${String(item.val) === String(value) ? "selected" : ""}>${label}</option>`).join("")}</select></label>`;
  }
  return `<label>${item.label}<input name="${item.name}" type="${item.type}" value="${escapeHtml(item.val || "")}"></label>`;
}

function renderPhotos(photos = []) {
  if (!Array.isArray(photos) || !photos.length) return "";
  return `<div class="photo-strip">${photos.slice(0, 6).map(photo => `<img src="${photo.data}" alt="${escapeHtml(photo.name || "照片")}">`).join("")}</div>`;
}

function readImageFiles(files) {
  return Promise.all([...files].map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve({ id: id(), name: file.name, type: file.type, data: reader.result });
    reader.readAsDataURL(file);
  })));
}

function importPeople(event) {
  readCsv(event.target.files[0], rows => {
    rows.forEach(row => {
      const person = { id: id(), name: row[0], relation: row[1], intro: row[2], events: row[3], likes: row[4], photos: [], updatedAt: new Date().toISOString() };
      state.people.push(person);
      state.networks.forEach((network, index) => {
        network.positions ||= {};
        network.positions[person.id] = { x: 32 + index * 18, y: 32 + index * 18 };
      });
    });
    saveState();
  });
}

function importExpenses(event) {
  readCsv(event.target.files[0], rows => {
    rows.forEach(row => state.expenses.push({ id: id(), date: row[0], name: row[1], amount: row[2], category: row[3], account: row[4], notes: row[5], status: "已审核", photos: [] }));
    saveState();
  });
}

async function addBillImages(event) {
  const photos = await readImageFiles(event.target.files);
  photos.forEach(photo => {
    state.expenses.push({ id: id(), date: todayISO, name: `截图待识别：${photo.name}`, amount: 0, category: "待分类", account: "截图", status: "待补全", photos: [photo] });
  });
  saveState();
}

function readCsv(file, done) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const lines = String(reader.result).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(1);
    done(lines.map(line => line.split(",").map(item => item.trim())));
  };
  reader.readAsText(file, "utf-8");
}

function compactRow(title, subtitle, type = "", action = "") {
  return `<div class="compact-row ${type}"><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></div>${action}</div>`;
}

function weeklyExerciseMinutes() {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startISO = localISODate(start);
  return state.sport.filter(item => item.date >= startISO).reduce((sum, item) => sum + Number(item.minutes || 0), 0);
}

function daySpend() {
  return state.expenses.filter(expense => expense.date === todayISO && expense.status !== "待补全").reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function monthSpend() {
  const month = todayISO.slice(0, 7);
  return state.expenses.filter(expense => (expense.date || "").startsWith(month) && expense.status !== "待补全").reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function money(number, digits = 0) {
  return `${Number(number || 0).toFixed(digits)} 元`;
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

function value(selector) {
  return document.querySelector(selector).value;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

init();

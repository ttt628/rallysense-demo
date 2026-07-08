const state = {
  view: "today",
  watch: "home",
  recording: false,
  strokes: 734,
  fastStrokes: 186,
  intenseRallies: 21,
  keyRallies: 5,
  calories: 438,
  avgHeartRate: 149,
  handMode: "overview",
  handStats: {
    forehand: 62,
    backhand: 38,
    forehandStable: 82,
    backhandStable: 68,
    backhandLateDrop: 14
  },
  score: [
    { me: 21, opponent: 17 },
    { me: 18, opponent: 21 },
    { me: 21, opponent: 16 }
  ],
  feed: ["已加载最近一场复盘报告", "Watch 数据同步完成"],
  selectedTag: "被动防守",
  adviceReady: true
};

const views = {
  today: { title: "今日复盘", render: renderToday },
  watch: { title: "Watch 记录", render: renderWatchGuide },
  score: { title: "局末快录", render: renderScore },
  rallies: { title: "关键回合", render: renderRallies },
  hand: { title: "正反手分析", render: renderHand },
  training: { title: "训练建议", render: renderTraining },
  history: { title: "历史趋势", render: renderHistory },
  settings: { title: "设置", render: renderSettings }
};

const phoneScreen = document.querySelector("#phoneScreen");
const watchScreen = document.querySelector("#watchScreen");
const viewTitle = document.querySelector("#viewTitle");
const toast = document.querySelector("#toast");
const eventFeed = document.querySelector("#eventFeed");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modalTitle");
const modalKicker = document.querySelector("#modalKicker");
const modalBody = document.querySelector("#modalBody");

function scoresText() {
  return state.score.map((set) => `${set.me}:${set.opponent}`).join(" / ");
}

function matchResult() {
  const wins = state.score.filter((set) => set.me > set.opponent).length;
  return `${wins}:${state.score.length - wins} ${wins >= 2 ? "获胜" : "待追分"}`;
}

function addFeed(message) {
  state.feed.unshift(message);
  state.feed = state.feed.slice(0, 6);
  renderFeed();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function openModal({ kicker, title, body }) {
  modalKicker.textContent = kicker;
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function switchView(name) {
  state.view = name;
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });
  viewTitle.textContent = views[name].title;
  render();
}

function switchWatch(name) {
  state.watch = name;
  document.querySelectorAll("[data-watch]").forEach((button) => {
    button.classList.toggle("active", button.dataset.watch === name);
  });
  renderWatch();
}

function render() {
  phoneScreen.innerHTML = views[state.view].render();
  bindPhoneActions();
  renderWatch();
  renderFeed();
}

function renderFeed() {
  eventFeed.innerHTML = state.feed.map((item) => `<li>${item}</li>`).join("");
}

function renderToday() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">赛后报告</p>
        <h2>${matchResult()}</h2>
      </div>
      <span class="badge">67 min</span>
    </div>

    <section class="hero-card">
      <p>本场羽毛球复盘</p>
      <h2 style="font-size:34px;margin-top:6px">${scoresText()}</h2>
      <div class="scoreline">${state.score.map((set, index) => `<span>第${index + 1}局 ${set.me}:${set.opponent}</span>`).join("")}</div>
    </section>

    <section class="metric-grid">
      ${metric("总挥拍", state.strokes, "次")}
      ${metric("快速挥拍", state.fastStrokes, "次")}
      ${metric("消耗热量", state.calories, "kcal")}
      ${metric("平均心率", state.avgHeartRate, "bpm")}
      ${metric("高强度回合", state.intenseRallies, "段")}
      ${metric("关键标记", state.keyRallies, "个")}
    </section>

    <section class="insight-card">
      <div class="panel-head">
        <h3>本场观察</h3>
        <button class="mini-button" data-action="advice">生成建议</button>
      </div>
      <p>第二局后半段快速挥拍占比下降，同时心率持续处于高区间，可能出现体能回落。第三局中后段挥拍频率恢复，连续高强度回合减少，表现更稳定。</p>
    </section>

    <section class="panel hand-preview">
      <div class="panel-head">
        <h3>正反手概览</h3>
        <button class="mini-button" data-action="hand">查看详情</button>
      </div>
      ${handSplit()}
      <p class="muted">反手稳定性低于正手，且第二局后半段反手回球质量下降更明显。</p>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>分局强度</h3>
        <div class="segmented">
          <button class="active" data-chart="strokes">挥拍</button>
          <button data-chart="heart">心率</button>
          <button data-chart="fast">快速占比</button>
          <button data-chart="calories">热量</button>
        </div>
      </div>
      <div id="chartPanel">${chart("strokes")}</div>
    </section>
  `;
}

function renderWatchGuide() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">低打扰记录</p>
        <h2>${state.recording ? "记录进行中" : "准备开始"}</h2>
      </div>
      <span class="badge">${state.recording ? "Live" : "Ready"}</span>
    </div>

    <section class="hero-card">
      <p>Apple Watch 负责采集手腕运动、心率、热量和轻量操作。</p>
      <h2 style="font-size:32px;margin-top:8px">${state.recording ? "42:18 正在记录" : "点击开始一场球"}</h2>
      <div class="scoreline">
        <span>持拍手佩戴</span>
        <span>热量 ${state.calories} kcal</span>
        <span>局末录比分</span>
      </div>
    </section>

    <section class="timeline-card">
      <h3>记录流程</h3>
      <div class="timeline-list" style="margin-top:12px">
        ${flowItem("1", "开始羽毛球", "确认持拍手和计分方式")}
        ${flowItem("2", "自动采集", "心率、热量、挥拍候选、高强度片段")}
        ${flowItem("3", "偶尔操作", "双指互点保存刚才这一分")}
        ${flowItem("4", "结束运动", "同步到 iPhone 生成复盘")}
      </div>
    </section>
  `;
}

function renderScore() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">局末快录</p>
        <h2>不用逐分计分</h2>
      </div>
      <button class="mini-button" data-action="score">录入比分</button>
    </div>

    <section class="panel">
      <h3>比分记录</h3>
      <div class="timeline-list" style="margin-top:12px">
        ${state.score.map((set, index) => `
          <div class="score-item">
            <div>
              <strong>第${index + 1}局</strong>
              <p class="muted">绑定该局心率、热量、挥拍和关键回合</p>
            </div>
            <strong>${set.me}:${set.opponent}</strong>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="insight-card">
      <h3>为什么这样设计</h3>
      <p>MVP 不要求用户每一分都操作手表，只在局末补比分，尽量不破坏打球节奏。比分会和该局时间段的运动数据绑定，用于赛后解释。</p>
    </section>
  `;
}

function renderRallies() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">关键回合</p>
        <h2>${state.keyRallies} 个已保存片段</h2>
      </div>
      <button class="mini-button" data-action="mark">保存回合</button>
    </div>

    <div class="court-mini">
      <span class="rally-dot" style="left:22%;top:58%"></span>
      <span class="rally-dot" style="left:68%;top:30%;animation-delay:.45s"></span>
      <span class="rally-dot" style="left:50%;top:74%;animation-delay:.9s"></span>
    </div>

    <section class="timeline-card">
      <div class="panel-head">
        <h3>回合列表</h3>
        <button class="mini-button" data-action="tag">补标签</button>
      </div>
      <div class="timeline-list">
        ${rallyItem("第二局 15:20", "18 秒 · 6 拍 · 被动防守")}
        ${rallyItem("第三局 08:42", "9 秒 · 4 拍 · 好球")}
        ${rallyItem("第三局 12:08", "22 秒 · 8 拍 · 多拍相持")}
      </div>
    </section>
  `;
}

function renderHand() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">Shot Type Review</p>
        <h2>正反手分析</h2>
      </div>
      <span class="badge">反手需加强</span>
    </div>

    <section class="hero-card hand-hero">
      <p>本场挥拍结构</p>
      <h2 style="font-size:34px;margin-top:6px">正手 ${state.handStats.forehand}% / 反手 ${state.handStats.backhand}%</h2>
      <div class="scoreline">
        <span>正手稳定 ${state.handStats.forehandStable}%</span>
        <span>反手稳定 ${state.handStats.backhandStable}%</span>
        <span>后半段下降 ${state.handStats.backhandLateDrop}%</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>挥拍类型占比</h3>
        <div class="segmented">
          <button class="${state.handMode === "overview" ? "active" : ""}" data-hand-mode="overview">总览</button>
          <button class="${state.handMode === "sets" ? "active" : ""}" data-hand-mode="sets">分局</button>
          <button class="${state.handMode === "advice" ? "active" : ""}" data-hand-mode="advice">建议</button>
        </div>
      </div>
      <div id="handPanel">${handPanel()}</div>
    </section>

    <section class="insight-card">
      <h3>分析结论</h3>
      <p>本场正手使用占比更高，稳定性也更好。反手在第二局后半段随心率升高出现明显波动，建议下次训练加入反手连续防守和反手过渡球练习。</p>
      <div class="tag-row">
        <span class="tag">反手过渡</span>
        <span class="tag">连续防守</span>
        <span class="tag">后半段稳定性</span>
      </div>
    </section>
  `;
}

function renderTraining() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">训练建议</p>
        <h2>${state.adviceReady ? "已生成建议" : "等待生成"}</h2>
      </div>
      <button class="mini-button" data-action="advice">重新生成</button>
    </div>

    <section class="insight-card">
      <h3>下次训练重点</h3>
      <p>本场第二局后半段快速挥拍占比下降，反手稳定性也同步下降。下次可关注后半段体能保持，增加多拍防守、后场高远球和反手过渡球练习。</p>
      <div class="tag-row">
        <span class="tag">后半段体能</span>
        <span class="tag">多拍防守</span>
        <span class="tag">防守转进攻</span>
        <span class="tag">反手稳定性</span>
      </div>
    </section>

    <section class="panel">
      <h3>建议训练组</h3>
      ${flowItem("A", "多拍相持 4 组", "每组 90 秒，关注连续移动后的出球质量")}
      ${flowItem("B", "后场高远球 6 组", "每组 12 球，保持落点深度和节奏")}
      ${flowItem("C", "防守转进攻 5 组", "从被动挑球切换到主动压网")}
      ${flowItem("D", "反手连续防守 4 组", "每组 10 球，观察反手回球稳定性和回位速度")}
    </section>
  `;
}

function renderHistory() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">历史趋势</p>
        <h2>近 4 场训练</h2>
      </div>
      <span class="badge">+12% 挥拍量</span>
    </div>

    <section class="panel">
      <div class="bar-row"><span>本场</span><div class="bar-track"><div class="bar-fill" style="--value:92%"></div></div><strong>734</strong></div>
      <div class="bar-row"><span>上场</span><div class="bar-track"><div class="bar-fill" style="--value:78%"></div></div><strong>655</strong></div>
      <div class="bar-row"><span>第 3 场</span><div class="bar-track"><div class="bar-fill" style="--value:74%"></div></div><strong>621</strong></div>
      <div class="bar-row"><span>第 4 场</span><div class="bar-track"><div class="bar-fill" style="--value:66%"></div></div><strong>586</strong></div>
    </section>

    <section class="panel">
      <h3>热量趋势</h3>
      <div class="bar-row"><span>本场</span><div class="bar-track"><div class="bar-fill calories-fill" style="--value:88%"></div></div><strong>438</strong></div>
      <div class="bar-row"><span>上场</span><div class="bar-track"><div class="bar-fill calories-fill" style="--value:82%"></div></div><strong>410</strong></div>
      <div class="bar-row"><span>第 3 场</span><div class="bar-track"><div class="bar-fill calories-fill" style="--value:75%"></div></div><strong>376</strong></div>
    </section>

    <section class="insight-card">
      <h3>趋势观察</h3>
      <p>训练量和热量消耗稳步上升，高强度回合均值增加。建议继续观察后半段快速挥拍占比和反手稳定性，避免只增加训练量而忽略击球质量。</p>
    </section>
  `;
}

function renderSettings() {
  return `
    <div class="app-header">
      <div>
        <p class="eyebrow">设置</p>
        <h2>记录偏好</h2>
      </div>
      <span class="badge">MVP</span>
    </div>

    <section class="panel">
      ${settingRow("持拍手", "右手", "切换")}
      ${settingRow("计分方式", "局末快录", "查看")}
      ${settingRow("基础热量", "保留 Apple Watch 活动能量估算", "查看")}
      ${settingRow("正反手分析", "基于持拍手运动方向估算", "测试")}
      ${settingRow("关键回合", "双指互点", "测试")}
      ${settingRow("数据权限", "健康与运动数据", "管理")}
    </section>
  `;
}

function metric(label, value, unit) {
  return `<article class="metric-card"><strong>${value}</strong><span>${label} · ${unit}</span></article>`;
}

function chart(type) {
  const data = {
    strokes: [["第一局", 186, "70%"], ["第二局", 264, "100%"], ["第三局", 231, "88%"]],
    heart: [["第一局", 143, "78%"], ["第二局", 153, "92%"], ["第三局", 149, "86%"]],
    fast: [["第一局", "28%", "88%"], ["第二局", "21%", "66%"], ["第三局", "25%", "78%"]],
    calories: [["第一局", 126, "76%"], ["第二局", 168, "100%"], ["第三局", 144, "86%"]]
  };
  return data[type].map(([label, value, width]) => `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill ${type === "calories" ? "calories-fill" : ""}" style="--value:${width}"></div></div>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function handSplit() {
  return `
    <div class="hand-split">
      <div class="hand-ring" style="--forehand:${state.handStats.forehand}%">
        <span>${state.handStats.forehand}%</span>
      </div>
      <div class="hand-bars">
        <div class="bar-row"><span>正手</span><div class="bar-track"><div class="bar-fill" style="--value:${state.handStats.forehand}%"></div></div><strong>${state.handStats.forehand}%</strong></div>
        <div class="bar-row"><span>反手</span><div class="bar-track"><div class="bar-fill hand-backhand" style="--value:${state.handStats.backhand}%"></div></div><strong>${state.handStats.backhand}%</strong></div>
      </div>
    </div>
  `;
}

function handPanel() {
  if (state.handMode === "sets") {
    return `
      <div class="bar-row"><span>第一局</span><div class="bar-track"><div class="bar-fill hand-backhand" style="--value:34%"></div></div><strong>34%</strong></div>
      <div class="bar-row"><span>第二局</span><div class="bar-track"><div class="bar-fill hand-backhand" style="--value:43%"></div></div><strong>43%</strong></div>
      <div class="bar-row"><span>第三局</span><div class="bar-track"><div class="bar-fill hand-backhand" style="--value:36%"></div></div><strong>36%</strong></div>
      <p class="muted">第二局反手使用比例最高，但稳定性最低，可能和长回合中的被动防守有关。</p>
    `;
  }
  if (state.handMode === "advice") {
    return `
      ${flowItem("1", "反手过渡球", "连续 10 球保持中后场落点，不追求发力")}
      ${flowItem("2", "反手防守转正手", "反手挑球后快速回位，准备下一拍正手进攻")}
      ${flowItem("3", "后半段反手质量", "训练末段单独记录反手失误和不到位次数")}
    `;
  }
  return handSplit();
}

function flowItem(index, title, desc) {
  return `<div class="feed-item"><div><strong>${index}. ${title}</strong><p>${desc}</p></div><span class="tag">完成</span></div>`;
}

function rallyItem(title, desc) {
  return `<div class="timeline-item"><div><strong>${title}</strong><p>${desc}</p></div><button class="mini-button" data-action="tag">标记</button></div>`;
}

function settingRow(label, value, action) {
  return `<div class="setting-row"><div><strong>${label}</strong><p class="muted">${value}</p></div><button class="mini-button" data-action="setting">${action}</button></div>`;
}

function renderWatch() {
  const screens = {
    home: `
      <div class="watch-title">RallySense</div>
      <p style="color:#9fb0a7;line-height:1.45;margin-top:10px">准备记录一场羽毛球</p>
      <button class="watch-cta" data-demo-action="start">开始</button>
      <div class="watch-stat"><span>持拍手</span><strong>右手</strong></div>
      <div class="watch-stat"><span>热量</span><strong>-- kcal</strong></div>
      <div class="watch-stat"><span>计分</span><strong>局末</strong></div>
    `,
    live: `
      <div class="watch-title">羽毛球进行中</div>
      <div class="watch-time">${state.recording ? "42:18" : "00:00"}</div>
      <div class="watch-stat"><span>心率</span><strong>${state.recording ? "148" : "--"}</strong></div>
      <div class="watch-stat"><span>热量</span><strong>${state.recording ? state.calories : "--"} kcal</strong></div>
      <div class="watch-stat"><span>挥拍</span><strong>${state.recording ? "386" : "--"}</strong></div>
      <div class="watch-stat"><span>正/反</span><strong>${state.recording ? "62/38" : "--"}</strong></div>
      <button class="watch-cta" data-demo-action="mark">保存这一分</button>
    `,
    score: `
      <div class="watch-title">第一局比分</div>
      <p style="color:#9fb0a7;margin-top:8px">旋转表冠调整</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0">
        <div style="background:rgba(255,255,255,.1);border-radius:10px;padding:10px;text-align:center"><span>我方</span><strong style="display:block;font-size:28px">21</strong></div>
        <div style="background:rgba(255,255,255,.1);border-radius:10px;padding:10px;text-align:center"><span>对方</span><strong style="display:block;font-size:28px">17</strong></div>
      </div>
      <button class="watch-cta" data-demo-action="score">确认</button>
    `
  };
  watchScreen.innerHTML = screens[state.watch];
}

function bindPhoneActions() {
  phoneScreen.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
  phoneScreen.querySelectorAll("[data-chart]").forEach((button) => {
    button.addEventListener("click", () => {
      phoneScreen.querySelectorAll("[data-chart]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.querySelector("#chartPanel").innerHTML = chart(button.dataset.chart);
      addFeed(`已切换图表：${button.textContent}`);
    });
  });
  phoneScreen.querySelectorAll("[data-hand-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.handMode = button.dataset.handMode;
      render();
      addFeed(`已切换正反手视图：${button.textContent}`);
    });
  });
}

function handleAction(action) {
  if (action === "start") startSession();
  if (action === "mark") markRally();
  if (action === "score") openScoreModal();
  if (action === "tag") openTagModal();
  if (action === "hand") showHandAnalysis();
  if (action === "advice") generateAdvice();
  if (action === "export") exportSummary();
  if (action === "setting") showToast("设置项已展开：这是原型演示反馈");
}

function startSession() {
  state.recording = true;
  state.watch = "live";
  switchView("watch");
  addFeed("已开始羽毛球记录：心率、热量和挥拍正在采集");
  showToast("Watch 开始记录，基础热量计算已保留");
}

function markRally() {
  state.keyRallies += 1;
  state.intenseRallies += 1;
  switchWatch("live");
  addFeed(`已保存关键回合 #${state.keyRallies}，系统回溯最近 20 秒`);
  showToast("关键回合已保存，赛后可以补充标签");
  render();
}

function showHandAnalysis() {
  state.handMode = "overview";
  switchView("hand");
  addFeed("已打开正反手分析：本场正手 62%，反手 38%");
  showToast("正反手分析已生成");
}

function openScoreModal() {
  openModal({
    kicker: "Score Input",
    title: "录入本局比分",
    body: `
      <p class="muted">模拟局末快录：调整比分后确认，报告会立即更新。</p>
      <div class="form-grid" style="margin-top:14px">
        ${stepper("我方", "meScore", state.score[0].me)}
        ${stepper("对方", "opScore", state.score[0].opponent)}
      </div>
      <div class="modal-actions">
        <button class="ghost-button" id="cancelModal">取消</button>
        <button class="primary-button" id="saveScore">保存比分</button>
      </div>
    `
  });
}

function stepper(label, id, value) {
  return `
    <div class="stepper">
      <strong>${label}</strong>
      <div class="stepper-controls" data-stepper="${id}">
        <button data-delta="-1">-</button>
        <span class="stepper-value">${value}</span>
        <button data-delta="1">+</button>
      </div>
    </div>
  `;
}

function openTagModal() {
  const tags = ["好球", "失误", "被动防守", "体能下降", "多拍相持", "关键分"];
  openModal({
    kicker: "Rally Tags",
    title: "给关键回合补标签",
    body: `
      <p class="muted">选择标签后，关键回合列表和训练建议会使用这个上下文。</p>
      <div class="tag-row">
        ${tags.map((tag) => `<button class="mini-button" data-tag="${tag}">${tag}</button>`).join("")}
      </div>
      <div class="modal-actions">
        <button class="primary-button" id="saveTag">保存标签</button>
      </div>
    `
  });
}

function generateAdvice() {
  state.adviceReady = true;
  switchView("training");
  addFeed("已根据分局强度、热量和正反手表现生成训练建议");
  showToast("训练建议已生成");
}

function exportSummary() {
  openModal({
    kicker: "Export",
    title: "复盘摘要已生成",
    body: `
      <section class="insight-card">
        <h3>RallySense 复盘摘要</h3>
        <p>本场 ${matchResult()}，比分 ${scoresText()}。总挥拍 ${state.strokes} 次，快速挥拍 ${state.fastStrokes} 次，热量 ${state.calories} kcal，正手 ${state.handStats.forehand}%，反手 ${state.handStats.backhand}%，高强度回合 ${state.intenseRallies} 段。</p>
      </section>
      <div class="modal-actions">
        <button class="primary-button" id="cancelModal">完成</button>
      </div>
    `
  });
  addFeed("已生成可复制的复盘摘要");
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  document.querySelectorAll("[data-watch]").forEach((button) => {
    button.addEventListener("click", () => switchWatch(button.dataset.watch));
  });
  document.querySelectorAll("[data-demo-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.demoAction));
  });
  document.querySelector("#startSession").addEventListener("click", startSession);
  document.querySelector("#resetDemo").addEventListener("click", () => window.location.reload());
  document.querySelector("#closeModal").addEventListener("click", closeModal);
  watchScreen.addEventListener("click", (event) => {
    const button = event.target.closest("[data-demo-action]");
    if (button) handleAction(button.dataset.demoAction);
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modalBody.addEventListener("click", (event) => {
    const stepButton = event.target.closest("[data-delta]");
    if (stepButton) {
      const value = stepButton.parentElement.querySelector(".stepper-value");
      const next = Math.max(0, Number(value.textContent) + Number(stepButton.dataset.delta));
      value.textContent = next;
    }

    if (event.target.id === "cancelModal") closeModal();

    if (event.target.id === "saveScore") {
      const values = modalBody.querySelectorAll(".stepper-value");
      state.score[0] = { me: Number(values[0].textContent), opponent: Number(values[1].textContent) };
      closeModal();
      switchView("score");
      addFeed(`已保存第一局比分：${state.score[0].me}:${state.score[0].opponent}`);
      showToast("比分已保存，并绑定到第一局运动数据");
    }

    const tagButton = event.target.closest("[data-tag]");
    if (tagButton) {
      modalBody.querySelectorAll("[data-tag]").forEach((button) => button.classList.remove("primary-button"));
      tagButton.classList.add("primary-button");
      state.selectedTag = tagButton.dataset.tag;
    }

    if (event.target.id === "saveTag") {
      closeModal();
      addFeed(`关键回合已标记为：${state.selectedTag}`);
      showToast(`已保存标签：${state.selectedTag}`);
      switchView("rallies");
    }
  });
}

bindGlobalEvents();
render();

import {
  collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, $, el, createCalendar } from "./common.js";
import { LINKS, ACTIVITIES, FAQ, HERO_IMAGE, ABOUT, CONTACT, VIDEOS, YOUTUBE_CHANNEL } from "./config.js";

/* ---------- 메뉴 (모바일) ---------- */
const drawer = $("drawer");
const setMenu = (open) => { drawer.hidden = !open; $("menu-open").setAttribute("aria-expanded", String(open)); };
$("menu-open").onclick = () => setMenu(true);
$("menu-close").onclick = () => setMenu(false);
drawer.addEventListener("click", (e) => { if (e.target === drawer || e.target.tagName === "A") setMenu(false); });

/* ---------- 히어로 / ABOUT ---------- */
if (HERO_IMAGE) $("hero").style.backgroundImage = `url("${encodeURI(HERO_IMAGE)}")`;
for (const s of ABOUT.stats) {
  $("about-stats").append(el("div", {}, el("div", { class: "num", text: s.num }), el("div", { class: "lab", text: s.label })));
}
$("about-text").textContent = ABOUT.text;

/* ---------- 활동 카드 ---------- */
for (const a of ACTIVITIES) {
  const thumb = el("div", { class: "thumb", text: a.image ? "" : "PHOTO" });
  if (a.image) thumb.style.backgroundImage = `url("${encodeURI(a.image)}")`;
  const card = el("article", { class: "card" },
    thumb,
    el("div", { class: "meta", text: `${a.when} · ${a.type}` }),
    el("h3", { text: a.title }),
    el("p", { text: a.desc }));
  if (a.program) card.append(el("ol", {}, ...a.program.map((p) => el("li", { text: p }))));
  $("cards").append(card);
}

/* ---------- 연주 영상 ---------- */
if (!VIDEOS.length) {
  $("videos-list").replaceWith(el("p", { class: "about-text", style: "margin-top:0", text: "연주 영상은 곧 올라옵니다." }));
}
for (const v of VIDEOS) {
  const frame = el("div", { class: "frame" });
  frame.style.backgroundImage = `url("https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg")`;
  $("videos-list")?.append(el("a", { class: "video", href: `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`, target: "_blank", rel: "noopener" },
    frame, el("b", { text: v.title }), el("span", { text: v.date || "" })));
}
if (YOUTUBE_CHANNEL) $("videos-more").append(el("a", { class: "btn ghost", href: YOUTUBE_CHANNEL, target: "_blank", rel: "noopener", text: "전체 영상 보기" }));

/* ---------- 푸터 ---------- */
for (const [k, v] of CONTACT) $("contact").append(el("dt", { text: k }), el("dd", { text: v }));
for (const l of LINKS) if (l.url) $("social").append(el("a", { href: l.url, target: "_blank", rel: "noopener", text: l.name }));

/* ---------- 일정 달력 ---------- */
let events = [];
const cal = createCalendar({
  grid: $("cal-grid"), title: $("cal-title"), prev: $("cal-prev"), next: $("cal-next"),
  onSelect: () => renderEvList(),
});
function renderEvList() {
  const list = $("ev-list");
  list.replaceChildren();
  const sel = cal.selected;
  $("day-title").textContent = sel ? sel.replace(/-/g, ".") + " 일정" : "다가오는 일정";
  const items = sel ? events.filter((e) => e.date === sel) : events.filter((e) => e.date >= cal.todayKey).slice(0, 6);
  if (!items.length) {
    list.append(el("li", { style: "display:block;color:var(--muted)", text: sel ? "이 날은 일정이 없어요." : "예정된 일정이 아직 없어요." }));
    return;
  }
  for (const e of items) {
    list.append(el("li", {},
      el("span", { class: "d", text: e.date.slice(5).replace("-", ".") }),
      el("div", {}, el("div", { text: e.title }), el("div", { class: "meta", text: [e.time, e.place].filter(Boolean).join(" · ") })),
      el("span")));
  }
}
renderEvList();
// 지난 3개월 ~ 이후 일정만 불러옴
const from = new Date(); from.setMonth(from.getMonth() - 3);
onSnapshot(
  query(collection(db, "events"), where("date", ">=", from.toISOString().slice(0, 10)), orderBy("date")),
  (snap) => {
    events = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    cal.setEvents(events);
    renderEvList();
  },
  (err) => console.error("일정 불러오기 실패", err),
);

/* ---------- 지원서 ---------- */
const overlay = $("overlay");
let lastFocus = null;
function openApply() { lastFocus = document.activeElement; overlay.hidden = false; $("f-name").focus(); }
function closeApply() { overlay.hidden = true; lastFocus?.focus?.(); }
$("apply-top").onclick = openApply;
$("apply-hero").onclick = openApply;
$("apply-band").onclick = openApply;
$("apply-cancel").onclick = closeApply;
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeApply(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closeApply(); });

let submitted = false;
$("apply-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const st = $("apply-status");
  if (submitted) { st.textContent = "이미 제출했어요. 수정이 필요하면 QnA로 알려 주세요."; return; }
  if ($("f-website").value) return; // 스팸봇
  const v = {
    name: $("f-name").value.trim(), studentId: $("f-sid").value.trim(), major: $("f-major").value.trim(),
    phone: $("f-phone").value.trim(), experience: $("f-exp").value, motive: $("f-motive").value.trim(),
  };
  const missing = [["name", "이름"], ["studentId", "학번"], ["major", "학과"], ["phone", "연락처"]].filter(([k]) => !v[k]).map(([, n]) => n);
  if (missing.length) { st.textContent = missing.join(", ") + "을(를) 입력해 주세요."; st.className = "status-line err"; return; }
  const btn = $("apply-submit");
  btn.disabled = true; st.textContent = "제출하는 중…"; st.className = "status-line";
  try {
    await addDoc(collection(db, "applications"), { ...v, status: "new", createdAt: serverTimestamp() });
    submitted = true;
    st.textContent = "지원서가 제출되었어요. 운영진이 확인 후 연락드릴게요!"; st.className = "status-line ok";
    $("apply-form").querySelectorAll("input,select,textarea").forEach((i) => (i.disabled = true));
  } catch (err) {
    console.error(err);
    st.textContent = "제출하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요."; st.className = "status-line err";
    btn.disabled = false;
  }
});

/* ---------- QnA ---------- */
const log = $("log");
function addMsg(kind, text) { const m = el("div", { class: "msg " + kind, text }); log.append(m); log.scrollTop = log.scrollHeight; return m; }
addMsg("bot", "안녕하세요! 샤르만트 QnA입니다. 궁금한 점을 편하게 물어보세요.");
for (const f of FAQ.slice(0, 4)) {
  $("chips").append(el("button", { class: "chip", type: "button", text: f.q, onclick: () => ask(f.q) }));
}
function findAnswer(q) {
  const s = q.replace(/\s+/g, " ").toLowerCase();
  let best = null, score = 0;
  for (const f of FAQ) {
    const hit = f.keywords.filter((k) => s.includes(k.toLowerCase())).length + (s === f.q.toLowerCase() ? 5 : 0);
    if (hit > score) { score = hit; best = f; }
  }
  return best;
}
function offerLeaveQuestion(q) {
  const box = el("div", { class: "msg bot" });
  box.append(el("div", { text: "그 질문은 운영진이 직접 답해 드릴게요. 연락받을 방법(카톡 ID, 전화, 메일 등)을 남겨 주세요." }));
  const inp = el("input", { placeholder: "연락처 (선택)", maxlength: "60", style: "margin-top:8px" });
  const st = el("div", { class: "status-line" });
  const btn = el("button", { class: "btn small", type: "button", text: "질문 남기기", style: "margin-top:8px" });
  btn.onclick = async () => {
    btn.disabled = true; st.textContent = "보내는 중…";
    try {
      await addDoc(collection(db, "questions"), { text: q, contact: inp.value.trim(), done: false, createdAt: serverTimestamp() });
      inp.disabled = true; st.textContent = "질문을 남겼어요. 운영진이 확인 후 연락드릴게요."; st.className = "status-line ok";
    } catch { st.textContent = "보내지 못했어요. 다시 시도해 주세요."; st.className = "status-line err"; btn.disabled = false; }
  };
  box.append(inp, btn, st);
  log.append(box); log.scrollTop = log.scrollHeight;
}
function ask(q) {
  addMsg("me", q);
  const f = findAnswer(q);
  setTimeout(() => (f ? addMsg("bot", f.a) : offerLeaveQuestion(q)), 250);
}
$("chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("chat-input").value.trim();
  if (!q) return;
  $("chat-input").value = "";
  ask(q);
});

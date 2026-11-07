import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG } from "./config.js";

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);

export const $ = (id) => document.getElementById(id);

// 안전한 DOM 생성 (사용자 입력은 항상 textContent로)
export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) n.append(c);
  return n;
}

export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function fmtDate(ts) {
  if (!ts) return "";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return isNaN(d) ? "" : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// 달력 위젯. onSelect(dateKey) 콜백, events 배열은 setEvents로 갱신
export function createCalendar({ grid, title, prev, next, onSelect }) {
  const today = new Date();
  const todayKey = ymd(today);
  let y = today.getFullYear(), m = today.getMonth(), sel = null, events = [];
  function render() {
    title.textContent = `${y}년 ${m + 1}월`;
    grid.replaceChildren();
    "일월화수목금토".split("").forEach((d) => grid.append(el("div", { class: "cal-dow", text: d })));
    const first = new Date(y, m, 1);
    const start = new Date(y, m, 1 - first.getDay());
    const has = new Set(events.map((e) => e.date));
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const k = ymd(d);
      const cls = ["cal-day", d.getMonth() !== m && "out", k === todayKey && "today", k === sel && "sel", d.getDay() === 0 && "sun"]
        .filter(Boolean).join(" ");
      grid.append(el("button", {
        type: "button", class: cls, "aria-label": k + (has.has(k) ? " 일정 있음" : ""),
        onclick: () => { sel = sel === k ? null : k; render(); onSelect?.(sel); },
      }, el("span", { text: String(d.getDate()) }), has.has(k) ? el("span", { class: "dot" }) : null));
    }
  }
  prev.onclick = () => { m--; if (m < 0) { m = 11; y--; } render(); };
  next.onclick = () => { m++; if (m > 11) { m = 0; y++; } render(); };
  render();
  return {
    setEvents(list) { events = list; render(); },
    get selected() { return sel; },
    todayKey,
  };
}

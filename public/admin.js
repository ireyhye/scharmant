import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, db, $, el, fmtDate, createCalendar } from "./common.js";

const auth = getAuth(app);
const STATUS = { new: ["신규", "new"], seen: ["확인함", "seen"], pass: ["합격", "pass"], fail: ["보류", "seen"] };
let unsubs = [];
let apps = [];

$("btn-login").onclick = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { $("login-status").textContent = "로그인하지 못했어요. 팝업 차단을 확인해 주세요."; }
};
$("btn-logout").onclick = () => signOut(auth);

onAuthStateChanged(auth, async (u) => {
  unsubs.forEach((f) => f()); unsubs = [];
  if (!u) { $("login").hidden = false; $("panel").hidden = true; return; }
  // 운영진 확인: admins/{이메일} 문서가 있어야 함
  let ok = false;
  try { ok = (await getDoc(doc(db, "admins", u.email))).exists(); } catch {}
  if (!ok) {
    $("login").hidden = false; $("panel").hidden = true;
    $("login-status").textContent = `${u.email} 계정은 운영진으로 등록되어 있지 않아요.`;
    await signOut(auth);
    return;
  }
  $("login").hidden = true; $("panel").hidden = false;
  $("who").textContent = u.email;
  start();
});

/* ---------- 탭 ---------- */
for (const b of document.querySelectorAll(".admin-tabs button")) {
  b.onclick = () => {
    for (const x of document.querySelectorAll(".admin-tabs button")) x.setAttribute("aria-selected", String(x === b));
    for (const p of document.querySelectorAll("[data-panel]")) p.hidden = p.dataset.panel !== b.dataset.tab;
  };
}

function start() {
  unsubs.push(onSnapshot(query(collection(db, "applications"), orderBy("createdAt", "desc")), (snap) => {
    apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    $("cnt-apps").textContent = snap.size;
    $("apps-status").textContent = `총 ${snap.size}건 · 신규 ${apps.filter((a) => (a.status || "new") === "new").length}건`;
    renderApps();
  }, () => ($("apps-status").textContent = "지원서를 불러오지 못했어요.")));

  unsubs.push(onSnapshot(query(collection(db, "events"), orderBy("date")), (snap) => {
    events = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    cal.setEvents(events); renderEvList();
  }));

  unsubs.push(onSnapshot(query(collection(db, "questions"), orderBy("createdAt", "desc")), (snap) => {
    $("cnt-q").textContent = snap.docs.filter((d) => !d.data().done).length;
    renderQuestions(snap.docs);
  }));
}

/* ---------- 지원서 ---------- */
let pendingDelete = null;
function renderApps() {
  const body = $("apps-body"); body.replaceChildren();
  if (!apps.length) { body.append(el("tr", {}, el("td", { colspan: "9", class: "empty", text: "아직 들어온 지원서가 없어요." }))); return; }
  for (const d of apps) {
    const [label, cls] = STATUS[d.status] || STATUS.new;
    const sel = el("select", { "aria-label": "상태 변경", style: "width:auto;padding:4px 6px;font-size:13px" },
      ...Object.entries(STATUS).map(([k, [l]]) => { const o = el("option", { value: k, text: l }); if (k === (d.status || "new")) o.selected = true; return o; }));
    sel.onchange = async () => { sel.disabled = true; try { await updateDoc(doc(db, "applications", d.id), { status: sel.value }); } catch {} sel.disabled = false; };
    const del = el("button", { class: "btn ghost small", type: "button", text: pendingDelete === d.id ? "정말 삭제" : "삭제" });
    del.onclick = async () => {
      if (pendingDelete !== d.id) { pendingDelete = d.id; renderApps(); return; }
      pendingDelete = null; try { await deleteDoc(doc(db, "applications", d.id)); } catch {}
    };
    body.append(el("tr", {},
      el("td", {}, el("span", { class: "pill " + cls, text: label })),
      el("td", { text: d.name || "" }), el("td", { class: "num", text: d.studentId || "" }),
      el("td", { text: d.major || "" }), el("td", { class: "num", text: d.phone || "" }),
      el("td", { text: d.experience || "" }), el("td", { class: "motive", text: d.motive || "—" }),
      el("td", { class: "num", text: fmtDate(d.createdAt) }),
      el("td", {}, el("div", { style: "display:flex;gap:6px" }, sel, del))));
  }
}
$("btn-csv").onclick = () => {
  const cols = [["name", "이름"], ["studentId", "학번"], ["major", "학과"], ["phone", "연락처"], ["experience", "기타 경험"], ["motive", "지원 동기"], ["status", "상태"]];
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [[...cols.map((c) => c[1]), "제출일"].map(esc).join(",")];
  for (const a of apps) rows.push([...cols.map(([k]) => k === "status" ? (STATUS[a.status] || STATUS.new)[0] : a[k]), fmtDate(a.createdAt)].map(esc).join(","));
  const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `샤르만트_지원서_${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* ---------- 일정 ---------- */
let events = [], pendingEv = null;
const cal = createCalendar({
  grid: $("cal-grid"), title: $("cal-title"), prev: $("cal-prev"), next: $("cal-next"),
  onSelect: (k) => { if (k) $("ev-date").value = k; renderEvList(); },
});
function renderEvList() {
  const list = $("ev-list"); list.replaceChildren();
  const sel = cal.selected;
  $("day-title").textContent = sel ? sel.replace(/-/g, ".") + " 일정" : "다가오는 일정";
  const items = sel ? events.filter((e) => e.date === sel) : events.filter((e) => e.date >= cal.todayKey).slice(0, 10);
  if (!items.length) { list.append(el("li", { style: "display:block;color:var(--muted)", text: "일정이 없어요." })); return; }
  for (const e of items) {
    const del = el("button", { class: "btn ghost small", type: "button", text: pendingEv === e.id ? "정말 삭제" : "삭제" });
    del.onclick = async () => {
      if (pendingEv !== e.id) { pendingEv = e.id; renderEvList(); return; }
      pendingEv = null; try { await deleteDoc(doc(db, "events", e.id)); } catch {}
    };
    list.append(el("li", {},
      el("span", { class: "d", text: e.date.slice(5).replace("-", ".") }),
      el("div", {}, el("div", { text: e.title }), el("div", { class: "meta", text: [e.time, e.place].filter(Boolean).join(" · ") })),
      del));
  }
}
renderEvList();
$("ev-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const st = $("ev-status");
  const v = { date: $("ev-date").value, time: $("ev-time").value, title: $("ev-title").value.trim(), place: $("ev-place").value.trim() };
  if (!v.date || !v.title) { st.textContent = "날짜와 일정 이름을 입력해 주세요."; st.className = "status-line err"; return; }
  try {
    await addDoc(collection(db, "events"), { ...v, createdAt: serverTimestamp() });
    st.textContent = "일정을 추가했어요."; st.className = "status-line ok";
    $("ev-title").value = ""; $("ev-place").value = ""; $("ev-time").value = "";
  } catch { st.textContent = "추가하지 못했어요."; st.className = "status-line err"; }
});

/* ---------- 질문 ---------- */
function renderQuestions(docs) {
  const list = $("q-list"); list.replaceChildren();
  if (!docs.length) { list.append(el("div", { class: "empty", text: "남겨진 질문이 없어요." })); return; }
  for (const d of docs) {
    const q = d.data();
    const toggle = el("button", { class: "btn ghost small", type: "button", text: q.done ? "답변 안 함으로" : "답변 완료" });
    toggle.onclick = () => updateDoc(doc(db, "questions", d.id), { done: !q.done }).catch(() => {});
    const del = el("button", { class: "btn ghost small", type: "button", text: "삭제" });
    del.onclick = () => deleteDoc(doc(db, "questions", d.id)).catch(() => {});
    list.append(el("div", { class: "qa-item" + (q.done ? " q-done" : "") },
      el("div", { style: "font-size:12px;color:var(--muted)", text: fmtDate(q.createdAt) + (q.done ? " · 답변 완료" : "") }),
      el("div", { class: "q", text: q.text || "" }),
      el("div", { class: "a", text: "연락처: " + (q.contact || "남기지 않음") }),
      el("div", { class: "q-actions" }, toggle, del)));
  }
}

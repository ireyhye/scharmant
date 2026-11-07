// 새 지원서·질문이 들어오면 운영진에게 메일 알림을 보냅니다.
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
setGlobalOptions({ region: "asia-northeast3", maxInstances: 2 }); // 서울 리전

// 배포할 때 물어보는 값들 (README 참고)
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const NOTIFY_EMAILS = defineString("NOTIFY_EMAILS", { description: "알림 받을 메일 (쉼표로 여러 개)" });
const MAIL_FROM = defineString("MAIL_FROM", { default: "샤르만트 <noreply@scharmant.com>" });
const SITE_URL = defineString("SITE_URL", { default: "https://scharmant.com" });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function sendMail(subject, rows) {
  const to = NOTIFY_EMAILS.value().split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) return;
  const html = `
    <div style="font-family:sans-serif;font-size:15px;line-height:1.6">
      <h2 style="margin:0 0 12px">${esc(subject)}</h2>
      <table style="border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}
      </table>
      <p style="margin-top:20px"><a href="${esc(SITE_URL.value())}/admin.html">운영진 페이지에서 보기</a></p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY.value()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM.value(), to, subject, html }),
  });
  if (!res.ok) logger.error("메일 발송 실패", res.status, await res.text());
}

async function notify(subject, rows) {
  try { await sendMail(subject, rows); } catch (e) { logger.error(e); }
}

exports.onNewApplication = onDocumentCreated(
  { document: "applications/{id}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const a = event.data?.data();
    if (!a) return;
    await notify(
      `[샤르만트] 새 지원서: ${a.name} (${a.major})`,
      [["이름", a.name], ["학번", a.studentId], ["학과", a.major], ["연락처", a.phone], ["기타 경험", a.experience], ["지원 동기", a.motive || "—"]],
    );
  },
);

exports.onNewQuestion = onDocumentCreated(
  { document: "questions/{id}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const q = event.data?.data();
    if (!q) return;
    await notify(
      "[샤르만트] 새 QnA 질문",
      [["질문", q.text], ["연락처", q.contact || "남기지 않음"]],
    );
  },
);

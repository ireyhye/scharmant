// =====================================================================
//  샤르만트 사이트 설정 파일
//  내용(활동, 링크, FAQ)과 Firebase 연결 정보를 여기서만 고치면 됩니다.
// =====================================================================

// 1) Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)에서 복사해 붙여 넣으세요.
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// 2) 대표 사진 (히어로). public/images/에 사진을 넣고 경로를 적으세요. 비워 두면 회색 배경.
export const HERO_IMAGE = ""; // 예: "/images/hero.jpg"

// 3) ABOUT — 숫자 3개와 소개 문장 (예시)
export const ABOUT = {
  stats: [
    { num: "20+", label: "함께한 해" },
    { num: "40", label: "현재 부원" },
    { num: "2회", label: "매년 정기연주회" },
  ],
  text: "샤르만트는 클래식기타를 사랑하는 학생들이 모여 합주와 독주를 함께 연습하는 동아리입니다. 매주 정기 모임과 기초반 레슨을 열고, 학기마다 정기연주회로 그동안의 연습을 무대에 올립니다.",
};

// 4) SNS 링크 — 푸터에 표시 (url이 비어 있으면 숨김)
export const LINKS = [
  { name: "INSTAGRAM", url: "" },
  { name: "NAVER CAFE", url: "" },
  { name: "YOUTUBE", url: "" },
];

// 5) 연락처 — 푸터에 표시 (예시)
export const CONTACT = [
  ["동아리방", "학생회관 0층 000호"],
  ["메일", "contact@scharmant.com"],
];

// 6) 활동 내역 (예시 — 실제 활동으로 바꿔 주세요). image는 선택 (예: "/images/2026-summer.jpg")
export const ACTIVITIES = [
  {
    when: "2026.06", type: "정기연주회", title: "제00회 여름 정기연주회", image: "",
    desc: "합주·중주·독주 무대. 신입 부원 첫 합주 데뷔.",
    program: ["F. Tárrega — 알함브라 궁전의 추억", "F. Sor — 월광 (Op.35 No.22)"],
  },
  { when: "2026.05", type: "버스킹", title: "축제 기간 교내 버스킹", image: "", desc: "학생회관 앞 야외 무대, 중주 3팀 참여." },
  { when: "2026.03", type: "신입 교육", title: "기초반 개강", image: "", desc: "주 1회 기초 레슨: 자세, 아포얀도·티란도, 기본 코드." },
  { when: "2025.12", type: "정기연주회", title: "겨울 정기연주회", image: "", desc: "졸업 부원 고별 무대와 앙상블 공연." },
  { when: "2025.10", type: "교류", title: "타 대학 기타 동아리 연합 연주회", image: "", desc: "연합 합주와 학교별 무대." },
  { when: "2025.06", type: "정기연주회", title: "여름 정기연주회", image: "", desc: "듀오와 트리오 중심의 실내악 무대." },
];

// 7) 연주 영상 — 유튜브 주소의 v= 뒤 11글자(id)를 넣으세요. 비어 있으면 섹션 안내 문구만 표시.
export const VIDEOS = [
  // { id: "XXXXXXXXXXX", title: "알함브라 궁전의 추억 — 2026 여름 정기연주회", date: "2026.06" },
];
export const YOUTUBE_CHANNEL = ""; // 채널 주소 (전체 영상 보기 버튼)

// 8) QnA 자동응답 (예시). keywords 중 하나라도 질문에 들어 있으면 answer로 답합니다.
//    맞는 답이 없으면 방문자가 질문을 남기고, 운영진에게 알림이 갑니다.
export const FAQ = [
  { q: "기타가 없어도 되나요?", keywords: ["기타 없", "악기", "대여", "빌려"],
    a: "네! 동아리 공용 기타를 빌려 드려요. 개인 기타가 없어도 가입할 수 있어요." },
  { q: "모임은 언제 해요?", keywords: ["언제", "모임", "시간", "요일", "연습"],
    a: "정기 모임은 매주 수요일 저녁 7시, 동아리방에서 해요. 자세한 일정은 위 달력을 확인해 주세요." },
  { q: "회비가 있나요?", keywords: ["회비", "돈", "비용", "얼마"],
    a: "회비는 학기당 2만 원이에요. 악기 관리와 연주회 준비에 쓰여요." },
  { q: "악보를 못 읽어도 돼요?", keywords: ["악보", "초보", "처음", "못 쳐", "배워"],
    a: "괜찮아요. 기초반에서 악보 읽기부터 함께 배워요." },
  { q: "언제 모집해요?", keywords: ["모집", "지원", "가입", "신청"],
    a: "학기 초에 모집해요. 페이지 위쪽 '지원하기' 버튼으로 언제든 지원서를 남길 수 있어요." },
];

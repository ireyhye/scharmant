# 샤르만트 웹사이트 (scharmant.com)

클래식기타 동아리 샤르만트 홍보 사이트입니다.

- **메인 페이지** (`/`): 지난 활동, 일정 달력, SNS 링크, QnA 채팅, 지원하기
- **운영진 페이지** (`/admin.html`): 지원서 확인·상태 변경·CSV 내려받기, 일정 관리, 남겨진 질문 확인
- **알림**: 새 지원서·질문이 들어오면 운영진 메일로 알림

Firebase(호스팅, Firestore, Cloud Functions) 위에서 동작하며, 빌드 과정 없이 HTML/JS 그대로 배포합니다.

## 폴더 구조

```
public/            사이트 파일 (그대로 배포됨)
  config.js        ★ 내용과 연결 정보는 여기서 수정 (활동, SNS 링크, FAQ, Firebase 설정)
  index.html, app.js        메인 페이지
  admin.html, admin.js      운영진 페이지
  common.js                 Firebase 연결, 달력 등 공용 코드
  styles.css                디자인
functions/         메일 알림 보내는 서버 함수
firestore.rules    데이터 접근 규칙 (지원서는 운영진만 열람)
```

## 처음 설정하기 (한 번만)

### 1. 준비물
- [Node.js](https://nodejs.org) LTS 설치
- PowerShell에서 Firebase CLI 설치:
  ```powershell
  npm install -g firebase-tools
  firebase login
  ```

### 2. Firebase 프로젝트 만들기
1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 (예: `scharmant`)
2. **요금제를 Blaze로 변경** (메일 알림 함수에 필요. 기본료 없음, 무료 한도 안에서는 0원)
   - Google Cloud 콘솔 > 결제 > **예산 및 알림**에서 월 5,000원 같은 예산 알림을 꼭 걸어 두세요.
3. **Firestore Database** 만들기 → 위치는 `asia-northeast3 (서울)`
4. **Authentication** > 로그인 방법 > **Google** 사용 설정
5. 프로젝트 설정 > 내 앱 > **웹 앱 추가** → 나오는 설정값을 `public/config.js`의 `FIREBASE_CONFIG`에 붙여 넣기
6. `.firebaserc`의 `YOUR_PROJECT`를 프로젝트 ID로 바꾸기

### 3. 운영진 등록
Firestore 콘솔에서 컬렉션 `admins`를 만들고, **문서 ID를 운영진 Gmail 주소**로 해서 문서를 추가합니다 (필드는 아무거나, 예: `name: 홍길동`).
운영진이 바뀌면 이 문서만 추가/삭제하면 됩니다.

### 4. 메일 알림 (Resend)
1. [resend.com](https://resend.com) 가입 (무료: 월 3,000통)
2. Domains에서 `scharmant.com` 추가 → 안내하는 DNS 레코드를 도메인 업체에 등록
   - 도메인 인증 전에는 `MAIL_FROM`을 `onboarding@resend.dev`로 두면 **Resend 가입 메일 주소로만** 보낼 수 있어요.
3. API Keys에서 키 발급

### 5. 배포
```powershell
cd functions; npm install; cd ..
firebase deploy
```
처음 배포할 때 아래 값을 물어봅니다.
- `RESEND_API_KEY`: Resend API 키
- `NOTIFY_EMAILS`: 알림 받을 메일 (여러 개면 쉼표로, 예: `a@gmail.com,b@gmail.com`)
- `MAIL_FROM`: 보내는 주소 (기본값 `샤르만트 <noreply@scharmant.com>`)
- `SITE_URL`: 기본값 `https://scharmant.com`

### 6. 도메인 연결
Firebase 콘솔 > Hosting > **커스텀 도메인 추가** → `scharmant.com`, `www.scharmant.com` 입력 → 안내하는 DNS 레코드를 도메인 업체에 등록 (반영까지 최대 하루).

## GitHub 자동 배포 (선택)
`main`에 push할 때마다 사이트가 자동으로 배포되게 하려면 한 번만 실행하세요.
```powershell
firebase init hosting:github
```
저장소 이름을 입력하면 GitHub 비밀값과 워크플로 파일을 자동으로 만들어 줍니다. (빌드 스크립트는 "No", 덮어쓰기 질문에는 기존 파일 유지)
`functions/`나 `firestore.rules`를 고쳤을 때는 직접 `firebase deploy --only functions,firestore`를 실행하세요.

## 자주 고치는 것
| 바꾸고 싶은 것 | 파일 |
|---|---|
| 대표 사진, 소개, 활동, 영상, SNS, 연락처, QnA 자동응답 | `public/config.js` |
| 사진 파일 | `public/images/`에 넣고 `config.js`에 경로 적기 |
| 문구, 섹션 순서 | `public/index.html` |
| 색상, 글꼴, 레이아웃 | `public/styles.css` (맨 위 `:root`의 색상 변수) |
| 일정 | 운영진 페이지 > 일정 탭 |

## 로컬에서 미리 보기
```powershell
firebase emulators:start --only hosting
```
→ http://localhost:5000 (데이터는 실제 Firebase 프로젝트를 사용)

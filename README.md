# 사과게임 — 10 만들기

브라우저에서 바로 실행되는 **HTML + CSS + JavaScript** 게임입니다.  
별도 서버나 빌드 도구가 필요하지 않아 GitHub Pages에 바로 올릴 수 있습니다.

## 게임 규칙

- 19열 × 10행, 총 190개의 사과가 표시됩니다.
- 각 사과에는 1~9의 숫자가 적혀 있습니다.
- 마우스 또는 손가락으로 직사각형 영역을 드래그합니다.
- 영역 안에 들어온 사과 숫자의 합이 정확히 10이면 해당 사과들이 사라집니다.
- 사라진 사과 1개당 1점입니다.
- 제한 시간은 90초, 120초, 180초 중 선택합니다.

## 파일 구성

- `index.html` — 화면 구조
- `style.css` — 화면 디자인
- `script.js` — 게임 로직
- `.nojekyll` — GitHub Pages에서 정적 파일을 그대로 배포하도록 설정

## 실행 방법

폴더에서 `index.html`을 더블클릭하면 실행됩니다.

로컬 서버를 사용할 경우:

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## GitHub Pages 연결 방법

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더의 파일을 저장소 최상위 경로에 업로드합니다.
3. 저장소의 `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`의 Source를 `Deploy from a branch`로 선택합니다.
5. Branch는 `main`, Folder는 `/ (root)`로 선택하고 저장합니다.
6. 잠시 후 표시되는 GitHub Pages 주소로 접속합니다.

## 수정하기 좋은 부분

`script.js` 상단에서 행과 열 수를 바꿀 수 있습니다.

```js
const ROWS = 10;
const COLS = 19;
```

시간 선택 버튼은 `index.html`의 `data-seconds` 값을 바꾸면 됩니다.

## 참고

현재 구현은 드래그한 **직사각형 영역 안에 중심점이 포함된 사과**를 선택합니다.  
원본 게임처럼 사각형을 크게 그려 L자나 T자처럼 보이는 조합도 선택할 수 있습니다.

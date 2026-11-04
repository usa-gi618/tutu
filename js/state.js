// 화면끼리 주고받는 앱 상태 (메모리에만 보관, 앱을 닫으면 초기화)
export const state = {
  // Quick Check 결과: TODAY 순서대로 { choice, correct }
  quickCheck: [],
  // 결과 화면에서 고른, 지금 볼 강의 (TODAY 인덱스)
  watching: -1,
  // 끝까지 본 강의 (TODAY 인덱스)
  watched: new Set(),
  // 플레이어에서 뒤로 가면 돌아갈 화면 ('lecture' = 결과 화면에서 들어온 강의 시작 화면, 'library')
  playerBack: 'lecture',
  // 라이브러리에서 보고 있던 과목
  librarySubject: null,
  // 영상 화면 언어 ('en' | 'es')
  lang: 'en',
  // 복습 문제 진행: { lecture, stage: 'quiz' | 'how' | 'similar' | 'done', tries, rewatched }
  review: null,
  // 영상 일부 다시 보기: { from, to } 프레임. 끝나면 복습 문제로 돌아간다
  rewatch: null,
  // 복습까지 마친 강의 (TODAY 인덱스)
  mastered: new Set(),
  // 선생님 앱에서 보고 있던 화면 (학생 플레이어로 미리 보기 갔다가 돌아올 때)
  teacherStep: null,
  afterOnboarding: null, // 시작 화면 다음에 갈 곳 (없으면 홈)
};

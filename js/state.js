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
};

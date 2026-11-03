// 오늘 들어야 하는 강의 (홈 카드). 라이브러리·강의 화면에서도 같이 쓴다.
// 설명·퀴즈는 임시 문구 (설명 형식: In today’s class, we learned ...).
// quiz.answer = 정답 options 인덱스. 'Not sure yet'은 화면에서 자동으로 붙는다.
// motion = 강의 영상(Lottie). length·scenes는 그 파일 기준 (scenes = 마커 앞 번호 01, 02 ... 개수).
// interactions = 영상 속 인터랙션 (js/interactions.js). 재생바에 검은 점으로 표시된다.
//   scene = 장면 레이어 이름, at = 영상을 멈추고 조작을 기다리는 프레임
//   pick  : options 카드 중 하나 탭 → 노란색 + badge 표시 (badgeAt: 표시 위치)
//   answer: 확인 문제. options 중 하나 탭 → 정답(answer)은 초록, 틀린 선택은 회색
//   tap   : target(마이크 등)을 탭하면 이어서 재생
//   drag  : item을 target 위로 끌어다 놓기
//   split = 한 레이어 안 도형 묶음을 따로 떼어 쓸 레이어로 만들기, freeze = 영상에 미리 들어 있는 강조 지우기
const checkOptions = (layer = 'check-card') => ['option-1', 'option-2', 'option-3'].map((o) => ({ layer, groups: [o], as: o }));

export const TODAY = [
  {
    subject: 'Biology',
    title: 'Where Does a Tree’s Mass Come From?',
    period: 'Period 4 : 30',
    motion: 'assets/lessons/tree_mass_lesson.json',
    length: '0:56',
    scenes: 6,
    checks: 1,
    interactions: [
      // 01 예측: Soil / Water / Air 중 하나 고르기 (원래 영상은 Soil을 자동으로 강조 → 지움)
      { type: 'pick', scene: '01_predict', at: 197, options: ['choice-soil', 'choice-water', 'choice-air'], badge: 'My prediction', freeze: { layer: 'choice-soil', from: 200 } },
      // 02 무게 재기: 화분+묘목(drop-zone의 도형 1~3)을 저울 위로 끌어다 놓기
      { type: 'drag', scene: '02_step1_weigh', at: 352, split: [{ layer: 'drop-zone', groups: [1, 2, 3], as: 'drag-item' }], item: 'drag-item', target: 'scale' },
      // 07 확인 문제
      { type: 'answer', scene: '07_check', at: 1616, split: checkOptions(), options: ['option-1', 'option-2', 'option-3'], answer: 'option-2' },
    ],
    description: 'In today’s class, we learned how van Helmont’s experiment showed that a tree’s mass doesn’t come from the soil, and how light turns carbon dioxide and water into glucose.',
    quiz: {
      question: 'Where does most of a tree’s mass come from?',
      options: [
        'Carbon dioxide from the air',
        'Nutrients in the soil',
        'Water absorbed by the roots',
      ],
      answer: 0,
    },
  },
  {
    subject: 'Algebra',
    title: 'Solving Linear Equations',
    period: 'Period 4 : 30',
    motion: 'assets/lessons/linear_equations_lesson.json',
    length: '0:38',
    scenes: 5,
    checks: 1,
    interactions: [
      // 06 확인 문제: 2x − 7 = 9의 첫 단계
      { type: 'answer', scene: '06_check', at: 1071, split: checkOptions(), options: ['option-1', 'option-2', 'option-3'], answer: 'option-1' },
    ],
    description: 'In today’s class, we learned how to isolate a variable using inverse operations, solve one-step and multi-step equations, and check each answer by substituting it back in.',
    quiz: {
      question: 'What is the first step to solve 3x + 5 = 20?',
      options: [
        'Subtract 5 from both sides',
        'Divide both sides by 5',
        'Multiply both sides by 3',
      ],
      answer: 0,
    },
  },
  {
    subject: 'English 9',
    title: 'Romeo and Juliet',
    period: 'Period 4 : 30',
    motion: 'assets/lessons/romeo_juliet_lesson.json',
    length: '0:30',
    scenes: 4,
    checks: 1,
    interactions: [
      // 05 확인 문제: 직유(as) 문장 찾기
      { type: 'answer', scene: '05_check', at: 842, split: checkOptions(), options: ['option-1', 'option-2', 'option-3'], answer: 'option-2' },
    ],
    description: 'In today’s class, we learned how Shakespeare uses metaphor and imagery, such as “Juliet is the sun,” to show what characters feel and to build the play’s central themes.',
    quiz: {
      question: 'In “Juliet is the sun,” what is Romeo saying about Juliet?',
      options: [
        'She’s the brightest thing in his world',
        'She is far away like the sun',
        'She is angry, like a hot sun',
      ],
      answer: 0,
    },
  },
  {
    subject: 'History',
    title: 'The Industrial Revolution',
    period: 'Period 4 : 30',
    motion: 'assets/lessons/industrial_revolution_lesson.json',
    length: '1:08',
    scenes: 7,
    checks: 1,
    interactions: [
      // 06 토론: 마이크를 눌러 내 생각 말하기 (누르면 Listening → 내 대답 말풍선)
      { type: 'tap', scene: '06_debate', at: 1539, target: 'answer' },
      // 07 정리: 내 편 고르기
      { type: 'pick', scene: '07_recap', at: 2005, options: ['blessing', 'root'], badge: 'My side', badgeAt: 'top-right' },
    ],
    description: 'In today’s class, we learned how machines and factories changed Britain, and debated whether the Industrial Revolution was a blessing or a root cause of inequality and pollution.',
    quiz: {
      question: 'Where did the Industrial Revolution begin?',
      options: [
        'Britain',
        'France',
        'The United States',
      ],
      answer: 0,
    },
  },
];

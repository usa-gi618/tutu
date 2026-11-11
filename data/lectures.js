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
//   slider: knob을 끝(to)까지 끌기. knob과 가장 가까운 trees의 나무가 컬러
//   toggles: 스위치 탭으로 켜고 끄기 → 모두 goal 상태가 되면 완료 + 나무 자람
//   early = 이 프레임부터는 재생 중에도 조작 가능 (at 전에 끝내면 멈추지 않고 지나감)
//   hide = 숨길 레이어
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
      {
        type: 'pick', scene: '01_predict', at: 197, options: ['choice-soil', 'choice-water', 'choice-air'], badge: { en: 'My prediction', es: 'Mi predicción' },
        freeze: { layer: 'choice-soil', from: 200 },
        // 고르기 전에는 세 카드 모두 회색: 영상 속 Soil은 아이콘이 검정 + 검은 테두리라 Water·Air와 맞춘다
        restyle: [
          { layer: 'choice-soil', groups: [5], fill: [220, 220, 220], stroke: [171, 171, 171] },
          { layer: 'choice-soil', groups: [9], strokeWidth: 0 },
        ],
      },
      // 02 무게 재기: 화분+묘목(drop-zone의 도형 1~3)을 저울 위로 끌어다 놓기
      { type: 'drag', scene: '02_step1_weigh', at: 352, split: [{ layer: 'drop-zone', groups: [1, 2, 3], as: 'drag-item' }], item: 'drag-item', target: 'scale' },
      // 03 5년 흐르게 하기: 슬라이더 손잡이를 끝(5 yrs)까지 끌면 5년 나무가 자란다
      {
        type: 'slider', scene: '03_step2_grow', early: 556, at: 580, // 556부터 재생 중에도 조작 가능, 580(Now let five years pass)에서 멈춤
        split: [{ layer: 'time-slider', groups: [2], as: 'slider-knob' }, { layer: 'time-slider', groups: [3], as: 'slider-fill' }],
        knob: 'slider-knob', fill: 'slider-fill', track: 'time-slider', from: 263, start: 463, to: 663,
        trees: [{ x: 263, layer: 'year-0' }, { x: 463, layer: 'year-3' }, { x: 663, layer: 'year-5' }], // 손잡이가 머무는 구간의 나무가 컬러
      },
      // 05 조건 켜기: 빛·물·CO₂가 모두 꺼진 채 시작. 켤 때마다 초록 + "no ~" 표시 사라짐. 다 켜면 재생되며 나무가 자란다
      // 원래 영상은 'CO₂를 끄면 안 자란다'는 내용이라 반대되는 no-CO₂ 그래프 선·결론·자막은 숨긴다
      {
        type: 'toggles', scene: '05_step4_no_co2', at: 1045,
        split: [
          ...['toggle-0', 'toggle-1', 'toggle-2'].flatMap((t) => [{ layer: t, groups: [0], as: `${t}-knob` }, { layer: t, groups: [1], as: `${t}-track` }]),
          { layer: 'sealed-box', groups: [0], as: 'no-co2-tag' },
          { layer: 'sealed-box', groups: [2, 3], as: 'box-tree' },
          { layer: 'graph', groups: [0, 1], as: 'graph-no-co2' },
        ],
        hide: ['no-co2-tag', 'graph-no-co2', 'conclusion', 'caption 2'],
        toggles: ['toggle-0', 'toggle-1', 'toggle-2'], labels: { en: ['no light', 'no water', 'no CO₂'], es: ['sin luz', 'sin agua', 'sin CO₂'] },
        original: [true, true, false], start: [false, false, false], goal: [true, true, true], travel: 20,
        box: 'sealed-box', chips: { x: 280, y: 168 }, tree: 'box-tree', growFrames: 90, // 3초 동안 자란다
        grow: { x: 362, ground: 292, stem: [26, 60], r: [13, 32] }, // 줄기 길이·잎 반지름 (영상 속 원래 나무 26 / 13)
      },
      // 07 확인 문제
      { type: 'answer', scene: '07_check', at: 1616, split: checkOptions(), options: ['option-1', 'option-2', 'option-3'], answer: 'option-2' },
    ],
    // 영상이 끝난 뒤 복습 문제 (screens/review). 블록을 빈칸에 넣어 순서 맞추기
    //   틀리면 힌트 → 다시 풀기. 또 틀리면 설명 + 영상 다시 보기(rewatch 구간) → 비슷한 문제(similar)
    review: {
      concept: 'Where a tree’s mass comes from',
      quiz: {
        prompt: 'Put van Helmont’s experiment in order.',
        steps: ['Weigh the dry soil and the sapling', 'Let five years pass, giving only water', 'Weigh the tree and the soil again'],
        pool: [2, 0, 1], // 오른쪽에 처음 놓이는 순서 (섞어서)
        hint: 'You need a starting weight before any time passes.',
      },
      how: 'Measure first, let time pass, then measure again. Comparing the two weights shows where the mass came from.',
      rewatch: { from: 295, to: 1006, label: 'Rewatch the experiment' }, // 02 무게 재기 ~ 04 다시 재기
      similar: {
        prompt: 'Put the CO₂ experiment in order.',
        steps: ['Seal the plant in a box', 'Take away the carbon dioxide', 'Check how much it grew after 30 days'],
        pool: [1, 2, 0],
        hint: 'Set up the box first, then change one thing.',
      },
    },
    // 말풍선 캐릭터에게 질문하기 (프로토타입용 질문·답변 한 쌍)
    ask: {
      question: 'So how does air turn into the wood of a tree?',
      steps: [
        { top: 'CO₂', bottom: 'from the air' },
        { top: 'light + water', bottom: 'in the leaf' },
        { top: 'glucose', bottom: 'a kind of sugar' },
      ],
      result: '= wood',
      answer: '“Leaves take in CO₂ from the air. Light turns it and water into glucose, and glucose builds the wood.”',
    },
    // 영상 마지막 Recap (Figma 11657:2163). 영상 뒤에 seconds 동안 이어서 나온다
    recap: {
      seconds: 6,
      caption: '“You predicted, you tested, and the data showed where the mass comes from.”',
      // 01 예측에서 고른 카드 → 문구. correct면 그대로, 아니면 취소선 + ruledOut
      prediction: {
        scene: '01_predict',
        texts: { 'choice-soil': 'It came from the soil', 'choice-water': 'It came from water', 'choice-air': 'It came from the air' },
        correct: 'choice-air', ruledOut: 'Tested and ruled out', confirmed: 'Confirmed by the data',
      },
      cards: [
        { label: 'My experiment', html: 'Soil −0.06 kg<br />No CO₂, no growth' },
        { label: 'Principle', html: 'Photosynthesis turns<br /><mark>CO₂</mark> into the tree' },
      ],
    },
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
      { type: 'pick', scene: '07_recap', at: 2005, options: ['blessing', 'root'], badge: { en: 'My side', es: 'Mi postura' }, badgeAt: 'top-right' },
    ],
    // 04·05 다큐멘터리: 글자 카드 대신 일러스트 컷 (from = 이 프레임부터, 내레이션 마커에 맞춤. pan = 컷 동안 이동 방향)
    docs: [
      {
        scene: '04_doc1_blessing',
        hide: ['text', 'cloth', 'railways'],
        cuts: [
          { from: 806, art: 'assets/docs/mill.svg', pan: [-30, 6], label: { en: 'A Lancashire cotton mill · 1830s', es: 'Una fábrica de algodón en Lancashire · década de 1830' } },
          { from: 915, art: 'assets/docs/cloth.svg', pan: [24, 0], label: { en: 'Machine-made cloth got cheap', es: 'La tela hecha a máquina se abarató' } },
          { from: 985, art: 'assets/docs/railway.svg', pan: [-36, 0], label: { en: 'Liverpool–Manchester Railway · 1830', es: 'Ferrocarril Liverpool–Mánchester · 1830' } },
        ],
      },
      {
        scene: '05_doc2_root_cause',
        hide: ['text', 'owners', 'children', 'cities'],
        cuts: [
          { from: 1035, art: 'assets/docs/manchester.svg', pan: [30, 4], label: { en: 'Manchester · 1840s', es: 'Mánchester · década de 1840' } },
          { from: 1138, art: 'assets/docs/owners.svg', pan: [-24, 0], label: { en: 'Mill owners grew rich', es: 'Los dueños de las fábricas se enriquecieron' } },
          { from: 1190, art: 'assets/docs/children.svg', pan: [20, -6], label: { en: 'Child workers · 5 a.m. to 9 p.m.', es: 'Niños trabajadores · de 5 a. m. a 9 p. m.' } },
          { from: 1241, art: 'assets/docs/smoke.svg', pan: [0, -12], label: { en: 'Smoke over the city', es: 'Humo sobre la ciudad' } },
        ],
      },
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

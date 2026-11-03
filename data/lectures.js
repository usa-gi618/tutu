// 오늘 들어야 하는 강의 (홈 카드). 라이브러리·강의 화면에서도 같이 쓴다.
// 설명·퀴즈는 임시 문구 (설명 형식: In today’s class, we learned ...).
// quiz.answer = 정답 options 인덱스. 'Not sure yet'은 화면에서 자동으로 붙는다.
// motion = 강의 영상(Lottie). length·scenes는 그 파일 기준 (scenes = 마커 앞 번호 01, 02 ... 개수).
export const TODAY = [
  {
    subject: 'Biology',
    title: 'Where Does a Tree’s Mass Come From?',
    period: 'Period 4 : 30',
    motion: 'assets/lessons/tree_mass_lesson.json',
    length: '0:56',
    scenes: 6,
    checks: 1,
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

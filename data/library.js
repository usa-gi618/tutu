// 라이브러리: 지난 결석 때 전달받은 수업 + 오늘 전달받은 수업(TODAY)
// status
//   watched: 영상을 다 들은 수업 (검정)
//   passed : Quick Check를 맞혀서 패스한 수업 (회색)
//   todo   : 들어야 하는데 아직 안 들은 수업 (노랑)
// date = 수업을 전달받은 날. 지난 수업 목록은 임시 데이터.
import { TODAY } from './lectures.js';

export const SUBJECTS = ['Algebra', 'English 9', 'Biology', 'History'];

export const PAST = [
  { subject: 'Biology', title: 'Cells and Their Parts', period: 'Period 4 : 30', date: '2026-09-21', status: 'watched' },
  { subject: 'Biology', title: 'How Plants Make Food', period: 'Period 4 : 30', date: '2026-10-08', status: 'passed' },
  { subject: 'Biology', title: 'Food Chains and Webs', period: 'Period 4 : 30', date: '2026-10-27', status: 'todo' },
  { subject: 'Algebra', title: 'Variables and Expressions', period: 'Period 4 : 30', date: '2026-09-24', status: 'watched' },
  { subject: 'Algebra', title: 'Order of Operations', period: 'Period 4 : 30', date: '2026-10-15', status: 'passed' },
  { subject: 'English 9', title: 'Elements of a Short Story', period: 'Period 4 : 30', date: '2026-09-30', status: 'passed' },
  { subject: 'English 9', title: 'Introducing Shakespeare', period: 'Period 4 : 30', date: '2026-10-21', status: 'watched' },
  { subject: 'History', title: 'Native American Cultures', period: 'Period 4 : 30', date: '2026-09-17', status: 'watched' },
  { subject: 'History', title: 'The Age of Exploration', period: 'Period 4 : 30', date: '2026-10-10', status: 'todo' },
];

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 오늘 수업: 끝까지 봤으면 watched, Quick Check를 맞혔으면 passed, 아니면 todo
export function libraryFor(subject, { quickCheck, watched }) {
  const status = (i) => (watched.has(i) ? 'watched' : quickCheck[i]?.correct ? 'passed' : 'todo');
  const today = TODAY
    .map((l, i) => ({ ...l, date: isoToday(), status: status(i) }))
    .filter((l) => l.subject === subject);
  return [...today, ...PAST.filter((l) => l.subject === subject)]
    .sort((a, b) => b.date.localeCompare(a.date)); // 최신 수업이 위로
}

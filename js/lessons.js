// 강의 영상(Lottie) 미리 불러오기 + 조각(segment) 정보 만들기.
// 같은 파일은 한 번만 받는다 (강의 시작 화면에서 미리 받아 두면 플레이어에서 바로 재생).
import { prepare } from './interactions.js';

const cache = new Map();

export function loadLesson(lecture) {
  const url = lecture.motion;
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => r.json()).then((data) => parse(prepare(data, lecture.interactions))));
  }
  return cache.get(url);
}

// 마커 "01_2 · 문장" → 장면 01의 두 번째 조각
function parse(data) {
  const fr = data.fr;
  const total = data.op - data.ip;
  const markers = [...(data.markers ?? [])].sort((a, b) => a.tm - b.tm);
  const segments = markers.map((m, i) => {
    const [id, ...rest] = m.cm.split(' · ');
    return {
      id, // 마커 번호 (예: 01_2) → 스페인어 자막 찾기
      scene: id.split('_')[0],
      caption: rest.join(' · '),
      start: i === 0 ? data.ip : m.tm,
      end: i + 1 < markers.length ? markers[i + 1].tm : data.op,
    };
  });
  if (!segments.length) segments.push({ scene: '01', caption: '', start: data.ip, end: data.op });

  // 장면 = 같은 번호 조각들의 묶음 (재생바 구간)
  const scenes = [];
  for (const s of segments) {
    const last = scenes[scenes.length - 1];
    if (last && last.id === s.scene) last.end = s.end;
    else scenes.push({ id: s.scene, start: s.start, end: s.end });
  }
  return { data, fr, total, segments, scenes };
}

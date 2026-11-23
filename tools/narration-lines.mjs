// 강의 내레이션 대본: 영상 마커(영어 자막) + data/spanish.js(스페인어 자막) → JSON (make_audio.py가 읽는다)
// 사용: node tools/narration-lines.mjs > /tmp/lines.json
import fs from 'fs';
import { fileURLToPath } from 'url';
const rootUrl = new URL('..', import.meta.url);
const root = fileURLToPath(rootUrl);
const { TODAY } = await import(new URL('data/lectures.js', rootUrl));
const { ES } = await import(new URL('data/spanish.js', rootUrl));
const clean = (t) => t?.replace(/[“”]/g, '').trim();
const out = TODAY.map((l) => {
  const d = JSON.parse(fs.readFileSync(root + l.motion));
  const ms = [...d.markers].sort((a, b) => a.tm - b.tm);
  const es = ES[l.subject] ?? {};
  const lines = ms.map((m, i) => {
    const [id, ...rest] = m.cm.split(' · ');
    const start = i === 0 ? d.ip : m.tm;
    const end = i + 1 < ms.length ? ms[i + 1].tm : d.op;
    const esText = es.captions?.[id];
    // 스페인어 자막을 일부러 비운 줄(null) = 영상에서 숨긴 자막 → 음성도 없음
    if (esText === null) return null;
    return { id, seconds: (end - start) / d.fr, en: clean(rest.join(' · ')), es: clean(esText) };
  }).filter(Boolean);
  if (l.recap) lines.push({ id: 'recap', seconds: l.recap.seconds, en: clean(l.recap.caption), es: clean(es.recap?.caption) });
  return { subject: l.subject, slug: l.motion.split('/').pop().replace('_lesson.json', ''), lines };
});
console.log(JSON.stringify(out, null, 1));

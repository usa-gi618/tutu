#!/usr/bin/env python3
"""강의 내레이션 음성 만들기 (macOS 음성 합성 `say`).

자막 한 줄(영상 마커)마다 영어·스페인어 음성 파일을 하나씩 만든다.
  assets/audio/<강의>/<en|es>/<마커 번호>.m4a
  data/narration.js  ← 플레이어가 읽는 목록 (파일 경로 + 길이)
줄마다 영상 구간 길이 안에 끝나도록 말 빠르기를 맞춘다 (너무 길면 조금 빠르게).

사용: python3 tools/make_audio.py
"""
import json, os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = {
    'en': {'narrator': 'Samantha', 'mateo': 'Eddy (영어(미국))'},
    'es': {'narrator': 'Paulina', 'mateo': 'Eddy (스페인어(멕시코))'},
}
BASE_RATE = 175   # 기본 말 빠르기 (분당 단어)
MAX_RATE = 245    # 구간이 짧아도 이 이상은 빠르게 하지 않는다
GAP = 0.2         # 구간 끝 전에 남길 여유 (초)


def duration(path):
    out = subprocess.run(['afinfo', path], capture_output=True, text=True).stdout
    return float(re.search(r'estimated duration: ([\d.]+)', out).group(1))


def speak(text, voice, rate, out):
    with tempfile.NamedTemporaryFile(suffix='.aiff', delete=False) as f:
        tmp = f.name
    subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', tmp, text], check=True)
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', '-c', '1', tmp, out], check=True)
    os.remove(tmp)
    return duration(out)


def main():
    lines = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools/narration-lines.mjs')],
                                      capture_output=True, text=True, check=True).stdout)
    manifest = {}
    for lesson in lines:
        subject, slug = lesson['subject'], lesson['slug']
        manifest[subject] = {'en': {}, 'es': {}}
        for lang in ('en', 'es'):
            folder = os.path.join(ROOT, 'assets/audio', slug, lang)
            os.makedirs(folder, exist_ok=True)
            for line in lesson['lines']:
                text = line[lang]
                if not text:
                    continue
                who = 'narrator'
                if text.startswith('Mateo:'):
                    who, text = 'mateo', text[len('Mateo:'):].strip()
                voice = VOICES[lang][who]
                out = os.path.join(folder, f"{line['id']}.m4a")
                room = max(1.0, line['seconds'] - GAP)
                rate = BASE_RATE
                secs = speak(text, voice, rate, out)
                if secs > room:  # 구간보다 길면 빠르기를 올려서 다시
                    rate = min(MAX_RATE, round(rate * secs / room * 1.04))
                    secs = speak(text, voice, rate, out)
                flag = '  ⚠ 구간보다 김' if secs > line['seconds'] else ''
                print(f"{slug:24} {lang} {line['id']:6} {secs:4.1f}s / {line['seconds']:4.1f}s  rate {rate}{flag}")
                manifest[subject][lang][line['id']] = {
                    'src': f"assets/audio/{slug}/{lang}/{line['id']}.m4a",
                    'seconds': round(secs, 2),
                }
    js = ('// 강의 내레이션 음성 목록 (tools/make_audio.py가 만든다. 직접 고치지 말 것)\n'
          '// 과목 → 언어 → 마커 번호(자막 한 줄) → 음성 파일. recap = 마지막 Recap 화면\n'
          f'export const NARRATION = {json.dumps(manifest, ensure_ascii=False, indent=2)};\n')
    with open(os.path.join(ROOT, 'data/narration.js'), 'w') as f:
        f.write(js)


if __name__ == '__main__':
    main()

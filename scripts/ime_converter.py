# ime_converter.py
# 영문 QWERTY로 한글 두벌식 자판을 잘못 친 문자열을
# 한글로 변환하는 간단 IME 유틸

from typing import List

# 두벌식 자판: 자음/모음 키 매핑
CHO_MAP = {
    "r": "ㄱ", "R": "ㄲ",
    "s": "ㄴ",
    "e": "ㄷ", "E": "ㄸ",
    "f": "ㄹ",
    "a": "ㅁ",
    "q": "ㅂ", "Q": "ㅃ",
    "t": "ㅅ", "T": "ㅆ",
    "d": "ㅇ",
    "w": "ㅈ", "W": "ㅉ",
    "c": "ㅊ",
    "z": "ㅋ",
    "x": "ㅌ",
    "v": "ㅍ",
    "g": "ㅎ",
}

JUNG_MAP = {
    "k": "ㅏ",
    "o": "ㅐ",
    "i": "ㅑ",
    "j": "ㅓ",
    "p": "ㅔ",
    "u": "ㅕ",
    "h": "ㅗ",
    "y": "ㅛ",
    "n": "ㅜ",
    "b": "ㅠ",
    "m": "ㅡ",
    "l": "ㅣ",
}

# 겹모음
COMPOUND_JUNG = {
    ("ㅗ", "ㅏ"): "ㅘ",
    ("ㅗ", "ㅐ"): "ㅙ",
    ("ㅗ", "ㅣ"): "ㅚ",
    ("ㅜ", "ㅓ"): "ㅝ",
    ("ㅜ", "ㅔ"): "ㅞ",
    ("ㅜ", "ㅣ"): "ㅟ",
    ("ㅡ", "ㅣ"): "ㅢ",
}

# 종성용 자음 → 종성 index
JONG_LIST = [
    "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ",
    "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ",
    "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ",
    "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
]

CHO_LIST = [
    "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ",
    "ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"
]

JUNG_LIST = [
    "ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ",
    "ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ",
    "ㅠ","ㅡ","ㅢ","ㅣ"
]

JUNG_MAP_TO_INDEX = {j: i for i, j in enumerate(JUNG_LIST)}
CHO_MAP_TO_INDEX = {c: i for i, c in enumerate(CHO_LIST)}
JONG_MAP_TO_INDEX = {j: i for i, j in enumerate(JONG_LIST)}


def qwerty_to_jamo(s: str) -> List[str]:
    """영문 문자열을 두벌식 자판 자모 시퀀스로 변환"""
    result: List[str] = []
    for ch in s:
        if ch in CHO_MAP:
            result.append(CHO_MAP[ch])
        elif ch in JUNG_MAP:
            result.append(JUNG_MAP[ch])
        else:
            # 한글/숫자/공백 등은 그대로 보존
            result.append(ch)
    return result


def compose_hangul(jamos: List[str]) -> str:
    """자모 리스트를 한글 음절 문자열로 조합"""
    res = []
    i = 0
    n = len(jamos)

    while i < n:
        ch = jamos[i]

        # 한글 자모가 아니면 그대로 출력
        if ch not in CHO_LIST and ch not in JUNG_LIST and ch not in JONG_LIST:
            res.append(ch)
            i += 1
            continue

        # 초성
        cho = None
        jung = None
        jong = None

        # 초성
        if ch in CHO_LIST:
            cho = ch
            i += 1
        else:
            # 초성 없이 모음만 온 경우
            jung = ch
            i += 1

        # 중성
        if jung is None and i < n and jamos[i] in JUNG_LIST:
            jung = jamos[i]
            i += 1

        # 겹모음 처리
        if jung is not None and i < n and jamos[i] in JUNG_LIST:
            pair = (jung, jamos[i])
            if pair in COMPOUND_JUNG:
                jung = COMPOUND_JUNG[pair]
                i += 1

        # 종성
        if i < n and jamos[i] in JONG_LIST:
            # 다음이 모음이면 종성이 아니라 다음 음절의 초성
            if i + 1 < n and jamos[i + 1] in JUNG_LIST:
                pass
            else:
                jong = jamos[i]
                i += 1

        # 조합 불가능한 경우 그냥 이어붙이기
        if jung is None:
            if cho:
                res.append(cho)
            continue

        # 실제 한글 음절 조합
        cho_idx = CHO_MAP_TO_INDEX.get(cho, 11)  # 없으면 ㅇ
        jung_idx = JUNG_MAP_TO_INDEX.get(jung, 0)
        jong_idx = JONG_MAP_TO_INDEX.get(jong or "", 0)

        syllable_code = 0xAC00 + (cho_idx * 21 * 28) + (jung_idx * 28) + jong_idx
        res.append(chr(syllable_code))

    return "".join(res)


def to_hangul(text: str) -> str:
    """영문 두벌식 키 입력을 한글로 변환"""
    jamos = qwerty_to_jamo(text)
    return compose_hangul(jamos)


if __name__ == "__main__":
    tests = ["tkatjd", "dkssud", "tptjd", "gkstjd", "삼성", "EKfrl"]
    for t in tests:
        print(t, "->", to_hangul(t))

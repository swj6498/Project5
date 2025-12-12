# ime_converter.py
# 두벌식 영타 → 한글 변환 (입력 완료 문자열용 오토마타)

ENG2JAMO = {
    # ㅂ
    "q": "ㅂ", "Q": "ㅃ",
    # ㅈ
    "w": "ㅈ", "W": "ㅉ",
    # ㄷ
    "e": "ㄷ", "E": "ㄸ",
    # ㄱ
    "r": "ㄱ", "R": "ㄲ",
    # ㅅ
    "t": "ㅅ", "T": "ㅆ",
    # ㅛ
    "y": "ㅛ", "Y": "ㅛ",
    # ㅕ
    "u": "ㅕ", "U": "ㅕ",
    # ㅑ
    "i": "ㅑ", "I": "ㅑ",
    # ㅐ
    "o": "ㅐ", "O": "ㅒ",
    # ㅔ
    "p": "ㅔ", "P": "ㅖ",
    # ㅁ
    "a": "ㅁ", "A": "ㅁ",
    # ㄴ
    "s": "ㄴ", "S": "ㄴ",
    # ㅇ
    "d": "ㅇ", "D": "ㅇ",
    # ㄹ
    "f": "ㄹ", "F": "ㄹ",
    # ㅎ
    "g": "ㅎ", "G": "ㅎ",
    # ㅗ
    "h": "ㅗ", "H": "ㅗ",
    # ㅓ
    "j": "ㅓ", "J": "ㅓ",
    # ㅏ
    "k": "ㅏ", "K": "ㅏ",
    # ㅣ
    "l": "ㅣ", "L": "ㅣ",
    # ㅋ
    "z": "ㅋ", "Z": "ㅋ",
    # ㅌ
    "x": "ㅌ", "X": "ㅌ",
    # ㅊ
    "c": "ㅊ", "C": "ㅊ",
    # ㅍ
    "v": "ㅍ", "V": "ㅍ",
    # ㅠ
    "b": "ㅠ", "B": "ㅠ",
    # ㅜ
    "n": "ㅜ", "N": "ㅜ",
    # ㅡ
    "m": "ㅡ", "M": "ㅡ",
}

CHO_LIST = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
JUNG_LIST = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ",
             "ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]
JONG_LIST = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ",
             "ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]

COMBO_JUNG = {
    ("ㅗ","ㅏ"):"ㅘ", ("ㅗ","ㅐ"):"ㅙ", ("ㅗ","ㅣ"):"ㅚ",
    ("ㅜ","ㅓ"):"ㅝ", ("ㅜ","ㅔ"):"ㅞ", ("ㅜ","ㅣ"):"ㅟ",
    ("ㅡ","ㅣ"):"ㅢ",
}

COMBO_JONG = {
    ("ㄱ","ㅅ"):"ㄳ", ("ㄴ","ㅈ"):"ㄵ", ("ㄴ","ㅎ"):"ㄶ",
    ("ㄹ","ㄱ"):"ㄺ", ("ㄹ","ㅁ"):"ㄻ", ("ㄹ","ㅂ"):"ㄼ",
    ("ㄹ","ㅅ"):"ㄽ", ("ㄹ","ㅌ"):"ㄾ", ("ㄹ","ㅍ"):"ㄿ", ("ㄹ","ㅎ"):"ㅀ",
    ("ㅂ","ㅅ"):"ㅄ",
}

def is_consonant(j):
    return j in CHO_LIST

def is_vowel(j):
    return j in ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅛ","ㅜ","ㅠ","ㅡ","ㅣ"]

def can_be_choseong(j):
    """겹받침처럼 초성에 올 수 없는 자모는 제외"""
    return j in CHO_LIST

def compose_syllable(cho, jung, jong=""):
    cho_i = CHO_LIST.index(cho)
    jung_i = JUNG_LIST.index(jung)
    jong_i = JONG_LIST.index(jong) if jong else 0
    return chr(0xAC00 + (cho_i * 21 * 28) + (jung_i * 28) + jong_i)

def to_hangul(text):
    # 1. 영타 → 자모
    jamos = [ENG2JAMO.get(ch, ch) for ch in text]

    result = []
    cho = jung = jong = None

    def flush():
        nonlocal cho, jung, jong
        if cho and jung:
            result.append(compose_syllable(cho, jung, jong or ""))
        else:
            if cho:
                result.append(cho)
            if jung:
                result.append(jung)
            if jong:
                result.append(jong)
        cho = jung = jong = None

    i = 0
    while i < len(jamos):
        j = jamos[i]

        if not (is_consonant(j) or is_vowel(j)):
            flush()
            result.append(j)
            i += 1
            continue

        # 1) 아무 것도 없는 상태
        if cho is None and jung is None and jong is None:
            if is_consonant(j):
                cho = j
            else:
                jung = j
            i += 1
            continue

        # 2) 초성 있음
        if cho and jung is None and jong is None:
            if is_vowel(j):
                jung = j
            else:
                flush()
                cho = j
            i += 1
            continue

        # 3) 초성 + 중성
        if cho and jung and jong is None:
            if is_vowel(j):
                pair = (jung, j)
                if pair in COMBO_JUNG:
                    jung = COMBO_JUNG[pair]
                else:
                    flush()
                    if is_vowel(j):
                        jung = j
                    else:
                        cho = j
            else:
                if j in JONG_LIST:
                    jong = j
                else:
                    flush()
                    cho = j
            i += 1
            continue

        # 4) 초성 + 중성 + 종성
        if cho and jung and jong:
            if is_vowel(j):
                # 도깨비불
                if can_be_choseong(jong):
                    prev = jong
                    result.append(compose_syllable(cho, jung, ""))
                    cho = prev
                    jung = j
                    jong = None
                else:
                    result.append(compose_syllable(cho, jung, jong))
                    cho = None
                    jung = j
                    jong = None
                i += 1
                continue
            else:
                # 겹받침 후보
                if (jong, j) in COMBO_JONG:
                    # 다음 글자가 모음이면 겹받침 금지 → 도깨비불 우선
                    if i + 1 < len(jamos) and is_vowel(jamos[i+1]):
                        flush()
                        cho = j
                    else:
                        jong = COMBO_JONG[(jong, j)]
                else:
                    flush()
                    cho = j
                i += 1
                continue

    flush()
    return "".join(result)

if __name__ == "__main__":
    tests = ["EKfrl", "tkatjd", "gktpdy", "dldi", "gkssk"]
    for t in tests:
        print(t, "→", to_hangul(t))

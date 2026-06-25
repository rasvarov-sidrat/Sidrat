from __future__ import annotations

import re
from pathlib import Path


MOJIBAKE_MARKERS = ("Р", "С", "р", "с", "џ", "°", "±", "µ", "Ѓ", "Љ")


def decode_mojibake(value: str) -> str:
    if not any(marker in value for marker in MOJIBAKE_MARKERS):
        return value
    for encoding in ("cp1251", "latin1"):
        try:
            decoded = value.encode(encoding).decode("utf-8")
        except UnicodeError:
            continue
        if decoded != value and any("\u0400" <= ch <= "\u04FF" for ch in decoded):
            return decoded
    return value


def fix_quoted_strings(text: str) -> str:
    def replacer(match: re.Match[str]) -> str:
        quote = match.group(1)
        body = match.group(2)
        fixed = decode_mojibake(body)
        return f"{quote}{fixed}{quote}"

    return re.sub(r"(['`])(.*?)\1", replacer, text, flags=re.DOTALL)


def main() -> None:
    path = Path(__file__).resolve().parents[1] / "src" / "lib" / "mvp.ts"
    original = path.read_text(encoding="utf-8")
    fixed = fix_quoted_strings(original)
    if fixed == original:
        raise SystemExit("No changes made")
    path.write_text(fixed, encoding="utf-8", newline="\n")
    print(f"Fixed {path}")


if __name__ == "__main__":
    main()

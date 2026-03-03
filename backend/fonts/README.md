# Backend Fonts Directory

Place font TTF files here so the PDF exporter picks them up automatically on **any platform** (Windows, Linux, macOS, Docker).

## Recommended Font (covers Latin + Devanagari/Marathi)

Download **Noto Sans Devanagari** from Google Fonts:

1. Go to https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari
2. Download the family
3. Place these two files here:

```
backend/
  fonts/
    NotoSansDevanagari-Regular.ttf   ← required
    NotoSansDevanagari-Bold.ttf      ← optional (used for headings)
```

> **On Windows** the system font `Nirmala.ttf` (found at `C:\Windows\Fonts`) is used automatically and also supports Marathi — so no extra files are needed if the backend runs on Windows.

## Font Priority Order

1. `backend/fonts/NotoSansDevanagari-Regular.ttf` (bundled — cross-platform)
2. `C:\Windows\Fonts\Nirmala.ttf` (Windows system font)
3. `/usr/share/fonts/...` (Linux system Noto fonts)
4. PDFKit built-in Helvetica (fallback — Devanagari will NOT render)

#!/usr/bin/env python3
"""Local Vosk speech-to-text helper used by Slice (lib/ai/whisper.ts).

Reads a 16kHz mono WAV path from argv[1] and prints a JSON array of
segments with word-level timestamps to stdout.
"""
import sys
import json
import wave

MODEL_DIR = sys.argv[2] if len(sys.argv) > 2 else "models/vosk-en-us"


def main():
    wav_path = sys.argv[1]
    import vosk

    vosk.SetLogLevel(-1)
    model = vosk.Model(MODEL_DIR)
    rec = vosk.KaldiRecognizer(model, 16000)
    if hasattr(rec, "SetWords"):
        rec.SetWords(True)  # enable word-level timestamps

    wf = wave.open(wav_path, "rb")
    sample_rate = wf.getframerate()
    if sample_rate != 16000:
        wf.close()
        print("[]")
        return
    data = wf.readframes(wf.getnframes())

    segments = []
    CHUNK = 32000
    offset = 0
    current = None

    def flush(seg_words):
        if not seg_words:
            return
        nonlocal current
        text = " ".join(w["word"] for w in seg_words)
        start = seg_words[0]["start"]
        end = seg_words[-1]["end"]
        if current and start - current["end"] < 0.35:
            current["text"] += " " + text
            current["end"] = end
            current["words"].extend(seg_words)
        else:
            current = {
                "start": start,
                "end": end,
                "text": text,
                "words": [
                    {"start": w["start"], "end": w["end"], "text": w["word"], "confidence": w.get("conf", 1.0)}
                    for w in seg_words
                ],
            }
            segments.append(current)

    while offset < len(data):
        chunk = data[offset : offset + CHUNK]
        offset += CHUNK
        if rec.AcceptWaveform(chunk):
            res = json.loads(rec.Result())
            if res.get("result"):
                flush(res["result"])
    final = json.loads(rec.FinalResult())
    if final.get("result"):
        flush(final["result"])

    # trim leading silence from first segment start
    if segments and segments[0]["start"] < 0:
        segments[0]["start"] = 0.0

    print(json.dumps(segments))


if __name__ == "__main__":
    main()

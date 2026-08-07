#!/usr/bin/env python3
"""Motion + face tracking helper for Slice.

Reads a 1fps sample video once, computes frame-to-frame motion magnitude and
Haar-cascade face boxes, emitting one JSON line per frame.
"""
import sys
import json
import cv2

def main(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        sys.exit(1)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
    )
    prev = None
    t = 0.0
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(frame, (160, 90))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        if prev is not None:
            diff = cv2.absdiff(gray, prev)
            motion = float(diff.mean() / 255.0)
        else:
            motion = 0.0
        prev = gray
        print(json.dumps({"t": round(t, 2), "motion": round(motion, 4)}))

        # faces on the grayscale full frame
        g2 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        g2 = cv2.equalizeHist(g2)
        dets = cascade.detectMultiScale(g2, 1.1, 5, minSize=(40, 40))
        boxes = sorted([tuple(map(int, b)) for b in dets], key=lambda b: b[2] * b[3], reverse=True)
        h, w = g2.shape
        for (x, y, bw, bh) in boxes[:4]:
            print(json.dumps({
                "t": round(t, 2),
                "x": round((x + bw / 2) / w, 4),
                "y": round((y + bh / 2) / h, 4),
                "w": round(bw / w, 4),
                "h": round(bh / h, 4),
                "confidence": 0.85,
            }))
        t += 1.0 / fps
    cap.release()

if __name__ == "__main__":
    main(sys.argv[1])

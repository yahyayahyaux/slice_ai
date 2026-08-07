#!/usr/bin/env python3
"""Face tracking helper used by Slice (lib/ai/vision.ts).

Reads a low-fps video, runs OpenCV Haar cascade face detection on each frame
and writes one JSON line per frame with normalized face boxes.
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
    profile = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_profileface.xml"
    )
    t = 0.0
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        dets = cascade.detectMultiScale(gray, 1.1, 5, minSize=(24, 24))
        profs = profile.detectMultiScale(gray, 1.1, 5, minSize=(24, 24))
        all_boxes = [tuple(map(int, b)) for b in dets] + [tuple(map(int, b)) for b in profs]
        # keep the largest face (speaker focus) plus others
        all_boxes = sorted(all_boxes, key=lambda b: b[2] * b[3], reverse=True)
        if all_boxes:
            h, w = gray.shape
            for (x, y, bw, bh) in all_boxes[:4]:
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

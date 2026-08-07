import { createRequire } from "module";
import { existsSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);

console.log("Slice postinstall: verifying processing binaries…");

try {
  const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
  console.log("  ffmpeg:", ffmpegPath, existsSync(ffmpegPath) ? "OK" : "MISSING");
} catch (e) {
  console.warn("  ffmpeg not installed:", e instanceof Error ? e.message : e);
}

try {
  const ffprobePath = require("ffprobe-static").path;
  console.log("  ffprobe:", ffprobePath, existsSync(ffprobePath) ? "OK" : "MISSING");
} catch (e) {
  console.warn("  ffprobe not installed:", e instanceof Error ? e.message : e);
}

console.log("Postinstall done.");

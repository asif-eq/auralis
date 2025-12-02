// apps/recorder-worker/src/recorder/startRecording.ts


import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function startRecording(meetingId: string) {
  const output = path.resolve(`./recordings/${meetingId}.mkv`);
  fs.mkdirSync('./recordings', { recursive: true });

  console.log(`🎥 Recording started -> ${output}`);

  const ffmpeg = spawn('ffmpeg', [
    // input from display
    '-f', 'avfoundation',
    '-i', '1',                     // <--- macOS display input index (we will detect if needed)

    // video capture
    '-vcodec', 'libx264',
    '-preset', 'fast',

    // audio (system audio) — requires BlackHole/Loopback
    '-acodec', 'aac',
    '-b:a', '128k',
    
    // save file
    output
  ]);

  ffmpeg.stderr.on('data', data => {
    const text = data.toString();
    if (text.includes('frame=')) process.stdout.write(`🟢 Capturing video...\r`);
  });

  ffmpeg.on('close', () => console.log(`📁 Recording saved -> ${output}`));

  return ffmpeg;
}

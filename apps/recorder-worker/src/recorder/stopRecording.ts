import { ChildProcessWithoutNullStreams } from 'child_process';

export function stopRecording(ffmpeg: ChildProcessWithoutNullStreams) {
  if (ffmpeg && !ffmpeg.killed) {
    ffmpeg.stdin.write('q'); // gracefully stop recording
  }
}

// src/utils/upload.ts

export async function uploadRecording(filePath: string): Promise<void> {
  console.log(`[UPLOAD-DUMMY] Pretending to upload: ${filePath}`);
  // Simulate async delay
  await new Promise(resolve => setTimeout(resolve, 500));
}

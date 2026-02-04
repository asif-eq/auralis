import whisperx
import uuid
import os
import json

folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'
file = 'sample1.wav'

def main():
    device = "cpu"
    model_name = "small"

    print("Loading WhisperX model...", flush=True)
    model = whisperx.load_model(
        model_name,
        device,
        compute_type="float32"
    )

    print("Loading audio...", flush=True)
    audio = whisperx.load_audio(folder+file)

    print("Transcribing...", flush=True)
    result = model.transcribe(
        audio,
        batch_size=8,
        language="en"
    )

    segments = []
    for seg in result["segments"]:
        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": seg["start"],
            "end": seg["end"],
            "speaker": "UNKNOWN",
            "text": seg["text"].strip()
        })

    print(json.dumps(segments, indent=2))

    # Force clean exit (important for ML workers)
    os._exit(0)

if __name__ == "__main__":
    main()


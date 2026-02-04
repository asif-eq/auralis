import whisperx
import uuid

def diarise_audio(audio_path: str):
    device = "cpu"
    model_name = "small"

    print("Loading Whisper model...", flush=True)
    model = whisperx.load_model(model_name, device, compute_type="float32")

    print("Loading audio...", flush=True)
    audio = whisperx.load_audio(audio_path)

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
            "speaker_id": "UNKNOWN",
            "text": seg["text"].strip()
        })

    return segments

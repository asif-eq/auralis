import whisperx
import torch
import uuid


torch.set_num_threads=1

def diarise_audio(audio_path: str):
    device = "cpu"  

    # 1. Load Whisper model
    model = whisperx.load_model(
        "small",
        device=device,
        compute_type="float32"
    )

    # 2. Transcribe 
    result = model.transcribe(audio_path, batch_size=2)

    # 3. Lightweight diarisation model
    diarize_model = whisperx.DiarizationPipeline(
        # model_name="pyannote/speaker-diarization-3.1-lite",
        model_name="pyannote/speaker-diarization-3.1",
        use_auth_token=True,
        device=device
    )

    diarization = diarize_model(audio_path)

    # 4. Assign speakers
    result = whisperx.assign_word_speakers(diarization, result)

    # 5. Format output
    segments = []
    for seg in result["segments"]:
        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": seg["start"],
            "end": seg["end"],
            "speaker_id": seg.get("speaker", "UNKNOWN"),
            "text": seg["text"].strip()
        })

    return segments

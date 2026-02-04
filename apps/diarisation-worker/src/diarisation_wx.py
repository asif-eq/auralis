import whisperx
import torch
import uuid

def diarise_audio(
    audio_path: str,
    device: str = "cuda" if torch.cuda.is_available() else "cpu",
    model_name: str = "small"
):
    # 1. Load Whisper model
    model = whisperx.load_model(
        model_name,
        device=device,
        compute_type="float16" if device == "cuda" else "float32"
    )

    # 2. Load audio
    audio = whisperx.load_audio(audio_path)

    # 3. Transcribe
    result = model.transcribe(audio, batch_size=16, language='en')

    # 4. Align words
    align_model, metadata = whisperx.load_align_model(
        language_code=result["language"],
        device=device
    )

    result = whisperx.align(
        result["segments"],
        align_model,
        metadata,
        audio,
        device
    )

    # 5. Diarisation model
    diarize_model = whisperx.DiarizationPipeline(
        use_auth_token=True,  # requires HF token
        device=device
    )

    diarization = diarize_model(audio)

    # 6. Assign speakers
    result = whisperx.assign_word_speakers(diarization, result)

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

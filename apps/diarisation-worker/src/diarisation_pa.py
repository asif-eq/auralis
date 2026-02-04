import uuid
from pyannote.audio import Pipeline

def diarise_audio(audio_path: str, hf_token: str, num_speakers: int | None = None):
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )

    if num_speakers is not None:
        diarization = pipeline(audio_path, num_speakers=num_speakers)
    else:
        diarization = pipeline(audio_path)

    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": float(turn.start),
            "end": float(turn.end),
            "speaker_id": str(speaker),
            "text": "",
        })

    return segments

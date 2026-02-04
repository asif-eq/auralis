import uuid
from speechbrain.inference.diarization import SpeakerDiarization

def diarise_audio(audio_path: str):
    """
    CPU‑safe, stable diarization using SpeechBrain.
    Returns segments with speaker labels and timestamps.
    """

    # 1. Load SpeechBrain diarization pipeline
    diarizer = SpeakerDiarization.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        savedir="tmp_speechbrain_diar"
    )

    # 2. Run diarization
    diarization = diarizer.diarize_file(audio_path)

    # 3. Convert SpeechBrain RTTM-style output into your segment format
    segments = []
    for turn in diarization.get_timeline().support():
        speaker = diarization.get_labels(turn)[0]  # e.g., 'SPEAKER_00'
        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": float(turn.start),
            "end": float(turn.end),
            "speaker_id": speaker,
            "text": ""  # SpeechBrain does not transcribe
        })

    return segments


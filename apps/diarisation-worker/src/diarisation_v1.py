import uuid
from pyannote.audio import Pipeline
import whisper


# ---------------------------------------------------------
# 1. DIARISATION FUNCTION (pyannote)
# ---------------------------------------------------------
def run_diarisation(audio_path: str, hf_token: str, num_speakers=None):
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token,
    )

    if num_speakers is not None:
        diarization = pipeline(audio_path, num_speakers=num_speakers)
    else:
        diarization = pipeline(audio_path)

    diar_segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        diar_segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": float(turn.start),
            "end": float(turn.end),
            "speaker_id": str(speaker),
        })

    return diar_segments


# ---------------------------------------------------------
# 2. TRANSCRIPTION FUNCTION (Whisper)
# ---------------------------------------------------------
def run_transcription(audio_path: str, model_size="medium"):
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path)

    asr_segments = []
    for seg in result["segments"]:
        asr_segments.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"].strip(),
        })

    return asr_segments


# ---------------------------------------------------------
# 3. SPLIT ASR SEGMENTS AT DIAR BOUNDARIES (Solution 2)
# ---------------------------------------------------------
def split_asr_by_diar_boundaries(diar_segments, asr_segments):
    """
    Produces fine-grained ASR chunks that align exactly with diarisation boundaries.
    """

    aligned = []

    for d in diar_segments:
        d_start = d["start"]
        d_end = d["end"]

        for a in asr_segments:
            a_start = a["start"]
            a_end = a["end"]

            # If no overlap, skip
            if a_end <= d_start or a_start >= d_end:
                continue

            # Compute overlap boundaries
            overlap_start = max(d_start, a_start)
            overlap_end = min(d_end, a_end)

            # Extract proportional text slice
            full_text = a["text"]
            full_duration = a_end - a_start
            if full_duration <= 0:
                continue

            # Estimate text slice by proportional duration
            ratio_start = (overlap_start - a_start) / full_duration
            ratio_end = (overlap_end - a_start) / full_duration

            start_idx = int(ratio_start * len(full_text))
            end_idx = int(ratio_end * len(full_text))

            sliced_text = full_text[start_idx:end_idx].strip()

            aligned.append({
                "start": overlap_start,
                "end": overlap_end,
                "speaker_id": d["speaker_id"],
                "text": sliced_text,
            })

    return aligned


# ---------------------------------------------------------
# 4. MERGE SPLIT CHUNKS INTO FINAL SPEAKER TURNS
# ---------------------------------------------------------
def merge_aligned_chunks(aligned_chunks):
    """
    Merges consecutive chunks from the same speaker into final readable segments.
    """

    if not aligned_chunks:
        return []

    merged = []
    current = aligned_chunks[0].copy()

    for chunk in aligned_chunks[1:]:
        same_speaker = chunk["speaker_id"] == current["speaker_id"]
        continuous = abs(chunk["start"] - current["end"]) < 0.3

        if same_speaker and continuous:
            current["end"] = chunk["end"]
            current["text"] += " " + chunk["text"]
        else:
            merged.append(current)
            current = chunk.copy()

    merged.append(current)
    return merged


# ---------------------------------------------------------
# 5. MAIN PIPELINE
# ---------------------------------------------------------
def diarise_with_text(audio_path: str, hf_token: str, num_speakers=None):
    diar_segments = run_diarisation(audio_path, hf_token, num_speakers)
    asr_segments = run_transcription(audio_path)

    aligned_chunks = split_asr_by_diar_boundaries(diar_segments, asr_segments)
    final_segments = merge_aligned_chunks(aligned_chunks)

    return {
        "diarisation_segments": diar_segments,
        "asr_segments": asr_segments,
        "final_segments": final_segments,
    }


# ---------------------------------------------------------
# 6. EXAMPLE USAGE
# ---------------------------------------------------------
if __name__ == "__main__":
    import os
    AUDIO_FILE = "your_audio.wav"
    

    token=os.environ["HF_TOKEN"]

    folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'
    file = 'sample1_000.wav'

    result = diarise_with_text(
        audio_path=folder+file,
        hf_token=token
#        ,num_speakers=3
    )

    print("\n=== PYANNOTE DIARISATION SEGMENTS ===")
    for seg in result["diarisation_segments"]:
        print(seg)

    print("\n=== WHISPER ASR SEGMENTS ===")
    for seg in result["asr_segments"]:
        print(seg)

    print("\n=== FINAL MERGED SPEAKER SEGMENTS ===")
    for seg in result["final_segments"]:
        print(seg)

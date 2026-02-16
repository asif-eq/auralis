import uuid
from pyannote.audio import Pipeline
import whisper
import time
import os
import json





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
# 3. ALIGNER FUNCTION (PRODUCTION METHOD)
# ---------------------------------------------------------
def compute_overlap(a_start, a_end, b_start, b_end):
    return max(0.0, min(a_end, b_end) - max(a_start, b_start))


def assign_speaker_to_asr(asr_segments, diar_segments):
    """
    Assign speaker to each ASR segment using maximum overlap.
    This preserves Whisper text integrity.
    """

    aligned = []

    diar_idx = 0
    diar_len = len(diar_segments)

    for asr in asr_segments:

        best_speaker = None
        best_overlap = 0.0

        a_start = asr["start"]
        a_end = asr["end"]

        # advance diar pointer for efficiency
        while diar_idx < diar_len and diar_segments[diar_idx]["end"] <= a_start:
            diar_idx += 1

        check_idx = diar_idx

        # check overlapping diar segments
        while check_idx < diar_len and diar_segments[check_idx]["start"] < a_end:

            diar = diar_segments[check_idx]

            overlap = compute_overlap(
                a_start, a_end,
                diar["start"], diar["end"]
            )

            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = diar["speaker_id"]

            check_idx += 1

        aligned.append({
            "start": a_start,
            "end": a_end,
            "speaker_id": best_speaker if best_speaker else "UNKNOWN",
            "text": asr["text"],
        })

    return aligned


# ---------------------------------------------------------
# 4. OPTIONAL MERGE FOR CLEANER OUTPUT
# ---------------------------------------------------------
def merge_same_speaker_segments(segments, max_gap=0.5):
    """
    Merge consecutive segments from same speaker for readability.
    """

    if not segments:
        return []

    merged = []
    current = segments[0].copy()

    for seg in segments[1:]:

        same_speaker = seg["speaker_id"] == current["speaker_id"]
        gap = seg["start"] - current["end"]

        if same_speaker and gap <= max_gap:
            current["end"] = seg["end"]
            current["text"] += " " + seg["text"]
        else:
            merged.append(current)
            current = seg.copy()

    merged.append(current)
    return merged

# ---------------------------------------------------------
# 5. MAIN PIPELINE
# ---------------------------------------------------------
def diarise_with_text(audio_path: str, hf_token: str, num_speakers=None):

    diar_segments = run_diarisation(audio_path, hf_token, num_speakers)
    asr_segments = run_transcription(audio_path)

    aligned_segments = assign_speaker_to_asr(
        asr_segments,
        diar_segments
    )

    final_segments = merge_same_speaker_segments(
        aligned_segments
    )

    return {
        "diarisation_segments": diar_segments,
        "asr_segments": asr_segments,
        "aligned_segments": aligned_segments,
        "final_segments": final_segments,
    }




if __name__ == "__main__":
 

    start = time.time()

    AUDIO_FILE = "your_audio.wav"
    

    token=os.environ["HF_TOKEN"]

    # folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'

    folder = '/Users/asif/create/huzzle-workspace/auralis/misc/meetings/'
    

    # file = 'sample1.wav'
    file = 'sample3.wav'
    # file = 'sample1_000.wav'
    # file = 'sample1_000_001.wav'

    # file = 'Huzzle+Interview+_+Vinay+Singh+and+Luyanda+Hlongwa_2026-02-05T13_15_00Z.mp4'

    result = diarise_with_text(
        audio_path=folder+file,
        hf_token=token
#        ,num_speakers=3
    )

    print("\n=== PYANNOTE DIARISATION SEGMENTS ===")
    for seg in result["diarisation_segments"]:
        print(seg)

        # print(json.dumps(result['diar_final_segments'], indent=2))

    print("\n=== WHISPER ASR SEGMENTS ===")
    for seg in result["asr_segments"]:
        print(seg)

        # print(json.dumps(result['asr_final_segments'], indent=2))

    print("\n=== FINAL MERGED SPEAKER SEGMENTS ===")
    for seg in result["final_segments"]:
        print(seg)

        # print(json.dumps(result['merged_final_segments'], indent=2))

    elapsed = int(time.time() - start)

    h = elapsed // 3600
    m = (elapsed % 3600) // 60
    s = elapsed % 60

    print(f'Total Elapsed time is = {h:02}:{m:02}:{s:02}')

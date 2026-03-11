import os
import uuid
from time import perf_counter
from datetime import timedelta
from typing import List, Dict

import whisper
from pyannote.audio import Pipeline


# =========================================================
# GLOBAL MODEL CACHE (CRITICAL FOR PERFORMANCE)
# =========================================================

WHISPER_MODEL = None
DIAR_PIPELINE = None


def load_models(hf_token: str, whisper_size: str = "medium"):
    """
    Load models once and reuse (huge performance gain).
    """

    global WHISPER_MODEL, DIAR_PIPELINE

    if WHISPER_MODEL is None:
        print("Loading Whisper model...")
        WHISPER_MODEL = whisper.load_model(whisper_size)

    if DIAR_PIPELINE is None:
        print("Loading pyannote pipeline...")
        DIAR_PIPELINE = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token,
        )


# =========================================================
# DIARISATION
# =========================================================

def run_diarisation(audio_path: str, num_speakers=None) -> List[Dict]:

    if num_speakers:
        diarization = DIAR_PIPELINE(audio_path, num_speakers=num_speakers)
    else:
        diarization = DIAR_PIPELINE(audio_path)

    segments = []

    for turn, _, speaker in diarization.itertracks(yield_label=True):

        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": float(turn.start),
            "end": float(turn.end),
            "speaker_id": speaker,
        })

    return segments


# =========================================================
# TRANSCRIPTION (WORD LEVEL)
# =========================================================

def run_transcription(audio_path: str) -> List[Dict]:

    result = WHISPER_MODEL.transcribe(
        audio_path,
        word_timestamps=True,
        verbose=False,
    )

    return result["segments"]


# =========================================================
# ALIGNMENT CORE
# =========================================================

def compute_overlap(a_start, a_end, b_start, b_end):

    return max(0.0, min(a_end, b_end) - max(a_start, b_start))


def assign_speakers_to_words(asr_segments, diar_segments, tolerance=0.2):

    aligned_words = []

    last_speaker = None

    for seg in asr_segments:

        for word in seg.get("words", []):

            w_start = word["start"]
            w_end = word["end"]

            best_speaker = None
            best_overlap = 0.0

            # Pass 1: overlap with tolerance window
            for diar in diar_segments:

                overlap = compute_overlap(
                    w_start - tolerance,
                    w_end + tolerance,
                    diar["start"],
                    diar["end"]
                )

                if overlap > best_overlap:
                    best_overlap = overlap
                    best_speaker = diar["speaker_id"]

            # Pass 2: nearest speaker fallback
            if best_speaker is None:

                closest_dist = float("inf")

                for diar in diar_segments:

                    dist = min(
                        abs(w_start - diar["end"]),
                        abs(w_end - diar["start"])
                    )

                    if dist < closest_dist:
                        closest_dist = dist
                        best_speaker = diar["speaker_id"]

            # Pass 3: speaker persistence smoothing
            if last_speaker and best_speaker != last_speaker:

                # small words (<0.4s) likely misassigned
                word_duration = w_end - w_start

                if word_duration < 0.4:
                    best_speaker = last_speaker

            aligned_words.append({
                "start": w_start,
                "end": w_end,
                "speaker_id": best_speaker,
                "word": word["word"],
            })

            last_speaker = best_speaker

    return aligned_words



# =========================================================
# MERGE WORDS INTO CLEAN SEGMENTS
# =========================================================

def merge_words(words, max_gap=0.5, min_segment_duration=1.0):
    """
    Merge words into readable segments with smoothing.
    """

    if not words:
        return []

    segments = []

    current = {
        "speaker_id": words[0]["speaker_id"],
        "start": words[0]["start"],
        "end": words[0]["end"],
        "words": [words[0]],
    }

    for w in words[1:]:

        gap = w["start"] - current["end"]
        duration = current["end"] - current["start"]

        same_speaker = w["speaker_id"] == current["speaker_id"]

        # allow tiny intrusions if segment too short
        allow_intrusion = duration < min_segment_duration

        if same_speaker or allow_intrusion:

            current["end"] = w["end"]
            current["words"].append(w)

        else:

            segments.append(current)

            current = {
                "speaker_id": w["speaker_id"],
                "start": w["start"],
                "end": w["end"],
                "words": [w],
            }

    segments.append(current)

    # convert words → text
    final = []

    for seg in segments:

        text = " ".join(w["word"] for w in seg["words"])

        final.append({
            "speaker_id": seg["speaker_id"],
            "start": seg["start"],
            "end": seg["end"],
            "text": text,
        })

    return final



# =========================================================
# MAIN PIPELINE
# =========================================================

def diarise(audio_path: str, hf_token: str, num_speakers=None):

    load_models(hf_token)

    diar_segments = run_diarisation(audio_path, num_speakers)

    asr_segments = run_transcription(audio_path)

    aligned_words = assign_speakers_to_words(
        asr_segments,
        diar_segments,
    )

    final_segments = merge_words(aligned_words)

    return {
        "segments": final_segments,
        "words": aligned_words,
        "diarisation": diar_segments,
    }


# =========================================================
# TIMER UTILITY
# =========================================================

def elapsed_time(start):

    elapsed = perf_counter() - start

    return str(timedelta(seconds=int(elapsed)))


# =========================================================
# ENTRYPOINT
# =========================================================

if __name__ == "__main__":

    start = perf_counter()

    HF_TOKEN = os.environ["HF_TOKEN"]

    folder = '/Users/asif/create/huzzle-workspace/auralis/misc/meetings/'

    # file = 'sample1.wav'
    file = 'sample3.wav'

    audio_file = folder + file

    result = diarise(
        audio_file,
        HF_TOKEN,
    )

    print("\nFINAL SEGMENTS:\n")

    for seg in result["segments"]:

        print(
            f'{seg["speaker_id"]}: {seg["text"]}'
        )

    print("\nElapsed:", elapsed_time(start))

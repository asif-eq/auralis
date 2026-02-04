import uuid
import whisper
import numpy as np
import librosa

from resemblyzer import VoiceEncoder, preprocess_wav
from spectralcluster import SpectralClusterer, LaplacianType


def diarise_audio(audio_path: str, model_name: str = "small"):

    print("\n==============================")
    print("STEP 1: Loading Whisper model")
    print("==============================\n")

    model = whisper.load_model(model_name)
    print("✓ Whisper model loaded\n")

    print("==============================")
    print("STEP 2: Transcribing audio")
    print("==============================\n")

    result = model.transcribe(audio_path)
    print(f"✓ Transcription complete — {len(result['segments'])} segments\n")


    print('result after transcription,', result)

    print("==============================")
    print("STEP 3: Loading audio for diarisation")
    print("==============================\n")

    wav, sr = librosa.load(audio_path, sr=16000)
    print(f"✓ Audio loaded — {len(wav)} samples at {sr} Hz\n")

    print("==============================")
    print("STEP 4: Preprocessing audio")
    print("==============================\n")

    wav = preprocess_wav(wav, source_sr=sr)
    print("✓ Audio preprocessed for embeddings\n")

    print("==============================")
    print("STEP 5: Generating speaker embeddings")
    print("==============================\n")

    encoder = VoiceEncoder()
    _, partial_embeds, _ = encoder.embed_utterance(wav, return_partials=True)

    print(f"✓ Generated {len(partial_embeds)} partial embeddings")

    # DIAGNOSTIC PRINTS 
    duration = len(wav) / 16000
    expected_windows = duration / 1.6

    print("--------------------------------------")
    print("DEBUG: EMBEDDING COVERAGE CHECK")
    print("--------------------------------------")
    print(f"Audio duration: {duration:.2f} seconds")
    print(f"Expected embedding windows (~1.6s each): {expected_windows:.0f}")
    print(f"Actual embedding windows: {len(partial_embeds)}")
    print("--------------------------------------\n")


    print("==============================")
    print("STEP 6: Clustering speakers")
    print("==============================\n")


    clusterer = SpectralClusterer(
        min_clusters=2,
        max_clusters=10,
        stop_eigenvalue=0.001,
        laplacian_type=LaplacianType.NORMALIZED,
        refinement_options=None
)


    labels = clusterer.predict(partial_embeds)
    print(f"✓ Clustering complete — {len(set(labels))} speakers detected\n")

    print("--------------------------------------")
    print("DEBUG: SPEAKER LABEL DISTRIBUTION")
    print("--------------------------------------")
    unique, counts = np.unique(labels, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"Speaker {u}: {c} embeddings")
    print("--------------------------------------\n")





    print("==============================")
    print("STEP 7: Building diarisation segments")
    print("==============================\n")

    duration = len(wav) / 16000
    times = np.linspace(0, duration, len(labels))

    diar_segments = []
    current_speaker = labels[0]
    start_time = 0.0

    for i in range(1, len(labels)):
        if labels[i] != current_speaker:
            diar_segments.append({
                "speaker": f"Speaker_{current_speaker}",
                "start": float(start_time),
                "end": float(times[i])
            })
            current_speaker = labels[i]
            start_time = times[i]

    diar_segments.append({
        "speaker": f"Speaker_{current_speaker}",
        "start": float(start_time),
        "end": float(duration)
    })

    print(f"✓ Built {len(diar_segments)} diarisation segments\n")

    print("--------------------------------------")
    print("DEBUG: DIARISATION SEGMENT COVERAGE")
    print("--------------------------------------")
    print(f"Number of diarisation segments: {len(diar_segments)}")
    print(f"First diar segment starts at: {diar_segments[0]['start']:.2f}s")
    print(f"Last diar segment ends at: {diar_segments[-1]['end']:.2f}s")
    print(f"Audio duration: {duration:.2f}s")
    print("--------------------------------------\n")


    print("==============================")
    print("STEP 8: Assigning speakers to Whisper segments")
    print("==============================\n")

    final_segments = []

    for seg in result["segments"]:
        mid = (seg["start"] + seg["end"]) / 2
        speaker = "UNKNOWN"

        for d in diar_segments:
            if d["start"] <= mid <= d["end"]:
                speaker = d["speaker"]
                break

        final_segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": seg["start"],
            "end": seg["end"],
            "speaker_id": speaker,
            "text": seg["text"].strip()
        })

    print("✓ Speaker assignment complete\n")

    print("==============================")
    print("ALL DONE")
    print("==============================\n")

    return final_segments

import uuid
import numpy as np
from pyannote.audio import Pipeline
from speechbrain.pretrained import EncoderClassifier
from sklearn.cluster import AgglomerativeClustering

def diarise_audio(audio_path: str, hf_token: str):
    # 1. Pyannote segmentation
    segmentation_pipeline = Pipeline.from_pretrained(
        "pyannote/segmentation",
        use_auth_token=hf_token
    )
    segmentation = segmentation_pipeline(audio_path)

    # Extract speech turns
    speech_turns = list(segmentation.itersegments())

    # 2. Load ECAPA speaker embedding model
    ecapa = EncoderClassifier.from_hparams(
        source="speechbrain/spkrec-ecapa-voxceleb",
        savedir="tmp_ecapa"
    )

    # 3. Compute embeddings for each turn
    embeddings = []
    for start, end in speech_turns:
        emb = ecapa.encode_file(audio_path, start=start, end=end)
        embeddings.append(emb.squeeze().numpy())

    embeddings = np.vstack(embeddings)

    # 4. Cluster embeddings into speakers
    n_speakers = None  # Let clustering decide
    clustering = AgglomerativeClustering(
        n_clusters=n_speakers,
        distance_threshold=1.0,
        linkage="ward"
    )
    labels = clustering.fit_predict(embeddings)

    # 5. Build final segments
    segments = []
    for (start, end), speaker in zip(speech_turns, labels):
        segments.append({
            "segment_id": str(uuid.uuid4()),
            "start": float(start),
            "end": float(end),
            "speaker_id": f"SPEAKER_{speaker}",
            "text": ""
        })

    return segments

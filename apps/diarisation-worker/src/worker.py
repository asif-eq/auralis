import json
import sys
from diarisation import diarise_audio

if __name__ == "__main__":
    """
    Expected stdin JSON:
    {
      "meeting_id": "uuid",
      "audio_path": "/recordings/meeting.wav"
    }
    """

    payload = json.loads(sys.stdin.read())

    segments = diarise_audio(payload["audio_path"])

    output = {
        "meeting_id": payload["meeting_id"],
        "segments": segments
    }

    print(json.dumps(output))

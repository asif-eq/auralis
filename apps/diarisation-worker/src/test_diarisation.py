# from diarisation import diarise_audio
# from diarisation_asr import diarise_audio
# from diarisation_lite import diarise_audio
from diarisation_wx import diarise_audio

import os
import json

hf_token=os.environ["HF_TOKEN"]

folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'

file = 'sample1_000.wav'
# file = 'test_meeting.webm'

audio_path = folder + file

segments = diarise_audio(audio_path, hf_token,num_speakers=5)

print(json.dumps(segments, indent=2))

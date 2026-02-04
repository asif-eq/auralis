# from diarisation import diarise_audio
# from diarisation_asr import diarise_audio
# from diarisation_lite import diarise_audio
from diarisation_pa import diarise_audio


import json


folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'

file = 'sample1_000.wav'
# file = 'test_meeting.webm'

audio_path = folder + file

segments = diarise_audio(audio_path)

print(json.dumps(segments, indent=2))

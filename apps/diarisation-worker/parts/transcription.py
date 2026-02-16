import whisper
from pprint import pprint

def transcribe_audio(audio_path: str, model_name: str = "small"):

    model = whisper.load_model(model_name)
    result = model.transcribe(audio_path)

    pprint(result)

    print(type(result['segments']))
    print(type(result['language']))
    print(type(result['text']))



if __name__ == '__main__':

    folder = '/Users/asif/create/huzzle-workspace/auralis/misc/samples/'
    file = 'sample1_000_0.wav'

    transcribe_audio(folder+file)

import subprocess
from pathlib import Path


def mp4_to_wav(infile, outfile):

    command = [
        'ffmpeg',
        '-y',
        '-loglevel', 'error',
        '-i', str(infile),
        '-vn',
        '-af', 'highpass=f=80,lowpass=f=7600,aresample=16000',
        '-ac', '1',
        '-ar', '16000',
        '-c:a', 'pcm_s16le',
        '-f', 'wav',
        str(outfile),
    ]

    subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )

    return outfile

if __name__ == "__main__":


    folder = Path('/Users/asif/create/huzzle-workspace/auralis/misc/meetings/')
    

 
    infile = folder / 'sample3.mp4'
    outfile = folder / 'sample3.wav'
    
    mp4_to_wav(infile, outfile)


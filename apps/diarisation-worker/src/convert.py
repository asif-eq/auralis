import subprocess
from pathlib import Path


def mp4_to_wav(infile):

    outfile = infile.with_suffix('.wav')

    command = [
        'ffmpeg',
        '-y', 
        '-i', str(infile),
        '-vn',
        '-af', 'loudnorm',    # normalisation
        '-ac', '1',
        '-ar', '16000',
        '-c:a', 'pcm_s16le',
        str(outfile),

    ]

    subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )

if __name__ == "__main__":


    folder = Path('/Users/asif/create/huzzle-workspace/auralis/misc/meetings/')
    
    # file = 'sample1.mp4'
    file = 'sample3.mp4' # normalised file
 
    infile = folder / file
    outfile = mp4_to_wav(infile)


"""Synthesise the boss-fight BGM as a raw square/sawtooth chiptune loop.

Same technique as the SFX in public/assets/CREDITS.md (stdlib wave/struct/math,
hand-tuned waveforms) --- no samples, no external audio, fully original.
Run: python3 scripts/gen_boss_theme.py
"""
import math
import struct
import wave

SAMPLE_RATE = 44100
AMP = 9000


def square(freq, t, duty=0.5):
    phase = (t * freq) % 1.0
    return 1.0 if phase < duty else -1.0


def saw(freq, t):
    phase = (t * freq) % 1.0
    return 2.0 * phase - 1.0


NOTE_HZ = {
    "C3": 130.81, "D3": 146.83, "Eb3": 155.56, "F3": 174.61, "G3": 196.00,
    "Ab3": 207.65, "Bb3": 233.08,
    "C4": 261.63, "D4": 293.66, "Eb4": 311.13, "F4": 349.23, "G4": 392.00,
    "Ab4": 415.30, "Bb4": 466.16, "C5": 523.25, "D5": 587.33, "Eb5": 622.25,
    "F5": 698.46, "G5": 783.99,
}

TEMPO_BPM = 168
BEAT = 60.0 / TEMPO_BPM

# C natural-minor riff, driving and tense -- distinct key/tempo/register from
# the existing seong_retro_adventure.mp3 (a warmer, slower major-key piece).
LEAD = [
    ("C4", 0.5), ("Eb4", 0.5), ("G4", 0.5), ("C5", 0.5),
    ("Bb4", 0.5), ("G4", 0.5), ("Eb4", 0.5), ("D4", 0.5),
    ("C4", 0.5), ("Eb4", 0.5), ("F4", 0.5), ("G4", 0.5),
    ("Ab4", 0.5), ("G4", 0.5), ("F4", 0.5), ("Eb4", 0.5),
]
BASS = [
    ("C3", 1.0), ("G3", 1.0),
    ("Ab3", 1.0), ("Eb3", 1.0),
    ("C3", 1.0), ("F3", 1.0),
    ("Ab3", 1.0), ("Bb3", 1.0),
]


def envelope(t, dur, attack=0.01, release=0.03):
    if t < attack:
        return t / attack
    if t > dur - release:
        return max(0.0, (dur - t) / release)
    return 1.0


def render_track(notes, wave_fn, gain, octave_shift=1):
    samples = []
    for name, beats in notes:
        dur = beats * BEAT
        freq = NOTE_HZ[name] * octave_shift
        n = int(SAMPLE_RATE * dur)
        for i in range(n):
            t = i / SAMPLE_RATE
            env = envelope(t, dur)
            samples.append(wave_fn(freq, t) * env * gain)
    return samples


def mix(*tracks):
    length = max(len(t) for t in tracks)
    out = []
    for i in range(length):
        v = sum(t[i] if i < len(t) else 0.0 for t in tracks)
        out.append(max(-1.0, min(1.0, v)))
    return out


def main():
    lead = render_track(LEAD, lambda f, t: square(f, t, 0.35), gain=0.5)
    bass = render_track(BASS, saw, gain=0.35)
    mixed = mix(lead, bass)

    with wave.open("public/assets/audio/boss_theme.wav", "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        frames = b"".join(struct.pack("<h", int(s * AMP)) for s in mixed)
        f.writeframes(frames)

    print(f"wrote public/assets/audio/boss_theme.wav ({len(mixed) / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()

# Critique: draft-v12 (闪击波兰)

Seen as a first-time viewer, the film reads clearly. Gold is crated in Warsaw, the trucks head south, the route is drawn on the map, the train crosses at Śniatyń and the ship loads at Constanța. Then the east goes dark, the two red flags rise over Brest, and the ship is at sea under the title. The ending answers the question the film opened with: the gold got out. The cuts at 40.000 and 46.000 fall exactly on the music edit. The QC report found no black frames, freezes, duplicate frames, one-frame pops or repeated compositions. The hook passes.

## 1. 00:40–00:46: the scripted near-silence is the loudest scene in the film
- What the numbers show: scene #6 (40.0–46.0) measures **-10.8 LUFS**, 2.9 LU above the film's median (-13.7) and louder than every other scene. The silence detector finds no stretch below -50 dB anywhere in the film. The harsh band is -33.9 dB, so the energy sits low: a rumble, drone or boom fills the gap where the music stops. The picture is the eastern front closing (the 17.IX.1939 map). It is the one moment built to be heard as a breath, and the viewer gets the loudest wall of sound in the film instead.
- Smallest fix: bring the 40–46 bed down to about -35 LUFS (about 24 LU lower). Keep at most one short low hit (≤0.5 s, ≈-18 LUFS) on the cut at 40.0 or when the east goes dark at about 43.5. Then re-measure, so that scene #6 reads at least 15 LU under the median.

## 2. 00:13 and 00:18–00:21, 00:43–00:45: the map leaves its medallion and the frame
- What a viewer sees (sheet tiles 13, 18–21, 44–45):
  - At 13 s the ROMÂNIA label is cut off by the bottom edge of the frame.
  - At 18–21 the round medallion sits so low and so far left that its top crosses the top of the frame, with POLSKA right under it.
  - At 44–45 the darkened Poland grows past its circle and runs off the top edge of the frame, so the shape looks out of place.
  - On the dark hatching, the black place names (WARSZAWA, LUBLIN, BRZEŚĆ, ŁUCK) and the dotted gold route almost disappear. At half size they cannot be read on a phone.
- Smallest fix:
  - Clip the map to its circle, or scale the map down about 15% at 43–46.
  - Keep the whole medallion inside the frame with a margin of at least 4% at 13 s and 18–21 s.
  - When the fill darkens, switch the labels and the route to paper-coloured with a 1–2 px dark halo, or keep a light halo behind each name.

## 3. 00:48–00:56: about 8 s of the same parade picture
- What a viewer sees (sheet tiles 48–56): after the caption 德苏联合阅兵 finishes typing at about 48, the composition never changes. The same flags, façade, stand and caption stay up while tanks scroll along the bottom. Then 56–60 cuts to a held seascape. QC flags scene #8 "nothing moves", and its sound is the quietest in the film (-20.6 LUFS, 7.0 LU under the median). The two shared-red flags are the point of the shot, yet they sit at the edges, partly against the caption box.
- Smallest fix: start a slow push-in at about 50 s, scaling about 12–15% toward the reviewing stand and the two flags, so the shot develops and lands on the flags by the cut at 56.08. No new element and no change to the timing are needed.

Verdict: FIX
Red items:
- 00:40–00:46 scripted near-silence measures -10.8 LUFS, the loudest scene in the film; the pause does not exist
Polish: The ending (56–60) is 2–5 kHz +4.2 dB over the median at -20.6 LUFS. Soften the top end about 3 dB, or lift the bed about 3 LU so the last chord does not read thin and edgy. The Constanța caption box (32–35) briefly covers the stern of the ship; move it to clear the hull. Make sure the Ś/Ć in BRZEŚĆ on the map label are drawn, since at half size it read as "BRZESC" and should match the parade caption. The hammer head briefly leaves the top-right of the frame at 4 s.
Evidence: review/qc-draft-v12/sheet.jpg (1 tile/s, 0–59 s); strips strip-8s, strip-27s, strip-47s (and strip-9.5s, strip-29s, strip-44.5s, strip-18s, strip-56s generated); review/qc-draft-v12/report.txt: loudness I -13.7 LUFS, TP -2.1 dBFS, LRA 12.3; per-scene sound #3 -18.1, #4 -19.6, #6 -10.8 (harsh -33.9 dB), #8 -20.6 (harsh +4.2 dB); no silences < -50 dB; cuts 4.833/12.125/21.333/31.208/40.000/46.000/56.083; scene #8 action residual 0.93 (nothing moves); 0 black, 0 frozen, 0 duplicates, 0 pops, 0 repeats; ffprobe 960x540, 24 fps, 60.000 s.

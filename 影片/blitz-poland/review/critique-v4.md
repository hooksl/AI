# Critique, draft-v4 (60 s, 960x540, 24 fps)

## 1. 00:36-00:40 · The gold never gets on the ship
What a viewer sees: at 34.5 s the crane lowers the BANK POLSKI crate onto the deck, and by 36.0 it is resting beside the funnel. Then the ship sails right, but the crate stays hooked to the crane rope at the same x. It slides through the funnel and deckhouse (37.5, 38.5) and at 39.9 hangs in mid-air off the stern while the ship leaves without it. The film's last line is "the gold is already at sea", but the picture shows the gold left on the quay crane.
Evidence: frames 34.5 / 36.0 / 37.5 / 38.5 / 39.2 / 39.9 (crop of the ship). The sheet tiles 00:36-00:39 show it too.
Smallest fix: when the crate touches the deck (~35.8 s), unhook it from the rope and parent it to the ship, so it moves with the hull. Over 36-38 s, raise the empty hook about 120 px.

## 2. 00:00-00:04.8 · The opening reads as jump cuts, and its one line of type flashes by
What a viewer sees: there are three shots of the same crate, cut at 2.71 s and 3.83 s. Each shot lasts about 1 s and the crate jumps position at every cut (compare 2.6, 2.75, 3.87), so the hammer strikes play as glitches rather than beats. The stencil BANK POLSKI is only complete from about 4.5 s and is cut away at 4.83 s, so it is on screen for about 0.3 s, too short to read on a phone, and the hammer head sits over the last "I" (4.6). This is the only moment that tells you whose gold it is.
Evidence: frames 2.6 / 2.75 / 3.8 / 3.87 / 4.4 / 4.6 / 4.8, strip-2s, hard cuts in the report at 2.708, 3.833 and 4.833.
Smallest fix: keep one crate framing and cut on the hammer motion inside it, without moving the crate. Stamp BANK POLSKI by 4.0 s and hold it to about 5.4 s, so it is readable for at least 1.2 s (move the 4.83 cut about +0.6 s and take that time from the truck shot). Move the hammer clear of the lettering.

## 3. 00:05-00:60 · The sound is loud and soft in the wrong places
What a viewer gets, judged from the numbers alone: the trucks (4.8-12.1) run at -10.8 LUFS (+5.6 LU over the median) and the parade (46-56) at -12.0 (+4.4 LU). The border crossing (21.3-31.2), the turning point of the story, is the quietest scene at -20.1 (-3.7 LU). The east-front map (40-46) is harsh, with 2-5 kHz +7.3 dB over the median, and the ending (56-60) is quiet and harsh as well (-4.5 LU, +3.2 dB). LRA is 13.1 LU across 60 s. Integrated -13.8 LUFS and peak -2.5 dBFS are within target.
Smallest fix: trucks -4 dB, parade -3 dB, crossing +3 dB. Shelve 2-5 kHz down about 5 dB over 40-46 s and about 3 dB over 56-60 s. Re-measure: every scene within 3 LU of the median.

Verdict: FIX
Red items:
- 00:36-00:40: the gold crate stays on the crane rope, passes through the funnel and deckhouse, and is left hanging in the air as the ship sails, which contradicts the ending
Polish: At 9-12 s the bomb smoke rises straight out of the bus roof and travels with it (it reads as a chimney), and the translucent blast ring sits over the bus at 9 s, so anchor the burst behind the road and let it drift back. The map labels "LUCK" without the Ł, beside BRZEŚĆ and ŚNIATYŃ, so make it ŁUCK. At 40-43.9 s the map from 21 s comes back with no caption for about 4 s, so bring in "17.IX.1939 东线" at about 40.5 s. At 56-60 s nothing moves (the gold glint on the ship is a pinpoint), so let the ship drift about 30 px and make the glint 2-3x larger. "八十吨黄金 向南" uses a space where a native writer would punctuate: use "八十吨黄金，南运" or "八十吨黄金，一路向南". "西线 / 东线" works; "德军西来 / 苏军东进" would say who closes each front.
Evidence: review/qc-draft-v4/sheet.jpg (1 fps); strips strip-2s, strip-26s, strip-40s, strip-46s, strip-56s; single frames at 2.6, 2.75, 3.4, 3.8, 3.87, 4.4, 4.6, 4.8, 4.9, 7.0, 9.0, 12.0, 21.25, 28.5, 30.8, 34.5-39.9 (ship crop), 40.5, 43.0, 50.0, 55.5, 57.0, 59.8; report.txt: cuts, per-scene LUFS and harsh band, LRA 13.1, I -13.8 LUFS, peak -2.5 dBFS, no black/frozen/duplicate/pop frames, scene 8 flagged static.

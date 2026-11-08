# Critique: draft-v10 (闪击波兰)

The film is clear and complete. It opens on a crate of gold stamped BANK POLSKI. The convoy runs south under air attack, the map draws the route between the two fronts, the train crosses at Śniatyń and the crate is loaded at Constanța. The east closes on the map, the parade plays at Brest, and the film ends on a ship at sea under the title. Cuts land on the music joins at 40.000 and 46.000. Nothing is blank, frozen, duplicated or popping. The three problems below are about whether a viewer can read the film, not about broken frames.

## 1. The dates are too small to read on a phone. Every caption, worst at 44-56 s
- **What a viewer sees:** each caption has two lines: a Latin place and date, then the Chinese text. The Latin line ("WARSZAWA · IX.1939" at 3 s, "SNIATYN · 13.IX.1939" at 29 s, "17.IX.1939" at 44 s, "BRZESC · 22.IX.1939" at 49 s) is about 7 px tall on a 540-line frame, roughly 1.3% of the frame height. At 1 s per sheet tile it is a grey smear. The film's turn, "four days later the east closes", rests only on reading 13.IX at 29 s and then 17.IX at 44 s. On a phone a viewer gets 西线 and 东线 but never the four days, and never the date of the parade.
- **Seen in:** sheet.jpg tiles 3, 17-21, 29-31, 44-45, 48-56. strip-43s.jpg and strip-46s.jpg (the date line arrives and stays unreadable).
- **Smallest fix:** make the Latin and date line about 70% bigger, to a cap height of 12 px or more at 540p (about 2.2% of frame height). Keep the Chinese line as it is, and widen the caption cards to fit.

## 2. Polish place names are spelled two ways. Captions at 27-31 s and 46-56 s, map at 13-21 s and 40-45 s
- **What a viewer sees:** the map spells BRZEŚĆ and ŚNIATYŃ correctly (thumb at 42 s). The captions for those same places drop the marks: "SNIATYN · 13.IX.1939" at 27-31 s and "BRZESC · 22.IX.1939" at 47-56 s. The map also writes LUCK for Łuck, which a Polish reader sees as a misspelling and an English reader sees as the word "luck". A native reader sees the same town written correctly and then incorrectly within seconds.
- **Seen in:** thumb-draft-v10-42s-768.jpg (map labels); sheet tiles 28-31 and 48-56; strip-27s.jpg and strip-46s.jpg.
- **Smallest fix:** change three strings: the caption to ŚNIATYŃ, the caption to BRZEŚĆ, and the map label to ŁUCK. Check that the caption font has the glyphs Ś, Ć, Ń and Ł.

## 3. The ending holds still and its subject is a speck. 56.1-60 s
- **What a viewer sees:** the parade cuts to 4 s of sea at sunset. qc flags it as "nothing moves" (residual 0.77, the only flagged scene). The only subject is a ship about 25 px wide on the horizon, smaller than the sun. The payoff, that the gold is already at sea while the invaders parade, depends on the viewer recognising that speck as the Constanța ship from 32-39 s. On a phone it reads as an empty seascape with a title. The sound also drops here, to -20.6 LUFS against a -13.7 median, with 2-5 kHz 4.2 dB above the median. That is the recording's own quiet passage, but nothing on screen fills it.
- **Seen in:** sheet tiles 57-59; strip-56s.jpg; report.txt scene #8.
- **Smallest fix:** make the ship about twice as large, keeping its Constanța silhouette (two funnels, smoke). Give it a slow drift away, about 20-30 px over the 4 s, so the last shot carries the gold out rather than standing still.

Verdict: FIX
Red items: none
Polish: The roadside trees at 5-12 s are identical evenly spaced pale ovals and read as clip-art, so vary their size and spacing about ±20%. At 36-40 s the crane is empty and the ship barely moves, so start the 40 s map 1-2 s earlier or let the ship pull out visibly. At 44-45 s the map push-in sends the darkened Poland past the circle and up to the top of the frame, so ease the zoom about 10% so POLSKA stays inside. At 44-45 s, on the fully darkened map, the black labels on dark hatching (LUBLIN, BRZEŚĆ) lose contrast; give them a light halo.
Evidence: qc sheet at 1 s (review/qc-draft-v10/sheet.jpg, 60 tiles). Strips at 8, 27, 43, 46 and 56 s (2 s, 12 frames each). thumb-draft-v10-42s-768.jpg. report.txt: I -13.7 LUFS, peak -2.1 dBFS, LRA 12.3, 7 hard cuts with 40.000 and 46.000 on the music joins, 0 black, 0 freezes, 0 pops, 0 repeats, scene #8 residual 0.77. Per-second momentary loudness from ffprobe ebur128: 41-43 s and 45 s at about -45 LUFS (the scripted near-silence holds), one hit at 44 s (-7.9) where the east darkens and 东线 types in, 16-30 s at -19 to -27 (the recording's quiet passage), 56-59 s at -19 to -23. ffprobe: 960x540, 24 fps, 60.000 s.

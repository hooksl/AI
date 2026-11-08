# Critique: draft-v14 (960x540, 60.0 s, 24 fps)

## Three biggest problems, worst first

1. **43.0 s: the thud lands before anything happens on the map.**
   The brief puts the one heavy thud at 43 s, when the east front closes. In the frame at 43.5 s (thumb-draft-v14-43.5s-960.jpg), half a second after the hit, the eastern half of Poland (Brześć, Łuck, Śniatyń) is still clean paper. The only dark area is the western shade, which keeps creeping east as it has since 40 s, and the 17.IX card has typed only "17.IX". In strip-42s the eastern shade first shows in roughly the 11th tile (~43.7 s) and covers the country by 44-45 s (sheet). So the viewer hears the boom and sees the east close 0.6-0.8 s later. This is the film's one hit, and it lands off the picture.
   Fix: start the eastern shade from the right edge of Poland on the frame of the thud. Shift the east-front shade and the 17.IX card about 0.7 s earlier so the first visible eastern shading is at 43.0 s, or move the thud to about 43.7 s. Either way the closure should be visibly moving within 2 frames of the hit.

2. **12-31 s and 56-60 s: the sound sags in the middle and at the end.**
   The per-scene figures in report.txt: the map scene (12.1-21.3 s) is -17.9 LUFS and the train-and-bridge scene (21.3-31.2 s) is -19.3 LUFS. Those are 3.9 and 5.4 LU under the -13.9 median, between scenes at -11.2 and -13.7. The title ending (56.1-60 s) is -20.3 LUFS, 6.4 LU down, and is the harshest scene: 2-5 kHz sits 4.1 dB over the median. Over the middle 19 s the score drops away under the picture, and the last thing the viewer hears is a thin, edgy tail under the title.
   Fix: raise 12-31 s by about +3 dB so it lands within 2 LU of the median. On 56-60 s, cut 2-5 kHz by about 3-4 dB, and if the fade is not meant to be that deep, raise it by about 3 dB. The integrated level (-13.8 LUFS, peak -2.1 dBFS) has room for both.

3. **8.5-12 s: an unreadable grey shape rises over the convoy.**
   In thumb-draft-v14-8s-960.jpg and the 9-12 s tiles of the sheet, a large grey, head-shaped puff swells behind the bus and over the trees. A pale ring blooms at the bus wheels at about 8.8 s (strip-8s). The only cause on screen is a speck of an aircraft at 7 s, a few pixels wide at this size. A first-time viewer sees a ghostly blob rather than a bomb near-miss, so it reads as a glitch.
   Fix: make the attacker readable. Enlarge the plane about 3x and hold it for at least 1 s before the burst, and give the burst a flash or debris on its first 2-3 frames. Otherwise, remove the puff and the ring.

## What holds
- Captions read correctly as native Chinese: 华沙, 八十吨黄金 向南, 西线, 越过边境, 康斯坦察, 东线, 德苏联合阅兵. The Polish letters are present (BRZEŚĆ, ŁUCK, ŚNIATYŃ, CONSTANȚA).
- The opening hook passes (mean 4.50). There are no black frames, freezes, duplicates, pops or repeated compositions.
- The arc from Warsaw to the road, the map, the border, Constanța, the east closing, Brest and the ship at sea under 闪击波兰 answers the question the film opens with: whether the gold gets out.

Verdict: FIX
Red items:
- 43.0 s: the thud plays 0.6-0.8 s before the east front visibly closes. At 43.5 s the eastern map is still blank, so the hit lands off the picture.
Polish: The map labels (LUBLIN, ŁUCK, ŚNIATYŃ, about 12 px tall at 960) will be too small on a phone. Set them about 30% larger. In the 40-46 s recap, WARSZAWA and LUBLIN sit inside the dark shade and read only as a white halo, so lift their halo or move them out of it. The ending (56-60 s) is flagged "nothing moves" (residual 0.90): give the ship a slightly faster drift or a little smoke so the title doesn't sit on a still frame.
Evidence: review/qc-draft-v14/sheet.jpg (1 frame a second); strips strip-8s, strip-27s, strip-42s, strip-46s; full frames thumb-draft-v14-8s/14s/28s/43.5s/50s-960.jpg; phone-8/20/50 (generated, not opened); report.txt: cuts at 4.83/12.13/21.33/31.21/40.0/46.0/56.08; loudness I -13.8 LUFS, LRA 12.1 LU, peak -2.1 dBFS, no silences; sceneloud #3 -17.9, #4 -19.3, #8 -20.3 LUFS with 2-5 kHz +4.1 dB; action flag on #8 (0.90).

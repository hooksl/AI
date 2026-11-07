python3 tools/asset_search.py search --q "Chopin prelude piano" --type music --licence cc0,pd --max-wait 20 --out research/music-a > logs/music-a.log 2>&1 &
python3 tools/asset_search.py search --q "dark cello string quartet" --type music --licence cc0,pd --max-wait 20 --out research/music-b > logs/music-b.log 2>&1 &
python3 tools/asset_search.py search --q "Chopin" --type sound --sources wikimedia --max-wait 20 --out research/music-c > logs/music-c.log 2>&1 &
python3 tools/asset_search.py search --q "gold bar ingot" --sources met,aic,cleveland --n 2 --max-wait 20 --out research/gold > logs/ref-gold.log 2>&1 &
python3 tools/asset_search.py search --q "1930s truck" --sources aic,met,cleveland --n 2 --max-wait 20 --out research/truck > logs/ref-truck.log 2>&1 &
python3 tools/asset_search.py search --q "Dniester bridge Zaleszczyki" --sources wikimedia --n 2 --max-wait 20 --out research/bridge > logs/ref-bridge.log 2>&1 &
wait

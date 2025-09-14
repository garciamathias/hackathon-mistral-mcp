# Init
curl -s -X POST http://localhost:3000/api/game/init | jq .

# State
curl -s http://localhost:3000/api/game/6df5b779-6158-4a75-a34e-f7fcbb0a627c/state | jq .


# Giant rouge
curl -s -X POST http://localhost:3000/api/game/spawn \
  -H "Content-Type: application/json" \
  -d '{"game_id":"6df5b779-6158-4a75-a34e-f7fcbb0a627c","troop_type":"GIANT","team":"red","position":{"row":20,"col":8}}' | jq .

# Baby Dragon bleu
curl -s -X POST http://localhost:3000/api/game/spawn \
  -H "Content-Type: application/json" \
  -d '{"game_id":"<GAME_ID>","troop_type":"BABY_DRAGON","team":"blue","position":{"row":25,"col":10}}' | jq .

# Mini P.E.K.K.A rouge
curl -s -X POST http://localhost:3000/api/game/spawn \
  -H "Content-Type: application/json" \
  -d '{"game_id":"<GAME_ID>","troop_type":"MINI_PEKKA","team":"red","position":{"row":18,"col":6}}' | jq .

# Valkyrie bleue
curl -s -X POST http://localhost:3000/api/game/spawn \
  -H "Content-Type: application/json" \
  -d '{"game_id":"<GAME_ID>","troop_type":"VALKYRIE","team":"blue","position":{"row":28,"col":12}}' | jq .

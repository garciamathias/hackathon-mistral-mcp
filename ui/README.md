Projet : Replicate the Clash Royale game playable on website human vs Bot (not online multi-player)
Find this project on vercel : mcp-hackthon.vercel.app

└── ui
    ├── components
    ├── components.json
    ├── eslint.config.mjs
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── public
    │   ├── font
    │   │   └── SUPERCELL-MAGIC.ttf
    │   └── images
    │       ├── backgrounds
    │       │   ├── arena_in_game.png
    │       │   ├── arena_logo.png
    │       │   ├── goal.png
    │       │   ├── main_menu_background.png
    │       │   └── waiting_page_template.png
    │       ├── cards
    │       │   └── more
    │       │       ├── BabyDragonCard.png
    │       │       ├── FireballCard.png
    │       │       ├── GiantCard.png
    │       │       ├── MiniPEKKACard.png
    │       │       ├── ValkyrieCard.png
    │       │       ├── card_box.png
    │       │       ├── cards_icon.png
    │       │       └── cards_menu_background.png
    │       ├── events
    │       │   └── winning screen.png
    │       ├── gifs
    │       │   ├── Arrows_fight-rage_opponent_176-176.gif
    │       │   ├── Arrows_fight-rage_player_176-176.gif
    │       │   ├── Arrows_fight_opponent_176-176.gif
    │       │   ├── Arrows_fight_player_176-176.gif
    │       │   ├── BabyDragon_fight-rage_opponent_90-134.gif
    │       │   ├── BabyDragon_fight-rage_player_90-134.gif
    │       │   ├── BabyDragon_fight_opponent_90-134.gif
    │       │   ├── BabyDragon_fight_player_90-134.gif
    │       │   ├── BabyDragon_walk-rage_opponent_88-80.gif
    │       │   ├── BabyDragon_walk-rage_player_82-75.gif
    │       │   ├── BabyDragon_walk_opponent_88-80.gif
    │       │   ├── BabyDragon_walk_player_82-75.gif
    │       │   ├── FireBall_fight-rage_opponent_154-154.gif
    │       │   ├── FireBall_fight-rage_player_154-154.gif
    │       │   ├── FireBall_fight_opponent_154-154.gif
    │       │   ├── FireBall_fight_player_154-154.gif
    │       │   ├── Tower_fight-rage_opponent_66-176.gif
    │       │   ├── Tower_fight-rage_player_66-176.gif
    │       │   ├── Tower_fight_opponent_66-176.gif
    │       │   ├── Tower_fight_player_66-176.gif
    │       │   └── splash_screen_time_line.gif
    │       ├── towers
    │       │   ├── king_blue.png
    │       │   ├── king_red.png
    │       │   ├── princess_blue.png
    │       │   └── princess_red.png
    │       └── troops
    │           ├── babydragon
    │           │   ├── BabyDragon_fight_opponent.gif
    │           │   ├── BabyDragon_fight_player.gif
    │           │   ├── BabyDragon_walk_opponent.gif
    │           │   └── BabyDragon_walk_player.gif
    │           ├── giant
    │           │   ├── Giant_fight_opponent.gif
    │           │   ├── Giant_fight_player.gif
    │           │   ├── Giant_walk_opponent.gif
    │           │   └── Giant_walk_player.gif
    │           ├── minipekka
    │           │   ├── MiniPekka_fight_opponent_66-54.gif
    │           │   ├── MiniPekka_fight_player_66-54.gif
    │           │   ├── MiniPekka_walk_opponent_62-62.gif
    │           │   └── MiniPekka_walk_player_62-62.gif
    │           └── valkyrie
    │               ├── Valkyrie_fight_opponent_132-132.gif
    │               ├── Valkyrie_fight_player_132-132.gif
    │               ├── Valkyrie_walk_opponent_46-52.gif
    │               └── Valkyrie_walk_player_46-52.gif
    ├── src
    │   ├── app
    │   │   ├── arena
    │   │   │   └── page.tsx
    │   │   ├── favicon.ico
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components
    │   │   ├── ClashTimer.tsx
    │   │   ├── GameEndScreen.tsx
    │   │   ├── TowerHealthBar.tsx
    │   │   ├── TransitionScreen.tsx
    │   │   └── ui
    │   │       ├── button.tsx
    │   │       ├── card.tsx
    │   │       └── input.tsx
    │   ├── game
    │   │   ├── GameEngine.ts
    │   │   ├── troops
    │   │   │   ├── BabyDragon.ts
    │   │   │   ├── Giant.ts
    │   │   │   ├── MiniPekka.ts
    │   │   │   └── Valkyrie.ts
    │   │   ├── types
    │   │   │   ├── Tower.ts
    │   │   │   └── Troop.ts
    │   │   ├── useGameEngine.ts
    │   │   └── utils
    │   │       └── troop_utils.ts
    │   └── lib
    │       └── utils.ts
    ├── tsconfig.json
    └── tsconfig.tsbuildinfo
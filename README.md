Projet : Répliquer le jeu Clash Royale jouable sur site web humain vs Bot (not online multi-player)

La grande majorité du travail est à faire dans le frontend et c'est normal, ça va etre un long travail, mais j'amerais qu'on avance petit a petit et qu'on puisse suivre la progression tout au long de l'avancée, la j'aimerais juste qu'on ait un rendering fonctionne :

├── README.md
├── backend
├── docs
├── frontend
│   ├── README.md
│   ├── app
│   │   ├── api
│   │   │   ├── game
│   │   │   │   ├── [gameId]
│   │   │   │   │   └── route.ts
│   │   │   │   └── create
│   │   │   │       └── route.ts
│   │   │   └── user
│   │   │       ├── history
│   │   │       │   └── route.ts
│   │   │       └── profile
│   │   │           └── route.ts
│   │   ├── game
│   │   │   ├── [gameId]
│   │   │   │   └── page.tsx
│   │   │   ├── arena
│   │   │   │   └── page.tsx
│   │   │   └── waiting
│   │   │       └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── menu
│   │   │   ├── battle-deck
│   │   │   │   └── page.tsx
│   │   │   ├── history
│   │   │   │   └── page.tsx
│   │   │   ├── main
│   │   │   │   └── page.tsx
│   │   │   ├── profile
│   │   │   │   └── page.tsx
│   │   │   └── training
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── cards
│   │   │   ├── Card.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   └── CardTooltip.tsx
│   │   ├── game
│   │   │   ├── CardHand.tsx
│   │   │   ├── ElixirBar.tsx
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── GameTimer.tsx
│   │   │   ├── GameUI.tsx
│   │   │   └── TowerHealth.tsx
│   │   ├── layout
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── menus
│   │   │   ├── BattleDeckMenu.tsx
│   │   │   ├── HistoryMenu.tsx
│   │   │   ├── MainMenu.tsx
│   │   │   ├── ProfileMenu.tsx
│   │   │   ├── TrainingCampMenu.tsx
│   │   │   └── WaitingPage.tsx
│   │   └── ui
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── eslint.config.mjs
│   ├── game
│   │   ├── controllers
│   │   │   ├── BaseController.ts
│   │   │   ├── BotController.ts
│   │   │   ├── OnlineController.ts
│   │   │   └── TwoPlayerController.ts
│   │   ├── engine
│   │   │   ├── Animation.ts
│   │   │   ├── GameEngine.ts
│   │   │   ├── Physics.ts
│   │   │   └── Renderer.ts
│   │   ├── entities
│   │   │   ├── Card.ts
│   │   │   ├── GameEntity.ts
│   │   │   ├── Tower.ts
│   │   │   └── Troop.ts
│   │   ├── models
│   │   │   ├── BotModeModel.ts
│   │   │   ├── GameModel.ts
│   │   │   └── OnlineModeModel.ts
│   │   └── utils
│   │       ├── CollisionDetection.ts
│   │       ├── GameMath.ts
│   │       └── Pathfinding.ts
│   ├── hooks
│   │   ├── useGame.ts
│   │   ├── useGameState.ts
│   │   └── useWebSocket.ts
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── images
│   │   │   ├── backgrounds
│   │   │   │   ├── arena.jpeg
│   │   │   │   ├── arena_logo.png
│   │   │   │   └── main_menu_background.png
│   │   │   ├── cards
│   │   │   ├── towers
│   │   │   └── ui
│   │   │       └── button_yellow.png
│   │   ├── next.svg
│   │   ├── sounds
│   │   ├── sprites
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── src
│   │   └── app
│   │       ├── favicon.ico
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── store
│   │   ├── gameStore.ts
│   │   └── uiStore.ts
│   ├── styles
│   │   ├── components.css
│   │   ├── game.css
│   │   └── globals.css
│   ├── tsconfig.json
│   └── utils
│       ├── constants.ts
│       ├── helpers.ts
│       └── validation.ts
├── scripts
└── shared

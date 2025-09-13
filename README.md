clash-royale-web/
├── 📁 frontend/                          # Application Next.js
│   ├── 📁 app/                           # App Router (Next.js 14)
│   │   ├── 📄 layout.tsx                 # Layout principal
│   │   ├── 📄 page.tsx                   # Page d'accueil
│   │   ├── 📁 auth/                      # Pages d'authentification
│   │   │   ├── 📄 login/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 register/
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 game/                      # Pages de jeu
│   │   │   ├── 📁 [gameId]/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📁 waiting/
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 menu/                      # Pages de menu
│   │   │   ├── 📄 main/
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 profile/
│   │   │   │   └── 📁 page.tsx
│   │   │   ├── 📁 battle-deck/
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 history/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 training/
│   │   │       └── 📄 page.tsx
│   │   └── 📁 api/                       # API Routes
│   │       ├── 📁 auth/
│   │       │   ├── 📁 login/
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📄 register/
│   │       │       └── 📄 route.ts
│   │       ├── 📁 game/
│   │       │   ├── 📄 create/
│   │       │   │   └── 📄 route.ts
│   │       │   └── 📄 [gameId]/
│   │       │       └── 📄 route.ts
│   │       └── 📁 user/
│   │           ├── 📁 profile/
│   │           │   └── 📁 route.ts
│   │           └── 📄 history/
│   │               └── 📄 route.ts
│   ├── 📁 components/                    # Composants React
│   │   ├── 📁 ui/                        # Composants UI de base
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Input.tsx
│   │   │   ├── 📄 Modal.tsx
│   │   │   └── 📄 Card.tsx
│   │   ├── 📁 auth/                      # Composants d'authentification
│   │   │   ├── 📄 LoginForm.tsx
│   │   │   ├── 📄 RegisterForm.tsx
│   │   │   └── 📄 AuthGuard.tsx
│   │   ├── 📁 menus/                     # Composants de menu
│   │   │   ├── 📄 MainMenu.tsx
│   │   │   ├── 📄 ProfileMenu.tsx
│   │   │   ├── 📄 BattleDeckMenu.tsx
│   │   │   ├── 📄 HistoryMenu.tsx
│   │   │   ├── 📄 TrainingCampMenu.tsx
│   │   │   └── 📄 WaitingPage.tsx
│   │   ├── 📁 game/                      # Composants de jeu
│   │   │   ├── 📄 GameCanvas.tsx         # Canvas principal
│   │   │   ├── 📄 GameUI.tsx            # Interface de jeu
│   │   │   ├── 📄 CardHand.tsx          # Main de cartes
│   │   │   ├── 📄 ElixirBar.tsx         # Barre d'élixir
│   │   │   ├── 📄 TowerHealth.tsx       # Santé des tours
│   │   │   └── 📁 GameTimer.tsx         # Timer de partie
│   │   ├── 📁 cards/                     # Composants de cartes
│   │   │   ├── 📄 Card.tsx
│   │   │   ├── 📄 CardPreview.tsx
│   │   │   └── 📄 CardTooltip.tsx
│   │   └── 📁 layout/                    # Composants de layout
│   │       ├── 📄 Header.tsx
│   │       ├── 📄 Footer.tsx
│   │       └── 📄 Sidebar.tsx
│   ├── 📁 game/                          # Moteur de jeu
│   │   ├── 📁 engine/                    # Moteur principal
│   │   │   ├── 📁 GameEngine.ts
│   │   │   ├── 📄 Renderer.ts
│   │   │   ├── 📄 Physics.ts
│   │   │   └── 📁 Animation.ts
│   │   ├── 📁 entities/                  # Entités du jeu
│   │   │   ├── 📄 GameEntity.ts
│   │   │   ├── 📄 Card.ts
│   │   │   ├── 📄 Tower.ts
│   │   │   └── 📄 Troop.ts
│   │   ├── 📁 controllers/               # Contrôleurs de jeu
│   │   │   ├── 📁 BaseController.ts
│   │   │   ├── 📄 OnlineController.ts
│   │   │   ├── 📄 BotController.ts
│   │   │   └── 📄 TwoPlayerController.ts
│   │   ├── 📁 models/                    # Modèles de jeu
│   │   │   ├── 📁 GameModel.ts
│   │   │   ├── 📄 OnlineModeModel.ts
│   │   │   └── 📄 BotModeModel.ts
│   │   └── 📁 utils/                     # Utilitaires de jeu
│   │       ├── 📄 CollisionDetection.ts
│   │       ├── 📄 Pathfinding.ts
│   │       └── 📄 GameMath.ts
│   ├── 📁 hooks/                         # Hooks React personnalisés
│   │   ├── 📄 useGame.ts
│   │   ├── 📄 useWebSocket.ts
│   │   ├── 📄 useAuth.ts
│   │   └── 📄 useGameState.ts
│   ├── 📁 store/                         # État global (Zustand/Redux)
│   │   ├── 📄 authStore.ts
│   │   ├── 📄 gameStore.ts
│   │   └── 📄 uiStore.ts
│   ├── 📁 utils/                         # Utilitaires frontend
│   │   ├── 📄 constants.ts
│   │   ├── 📄 helpers.ts
│   │   └── 📄 validation.ts
│   ├── 📁 styles/                        # Styles CSS
│   │   ├── 📄 globals.css
│   │   ├── 📄 components.css
│   │   └── 📄 game.css
│   ├── 📁 public/                        # Assets statiques
│   │   ├── 📁 images/
│   │   │   ├── 📁 cards/                 # Images des cartes
│   │   │   ├── 📁 towers/                 # Images des tours
│   │   │   ├── 📁 ui/                     # Images UI
│   │   │   └── 📁 backgrounds/           # Arrière-plans
│   │   ├── 📁 sounds/                    # Sons du jeu
│   │   └── 📁 sprites/                   # Sprites animés
│   ├── 📄 next.config.js                 # Configuration Next.js
│   ├── 📄 tailwind.config.js             # Configuration Tailwind
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
├── 📁 backend/                           # Serveur Node.js (optionnel)
│   ├── 📁 src/
│   │   ├── 📁 auth/                      # Authentification
│   │   │   ├── 📄 AuthHandler.ts
│   │   │   └── 📄 AuthMiddleware.ts
│   │   ├── 📁 game/                      # Logique de jeu serveur
│   │   │   ├── 📁 GameManager.ts
│   │   │   ├── 📄 Matchmaking.ts
│   │   │   └── 📄 GameValidator.ts
│   │   ├── 📁 websocket/                 # WebSocket handlers
│   │   │   ├── 📁 WebSocketServer.ts
│   │   │   ├── 📄 GameSocketHandler.ts
│   │   │   └── 📄 AuthSocketHandler.ts
│   │   ├── 📁 database/                  # Base de données
│   │   │   ├── 📄 connection.ts
│   │   │   ├── 📄 models/
│   │   │   │   ├── 📄 User.ts
│   │   │   │   ├── 📄 Game.ts
│   │   │   │   └── 📄 GameHistory.ts
│   │   │   └── 📄 migrations/
│   │   ├── 📁 workers/                   # Workers/Threads
│   │   │   ├── 📁 PlayerWorker.ts
│   │   │   └── 📄 GameWorker.ts
│   │   └── 📄 server.ts                  # Serveur principal
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
├── 📁 shared/                            # Code partagé
│   ├── 📁 types/                         # Types TypeScript
│   │   ├── 📄 User.ts
│   │   ├── 📁 Card.ts
│   │   ├── 📄 Tower.ts
│   │   ├── 📄 Game.ts
│   │   └── 📄 Protocol.ts
│   ├── 📁 enums/                         # Énumérations
│   │   ├── 📁 CardStatus.ts
│   │   ├── 📄 GameType.ts
│   │   ├── 📄 UserLevel.ts
│   │   └── 📄 Type.ts
│   ├── 📁 protocols/                     # Protocoles réseau
│   │   ├── 📁 auth/
│   │   │   ├── 📄 LoginCommand.ts
│   │   │   ├── 📄 RegisterCommand.ts
│   │   │   └── 📄 AuthResponse.ts
│   │   ├── 📁 game/
│   │   │   ├── 📁 GameStartCommand.ts
│   │   │   ├── 📄 GameEndCommand.ts
│   │   │   └── 📄 GameStateCommand.ts
│   │   ├── 📁 cards/
│   │   │   ├── 📄 CardAddedCommand.ts
│   │   │   └── 📄 CardDeletedCommand.ts
│   │   └── 📁 towers/
│   │       ├── 📄 TowerActiveCommand.ts
│   │       └── 📄 TowerDestroyedCommand.ts
│   ├── 📁 models/                        # Modèles partagés
│   │   ├── 📁 cards/
│   │   │   ├── 📄 BaseCard.ts
│   │   │   ├── 📄 Troop.ts
│   │   │   ├── 📄 Spell.ts
│   │   │   ├── 📄 Building.ts
│   │   │   └── 📁 troops/
│   │   │       ├── 📄 Archer.ts
│   │   │       ├── 📄 Barbarian.ts
│   │   │       ├── 📄 BabyDragon.ts
│   │   │       ├── 📁 Giant.ts
│   │   │       ├── 📄 MiniPekka.ts
│   │   │       ├── 📄 Valkyrie.ts
│   │   │       └── 📄 Wizard.ts
│   │   │   └── 📁 spells/
│   │   │       ├── 📄 Arrows.ts
│   │   │       ├── 📄 FireBall.ts
│   │   │       └── 📁 Rage.ts
│   │   │   └── 📁 buildings/
│   │   │       ├── 📄 Cannon.ts
│   │   │       └── 📄 InfernoTower.ts
│   │   ├── 📄 User.ts
│   │   ├── 📄 Tower.ts
│   │   ├── 📄 KingTower.ts
│   │   └── 📄 QueenTower.ts
│   ├── 📁 interfaces/                    # Interfaces
│   │   ├── 📄 Attackable.ts
│   │   ├── 📄 Drawable.ts
│   │   └── 📄 Updatable.ts
│   ├── 📁 exceptions/                    # Exceptions
│   │   ├── 📄 GameException.ts
│   │   ├── 📄 NetworkException.ts
│   │   └── 📄 ValidationException.ts
│   └── 📁 constants/                     # Constantes
│       ├── 📄 GameConstants.ts
│       ├── 📄 CardStats.ts
│       └── 📄 TowerStats.ts
├── 📁 docs/                              # Documentation
│   ├── 📄 README.md
│   ├── 📄 API.md
│   ├── 📄 DEPLOYMENT.md
│   └── 📁 architecture/
│       ├── 📄 overview.md
│       └── 📄 components.md
├── 📁 scripts/                           # Scripts utilitaires
│   ├── 📁 build.sh
│   ├── 📄 deploy.sh
│   └── 📄 migrate-assets.js
├── 📄 package.json                       # Package principal
├── 📄 tsconfig.json                      # Configuration TypeScript
├── 📄 .env.example                       # Variables d'environnement
├── 📄 .gitignore
├── 📄 docker-compose.yml                 # Docker (optionnel)
└── 📄 README.md
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { gameEngine } from "@/game/GameEngine";
import { TroopType } from "@/game/types/Troop";

const handler = createMcpHandler(
  (server) => {
    // Outil pour démarrer le jeu
    server.tool(
      "start_game",
      "Démarre une nouvelle partie de Clash Royale",
      {},
      async () => {
        gameEngine.start();
        const stats = gameEngine.getGameStats();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "Game started",
              gameStats: stats
            }, null, 2)
          }]
        };
      }
    );

    // Outil pour déployer une troupe
    server.tool(
      "deploy_troop",
      "Déploie une troupe sur le terrain de bataille",
      {
        troopType: z.enum(["giant", "babyDragon", "miniPekka", "valkyrie"]),
        row: z.number(),
        col: z.number(),
        team: z.enum(["red", "blue"])
      },
      async ({ troopType, row, col, team }) => {
        gameEngine.spawnTroop(troopType as TroopType, team as 'red' | 'blue', row, col);
        
        const troops = gameEngine.getAllTroops();
        const lastTroop = troops[troops.length - 1];
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "Troop deployed",
              troop: {
                id: lastTroop?.id,
                type: lastTroop?.type,
                team: lastTroop?.team,
                position: { row: lastTroop?.row, col: lastTroop?.col },
                health: lastTroop?.health
              }
            }, null, 2)
          }]
        };
      }
    );

    // Outil pour récupérer l'état du jeu
    server.tool(
      "get_game_state",
      "Récupère l'état actuel du jeu",
      {},
      async () => {
        const troops = gameEngine.getAllTroops();
        const towers = gameEngine.getAllTowers();
        const stats = gameEngine.getGameStats();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              troops: troops,
              towers: towers,
              gameStats: stats
            }, null, 2)
          }]
        };
      }
    );

    // Outil pour analyser une stratégie
    server.tool(
      "analyze_strategy",
      "Analyse une stratégie Clash Royale",
      {
        situation: z.string().describe("Description de la situation de jeu")
      },
      async ({ situation }) => {
        const troops = gameEngine.getAllTroops();
        const analysis = {
          currentTroops: troops.length,
          blueTroops: troops.filter(t => t.team === 'blue').length,
          redTroops: troops.filter(t => t.team === 'red').length,
          situation: situation,
          recommendation: "Analysez les troupes adverses et contre-attaquez avec des unités efficaces"
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(analysis, null, 2)
          }]
        };
      }
    );
  },
  // Options serveur MCP
  {
    name: "clash-royale-mcp",
    version: "1.0.0"
  },
  // Options adapter
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: true
  }
);

export { handler as GET, handler as POST };

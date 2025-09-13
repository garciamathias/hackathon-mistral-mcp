import { NextRequest, NextResponse } from "next/server";
import { gameEngine } from "@/game/GameEngine";
import { TroopType } from "@/game/types/Troop";

// Interface pour les outils MCP
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Définition des outils disponibles
const tools: MCPTool[] = [
  {
    name: "start_game",
    description: "Démarre une nouvelle partie de Clash Royale",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "deploy_troop",
    description: "Déploie une troupe sur le terrain de bataille",
    inputSchema: {
      type: "object",
      properties: {
        troopType: {
          type: "string",
          enum: ["giant", "babyDragon", "miniPekka", "valkyrie"],
          description: "Type de troupe à déployer"
        },
        row: {
          type: "number",
          description: "Position ligne (0-31)"
        },
        col: {
          type: "number",
          description: "Position colonne (0-17)"
        },
        team: {
          type: "string",
          enum: ["red", "blue"],
          description: "Équipe (rouge ou bleue)"
        }
      },
      required: ["troopType", "row", "col", "team"]
    }
  },
  {
    name: "get_game_state",
    description: "Récupère l'état actuel du jeu (troupes, tours, statistiques)",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "analyze_strategy",
    description: "Analyse une stratégie Clash Royale",
    inputSchema: {
      type: "object",
      properties: {
        situation: {
          type: "string",
          description: "Description de la situation de jeu"
        }
      },
      required: ["situation"]
    }
  }
];

// Fonction pour exécuter un outil
async function executeTool(name: string, args: any) {
  switch (name) {
    case "start_game":
      try {
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
      } catch (error) {
        throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case "deploy_troop":
      const { troopType, row, col, team } = args;
      
      // Validation complète des arguments
      const validTroopTypes = ["giant", "babyDragon", "miniPekka", "valkyrie"];
      const validTeams = ["red", "blue"];
      
      if (!troopType || !validTroopTypes.includes(troopType)) {
        throw new Error(`Invalid troopType. Must be one of: ${validTroopTypes.join(", ")}`);
      }
      
      if (typeof row !== 'number' || row < 0 || row > 31) {
        throw new Error("Invalid row. Must be a number between 0 and 31");
      }
      
      if (typeof col !== 'number' || col < 0 || col > 17) {
        throw new Error("Invalid col. Must be a number between 0 and 17");
      }
      
      if (!team || !validTeams.includes(team)) {
        throw new Error(`Invalid team. Must be one of: ${validTeams.join(", ")}`);
      }
      
      try {
        gameEngine.spawnTroop(troopType as TroopType, team as 'red' | 'blue', row, col);
        const troops = gameEngine.getAllTroops();
        const lastTroop = troops[troops.length - 1];
        
        if (!lastTroop) {
          throw new Error("Failed to spawn troop");
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "Troop deployed",
              troop: {
                id: lastTroop.id,
                type: lastTroop.type,
                team: lastTroop.team,
                position: { row: lastTroop.row, col: lastTroop.col },
                health: lastTroop.health
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to deploy troop: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case "get_game_state":
      try {
        const allTroops = gameEngine.getAllTroops();
        const allTowers = gameEngine.getAllTowers();
        const gameStats = gameEngine.getGameStats();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              troops: allTroops,
              towers: allTowers,
              gameStats: gameStats
            }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to get game state: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case "analyze_strategy":
      const { situation } = args;
      if (!situation || typeof situation !== 'string') {
        throw new Error("Situation parameter is required and must be a string");
      }
      
      try {
        const currentTroops = gameEngine.getAllTroops();
        const analysis = {
          currentTroops: currentTroops.length,
          blueTroops: currentTroops.filter(t => t.team === 'blue').length,
          redTroops: currentTroops.filter(t => t.team === 'red').length,
          situation: situation,
          recommendation: "Analysez les troupes adverses et contre-attaquez avec des unités efficaces"
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(analysis, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to analyze strategy: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Handler pour les requêtes HTTP
export async function GET() {
  return NextResponse.json({
    message: "Clash Royale MCP Server",
    version: "1.0.0",
    endpoints: {
      tools: "POST /api/mcp/[transport]",
      call_tool: "POST /api/mcp/[transport]"
    },
    availableTransports: ["tools", "call_tool", "mcp"],
    note: "Use any transport name in the URL. All endpoints accept both tools/list and tools/call methods."
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    if (method === "tools/list") {
      return NextResponse.json({
        tools: tools
      });
    } else if (method === "tools/call") {
      const { name, arguments: args } = params;
      const result = await executeTool(name, args);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Unknown method" }, { status: 400 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

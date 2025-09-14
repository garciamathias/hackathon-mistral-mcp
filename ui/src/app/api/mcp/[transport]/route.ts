// ui/src/app/api/mcp/[transport]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { gameEngine } from "@/game/GameEngine";
import { TroopType } from "@/game/types/Troop";

type JsonRpcReq = { jsonrpc?: "2.0"; id?: number | string | null; method: string; params?: any };
const tools = [
  {
    name: "start_game",
    description: "Démarre une nouvelle partie de Clash Royale",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "deploy_troop",
    description: "Déploie une troupe sur le terrain de bataille",
    inputSchema: {
      type: "object",
      properties: {
        troopType: { type: "string", enum: ["giant", "babyDragon", "miniPekka", "valkyrie"] },
        row: { type: "number" },
        col: { type: "number" },
        team: { type: "string", enum: ["red", "blue"] },
      },
      required: ["troopType", "row", "col", "team"],
    },
  },
  {
    name: "get_game_state",
    description: "Récupère l'état actuel du jeu (troupes, tours, statistiques)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "analyze_strategy",
    description: "Analyse une stratégie Clash Royale",
    inputSchema: {
      type: "object",
      properties: { situation: { type: "string" } },
      required: ["situation"],
    },
  },
];

async function executeTool(name: string, args: any) {
  switch (name) {
    case "start_game": {
      gameEngine.start();
      const stats = gameEngine.getGameStats();
      return { content: [{ type: "text", text: JSON.stringify({ status: "Game started", stats }, null, 2) }] };
    }
    case "deploy_troop": {
      const { troopType, row, col, team } = args ?? {};
      const validType = ["giant", "babyDragon", "miniPekka", "valkyrie"];
      const validTeam = ["red", "blue"];
      if (!validType.includes(troopType)) throw new Error("Invalid troopType");
      if (typeof row !== "number" || row < 0 || row > 31) throw new Error("Invalid row");
      if (typeof col !== "number" || col < 0 || col > 17) throw new Error("Invalid col");
      if (!validTeam.includes(team)) throw new Error("Invalid team");
      gameEngine.spawnTroop(troopType as TroopType, team as "red" | "blue", row, col);
      const last = gameEngine.getAllTroops().slice(-1)[0];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "Troop deployed",
                troop: last && {
                  id: last.id,
                  type: last.type,
                  team: last.team,
                  position: last.position,
                  health: last.health,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
    case "get_game_state": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                troops: gameEngine.getAllTroops(),
                towers: gameEngine.getAllTowers(),
                gameStats: gameEngine.getGameStats(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
    case "analyze_strategy": {
      const { situation } = args ?? {};
      if (typeof situation !== "string") throw new Error("situation must be a string");
      const ts = gameEngine.getAllTroops();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                situation,
                currentTroops: ts.length,
                blueTroops: ts.filter((t) => t.team === "blue").length,
                redTroops: ts.filter((t) => t.team === "red").length,
                recommendation: "Analysez les troupes adverses et contre-attaquez avec des unités efficaces",
              },
              null,
              2
            ),
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function jsonRpcResult(id: any, result: any) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { headers: { "Content-Type": "application/json" } });
}
function jsonRpcError(id: any, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JsonRpcReq;
    const { id, method, params } = body;

    if (method === "server/info") {
      return jsonRpcResult(id, { name: "clash-royale-mcp", version: "1.0.0", capabilities: { tools: {} } });
    }
    if (method === "tools/list") {
      return jsonRpcResult(id, { tools });
    }
    if (method === "tools/call") {
      const { name, arguments: args } = params ?? {};
      if (!name) return jsonRpcError(id, -32602, "Missing tool name");
      try {
        const out = await executeTool(name, args ?? {});
        return jsonRpcResult(id, out);
      } catch (e: any) {
        return jsonRpcError(id, -32000, e?.message ?? "Tool error");
      }
    }

    return jsonRpcError(id, -32601, "Method not found");
  } catch (e: any) {
    return jsonRpcError(null, -32700, "Parse error");
  }
}

// Optionnel : GET utile pour debug rapide
export function GET() {
  return NextResponse.json({ ok: true, endpoint: "MCP streamable", methods: ["server/info", "tools/list", "tools/call"] });
}

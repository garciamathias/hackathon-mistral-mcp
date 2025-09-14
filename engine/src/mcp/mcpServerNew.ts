const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
import { z } from "zod";
import { MCPGameManager } from './gameManager';

type CallToolResult = any;

export const getMCPServer = (gameManager: MCPGameManager): any => {
  const server = new McpServer(
    {
      name: "clash-royale-mcp-server",
      version: "1.0.0",
    },
    { capabilities: {} },
  );

  // Create Game Tool
  server.tool(
    "create_game",
    "Create a new Clash Royale match",
    {
      player_name: z.string().optional().describe("Name of the player creating the game"),
      session_id: z.string().optional().describe("Optional session ID to maintain context"),
    },
    async ({ player_name, session_id }: { player_name?: string; session_id?: string }): Promise<CallToolResult> => {
      const result = gameManager.createGame(player_name, session_id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Join Game Tool
  server.tool(
    "join_game",
    "Join an existing Clash Royale match",
    {
      match_id: z.string().describe("ID of the match to join"),
      player_name: z.string().optional().describe("Name of the player joining"),
      session_id: z.string().optional().describe("Optional session ID to maintain context"),
    },
    async ({ match_id, player_name, session_id }: { match_id: string; player_name?: string; session_id?: string }): Promise<CallToolResult> => {
      const result = gameManager.joinGame(match_id, player_name, session_id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Get Game Status Tool
  server.tool(
    "get_game_status",
    "Get the current status of a Clash Royale match",
    {
      match_id: z.string().describe("ID of the match to check"),
    },
    async ({ match_id }: { match_id: string }): Promise<CallToolResult> => {
      const status = gameManager.getGameStatus(match_id);

      if (!status) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                message: "Game not found",
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    },
  );

  // Spawn Troop Tool
  server.tool(
    "spawn_troop",
    "Deploy a troop in the game at a specific position",
    {
      match_id: z.string().describe("ID of the match"),
      troop_type: z.enum(["giant", "babyDragon", "miniPekka", "valkyrie"])
        .describe("Type of troop to spawn"),
      row: z.number().int().min(0).max(33).describe("Row position (0-16 for red team, 17-33 for blue team)"),
      col: z.number().int().min(0).max(18).describe("Column position (0-18)"),
      session_id: z.string().optional().describe("Optional session ID to maintain context"),
    },
    async ({ match_id, troop_type, row, col, session_id }: { match_id: string; troop_type: 'giant' | 'babyDragon' | 'miniPekka' | 'valkyrie'; row: number; col: number; session_id?: string }): Promise<CallToolResult> => {
      const result = gameManager.spawnTroop(match_id, troop_type, row, col, session_id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // List Available Games Tool
  server.tool(
    "list_games",
    "List all available games",
    {},
    async (): Promise<CallToolResult> => {
      const rooms = gameManager['wsManager'].getRoomList();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              games: rooms.map(room => ({
                id: room.id,
                playerCount: room.playerCount,
                maxPlayers: room.maxPlayers,
                status: room.status,
              })),
              totalGames: rooms.length,
            }, null, 2),
          },
        ],
      };
    },
  );

  return server;
};
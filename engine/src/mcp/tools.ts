import { MCPGameManager } from './gameManager';
import { MCPTool, MCPToolResult } from './types';

export class MCPTools {
  private gameManager: MCPGameManager;
  private tools: MCPTool[] = [];

  constructor(gameManager: MCPGameManager) {
    this.gameManager = gameManager;
    this.initializeTools();
  }

  private initializeTools(): void {
    // Tool 1: Create Game
    this.tools.push({
      name: 'create_game',
      description: 'Create a new Clash Royale game match',
      inputSchema: {
        type: 'object',
        properties: {
          playerName: {
            type: 'string',
            description: 'Name of the player creating the game (optional)'
          }
        }
      }
    });

    // Tool 2: Join Game
    this.tools.push({
      name: 'join_game',
      description: 'Join an existing Clash Royale game match',
      inputSchema: {
        type: 'object',
        properties: {
          matchId: {
            type: 'string',
            description: 'The ID of the match to join'
          },
          playerName: {
            type: 'string',
            description: 'Name of the player joining the game (optional)'
          }
        },
        required: ['matchId']
      }
    });

    // Tool 3: Get Game Status
    this.tools.push({
      name: 'get_game_status',
      description: 'Get the current status of a game including troops, towers, and players',
      inputSchema: {
        type: 'object',
        properties: {
          matchId: {
            type: 'string',
            description: 'The ID of the match to check'
          }
        },
        required: ['matchId']
      }
    });

    // Tool 4: Spawn Troop
    this.tools.push({
      name: 'spawn_troop',
      description: 'Deploy a troop on the battlefield',
      inputSchema: {
        type: 'object',
        properties: {
          matchId: {
            type: 'string',
            description: 'The ID of the match'
          },
          troopType: {
            type: 'string',
            enum: ['giant', 'babyDragon', 'miniPekka', 'valkyrie'],
            description: 'Type of troop to spawn'
          },
          row: {
            type: 'number',
            minimum: 0,
            maximum: 33,
            description: 'Row position (0-16 for red team, 17-33 for blue team)'
          },
          col: {
            type: 'number',
            minimum: 0,
            maximum: 17,
            description: 'Column position (0-17)'
          }
        },
        required: ['matchId', 'troopType', 'row', 'col']
      }
    });

    // Tool 5: Trigger Emote
    this.tools.push({
      name: 'trigger_emote',
      description: 'Trigger an emote for the red king (only available for AI-controlled red team)',
      inputSchema: {
        type: 'object',
        properties: {
          matchId: {
            type: 'string',
            description: 'The ID of the match'
          },
          emoteType: {
            type: 'string',
            enum: ['haha', 'cry', 'mumumu'],
            description: 'Type of emote to trigger'
          }
        },
        required: ['matchId', 'emoteType']
      }
    });
  }

  public getTools(): MCPTool[] {
    return this.tools;
  }

  public async executeTool(name: string, args: any, sessionId?: string): Promise<MCPToolResult> {
    try {
      switch (name) {
        case 'create_game':
          return this.handleCreateGame(args, sessionId);

        case 'join_game':
          return this.handleJoinGame(args, sessionId);

        case 'get_game_status':
          return this.handleGetGameStatus(args);

        case 'spawn_troop':
          return this.handleSpawnTroop(args, sessionId);

        case 'trigger_emote':
          return this.handleTriggerEmote(args, sessionId);

        default:
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Unknown tool: ${name}`
              })
            }]
          };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          })
        }]
      };
    }
  }

  private async handleCreateGame(args: any, sessionId?: string): Promise<MCPToolResult> {
    const { playerName } = args;
    const result = this.gameManager.createGame(playerName, sessionId);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleJoinGame(args: any, sessionId?: string): Promise<MCPToolResult> {
    const { matchId, playerName } = args;

    if (!matchId) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'matchId is required'
          })
        }]
      };
    }

    const result = this.gameManager.joinGame(matchId, playerName, sessionId);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleGetGameStatus(args: any): Promise<MCPToolResult> {
    const { matchId } = args;

    if (!matchId) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'matchId is required'
          })
        }]
      };
    }

    const status = this.gameManager.getGameStatus(matchId);

    if (!status) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Game not found'
          })
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status, null, 2)
      }]
    };
  }

  private async handleSpawnTroop(args: any, sessionId?: string): Promise<MCPToolResult> {
    const { matchId, troopType, row, col } = args;

    if (!matchId || !troopType || row === undefined || col === undefined) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'matchId, troopType, row, and col are required'
          })
        }]
      };
    }

    // Validate troop type
    const validTroops = ['giant', 'babyDragon', 'miniPekka', 'valkyrie'];
    if (!validTroops.includes(troopType)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Invalid troopType. Must be one of: ${validTroops.join(', ')}`
          })
        }]
      };
    }
 
    // Validate position
    if (row < 0 || row > 33 || col < 0 || col > 17) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Invalid position. Row must be 0-33, col must be 0-17'
          })
        }]
      };
    }

    const result = this.gameManager.spawnTroop(matchId, troopType, row, col, sessionId);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleTriggerEmote(args: any, sessionId?: string): Promise<MCPToolResult> {
    const { matchId, emoteType } = args;

    if (!matchId || !emoteType) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'matchId and emoteType are required'
          })
        }]
      };
    }

    // Validate emote type
    const validEmotes = ['haha', 'cry', 'mumumu'];
    if (!validEmotes.includes(emoteType)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: `Invalid emoteType. Must be one of: ${validEmotes.join(', ')}`
          })
        }]
      };
    }

    const result = this.gameManager.triggerEmote(matchId, emoteType, sessionId);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
}
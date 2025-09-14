import { Router, Response } from 'express';
import { z } from 'zod';
import { WSManager } from '@websocket/WSManager';
import { AuthRequest, authenticatePlayer, validateBody } from '@api/middleware/auth';
import { ERROR_CODES } from '@config/constants';
import { ApiResponse } from '@/types/server';
import { TroopType } from '@shared/troop';
import { PlayCardAction } from '@shared/game';

const PlayCardSchema = z.object({
  matchId: z.string().uuid(),
  troopType: z.enum(['giant', 'babyDragon', 'miniPekka', 'valkyrie']),
  position: z.object({
    row: z.number().min(0).max(33),
    col: z.number().min(0).max(17)
  })
});

const GameActionSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(['PAUSE', 'RESUME', 'SURRENDER'])
});

export function createGameRoutes(wsManager: WSManager): Router {
  const router = Router();

  // Play a card
  router.post(
    '/play_card',
    authenticatePlayer,
    validateBody(PlayCardSchema),
    (req: AuthRequest, res: Response) => {
      try {
        const { matchId, troopType, position } = req.body;
        const room = wsManager.getRoom(matchId);

        if (!room) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: ERROR_CODES.ROOM_NOT_FOUND,
              message: 'Match not found'
            },
            timestamp: Date.now()
          };
          return res.status(404).json(response);
        }

        const action: PlayCardAction = {
          type: 'PLAY_CARD',
          playerId: req.playerId!,
          timestamp: Date.now(),
          data: {
            troopType,
            position
          }
        };

        room.queueAction(action);

        const response: ApiResponse = {
          success: true,
          data: {
            message: 'Card played successfully',
            troopType,
            position
          },
          timestamp: Date.now()
        };

        return res.json(response);
      } catch (error) {
        console.error('Error playing card:', error);
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to play card'
          },
          timestamp: Date.now()
        };
        return res.status(500).json(response);
      }
    }
  );

  // Get game state
  router.get('/state/:matchId', (req, res: Response) => {
    try {
      const { matchId } = req.params;
      const room = wsManager.getRoom(matchId);

      if (!room) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: ERROR_CODES.ROOM_NOT_FOUND,
            message: 'Match not found'
          },
          timestamp: Date.now()
        };
        return res.status(404).json(response);
      }

      const snapshot = room.getSnapshot();
      const response: ApiResponse = {
        success: true,
        data: snapshot,
        timestamp: Date.now()
      };

      return res.json(response);
    } catch (error) {
      console.error('Error getting game state:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get game state'
        },
        timestamp: Date.now()
      };
      return res.status(500).json(response);
    }
  });

  // Perform game action (pause, resume, surrender)
  router.post(
    '/action',
    authenticatePlayer,
    validateBody(GameActionSchema),
    (req: AuthRequest, res: Response) => {
      try {
        const { matchId, action } = req.body;
        const room = wsManager.getRoom(matchId);

        if (!room) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: ERROR_CODES.ROOM_NOT_FOUND,
              message: 'Match not found'
            },
            timestamp: Date.now()
          };
          return res.status(404).json(response);
        }

        let message = '';
        switch (action) {
          case 'PAUSE':
            room.pauseGame();
            message = 'Game paused';
            break;
          case 'RESUME':
            room.resumeGame();
            message = 'Game resumed';
            break;
          case 'SURRENDER':
            // TODO: Implement surrender logic
            message = 'Player surrendered';
            break;
        }

        const response: ApiResponse = {
          success: true,
          data: { message, action },
          timestamp: Date.now()
        };

        return res.json(response);
      } catch (error) {
        console.error('Error performing game action:', error);
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to perform action'
          },
          timestamp: Date.now()
        };
        return res.status(500).json(response);
      }
    }
  );

  // Get available troop types and costs
  router.get('/troops', (_req, res: Response) => {
    try {
      const troops = Object.values(TroopType).map(type => ({
        type,
        config: require('@shared/troop').TROOP_CONFIGS[type]
      }));

      const response: ApiResponse = {
        success: true,
        data: { troops },
        timestamp: Date.now()
      };

      return res.json(response);
    } catch (error) {
      console.error('Error getting troop info:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get troop info'
        },
        timestamp: Date.now()
      };
      return res.status(500).json(response);
    }
  });

  return router;
}
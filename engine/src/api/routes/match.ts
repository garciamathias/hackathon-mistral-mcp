import { Router, Response } from 'express';
import { z } from 'zod';
import { WSManager } from '@websocket/WSManager';
import { AuthRequest, authenticatePlayer, validateBody } from '@api/middleware/auth';
import { ERROR_CODES } from '@config/constants';
import {
  ApiResponse,
  CreateMatchResponse,
  JoinMatchResponse
} from '@/types/server';

const JoinMatchSchema = z.object({
  matchId: z.string().uuid()
});

export function createMatchRoutes(wsManager: WSManager): Router {
  const router = Router();

  // Create a new match
  router.post('/create', authenticatePlayer, (req: AuthRequest, res: Response) => {
    try {
      const room = wsManager.createRoom();
      const playerState = room.addPlayer(req.playerId!, req.playerName!);

      if (!playerState) {
        wsManager.removeRoom(room.id);
        const response: ApiResponse = {
          success: false,
          error: {
            code: ERROR_CODES.ROOM_FULL,
            message: 'Failed to create match'
          },
          timestamp: Date.now()
        };
        return res.status(500).json(response);
      }

      const wsUrl = `ws://${req.hostname}:${process.env.WS_PORT || 3001}?roomId=${room.id}&playerId=${req.playerId}`;

      const response: ApiResponse<CreateMatchResponse> = {
        success: true,
        data: {
          matchId: room.id,
          joinToken: room.id, // In production, generate a secure token
          wsUrl
        },
        timestamp: Date.now()
      };

      res.json(response);
    } catch (error) {
      console.error('Error creating match:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create match'
        },
        timestamp: Date.now()
      };
      res.status(500).json(response);
    }
  });

  // Join an existing match
  router.post(
    '/join',
    authenticatePlayer,
    validateBody(JoinMatchSchema),
    (req: AuthRequest, res: Response) => {
      try {
        const { matchId } = req.body;
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

        if (room.isFull()) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: ERROR_CODES.ROOM_FULL,
              message: 'Match is full'
            },
            timestamp: Date.now()
          };
          return res.status(400).json(response);
        }

        const playerState = room.addPlayer(req.playerId!, req.playerName!);

        if (!playerState) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: ERROR_CODES.ROOM_FULL,
              message: 'Failed to join match'
            },
            timestamp: Date.now()
          };
          return res.status(500).json(response);
        }

        const wsUrl = `ws://${req.hostname}:${process.env.WS_PORT || 3001}?roomId=${matchId}&playerId=${req.playerId}`;

        const response: ApiResponse<JoinMatchResponse> = {
          success: true,
          data: {
            matchId,
            team: playerState.team,
            wsUrl,
            playerState
          },
          timestamp: Date.now()
        };

        res.json(response);
      } catch (error) {
        console.error('Error joining match:', error);
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to join match'
          },
          timestamp: Date.now()
        };
        res.status(500).json(response);
      }
    }
  );

  // Get match info
  router.get('/:matchId', (req, res: Response) => {
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

      const response: ApiResponse = {
        success: true,
        data: room.getRoomInfo(),
        timestamp: Date.now()
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting match info:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get match info'
        },
        timestamp: Date.now()
      };
      res.status(500).json(response);
    }
  });

  // List all matches
  router.get('/', (req, res: Response) => {
    try {
      const rooms = wsManager.getRoomList();
      const response: ApiResponse = {
        success: true,
        data: { matches: rooms },
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('Error listing matches:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list matches'
        },
        timestamp: Date.now()
      };
      res.status(500).json(response);
    }
  });

  return router;
}
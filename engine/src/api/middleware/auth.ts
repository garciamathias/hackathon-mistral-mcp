import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '@config/constants';

export interface AuthRequest extends Request {
  playerId?: string;
  playerName?: string;
}

// Simple authentication middleware - in production, use JWT or sessions
export function authenticatePlayer(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const playerId = req.headers['x-player-id'] as string;
  const playerName = req.headers['x-player-name'] as string;

  if (!playerId) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Missing player ID'
      },
      timestamp: Date.now()
    });
    return;
  }

  req.playerId = playerId;
  req.playerName = playerName || `Player_${playerId.substring(0, 8)}`;

  next();
}

// Validate request body middleware
export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_ACTION,
          message: error.errors ? error.errors[0].message : 'Invalid request body'
        },
        timestamp: Date.now()
      });
    }
  };
}
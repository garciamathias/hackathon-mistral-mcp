export const SERVER_CONFIG = {
  TICK_RATE: 10, // 10 Hz
  TICK_INTERVAL: 100, // 100ms
  MAX_ROOMS: 100,
  MAX_PLAYERS_PER_ROOM: 2,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  HEARTBEAT_TIMEOUT: 60000, // 60 seconds
  DEFAULT_PORT: 3001,
  DEFAULT_WS_PORT: 3001, // Same port for HTTP and WS
} as const;

export const GAME_CONSTANTS = {
  GRID: {
    ROWS: 34,
    COLS: 18,
    BRIDGE_ROW: 17, // Middle of the arena
    RED_SIDE_END: 16,
    BLUE_SIDE_START: 17
  },
  ELIXIR: {
    INITIAL: 5,
    MAX: 10,
    REGEN_RATE: 1 / 2.8, // 1 elixir per 2.8 seconds
    DOUBLE_ELIXIR_RATE: 2 / 2.8, // Double elixir mode
    TRIPLE_ELIXIR_RATE: 3 / 2.8 // Triple elixir mode
  },
  TIME: {
    NORMAL_DURATION: 180, // 3 minutes
    OVERTIME_DURATION: 60, // 1 minute
    SUDDEN_DEATH_DURATION: 180 // 3 minutes
  },
  SPAWN: {
    DEPLOY_TIME: 1000, // 1 second deploy time
    MIN_DISTANCE_FROM_TOWER: 3,
    RED_SPAWN_ZONE: { minRow: 0, maxRow: 16 },
    BLUE_SPAWN_ZONE: { minRow: 17, maxRow: 33 }
  }
} as const;

export const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  INVALID_ACTION: 'INVALID_ACTION',
  NOT_ENOUGH_ELIXIR: 'NOT_ENOUGH_ELIXIR',
  INVALID_POSITION: 'INVALID_POSITION',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  GAME_ENDED: 'GAME_ENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TEAM: 'INVALID_TEAM'
} as const;
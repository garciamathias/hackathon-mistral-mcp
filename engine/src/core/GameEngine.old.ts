import { v4 as uuidv4 } from 'uuid';
import { TroopData, TroopType, TroopState, TROOP_CONFIGS, Position } from '@shared/troop';
import { TowerData, TowerType, TOWER_CONFIGS, TOWER_POSITIONS } from '@shared/tower';
import { GameSnapshot, GameStatus, PlayerState } from '@shared/game';
import { GAME_CONSTANTS } from '@config/constants';

export class GameEngine {
  private troops: Map<string, TroopData> = new Map();
  private towers: Map<string, TowerData> = new Map();
  private players: Map<string, PlayerState> = new Map();
  private gameStatus: GameStatus = GameStatus.WAITING;
  private gameStartTime: number = 0;
  private currentTick: number = 0;
  private winner?: 'red' | 'blue' | 'draw';

  constructor() {
    this.initializeTowers();
  }

  private initializeTowers(): void {
    // Red team towers
    this.createTower('red_king', TowerType.KING, 'red', TOWER_POSITIONS.red.king);
    this.createTower('red_princess_left', TowerType.PRINCESS, 'red', TOWER_POSITIONS.red.princessLeft);
    this.createTower('red_princess_right', TowerType.PRINCESS, 'red', TOWER_POSITIONS.red.princessRight);

    // Blue team towers
    this.createTower('blue_king', TowerType.KING, 'blue', TOWER_POSITIONS.blue.king);
    this.createTower('blue_princess_left', TowerType.PRINCESS, 'blue', TOWER_POSITIONS.blue.princessLeft);
    this.createTower('blue_princess_right', TowerType.PRINCESS, 'blue', TOWER_POSITIONS.blue.princessRight);
  }

  private createTower(id: string, type: TowerType, team: 'red' | 'blue', position: Position): void {
    const config = TOWER_CONFIGS[type];
    const tower: TowerData = {
      id,
      type,
      team,
      position,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      isAlive: true,
      active: type === TowerType.PRINCESS, // Princess towers start active
      damage: config.damage,
      attackSpeed: config.attackSpeed,
      range: config.range,
      lastAttackTime: 0
    };
    this.towers.set(id, tower);
  }

  public startGame(): void {
    if (this.gameStatus !== GameStatus.WAITING) {
      throw new Error('Game already started');
    }

    this.gameStatus = GameStatus.IN_PROGRESS;
    this.gameStartTime = Date.now();
    this.currentTick = 0;
  }

  public update(deltaTime: number, tick: number): void {
    if (this.gameStatus !== GameStatus.IN_PROGRESS) {
      return;
    }

    this.currentTick = tick;

    // Update elixir for all players
    this.updateElixir(deltaTime);

    // Update all troops
    this.updateTroops(deltaTime);

    // Update tower attacks
    this.updateTowers(deltaTime);

    // Check win conditions
    this.checkWinConditions();
  }

  private updateElixir(deltaTime: number): void {
    const elixirGain = (deltaTime / 1000) * GAME_CONSTANTS.ELIXIR.REGEN_RATE;

    for (const player of this.players.values()) {
      if (player.elixir < player.maxElixir) {
        player.elixir = Math.min(player.maxElixir, player.elixir + elixirGain);
      }
    }
  }

  private updateTroops(deltaTime: number): void {
    for (const troop of this.troops.values()) {
      if (!troop.isAlive) continue;

      switch (troop.state) {
        case TroopState.SPAWNING:
          this.handleTroopSpawning(troop, deltaTime);
          break;
        case TroopState.MOVING_TO_BRIDGE:
          this.handleTroopMovement(troop, deltaTime);
          break;
        case TroopState.TARGETING_TOWER:
          this.handleTroopTargeting(troop, deltaTime);
          break;
        case TroopState.ATTACKING_TOWER:
          this.handleTroopAttacking(troop, deltaTime);
          break;
      }
    }
  }

  private handleTroopSpawning(troop: TroopData, deltaTime: number): void {
    const timeSinceSpawn = Date.now() - troop.spawnTime;
    if (timeSinceSpawn >= GAME_CONSTANTS.SPAWN.DEPLOY_TIME) {
      troop.state = TroopState.MOVING_TO_BRIDGE;
      // Set bridge target based on team
      if (troop.team === 'red') {
        troop.bridgeTarget = {
          row: GAME_CONSTANTS.GRID.BRIDGE_ROW,
          col: troop.col
        };
      } else {
        troop.bridgeTarget = {
          row: GAME_CONSTANTS.GRID.BRIDGE_ROW - 1,
          col: troop.col
        };
      }
      troop.targetPosition = troop.bridgeTarget;
    }
  }

  private handleTroopMovement(troop: TroopData, deltaTime: number): void {
    if (!troop.targetPosition) return;

    const distance = this.calculateDistance(troop.position, troop.targetPosition);
    if (distance < 0.1) {
      // Reached target
      troop.position = { ...troop.targetPosition };
      troop.row = troop.targetPosition.row;
      troop.col = troop.targetPosition.col;

      // Check if reached bridge, then target nearest tower
      if (troop.state === TroopState.MOVING_TO_BRIDGE) {
        this.findNearestTower(troop);
      }
    } else {
      // Move towards target
      const moveDistance = (troop.speed * deltaTime) / 1000;
      const ratio = Math.min(moveDistance / distance, 1);

      troop.position.row += (troop.targetPosition.row - troop.position.row) * ratio;
      troop.position.col += (troop.targetPosition.col - troop.position.col) * ratio;
      troop.row = Math.round(troop.position.row);
      troop.col = Math.round(troop.position.col);
    }
  }

  private handleTroopTargeting(troop: TroopData, deltaTime: number): void {
    if (!troop.towerTarget) {
      this.findNearestTower(troop);
      return;
    }

    const tower = this.towers.get(troop.towerTarget);
    if (!tower || !tower.isAlive) {
      this.findNearestTower(troop);
      return;
    }

    const distance = this.calculateDistance(troop.position, tower.position);
    const config = TROOP_CONFIGS[troop.type];

    if (distance <= config.range) {
      troop.state = TroopState.ATTACKING_TOWER;
      troop.isInCombat = true;
    } else {
      troop.targetPosition = tower.position;
      this.handleTroopMovement(troop, deltaTime);
    }
  }

  private handleTroopAttacking(troop: TroopData, deltaTime: number): void {
    if (!troop.towerTarget) {
      troop.state = TroopState.TARGETING_TOWER;
      troop.isInCombat = false;
      return;
    }

    const tower = this.towers.get(troop.towerTarget);
    if (!tower || !tower.isAlive) {
      troop.state = TroopState.TARGETING_TOWER;
      troop.isInCombat = false;
      this.findNearestTower(troop);
      return;
    }

    const now = Date.now();
    const attackInterval = 1000 / troop.attackSpeed;

    if (now - troop.lastAttackTime >= attackInterval) {
      this.dealDamageToTower(tower, troop.attackDamage);
      troop.lastAttackTime = now;
    }
  }

  private updateTowers(deltaTime: number): void {
    for (const tower of this.towers.values()) {
      if (!tower.isAlive || !tower.active) continue;

      // Find nearest enemy troop
      const nearestTroop = this.findNearestTroopForTower(tower);
      if (!nearestTroop) continue;

      const distance = this.calculateDistance(tower.position, nearestTroop.position);
      if (distance > tower.range) continue;

      const now = Date.now();
      const attackInterval = 1000 / tower.attackSpeed;

      if (now - tower.lastAttackTime >= attackInterval) {
        this.dealDamageToTroop(nearestTroop, tower.damage);
        tower.lastAttackTime = now;
      }
    }
  }

  private findNearestTower(troop: TroopData): void {
    let nearestTower: TowerData | null = null;
    let minDistance = Infinity;

    for (const tower of this.towers.values()) {
      if (tower.team === troop.team || !tower.isAlive) continue;

      const distance = this.calculateDistance(troop.position, tower.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTower = tower;
      }
    }

    if (nearestTower) {
      troop.towerTarget = nearestTower.id;
      troop.targetPosition = nearestTower.position;
      troop.state = TroopState.TARGETING_TOWER;
    }
  }

  private findNearestTroopForTower(tower: TowerData): TroopData | null {
    let nearestTroop: TroopData | null = null;
    let minDistance = Infinity;

    for (const troop of this.troops.values()) {
      if (troop.team === tower.team || !troop.isAlive) continue;

      const distance = this.calculateDistance(tower.position, troop.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTroop = troop;
      }
    }

    return nearestTroop;
  }

  private dealDamageToTower(tower: TowerData, damage: number): void {
    tower.health -= damage;
    if (tower.health <= 0) {
      tower.health = 0;
      tower.isAlive = false;
      tower.active = false;

      // Activate king tower if princess tower is destroyed
      if (tower.type === TowerType.PRINCESS) {
        const kingTower = this.getKingTower(tower.team);
        if (kingTower) {
          kingTower.active = true;
        }
      }
    }
  }

  private dealDamageToTroop(troop: TroopData, damage: number): void {
    troop.health -= damage;
    if (troop.health <= 0) {
      troop.health = 0;
      troop.isAlive = false;
      troop.state = TroopState.DEAD;
    }
  }

  private getKingTower(team: 'red' | 'blue'): TowerData | null {
    const kingId = team === 'red' ? 'red_king' : 'blue_king';
    return this.towers.get(kingId) || null;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.col - pos1.col;
    const dy = pos2.row - pos1.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private checkWinConditions(): void {
    const redKing = this.towers.get('red_king');
    const blueKing = this.towers.get('blue_king');

    if (!redKing?.isAlive && !blueKing?.isAlive) {
      this.winner = 'draw';
      this.gameStatus = GameStatus.ENDED;
    } else if (!redKing?.isAlive) {
      this.winner = 'blue';
      this.gameStatus = GameStatus.ENDED;
    } else if (!blueKing?.isAlive) {
      this.winner = 'red';
      this.gameStatus = GameStatus.ENDED;
    }

    // Check for time limit
    const gameTime = (Date.now() - this.gameStartTime) / 1000;
    if (gameTime >= GAME_CONSTANTS.TIME.NORMAL_DURATION + GAME_CONSTANTS.TIME.OVERTIME_DURATION) {
      this.determineWinnerByCrowns();
    }
  }

  private determineWinnerByCrowns(): void {
    let redCrowns = 0;
    let blueCrowns = 0;

    for (const tower of this.towers.values()) {
      if (!tower.isAlive) {
        if (tower.team === 'red') {
          blueCrowns++;
        } else {
          redCrowns++;
        }
      }
    }

    if (redCrowns > blueCrowns) {
      this.winner = 'red';
    } else if (blueCrowns > redCrowns) {
      this.winner = 'blue';
    } else {
      this.winner = 'draw';
    }

    this.gameStatus = GameStatus.ENDED;
  }

  public spawnTroop(type: TroopType, team: 'red' | 'blue', row: number, col: number): TroopData {
    const config = TROOP_CONFIGS[type];
    const id = uuidv4();

    const troop: TroopData = {
      id,
      type,
      team,
      position: { row, col },
      targetPosition: { row, col },
      state: TroopState.SPAWNING,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      speed: config.speed,
      isAlive: true,
      isInCombat: false,
      attackDamage: config.attackDamage,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      focusOnBuildings: config.focusOnBuildings,
      flying: config.flying,
      row,
      col,
      spawnTime: Date.now(),
      lastUpdateTime: Date.now()
    };

    this.troops.set(id, troop);
    return troop;
  }

  public addPlayer(playerId: string, name: string, team: 'red' | 'blue'): void {
    const player: PlayerState = {
      id: playerId,
      name,
      team,
      isConnected: true,
      elixir: GAME_CONSTANTS.ELIXIR.INITIAL,
      maxElixir: GAME_CONSTANTS.ELIXIR.MAX,
      elixirRegenRate: GAME_CONSTANTS.ELIXIR.REGEN_RATE,
      crowns: 0,
      lastActionTime: Date.now()
    };
    this.players.set(playerId, player);
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  public canPlayCard(playerId: string, troopType: TroopType): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    const config = TROOP_CONFIGS[troopType];
    return player.elixir >= config.cost;
  }

  public playCard(playerId: string, troopType: TroopType, row: number, col: number): TroopData | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    const config = TROOP_CONFIGS[troopType];
    if (player.elixir < config.cost) return null;

    // Validate spawn position
    if (!this.isValidSpawnPosition(player.team, row, col)) return null;

    player.elixir -= config.cost;
    player.lastActionTime = Date.now();

    return this.spawnTroop(troopType, player.team, row, col);
  }

  private isValidSpawnPosition(team: 'red' | 'blue', row: number, col: number): boolean {
    if (col < 0 || col >= GAME_CONSTANTS.GRID.COLS) return false;

    if (team === 'red') {
      return row >= GAME_CONSTANTS.SPAWN.RED_SPAWN_ZONE.minRow &&
             row <= GAME_CONSTANTS.SPAWN.RED_SPAWN_ZONE.maxRow;
    } else {
      return row >= GAME_CONSTANTS.SPAWN.BLUE_SPAWN_ZONE.minRow &&
             row <= GAME_CONSTANTS.SPAWN.BLUE_SPAWN_ZONE.maxRow;
    }
  }

  public getSnapshot(): GameSnapshot {
    const gameTime = this.gameStatus === GameStatus.IN_PROGRESS
      ? (Date.now() - this.gameStartTime) / 1000
      : 0;

    return {
      timestamp: Date.now(),
      tick: this.currentTick,
      status: this.gameStatus,
      gameTime,
      troops: Array.from(this.troops.values()),
      towers: Array.from(this.towers.values()),
      players: Array.from(this.players.values()),
      winner: this.winner
    };
  }

  public getStatus(): GameStatus {
    return this.gameStatus;
  }

  public getTroops(): TroopData[] {
    return Array.from(this.troops.values());
  }

  public getTowers(): TowerData[] {
    return Array.from(this.towers.values());
  }

  public getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  public reset(): void {
    this.troops.clear();
    this.towers.clear();
    this.players.clear();
    this.gameStatus = GameStatus.WAITING;
    this.gameStartTime = 0;
    this.currentTick = 0;
    this.winner = undefined;
    this.initializeTowers();
  }
}
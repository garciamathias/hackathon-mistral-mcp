import { v4 as uuidv4 } from 'uuid';
import { TroopData, TroopType, TroopState, TROOP_CONFIGS, Position } from '@shared/troop';
import { TowerData, TowerType, TOWER_POSITIONS } from '@shared/tower';
import { GameSnapshot, GameStatus, PlayerState } from '@shared/game';
import { GAME_CONSTANTS } from '@config/constants';
import { GiantEntity } from '../entities/troops/Giant';
import { TowerEntity } from '../entities/towers/TowerEntity';

// Import other troop entities when they are created
// import { BabyDragonEntity } from '../entities/troops/BabyDragon';
// import { MiniPekkaEntity } from '../entities/troops/MiniPekka';
// import { ValkyrieEntity } from '../entities/troops/Valkyrie';

export interface TroopEntity {
  data: TroopData;
  update(deltaTime: number, towers: TowerData[], flaggedCells: Set<string>, gameEngine?: GameEngine): void;
  takeDamage(damage: number): void;
}

export class GameEngine {
  protected troops: Map<string, TroopEntity> = new Map();
  protected towers: Map<string, TowerEntity> = new Map();
  protected players: Map<string, PlayerState> = new Map();
  protected gameStatus: GameStatus = GameStatus.WAITING;
  protected gameStartTime: number = 0;
  protected currentTick: number = 0;
  protected winner?: 'red' | 'blue' | 'draw';
  protected flaggedCells: Set<string> = new Set();
  protected onUpdateCallback?: (troops: TroopData[]) => void;
  protected onGameEndCallback?: (winner: 'red' | 'blue') => void;

  constructor() {
    this.initializeTowers();
  }

  private initializeTowers(): void {
    // Red team towers - use frontend IDs
    this.createTower('king_red', TowerType.KING, 'red', TOWER_POSITIONS.red.king);
    this.createTower('princess_red_left', TowerType.PRINCESS, 'red', TOWER_POSITIONS.red.princessLeft);
    this.createTower('princess_red_right', TowerType.PRINCESS, 'red', TOWER_POSITIONS.red.princessRight);

    // Blue team towers - use frontend IDs
    this.createTower('king_blue', TowerType.KING, 'blue', TOWER_POSITIONS.blue.king);
    this.createTower('princess_blue_left', TowerType.PRINCESS, 'blue', TOWER_POSITIONS.blue.princessLeft);
    this.createTower('princess_blue_right', TowerType.PRINCESS, 'blue', TOWER_POSITIONS.blue.princessRight);
  }

  private createTower(id: string, type: TowerType, team: 'red' | 'blue', position: Position): void {
    const tower = new TowerEntity(id, type, team, position);
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

  public pause(): void {
    // For compatibility with frontend
    this.gameStatus = GameStatus.PAUSED;
  }

  public resume(): void {
    if (this.gameStatus === GameStatus.PAUSED) {
      this.gameStatus = GameStatus.IN_PROGRESS;
    }
  }

  public stop(): void {
    this.gameStatus = GameStatus.ENDED;
    this.troops.clear();
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

  public update(deltaTime: number, tick: number): void {
    if (this.gameStatus !== GameStatus.IN_PROGRESS) {
      return;
    }

    this.currentTick = tick;

    // Update elixir for all players
    this.updateElixir(deltaTime);

    // Clean up dead troops
    this.cleanupDeadTroops();

    // Get active towers
    const activeTowers = this.getActiveTowers();

    // Update all troops with entities
    for (const troopEntity of this.troops.values()) {
      troopEntity.update(deltaTime / 1000, activeTowers, this.flaggedCells, this);
    }

    // Update tower attacks
    this.updateTowers(deltaTime);

    // Check win conditions
    this.checkWinConditions();

    // Notify callbacks
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getAllTroops());
    }
  }

  private updateElixir(deltaTime: number): void {
    const elixirGain = (deltaTime / 1000) * GAME_CONSTANTS.ELIXIR.REGEN_RATE;

    for (const player of this.players.values()) {
      if (player.elixir < player.maxElixir) {
        player.elixir = Math.min(player.maxElixir, player.elixir + elixirGain);
      }
    }
  }

  private updateTowers(deltaTime: number): void {
    const allTroops = this.getAllTroops();
    const allTowers = this.getActiveTowers();

    for (const tower of this.towers.values()) {
      // Update the tower (find targets and attack)
      tower.update(deltaTime / 1000, allTroops, allTowers, this);
    }
  }

  private cleanupDeadTroops(): void {
    const deadTroops = Array.from(this.troops.entries())
      .filter(([, troop]) => {
        if (!troop || !troop.data) {
          console.warn('Troop missing data property:', troop);
          return false;
        }
        return !troop.data.isAlive;
      })
      .map(([id,]) => id);

    for (const id of deadTroops) {
      this.troops.delete(id);
    }
  }

  private checkWinConditions(): void {
    const redKing = this.towers.get('red_king');
    const blueKing = this.towers.get('blue_king');

    if (redKing && redKing.data && !redKing.data.isAlive) {
      console.log('Game Over: Blue team wins! King Red destroyed');
      this.endGame('blue');
    } else if (blueKing && blueKing.data && !blueKing.data.isAlive) {
      console.log('Game Over: Red team wins! King Blue destroyed');
      this.endGame('red');
    }

    // Check for time limit
    const gameTime = (Date.now() - this.gameStartTime) / 1000;
    if (gameTime >= GAME_CONSTANTS.TIME.NORMAL_DURATION + GAME_CONSTANTS.TIME.OVERTIME_DURATION) {
      this.determineWinnerByCrowns();
    }
  }

  private endGame(winner: 'red' | 'blue'): void {
    this.gameStatus = GameStatus.ENDED;
    this.winner = winner;

    if (this.onGameEndCallback) {
      this.onGameEndCallback(winner);
    }
  }

  private determineWinnerByCrowns(): void {
    let redCrowns = 0;
    let blueCrowns = 0;

    for (const tower of this.towers.values()) {
      if (!tower.data.isAlive) {
        if (tower.data.team === 'red') {
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

  // Spawn troop with entity
  public spawnTroop(type: TroopType, team: 'red' | 'blue', row: number, col: number): TroopData {
    const id = uuidv4();
    let troopEntity: TroopEntity;

    switch (type) {
      case TroopType.GIANT:
        troopEntity = new GiantEntity(id, team, { row, col });
        break;
      // Add other troop types when entities are created
      // case TroopType.BABY_DRAGON:
      //   troopEntity = new BabyDragonEntity(id, team, { row, col });
      //   break;
      // case TroopType.MINI_PEKKA:
      //   troopEntity = new MiniPekkaEntity(id, team, { row, col });
      //   break;
      // case TroopType.VALKYRIE:
      //   troopEntity = new ValkyrieEntity(id, team, { row, col });
      //   break;
      default:
        // Fallback to creating simple troop data for now
        const config = TROOP_CONFIGS[type];
        const troopData: TroopData = {
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
          lastAttackTime: 0, // Start at 0 to allow immediate first attack
          focusOnBuildings: config.focusOnBuildings,
          flying: config.flying,
          row,
          col,
          spawnTime: Date.now(),
          lastUpdateTime: Date.now()
        };

        // Create a simple entity wrapper with actual movement logic
        troopEntity = {
          data: troopData,
          update: (deltaTime: number, towers: any[], _flaggedCells: Set<string>, gameEngine: any) => {
            // Skip if dead
            if (!troopData.isAlive || troopData.state === TroopState.DEAD) return;

            // Handle spawning state - immediate transition like local engine
            if (troopData.state === TroopState.SPAWNING) {
              // Determine if bridge is needed based on position
              const frontierRow = 16;
              let needsBridge = false;

              if (troopData.team === 'blue') {
                // Blue targets red towers (up) - needs bridge if spawn below frontier
                needsBridge = troopData.position.row > frontierRow;
              } else {
                // Red targets blue towers (down) - needs bridge if spawn above frontier
                needsBridge = troopData.position.row < frontierRow;
              }

              if (needsBridge) {
                troopData.state = TroopState.MOVING_TO_BRIDGE;
              } else {
                troopData.state = TroopState.TARGETING_TOWER;
              }
              return;
            }

            // Bridge positions (matching local engine)
            const bridges = [
              { row: 16, col: 3 },
              { row: 16, col: 14 }
            ];

            // Choose closest bridge
            let closestBridge = bridges[0];
            let closestDist = bridges[0] ? Math.sqrt(
              Math.pow(bridges[0].row - troopData.position.row, 2) +
              Math.pow(bridges[0].col - troopData.position.col, 2)
            ) : 0;

            for (const bridge of bridges) {
              const dist = Math.sqrt(
                Math.pow(bridge.row - troopData.position.row, 2) +
                Math.pow(bridge.col - troopData.position.col, 2)
              );
              if (dist < closestDist) {
                closestDist = dist;
                closestBridge = bridge;
              }
            }

            const bridgeRow = closestBridge?.row ?? 17;
            const bridgeCol = closestBridge?.col ?? 9;

            // Move to bridge first
            if (troopData.state === TroopState.MOVING_TO_BRIDGE) {
              const distToBridge = Math.abs(troopData.position.row - bridgeRow);
              if (distToBridge < 1) {
                troopData.state = TroopState.TARGETING_TOWER;
              } else {
                // Move towards bridge
                const direction = troopData.team === 'red' ? 1 : -1;
                const moveDistance = troopData.speed * deltaTime;
                troopData.position.row += direction * moveDistance;
                troopData.row = troopData.position.row;

                // Move horizontally towards center if needed
                const colDiff = bridgeCol - troopData.position.col;
                if (Math.abs(colDiff) > 0.5) {
                  const colMove = Math.sign(colDiff) * Math.min(moveDistance, Math.abs(colDiff));
                  troopData.position.col += colMove;
                  troopData.col = troopData.position.col;
                }
              }
            }

            // Target and move to nearest enemy (tower or troop based on focusOnBuildings)
            if (troopData.state === TroopState.TARGETING_TOWER || troopData.state === TroopState.ATTACKING_TOWER) {
              let closestTarget: any = null;
              let closestDist = Infinity;
              let targetType: 'tower' | 'troop' = 'tower';

              // Check if troop focuses only on buildings
              if (troopData.focusOnBuildings) {
                // Giant - only targets towers
                const enemyTowers = towers.filter(t => t.team !== troopData.team && t.isAlive);
                if (enemyTowers.length === 0) {
                  troopData.state = TroopState.DEAD;
                  troopData.isAlive = false;
                  return;
                }

                closestTarget = enemyTowers[0];
                closestDist = Math.sqrt(
                  Math.pow(closestTarget.position.row - troopData.position.row, 2) +
                  Math.pow(closestTarget.position.col - troopData.position.col, 2)
                );

                for (const tower of enemyTowers) {
                  const dist = Math.sqrt(
                    Math.pow(tower.position.row - troopData.position.row, 2) +
                    Math.pow(tower.position.col - troopData.position.col, 2)
                  );
                  if (dist < closestDist) {
                    closestDist = dist;
                    closestTarget = tower;
                  }
                }
                targetType = 'tower';
              } else {
                // Baby Dragon, Mini P.E.K.K.A, Valkyrie - target nearest enemy (troop or tower)
                const result = gameEngine.findClosestEnemy(troopData);
                if (!result) {
                  troopData.state = TroopState.DEAD;
                  troopData.isAlive = false;
                  return;
                }
                closestTarget = result.target;
                closestDist = result.distance;
                targetType = result.target.type === 'tower' ? 'tower' : 'troop';
              }

              // Update target position
              troopData.targetPosition = closestTarget.position;
              if (targetType === 'tower') {
                troopData.towerTarget = closestTarget.id;
              }

              // Check if in attack range
              const attackRange = config.range || 1.2;
              if (closestDist <= attackRange) {
                troopData.state = TroopState.ATTACKING_TOWER;
                troopData.isInCombat = true;

                // Attack if cooldown is ready (attackSpeed is attacks per second)
                const now = Date.now() / 1000; // Convert to seconds
                const attackCooldown = 1 / troopData.attackSpeed; // Time between attacks in seconds
                if (troopData.lastAttackTime === 0 || now - troopData.lastAttackTime >= attackCooldown) {
                  // Deal damage based on target type
                  if (targetType === 'tower') {
                    const towerEntity = gameEngine.towers.get(closestTarget.id);
                    if (towerEntity) {
                      towerEntity.takeDamage(troopData.attackDamage);
                      troopData.lastAttackTime = now;
                      console.log(`Troop ${troopData.id} attacks tower ${closestTarget.id} for ${troopData.attackDamage} damage`);
                    }
                  } else {
                    // Attack enemy troop
                    gameEngine.dealDamageToTroop(closestTarget.id, troopData.attackDamage);
                    troopData.lastAttackTime = now;
                    console.log(`Troop ${troopData.id} attacks troop ${closestTarget.id} for ${troopData.attackDamage} damage`);
                  }
                }
              } else {
                // Move towards target
                troopData.state = TroopState.TARGETING_TOWER;
                troopData.isInCombat = false;

                const moveDistance = troopData.speed * deltaTime;
                const dx = closestTarget.position.col - troopData.position.col;
                const dy = closestTarget.position.row - troopData.position.row;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                  const moveX = (dx / dist) * moveDistance;
                  const moveY = (dy / dist) * moveDistance;

                  troopData.position.col += moveX;
                  troopData.position.row += moveY;
                  troopData.col = troopData.position.col;
                  troopData.row = troopData.position.row;
                }
              }
            }

            troopData.lastUpdateTime = Date.now();
          },
          takeDamage: (damage: number) => {
            troopData.health -= damage;
            if (troopData.health <= 0) {
              troopData.health = 0;
              troopData.isAlive = false;
              troopData.state = TroopState.DEAD;
            }
          }
        };
    }

    this.troops.set(id, troopEntity);
    console.log(`${type} spawned: ${id} for team ${team} at (${row}, ${col})`);
    return troopEntity.data;
  }

  // Method to find closest enemy (troop or tower)
  public findClosestEnemy(troop: TroopData): { target: any, distance: number } | null {
    const activeTowers = this.getActiveTowers();
    const enemyTroops = this.getAllTroops().filter(t =>
      t.team !== troop.team && t.isAlive
    );

    let closestTarget: any = null;
    let closestDistance = Infinity;

    // Check enemy towers (always accessible)
    activeTowers.forEach(tower => {
      if (tower.team !== troop.team) {
        const distance = Math.sqrt(
          Math.pow(tower.position.row - troop.position.row, 2) +
          Math.pow(tower.position.col - troop.position.col, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = { ...tower, type: 'tower' };
        }
      }
    });

    // Check enemy troops (with flying vs non-flying restriction and river side)
    enemyTroops.forEach(enemyTroop => {
      // Non-flying troops cannot target flying troops
      if (!troop.flying && enemyTroop.flying) {
        return;
      }

      // For non-flying troops, check they are on same side of river
      if (!troop.flying) {
        const frontierRow = 16;
        const troopSide = troop.position.row <= frontierRow ? 'top' : 'bottom';
        const enemySide = enemyTroop.position.row <= frontierRow ? 'top' : 'bottom';

        if (troopSide !== enemySide) {
          return;
        }
      }

      const distance = Math.sqrt(
        Math.pow(enemyTroop.position.row - troop.position.row, 2) +
        Math.pow(enemyTroop.position.col - troop.position.col, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = { ...enemyTroop, type: 'troop' };
      }
    });

    return closestTarget ? { target: closestTarget, distance: closestDistance } : null;
  }

  public dealDamageToTower(towerId: string, damage: number): void {
    const tower = this.towers.get(towerId);
    if (tower) {
      tower.takeDamage(damage);

      // Activate king tower if princess tower is destroyed
      if (!tower.data.isAlive && tower.data.type === TowerType.PRINCESS) {
        const kingTowerId = tower.data.team === 'red' ? 'red_king' : 'blue_king';
        const kingTower = this.towers.get(kingTowerId);
        if (kingTower) {
          kingTower.data.active = true;
          console.log(`King tower ${kingTowerId} activated after princess tower destruction`);
        }
      }
    }
  }

  public dealDamageToTroop(troopId: string, damage: number): void {
    const troopEntity = this.troops.get(troopId);
    if (troopEntity) {
      troopEntity.takeDamage(damage);
    }
  }

  public getTowerEntity(id: string): TowerEntity | undefined {
    return this.towers.get(id);
  }

  public getTroopEntity(id: string): TroopEntity | undefined {
    return this.troops.get(id);
  }

  public getAllTroops(): TroopData[] {
    return Array.from(this.troops.values()).map(troopEntity => troopEntity.data);
  }

  public getAllTowers(): TowerData[] {
    return Array.from(this.towers.values()).map(tower => tower.data);
  }

  public getActiveTowers(): TowerData[] {
    return this.getAllTowers().filter(tower => tower.active && tower.isAlive);
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

  public connectFlaggedCells(flaggedCells: Set<string>): void {
    this.flaggedCells = flaggedCells;
  }

  public setOnUpdateCallback(callback: (troops: TroopData[]) => void): void {
    this.onUpdateCallback = callback;
  }

  public setOnGameEndCallback(callback: (winner: 'red' | 'blue') => void): void {
    this.onGameEndCallback = callback;
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
      troops: Array.from(this.troops.values()).map(t => t.data),
      towers: Array.from(this.towers.values()).map(t => t.data),
      players: Array.from(this.players.values()),
      winner: this.winner
    };
  }

  public getStatus(): GameStatus {
    return this.gameStatus;
  }

  public getTroops(): TroopData[] {
    return this.getAllTroops();
  }

  public getTowers(): TowerData[] {
    return this.getAllTowers();
  }

  public getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  // Utility methods for statistics
  public getGameStats() {
    const allTroops = this.getAllTroops();
    const livingTroops = allTroops.filter(t => t.isAlive);

    return {
      totalTroops: allTroops.length,
      livingTroops: livingTroops.length,
      redTroops: allTroops.filter(t => t.team === 'red').length,
      blueTroops: allTroops.filter(t => t.team === 'blue').length,
      gameTime: (Date.now() - this.gameStartTime) / 1000,
      isRunning: this.gameStatus === GameStatus.IN_PROGRESS,
      isPaused: this.gameStatus === GameStatus.PAUSED
    };
  }
}
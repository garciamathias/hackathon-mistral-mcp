"use client";

interface TowerHealthBarProps {
  currentHealth: number;
  maxHealth: number;
  isKing?: boolean;
  team: 'red' | 'blue';
}

export default function TowerHealthBar({
  currentHealth,
  maxHealth,
  team
}: TowerHealthBarProps) {
  const healthPercentage = (currentHealth / maxHealth) * 100;

  return (
    <div className="relative">
      {/* Nombre HP positionné au-dessus et légèrement à gauche de la barre */}
      <span className="absolute z-20 text-white supercell-font"
            style={{
              fontSize: '10px',
              fontWeight: '300',
              textShadow: '0 0 3px rgba(0,0,0,1), 1px 1px 2px rgba(0,0,0,1)',
              left: '2px',
              top: '-5px'
            }}>
        {currentHealth}
      </span>

      {/* Barre de vie - plus petite */}
      <div className="relative w-14.5 h-2.5 bg-black rounded-sm overflow-hidden"
           style={{
             outline: '1px solid black',
             marginTop: '8px'
           }}>
        {/* Barre de vie actuelle - couleur selon l'équipe */}
        <div
          className={`absolute left-0 top-0 h-full ${
            team === 'red'
              ? 'bg-gradient-to-b from-red-400 to-red-500'
              : 'bg-gradient-to-b from-blue-400 to-blue-500'
          }`}
          style={{ width: `${healthPercentage}%` }}
        >
          {/* Petite brillance sur la barre */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10"></div>
        </div>
      </div>
    </div>
  );
}
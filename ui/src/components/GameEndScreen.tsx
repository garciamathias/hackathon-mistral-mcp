"use client";

interface GameEndScreenProps {
  winner: 'red' | 'blue';
  onRestart?: () => void;
}

export default function GameEndScreen({ winner, onRestart }: GameEndScreenProps) {
  const isPlayerWinner = winner === 'blue'; // Supposons que le joueur joue l'équipe bleue
  const resultText = isPlayerWinner ? "You Won" : "You Lost";
  const textColor = isPlayerWinner ? "text-blue-400" : "text-red-400";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Texte principal avec la Supercell font */}
        <div 
          className={`text-6xl font-bold mb-8 supercell-font ${textColor}`}
          style={{
            textShadow: '3px 3px 6px rgba(0,0,0,1)',
            filter: 'drop-shadow(0 0 10px currentColor)'
          }}
        >
          {resultText}
        </div>
        
        {/* Bouton de redémarrage */}
        {onRestart && (
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 shadow-2xl border-4 border-yellow-300 supercell-font"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

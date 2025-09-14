"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import TransitionScreen from "@/components/TransitionScreen";

export default function Home() {
  const [showTransition, setShowTransition] = useState(false);
  const [gameMode, setGameMode] = useState<'local' | 'online' | null>(null);
  const router = useRouter();

  const handleLocalCombat = () => {
    setGameMode('local');
    setShowTransition(true);

  };

  const handleOnlineCombat = () => {
    router.push('/lobby');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Fond flou */}
        <img
          src="/images/backgrounds/goal.png"
          alt="Goal Background Blurred"
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
        
        {/* Container avec ratio 9/16 */}
        <div className="relative w-[56.25vh] h-screen max-w-full max-h-screen z-10">
          <img
            src="/images/backgrounds/goal.png"
            alt="Goal Background"
            className="w-full h-full object-cover"
          />
          
          {/* Boutons de jeu */}
          <div className="absolute bottom-6 left-0 right-0 px-4">
            <div className="space-y-3 flex justify-center">
              {/* Mode Online */}
              <Button
                onClick={handleOnlineCombat}
                className="bg-gradient-to-r w-[85%] from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-11 px-4 rounded-2xl text-xl transition-all duration-300 shadow-2xl border-4 border-yellow-300 supercell-font"
              >
                Combat Online
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Écran de transition */}
      {showTransition && gameMode === 'local' && (
        <TransitionScreen
          onTransitionComplete={() => {
            setShowTransition(false);
            router.push('/arena?mode=local');
          }}
        />
      )}
    </>
  );
}

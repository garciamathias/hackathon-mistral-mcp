"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
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
        
        {/* Bouton jouer stylisé */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <Link href="/arena">
            <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-10 px-7 rounded-2xl text-2xl transition-all duration-300 shadow-2xl border-4 border-yellow-300">
                Combat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

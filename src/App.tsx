import { useState } from 'react';
import { PlayerConfig } from './engine/types';
import { MenuScreen } from './ui/MenuScreen';
import { GameScreen } from './ui/GameScreen';

interface Session {
  players: PlayerConfig[];
  seed: number;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return (
      <MenuScreen
        onStart={(players) =>
          setSession({ players, seed: (Math.random() * 0xffffffff) >>> 0 })
        }
      />
    );
  }
  return (
    <GameScreen
      key={session.seed}
      players={session.players}
      seed={session.seed}
      onExit={() => setSession(null)}
    />
  );
}

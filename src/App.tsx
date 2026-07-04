import { useState } from 'react';
import { PlayerConfig } from './engine/types';
import { MenuScreen } from './ui/MenuScreen';
import { GameScreen } from './ui/GameScreen';
import { tableBg } from './ui/assets';

interface Session {
  players: PlayerConfig[];
  seed: number;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const bg = tableBg();

  return (
    <>
      {bg && <div className="table-underlay" style={{ backgroundImage: `url(${bg})` }} />}
      {!session ? (
        <MenuScreen
          onStart={(players) =>
            setSession({ players, seed: (Math.random() * 0xffffffff) >>> 0 })
          }
        />
      ) : (
        <GameScreen
          key={session.seed}
          players={session.players}
          seed={session.seed}
          onExit={() => setSession(null)}
        />
      )}
    </>
  );
}

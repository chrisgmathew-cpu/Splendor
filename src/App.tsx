import { useState } from 'react';
import { GameState, PlayerConfig } from './engine/types';
import { MenuScreen } from './ui/MenuScreen';
import { GameScreen } from './ui/GameScreen';
import { tableBg } from './ui/assets';
import { clearSave, loadGame } from './ui/persist';

interface Session {
  players: PlayerConfig[];
  seed: number;
  /** Present when resuming a saved game. */
  initial?: GameState;
  /** Distinguishes multiple resumes of the same save for React keying. */
  nonce: number;
}

function sessionFromSave(save: { state: GameState; seed: number }): Session {
  return {
    players: save.state.players.map((p) => ({
      name: p.name,
      kind: p.kind,
      difficulty: p.difficulty,
    })),
    seed: save.seed,
    initial: save.state,
    nonce: Date.now(),
  };
}

export default function App() {
  // A refresh mid-game drops you straight back into the saved game.
  const [session, setSession] = useState<Session | null>(() => {
    const save = loadGame();
    return save ? sessionFromSave(save) : null;
  });
  const bg = tableBg();

  const resume = () => {
    const save = loadGame();
    if (save) setSession(sessionFromSave(save));
  };

  return (
    <>
      {bg && <div className="table-underlay" style={{ backgroundImage: `url(${bg})` }} />}
      {!session ? (
        <MenuScreen
          canResume={loadGame() !== null}
          onResume={resume}
          onStart={(players) => {
            clearSave();
            setSession({ players, seed: (Math.random() * 0xffffffff) >>> 0, nonce: Date.now() });
          }}
        />
      ) : (
        <GameScreen
          key={`${session.seed}-${session.nonce}`}
          players={session.players}
          seed={session.seed}
          initialState={session.initial}
          onExit={() => setSession(null)}
        />
      )}
    </>
  );
}

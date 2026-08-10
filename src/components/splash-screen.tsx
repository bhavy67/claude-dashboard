import { useEffect, useState } from 'react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const hold = setTimeout(() => setPhase('hold'), 600);
    const out = setTimeout(() => setPhase('out'), 1400);
    const done = setTimeout(onFinish, 1700);
    return () => {
      clearTimeout(hold);
      clearTimeout(out);
      clearTimeout(done);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        transition: 'opacity 1500ms ease',
        opacity: phase === 'out' ? 0 : 1,
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black gap-3"
    >
      <span
        style={{
          transition: 'opacity 600ms ease, transform 600ms ease',
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'translateY(8px)' : 'translateY(0)',
          fontFamily: 'inherit',
          fontSize: '5.5rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#fff',
        }}
      >
        CD
      </span>
      <span
        style={{
          transition: 'opacity 600ms ease 100ms',
          opacity: phase === 'in' ? 0 : 1,
          fontSize: '2.00rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#666',
        }}
      >
        claude dashboard
      </span>
    </div>
  );
}

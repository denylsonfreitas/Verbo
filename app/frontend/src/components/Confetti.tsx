import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  duration?: number;
}

const Confetti: React.FC<ConfettiProps> = ({ show, duration = 3000 }) => {
  const [confettiPieces, setConfettiPieces] = useState<JSX.Element[]>([]);

  useEffect(() => {
    if (show) {
      const pieces: JSX.Element[] = [];
      const numberOfPieces = 50;

      for (let i = 0; i < numberOfPieces; i++) {
        const randomLeft = Math.random() * 100;
        const randomDelay = Math.random() * 2000;
        const randomColorClass = `confetti-${Math.floor(Math.random() * 6) + 1}`;
        const randomSize = Math.random() * 8 + 4; // 4-12px

        pieces.push(
          <div
            key={i}
            className={`confetti ${randomColorClass} fall`}
            style={{
              left: `${randomLeft}%`,
              animationDelay: `${randomDelay}ms`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
            }}
          />
        );
      }

      setConfettiPieces(pieces);

      // Limpar confetes após duração especificada
      const timer = setTimeout(() => {
        setConfettiPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setConfettiPieces([]);
    }
  }, [show, duration]);

  if (!show || confettiPieces.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces}
    </div>
  );
};

export default Confetti;

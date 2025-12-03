import React from 'react';

export type MascotMood = 'neutral' | 'happy' | 'proud' | 'low' | 'worried';

interface MascotProps {
  text: string;
  mood?: MascotMood;
}

export const Mascot: React.FC<MascotProps> = ({ text, mood = 'neutral' }) => {
  return (
    <div id="mascot-wrapper" className="mascot-wrapper card !flex-row !items-center !gap-4 !p-4">
      <div id="mascot" className={`mascot mascot-${mood}`}>
        <div className="mascot-face">
          <div className="mascot-eyes">
            <span className="eye left"></span>
            <span className="eye right"></span>
          </div>
          <div className="mascot-mouth"></div>
          <div className="mascot-cheeks">
            <span className="cheek left"></span>
            <span className="cheek right"></span>
          </div>
        </div>
      </div>

      <div className="mascot-bubble">
        <p id="mascot-text" className="m-0">
          {text}
        </p>
      </div>
    </div>
  );
};
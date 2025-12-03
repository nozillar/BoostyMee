import React, { useState, useEffect } from 'react';
import { generateMotivation } from '../services/geminiService';
import { Button } from './Button';
import { Sparkles, RefreshCw, Quote } from 'lucide-react';

export const MotivationCard: React.FC = () => {
  const [motivation, setMotivation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('procrastinating');

  const moods = ['procrastinating', 'tired', 'anxious', 'excited', 'stuck'];

  const fetchMotivation = async (selectedMood: string = mood) => {
    setLoading(true);
    try {
      const text = await generateMotivation(selectedMood);
      setMotivation(text);
    } catch (e) {
      setMotivation("You are capable of more than you know.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-300 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 text-center space-y-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-yellow-300" />
          </div>
          
          <div className="min-h-[120px] flex items-center justify-center">
            {loading ? (
              <div className="animate-pulse space-y-3 w-full max-w-md mx-auto">
                <div className="h-4 bg-white/30 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-white/30 rounded w-1/2 mx-auto"></div>
              </div>
            ) : (
              <blockquote className="text-2xl md:text-3xl font-medium leading-tight font-serif italic">
                "{motivation}"
              </blockquote>
            )}
          </div>

          <div className="pt-4">
            <p className="text-sm text-indigo-100 mb-4 font-medium uppercase tracking-wider">How are you feeling?</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMood(m);
                    fetchMotivation(m);
                  }}
                  className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                    mood === m 
                      ? 'bg-white text-indigo-600 font-bold shadow-md transform scale-105' 
                      : 'bg-indigo-700/50 text-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => fetchMotivation()}
              disabled={loading}
              className="inline-flex items-center text-sm text-indigo-200 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Get new boost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
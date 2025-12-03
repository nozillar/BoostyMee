import React, { useState, useEffect } from 'react';
import { generateCheckInSupport } from '../services/geminiService';
import { CheckInRecord } from '../types';
import { Smile, Frown, Meh, Heart, Zap, CloudRain, HelpCircle, AlertCircle } from 'lucide-react';

export const DailyCheckIn: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [score, setScore] = useState(5);
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null);

  const moods = [
    { id: 'confident', label: 'มั่นใจ', icon: <Zap size={20} className="text-yellow-500" /> },
    { id: 'excited', label: 'ตื่นเต้น', icon: <Heart size={20} className="text-pink-500" /> },
    { id: 'tired', label: 'เหนื่อย', icon: <Meh size={20} className="text-gray-500" /> },
    { id: 'sad', label: 'เศร้า', icon: <CloudRain size={20} className="text-blue-500" /> },
    { id: 'worried', label: 'กังวล', icon: <Frown size={20} className="text-indigo-500" /> },
    { id: 'fear', label: 'กลัว', icon: <AlertCircle size={20} className="text-orange-500" /> },
    { id: 'confused', label: 'สับสน', icon: <HelpCircle size={20} className="text-purple-500" /> },
  ];

  useEffect(() => {
    // Check if already checked in today
    const history = JSON.parse(localStorage.getItem('boostme_logs') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = history.find((h: CheckInRecord) => h.date === todayStr);
    if (existing) {
      setTodayRecord(existing);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;

    setLoading(true);
    try {
      const aiResponse = await generateCheckInSupport(score, mood, note);
      
      const newRecord: CheckInRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        score,
        mood,
        note,
        aiResponse
      };

      const history = JSON.parse(localStorage.getItem('boostme_logs') || '[]');
      localStorage.setItem('boostme_logs', JSON.stringify([newRecord, ...history]));
      
      setTodayRecord(newRecord);
      onComplete(); // Notify parent to refresh stats if needed
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (todayRecord) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-green-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="inline-flex h-16 w-16 bg-green-100 text-green-600 rounded-full items-center justify-center mb-2">
          <Smile size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">บันทึกวันนี้เรียบร้อย!</h2>
          <p className="text-gray-600 italic">"{todayRecord.aiResponse}"</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
          ความมั่นใจ: {todayRecord.score}/10 • อารมณ์: {moods.find(m => m.id === todayRecord.mood)?.label}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-primary-600 p-6 text-white text-center">
        <h2 className="text-xl font-bold">Daily Check-in</h2>
        <p className="text-primary-100 text-sm">วันนี้เป็นยังไงบ้าง? เล่าให้เราฟังหน่อย</p>
      </div>
      
      <form id="checkin-form" onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Score Slider */}
        <div className="space-y-3">
          <label htmlFor="checkin-score-slider" className="font-medium text-gray-700 block">
            ระดับความมั่นใจของวันนี้
          </label>
          
          <div className="slider-row bg-gray-50 p-4 rounded-xl">
            <input
              type="range"
              id="checkin-score-slider"
              min="1"
              max="10"
              step="1"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
            />
            <div className="slider-value text-xl">
              <span id="checkin-score-display">{score}</span>/10
            </div>
          </div>
          
          <small className="text-gray-500 text-xs block">
            เลื่อนแถบจาก 1 (ไม่มั่นใจเลย) ไป 10 (มั่นใจมาก)
          </small>
        </div>

        {/* Mood Selection */}
        <div className="space-y-3">
          <label className="font-medium text-gray-700">วันนี้รู้สึกแบบไหน?</label>
          <div className="grid grid-cols-4 gap-2">
            {moods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  mood === m.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="mb-1">{m.icon}</div>
                <span className="text-[10px] sm:text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note Input */}
        <div className="space-y-2">
          <label htmlFor="checkin-note" className="font-medium text-gray-700 block">
            วันนี้เกิดอะไรขึ้นบ้าง
          </label>
          <textarea
            id="checkin-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เล่าให้ BoostMe ฟังได้นะ"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
          />
        </div>

        <button 
          type="submit" 
          className="primary-button" 
          disabled={!mood || loading}
        >
          {loading ? (
             <>
               <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
               Processing...
             </>
          ) : (
            'บันทึก Check-in วันนี้'
          )}
        </button>
      </form>
    </div>
  );
};
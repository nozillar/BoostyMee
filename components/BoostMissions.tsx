import React, { useState, useEffect } from 'react';
import { DailyMission } from '../types';
import { generateTailoredMissions } from '../services/geminiService';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

const DEFAULT_MISSIONS: DailyMission[] = [
  { id: 1, text: 'เขียนสิ่งที่ภูมิใจวันนี้ 1 ข้อ', completed: false },
  { id: 2, text: 'ลองยืนหลังตรงและหายใจลึก 10 ครั้ง', completed: false },
  { id: 3, text: 'ส่งข้อความขอบคุณใครสักคน', completed: false },
  { id: 4, text: 'ยิ้มให้ตัวเองในกระจก', completed: false },
  { id: 5, text: 'ดื่มน้ำ 1 แก้วใหญ่ตอนนี้เลย', completed: false },
];

export const BoostMissions: React.FC = () => {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`boostme_missions_${todayStr}`);
    
    if (stored) {
      setMissions(JSON.parse(stored));
    } else {
      // Pick 3 random missions or use default first 3
      const initial = DEFAULT_MISSIONS.slice(0, 3);
      setMissions(initial);
      localStorage.setItem(`boostme_missions_${todayStr}`, JSON.stringify(initial));
    }
  }, []);

  const toggleMission = (id: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newMissions = missions.map(m => {
      if (m.id === id) {
        // Update total stats
        const statsKey = 'boostme_total_missions';
        const currentTotal = parseInt(localStorage.getItem(statsKey) || '0');
        if (!m.completed) {
          localStorage.setItem(statsKey, (currentTotal + 1).toString());
        } else {
          localStorage.setItem(statsKey, Math.max(0, currentTotal - 1).toString());
        }
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    setMissions(newMissions);
    localStorage.setItem(`boostme_missions_${todayStr}`, JSON.stringify(newMissions));
  };

  const handleAiSuggest = async () => {
    setIsLoading(true);
    try {
      // Corresponds to mode === 'suggest_activities'
      const newMissions = await generateTailoredMissions();
      setMissions(newMissions);
      
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`boostme_missions_${todayStr}`, JSON.stringify(newMissions));
    } catch (err) {
      console.error("Failed to generate missions", err);
      alert('ขออภัย ตอนนี้มีปัญหาในการเชื่อมต่อ ลองใหม่อีกครั้งนะ');
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;
  const progress = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

  return (
    <section id="boost" className="p-4 max-w-2xl mx-auto space-y-6 min-h-[500px]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Boost รายวัน</h2>
        <div className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
          สำเร็จ {completedCount}/{missions.length}
        </div>
      </div>

      {/* Progress Bar (Extra visual aid) */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ปุ่มขอกิจกรรมตามโปรไฟล์ */}
      <button 
        id="suggest-activities-btn"
        onClick={handleAiSuggest}
        disabled={isLoading}
        className="primary-button"
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            กำลังคิดภารกิจ...
          </>
        ) : (
          <>
            <Sparkles size={20} className="text-yellow-200 mr-2" />
            ขอกิจกรรมรายวันตามโปรไฟล์
          </>
        )}
      </button>

      {/* activity-suggestions container */}
      <div id="activity-suggestions" className="activity-list space-y-3">
        {missions.length === 0 ? (
           <div className="p-8 text-center text-gray-400 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
             ยังไม่มีภารกิจ กดปุ่มด้านบนเพื่อเริ่มเลย!
           </div>
        ) : (
            missions.map((mission) => (
            <div 
                key={mission.id}
                onClick={() => toggleMission(mission.id)}
                className={`group p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                mission.completed 
                  ? 'bg-gray-50/80 border-gray-100' 
                  : 'bg-white border-gray-100 hover:border-primary-200'
                }`}
            >
                <div className={`mt-0.5 flex-shrink-0 transition-all duration-300 ${
                mission.completed ? 'text-green-500 scale-110' : 'text-gray-300 group-hover:text-primary-400'
                }`}>
                {mission.completed ? <CheckCircle2 size={24} className="fill-green-100" /> : <Circle size={24} />}
                </div>
                <span className={`text-base leading-relaxed transition-all duration-300 font-medium ${
                mission.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}>
                {mission.text}
                </span>
            </div>
            ))
        )}
      </div>
    </section>
  );
};
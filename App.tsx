
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile } from './types';
import { ChatAssistant } from './components/ChatAssistant';
import { DailyCheckIn } from './components/DailyCheckIn';
import { BoostMissions } from './components/BoostMissions';
import { JourneyStats } from './components/JourneyStats';
import { ProfileView } from './components/ProfileView';
import { Mascot, MascotMood } from './components/Mascot';
import { Home, MessageCircle, Zap, Map, User } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Force re-render of stats/home if data changes
  const [tick, setTick] = useState(0); 
  // Force restart of reminder checker
  const [reminderTick, setReminderTick] = useState(0);

  // --- Initialization Logic (Equivalent to window.addEventListener('load')) ---

  // 1. Load Profile from Storage (Avatar)
  useEffect(() => {
    const loadProfileImage = () => {
      const avatar = localStorage.getItem('boostme_profile_image');
      if (avatar) {
        setUserAvatar(avatar);
      } else {
        setUserAvatar(null);
      }
    };
    loadProfileImage();
  }, [tick]);

  // 2. Start Reminder Checker
  useEffect(() => {
    const REMINDER_SETTINGS_KEY = 'boostme_reminder_settings';
    const REMINDER_LAST_TRIGGER_KEY = 'boostme_reminder_last_trigger';

    const triggerReminderNotification = (type: string) => {
      let message;
      switch (type) {
        case 'checkin':
          message = 'ถึงเวลา Daily Check-in แล้วนะ ลองมาดูวันนี้รู้สึกอย่างไรกัน 💛';
          break;
        case 'boost':
          message = 'ถึงเวลา Boost Missions แล้ว! มาลองทำภารกิจเล็ก ๆ เพื่อเพิ่มความมั่นใจกัน ✨';
          break;
        case 'both':
        default:
          message = 'นี่คือเวลาของคุณแล้ว! มาทำ Daily Check-in และ Boost Missions กันหน่อย 😊';
          break;
      }

      // In-app alert or banner (simple version)
      try {
        // You could replace this with a nicer in-app banner or modal
        alert(message);
      } catch (err) {
        console.error('Error showing in-app reminder', err);
      }

      // Browser Notification (if allowed)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('BoostMe – Daily Reminder', {
          body: message,
          icon: '/icon.png' // Browser will use default if not found
        });
      }
    };

    // Logic function matching user snippet
    const checkAndTriggerReminder = () => {
      let settings;
      try {
        const json = localStorage.getItem(REMINDER_SETTINGS_KEY);
        if (!json) return;
        settings = JSON.parse(json);
      } catch (err) {
        console.error('Error parsing reminder settings', err);
        return;
      }

      if (!settings || !settings.enabled || !settings.time) return;

      const now = new Date();
      const [targetHourStr, targetMinuteStr] = settings.time.split(':');
      if (!targetHourStr || !targetMinuteStr) return;

      const targetHour = parseInt(targetHourStr, 10);
      const targetMinute = parseInt(targetMinuteStr, 10);

      if (Number.isNaN(targetHour) || Number.isNaN(targetMinute)) return;

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Simple matching: trigger when hour/minute are equal.
      if (currentHour !== targetHour || currentMinute !== targetMinute) {
        return;
      }

      // Avoid multiple triggers in same day
      const todayKey = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

      try {
        const lastJson = localStorage.getItem(REMINDER_LAST_TRIGGER_KEY);
        if (lastJson) {
          // Try parsing JSON object first
          try {
             const lastData = JSON.parse(lastJson);
             if (lastData && lastData.date === todayKey && lastData.time === settings.time) {
               return; // already triggered today
             }
          } catch(e) {
             // Fallback for legacy string format if existed
             if (lastJson === todayKey) return; 
          }
        }

        // Trigger reminder
        triggerReminderNotification(settings.type);

        // Save last trigger
        localStorage.setItem(
          REMINDER_LAST_TRIGGER_KEY,
          JSON.stringify({ date: todayKey, time: settings.time })
        );
      } catch (err) {
        console.error('Error handling reminder last trigger', err);
      }
    };

    // startReminderChecker logic:
    // 1. Run immediately to check if we missed the minute just now
    checkAndTriggerReminder();

    // 2. Set interval (This acts as `reminderIntervalId = setInterval(...)`)
    const interval = setInterval(checkAndTriggerReminder, 60 * 1000);

    // 3. Cleanup (This acts as `clearInterval(reminderIntervalId)`)
    return () => clearInterval(interval);
  }, [reminderTick]); // Dependencies change = restartReminderChecker

  // -------------------------------------------------------------------------

  const renderView = () => {
    switch (currentView) {
      case AppView.HOME:
        return <HomeView onViewChange={setCurrentView} refreshStats={() => setTick(t => t + 1)} tick={tick} />;
      case AppView.COACH:
        return <ChatAssistant />;
      case AppView.BOOST:
        return <BoostMissions />;
      case AppView.JOURNEY:
        return <JourneyStats />;
      case AppView.PROFILE:
        return <ProfileView 
          onProfileUpdate={() => setTick(t => t + 1)} 
          onReminderUpdate={() => setReminderTick(t => t + 1)}
        />;
      default:
        return <HomeView onViewChange={setCurrentView} refreshStats={() => setTick(t => t + 1)} tick={tick} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1E1E2A]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView(AppView.HOME)}>
              <div className="bg-gradient-to-tr from-primary-500 to-accent-400 text-white p-1.5 rounded-lg transform rotate-3 shadow-md">
                <Zap size={20} fill="currentColor" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">
                BoostMe
              </span>
            </div>
            <div 
              className={`rounded-full cursor-pointer hover:ring-2 hover:ring-primary-100 transition-all ${userAvatar ? 'p-0.5 border border-gray-200' : 'p-2 bg-gray-50 text-gray-500'}`}
              onClick={() => setCurrentView(AppView.PROFILE)}
            >
              {userAvatar ? (
                 <img src={userAvatar} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto tab-content pb-24">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto">
          <nav className="nav-tabs">
            <NavButton 
              active={currentView === AppView.HOME} 
              onClick={() => setCurrentView(AppView.HOME)}
              icon={<Home size={22} />}
              label="หน้าแรก"
            />
            <NavButton 
              active={currentView === AppView.COACH} 
              onClick={() => setCurrentView(AppView.COACH)}
              icon={<MessageCircle size={22} />}
              label="โค้ช"
            />
            <NavButton 
              active={currentView === AppView.BOOST} 
              onClick={() => setCurrentView(AppView.BOOST)}
              icon={<Zap size={22} />}
              label="ภารกิจ"
            />
            <NavButton 
              active={currentView === AppView.JOURNEY} 
              onClick={() => setCurrentView(AppView.JOURNEY)}
              icon={<Map size={22} />}
              label="เส้นทาง"
            />
            <NavButton 
              active={currentView === AppView.PROFILE} 
              onClick={() => setCurrentView(AppView.PROFILE)}
              icon={<User size={22} />}
              label="โปรไฟล์"
            />
          </nav>
        </div>
      </div>
    </div>
  );
};

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`tab-button flex flex-col items-center justify-center gap-1 ${active ? 'active' : ''}`}
  >
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);

const HomeView: React.FC<{ onViewChange: (view: AppView) => void, refreshStats: () => void, tick: number }> = ({ onViewChange, refreshStats, tick }) => {
  const [name, setName] = useState('เพื่อนรัก');
  const [mascotMood, setMascotMood] = useState<MascotMood>('neutral');
  const [mascotText, setMascotText] = useState('วันนี้รู้สึกยังไง มาลองเช็กอินกับเราได้นะ 🌱');

  useEffect(() => {
    // 1. Load Name
    try {
      const savedProfile = localStorage.getItem('boostme_profile_data');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setName(p.name);
      } else {
        setName('เพื่อนรัก');
      }
    } catch (e) {
      console.error("Failed to parse profile data", e);
    }

    // 2. Load Mood & Text from last Check-in
    try {
      const history = JSON.parse(localStorage.getItem('boostme_logs') || '[]');
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = history.find((h: any) => h.date === todayStr);

      if (todayRecord) {
        // If checked in today, use that mood
        const score = todayRecord.score;
        
        // Logic strictly following user snippet mapping
        if (score >= 8) {
          setMascotMood('proud');
          setMascotText('สุดยอดเลย! วันนี้คุณดูมั่นใจมาก ภูมิใจในตัวเองด้วยนะ ✨');
        } else if (score >= 6) {
          setMascotMood('happy');
          setMascotText('วันนี้คุณทำได้ดีเลย ลองเก็บโมเมนต์ดี ๆ แบบนี้ไว้อีกนะ 💛');
        } else if (score >= 4) {
          setMascotMood('worried');
          setMascotText('ดูเหมือนวันนี้จะมีอะไรให้กังวลนิดหน่อย เราอยู่ตรงนี้เป็นเพื่อนคุณนะ 🤍');
        } else {
          setMascotMood('low');
          setMascotText('ไม่เป็นไรเลย วันที่ไม่มั่นใจก็มีได้ เรามาเริ่มจากก้าวเล็ก ๆ ไปด้วยกันนะ 🌧️➡️☀️');
        }
      } else {
        // Default mood if not checked in
        setMascotMood('neutral');
        setMascotText('วันนี้รู้สึกยังไง มาลองเช็กอินกับเราได้นะ 🌱');
      }
    } catch (e) {
      console.error("Failed to parse logs", e);
      setMascotMood('neutral');
      setMascotText('วันนี้รู้สึกยังไง มาลองเช็กอินกับเราได้นะ 🌱');
    }

  }, [tick]); // Reload when tick changes (after profile update or check-in)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <p className="app-greeting">
          สวัสดี {name} <span>วันนี้เรามาเพิ่มความมั่นใจไปด้วยกันนะ</span>
        </p>
      </div>

      {/* Mascot Section */}
      <Mascot 
        text={mascotText} 
        mood={mascotMood}
      />

      {/* Daily Check-in Section */}
      <section>
        <DailyCheckIn onComplete={refreshStats} />
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => onViewChange(AppView.COACH)}
          className="bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-2xl text-white shadow-lg shadow-primary-500/20 cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-95"
        >
          <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
            <MessageCircle size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">คุยกับโค้ช</h3>
          <p className="text-primary-100 text-xs">ระบายความในใจ หรือขอคำแนะนำ</p>
        </div>

        <div 
          onClick={() => onViewChange(AppView.BOOST)}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-95 group"
        >
          <div className="bg-accent-100 text-accent-600 w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent-200 transition-colors">
            <Zap size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">ภารกิจวันนี้</h3>
          <p className="text-gray-500 text-xs">3 สิ่งเล็กๆ ที่สร้างพลังบวก</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all" onClick={() => onViewChange(AppView.JOURNEY)}>
        <div className="bg-primary-50 p-3 rounded-full text-primary-600">
          <Map size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">เส้นทางของคุณ</h3>
          <p className="text-gray-500 text-sm">ดูสถิติความมั่นใจที่ผ่านมา</p>
        </div>
      </div>
    </div>
  );
};

export default App;

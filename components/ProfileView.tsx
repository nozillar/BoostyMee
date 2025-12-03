
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ReminderSettings } from '../types';
import { User, Camera, Edit2, LogOut, Bell } from 'lucide-react';

interface ProfileViewProps {
  onProfileUpdate: () => void;
  onReminderUpdate: () => void;
}

function ensureNotificationPermission() {
  if (!('Notification' in window)) {
    return; // Browser doesn't support
  }
  if (Notification.permission === 'default') {
    // Ask only once (when user enables reminder)
    Notification.requestPermission();
  }
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onProfileUpdate, onReminderUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: '',
    goal: '',
    note: '',
    avatar: ''
  });

  // Reminder State
  const [reminder, setReminder] = useState<ReminderSettings>({
    enabled: false,
    time: '09:00',
    type: 'checkin'
  });
  const [reminderStatus, setReminderStatus] = useState('');

  // loadProfileFromStorage logic
  useEffect(() => {
    try {
      const profileDataJSON = localStorage.getItem('boostme_profile_data');
      const profileImageData = localStorage.getItem('boostme_profile_image');

      setProfile(prev => {
        let newProfile = { ...prev };
        if (profileDataJSON) {
          const data = JSON.parse(profileDataJSON);
          newProfile = { ...newProfile, ...data };
        }
        if (profileImageData) {
          newProfile.avatar = profileImageData;
        }
        return newProfile;
      });

      // Load reminders (loadReminderSettings)
      const reminderData = localStorage.getItem('boostme_reminder_settings');
      if (reminderData) {
        setReminder(JSON.parse(reminderData));
      }
    } catch (err) {
      console.error('Error loading profile from storage', err);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Save Text Data
    const profileData = {
      name: profile.name.trim(),
      role: profile.role.trim(),
      goal: profile.goal.trim(),
      note: profile.note.trim(),
    };

    try {
      localStorage.setItem('boostme_profile_data', JSON.stringify(profileData));
      
      // 2. Save Image Data (if changed/exists)
      if (profile.avatar) {
        try {
          localStorage.setItem('boostme_profile_image', profile.avatar);
        } catch (err) {
          console.error('Cannot save image to localStorage (maybe too large)', err);
          alert('ไม่สามารถบันทึกรูปได้ (ไฟล์ใหญ่มากเกินไป)');
        }
      }

      alert('บันทึกโปรไฟล์เรียบร้อยแล้ว 😊');
      setIsEditing(false);
      onProfileUpdate(); // Notify App.tsx to update header
    } catch (err) {
      console.error('Error saving profile data', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการลบข้อมูลทั้งหมดและเริ่มต้นใหม่ใช่หรือไม่?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfile(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveReminderSettings = () => {
    try {
      if (reminder.enabled) {
        ensureNotificationPermission();
      }
      
      localStorage.setItem('boostme_reminder_settings', JSON.stringify(reminder));
      
      // Update status text matching user snippet logic
      if (reminder.enabled) {
        setReminderStatus(`ตั้งการแจ้งเตือนทุกวันเวลา ${reminder.time || '—'} เรียบร้อยแล้ว`);
      } else {
        setReminderStatus('ปิดการแจ้งเตือนรายวันแล้ว');
      }

      // Notify App to restart reminder checker immediately (restartReminderChecker)
      onReminderUpdate();
      
    } catch (error) {
      console.error('Error saving reminder settings', error);
      setReminderStatus('เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน');
    }
  };

  return (
    <section id="profile" className="p-4 max-w-lg mx-auto min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-primary-600 bg-white border border-primary-100 flex items-center gap-1 text-sm font-medium hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Edit2 size={16} /> แก้ไข
          </button>
        )}
      </div>

      {/* Profile Image Wrapper */}
      <div className="flex justify-center mb-4">
        <div 
          className={`relative w-[120px] h-[120px] rounded-full object-cover border-[4px] border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center ${isEditing ? 'cursor-pointer ring-4 ring-primary-100' : ''}`}
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          {profile.avatar ? (
            <img id="profile-image" src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-gray-300" />
          )}
        </div>
      </div>

      {/* Profile Image Actions */}
      {isEditing && (
        <div className="flex justify-center mb-6">
          <label className="px-5 py-2 rounded-full border border-gray-200 cursor-pointer text-sm bg-white hover:bg-gray-50 flex items-center gap-2 shadow-sm text-gray-600 font-medium transition-colors">
            <Camera size={16} />
            เลือกรูป / ถ่ายรูป
            <input
              type="file"
              id="profile-image-input"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="user"
              hidden
            />
          </label>
        </div>
      )}

      {/* View Mode */}
      {!isEditing ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{profile.name || "ยังไม่มีชื่อ"}</h3>
              <p className="text-primary-600 font-medium bg-primary-50 inline-block px-3 py-1 rounded-full text-xs">{profile.role || "ยังไม่ระบุสถานะ"}</p>
           </div>
           
           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-16 h-16 bg-primary-50 rounded-bl-full opacity-50"></div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">เป้าหมายความมั่นใจ</label>
             <p className="text-gray-800 leading-relaxed text-lg">{profile.goal || "-"}</p>
           </div>

           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">เกี่ยวกับฉัน</label>
             <p className="text-gray-600 leading-relaxed">{profile.note || "-"}</p>
           </div>
           
           {/* Reminder Section */}
           <hr className="section-divider" />

           <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-primary-500" /> การแจ้งเตือนรายวัน
            </h3>
            <p className="text-muted mt-1">
              ตั้งเวลาเตือนให้มาทำ Daily Check-in หรือ Boost Missions ในแต่ละวัน
            </p>

            <div className="reminder-settings">
              <div className="reminder-row">
                <label htmlFor="reminder-enabled" className="reminder-label">
                  <input 
                    type="checkbox" 
                    id="reminder-enabled"
                    checked={reminder.enabled}
                    onChange={(e) => {
                      setReminder({...reminder, enabled: e.target.checked});
                      if (e.target.checked) {
                        ensureNotificationPermission();
                      }
                    }}
                    className="w-5 h-5 accent-primary-600 rounded"
                  />
                  เปิดการเตือนรายวัน
                </label>
              </div>

              <div className="reminder-row">
                <label htmlFor="reminder-time">เวลาเตือน</label>
                <input 
                  type="time" 
                  id="reminder-time"
                  value={reminder.time}
                  onChange={(e) => setReminder({...reminder, time: e.target.value})}
                  disabled={!reminder.enabled}
                />
              </div>

              <div className="reminder-row">
                <label htmlFor="reminder-type">เตือนให้ทำอะไร</label>
                <select 
                  id="reminder-type"
                  value={reminder.type}
                  onChange={(e) => setReminder({...reminder, type: e.target.value as any})}
                  disabled={!reminder.enabled}
                >
                  <option value="checkin">Daily Check-in</option>
                  <option value="boost">Boost Missions</option>
                  <option value="both">ทั้ง Check-in และ Boost</option>
                </select>
              </div>

              <button 
                id="reminder-save-btn" 
                type="button" 
                className="primary-button"
                onClick={saveReminderSettings}
              >
                บันทึกการแจ้งเตือน
              </button>

              <p id="reminder-status" className="reminder-status text-muted min-h-[1.5em]">{reminderStatus}</p>
            </div>
           </div>

           <div className="pt-6">
              <button 
                onClick={handleReset}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors text-sm font-medium"
              >
                  <LogOut size={16} />
                  ล้างข้อมูลทั้งหมด
              </button>
           </div>
        </div>
      ) : (
        /* Edit Form */
        <form id="profile-form" onSubmit={handleSave} className="profile-form space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="form-group">
            <label htmlFor="profile-name" className="block mb-1.5 text-sm font-semibold text-gray-700">ชื่อเล่น / ชื่อที่อยากให้เรียก</label>
            <input 
              type="text" 
              id="profile-name"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              placeholder="เช่น โน้ต"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-role" className="block mb-1.5 text-sm font-semibold text-gray-700">สถานะของฉันตอนนี้</label>
            <input 
              type="text" 
              id="profile-role"
              value={profile.role}
              onChange={(e) => setProfile({...profile, role: e.target.value})}
              placeholder="เช่น นักเรียนมัธยม / ครู / วัยทำงาน"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-goal" className="block mb-1.5 text-sm font-semibold text-gray-700">เป้าหมายความมั่นใจหลักของฉัน</label>
            <textarea 
              id="profile-goal"
              rows={3}
              value={profile.goal}
              onChange={(e) => setProfile({...profile, goal: e.target.value})}
              placeholder="เช่น อยากกล้าพูดต่อหน้าคนอื่นมากขึ้น"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm resize-none"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-note" className="block mb-1.5 text-sm font-semibold text-gray-700">เกี่ยวกับฉัน (เพิ่มเติม)</label>
            <textarea 
              id="profile-note"
              rows={3}
              value={profile.note}
              onChange={(e) => setProfile({...profile, note: e.target.value})}
              placeholder="อยากเล่าอะไรให้ BoostMe รู้เกี่ยวกับตัวคุณ"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="primary-button flex-1"
            >
              บันทึกโปรไฟล์
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

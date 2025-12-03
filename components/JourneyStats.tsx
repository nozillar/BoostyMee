import React, { useEffect, useState } from 'react';
import { CheckInRecord, UserStats } from '../types';
import { TrendingUp, Calendar, CheckSquare, Award } from 'lucide-react';

export const JourneyStats: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    totalCheckIns: 0,
    avgConfidence: 0,
    totalMissionsCompleted: 0
  });

  useEffect(() => {
    const logs: CheckInRecord[] = JSON.parse(localStorage.getItem('boostme_logs') || '[]');
    const totalMissions = parseInt(localStorage.getItem('boostme_total_missions') || '0');

    const totalCheckIns = logs.length;
    const avgConfidence = totalCheckIns > 0 
      ? logs.reduce((acc, curr) => acc + curr.score, 0) / totalCheckIns 
      : 0;

    setStats({
      totalCheckIns,
      avgConfidence: parseFloat(avgConfidence.toFixed(1)),
      totalMissionsCompleted: totalMissions
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Your Journey</h2>
        <p className="text-gray-500">มาดูกันว่าคุณเติบโตไปแค่ไหนแล้ว</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="เช็กอินแล้ว" 
          value={stats.totalCheckIns} 
          unit="วัน" 
          icon={<Calendar className="text-blue-500" />} 
          bg="bg-blue-50"
        />
        <StatCard 
          title="ความมั่นใจเฉลี่ย" 
          value={stats.avgConfidence} 
          unit="/ 10" 
          icon={<TrendingUp className="text-green-500" />} 
          bg="bg-green-50"
        />
        <StatCard 
          title="ภารกิจสำเร็จ" 
          value={stats.totalMissionsCompleted} 
          unit="ข้อ" 
          icon={<CheckSquare className="text-purple-500" />} 
          bg="bg-purple-50"
        />
      </div>

      <div className="card text-center">
        <div className="inline-flex h-16 w-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
          <Award size={32} className="text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Badge: ผู้เริ่มต้นที่กล้าหาญ</h3>
        <p className="text-gray-600">
          ขอบคุณที่เริ่มก้าวแรกในการดูแลใจตัวเอง เดินหน้าต่อไปนะ!
        </p>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  bg: string;
}> = ({ title, value, unit, icon, bg }) => (
  <div className="card flex flex-col items-center text-center">
    <div className={`p-3 rounded-xl ${bg} mb-3`}>
      {icon}
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">
      {value}
    </div>
    <div className="text-sm font-medium text-gray-500">
      {title} <span className="text-gray-400 text-xs">({unit})</span>
    </div>
  </div>
);
import React from 'react';

type SiagaLevel = 1 | 2 | 3;

interface StatusSiagaProps {
  level: SiagaLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusMap: Record<SiagaLevel, {
  label: string;
  color: string;
  textColor: string;
  msg: string;
}> = {
  1: {
    label: 'SIAGA 1 (BAHAYA)',
    color: 'bg-red-600',
    textColor: 'text-white',
    msg: 'Bahaya luapan air! Sirine aktif, segera evakuasi mandiri.',
  },
  2: {
    label: 'SIAGA 2 (WASPADA)',
    color: 'bg-yellow-400',
    textColor: 'text-gray-900',
    msg: 'Waspada! Terdeteksi potensi penyumbatan sampah atau kenaikan air signifikan.',
  },
  3: {
    label: 'SIAGA 3 (AMAN)',
    color: 'bg-green-500',
    textColor: 'text-white',
    msg: 'Kondisi aliran air normal dan terpantau bersih.',
  },
};

const sizeStyles = {
  sm: {
    container: 'p-3 rounded-xl',
    title: 'text-base font-bold',
    msg: 'text-xs',
    indicator: 'h-2 w-2',
    ping: 'h-2 w-2',
  },
  md: {
    container: 'p-4 rounded-2xl',
    title: 'text-xl font-black',
    msg: 'text-sm',
    indicator: 'h-3 w-3',
    ping: 'h-3 w-3',
  },
  lg: {
    container: 'p-6 rounded-2xl',
    title: 'text-2xl font-black',
    msg: 'text-base',
    indicator: 'h-3 w-3',
    ping: 'h-3 w-3',
  },
};

const StatusSiaga: React.FC<StatusSiagaProps> = ({ level = 3, size = 'md', className = '' }) => {
  const current = statusMap[level];
  const styles = sizeStyles[size];

  return (
    <div className={`${current.color} ${current.textColor} ${styles.container} shadow-lg transition-all duration-500 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex">
          <span className={`animate-ping absolute inline-flex rounded-full bg-white opacity-75 ${styles.ping}`}></span>
          <span className={`relative inline-flex rounded-full bg-white ${styles.indicator}`}></span>
        </div>
        <h2 className={styles.title}>{current.label}</h2>
      </div>
      <p className={`mt-1 opacity-90 font-medium ${styles.msg}`}>{current.msg}</p>
    </div>
  );
};

export default StatusSiaga;
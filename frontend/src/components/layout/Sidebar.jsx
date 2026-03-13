import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Activity } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const Sidebar = () => {
  const engineStatus = useDashboardStore((state) => state.engineStatus);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Phone Demo', icon: Smartphone, path: '/demo' },
  ];

  const getStatusColor = () => {
    switch (engineStatus.status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="w-[240px] h-[calc(100vh-64px)] bg-[#111827] border-r border-white/10 fixed left-0 top-16 flex flex-col justify-between py-6">
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-600' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 space-y-4">
        <div className="bg-[#1a2035] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Engine Status</span>
          </div>
          <p className="text-sm font-semibold capitalize text-white mb-3">{engineStatus.status}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase text-gray-500 font-bold">
              <span>Throughput</span>
              <span>{engineStatus.rate} tx/min</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: engineStatus.status === 'running' ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase">Total Processed</span>
          </div>
          <p className="text-lg font-mono font-bold text-white tracking-tight">
            {engineStatus.count.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

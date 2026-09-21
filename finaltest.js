import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Activity, 
  Helicopter, 
  Moon, 
  Wind, 
  Syringe, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Stethoscope, 
  LayoutDashboard, 
  List, 
  X, 
  ChevronRight, 
  ChevronDown,
  Save
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ----------------------------------------------------------------------
// Mock Data Generation (Simulating 1000 entries from Google Sheets)
// ----------------------------------------------------------------------
const generateMockData = (count) => {
  const data = [];
  const pilots = ['Smith, J.', 'Davis, M.', 'Wilson, K.', 'Taylor, R.', 'Brown, C.'];
  const crewMembers = ['Doc Adams', 'Doc Baker', 'Para Jones', 'Para Williams'];
  const baseLocations = ['Base Alpha', 'Base Bravo', 'Base Charlie'];
  const missionTypes = ['Primary', 'Interfacility', 'Search & Rescue', 'Training'];
  const outcomes = ['Transported', 'Deceased on Scene', 'Stood Down', 'Treated & Released'];

  const startDate = new Date('2023-01-01');
  
  for (let i = 0; i < count; i++) {
    const missionDate = new Date(startDate.getTime() + Math.random() * (new Date().getTime() - startDate.getTime()));
    const isAfterHours = Math.random() > 0.7;
    const flightDuration = parseFloat((Math.random() * 3 + 0.5).toFixed(1)); // 0.5 to 3.5 hours
    const isNVG = isAfterHours && Math.random() > 0.4;
    const nvgTime = isNVG ? parseFloat((flightDuration * 0.8).toFixed(1)) : 0;
    
    data.push({
      id: `MSN-${2000 + i}`,
      date: missionDate.toISOString().split('T')[0],
      month: missionDate.toLocaleString('default', { month: 'short', year: '2-digit' }),
      time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      type: missionTypes[Math.floor(Math.random() * missionTypes.length)],
      base: baseLocations[Math.floor(Math.random() * baseLocations.length)],
      pilot: pilots[Math.floor(Math.random() * pilots.length)],
      crew: crewMembers[Math.floor(Math.random() * crewMembers.length)],
      flightTime: flightDuration,
      isAfterHours: isAfterHours,
      nvgHours: nvgTime,
      isPHEA: Math.random() > 0.85,
      isWinch: Math.random() > 0.9,
      patientAge: Math.floor(Math.random() * 90) + 1,
      patientSex: Math.random() > 0.5 ? 'M' : 'F',
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      skills: {
        intubation: Math.random() > 0.9,
        chestDecompression: Math.random() > 0.95,
        ioAccess: Math.random() > 0.8,
        bloodTransfusion: Math.random() > 0.92,
        ventilation: Math.random() > 0.85,
        cpr: Math.random() > 0.97
      },
      notes: "Routine transport, no acute changes."
    });
  }
  return data.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const initialData = generateMockData(1000);
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// ----------------------------------------------------------------------
// Main Application Component
// ----------------------------------------------------------------------
const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [missions, setMissions] = useState(initialData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Responsive logic
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ----------------------------------------------------------------------
  // KPI Calculations
  // ----------------------------------------------------------------------
  const filteredMissions = useMemo(() => {
    return missions.filter(m => 
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.pilot.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [missions, searchTerm]);

  const kpis = useMemo(() => {
    const data = activeTab === 'log' ? filteredMissions : missions;
    return {
      totalMissions: data.length,
      totalFlightTime: data.reduce((sum, m) => sum + m.flightTime, 0).toFixed(1),
      totalNVGHours: data.reduce((sum, m) => sum + m.nvgHours, 0).toFixed(1),
      afterHoursCount: data.filter(m => m.isAfterHours).length,
      pheaCases: data.filter(m => m.isPHEA).length,
      winchOps: data.filter(m => m.isWinch).length,
    };
  }, [missions, filteredMissions, activeTab]);

  // ----------------------------------------------------------------------
  // Chart Data Preparation
  // ----------------------------------------------------------------------
  const monthlyData = useMemo(() => {
    const counts = {};
    // Get last 12 months data for cleaner chart
    const recentMissions = missions.slice(0, 300).reverse(); 
    recentMissions.forEach(m => {
      if (!counts[m.month]) {
        counts[m.month] = { month: m.month, missions: 0, flightTime: 0, phea: 0 };
      }
      counts[m.month].missions += 1;
      counts[m.month].flightTime += m.flightTime;
      if(m.isPHEA) counts[m.month].phea += 1;
    });
    return Object.values(counts);
  }, [missions]);

  const pilotData = useMemo(() => {
    const counts = {};
    missions.forEach(m => {
      counts[m.pilot] = (counts[m.pilot] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a,b) => b.value - a.value);
  }, [missions]);

  const typeData = useMemo(() => {
    const counts = {};
    missions.forEach(m => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [missions]);

  const skillsData = useMemo(() => {
    let intubation = 0, chestDecompression = 0, ioAccess = 0, bloodTransfusion = 0, ventilation = 0, cpr = 0;
    missions.forEach(m => {
      if(m.skills.intubation) intubation++;
      if(m.skills.chestDecompression) chestDecompression++;
      if(m.skills.ioAccess) ioAccess++;
      if(m.skills.bloodTransfusion) bloodTransfusion++;
      if(m.skills.ventilation) ventilation++;
      if(m.skills.cpr) cpr++;
    });
    return [
      { name: 'Intubation', count: intubation },
      { name: 'Ventilation', count: ventilation },
      { name: 'IO Access', count: ioAccess },
      { name: 'Blood Transfusion', count: bloodTransfusion },
      { name: 'Chest Decomp', count: chestDecompression },
      { name: 'CPR', count: cpr },
    ].sort((a,b) => b.count - a.count);
  }, [missions]);


  // ----------------------------------------------------------------------
  // Sub-components
  // ----------------------------------------------------------------------
  const KPICard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg flex items-center justify-between transition-transform hover:scale-[1.02]">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
        <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white font-medium shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  // ----------------------------------------------------------------------
  // Tab Content Renders
  // ----------------------------------------------------------------------
  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Missions" value={kpis.totalMissions} icon={Activity} colorClass="bg-blue-500 text-blue-500" />
        <KPICard title="Flight Hours" value={kpis.totalFlightTime} icon={Clock} colorClass="bg-cyan-500 text-cyan-500" />
        <KPICard title="NVG Hours" value={kpis.totalNVGHours} icon={Moon} colorClass="bg-indigo-500 text-indigo-500" />
        <KPICard title="After Hours" value={kpis.afterHoursCount} icon={Moon} colorClass="bg-purple-500 text-purple-500" />
        <KPICard title="PHEA Cases" value={kpis.pheaCases} icon={Syringe} colorClass="bg-rose-500 text-rose-500" />
        <KPICard title="Winch Ops" value={kpis.winchOps} icon={Wind} colorClass="bg-emerald-500 text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Mission Volume Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                <Line type="monotone" dataKey="missions" name="Missions" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="phea" name="PHEA Cases" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Mission Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogbook = () => (
    <div className="space-y-4 flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search missions, pilots..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex gap-2 text-sm text-slate-300 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
            <span className="text-slate-500 mr-2">Showing:</span>
            <span className="font-semibold text-white">{filteredMissions.length}</span>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
            <span className="text-slate-500 mr-2">Flt Hrs:</span>
            <span className="font-semibold text-cyan-400">{kpis.totalFlightTime}</span>
          </div>
           <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
            <span className="text-slate-500 mr-2">PHEA:</span>
            <span className="font-semibold text-rose-400">{kpis.pheaCases}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 flex-grow overflow-hidden flex flex-col shadow-lg">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Mission ID</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Pilot</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Flt Hrs</th>
                <th className="px-4 py-3 font-medium text-center">Tags</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredMissions.slice(0, 50).map((mission) => ( // Render first 50 for performance in this demo
                <tr key={mission.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{mission.date}</td>
                  <td className="px-4 py-3 font-medium text-blue-400">{mission.id}</td>
                  <td className="px-4 py-3">{mission.type}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{mission.pilot}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{mission.flightTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {mission.isAfterHours && <span title="After Hours" className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-xs">AH</span>}
                      {mission.nvgHours > 0 && <span title={`NVG: ${mission.nvgHours}h`} className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-xs">NVG</span>}
                      {mission.isPHEA && <span title="PHEA" className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-xs">PHEA</span>}
                      {mission.isWinch && <span title="Winch" className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-xs">WNCH</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{mission.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMissions.length > 50 && (
            <div className="p-4 text-center text-slate-500 text-sm italic border-t border-slate-700">
              Showing top 50 results of {filteredMissions.length}. Use search to narrow down.
            </div>
          )}
          {filteredMissions.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No missions found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCrewing = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
             <Helicopter className="w-5 h-5 mr-2 text-slate-400" /> Pilot Flight Time Distribution
           </h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pilotData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="value" name="Missions Flown" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {pilotData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
             <Users className="w-5 h-5 mr-2 text-slate-400" /> Recent Crew Combinations
           </h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-300">
               <thead className="text-xs text-slate-400 uppercase border-b border-slate-700">
                 <tr>
                   <th className="pb-3 font-medium">Date</th>
                   <th className="pb-3 font-medium">Pilot</th>
                   <th className="pb-3 font-medium">Medical Crew</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-700/50">
                 {missions.slice(0, 8).map((m, i) => (
                   <tr key={i} className="hover:bg-slate-750">
                     <td className="py-3 pr-4 whitespace-nowrap">{m.date}</td>
                     <td className="py-3 pr-4">{m.pilot}</td>
                     <td className="py-3 pr-4">{m.crew}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2 text-slate-400" /> Clinical Procedures Summary
        </h3>
        <p className="text-slate-400 text-sm mb-6">Total volume of critical interventions performed across all logged missions.</p>
        
        <div className="h-80 w-full max-w-4xl mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" tick={{fill: '#94a3b8'}} interval={0} />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
              <Bar dataKey="count" name="Total Interventions" fill="#10b981" radius={[4, 4, 0, 0]}>
                {skillsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Intubation' ? '#f43f5e' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------------------------
  // Add Entry Modal
  // ----------------------------------------------------------------------
  const AddEntryModal = () => {
    if (!isAddModalOpen) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      // In a real app, this would post to an API or Firebase
      // For now, just close it to simulate success
      setIsAddModalOpen(false);
      // Optional: Add basic toast notification here
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto animate-in slide-in-from-bottom-4">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 sm:p-6 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-500" /> New Encounter Log
            </h2>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Form layout optimized for mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Date</label>
                <input type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Mission Type</label>
                <select className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Primary</option>
                  <option>Interfacility</option>
                  <option>Search & Rescue</option>
                  <option>Training</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Flight Time (hrs)</label>
                <input type="number" step="0.1" min="0" placeholder="0.0" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">NVG Time (hrs)</label>
                <input type="number" step="0.1" min="0" placeholder="0.0" className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">After Hours</span>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Interventions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['PHEA', 'Winch Operation', 'Intubation', 'Chest Decompression', 'Blood Transfusion'].map(skill => (
                  <label key={skill} className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-500 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800" />
                    <span className="text-sm text-slate-300">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-1 border-t border-slate-700 pt-4">
               <label className="text-sm font-medium text-slate-300">Clinical Notes</label>
               <textarea rows="3" placeholder="Brief encounter summary..." className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-2" /> Save Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------------
  // Main Layout Render
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row selection:bg-blue-500/30">
      
      {/* Mobile Header & Hamburger */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center text-white font-bold text-lg">
          <Activity className="w-6 h-6 mr-2 text-blue-500" /> CCT-Logbook
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full
      `}>
        <div className="p-6 hidden md:flex items-center text-white font-bold text-xl tracking-tight border-b border-slate-800">
          <Activity className="w-7 h-7 mr-3 text-blue-500" />
          CCT-Logbook
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem id="overview" icon={LayoutDashboard} label="Overview & Telemetry" />
          <NavItem id="log" icon={List} label="Mission Encounter Log" />
          <NavItem id="crewing" icon={Users} label="Pilot & Crewing Data" />
          <NavItem id="skills" icon={Stethoscope} label="Clinical Skills" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => {
              setIsAddModalOpen(true);
              if(isMobile) setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Quick Add Entry
          </button>
          <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Syncing to G-Sheet
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center hidden md:flex">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{
              activeTab === 'log' ? 'Mission Encounter Log' : 
              activeTab === 'crewing' ? 'Pilot & Crewing Data' :
              activeTab === 'skills' ? 'Clinical & Operational Skills' : 
              'Overview & Telemetry'
            }</h1>
            <p className="text-sm text-slate-400 mt-1">Total database capacity mapped: ~1000 records</p>
          </div>
          <div className="flex items-center bg-slate-800 rounded-full px-4 py-1.5 border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3 font-bold text-sm text-slate-300">
              FP
            </div>
            <span className="text-sm font-medium mr-2">Flight Paramedic</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'log' && renderLogbook()}
            {activeTab === 'crewing' && renderCrewing()}
            {activeTab === 'skills' && renderSkills()}
          </div>
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Modals */}
      <AddEntryModal />

    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);

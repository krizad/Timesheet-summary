import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Clock, Calendar, Briefcase, Activity, Filter, Check } from 'lucide-react';
import type { TimesheetSummary } from '../types';
import { calculateTimesheetSummary } from '../utils/excelParser';

interface DashboardProps {
  data: TimesheetSummary;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-200 font-mono text-sm font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs font-mono" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // State for filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);

  // Extract unique months from raw data
  const availableMonths = useMemo(() => {
    if (!data.rawRows) return [];
    const months = new Set<string>();
    data.rawRows.forEach(row => {
      if (row.Date) {
        // Assuming Date is "DD/MM/YYYY" or similar, but let's try to parse it safely
        // Actually the excel parser might return it as a string. 
        // Let's assume standard format or try to regex it.
        // If it's DD/MM/YYYY
        const parts = row.Date.split('/');
        if (parts.length === 3) {
          months.add(`${parts[2]}-${parts[1]}`); // YYYY-MM
        } else {
          // Fallback or other formats
          months.add(row.Date.substring(0, 7));
        }
      }
    });
    return Array.from(months).sort().reverse(); // Newest first
  }, [data.rawRows]);

  // Recalculate summary based on selected months
  const currentData = useMemo(() => {
    if (!data.rawRows || selectedMonths.length === 0) {
      return data;
    }
    
    const filteredRows = data.rawRows.filter(row => {
      if (!row.Date) return false;
      let monthStr = '';
      const parts = row.Date.split('/');
      if (parts.length === 3) {
        monthStr = `${parts[2]}-${parts[1]}`;
      } else {
        monthStr = row.Date.substring(0, 7);
      }
      return selectedMonths.includes(monthStr);
    });

    return calculateTimesheetSummary(filteredRows);
  }, [data, selectedMonths]);

  const { projects, totalWorkingDays } = currentData;

  // Initialize project filters when projects list changes (due to month filter or initial load)
  useEffect(() => {
    if (projects.length > 0) {
      // If we just switched months, we might want to keep selected projects if they still exist,
      // or select all. For simplicity, let's select all available projects in the new view.
      // Or better: intersect previous selection with new projects.
      setSelectedProjects(prev => {
        const newProjectNames = projects.map(p => p.projectName);
        if (prev.length === 0) return newProjectNames;
        
        // Keep existing selections if they are in the new list
        const intersection = prev.filter(p => newProjectNames.includes(p));
        // If intersection is empty (e.g. projects completely changed), select all new ones
        return intersection.length > 0 ? intersection : newProjectNames;
      });
    }
  }, [projects]);

  // Initialize month filters on load
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths(availableMonths);
    }
  }, [availableMonths]);

  const toggleProject = (projectName: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectName)
        ? prev.filter(p => p !== projectName)
        : [...prev, projectName]
    );
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const selectAllProjects = () => setSelectedProjects(projects.map(p => p.projectName));
  const clearAllProjects = () => setSelectedProjects([]);
  
  const selectAllMonths = () => setSelectedMonths(availableMonths);
  const clearAllMonths = () => setSelectedMonths([]);

  // Filter data by project
  const filteredProjects = projects.filter(p => selectedProjects.includes(p.projectName));

  const totalManhours = filteredProjects.reduce((sum, p) => sum + p.totalManhours, 0);
  const totalMandays = filteredProjects.reduce((sum, p) => sum + p.totalMandays, 0);
  const avgHoursPerDay = totalWorkingDays > 0 ? totalManhours / totalWorkingDays : 0;

  // Prepare data for Project Chart
  const projectData = filteredProjects.map(p => ({
    name: p.projectName,
    hours: p.totalManhours,
    days: p.totalMandays
  })).sort((a, b) => b.hours - a.hours);

  // Prepare data for Task Chart (Top 10 Tasks)
  const allTasks = filteredProjects.flatMap(p => p.tasks.map(t => ({
    name: t.taskName,
    hours: t.manhours,
    project: p.projectName
  })));
  
  const taskData = allTasks
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8 animate-fade-in">
      
      {/* Filters Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Month Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              FILTER_MONTHS ({selectedMonths.length}/{availableMonths.length})
            </h3>
            <button 
              onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
              className="text-xs text-purple-500 hover:text-purple-400 font-mono underline"
            >
              {isMonthFilterOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
            </button>
          </div>
          
          {isMonthFilterOpen && (
            <div className="animate-fade-in space-y-4">
              <div className="flex gap-2 mb-2">
                <button onClick={selectAllMonths} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700">All</button>
                <button onClick={clearAllMonths} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700">None</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/50 rounded border border-slate-800">
                {availableMonths.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMonth(m)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      selectedMonths.includes(m)
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {selectedMonths.includes(m) && <Check className="w-3 h-3" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono text-slate-400 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-500" />
              FILTER_PROJECTS ({selectedProjects.length}/{projects.length})
            </h3>
            <button 
              onClick={() => setIsProjectFilterOpen(!isProjectFilterOpen)}
              className="text-xs text-emerald-500 hover:text-emerald-400 font-mono underline"
            >
              {isProjectFilterOpen ? 'COLLAPSE [-]' : 'EXPAND [+]'}
            </button>
          </div>
          
          {isProjectFilterOpen && (
            <div className="animate-fade-in space-y-4">
              <div className="flex gap-2 mb-2">
                <button onClick={selectAllProjects} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700">All</button>
                <button onClick={clearAllProjects} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700">None</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/50 rounded border border-slate-800">
                {projects.map(p => (
                  <button
                    key={p.projectName}
                    onClick={() => toggleProject(p.projectName)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      selectedProjects.includes(p.projectName)
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {selectedProjects.includes(p.projectName) && <Check className="w-3 h-3" />}
                    {p.projectName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Total Hours</p>
          <h3 className="text-3xl font-bold text-slate-100 font-mono mt-1">{totalManhours.toFixed(2)}</h3>
          <p className="text-emerald-500 text-xs mt-2 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3" /> Recorded time
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Total Mandays</p>
          <h3 className="text-3xl font-bold text-slate-100 font-mono mt-1">{totalMandays.toFixed(2)}</h3>
          <p className="text-blue-500 text-xs mt-2 font-mono">Calculated effort</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Working Days</p>
          <h3 className="text-3xl font-bold text-slate-100 font-mono mt-1">{totalWorkingDays}</h3>
          <p className="text-purple-500 text-xs mt-2 font-mono">Unique active days (Global)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Avg Hours/Day</p>
          <h3 className="text-3xl font-bold text-slate-100 font-mono mt-1">{avgHoursPerDay.toFixed(1)}</h3>
          <p className="text-amber-500 text-xs mt-2 font-mono">Based on global days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Project Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-mono text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Project Distribution (Hours)
          </h3>
          <div style={{ height: `${Math.max(400, projectData.length * 50)}px` }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-mono text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Top Tasks Breakdown
          </h3>
          <div className="h-[300px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="hours"
                >
                  {taskData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

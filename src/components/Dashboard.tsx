import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Clock, Calendar, Briefcase, Activity, Filter, Check, Download } from 'lucide-react';
import type { TimesheetSummary } from '../types';
import { calculateTimesheetSummary } from '../utils/excelParser';
import { downloadAsImage } from '../utils/exportUtils';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  data: TimesheetSummary;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

interface PayloadItem {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-800 dark:text-slate-200 font-mono text-sm font-bold mb-1">{label}</p>
        {payload.map((entry: PayloadItem, index: number) => (
          <p key={index} className="text-xs font-mono font-semibold" style={{ color: entry.color }}>
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
  const [viewMode, setViewMode] = useState<'hours' | 'days'>('hours');

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

  // Initialize project filters
  useEffect(() => {
    if (projects.length > 0) {
       setSelectedProjects(prev => {
         // Only select all if we have no selection and there are projects to select
         // Checking condition inside setter prevents unnecessary re-renders if state hasn't changed
         return prev.length === 0 ? projects.map(p => p.projectName) : prev;
       });
    }
  }, [projects]);


  // Initialize month filters
  useEffect(() => {
    if (availableMonths.length > 0) {
       setSelectedMonths(prev => {
          if (prev.length === 0) return availableMonths;
          return prev;
       });
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


  const { theme } = useTheme();

  return (
    <div id="dashboard-view" className="w-full max-w-6xl mx-auto mt-8 space-y-8 animate-fade-in pb-8">
      
      <div className="flex justify-end">
        <button
          onClick={() => downloadAsImage('dashboard-view', 'dashboard-export')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-500 hover:border-emerald-500/50 transition-colors shadow-sm text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Export Dashboard
        </button>
      </div>

      {/* Filters Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Month Filter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
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
                <button onClick={selectAllMonths} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">All</button>
                <button onClick={clearAllMonths} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">None</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800">
                {availableMonths.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMonth(m)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      selectedMonths.includes(m)
                        ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/50 text-purple-600 dark:text-purple-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
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
                <button onClick={selectAllProjects} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">All</button>
                <button onClick={clearAllProjects} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">None</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-200 dark:border-slate-800">
                {projects.map(p => (
                  <button
                    key={p.projectName}
                    onClick={() => toggleProject(p.projectName)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                      selectedProjects.includes(p.projectName)
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">Total Hours</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">{totalManhours.toFixed(2)}</h3>
          <p className="text-emerald-500 text-xs mt-2 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3" /> Recorded time
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">Total Mandays</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">{totalMandays.toFixed(2)}</h3>
          <p className="text-blue-500 text-xs mt-2 font-mono">Calculated effort</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-16 h-16 text-purple-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">Working Days</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">{totalWorkingDays}</h3>
          <p className="text-purple-500 text-xs mt-2 font-mono">Unique active days (Global)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">Avg Hours/Day</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">{avgHoursPerDay.toFixed(1)}</h3>
          <p className="text-amber-500 text-xs mt-2 font-mono">Based on global days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Project Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-mono text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${viewMode === 'hours' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
              Project Distribution ({viewMode === 'hours' ? 'Hours' : 'Days'})
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('hours')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  viewMode === 'hours' 
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setViewMode('days')}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  viewMode === 'days' 
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Days
              </button>
            </div>
          </div>
          <div style={{ height: `${Math.max(400, projectData.length * 50)}px` }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fill: theme === 'dark' ? '#64748b' : '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} tick={{ fill: theme === 'dark' ? '#64748b' : '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={viewMode} 
                  fill={viewMode === 'hours' ? '#10b981' : '#3b82f6'} 
                  radius={[0, 4, 4, 0]} 
                  barSize={24} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-mono text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
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
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

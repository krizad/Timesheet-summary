import React from 'react';
import type { ProjectSummary } from '../types';
// Removed Terminal, Cpu, Clock as they are no longer used in the new JSX

import { Download } from 'lucide-react';
import { exportToExcel } from '../utils/excelParser';

interface SummaryTableProps {
  data: ProjectSummary[];
  totalWorkingDays: number;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({ data, totalWorkingDays }) => {
  if (data.length === 0) return null;

  const grandTotalManhours = data.reduce((sum, project) => sum + project.totalManhours, 0);
  const grandTotalMandays = data.reduce((sum, project) => sum + project.totalMandays, 0);

  const handleExport = () => {
    exportToExcel({ projects: data, totalWorkingDays }, 'timesheet_summary.xlsx');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-mono text-emerald-400 flex items-center gap-2">
              <span className="text-slate-600">$</span> SUMMARY_REPORT
            </h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1 text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              EXPORT.XLSX
            </button>
          </div>
          <div className="flex gap-6 text-sm font-mono">
            <div className="text-slate-400">
              WORKING_DAYS: <span className="text-emerald-400 ml-1">{totalWorkingDays}</span>
            </div>
            <div className="text-slate-400">
              TOTAL_HOURS: <span className="text-emerald-400 ml-1">{grandTotalManhours.toFixed(2)}</span>
            </div>
            <div className="text-slate-400">
              TOTAL_MANDAYS: <span className="text-emerald-400 ml-1">{grandTotalMandays.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-500 text-xs uppercase font-mono tracking-wider border-b border-slate-800">
                <th className="px-6 py-3 font-medium">Project / Task</th>
                <th className="px-6 py-3 font-medium text-right">Manhours</th>
                <th className="px-6 py-3 font-medium text-right">Mandays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-sm">
              {data.map((project) => (
                <React.Fragment key={project.projectName}>
                  <tr className="bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-200">
                      {project.projectName}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-300 font-medium">
                      {project.totalManhours.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right text-emerald-400 font-medium">
                      {project.totalMandays.toFixed(2)}
                    </td>
                  </tr>
                  {project.tasks.map((task) => (
                    <tr key={`${project.projectName}-${task.taskName}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-2 pl-10 text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        {task.taskName}
                      </td>
                      <td className="px-6 py-2 text-right text-slate-500">
                        {task.manhours.toFixed(2)}
                      </td>
                      <td className="px-6 py-2 text-right text-slate-500">
                        {task.mandays.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-2 text-center text-slate-500 text-xs">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        System Ready
      </div>
    </div>
  );

};

export default SummaryTable;

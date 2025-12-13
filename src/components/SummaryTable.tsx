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

  const sortedData = [...data].sort((a, b) => b.totalMandays - a.totalMandays);

  const grandTotalManhours = data.reduce((sum, project) => sum + project.totalManhours, 0);
  const grandTotalMandays = data.reduce((sum, project) => sum + project.totalMandays, 0);

  const handleExport = () => {
    exportToExcel({ projects: data, totalWorkingDays }, 'timesheet_summary.xlsx');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-mono text-emerald-400 flex items-center gap-2">
              <span className="text-slate-600">$</span> SUMMARY_REPORT
            </h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3 h-3" />
              EXPORT.XLSX
            </button>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-mono">Found {data.length} projects</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 dark:text-slate-400">Total Working Days</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalWorkingDays} days</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-mono">
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800">Project Name</th>
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800 text-right">Start Date</th>
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800 text-right">End Date</th>
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800 text-right">Total Hours</th>
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800 text-right">Mandays</th>
                <th className="p-4 font-medium border-b border-slate-200 dark:border-slate-800 text-center">Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {sortedData.map((project) => (
                <React.Fragment key={project.projectName}>
                  <tr 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {project.projectName}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400 text-sm">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400 text-sm">
                      {formatDate(project.endDate)}
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {project.totalManhours.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                      {project.totalMandays.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {project.tasks.length}
                      </span>
                    </td>
                  </tr>
                  {/* Task Sub-rows */}
                  {project.tasks.map((task, idx) => (
                    <tr key={`${project.projectName}-task-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-2 py-2 pl-12 border-l-4 border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                         <div className="text-sm text-slate-600 dark:text-slate-400 font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            {task.taskName}
                         </div>
                      </td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2 text-right font-mono text-sm text-slate-500 dark:text-slate-500">
                         {task.manhours.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-mono text-sm text-slate-500 dark:text-slate-500">
                         {task.mandays.toFixed(2)}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-900/80 font-mono text-sm">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">TOTAL</td>
                <td colSpan={2}></td>
                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-700">
                  {grandTotalManhours.toFixed(2)}
                </td>
                <td className="p-4 text-right font-bold text-blue-600 dark:text-blue-400 border-t border-slate-200 dark:border-slate-700">
                  {grandTotalMandays.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

};

export default SummaryTable;


import type { ProjectSummary } from '../types';
import { useMemo } from 'react';
import { Calendar, Download } from 'lucide-react';
import { downloadAsImage } from '../utils/exportUtils';

interface TimelineViewProps {
  data: ProjectSummary[];
}

export const TimelineView = ({ data }: TimelineViewProps) => {
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = new Date(8640000000000000);
    let max = new Date(-8640000000000000);
    let hasDates = false;

    data.forEach(p => {
      if (p.startDate) {
        const start = new Date(p.startDate);
        if (start < min) min = start;
        hasDates = true;
      }
      if (p.endDate) {
        const end = new Date(p.endDate);
        if (end > max) max = end;
        hasDates = true;
      }
    });

    if (!hasDates) {
      return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    }

    // Add some padding
    min = new Date(min.setDate(min.getDate() - 2));
    max = new Date(max.setDate(max.getDate() + 2));

    const diffTime = Math.abs(max.getTime() - min.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { minDate: min, maxDate: max, totalDays };
  }, [data]);

  const getPosition = (dateStr: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const diff = date.getTime() - minDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return (days / totalDays) * 100;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  return (
    <div id="timeline-view" className="space-y-6 pb-8">
      <div className="flex justify-end">
        <button
          onClick={() => downloadAsImage('timeline-view', 'timeline-export')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-500 hover:border-emerald-500/50 transition-colors shadow-sm text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Export Timeline
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Project Timeline
        </h2>
        
        <div className="relative space-y-8">
          {/* Grid lines (optional, simplified for now) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-full w-px bg-slate-200 dark:bg-slate-700"></div>
            ))}
          </div>

          <div className="space-y-4">
            {data.map((project) => {
              // const left = getPosition(project.startDate);
              // const right = getPosition(project.endDate);

              if (!project.startDate || !project.endDate) return null;

              return (
                <div key={project.projectName} className="relative">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 w-1/3 truncate" title={project.projectName}>
                      {project.projectName}
                    </span>
                    <div className="flex gap-2 font-mono">
                      <span>{formatDate(project.startDate)}</span>
                      <span>-</span>
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                  </div>
                  
                  <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative w-full">
                    {(project.dateRanges || [{ start: project.startDate, end: project.endDate }]).map((range, idx) => {
                      const rangeLeft = getPosition(range.start);
                      const rangeRight = getPosition(range.end);
                      const rangeWidth = Math.max(rangeRight - rangeLeft, 0.5);
                      
                      return (
                        <div 
                          key={idx}
                          className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400 rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-help border-r-2 border-white dark:border-slate-900 last:border-r-0"
                          style={{ 
                            left: `${rangeLeft}%`, 
                            width: `${rangeWidth}%` 
                          }}
                          title={`${project.projectName}: ${formatDate(range.start)} - ${formatDate(range.end)}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          

          {/* Axis Labels */}
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-mono pt-4 border-t border-slate-200 dark:border-slate-800 mt-8">
             <span>{formatDate(minDate.toISOString())}</span>
             <span>{formatDate(maxDate.toISOString())}</span>
          </div>


          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800/50 text-xs text-slate-500 italic">
            <span className="font-semibold text-slate-700 dark:text-slate-400">Note:</span> This report is generated automatically from the uploaded data. Manhours and Mandays are calculated estimates. Timeline visualization groups continuous work periods; gaps larger than 30 days are displayed as breaks.
          </div>
        </div>
      </div>
    </div>
  );
};

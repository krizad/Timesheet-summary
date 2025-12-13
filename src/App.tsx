import { useState } from 'react';
import FileUpload from './components/FileUpload';
import { SummaryTable } from './components/SummaryTable';
import { Dashboard } from './components/Dashboard';
import { TimelineView } from './components/TimelineView';
import { Footer } from './components/Footer';
import { parseExcel } from './utils/excelParser';
import type { TimesheetSummary } from './types';
import { Terminal, LayoutDashboard, Table as TableIcon, Calendar, Sun, Moon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTheme } from './context/ThemeContext';

function App() {
  const [summaryData, setSummaryData] = useState<TimesheetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'dashboard' | 'timeline'>('table');
  const { theme, toggleTheme } = useTheme();

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcel(file);
      setSummaryData(data);
      setActiveTab('dashboard'); // Auto-switch to dashboard on success
    } catch (err) {
      setError('Failed to parse Excel file. Please ensure it matches the expected format.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-mono selection:bg-emerald-500/30 transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 flex flex-col items-center gap-8 relative">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500 transition-colors shadow-sm"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-4">
            <Terminal className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="text-emerald-500">~/</span>Timesheet_Summary
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            &gt; Upload .xlsx file to process manhours and mandays
          </p>
        </div>

        {/* Upload Section (Hidden if data loaded? No, kept for re-upload) */}
        <div className="w-full max-w-xl">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-3 text-emerald-500">
              <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
              <span>Processing data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center gap-3">
            <span className="text-red-500 font-bold">ERROR:</span> {error}
          </div>
        )}

        {/* Content Area */}
        {summaryData && (
          <div className="w-full max-w-6xl space-y-6">
            
            {/* Tabs */}
            <div className="flex justify-center">
              <div className="bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 inline-flex shadow-sm">
                <button
                  onClick={() => setActiveTab('table')}
                  className={twMerge(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'table' 
                      ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <TableIcon className="w-4 h-4" />
                  DATA_TABLE
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={twMerge(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'dashboard' 
                      ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  DASHBOARD
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={twMerge(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'timeline' 
                      ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  TIMELINE
                </button>
              </div>
            </div>

            {/* View Content */}
            <div className="min-h-[400px]">
              {activeTab === 'table' ? (
                <SummaryTable 
                  data={summaryData.projects} 
                  totalWorkingDays={summaryData.totalWorkingDays} 
                />
              ) : activeTab === 'dashboard' ? (
                <Dashboard data={summaryData} />
              ) : (
                <TimelineView data={summaryData.projects} />
              )}
            </div>
          </div>
        )}
        {/* Footer */}
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;

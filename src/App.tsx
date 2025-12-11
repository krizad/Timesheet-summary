import { useState } from 'react';
import FileUpload from './components/FileUpload';
import { SummaryTable } from './components/SummaryTable';
import { Dashboard } from './components/Dashboard';
import { parseExcel } from './utils/excelParser';
import type { TimesheetSummary } from './types';
import { Terminal, LayoutDashboard, Table as TableIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

function App() {
  const [summaryData, setSummaryData] = useState<TimesheetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'dashboard'>('table');

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-emerald-500/30">
      <div className="container mx-auto px-4 py-12 flex flex-col items-center gap-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl mb-4">
            <Terminal className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
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
              <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 inline-flex">
                <button
                  onClick={() => setActiveTab('table')}
                  className={twMerge(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'table' 
                      ? "bg-slate-800 text-emerald-400 shadow-sm" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
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
                      ? "bg-slate-800 text-emerald-400 shadow-sm" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  DASHBOARD
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
              ) : (
                <Dashboard data={summaryData} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

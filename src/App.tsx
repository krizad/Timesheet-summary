import { useState } from 'react';
import FileUpload from './components/FileUpload';
import { SummaryTable } from './components/SummaryTable';
import { parseExcel } from './utils/excelParser';
import type { TimesheetSummary } from './types';
import { Terminal } from 'lucide-react';

function App() {
  const [summaryData, setSummaryData] = useState<TimesheetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcel(file);
      setSummaryData(data);
    } catch (err) {
      setError('Failed to parse Excel file. Please ensure it matches the expected format.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-emerald-500/30">
      <div className="container mx-auto px-4 py-12 flex flex-col items-center gap-12">
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

        {summaryData && (
          <SummaryTable 
            data={summaryData.projects} 
            totalWorkingDays={summaryData.totalWorkingDays} 
          />
        )}
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { Github } from 'lucide-react';

export function Footer() {
  const [step, setStep] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 0) {
      window.open('https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1', '_blank');
      setStep(1);
    } else {
      window.open('https://youtu.be/kdOTSZX_8iM?list=PLB9-Z0LQmoAf6nbCvDZyLX-QvX2Xo-Jau&t=8', '_blank');
      setStep(0); // Reset after opening
    }
  };

  return (
    <footer className="w-full max-w-6xl mt-auto pt-12 pb-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
      <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-center md:text-left">
        <span>&copy; {new Date().getFullYear()} Timesheet Summary.</span>
        <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
        <span>All rights reserved.</span>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={handleClick}
          className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer border-none"
        >
          {step === 0 ? "You will love this too" : "Just kidding I mean this"}
        </button>

        <span className="flex items-center gap-2">
          Created by <span className="font-semibold text-slate-700 dark:text-slate-200">KriZad</span>
        </span>
        <a 
          href="https://github.com/krizad/Timesheet-summary" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="View on GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </footer>
  );
}

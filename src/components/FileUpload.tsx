import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setFileName(file.name);
      onFileUpload(file);
    } else {
      alert("Please upload a valid Excel file (.xlsx or .xls)");
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div 
      className={`relative w-full max-w-xl mx-auto p-8 border border-dashed rounded transition-all duration-300 ease-in-out cursor-pointer group ${
        dragActive 
          ? "border-green-500 bg-green-500/5" 
          : "border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".xlsx, .xls"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center justify-center text-center space-y-4 font-mono">
        {fileName ? (
          <>
            <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
              <FileSpreadsheet className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded border border-slate-700">
              <span className="text-slate-300 text-sm">{fileName}</span>
              <button 
                onClick={clearFile}
                disabled={isLoading}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500">File loaded successfully</p>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-full transition-colors ${dragActive ? "bg-green-500/10" : "bg-slate-800"}`}>
              {isLoading ? (
                <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
              ) : (
                <Upload className={`w-8 h-8 ${dragActive ? "text-green-500" : "text-slate-400 group-hover:text-slate-300"}`} />
              )}
            </div>
            <div>
              <p className="text-slate-300 text-sm">
                <span className="text-green-500">$</span> {isLoading ? 'processing...' : 'upload_file'} <span className="animate-pulse">_</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Drag & drop or click to select .xlsx
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;

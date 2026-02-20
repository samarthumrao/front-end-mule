import { useRef, useState, useCallback } from 'react';
import { Upload, FolderOpen } from 'lucide-react';

export default function UploadArea({ onFileSelect }) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFile = useCallback((file) => {
        if (file && file.name.endsWith('.csv')) {
            setSelectedFile(file);
            onFileSelect?.(file);
        }
    }, [onFileSelect]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`bg-white rounded-2xl border-2 border-dashed transition-all duration-300 p-10 flex flex-col items-center justify-center cursor-pointer group ${isDragging
                    ? 'border-primary bg-primary-light/30 scale-[1.01]'
                    : selectedFile
                        ? 'border-success/50 bg-green-50/30'
                        : 'border-gray-200 hover:border-primary/40 hover:bg-blue-50/20'
                }`}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
            />

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all ${selectedFile ? 'bg-green-100' : 'bg-blue-50 group-hover:bg-blue-100'
                }`}>
                <Upload className={`w-7 h-7 transition-colors ${selectedFile ? 'text-success' : 'text-primary'
                    }`} />
            </div>

            {/* Text */}
            {selectedFile ? (
                <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedFile.name}</h3>
                    <p className="text-sm text-success font-medium">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Ready to analyze
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Transaction CSV</h3>
                    <p className="text-sm text-gray-500 mb-1">Drag & drop your file here or click to browse.</p>
                    <p className="text-sm text-gray-400">
                        Supported format:{' '}
                        <span className="px-1.5 py-0.5 bg-blue-50 text-primary text-xs font-semibold rounded border border-blue-200">
                            .csv
                        </span>{' '}
                        (max 500MB)
                    </p>
                </>
            )}

            {/* Browse Button */}
            {!selectedFile && (
                <button
                    className="mt-5 px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                    }}
                >
                    <FolderOpen className="w-4 h-4" />
                    Browse Files
                </button>
            )}
        </div>
    );
}

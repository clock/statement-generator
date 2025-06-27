import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-6 md:p-8 border-2 border-dashed cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
        {isDragActive ? (
          <>
            <FileSpreadsheet className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            <p className="text-base md:text-lg font-medium">Drop your file here</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-base md:text-lg font-medium">Drop your CSV or Excel file here</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-gray-400">Supports CSV, XLS, and XLSX files</p>
          </>
        )}
      </div>
    </Card>
  );
}
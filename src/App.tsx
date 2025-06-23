import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { StatementDisplay } from '@/components/StatementDisplay';
import { processCSV } from '@/lib/csv-processor';
import { StatementData } from '@/types/types';
import { Card } from '@/components/ui/card';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';

function App() {
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const data = await processCSV(file);
      setStatementData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStatementData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8 md:w-12 md:h-12 text-primary mr-2 md:mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold">Noodoe Statement Generator</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            Convert your Noodoe CSV charging data into professional statements
          </p>
        </div>

        {/* Main Content */}
        {!statementData ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileUpload={handleFileUpload} />
            
            {isProcessing && (
              <Card className="mt-4 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2 md:mr-3"></div>
                  <p className="text-sm md:text-base">Processing your file...</p>
                </div>
              </Card>
            )}
            
            {error && (
              <Card className="mt-4 p-3 md:p-4 border-red-200 bg-red-50">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm md:text-base">Error processing file</p>
                    <p className="text-xs md:text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Instructions */}
            <Card className="mt-6 md:mt-8 p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold mb-3">How to use:</h2>
              <ol className="space-y-2 text-xs md:text-sm text-gray-600">
                <li>1. Export your charging session data from Noodoe as a CSV or Excel file</li>
                <li>2. Drag and drop the file above (or click to browse)</li>
                <li>3. The tool will automatically generate a formatted statement</li>
                <li>4. Download as PDF or print the statement for your records</li>
              </ol>
              
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-md">
                  <p className="text-xs md:text-sm text-amber-800">
                    <strong>Note:</strong> User IDs from Noodoe are encoded. The statement will display
                    these encoded IDs unless they contain recognizable email addresses or RFID numbers.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center print:hidden">
              <button
                onClick={handleReset}
                className="text-xs md:text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Upload a different file
              </button>
            </div>
            <StatementDisplay data={statementData} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
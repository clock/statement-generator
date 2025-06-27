import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { StatementDisplay } from '@/components/StatementDisplay';
import { processCSV } from '@/lib/csv-processor';
import { StatementData } from '@/types/types';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

function App() {
  const [statement_data, set_statement_data] = useState<StatementData | null>(null);
  const [is_processing, set_is_processing] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  const handle_file_upload = async (file: File) => {
    set_is_processing(true);
    set_error(null);
    
    try {
      const data = await processCSV(file);
      set_statement_data(data);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      set_is_processing(false);
    }
  };

  const handle_reset = () => {
    set_statement_data(null);
    set_error(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        {/* header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500">noodoe</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            Statement Generator - Convert CSV/Excel charging data into professional statements
          </p>
        </div>

        {/* main content */}
        {!statement_data ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileUpload={handle_file_upload} />
            
            {is_processing && (
              <Card className="mt-4 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2 md:mr-3"></div>
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
            
            {/* instructions */}
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
                    <strong>Note:</strong> The statement will display driver information as provided in the CSV file.
                    This may include encoded IDs, email addresses, or RFID numbers.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center print:hidden">
              <button
                onClick={handle_reset}
                className="text-xs md:text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Upload a different file
              </button>
            </div>
            <StatementDisplay data={statement_data} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
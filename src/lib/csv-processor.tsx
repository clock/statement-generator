import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ChargingSession, StatementTotals, StatementData } from '@/types/types';

export function parseDriverInfo(driver_info: string): { email?: string; rfid?: string } {
  const rfid_match = driver_info.match(/RFID:\s*(\d+)/);
  if (rfid_match) 
    return { rfid: rfid_match[1] };
  
  const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email_pattern.test(driver_info))
    return { email: driver_info };
  
  return {};
}

async function parse_excel_file(file: File): Promise<ChargingSession[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        const sheet_name = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheet_name];
        
        // get raw data to handle date conversions properly
        const json_data = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        const sessions = json_data.map((row: any) => {
          const session: any = { ...row };
          
          // handle numeric fields
          const numeric_fields = [
            'Session Duration (Min)',
            'Charging Duration (Min)', 
            'Energy Delivered (kWh)',
            'Charging Fee',
            'Total Tax Owed',
            'My Revenue',
            'Subtotal',
            'Payment Total',
            'EV OS Fee Total'
          ];
          
          numeric_fields.forEach(field => {
            if (session[field] !== undefined && session[field] !== '-' && session[field] !== '') {
              const value = parseFloat(session[field]);
              session[field] = isNaN(value) ? 0 : value;
            } else {
              session[field] = 0;
            }
          });
          
          // ensure session id exists
          if (!session['Session ID'])
            session['Session ID'] = '-';
          
          return session as ChargingSession;
        });
        
        resolve(sessions);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

function generate_report_number(start_date: string): string {
  const date = new Date(start_date);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `USER-${year}${month}FTC`;
}

function process_sessions_data(sessions: ChargingSession[]): StatementData {
  // filter sessions with valid data
  const valid_sessions = sessions.filter(s => 
    s['Session ID'] && 
    s['Session ID'] !== '-'
  );
  
  // sort sessions by date
  valid_sessions.sort((a, b) => {
    const date_a = new Date(a['Session Date']).getTime();
    const date_b = new Date(b['Session Date']).getTime();
    return date_a - date_b;
  });
  
  // calculate totals
  const totals: StatementTotals = {
    sessions: valid_sessions.length,
    pluggedTime: 0,
    chargingTime: 0,
    energy: 0,
    preTaxRevenue: 0,
    tax: 0,
    totalCollected: 0,
    transactionFee: 0,
    hstOnFee: 0,
    totalFees: 0,
    netPayout: 0
  };
  
  // sum up all values from actual session data
  valid_sessions.forEach(session => {
    totals.pluggedTime += session['Session Duration (Min)'] || 0;
    totals.chargingTime += session['Charging Duration (Min)'] || 0;
    totals.energy += session['Energy Delivered (kWh)'] || 0;
    totals.preTaxRevenue += session['Charging Fee'] || 0;
    totals.tax += session['Total Tax Owed'] || 0;
    totals.totalCollected += session['Payment Total'] || 0;
    // sum actual evos fees from each session instead of calculating percentage
    totals.transactionFee += session['EV OS Fee Total'] || 0;
  });
  
  // no hst on evos fees based on pdf examples
  totals.hstOnFee = 0;
  totals.totalFees = totals.transactionFee; // just the evos fees
  totals.netPayout = totals.totalCollected - totals.totalFees;
  
  // get date range
  const dates = valid_sessions
    .map(s => s['Session Date'])
    .filter(Boolean)
    .map(d => new Date(d));
  
  const start_date = dates.length > 0 
    ? dates.reduce((min, d) => d < min ? d : min)
    : new Date();
  const end_date = dates.length > 0 
    ? dates.reduce((max, d) => d > max ? d : max)
    : new Date();
  
  // format dates as yyyy-mm-dd
  const start_date_str = start_date.toISOString().split('T')[0];
  const end_date_str = end_date.toISOString().split('T')[0];
  
  // get site info
  const site = valid_sessions[0]?.CPO || 'Blue Stone Properties - Hyde Park Village Apartments';
  
  const statement_data: StatementData = {
    companyName: site,
    reportNumber: generate_report_number(start_date_str),
    startDate: start_date_str,
    endDate: end_date_str,
    users: [], // not used in new format but keeping for compatibility
    sessions: valid_sessions,
    totals
  };
  
  return statement_data;
}

export async function processCSV(file: File): Promise<StatementData> {
  const file_type = file.name.toLowerCase();
  
  if (file_type.endsWith('.xlsx') || file_type.endsWith('.xls')) {
    const sessions = await parse_excel_file(file);
    return process_sessions_data(sessions);
  } else {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        complete: (results) => {
          try {
            const sessions = results.data as ChargingSession[];
            
            // handle csv date format if needed
            sessions.forEach(session => {
              if (session['Session Date'] && typeof session['Session Date'] === 'string') {
                // ensure date is in proper format
                session['Session Date'] = session['Session Date'];
              }
            });
            
            const statement_data = process_sessions_data(sessions);
            resolve(statement_data);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}
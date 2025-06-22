import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ChargingSession, UserSummary, StatementTotals, StatementData } from '@/types';

export function parseDriverInfo(driverInfo: string): { email?: string; rfid?: string } {
  const rfidMatch = driverInfo.match(/RFID:\s*(\d+)/);
  if (rfidMatch) {
    return { rfid: rfidMatch[1] };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(driverInfo)) {
    return { email: driverInfo };
  }
  
  return {};
}

async function parseExcelFile(file: File): Promise<ChargingSession[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        const sessions = jsonData.map((row: any) => {
          const session: any = { ...row };
          
          const numericFields = [
            'Session Duration (Min)',
            'Charging Duration (Min)',
            'Energy Delivered (kWh)',
            'Charging Fee',
            'Total Tax Owed',
            'My Revenue',
            'Subtotal',
            'Payment Total'
          ];
          
          numericFields.forEach(field => {
            if (session[field] !== undefined && session[field] !== '-' && session[field] !== '') {
              session[field] = parseFloat(session[field]) || 0;
            } else {
              session[field] = 0;
            }
          });
          
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

function processSessionsData(sessions: ChargingSession[]): StatementData {
  const validSessions = sessions.filter(s => s['Driver Information'] && s['Driver Information'] !== '-');
  
  const driverGroups = validSessions.reduce((acc, session) => {
    const driver = session['Driver Information'] || 'Unknown';
    if (!acc[driver]) {
      acc[driver] = [];
    }
    acc[driver].push(session);
    return acc;
  }, {} as Record<string, ChargingSession[]>);
  
  const users: UserSummary[] = Object.entries(driverGroups).map(([driverInfo, userSessions]) => {
    const { email, rfid } = parseDriverInfo(driverInfo);
    
    const summary: UserSummary = {
      driverInfo,
      email,
      rfid,
      region: userSessions[0]?.State || 'ON',
      sessions: userSessions.length,
      pluggedTime: userSessions.reduce((sum, s) => sum + (s['Session Duration (Min)'] || 0), 0) / 60,
      chargingTime: userSessions.reduce((sum, s) => sum + (s['Charging Duration (Min)'] || 0), 0) / 60,
      energy: userSessions.reduce((sum, s) => sum + (s['Energy Delivered (kWh)'] || 0), 0),
      preTaxRevenue: userSessions.reduce((sum, s) => sum + (s['Charging Fee'] || 0), 0),
      tax: userSessions.reduce((sum, s) => sum + (s['Total Tax Owed'] || 0), 0),
      totalCollected: 0
    };
    
    summary.totalCollected = summary.preTaxRevenue + summary.tax;
    
    return summary;
  });
  
  users.sort((a, b) => b.sessions - a.sessions);
  
  const totals: StatementTotals = {
    sessions: validSessions.length,
    pluggedTime: users.reduce((sum, u) => sum + u.pluggedTime, 0),
    chargingTime: users.reduce((sum, u) => sum + u.chargingTime, 0),
    energy: users.reduce((sum, u) => sum + u.energy, 0),
    preTaxRevenue: users.reduce((sum, u) => sum + u.preTaxRevenue, 0),
    tax: users.reduce((sum, u) => sum + u.tax, 0),
    totalCollected: 0,
    transactionFee: 0,
    hstOnFee: 0,
    totalFees: 0,
    netPayout: 0
  };
  
  totals.totalCollected = totals.preTaxRevenue + totals.tax;
  totals.transactionFee = totals.totalCollected * 0.05;
  totals.hstOnFee = totals.transactionFee * 0.13;
  totals.totalFees = totals.transactionFee + totals.hstOnFee;
  totals.netPayout = totals.totalCollected - totals.totalFees;
  
  const dates = validSessions.map(s => s['Session Date']).filter(Boolean);
  const startDate = dates.length > 0 ? dates.sort()[0] : new Date().toISOString().split('T')[0];
  const endDate = dates.length > 0 ? dates.sort()[dates.length - 1] : new Date().toISOString().split('T')[0];
  
  const site = validSessions[0]?.Site || 'Unknown Site';
  
  const statementData: StatementData = {
    companyName: site,
    reportNumber: `USER-${Date.now()}`,
    startDate,
    endDate,
    users,
    totals
  };
  
  return statementData;
}

export async function processCSV(file: File): Promise<StatementData> {
  const fileType = file.name.toLowerCase();
  
  if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls')) {
    const sessions = await parseExcelFile(file);
    return processSessionsData(sessions);
  } else {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const sessions = results.data as ChargingSession[];
            const statementData = processSessionsData(sessions);
            resolve(statementData);
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
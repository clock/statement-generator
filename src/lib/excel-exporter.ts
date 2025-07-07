import * as XLSX from 'xlsx';
import { StatementData } from '@/types/types';

export function generate_excel(statement_data: StatementData): void {
  // create workbook
  const workbook = XLSX.utils.book_new();
  
  // prepare session data for excel
  const excel_data = statement_data.sessions.map(session => ({
    'Session ID': session['Session ID'] || '-',
    'Date': new Date(session['Session Date']).toLocaleDateString('en-US'),
    'Region': session['State'] === 'Ontario' ? 'ON' : session['State'] || 'ON',
    'Plugged Time (hrs)': format_hours_for_excel(session['Session Duration (Min)'] || 0),
    'Charging Time (min)': (session['Charging Duration (Min)'] || 0).toFixed(2),
    'Energy (kWh)': (session['Energy Delivered (kWh)'] || 0).toFixed(3),
    'Pre-tax Revenue': session['Charging Fee'] || 0,
    'Tax': session['Total Tax Owed'] || 0,
    'Total Collected': session['Payment Total'] || 0,
    'EVOS Fees': session['EV OS Fee Total'] || 0
  }));
  
  // add totals row
  excel_data.push({
    'Session ID': 'TOTAL',
    'Date': '',
    'Region': '',
    'Plugged Time (hrs)': format_hours_for_excel(statement_data.totals.pluggedTime),
    'Charging Time (min)': statement_data.totals.chargingTime.toFixed(2),
    'Energy (kWh)': statement_data.totals.energy.toFixed(2),
    'Pre-tax Revenue': statement_data.totals.preTaxRevenue,
    'Tax': statement_data.totals.tax,
    'Total Collected': statement_data.totals.totalCollected,
    'EVOS Fees': statement_data.totals.transactionFee
  });
  
  // create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(excel_data);
  
  // set column widths
  const column_widths = [
    { wch: 15 }, // session id
    { wch: 12 }, // date
    { wch: 8 },  // region
    { wch: 15 }, // plugged time
    { wch: 15 }, // charging time
    { wch: 12 }, // energy
    { wch: 15 }, // pre-tax revenue
    { wch: 10 }, // tax
    { wch: 15 }, // total collected
    { wch: 12 }  // evos fees
  ];
  worksheet['!cols'] = column_widths;
  
  // add summary information sheet
  const summary_data = [
    ['Company', statement_data.companyName],
    ['Report Number', statement_data.reportNumber],
    ['Start Date', new Date(statement_data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['End Date', new Date(statement_data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    [''],
    ['Summary'],
    ['Total Sessions', statement_data.totals.sessions],
    ['Total Plugged Time', format_hours_for_excel(statement_data.totals.pluggedTime)],
    ['Total Charging Time (min)', statement_data.totals.chargingTime.toFixed(2)],
    ['Total Energy (kWh)', statement_data.totals.energy.toFixed(2)],
    ['Pre-tax Revenue', statement_data.totals.preTaxRevenue],
    ['Tax', statement_data.totals.tax],
    ['Total Collected', statement_data.totals.totalCollected],
    ['EVOS Fees', statement_data.totals.transactionFee],
    ['Net Payout', statement_data.totals.netPayout]
  ];
  
  const summary_sheet = XLSX.utils.aoa_to_sheet(summary_data);
  summary_sheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
  
  // add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, summary_sheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
  
  // generate filename
  const start_date = new Date(statement_data.startDate);
  const month_name = start_date.toLocaleDateString('en-US', { month: 'long' });
  const year = start_date.getFullYear();
  const filename = `Noodoe_Statement_${month_name}_${year}.xlsx`;
  
  // download file
  XLSX.writeFile(workbook, filename);
}

function format_hours_for_excel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}
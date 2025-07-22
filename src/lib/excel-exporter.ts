import * as XLSX from 'xlsx';
import { StatementData } from '@/types/types';

export function generate_excel(statement_data: StatementData): void {
  // safe number function to handle csv dashes and other invalid values
  const safe_number = (value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') return 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,\s]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return parseFloat(value) || 0;
  };

  const format_hours_for_excel = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // calculate totals from session data (same logic as display component)
  const calculated_totals = statement_data.sessions.reduce((totals, session) => {
    const session_duration = safe_number(session['Session Duration (Min)']);
    const charging_duration = safe_number(session['Charging Duration (Min)']);
    const energy = safe_number(session['Energy Delivered (kWh)']);
    const charging_fee = safe_number(session['Charging Fee']);
    const tax_owed = safe_number(session['Total Tax Owed']);
    const payment_total = safe_number(session['Payment Total']);
    const evos_fee = safe_number(session['EV OS Fee Total']);

    return {
      plugged_time: totals.plugged_time + session_duration,
      charging_time: totals.charging_time + charging_duration,
      energy: totals.energy + energy,
      pre_tax_revenue: totals.pre_tax_revenue + charging_fee,
      tax: totals.tax + tax_owed,
      total_collected: totals.total_collected + payment_total,
      transaction_fee: totals.transaction_fee + evos_fee
    };
  }, {
    plugged_time: 0,
    charging_time: 0,
    energy: 0,
    pre_tax_revenue: 0,
    tax: 0,
    total_collected: 0,
    transaction_fee: 0
  });

  const net_payout = calculated_totals.total_collected - calculated_totals.tax - calculated_totals.transaction_fee;

  // create workbook
  const workbook = XLSX.utils.book_new();
  
  // prepare session data for excel with proper number handling
  const excel_data = statement_data.sessions.map(session => ({
    'Session ID': session['Session ID'] || '-',
    'Date': new Date(session['Session Date']).toLocaleDateString('en-US'),
    'Region': session['State'] === 'Ontario' ? 'ON' : session['State'] || 'ON',
    'Plugged Time (hrs)': format_hours_for_excel(safe_number(session['Session Duration (Min)'])),
    'Charging Time (min)': safe_number(session['Charging Duration (Min)']).toFixed(2),
    'Energy (kWh)': safe_number(session['Energy Delivered (kWh)']).toFixed(3),
    'Pre-tax Revenue': safe_number(session['Charging Fee']),
    'Tax': safe_number(session['Total Tax Owed']),
    'Total Collected': safe_number(session['Payment Total']),
    'EVOS Fees': safe_number(session['EV OS Fee Total'])
  }));
  
  // add totals row using calculated totals
  excel_data.push({
    'Session ID': 'MONTHLY SUBTOTAL',
    'Date': '',
    'Region': '',
    'Plugged Time (hrs)': format_hours_for_excel(calculated_totals.plugged_time),
    'Charging Time (min)': calculated_totals.charging_time.toFixed(2),
    'Energy (kWh)': calculated_totals.energy.toFixed(2),
    'Pre-tax Revenue': calculated_totals.pre_tax_revenue,
    'Tax': calculated_totals.tax,
    'Total Collected': calculated_totals.total_collected,
    'EVOS Fees': calculated_totals.transaction_fee
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
    ['Summary Totals'],
    ['Total Sessions', statement_data.sessions.length],
    ['Total Plugged Time', format_hours_for_excel(calculated_totals.plugged_time)],
    ['Total Charging Time (min)', calculated_totals.charging_time.toFixed(2)],
    ['Total Energy (kWh)', calculated_totals.energy.toFixed(2)],
    ['Pre-tax Revenue', calculated_totals.pre_tax_revenue],
    ['Tax', calculated_totals.tax],
    ['Total Collected', calculated_totals.total_collected],
    ['EVOS Fees', calculated_totals.transaction_fee],
    ['Net Payout', net_payout]
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
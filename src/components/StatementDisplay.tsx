import { StatementData } from '@/types/types';
import { generatePDF } from '@/lib/pdf-generator';
import { generate_excel } from '@/lib/excel-exporter';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';

interface StatementDisplayProps {
  data: StatementData;
}

export function StatementDisplay({ data }: StatementDisplayProps) {
  const handle_pdf_download = async () => {
    try {
      await generatePDF('statement-content', data);
    } catch (error) {
      console.error('failed to generate pdf:', error);
    }
  };

  const handle_excel_download = () => {
    try {
      generate_excel(data);
    } catch (error) {
      console.error('failed to generate excel:', error);
    }
  };

  const handle_print = () => {
    window.print();
  };

  const format_currency = (amount: any) => {
    const num_amount = parseFloat(amount) || 0;
    if (num_amount === 0) return '$ -';
    return `$ ${num_amount.toFixed(2)}`;
  };

  const format_hours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')} hrs`;
  };

  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const safe_number = (value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') return 0;
    // handle string values with currency symbols, commas, etc.
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,\s]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return parseFloat(value) || 0;
  };

  // calculate totals from session data
  const calculated_totals = data.sessions.reduce((totals, session) => {
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

  return (
    <>
      <div className="mb-6 flex justify-center gap-4 print:hidden">
        <button
          onClick={handle_pdf_download}
          className="flex items-center gap-2 px-4 py-2 text-white rounded transition-colors"
          style={{ backgroundColor: '#f97316' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={handle_excel_download}
          className="flex items-center gap-2 px-4 py-2 text-white rounded transition-colors"
          style={{ backgroundColor: '#059669' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Excel
        </button>
        <button
          onClick={handle_print}
          className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
          style={{ border: '1px solid #d1d5db' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div id="statement-content" className="bg-white max-w-[1400px] mx-auto p-8">
        {/* header with noodoe branding */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-6xl font-bold" style={{ color: '#f97316' }}>noodoe</h1>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-3">TRANSACTION REPORT</h2>
              <div className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-4 text-right">
                  <span className="font-semibold text-left">Report Number:</span>
                  <span>{data.reportNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <span className="font-semibold text-left">Start Date:</span>
                  <span>{new Date(data.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <span className="font-semibold text-left">End Date:</span>
                  <span>{new Date(data.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold">Customer:</h3>
            <p className="font-semibold">{data.companyName}</p>
            <p className="text-sm" style={{ color: '#4b5563' }}>1600 Hyde Park Rd, London, ON N6H 0L5</p>
          </div>
        </div>

        {/* main table */}
        <div className="mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white" style={{ backgroundColor: '#f97316' }}>
                <th className="px-2 py-2 text-left font-semibold">Session ID</th>
                <th className="px-2 py-2 text-center font-semibold">Date</th>
                <th className="px-2 py-2 text-center font-semibold">Region</th>
                <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">Plugged-in time</th>
                <th className="px-2 py-2 text-right font-semibold">Charging Time*</th>
                <th className="px-2 py-2 text-right font-semibold">Energy**</th>
                <th className="px-2 py-2 text-right font-semibold">Pre-tax revenue</th>
                <th className="px-2 py-2 text-right font-semibold">Tax</th>
                <th className="px-2 py-2 text-right font-semibold">Total collected</th>
                <th className="px-2 py-2 text-right font-semibold">EVOS Fees</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session, index) => {
                const charging_fee = safe_number(session['Charging Fee']);
                const tax_owed = safe_number(session['Total Tax Owed']);
                const payment_total = safe_number(session['Payment Total']);
                const evos_fee = safe_number(session['EV OS Fee Total']);
                
                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                    <td className="px-2 py-1.5">{session['Session ID'] || '-'}</td>
                    <td className="px-2 py-1.5 text-center">{format_date(session['Session Date'])}</td>
                    <td className="px-2 py-1.5 text-center">{session['State'] === 'Ontario' ? 'ON' : session['State'] || 'ON'}</td>
                    <td className="px-2 py-1.5 text-right">{format_hours(safe_number(session['Session Duration (Min)']))}</td>
                    <td className="px-2 py-1.5 text-right">{safe_number(session['Charging Duration (Min)']).toFixed(2)} min</td>
                    <td className="px-2 py-1.5 text-right">{safe_number(session['Energy Delivered (kWh)']).toFixed(3)} kWh</td>
                    <td className="px-2 py-1.5 text-right">{format_currency(charging_fee)}</td>
                    <td className="px-2 py-1.5 text-right">{format_currency(tax_owed)}</td>
                    <td className="px-2 py-1.5 text-right">{format_currency(payment_total)}</td>
                    <td className="px-2 py-1.5 text-right">{format_currency(evos_fee)}</td>
                  </tr>
                );
              })}
              {/* monthly subtotal row */}
              <tr className="font-semibold" style={{ borderTop: '2px solid #9ca3af' }}>
                <td colSpan={3} className="px-2 py-2">Monthly subtotal</td>
                <td className="px-2 py-2 text-right">{format_hours(calculated_totals.plugged_time)}</td>
                <td className="px-2 py-2 text-right">{calculated_totals.charging_time.toFixed(2)} min</td>
                <td className="px-2 py-2 text-right">{calculated_totals.energy.toFixed(2)} kWh</td>
                <td className="px-2 py-2 text-right">{format_currency(calculated_totals.pre_tax_revenue)}</td>
                <td className="px-2 py-2 text-right">{format_currency(calculated_totals.tax)}</td>
                <td className="px-2 py-2 text-right">{format_currency(calculated_totals.total_collected)}</td>
                <td className="px-2 py-2 text-right">{format_currency(calculated_totals.transaction_fee)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* summary section */}
        <div className="flex justify-between gap-8">
          <div className="text-xs space-y-1 max-w-md">
            <p className="font-semibold mb-1">Notes:</p>
            <p>Payments will be made monthly.</p>
            <p>*Reflects the equivalent required time for the car to draw the kWh at a full "effective" charge rate.</p>
            <p>**Energy usage is estimated and not based on utility-grade meters</p>
            <p className="mt-3">All figures are in Canadian Dollars.</p>
          </div>

          <div className="text-sm min-w-[200px]">
            <div className="space-y-1 mb-3">
              <div className="flex justify-between gap-8">
                <span>Total collected</span>
                <span className="font-semibold text-right">{format_currency(calculated_totals.total_collected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">ON HST 13.0%</span>
                <span className="text-right">-{format_currency(calculated_totals.tax)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 pb-1">
                <span className="font-semibold">Total Taxes</span>
                <span className="font-semibold text-right">-{format_currency(calculated_totals.tax)}</span>
              </div>
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-xs">EVOS Fees</span>
                <span className="text-right">-{format_currency(calculated_totals.transaction_fee)}</span>
              </div>
              <div className="flex justify-between pb-1" style={{ borderBottom: '1px solid #9ca3af' }}>
                <span className="font-semibold">Total fees</span>
                <span className="font-semibold text-right">-{format_currency(calculated_totals.transaction_fee)}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold pt-1">
              <span>Net payout</span>
              <span className="text-right">{format_currency(net_payout)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
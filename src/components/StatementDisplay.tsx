import { StatementData } from '@/types';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, Zap } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-generator';

interface StatementDisplayProps {
  data: StatementData;
}

export function StatementDisplay({ data }: StatementDisplayProps) {
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await generatePDF('statement-content', data);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getUserDisplay = (user: typeof data.users[0]) => {
    if (user.email) return user.email;
    if (user.rfid) return `${user.rfid} (RFID)`;
    return user.driverInfo;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Action buttons - outside the statement content */}
      <div className="flex justify-end space-x-2 print:hidden">
        <Button onClick={handlePrint} size="sm" variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownloadPDF} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      <div id="statement-content" className="bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold">CHARGELAB</span>
            </div>
            <h1 className="text-2xl font-bold">TRANSACTION REPORT</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="font-semibold">Customer:</p>
              <p>{data.companyName}</p>
              <p className="text-sm text-gray-600 mt-1">
                {data.users[0]?.email || 'Customer Location'}
              </p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Report Number:</span> {data.reportNumber}</p>
              <p><span className="font-semibold">Start Date:</span> {data.startDate}</p>
              <p><span className="font-semibold">End Date:</span> {data.endDate}</p>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium">Region</th>
                  <th className="px-3 py-2 text-right font-medium">Sessions</th>
                  <th className="px-3 py-2 text-right font-medium">Plugged-in time</th>
                  <th className="px-3 py-2 text-right font-medium">Charging Time*</th>
                  <th className="px-3 py-2 text-right font-medium">Energy**</th>
                  <th className="px-3 py-2 text-right font-medium">Pre-tax revenue</th>
                  <th className="px-3 py-2 text-right font-medium">Tax</th>
                  <th className="px-3 py-2 text-right font-medium">Total collected</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-3 py-2 text-left">{getUserDisplay(user)}</td>
                    <td className="px-3 py-2 text-left">{user.region}</td>
                    <td className="px-3 py-2 text-right">{user.sessions}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(user.pluggedTime)} hrs</td>
                    <td className="px-3 py-2 text-right">{formatNumber(user.chargingTime)} hrs</td>
                    <td className="px-3 py-2 text-right">{formatNumber(user.energy)} kWh</td>
                    <td className="px-3 py-2 text-right">$ {formatCurrency(user.preTaxRevenue)}</td>
                    <td className="px-3 py-2 text-right">$ {formatCurrency(user.tax)}</td>
                    <td className="px-3 py-2 text-right">$ {formatCurrency(user.totalCollected)}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-100">
                  <td colSpan={2} className="px-3 py-2">Monthly subtotal</td>
                  <td className="px-3 py-2 text-right">{data.totals.sessions}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(data.totals.pluggedTime)} hrs</td>
                  <td className="px-3 py-2 text-right">{formatNumber(data.totals.chargingTime)} hrs</td>
                  <td className="px-3 py-2 text-right">{formatNumber(data.totals.energy)} kWh</td>
                  <td className="px-3 py-2 text-right">$ {formatCurrency(data.totals.preTaxRevenue)}</td>
                  <td className="px-3 py-2 text-right">$ {formatCurrency(data.totals.tax)}</td>
                  <td className="px-3 py-2 text-right">$ {formatCurrency(data.totals.totalCollected)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-md ml-auto">
            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span>Total collected</span>
                <span>$ {formatCurrency(data.totals.totalCollected)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>ON HST 13.0%</span>
                <span>-{formatCurrency(data.totals.tax)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold border-t border-gray-300">
                <span>Total taxes</span>
                <span>-$ {formatCurrency(data.totals.tax)}</span>
              </div>
              <div className="flex justify-between py-1 mt-2">
                <span>Transaction fee (5.0%)</span>
                <span>-{formatCurrency(data.totals.transactionFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>ON HST 13.0% on transaction fee</span>
                <span>-{formatCurrency(data.totals.hstOnFee)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold border-t border-gray-300">
                <span>Total fees</span>
                <span>-$ {formatCurrency(data.totals.totalFees)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-400 mt-2">
                <span>Net payout</span>
                <span>$ {formatCurrency(data.totals.netPayout)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic text-center mb-4">All figures are in Canadian Dollars.</p>
            <div className="text-xs text-gray-600">
              <p className="font-semibold mb-1">Notes:</p>
              <p>Payments will be made monthly.</p>
              <p>*Reflects the equivalent required time for the car to draw the kWh at a full "effective" charge rate.</p>
              <p>**Energy usage is estimated and not based on utility-grade meters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
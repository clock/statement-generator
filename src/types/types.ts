export interface ChargingSession {
  'Session ID'?: string;
  'Session Date': string;
  'CPO': string;
  'CPO ID'?: string;
  'Site': string;
  'Site ID'?: string;
  'Country'?: string;
  'State': string;
  'Station ID'?: number | string;
  'Port ID'?: string;
  'Charging Type'?: string;
  'Connector Type'?: string;
  'Serial Number'?: string;
  'Session Start Time'?: string;
  'Session End Time'?: string;
  'Session Duration (hh:mm:ss)'?: string;
  'Session Duration (Min)': number;
  'Charging Duration (hh:mm:ss)'?: string;
  'Charging Duration (Min)': number;
  'Energy Delivered (kWh)': number;
  'Activation Method'?: string;
  'Completion Status'?: string;
  'Roaming - Party'?: string;
  'Roaming - CDR ID'?: string;
  'Payment Method'?: string;
  'Payment Gateway'?: string;
  'Credit Card'?: string;
  'Additional Payment Information'?: string;
  'Discount Plan'?: string;
  'Discount Plan Name'?: string | number;
  'Currency'?: string;
  'Connection Fee'?: number | string;
  'Charging Fee': number;
  'Occupancy Fee'?: number | string;
  'Membership Discount'?: number | string;
  'Code Discount'?: number | string;
  'Subtotal': number;
  'Unsettled Amount'?: number | string;
  'Total Tax'?: number | string;
  'Payment Total': number;
  'Failed Payment Amount'?: number | string;
  'Failed Payment Reason'?: string;
  'Payment Gateway Fee'?: number;
  'My Revenue': number;
  'EV OS Fee Total'?: number;
  'Settlement Currency'?: string;
  'Exchange Rate'?: number | string;
  'Payment Gateway Fee (SC)'?: number | string;
  'My Revenue (SC)'?: number | string;
  'EV OS Fee (SC)'?: number | string;
  'Net Revenue Recipient (Incl. Tax)'?: string;
  'Net Revenue Received (Incl. Tax)'?: number;
  'EV OS Fee (Partner Share)'?: number | string;
  'EV OS Fee (EV OS Share)'?: number | string;
  'Merchant'?: string;
  'Taxes Type'?: string;
  'Tax - ONTARIO'?: number;
  'Tax - CANADA'?: number;
  'Excise Tax'?: number | string;
  'Total Tax Owed': number;
  'Site ZIP'?: string;
  'Site City'?: string;
  'Site Address'?: string;
  'Time Zone'?: string;
  'Data Verification Date'?: string;
  'Reporting Entity'?: string;
  'Station Status'?: string;
  'Station Vendor'?: string;
  'Station Note'?: string | null;
  'Note'?: string | null;
  'Estimated CO₂ Emission Reduction'?: number;
  'Driver Information': string;
}

export interface UserSummary {
  driverInfo: string;
  email?: string;
  rfid?: string;
  region: string;
  sessions: number;
  pluggedTime: number; // in hours
  chargingTime: number; // in hours  
  energy: number; // kwh
  preTaxRevenue: number;
  tax: number;
  totalCollected: number;
}

export interface StatementTotals {
  sessions: number;
  pluggedTime: number; // in minutes
  chargingTime: number; // in minutes
  energy: number;
  preTaxRevenue: number;
  tax: number;
  totalCollected: number;
  transactionFee: number;
  hstOnFee: number;
  totalFees: number;
  netPayout: number;
}

export interface StatementData {
  companyName: string;
  reportNumber: string;
  startDate: string;
  endDate: string;
  users: UserSummary[];
  sessions: ChargingSession[];
  totals: StatementTotals;
}
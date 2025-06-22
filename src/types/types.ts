// CSV Row type based on Noodoe format
export interface ChargingSession {
    'Session Date': string;
    'Session ID': string;
    'Driver Information': string;
    'State': string;
    'Session Duration (Min)': number;
    'Charging Duration (Min)': number;
    'Energy Delivered (kWh)': number;
    'Charging Fee': number;
    'Total Tax Owed': number;
    'Site': string;
    'Site City': string;
  }
  
  // Aggregated user data for the statement
  export interface UserSummary {
    driverInfo: string;
    email?: string;
    rfid?: string;
    region: string;
    sessions: number;
    pluggedTime: number; // hours
    chargingTime: number; // hours
    energy: number; // kWh
    preTaxRevenue: number;
    tax: number;
    totalCollected: number;
  }
  
  // Statement totals
  export interface StatementTotals {
    sessions: number;
    pluggedTime: number;
    chargingTime: number;
    energy: number;
    preTaxRevenue: number;
    tax: number;
    totalCollected: number;
    transactionFee: number;
    hstOnFee: number;
    totalFees: number;
    netPayout: number;
  }
  
  // Complete statement data
  export interface StatementData {
    companyName: string;
    reportNumber: string;
    startDate: string;
    endDate: string;
    users: UserSummary[];
    totals: StatementTotals;
  }
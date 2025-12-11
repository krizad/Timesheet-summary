import XLSX from 'xlsx';
import { processTimesheetData } from './src/utils/excelParser';
import { TimesheetRow } from './src/types';
import path from 'path';

const filePath = path.resolve('Timesheet (2).xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Match the logic in excelParser.ts
const jsonData = XLSX.utils.sheet_to_json<TimesheetRow>(sheet, { range: 4 });
console.log('Raw Data Sample:', JSON.stringify(jsonData.slice(0, 2), null, 2));

const result = processTimesheetData(jsonData);

console.log(JSON.stringify(result, null, 2));

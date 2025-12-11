import * as XLSX from 'xlsx';
import type { ProjectSummary, TimesheetRow, TimesheetSummary } from '../types';

export const parseExcel = (file: File): Promise<TimesheetSummary> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Based on analysis, header is at row 7 (index 7, so range starts from 7)
        // Actually sheet_to_json with range option is better
        // Let's inspect the file again or assume the structure found:
        // Row 7 has headers: Date, Hours Worked, Project Name, Task, Task Detail, Status
        
        const jsonData = XLSX.utils.sheet_to_json<TimesheetRow>(sheet, { range: 4 });
        
        const groupedData = processTimesheetData(jsonData);
        resolve(groupedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

const parseHours = (timeStr: string): number => {
  // Format: "5h 00m (13:00:00 - 18:00:00 )"
  // Or just "5h 00m"
  if (!timeStr) return 0;
  
  const match = timeStr.match(/(\d+)h\s+(\d+)m/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours + (minutes / 60);
  }
  return 0;
};

export const processTimesheetData = (data: TimesheetRow[]): TimesheetSummary => {
  // First, group by date to count records per day
  const recordsByDate = new Map<string, number>();
  data.forEach(row => {
    if (row.Status === 'Reject') return;
    // Count all non-reject records for the day
    const date = row.Date;
    recordsByDate.set(date, (recordsByDate.get(date) || 0) + 1);
  });
  
  // Let's restart the implementation with a better structure.
  
  const summaryMap = new Map<string, Map<string, { manhours: number, mandays: number }>>();

  data.forEach(row => {
    if (row.Status === 'Reject') return;

    let projectName = row['Project Name'];
    let taskName = row.Task;
    let hours = parseHours(row['Hours Worked']);

    // Handle Leave (Blank Project Name)
    if (!projectName) {
      projectName = 'Leave';
      taskName = taskName || 'Leave';
      
      const recordsCount = recordsByDate.get(row.Date) || 0;
      if (recordsCount === 1) {
        hours = 8;
      } else {
        hours = 4;
      }
    }

    if (!taskName) return;

    if (!summaryMap.has(projectName)) {
      summaryMap.set(projectName, new Map());
    }

    const current = summaryMap.get(projectName)!.get(taskName) || { manhours: 0, mandays: 0 };
    
    summaryMap.get(projectName)!.set(taskName, {
      manhours: current.manhours + hours,
      mandays: current.mandays + (hours / 8) // Mandays are now always hours / 8
    });
  });

  const summaries: ProjectSummary[] = [];

  summaryMap.forEach((taskMap, projectName) => {
    const tasks: { taskName: string; manhours: number; mandays: number }[] = [];
    let totalManhours = 0;
    let totalMandays = 0;

    taskMap.forEach((stats, taskName) => {
      tasks.push({
        taskName,
        manhours: stats.manhours,
        mandays: stats.mandays
      });
      totalManhours += stats.manhours;
      totalMandays += stats.mandays;
    });

    // Sort tasks by manhours ascending
    tasks.sort((a, b) => a.manhours - b.manhours);

    summaries.push({
      projectName,
      tasks,
      totalManhours,
      totalMandays
    });
  });

  // Sort projects by totalManhours ascending
  summaries.sort((a, b) => a.totalManhours - b.totalManhours);

  return {
    projects: summaries,
    totalWorkingDays: recordsByDate.size
  };
};

export const exportToExcel = (data: TimesheetSummary, filename: string = 'timesheet_summary.xlsx') => {
  // Flatten data for export
  const rows: any[] = [];
  
  // Add Summary Header
  rows.push({ 'Project Name': 'SUMMARY REPORT', 'Task Name': '', 'Manhours': '', 'Mandays': '' });
  rows.push({ 'Project Name': `Total Working Days: ${data.totalWorkingDays}`, 'Task Name': '', 'Manhours': '', 'Mandays': '' });
  rows.push({}); // Empty row

  let grandTotalManhours = 0;
  let grandTotalMandays = 0;

  data.projects.forEach(project => {
    // Project Header Row
    rows.push({
      'Project Name': project.projectName,
      'Task Name': '',
      'Manhours': project.totalManhours,
      'Mandays': project.totalMandays
    });

    grandTotalManhours += project.totalManhours;
    grandTotalMandays += project.totalMandays;

    // Task Rows
    project.tasks.forEach(task => {
      rows.push({
        'Project Name': '',
        'Task Name': task.taskName,
        'Manhours': task.manhours,
        'Mandays': task.mandays
      });
    });

    rows.push({}); // Empty row between projects
  });

  // Grand Total Row
  rows.push({
    'Project Name': 'GRAND TOTAL',
    'Task Name': '',
    'Manhours': grandTotalManhours,
    'Mandays': grandTotalMandays
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  
  // Set column widths
  const wscols = [
    { wch: 40 }, // Project Name
    { wch: 40 }, // Task Name
    { wch: 15 }, // Manhours
    { wch: 15 }, // Mandays
  ];
  worksheet['!cols'] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  
  XLSX.writeFile(workbook, filename);
};

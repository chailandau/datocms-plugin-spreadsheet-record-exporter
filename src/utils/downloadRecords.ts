import { buildClient } from '@datocms/cma-client-browser';
import * as XLSX from 'xlsx';

interface DownloadRecords {
  apiToken: string;
  progressCallback: (count: number) => void;
}

export let recordAmount = 0;

// Flattens nested object headers (up to 2 levels)
const getFlattenedHeaders = (record: { [x: string]: any }) => {
  const headers = Object.keys(record);
  const flattenedHeaders: string[] = [];

  headers.forEach((header) => {
    if (typeof record[header] === 'object' && record[header] !== null) {
       if (Array.isArray(record[header])) {
        flattenedHeaders.push(header);
      } else {
        Object.keys(record[header]).forEach((nestedHeader) => {
          flattenedHeaders.push(`${header}.${nestedHeader}`);
        });
      }
    } else {
      flattenedHeaders.push(header);
    }
  });

  return flattenedHeaders;
};

// Ensures all headers are fetched even if some records don't contain all of them
const getAllFlattenedHeaders = (records: any[]) => {
  const allHeaders = new Set<string>();

  records.forEach((record) => {
    const headers = getFlattenedHeaders(record);
    headers.forEach((header) => {
      allHeaders.add(header);
    });
  });

  const filteredHeaders = Array.from(allHeaders).filter((header) => 
  records.some((record) => {
    const headerPath = header.split('.');
    let value = record;
     let isValid = true;

    headerPath.forEach((nestedHeader) => {
      if (
        typeof value !== 'object' || 
        value === null || 
        typeof value[nestedHeader] === undefined
        ) {
         isValid = false;
        
return;
      }
      if( value[nestedHeader] !== null && value[nestedHeader] !== '' && value[nestedHeader] !== undefined) {
        value = value[nestedHeader];
        }
     
    });
    
return isValid;
    
  }));
  
return filteredHeaders;
};

const getFlattenedData = (record: any, flattenedHeaders: any) => {
  const rowData: any[] = [];

  flattenedHeaders.forEach((header: string) => {
    const headerPath = header.split('.');
    let value = record;
    let isValid = true;

    headerPath.forEach((nestedHeader) => {
      if (typeof value !== 'object' || value === null) {
        isValid = false;

        return;
      }

      value = value[nestedHeader];
    });

    // Truncate the value if it exceeds 1000 characters
    if (typeof value === 'string' && value.length > 1000) {
      value = value.substring(0, 1000) + '... [Truncated]';
    }

    if (Array.isArray(value)) {
      value = (value.join(', ')).toString();
    }

    rowData.push(isValid && value !== undefined && value !== '' ? value : null);
  });

  return rowData;
};

export default async function downloadRecords(

  { apiToken, progressCallback }: DownloadRecords) {
  const client = buildClient({
    apiToken,
  });

  const records = [];

  for await (const record of client.items.listPagedIterator()) {
    records.push(record);
    recordAmount++;
    progressCallback(recordAmount);
  }

  const allFlattenedHeaders = getAllFlattenedHeaders(records);
  const data = records.map((record) => getFlattenedData(record, allFlattenedHeaders));

  // Generate Excel file
  const worksheet = XLSX.utils.book_new();
  XLSX.utils.sheet_add_aoa(worksheet, [allFlattenedHeaders, ...data]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Generate link and initiate download
  const reader = new FileReader();

  reader.onload = () => {
    const link = document.createElement('a');
    link.href = reader.result as string;
    link.download = `allDatocmsRecords-${new Date().toISOString()}.xlsx`;
    link.dispatchEvent(new MouseEvent('click'));
  };

  reader.readAsDataURL(blob);
}

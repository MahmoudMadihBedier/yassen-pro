// Google Apps Script for Bounced Check Manager
// Copy this entire code into your Google Sheet's Apps Script editor

// Sheet configuration
const SHEET_NAME = 'checks';
const SHEET_ID = '1wz12I0rRtEjg6yeqreuC6NN_rb4xAf81p4FNsdzUMCA';

// Get or create the sheet
function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initializeSheet(sheet);
  }
  return sheet;
}

// Initialize sheet with headers
function initializeSheet(sheet) {
  const headers = [
    'id',
    'date',
    'checkNumber',
    'reason',
    'amount',
    'name',
    'building',
    'unitNumber',
    'paymentWay',
    'status',
    'staff',
    'email',
    'phone',
    'followUpDate',
    'returnDate',
    'cpvNumber',
    'notes'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

// Main HTTP endpoint handler
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const method = data.method || 'POST';
    const path = data.path || '/checks';
    const body = data.body || {};

    let response;

    if (path === '/checks' && method === 'GET') {
      response = handleGetChecks();
    } else if (path === '/checks' && method === 'POST') {
      response = handlePostCheck(body);
    } else if (path.startsWith('/checks/') && method === 'GET') {
      const id = path.split('/')[2];
      response = handleGetCheck(id);
    } else if (path.startsWith('/checks/') && method === 'PUT') {
      const id = path.split('/')[2];
      response = handlePutCheck(id, body);
    } else if (path.startsWith('/checks/') && method === 'DELETE') {
      const id = path.split('/')[2];
      response = handleDeleteCheck(id);
    } else {
      response = { error: 'Not found' };
    }

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET all checks
function handleGetChecks() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const checks = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // if id exists
      const check = {};
      headers.forEach((header, idx) => {
        check[header] = row[idx];
      });
      checks.push(check);
    }
  }
  
  return checks;
}

// GET a single check
function handleGetCheck(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const check = {};
      headers.forEach((header, idx) => {
        check[header] = data[i][idx];
      });
      return check;
    }
  }
  
  return { error: 'Not found' };
}

// POST (create) a new check
function handlePostCheck(body) {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate a unique ID
  const id = String(new Date().getTime());
  
  const row = [];
  headers.forEach(header => {
    if (header === 'id') {
      row.push(id);
    } else {
      row.push(body[header] || '');
    }
  });
  
  sheet.appendRow(row);
  
  // Return the created check
  const check = {};
  headers.forEach((header, idx) => {
    check[header] = row[idx];
  });
  
  return check;
}

// PUT (update) a check
function handlePutCheck(id, body) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Update the row
      headers.forEach((header, idx) => {
        if (body.hasOwnProperty(header)) {
          sheet.getRange(i + 1, idx + 1).setValue(body[header]);
        }
      });
      
      // Return updated check
      const check = {};
      const updatedData = sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0];
      headers.forEach((header, idx) => {
        check[header] = updatedData[idx];
      });
      
      return check;
    }
  }
  
  return { error: 'Not found' };
}

// DELETE a check
function handleDeleteCheck(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { error: 'Not found' };
}

// Helper function to test the script
function testScript() {
  // Test GET all
  console.log('GET /checks:', JSON.stringify(handleGetChecks()));
  
  // Test POST
  const testCheck = {
    date: '2025-12-04',
    checkNumber: 'TEST001',
    reason: 'test',
    amount: 1000,
    name: 'Test User',
    building: 'Test Building',
    unitNumber: '1',
    paymentWay: 'cash',
    status: 'bounced',
    staff: 'admin',
    email: 'test@example.com',
    phone: '+201234567890',
    followUpDate: '2025-12-18',
    returnDate: '2025-12-04',
    cpvNumber: '',
    notes: 'test note'
  };
  console.log('POST /checks:', JSON.stringify(handlePostCheck(testCheck)));
}

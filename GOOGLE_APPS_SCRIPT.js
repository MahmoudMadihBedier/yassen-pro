// Google Apps Script for Bounced Check Manager
// Copy this entire code into your Google Sheet's Apps Script editor

// Sheet configuration
const SHEET_NAME = 'checks';
const SHEET_ID = '1wz12I0rRtEjg6yeqreuC6NN_rb4xAf81p4FNsdzUMCA';

// Define headers
const HEADERS = [
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

// Get or create the sheet
function getSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      initializeSheet(sheet);
    } else {
      // Ensure headers exist
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        initializeSheet(sheet);
      }
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error in getSheet: ' + error.message);
    throw new Error('Failed to access sheet: ' + error.message);
  }
}

// Helper to format date-like values as yyyy-MM-dd strings
function formatDateValue(value) {
  try {
    if (!value && value !== 0) return '';
    if (value instanceof Date) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    return String(value || '');
  } catch (err) {
    return String(value || '');
  }
}

// Initialize sheet with headers
function initializeSheet(sheet) {
  try {
    // Clear existing data
    const range = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
    range.clearContent();
    
    // Set headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } catch (error) {
    Logger.log('Error in initializeSheet: ' + error.message);
    throw new Error('Failed to initialize sheet: ' + error.message);
  }
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
    Logger.log('Error in doPost: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET all checks
function handleGetChecks() {
  try {
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
          // Format date fields to yyyy-MM-dd for consistent client handling
          if (['date','followUpDate','returnDate'].indexOf(header) !== -1) {
            check[header] = formatDateValue(row[idx]);
          } else {
            check[header] = row[idx];
          }
        });
        checks.push(check);
      }
    }
    
    return checks;
  } catch (error) {
    Logger.log('Error in handleGetChecks: ' + error.message);
    throw error;
  }
}

// GET a single check
function handleGetCheck(id) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return { error: 'Not found' };
    }
    
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        const check = {};
        headers.forEach((header, idx) => {
          if (['date','followUpDate','returnDate'].indexOf(header) !== -1) {
            check[header] = formatDateValue(data[i][idx]);
          } else {
            check[header] = data[i][idx];
          }
        });
        return check;
      }
    }
    
    return { error: 'Not found' };
  } catch (error) {
    Logger.log('Error in handleGetCheck: ' + error.message);
    throw error;
  }
}

// POST (create) a new check
function handlePostCheck(body) {
  try {
    const sheet = getSheet();
    
    // Ensure headers are initialized
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      initializeSheet(sheet);
    }
    
    // Generate a unique ID
    const id = String(new Date().getTime());
    
    // Build the row with all headers
    const row = [];
    HEADERS.forEach(header => {
      if (header === 'id') {
        row.push(id);
      } else {
        row.push(body[header] !== undefined ? body[header] : '');
      }
    });
    
    // Append the row
    sheet.appendRow(row);
    
    // Return the created check
    const check = {};
    HEADERS.forEach((header, idx) => {
      check[header] = row[idx];
    });
    
    return check;
  } catch (error) {
    Logger.log('Error in handlePostCheck: ' + error.message);
    throw error;
  }
}

// PUT (update) a check
function handlePutCheck(id, body) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return { error: 'Not found' };
    }
    
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
  } catch (error) {
    Logger.log('Error in handlePutCheck: ' + error.message);
    throw error;
  }
}

// DELETE a check
function handleDeleteCheck(id) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { error: 'Not found' };
  } catch (error) {
    Logger.log('Error in handleDeleteCheck: ' + error.message);
    throw error;
  }
}

// Helper function to test the script
function testScript() {
  try {
    // Initialize sheet
    const sheet = getSheet();
    Logger.log('Sheet initialized');
    
    // Test GET all
    const allChecks = handleGetChecks();
    Logger.log('GET /checks: ' + JSON.stringify(allChecks));
    
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
    const createdCheck = handlePostCheck(testCheck);
    Logger.log('POST /checks: ' + JSON.stringify(createdCheck));
    
    // Test GET all again
    const allChecksAfter = handleGetChecks();
    Logger.log('GET /checks after POST: ' + JSON.stringify(allChecksAfter));
  } catch (error) {
    Logger.log('Error in testScript: ' + error.message);
  }
}

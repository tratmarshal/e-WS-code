// ========== db.gs ==========
// ฟังก์ชันเข้าถึง Google Sheets

function getWarrantDB() {
  return SpreadsheetApp.openById(WARRANT_DB_ID);
}

function getUpdateDB() {
  return SpreadsheetApp.openById(UPDATE_DB_ID);
}

function getOrCreateUpdateSheet_(name, headers) {
  const db = getUpdateDB();
  let sheet = db.getSheetByName(name);
  if (!sheet) sheet = db.insertSheet(name);
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function ensureProcessingSheet_() {
  const sheet = getOrCreateUpdateSheet_(SHEET_PROCESSING, PROCESSING_HEADERS);
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), PROCESSING_HEADERS.length)).getValues()[0];
  const needsHeader = PROCESSING_HEADERS.some((h, i) => normalizeText_(current[i]) !== h);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, PROCESSING_HEADERS.length).setValues([PROCESSING_HEADERS]);
  }
  return sheet;
}

function getWarrantColumnMap_(headers) {
  return {
    seq: indexOfHeader(headers, ["ลำดับ"], 0),
    type: indexOfHeader(headers, ["ประเภทหมายจับ"], 1),
    warrantNo: indexOfHeader(headers, ["เลขที่หมายจับ"], 2),
    issuedDate: indexOfHeader(headers, ["วันที่ออก"], 3),
    fullName: indexOfHeader(headers, ["ชื่อสกุล", "ชื่อ-สกุล"], 4),
    id13: indexOfHeader(headers, ["13 หลัก", "เลขบัตรประชาชน", "เลขประจำตัวประชาชน"], 5),
    blackCaseNo: indexOfHeader(headers, ["เลขคดีดำ"], 6),
    redCaseNo: indexOfHeader(headers, ["เลขคดีแดง"], 7),
    charge: indexOfHeader(headers, ["ความผิด"], 8),
    addressNo: indexOfHeader(headers, ["บ้านเลขที่"], 9),
    moo: indexOfHeader(headers, ["หมู่"], 10),
    tambon: indexOfHeader(headers, ["ตำบล"], 11),
    amphoe: indexOfHeader(headers, ["อำเภอ"], 12),
    province: indexOfHeader(headers, ["จังหวัด"], 13),
    limitation: indexOfHeader(headers, ["อายุความ"], 14),
    bail: indexOfHeader(headers, ["ประกัน"], 15),
    submitTo: indexOfHeader(headers, ["ท่าน"], 16),
    status: indexOfHeader(headers, ["สถานะ"], 17),
    note: indexOfHeader(headers, ["หมายเหตุ"], 18)
  };
}

function getWarrantSheets_() {
  const db = getWarrantDB();
  const sheets = [];
  for (let year = WARRANT_SHEET_START; year <= WARRANT_SHEET_END; year++) {
    const sheet = db.getSheetByName(String(year));
    if (sheet) sheets.push(sheet);
  }
  return sheets;
}

function findWarrantByNo_(warrantNo) {
  const target = normalizeText_(warrantNo);
  const matches = [];
  getWarrantSheets_().forEach(sheet => {
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return;
    const columns = getWarrantColumnMap_(values[0]);
    for (let r = 1; r < values.length; r++) {
      if (normalizeText_(values[r][columns.warrantNo]) === target) {
        matches.push({ sheet, rowNumber: r + 1, row: values[r], columns });
      }
    }
  });
  return matches;
}

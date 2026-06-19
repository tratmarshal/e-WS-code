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

/**
 * ฟังก์ชันกวาดข้อมูลหมายจับจากทุกแท็บมารวมเป็น Master Index ชุดเดียวและบันทึกลง Cache
 */
function refreshWarrantMasterIndex_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  const id13Map = {};
  const allData = [];
  
  // วนลูปเปิดอ่านข้อมูลจากทุกแท็บในครั้งเดียว
  sheets.forEach(function(sheet) {
    const sheetName = sheet.getName();
    
    // ⚡️ ข้ามแท็บที่ไม่ใช่ฐานข้อมูลหมายจับ (เช่น แท็บ Log, Config, สถิติ)
    if (sheetName === "Log" || sheetName === "Dashboard") return; 
    
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return; // ถ้าชีตว่างหรือมีแค่หัวตารางให้ข้าม
    
    // เริ่มวนลูปตั้งแต่แถวที่ 1 (ข้ามหัวตารางแถวที่ 0)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // ดึงค่าและจัด Format ข้อมูล (!! แก้ไขตำแหน่ง row[x] ให้ตรงกับคอลัมน์จริงของคุณ !!)
      const id13 = String(row[0]).trim(); // สมมติ คอลัมน์ A (0) คือเลข 13 หลัก
      const name = String(row[1]).trim(); // สมมติ คอลัมน์ B (1) คือชื่อ-นามสกุล
      
      if (!id13) continue; // ถ้าไม่มีเลขบัตรให้ข้ามแถวนี้
      
      const item = {
        id13: id13,
        name: name,
        sheetName: sheetName, // บันทึกไว้เพื่อให้รู้ว่าข้อมูลนี้ถูกดึงมาจากแท็บไหน
        warrantNo: String(row[2]).trim(), // สมมติ คอลัมน์ C (2) คือเลขที่หมายจับ
        charge: String(row[3]).trim()      // สมมติ คอลัมน์ D (3) คือฐานความผิด
      };
      
      // แผนที่แบบ O(1) ผูกเลข 13 หลักเป็น Key เพื่อให้ค้นหาได้ไวที่สุด
      id13Map[id13] = item;
      allData.push(item);
    }
  });
  
  const masterIndex = {
    id13Map: id13Map,
    allData: allData
  };
  
  // เซฟข้อมูลดัชนีรวมลงในระบบ Cache ของ Google (เก็บได้สูงสุด 6 ชั่วโมง = 21600 วินาที)
  // เพื่อให้การกดค้นหาครั้งต่อๆ ไปดึงจากตรงนี้ได้ทันที ไม่ต้องรันเปิดอ่านชีตซ้ำอีก
  CacheService.getScriptCache().put("WARRANT_MASTER_INDEX", JSON.stringify(masterIndex), 21600);
  
  return masterIndex;
}
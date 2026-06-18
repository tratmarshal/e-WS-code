// ========== auto.gs ==========
// งานอัปเดตฐานข้อมูลหมายจับจากรายการแก้ไขใน processing

function autoUpdateWarrantDatabase() {
  return withScriptLock_(() => autoUpdateWarrantDatabase_());
}

function autoUpdateWarrantDatabase_() {
  const processSheet = ensureProcessingSheet_();
  const lastRow = processSheet.getLastRow();
  if (lastRow < 2) return { success: true, synced: 0, errors: 0 };

  const values = processSheet.getRange(2, 1, lastRow - 1, PROCESSING_HEADERS.length).getValues();
  let synced = 0;
  let errors = 0;

  values.forEach((row, index) => {
    const rowNumber = index + 2;
    const warrantNo = normalizeText_(row[2]);
    const targetStatus = mapProcessingWarrantStatus_(row[9]);
    const syncStatus = normalizeText_(row[10]);

    if (!warrantNo) return;
    if (syncStatus === SYNC_STATUS_SYNCED) return;

    try {
      if (targetStatus !== WARRANT_STATUS_PENDING_REVOCATION) {
        throw new Error(`auto update รองรับเฉพาะสถานะ ${WARRANT_STATUS_PENDING_REVOCATION}`);
      }

      const matches = findWarrantByNo_(warrantNo);
      if (matches.length === 0) throw new Error(`ไม่พบหมายจับเลขที่ ${warrantNo}`);
      if (matches.length > 1) throw new Error(`พบเลขที่หมายจับซ้ำในฐานข้อมูล: ${warrantNo}`);

      const found = matches[0];
      const currentStatus = normalizeText_(found.row[found.columns.status]) || WARRANT_STATUS_WANTED;
      let note = "";

      if (currentStatus === WARRANT_STATUS_WANTED) {
        found.sheet.getRange(found.rowNumber, found.columns.status + 1).setValue(WARRANT_STATUS_PENDING_REVOCATION);
      } else if (currentStatus === WARRANT_STATUS_PENDING_REVOCATION) {
        note = "สถานะเป็นสิ้นผลรอเพิกถอนอยู่แล้ว";
      } else if (currentStatus === WARRANT_STATUS_REVOKED) {
        throw new Error("หมายจับเพิกถอนแล้ว ไม่สามารถบันทึกการได้ตัวซ้ำได้");
      } else {
        throw new Error(`พบสถานะที่ไม่รู้จัก: ${currentStatus}`);
      }

      processSheet.getRange(rowNumber, 11).setValue(SYNC_STATUS_SYNCED);
      processSheet.getRange(rowNumber, 12).setValue(nowText());
      processSheet.getRange(rowNumber, 13).setValue(note);
      clearWarrantCache_();
      synced++;
    } catch (err) {
      processSheet.getRange(rowNumber, 11).setValue(SYNC_STATUS_ERROR);
      processSheet.getRange(rowNumber, 12).setValue(nowText());
      processSheet.getRange(rowNumber, 13).setValue(err.message || String(err));
      errors++;
    }
  });

  return { success: errors === 0, synced, errors };
}

function mapProcessingWarrantStatus_(status) {
  const cleanStatus = normalizeText_(status);
  if (!cleanStatus || cleanStatus === PROCESSING_WARRANT_STATUS_PENDING_REVOCATION) {
    return WARRANT_STATUS_PENDING_REVOCATION;
  }
  if (cleanStatus === WARRANT_STATUS_PENDING_REVOCATION) {
    return WARRANT_STATUS_PENDING_REVOCATION;
  }
  return cleanStatus;
}

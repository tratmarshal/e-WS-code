// ========== process.gs ==========
// เธเธณเธชเธฑเนเธเธเธฑเธ”เธเธฒเธฃเธฃเธฒเธขเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธฃเนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃเนเธเนเนเธ

function validateReason_(reason, reasonDetail) {
  const cleanReason = normalizeText_(reason);
  if (REASON_OPTIONS.indexOf(cleanReason) === -1) {
    throw new Error("เน€เธซเธ•เธธเนเธกเนเธ–เธนเธเธ•เนเธญเธ");
  }
  if (cleanReason === REASON_OPTIONS[3] && !normalizeText_(reasonDetail)) {
    throw new Error("เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธซเธ•เธธ");
  }
}

function getNextProcessSeq_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;

  const seqColumn = PROCESSING_HEADERS.length;
  const seqValues = sheet.getRange(2, seqColumn, lastRow - 1, 1).getValues();
  const maxSeq = seqValues.reduce((max, row) => {
    const seq = Number(row[0]);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return maxSeq + 1;
}

function addProcessRecord(userId, payload) {
  return withScriptLock_(() => {
    const selectedWarrants = payload.selectedWarrants || [];
    if (!selectedWarrants.length) throw new Error("เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธกเธฒเธขเธเธฑเธเธญเธขเนเธฒเธเธเนเธญเธข 1 เธฃเธฒเธขเธเธฒเธฃ");

    validateReason_(payload.reason, payload.reasonDetail);

    const sheet = ensureProcessingSheet_();
    let nextSeq = getNextProcessSeq_(sheet);
    const seenWarrantNos = {};
    const rows = [];
    selectedWarrants.forEach(item => {
      const warrantNo = normalizeText_(typeof item === "string" ? item : item.warrantNo);
      if (!warrantNo) throw new Error("เน€เธฅเธเธ—เธตเนเธซเธกเธฒเธขเธเธฑเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ");
      if (seenWarrantNos[warrantNo]) throw new Error(`เน€เธฅเธทเธญเธเน€เธฅเธเธ—เธตเนเธซเธกเธฒเธขเธเธฑเธเธเนเธณ: ${warrantNo}`);
      seenWarrantNos[warrantNo] = true;

      const matches = findWarrantByNo_(warrantNo);
      if (matches.length === 0) throw new Error(`เนเธกเนเธเธเธซเธกเธฒเธขเธเธฑเธเน€เธฅเธเธ—เธตเน ${warrantNo}`);
      if (matches.length > 1) throw new Error(`เธเธเน€เธฅเธเธ—เธตเนเธซเธกเธฒเธขเธเธฑเธเธเนเธณเนเธเธเธฒเธเธเนเธญเธกเธนเธฅ: ${warrantNo}`);

      const found = matches[0];
      const currentStatus = normalizeText_(found.row[found.columns.status]) || WARRANT_STATUS_WANTED;
      if (currentStatus !== WARRANT_STATUS_WANTED) {
        throw new Error(`เธซเธกเธฒเธขเธเธฑเธ ${warrantNo} เธญเธขเธนเนเนเธเธชเธ–เธฒเธเธฐ ${currentStatus} เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฑเธเธ—เธถเธเธเธฒเธฃเนเธ”เนเธ•เธฑเธงเธเนเธณเนเธ”เน`);
      }

      rows.push([
        nowText(),
        userId,
        warrantNo,
        normalizeText_(found.row[found.columns.fullName]),
        normalizeText_(found.row[found.columns.bail]) || "-",
        normalizeText_(payload.submitTo || found.row[found.columns.submitTo]),
        normalizeText_(payload.caseStatus) || CASE_STATUS_SUBMITTED_TO_COURT,
        normalizeText_(payload.reason),
        normalizeText_(payload.reasonDetail),
        PROCESSING_WARRANT_STATUS_PENDING_REVOCATION,
        SYNC_STATUS_PENDING,
        "",
        "",
        nextSeq++
      ]);
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, PROCESSING_HEADERS.length).setValues(rows);

    const syncResult = autoUpdateWarrantDatabase_();
    return { success: true, added: rows.length, sync: syncResult };
  });
}

function getPendingProcess() {
  const sheet = ensureProcessingSheet_();
  const values = sheet.getDataRange().getValues();
  const list = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    list.push({
      rowId: r + 1,
      timestamp: row[0],
      userId: row[1],
      warrantNo: row[2],
      fullName: row[3],
      bail: row[4],
      submitTo: row[5],
      caseStatus: row[6],
      reason: row[7],
      reasonDetail: row[8],
      warrantStatus: row[9],
      syncStatus: row[10] || SYNC_STATUS_PENDING,
      syncedAt: row[11],
      syncError: row[12],
      processSeq: row[13]
    });
  }
  list.reverse();
  return { success: true, data: list };
}

function markProcessRevoked(rowId, userId) {
  return withScriptLock_(() => {
    const processSheet = ensureProcessingSheet_();
    const rowNumber = Number(rowId);
    if (rowNumber < 2 || rowNumber > processSheet.getLastRow()) throw new Error("เนเธกเนเธเธเธฃเธฒเธขเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธฃ");

    const row = processSheet.getRange(rowNumber, 1, 1, PROCESSING_HEADERS.length).getValues()[0];
    const warrantNo = normalizeText_(row[2]);
    const processStatus = mapProcessingWarrantStatus_(row[9]);
    if (processStatus === WARRANT_STATUS_REVOKED) throw new Error("เธซเธกเธฒเธขเธเธฑเธเธเธตเนเธ–เธนเธเธเธฑเธเธ—เธถเธเธงเนเธฒเน€เธเธดเธเธ–เธญเธเนเธฅเนเธง");
    if (processStatus !== WARRANT_STATUS_PENDING_REVOCATION) throw new Error("เน€เธเธดเธเธ–เธญเธเนเธ”เนเน€เธเธเธฒเธฐเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธญเธขเธนเนเธชเธ–เธฒเธเธฐเธชเธดเนเธเธเธฅเธฃเธญเน€เธเธดเธเธ–เธญเธ");

    const matches = findWarrantByNo_(warrantNo);
    if (matches.length === 0) throw new Error(`เนเธกเนเธเธเธซเธกเธฒเธขเธเธฑเธเน€เธฅเธเธ—เธตเน ${warrantNo}`);
    if (matches.length > 1) throw new Error(`เธเธเน€เธฅเธเธ—เธตเนเธซเธกเธฒเธขเธเธฑเธเธเนเธณเนเธเธเธฒเธเธเนเธญเธกเธนเธฅ: ${warrantNo}`);

    const found = matches[0];
    const currentStatus = normalizeText_(found.row[found.columns.status]);
    if (currentStatus === WARRANT_STATUS_REVOKED) throw new Error("เธซเธกเธฒเธขเธเธฑเธเธเธตเนเน€เธเธดเธเธ–เธญเธเนเธฅเนเธง");
    if (currentStatus !== WARRANT_STATUS_PENDING_REVOCATION) throw new Error(`เธชเธ–เธฒเธเธฐเธเธฑเธเธเธธเธเธฑเธเธเธทเธญ ${currentStatus} เธเธถเธเน€เธเธดเธเธ–เธญเธเนเธกเนเนเธ”เน`);

    found.sheet.getRange(found.rowNumber, found.columns.status + 1).setValue(WARRANT_STATUS_REVOKED);
    clearWarrantCache_();
    processSheet.getRange(rowNumber, 7).setValue(CASE_STATUS_WAITING_FORWARD);
    processSheet.getRange(rowNumber, 10).setValue(WARRANT_STATUS_REVOKED);
    processSheet.getRange(rowNumber, 11).setValue(SYNC_STATUS_SYNCED);
    processSheet.getRange(rowNumber, 12).setValue(nowText());
    processSheet.getRange(rowNumber, 13).setValue("");
    return { success: true };
  });
}

function markProcessForwarded(rowId, userId) {
  return withScriptLock_(() => {
    const processSheet = ensureProcessingSheet_();
    const rowNumber = Number(rowId);
    if (rowNumber < 2 || rowNumber > processSheet.getLastRow()) throw new Error("เนเธกเนเธเธเธฃเธฒเธขเธเธฒเธฃเธ”เธณเน€เธเธดเธเธเธฒเธฃ");

    const row = processSheet.getRange(rowNumber, 1, 1, PROCESSING_HEADERS.length).getValues()[0];
    const warrantNo = normalizeText_(row[2]);
    const caseStatus = normalizeText_(row[6]);
    const processStatus = mapProcessingWarrantStatus_(row[9]);

    if (processStatus !== WARRANT_STATUS_REVOKED) {
      throw new Error("เธชเนเธเธ•เนเธญเนเธ”เนเน€เธเธเธฒเธฐเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเน€เธเธดเธเธ–เธญเธเนเธฅเนเธง");
    }
    if (caseStatus === CASE_STATUS_FORWARDED) {
      throw new Error("เธฃเธฒเธขเธเธฒเธฃเธเธตเนเธชเนเธเธ•เนเธญเนเธฅเนเธง");
    }
    if (caseStatus !== CASE_STATUS_WAITING_FORWARD) {
      throw new Error(`เธชเธ–เธฒเธเธฐเธชเธณเธเธงเธเธเธฑเธเธเธธเธเธฑเธเธเธทเธญ ${caseStatus || "-"} เธเธถเธเธชเนเธเธ•เนเธญเนเธกเนเนเธ”เน`);
    }

    const matches = findWarrantByNo_(warrantNo);
    if (matches.length === 0) throw new Error(`เนเธกเนเธเธเธซเธกเธฒเธขเธเธฑเธเน€เธฅเธเธ—เธตเน ${warrantNo}`);
    if (matches.length > 1) throw new Error(`เธเธเน€เธฅเธเธ—เธตเนเธซเธกเธฒเธขเธเธฑเธเธเนเธณเนเธเธเธฒเธเธเนเธญเธกเธนเธฅ: ${warrantNo}`);

    const found = matches[0];
    const currentStatus = normalizeText_(found.row[found.columns.status]);
    if (currentStatus !== WARRANT_STATUS_REVOKED) {
      throw new Error(`เธชเธ–เธฒเธเธฐเธซเธกเธฒเธขเธเธฑเธเธเธฑเธเธเธธเธเธฑเธเธเธทเธญ ${currentStatus || "-"} เธเธถเธเธชเนเธเธ•เนเธญเนเธกเนเนเธ”เน`);
    }

    processSheet.getRange(rowNumber, 7).setValue(CASE_STATUS_FORWARDED);
    processSheet.getRange(rowNumber, 11).setValue(SYNC_STATUS_SYNCED);
    processSheet.getRange(rowNumber, 12).setValue(nowText());
    processSheet.getRange(rowNumber, 13).setValue("");
    return { success: true };
  });
}

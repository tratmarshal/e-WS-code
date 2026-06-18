// ========== log.gs ==========
// บันทึกประวัติการใช้งานของเจ้าหน้าที่

function logActivity(userId, displayName, page, action, authStatus, detail) {
  try {
    const sheet = getOrCreateUpdateSheet_(SHEET_LOGS, LOG_HEADERS);
    sheet.appendRow([
      nowText(),
      userId || "",
      displayName || "",
      page || "unknown",
      action || "",
      authStatus || "",
      detail || ""
    ]);
  } catch (err) {
    console.error("logActivity failed", err);
  }
}


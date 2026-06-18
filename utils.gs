// ========== utils.gs ==========
// ฟังก์ชันช่วยเหลือภายใน backend

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function nowText() {
  return Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
}

function normalizeText_(value) {
  return String(value == null ? "" : value).trim();
}

function indexOfHeader(headers, possibleNames, fallbackIndex) {
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeText_(headers[i]);
    for (let name of possibleNames) {
      if (h === name || h.indexOf(name) !== -1) return i;
    }
  }
  return fallbackIndex;
}

// ========== cache.gs ==========
// ชั้นอ่านข้อมูลเร็วภายใน backend

const WARRANT_SEARCH_CACHE_PREFIX = "warrantSearch:v1:";
const WARRANT_CACHE_VERSION_KEY = "warrantCacheVersion";
const WARRANT_CACHE_TTL_SECONDS = 300;

function getCachedWarrantSearch_(searchType, term) {
  const cache = CacheService.getScriptCache();
  const cacheKey = buildWarrantSearchCacheKey_(searchType, term);
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      cache.remove(cacheKey);
    }
  }

  const results = loadWarrantSearchFromSheets_(searchType, term);
  try {
    cache.put(cacheKey, JSON.stringify(results), WARRANT_CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn("warrant search cache skipped", err);
  }
  return results;
}

function clearWarrantCache_() {
  const props = PropertiesService.getScriptProperties();
  const version = Number(props.getProperty(WARRANT_CACHE_VERSION_KEY)) || 1;
  props.setProperty(WARRANT_CACHE_VERSION_KEY, String(version + 1));
}

function buildWarrantSearchCacheKey_(searchType, term) {
  const props = PropertiesService.getScriptProperties();
  const version = props.getProperty(WARRANT_CACHE_VERSION_KEY) || "1";
  const rawKey = version + ":" + searchType + ":" + term;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawKey);
  const encoded = Utilities.base64EncodeWebSafe(digest).replace(/=+$/, "");
  return WARRANT_SEARCH_CACHE_PREFIX + encoded;
}

function loadWarrantSearchFromSheets_(searchType, term) {
  const lowerTerm = term.toLowerCase();
  const results = [];
  getWarrantSheets_().forEach(sheet => {
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return;
    const columns = getWarrantColumnMap_(values[0]);

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowId13 = normalizeText_(row[columns.id13]);
      const rowName = normalizeText_(row[columns.fullName]);
      const match = searchType === "id13"
        ? rowId13 === term
        : rowName.toLowerCase().indexOf(lowerTerm) !== -1;

      if (match) {
        results.push({
          sheetName: sheet.getName(),
          rowNumber: r + 1,
          warrantNo: normalizeText_(row[columns.warrantNo]),
          fullName: rowName,
          id13: rowId13,
          bail: normalizeText_(row[columns.bail]),
          submitTo: normalizeText_(row[columns.submitTo]),
          status: normalizeText_(row[columns.status]) || WARRANT_STATUS_WANTED,
          charge: normalizeText_(row[columns.charge]),
          blackCaseNo: normalizeText_(row[columns.blackCaseNo]),
          redCaseNo: normalizeText_(row[columns.redCaseNo])
        });
      }
    }
  });
  return results;
}

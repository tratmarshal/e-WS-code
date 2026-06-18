// ========== search.gs ==========
// คำสั่งค้นหาหมายจับ

function searchWarrant(searchType, keyword) {
  if (searchType !== "id13" && searchType !== "name") {
    throw new Error("ประเภทการค้นหาไม่ถูกต้อง");
  }

  const term = normalizeText_(keyword);
  if (!term) return { success: true, data: [] };

  return { success: true, data: getCachedWarrantSearch_(searchType, term) };
}

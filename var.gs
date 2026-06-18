// ========== var.gs ==========
// ตั้งค่าระบบหลัก

const LIFF_CHANNEL_ID = "2010276759-IZoVxJjH";

// ใส่ LINE User ID ของเจ้าหน้าที่ตำรวจศาล 2 คน
const AUTHORIZED_USERS = [
  "...", // เจ้าหน้าที่คนที่ 1
  "..."  // เจ้าหน้าที่คนที่ 2
];

// ID ของ Google Sheets แต่ละฐานข้อมูล
const WARRANT_DB_ID = "...";
const UPDATE_DB_ID = "...";

const SHEET_LOGS = "log";
const SHEET_PROCESSING = "processing";
const WARRANT_SHEET_START = 55;
const WARRANT_SHEET_END = 69;

const WARRANT_STATUS_WANTED = "ต้องการตัว";
const WARRANT_STATUS_PENDING_REVOCATION = "สิ้นผลรอเพิกถอน";
const WARRANT_STATUS_REVOKED = "เพิกถอน";

const CASE_STATUS_PENDING = "รอดำเนินการ";
const CASE_STATUS_SUBMITTED_TO_COURT = "เสนอศาล";
const CASE_STATUS_WAITING_FORWARD = "รอส่งต่อ";
const CASE_STATUS_FORWARDED = "ส่งต่อแล้ว";

const PROCESSING_WARRANT_STATUS_PENDING_REVOCATION = "รอเพิกถอน";

const REASON_OPTIONS = ["มอบตัว", "ตำรวจจับ", "อยู่เรือนจำอื่น", "อื่น ๆ"];

const SYNC_STATUS_PENDING = "pending";
const SYNC_STATUS_SYNCED = "synced";
const SYNC_STATUS_ERROR = "error";

const LOCK_WAIT_MS = 30000;

const PROCESSING_HEADERS = [
  "วัน-เวลา",
  "LINEUSERID",
  "เลขที่หมายจับ",
  "ชื่อสกุล",
  "ประกัน",
  "เสนอท่าน",
  "สถานะสำนวน",
  "เหตุ",
  "รายละเอียดเหตุ",
  "สถานะหมายจับ",
  "syncStatus",
  "syncedAt",
  "syncError",
  "ลำดับรายการแก้ไข"
];

const LOG_HEADERS = [
  "วัน-เวลา",
  "LINEUSERID",
  "ชื่อ LINE",
  "หน้าเว็บ",
  "Action",
  "สถานะสิทธิ์",
  "รายละเอียด"
];

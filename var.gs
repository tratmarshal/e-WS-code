// ========== var.gs ==========
// ตั้งค่าระบบหลัก

// ใส่ LINE User ID ของเจ้าหน้าที่ตำรวจศาล 2 คน
const AUTHORIZED_USERS = [
  "Udfa6e5b6d090d77b835483f6bd683d6f", // ศาล
  "Uc5330e8eee2ff8ab298c7019ef377965"  // หมอก
];

// ID ของ Google Sheets แต่ละฐานข้อมูล
const WARRANT_DB_ID = "1sq8GyDDiqS2U989TpcTlMyJ5P9gtrRTgbJjcQHtEOB4";
const UPDATE_DB_ID = "1mP3tver14Tp0wYd9xkk4Lh5Mv_g39UPy06juu8t_Dgk";

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

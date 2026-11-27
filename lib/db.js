import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { numOf } from './utils.js';

export const dbFile = fileURLToPath(new URL('../database/db.json', import.meta.url));
const dbDir = path.dirname(dbFile);
const dbTmp = dbFile + '.tmp';

export const db = { users: {}, groups: {}, settings: {} };

try {
  if (fs.existsSync(dbFile)) {
    Object.assign(db, JSON.parse(fs.readFileSync(dbFile, 'utf8')));
  }
} catch (e) {
  console.error('⚠️ خطأ في قراءة ملف قاعدة البيانات، سيتم البدء بقاعدة جديدة:', e.message);
}

// تهيئة القيم الافتراضية
db.users ??= {};
db.groups ??= {};
db.settings ??= {};
db.settings.banned ??= [];
db.settings.mode = 'public'; // فرض الوضع العام دائماً عند بدء التشغيل لضمان استجابة البوت للجميع
db.settings.disabled ??= [];
db.settings.market ??= {};

let timer;
export const saveNow = () => {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    const content = JSON.stringify(db, null, 2);
    // كتابة ذرية (Atomic Write) لتجنب تلف البيانات عند انقطاع الكهرباء أو إعادة التشغيل المفاجئة
    fs.writeFileSync(dbTmp, content, 'utf8');
    fs.renameSync(dbTmp, dbFile);
  } catch (e) {
    console.error('❌ خطأ في حفظ قاعدة البيانات:', e.message);
  }
};

export const save = () => {
  clearTimeout(timer);
  timer = setTimeout(saveNow, 1000);
};

process.on('exit', saveNow);
process.on('SIGINT', () => {
  saveNow();
  process.exit(0);
});
process.on('SIGTERM', () => {
  saveNow();
  process.exit(0);
});

export function user(jid) {
  const k = numOf(jid);
  const u = (db.users[k] ??= {});
  u.money ??= 100;
  u.bank ??= 0;
  u.xp ??= 0;
  u.level ??= 1;
  u.msgs ??= 0;
  u.bio ??= '';
  u.nick ??= '';
  u.inv ??= {};
  u.stocks ??= {};
  u.cd ??= {};
  u.afk ??= null;
  u.married ??= null;
  u.birthday ??= null;
  u.job ??= null;
  u.pet ??= null;
  return u;
}

export function group(jid) {
  const g = (db.groups[jid] ??= {});
  g.welcome ??= false;
  g.bye ??= false;
  g.welcomeMsg ??= '';
  g.byeMsg ??= '';
  g.antilink ??= false;
  g.rules ??= '';
  g.badwords ??= [];
  g.games ??= true;
  g.muted ??= [];
  g.banned ??= [];
  g.warns ??= {};
  g.notes ??= [];
  return g;
}

// يرجّع الوقت المتبقي (ms) لو لسه في انتظار، أو 0 ويبدأ العد من جديد
export function cooldown(u, key, ms) {
  u.cd ??= {};
  const left = (u.cd[key] || 0) + ms - Date.now();
  if (left > 0) return left;
  u.cd[key] = Date.now();
  return 0;
}

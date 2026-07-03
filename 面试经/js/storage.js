/* ===========================================
   storage.js — 数据持久化层
   localStorage (结构化数据) + IndexedDB (文件)
   =========================================== */

const KEYS = {
  SETTINGS:        'mianpu_settings',
  ACTIVE_RESUME:   'mianpu_active_resume',
  RESUMES:         'mianpu_resumes',
  ANALYSES:        'mianpu_analyses',
  ACTIVE_ANALYSIS: 'mianpu_active_analysis',
  QUESTION_BANKS:  'mianpu_question_banks',
  QB_STATUS:       'mianpu_qb_status',
  DATA_VERSION:    'mianpu_data_version'
};

const STORAGE = {
  get(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  getAllKeys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('mianpu_'))
      .reduce((acc, k) => { acc[k] = this.get(k); return acc; }, {});
  }
};

const DB = {
  _db: null,
  async _open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('MianpuDB', 1);
      r.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
      r.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      r.onerror = (e) => reject(e.target.error);
    });
  },
  async saveFile(id, blob) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put({ id, blob, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },
  async getFile(id) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const r = tx.objectStore('files').get(id);
      r.onsuccess = () => resolve(r.result ? r.result.blob : null);
      r.onerror = (e) => reject(e.target.error);
    });
  },
  async deleteFile(id) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }
};

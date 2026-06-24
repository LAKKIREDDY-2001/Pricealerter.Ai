import Database from "better-sqlite3";
import crypto from "crypto";

const db = new Database("database.db");

// Initialize SQLite schema if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    username TEXT,
    email TEXT,
    password TEXT,
    phone TEXT,
    subscription TEXT,
    userCode TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS trackers (
    id TEXT PRIMARY KEY,
    userId TEXT,
    url TEXT,
    productName TEXT,
    productImage TEXT,
    currentPrice REAL,
    targetPrice REAL,
    currency TEXT,
    currencySymbol TEXT,
    status TEXT,
    trackerCode TEXT,
    lastCheckedAt TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    trackerId TEXT,
    price REAL,
    recordedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT,
    details TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    plan TEXT,
    utr TEXT,
    amount REAL,
    status TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS oracle_predictions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    format TEXT,
    bowlerType TEXT,
    batsmanStyle TEXT,
    currentOver TEXT,
    runsNeeded TEXT,
    matchStage TEXT,
    matchSituation TEXT,
    predictedOutcome TEXT,
    confidence REAL,
    aiAnalysis TEXT,
    timestamp TEXT
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN password TEXT");
} catch (e) {
  // Column already exists, ignore
}

console.log("✅ Local SQLite database schema initialized successfully.");

// Fallback fdb implementation that matches firestore admin chain interface
export class SQLiteFirestoreMock {
  collection(colName: string) {
    return new CollectionQuery(colName);
  }
}

class CollectionQuery {
  private colName: string;
  private whereClause?: { field: string; op: string; value: any };

  constructor(colName: string) {
    this.colName = colName;
  }

  where(field: string, op: string, value: any) {
    this.whereClause = { field, op, value };
    return this;
  }

  doc(id: string) {
    return new DocumentQuery(this.colName, id);
  }

  async add(data: any) {
    const id = crypto.randomUUID();
    const keys = ["id", ...Object.keys(data)];
    const values = [id, ...Object.values(data)];
    const placeholders = keys.map(() => "?").join(", ");

    const stmt = db.prepare(`
      INSERT INTO ${this.colName} (${keys.join(", ")})
      VALUES (${placeholders})
    `);

    stmt.run(...values.map(v => typeof v === "object" && v !== null ? JSON.stringify(v) : v));
    return { id };
  }

  async get() {
    let queryStr = `SELECT * FROM ${this.colName}`;
    const params: any[] = [];

    if (this.whereClause) {
      queryStr += ` WHERE ${this.whereClause.field} = ?`;
      params.push(this.whereClause.value);
    }

    const rows = db.prepare(queryStr).all(...params);
    const docs = rows.map((row: any) => ({
      id: row.userId || row.id,
      exists: true,
      data: () => {
        const { userId, id, ...rest } = row;
        return { ...rest };
      }
    }));

    const result = {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach(callback: (doc: any) => void) {
        docs.forEach(callback);
      }
    };

    return result;
  }
}

class DocumentQuery {
  private colName: string;
  private id: string;

  constructor(colName: string, id: string) {
    this.colName = colName;
    this.id = id;
  }

  async get() {
    const pk = this.colName === "users" ? "userId" : "id";
    const row = db.prepare(`SELECT * FROM ${this.colName} WHERE ${pk} = ?`).get(this.id) as any;

    if (!row) {
      return {
        exists: false,
        data: () => undefined
      };
    }

    return {
      exists: true,
      id: this.id,
      data: () => {
        const { userId, id, ...rest } = row;
        return { ...rest };
      }
    };
  }

  async set(data: any) {
    const pk = this.colName === "users" ? "userId" : "id";
    const existing = db.prepare(`SELECT 1 FROM ${this.colName} WHERE ${pk} = ?`).get(this.id);

    if (existing) {
      await this.update(data);
    } else {
      const keys = [pk, ...Object.keys(data)];
      const values = [this.id, ...Object.values(data)];
      const placeholders = keys.map(() => "?").join(", ");

      const stmt = db.prepare(`
        INSERT INTO ${this.colName} (${keys.join(", ")})
        VALUES (${placeholders})
      `);
      stmt.run(...values.map(v => typeof v === "object" && v !== null ? JSON.stringify(v) : v));
    }
  }

  async update(data: any) {
    const pk = this.colName === "users" ? "userId" : "id";
    const setClauses: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, val]) => {
      setClauses.push(`${key} = ?`);
      values.push(typeof val === "object" && val !== null ? JSON.stringify(val) : val);
    });

    values.push(this.id);

    const stmt = db.prepare(`
      UPDATE ${this.colName}
      SET ${setClauses.join(", ")}
      WHERE ${pk} = ?
    `);
    stmt.run(...values);
  }

  async delete() {
    const pk = this.colName === "users" ? "userId" : "id";
    const stmt = db.prepare(`DELETE FROM ${this.colName} WHERE ${pk} = ?`);
    stmt.run(this.id);
  }
}

export function getSqliteDb() {
  return db;
}

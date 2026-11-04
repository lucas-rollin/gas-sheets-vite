/**
 * @core Generic Google Sheets CRUD engine. Avoid editing.
 */

import type { DbRecord } from '../types/core';
export type { DbRecord };

export function createDb(schema: Record<string, string[]>) {
  function dbSheet(table: string): GoogleAppsScript.Spreadsheet.Sheet {
    if (!schema[table]) throw new Error(`Unknown table "${table}". Add it to schema.`);
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Set the SPREADSHEET_ID script property.');
    let sheet = ss.getSheetByName(table);
    if (!sheet) {
      sheet = ss.insertSheet(table);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, schema[table].length).setValues([schema[table]]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  function dbToObject<T>(headers: string[], row: unknown[]): T {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] instanceof Date ? (row[i] as Date).toISOString() : row[i];
    });
    return obj as T;
  }

  function dbLock<T>(fn: () => T): T {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  }

  return {
    list<T extends DbRecord>(table: string): T[] {
      const values = dbSheet(table).getDataRange().getValues();
      const headers = values[0] as string[];
      return values
        .slice(1)
        .filter((row) => row.some((c) => c !== ''))
        .map((row) => dbToObject<T>(headers, row));
    },

    get<T extends DbRecord>(table: string, id: string): T | null {
      return this.list<T>(table).find((r) => r.id === id) || null;
    },

    insert<T extends DbRecord>(table: string, data: Record<string, unknown>): T {
      return dbLock(() => {
        const now = new Date().toISOString();
        const record: Record<string, unknown> = {
          ...data,
          id: Utilities.getUuid(),
          createdAt: now,
          updatedAt: now,
        };
        dbSheet(table).appendRow(
          schema[table].map((col) => (record[col] === undefined ? '' : (record[col] as any)))
        );
        return record as unknown as T;
      });
    },

    update<T extends DbRecord>(table: string, id: string, patch: Record<string, unknown>): T {
      return dbLock(() => {
        const sheet = dbSheet(table);
        const values = sheet.getDataRange().getValues();
        const headers = values[0] as string[];
        const idCol = headers.indexOf('id');
        for (let i = 1; i < values.length; i++) {
          if (values[i][idCol] === id) {
            const current = dbToObject<Record<string, unknown>>(headers, values[i]);
            const updated: Record<string, unknown> = {
              ...current,
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            sheet.getRange(i + 1, 1, 1, headers.length).setValues([
              headers.map((h) => (updated[h] === undefined ? '' : (updated[h] as any))),
            ]);
            return updated as unknown as T;
          }
        }
        throw new Error(`${table}: record ${id} not found`);
      });
    },

    remove(table: string, id: string): void {
      dbLock(() => {
        const sheet = dbSheet(table);
        const values = sheet.getDataRange().getValues();
        const idCol = (values[0] as string[]).indexOf('id');
        for (let i = 1; i < values.length; i++) {
          if (values[i][idCol] === id) {
            sheet.deleteRow(i + 1);
            return;
          }
        }
        throw new Error(`${table}: record ${id} not found`);
      });
    },
  };
}

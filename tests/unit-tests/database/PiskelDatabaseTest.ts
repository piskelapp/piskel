import {
  PiskelDatabase,
  type SavedPiskelInfo
} from "../../../src/js/database/PiskelDatabase";
import { MigrateLocalStorageToIndexedDb } from "../../../src/js/database/migrate/MigrateLocalStorageToIndexedDb";
import { assertDefined } from "../../../src/js/utils/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type PiskelArgs = [string, string, number, string];

describe("PiskelDatabase test", function () {
  // Test object.
  let piskelDatabase: PiskelDatabase;

  const _toSnapshot = function (
    session_id: string,
    name: string,
    description: string,
    date: number,
    serialized: string
  ) {
    return {
      session_id: session_id,
      name: name,
      description: description,
      date: date,
      serialized: serialized
    };
  };

  const _checkPiskel = function (
    maybeActual: SavedPiskelInfo | undefined,
    expected: PiskelArgs
  ) {
    const actual = assertDefined(maybeActual, "actual");
    expect(actual.name).toBe(expected[0]);
    expect(actual.description).toBe(expected[1]);
    expect(actual.date).toBe(expected[2]);
    expect(Reflect.get(actual, "serialized")).toBe(expected[3]);
  };

  const _addPiskels = function (piskels: PiskelArgs[]) {
    const _add = function (index: number): Promise<unknown> {
      const piskelData = piskels[index];
      return piskelDatabase.create(...piskelData).then(function () {
        if (piskels[index + 1]) {
          return _add(index + 1);
        } else {
          return Promise.resolve();
        }
      });
    };

    return _add(0);
  };

  beforeEach(
    () =>
      new Promise<void>((done) => {
        // Mock the migration script.
        vi.spyOn(MigrateLocalStorageToIndexedDb, "migrate").mockImplementation(
          () => Promise.resolve()
        );

        // Drop the database before each test.
        const dbName = PiskelDatabase.DB_NAME;
        const req = window.indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => done();
      })
  );

  afterEach(function () {
    // Close the database if it was still open.
    if (piskelDatabase && piskelDatabase.db) {
      piskelDatabase.db.close();
    }
  });

  it("initializes the DB and returns a promise", () =>
    new Promise<void>((done) => {
      piskelDatabase = new PiskelDatabase();
      piskelDatabase.init().then(() => done());
    }));

  it("can add a piskel and retrieve it", () =>
    new Promise<void>((done) => {
      piskelDatabase = new PiskelDatabase();
      piskelDatabase
        .init()
        .then(function (db) {
          return piskelDatabase.create("name", "desc", 0, "serialized");
        })
        .then(function () {
          return piskelDatabase.get("name");
        })
        .then(function (piskel) {
          expect(assertDefined(piskel, "piskel").name).toBe("name");
          expect(assertDefined(piskel, "piskel").description).toBe("desc");
          expect(assertDefined(piskel, "piskel").date).toBe(0);
          expect(assertDefined(piskel, "piskel").serialized).toBe("serialized");
          done();
        });
    }));

  it("can delete piskel by name", () =>
    new Promise<void>((done) => {
      const piskels: PiskelArgs[] = [
        ["n1", "d1", 10, "s1"],
        ["n2", "d2", 20, "s2"],
        ["n3", "d3", 30, "s3"]
      ];

      piskelDatabase = new PiskelDatabase();
      piskelDatabase
        .init()
        .then(function (db) {
          return _addPiskels(piskels);
        })
        .then(function () {
          return piskelDatabase.delete("n2");
        })
        .then(function () {
          return piskelDatabase.get("n1");
        })
        .then(function (piskelData) {
          _checkPiskel(piskelData, piskels[0]);
          return piskelDatabase.get("n3");
        })
        .then(function (piskelData) {
          _checkPiskel(piskelData, piskels[2]);
          return piskelDatabase.get("n2");
        })
        .then(function (piskelData) {
          expect(piskelData).toBe(undefined);
          done();
        });
    }));

  it("can list piskels", () =>
    new Promise<void>((done) => {
      const piskels: PiskelArgs[] = [
        ["n1", "d1", 10, "s1"],
        ["n2", "d2", 20, "s2"],
        ["n3", "d3", 30, "s3"]
      ];

      piskelDatabase = new PiskelDatabase();
      piskelDatabase
        .init()
        .then(function (db) {
          return _addPiskels(piskels);
        })
        .then(function () {
          return piskelDatabase.list();
        })
        .then(function (piskels) {
          expect(piskels.length).toBe(3);
          piskels.forEach(function (piskelData) {
            expect(piskelData.name).toMatch(/n[1-3]/);
            expect(piskelData.description).toMatch(/d[1-3]/);
            expect(piskelData.date).toBeDefined();
            expect(Reflect.get(piskelData, "serialized")).not.toBeDefined();
          });
          done();
        });
    }));

  it("can update piskel with same name", () =>
    new Promise<void>((done) => {
      const piskels: PiskelArgs[] = [
        ["n1", "d1", 10, "s1"],
        ["n2", "d2", 20, "s2"],
        ["n3", "d3", 30, "s3"]
      ];

      piskelDatabase = new PiskelDatabase();
      piskelDatabase
        .init()
        .then(function (db) {
          return _addPiskels(piskels);
        })
        .then(function () {
          return piskelDatabase.update("n2", "d2_updated", 40, "s2_updated");
        })
        .then(function (piskels) {
          return piskelDatabase.list();
        })
        .then(function (piskels) {
          expect(piskels.length).toBe(3);
          const p2 = piskels.filter(function (p: { name: string }) {
            return p.name === "n2";
          })[0];
          expect(p2.name).toBe("n2");
          expect(p2.description).toBe("d2_updated");
          expect(p2.date).toBe(40);

          return piskelDatabase.get("n2");
        })
        .then(function (piskel) {
          _checkPiskel(piskel, ["n2", "d2_updated", 40, "s2_updated"]);
          done();
        });
    }));
});

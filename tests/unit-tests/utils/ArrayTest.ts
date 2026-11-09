import { ArrayUtils } from "../../../src/js/utils/Array";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Array utils", function () {
  beforeEach(function () {});
  afterEach(function () {});

  it("chunks correctly", function () {
    // when
    const array = [1, 2, 3, 4];

    // then
    let chunks = ArrayUtils.chunk(array, 1);

    // verify
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual([1, 2, 3, 4]);

    // then
    chunks = ArrayUtils.chunk(array, 2);

    // verify
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toEqual([1, 2]);
    expect(chunks[1]).toEqual([3, 4]);

    // then
    chunks = ArrayUtils.chunk(array, 3);

    // verify
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toEqual([1]);
    expect(chunks[1]).toEqual([2]);
    expect(chunks[2]).toEqual([3, 4]);

    // then
    chunks = ArrayUtils.chunk(array, 4);

    // verify
    expect(chunks.length).toBe(4);
    expect(chunks[0]).toEqual([1]);
    expect(chunks[1]).toEqual([2]);
    expect(chunks[2]).toEqual([3]);
    expect(chunks[3]).toEqual([4]);

    // then
    chunks = ArrayUtils.chunk(array, 5);

    // verify
    expect(chunks.length).toBe(4);
    expect(chunks[0]).toEqual([1]);
    expect(chunks[1]).toEqual([2]);
    expect(chunks[2]).toEqual([3]);
    expect(chunks[3]).toEqual([4]);

    // then
    chunks = ArrayUtils.chunk(array, 0);

    // verify
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual([1, 2, 3, 4]);

    // then
    chunks = ArrayUtils.chunk(array, -1);

    // verify
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toEqual([1, 2, 3, 4]);
  });
});

import test, { expect } from '../../fixtures';
import { openEditor, openExportSettingsPanel, setPiskelFromGrid, testId } from "../../testutils";
import fs from 'fs/promises';

/**
 * Expected C file output for a 2x2 sprite named "test" with 1 frame (R G / B T):
 *
 * #include <stdint.h>
 *
 * #define TEST_FRAME_COUNT 1
 * #define TEST_FRAME_WIDTH 2
 * #define TEST_FRAME_HEIGHT 2
 *
 * /​* Piskel data for "test" *​/
 *
 * static const uint32_t test_data[1][4] = {
 * {
 * 0xff0000ff, 0xff00ff00
 * 0xffff0000, 0x00000000
 * }
 * };
 *
 * Pixel format is ABGR: 0xAABBGGRR
 */

interface CFileData {
  include: string;
  defines: { name: string; value: string }[];
  comment: string;
  declaration: string;
  frames: string[][];
}

/** Parse a Piskel C file export into its structural parts */
function parseCFile(content: string): CFileData {
  const lines = content.split('\n');

  const include = lines[0];

  // Parse #define lines
  const defines = lines
    .filter(l => l.startsWith('#define '))
    .map(l => {
      const parts = l.replace('#define ', '').split(' ');
      return { name: parts[0], value: parts.slice(1).join(' ') };
    });

  // Parse comment
  const comment = lines.find(l => l.startsWith('/*')) ?? '';

  // Parse declaration line (static const uint32_t ...)
  const declaration = lines.find(l => l.startsWith('static const')) ?? '';

  // Parse pixel frames — each frame is between { and }
  const frames: string[][] = [];
  const frameRegex = /\{([^}]+)\}/g;
  let match;
  while ((match = frameRegex.exec(content)) !== null) {
    const pixels = match[1].match(/0x[0-9a-f]{8}/g);
    if (pixels) {
      frames.push(pixels);
    }
  }

  return { include, defines, comment, declaration, frames };
}

/** Verify C file structure matches expected sprite metadata */
function expectCFileStructure(data: CFileData, spriteName: string, frameCount: number, width: number, height: number) {
  expect(data.include).toBe('#include <stdint.h>');

  // Verify all 3 defines with exact name and value
  const prefix = spriteName.toUpperCase();
  const defineMap = Object.fromEntries(data.defines.map(d => [d.name, d.value]));
  expect(defineMap[`${prefix}_FRAME_COUNT`]).toBe(String(frameCount));
  expect(defineMap[`${prefix}_FRAME_WIDTH`]).toBe(String(width));
  expect(defineMap[`${prefix}_FRAME_HEIGHT`]).toBe(String(height));

  // Verify declaration line
  const lower = spriteName.toLowerCase();
  expect(data.declaration).toBe(
    `static const uint32_t ${lower}_data[${frameCount}][${width * height}] = {`
  );

  // Verify comment references sprite name
  expect(data.comment).toBe(`/* Piskel data for "${spriteName}" */`);

  // Verify frame count and pixel count per frame
  expect(data.frames.length).toBe(frameCount);
  for (const frame of data.frames) {
    expect(frame.length).toBe(width * height);
  }
}

test.describe('C file export', () => {

  test('should export a valid C file with correct structure and pixels', async ({ page }) => {
    await openEditor(page);
    // R G / B T
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="misc"]');
    await expect(page.locator('.export-panel-misc')).toBeAttached();

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'c-file-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    expect(download.suggestedFilename()).toBe('test.c');

    const content = await fs.readFile(path, 'utf-8');
    const cFile = parseCFile(content);

    expectCFileStructure(cFile, 'test', 1, 2, 2);

    // C format is ABGR hex: 0xAABBGGRR
    // Grid: R G / B T → pixels in row-major order
    expect(cFile.frames[0]).toEqual([
      '0xff0000ff', '0xff00ff00',  // row 0: Red, Green
      '0xffff0000', '0x00000000',  // row 1: Blue, Transparent
    ]);
  });

  test('should export C file with multiple frames', async ({ page }) => {
    await openEditor(page);
    // Frame 0: R T / T R
    await setPiskelFromGrid(page, [["R", "T"], ["T", "R"]]);

    // Add frame 1
    await page.keyboard.press('n');

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="misc"]');
    await expect(page.locator('.export-panel-misc')).toBeAttached();

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'c-file-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const content = await fs.readFile(path, 'utf-8');
    const cFile = parseCFile(content);

    expectCFileStructure(cFile, 'test', 2, 2, 2);

    expect(cFile.frames[0]).toEqual([
      '0xff0000ff', '0x00000000',  // row 0: Red, Transparent
      '0x00000000', '0xff0000ff',  // row 1: Transparent, Red
    ]);
    expect(cFile.frames[1]).toEqual([
      '0x00000000', '0x00000000',
      '0x00000000', '0x00000000',
    ]);
  });
});

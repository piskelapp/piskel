import test, { expect, Page } from "@playwright/test";
import {
  assertColorRows,
  assertNoPenSizeLabel,
  assertPenSizeLabel,
  pressRepeatedly,
  openEditor,
  clickTool,
  drawAtPixel,
  dragBetweenPixels,
  getSelectedPenSize,
  getPenSizeButton,
  gridFromRows,
  openEditorInNewPage,
  readPixelRows,
  setPenSize,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  undo,
  waitForGrid,
} from "../../testutils";

const EMPTY = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

const FULL = [
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
];

test.describe('Pen size UI', () => {

  test('should default to pen size 1', { tag: ['@drawing-tools.pen-size-picker'] }, async ({ page }) => {
    await openEditor(page);
    expect(await getSelectedPenSize(page)).toBe(1);
    await expect(getPenSizeButton(page, 1)).toHaveClass(/selected/);
  });

  test('should change pen size by clicking size option', { tag: ['@drawing-tools.pen-size-picker'] }, async ({ page }) => {
    await openEditor(page);

    await getPenSizeButton(page, 2).click();
    expect(await getSelectedPenSize(page)).toBe(2);
    await expect(getPenSizeButton(page, 2)).toHaveClass(/selected/);
    await expect(getPenSizeButton(page, 1)).not.toHaveClass(/selected/);

    await getPenSizeButton(page, 3).click();
    expect(await getSelectedPenSize(page)).toBe(3);
    await expect(getPenSizeButton(page, 3)).toHaveClass(/selected/);

    await getPenSizeButton(page, 4).click();
    expect(await getSelectedPenSize(page)).toBe(4);
    await expect(getPenSizeButton(page, 4)).toHaveClass(/selected/);
  });

  test('should change pen size with keyboard shortcuts', { tag: ['@drawing-tools.pen-size-shortcuts'] }, async ({ page }) => {
    await openEditor(page);

    expect(await getSelectedPenSize(page)).toBe(1);

    // Increase with ]
    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(2);

    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(3);

    // Decrease with [
    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(2);
  });

  test('should remember the size in a new session', { tag: ['@drawing-tools.pen-size-saved'] }, async ({ page }) => {
    // Pick a size.
    await openEditor(page);
    await getPenSizeButton(page, 3).click();

    // A new session starts with that size.
    const newSession = await openEditorInNewPage(page);
    expect(await getSelectedPenSize(newSession)).toBe(3);

    // The size is really used.
    await setPiskelFromGrid(newSession, gridFromRows(EMPTY));
    await waitForGrid(newSession, 10, 10, EMPTY);
    await clickTool(newSession, 'tool-pen');
    await drawAtPixel(newSession, 1, 1);
    await waitForGrid(newSession, 10, 10, [
      'XXX.......',
      'XXX.......',
      'XXX.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('should remember a size above 4 in a new session', { tag: ['@drawing-tools.pen-size-saved'] }, async ({ page }) => {
    await openEditor(page);

    // Reach size 5 with the keyboard, which the picker can't show on its own.
    await getPenSizeButton(page, 4).click();
    await page.keyboard.press(']');

    // In a new session, the pen draws at size 5.
    const newSession = await openEditorInNewPage(page);
    await setPiskelFromGrid(newSession, gridFromRows(EMPTY));
    await waitForGrid(newSession, 10, 10, EMPTY);
    await clickTool(newSession, 'tool-pen');
    await drawAtPixel(newSession, 2, 2);
    await waitForGrid(newSession, 10, 10, [
      'XXXXX.....',
      'XXXXX.....',
      'XXXXX.....',
      'XXXXX.....',
      'XXXXX.....',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('should not go below size 1 with the keyboard', { tag: ['@drawing-tools.pen-size-shortcuts'] }, async ({ page }) => {
    await openEditor(page);

    // Try to decrease below 1.
    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(1);
    await assertNoPenSizeLabel(page);
  });

  test('should show sizes above 4 as a label on the size 4 option, up to 32', { tag: ['@drawing-tools.pen-size-shortcuts'] }, async ({ page }) => {
    await openEditor(page);

    // Size 4 has its own option, without a label.
    await getPenSizeButton(page, 4).click();
    expect(await getSelectedPenSize(page)).toBe(4);
    await assertNoPenSizeLabel(page);

    // Size 5 stays on that option, with its size as a label.
    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(4);
    await assertPenSizeLabel(page, 5);

    // Go up to 32, and try to go past it.
    await pressRepeatedly(page, ']', 27);
    await assertPenSizeLabel(page, 32);
    await pressRepeatedly(page, ']', 2);
    await assertPenSizeLabel(page, 32);

    // Coming back under 5 removes the label.
    await pressRepeatedly(page, '[', 28);
    expect(await getSelectedPenSize(page)).toBe(4);
    await assertNoPenSizeLabel(page);
  });

  // ─── Pen size per tool ────────────────────────────────────────

  // A click at (4,4): a square centered on the pixel for an odd size, and with the
  // pixel at the bottom right of the center for an even size. Sizes above 4 are
  // reached with the ] shortcut.
  const penSquares = [
    {
      size: 1,
      rows: [
        '..........',
        '..........',
        '..........',
        '..........',
        '....X.....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 2,
      rows: [
        '..........',
        '..........',
        '..........',
        '...XX.....',
        '...XX.....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 3,
      rows: [
        '..........',
        '..........',
        '..........',
        '...XXX....',
        '...XXX....',
        '...XXX....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 4,
      rows: [
        '..........',
        '..........',
        '..XXXX....',
        '..XXXX....',
        '..XXXX....',
        '..XXXX....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 5,
      rows: [
        '..........',
        '..........',
        '..XXXXX...',
        '..XXXXX...',
        '..XXXXX...',
        '..XXXXX...',
        '..XXXXX...',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 8,
      rows: [
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        'XXXXXXXX..',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { size, rows } of penSquares) {
    test(`pen at size ${size} should paint a ${size}x${size} square`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape', ...(size > 4 ? ['@drawing-tools.pen-size-shortcuts'] : [])],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await clickTool(page, 'tool-pen');
      await setPenSize(page, size);

      await drawAtPixel(page, 4, 4);
      await waitForGrid(page, 10, 10, rows);
    });
  }

  // A click at (4,4) on a full sprite.
  const eraserSquares = [
    {
      size: 1,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXX.XXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 2,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXX..XXXXX',
        'XXX..XXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 3,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXX...XXXX',
        'XXX...XXXX',
        'XXX...XXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 4,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XX....XXXX',
        'XX....XXXX',
        'XX....XXXX',
        'XX....XXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
  ];
  for (const { size, rows } of eraserSquares) {
    test(`eraser at size ${size} should erase a ${size}x${size} square`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(FULL));
      await clickTool(page, 'tool-eraser');
      await setPenSize(page, size);

      await drawAtPixel(page, 4, 4);
      await waitForGrid(page, 10, 10, rows);
    });
  }

  // A click at (2,2): the square and its mirror across the vertical axis.
  const mirrorSquares = [
    {
      size: 1,
      rows: [
        '..........',
        '..........',
        '..X....X..',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 2,
      rows: [
        '..........',
        '.XX....XX.',
        '.XX....XX.',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 3,
      rows: [
        '..........',
        '.XXX..XXX.',
        '.XXX..XXX.',
        '.XXX..XXX.',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 4,
      rows: [
        'XXXX..XXXX',
        'XXXX..XXXX',
        'XXXX..XXXX',
        'XXXX..XXXX',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { size, rows } of mirrorSquares) {
    test(`mirror pen at size ${size} should paint a ${size}x${size} square and its mirror`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await clickTool(page, 'tool-vertical-mirror-pen');
      await setPenSize(page, size);

      await drawAtPixel(page, 2, 2);
      await waitForGrid(page, 10, 10, rows);
    });
  }

  // A click at (4,4) with a red primary and a blue secondary color: the square is a
  // checkerboard, red where column + row is odd.
  const ditheringSquares = [
    {
      size: 1,
      rows: [
        '..........',
        '..........',
        '..........',
        '..........',
        '....B.....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 2,
      rows: [
        '..........',
        '..........',
        '..........',
        '...BR.....',
        '...RB.....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 3,
      rows: [
        '..........',
        '..........',
        '..........',
        '...BRB....',
        '...RBR....',
        '...BRB....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 4,
      rows: [
        '..........',
        '..........',
        '..BRBR....',
        '..RBRB....',
        '..BRBR....',
        '..RBRB....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { size, rows } of ditheringSquares) {
    test(`dithering at size ${size} should paint a ${size}x${size} checkerboard`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await setPrimaryColor(page, '#FF0000');
      await setSecondaryColor(page, '#0000FF');
      await clickTool(page, 'tool-dithering');
      await setPenSize(page, size);

      await drawAtPixel(page, 4, 4);
      await assertColorRows(page, rows);
    });
  }

  // A click at (4,4) on a red sprite: the lightened pixels are no longer pure red,
  // so they show as "?".
  const lightenSquares = [
    {
      size: 1,
      rows: [
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRR?RRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
      ],
    },
    {
      size: 2,
      rows: [
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRR??RRRRR',
        'RRR??RRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
      ],
    },
    {
      size: 3,
      rows: [
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRR???RRRR',
        'RRR???RRRR',
        'RRR???RRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
      ],
    },
    {
      size: 4,
      rows: [
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RR????RRRR',
        'RR????RRRR',
        'RR????RRRR',
        'RR????RRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
        'RRRRRRRRRR',
      ],
    },
  ];
  for (const { size, rows } of lightenSquares) {
    test(`lighten at size ${size} should lighten a ${size}x${size} square`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(FULL));
      await clickTool(page, 'tool-lighten');
      await setPenSize(page, size);

      await drawAtPixel(page, 4, 4);
      await assertColorRows(page, rows);
    });
  }

  // A line from (2,4) to (7,4): each of its pixels becomes a square.
  const strokeLines = [
    {
      size: 1,
      rows: [
        '..........',
        '..........',
        '..........',
        '..........',
        '..XXXXXX..',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 2,
      rows: [
        '..........',
        '..........',
        '..........',
        '.XXXXXXX..',
        '.XXXXXXX..',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 3,
      rows: [
        '..........',
        '..........',
        '..........',
        '.XXXXXXXX.',
        '.XXXXXXXX.',
        '.XXXXXXXX.',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      size: 4,
      rows: [
        '..........',
        '..........',
        'XXXXXXXXX.',
        'XXXXXXXXX.',
        'XXXXXXXXX.',
        'XXXXXXXXX.',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { size, rows } of strokeLines) {
    test(`stroke at size ${size} should draw a line ${size} pixels thick`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await clickTool(page, 'tool-stroke');
      await setPenSize(page, size);

      await dragBetweenPixels(page, 2, 4, 7, 4);
      await waitForGrid(page, 10, 10, rows);
    });
  }

  // A rectangle dragged from (0,0) to (9,9): the border gets thicker inward.
  const rectangles = [
    {
      size: 1,
      rows: [
        'XXXXXXXXXX',
        'X........X',
        'X........X',
        'X........X',
        'X........X',
        'X........X',
        'X........X',
        'X........X',
        'X........X',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 2,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XX......XX',
        'XX......XX',
        'XX......XX',
        'XX......XX',
        'XX......XX',
        'XX......XX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 3,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXX....XXX',
        'XXX....XXX',
        'XXX....XXX',
        'XXX....XXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      size: 4,
      rows: [
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXX..XXXX',
        'XXXX..XXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
  ];
  for (const { size, rows } of rectangles) {
    test(`rectangle at size ${size} should keep its bounds and be ${size} pixels thick`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await clickTool(page, 'tool-rectangle');
      await setPenSize(page, size);

      await dragBetweenPixels(page, 0, 0, 9, 9);
      await waitForGrid(page, 10, 10, rows);
    });
  }

  // A circle dragged from (0,0) to (11,11): it stays in that box, and its middle rows
  // are as many pixels thick as the size. The sprite is 12x12: in a 10x10 box, the
  // circle is too small for its size 4 ring to have a hole.
  const circles = [
    {
      size: 1,
      rows: [
        '...XXXXXX...',
        '..X......X..',
        '.X........X.',
        'X..........X',
        'X..........X',
        'X..........X',
        'X..........X',
        'X..........X',
        'X..........X',
        '.X........X.',
        '..X......X..',
        '...XXXXXX...',
      ],
    },
    {
      size: 2,
      rows: [
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXX....XXX.',
        'XXX......XXX',
        'XX........XX',
        'XX........XX',
        'XX........XX',
        'XX........XX',
        'XXX......XXX',
        '.XXX....XXX.',
        '..XXXXXXXX..',
        '...XXXXXX...',
      ],
    },
    {
      size: 3,
      rows: [
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXXX....XXXX',
        'XXX......XXX',
        'XXX......XXX',
        'XXX......XXX',
        'XXX......XXX',
        'XXXX....XXXX',
        '.XXXXXXXXXX.',
        '..XXXXXXXX..',
        '...XXXXXX...',
      ],
    },
    {
      size: 4,
      rows: [
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXXXXXXXXXXX',
        'XXXX....XXXX',
        'XXXX....XXXX',
        'XXXX....XXXX',
        'XXXX....XXXX',
        'XXXXXXXXXXXX',
        '.XXXXXXXXXX.',
        '..XXXXXXXX..',
        '...XXXXXX...',
      ],
    },
  ];
  for (const { size, rows } of circles) {
    test(`circle at size ${size} should keep its bounds and be ${size} pixels thick`, {
      tag: ['@drawing-tools.pen-size-tools', '@drawing-tools.pen-size-shape'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows([
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
        '............',
      ]));
      await clickTool(page, 'tool-circle');
      await setPenSize(page, size);

      await dragBetweenPixels(page, 0, 0, 11, 11);
      await waitForGrid(page, 12, 12, rows);
    });
  }

  test('paint bucket should ignore the pen size', { tag: ['@drawing-tools.pen-size-tools'] }, async ({ page }) => {
    // Start from a single transparent pixel inside a red frame.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows([
      '..........',
      '..........',
      '..........',
      '...XXX....',
      '...X.X....',
      '...XXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Fill it at size 4: a 4x4 square around it would reach the area outside the frame.
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-paint-bucket');
    await setPenSize(page, 4);
    await drawAtPixel(page, 4, 4);

    // Only that pixel is filled.
    await assertColorRows(page, [
      '..........',
      '..........',
      '..........',
      '...RRR....',
      '...RGR....',
      '...RRR....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  // ─── Undo ─────────────────────────────────────────────────────

  // Each tool draws a first shape at size 2, then a second one at size 4.
  const drawingTools: Array<{
    toolId: string;
    drawFirst: (page: Page) => Promise<void>;
    drawSecond: (page: Page) => Promise<void>;
    first: string[];
  }> = [
    {
      toolId: 'tool-pen',
      drawFirst: (page) => drawAtPixel(page, 2, 2),
      drawSecond: (page) => drawAtPixel(page, 8, 8),
      first: [
        '..........',
        '.XX.......',
        '.XX.......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      toolId: 'tool-stroke',
      drawFirst: (page) => dragBetweenPixels(page, 1, 2, 6, 2),
      drawSecond: (page) => dragBetweenPixels(page, 7, 8, 9, 8),
      first: [
        '..........',
        'XXXXXXX...',
        'XXXXXXX...',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      toolId: 'tool-rectangle',
      drawFirst: (page) => dragBetweenPixels(page, 0, 0, 5, 5),
      drawSecond: (page) => dragBetweenPixels(page, 7, 7, 9, 9),
      first: [
        'XXXXXX....',
        'XXXXXX....',
        'XX..XX....',
        'XX..XX....',
        'XXXXXX....',
        'XXXXXX....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      toolId: 'tool-circle',
      drawFirst: (page) => dragBetweenPixels(page, 0, 0, 7, 7),
      drawSecond: (page) => dragBetweenPixels(page, 7, 7, 9, 9),
      first: [
        '..XXXX....',
        '.XXXXXX...',
        'XX....XX..',
        'XX....XX..',
        'XX....XX..',
        'XX....XX..',
        '.XXXXXX...',
        '..XXXX....',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { toolId, drawFirst, drawSecond, first } of drawingTools) {
    test(`${toolId}: undo should keep the earlier drawing at its own pen size`, {
      tag: ['@drawing-tools.pen-size-tools', '@undo-redo.shortcuts'],
    }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await clickTool(page, toolId);

      // Draw at size 2.
      await setPenSize(page, 2);
      await drawFirst(page);
      await waitForGrid(page, 10, 10, first);

      // Draw again at size 4.
      await setPenSize(page, 4);
      await drawSecond(page);
      await expect.poll(() => readPixelRows(page, 10, 10)).not.toEqual(first);

      // Undo removes the second drawing, and redraws the first one at size 2, not 4.
      await undo(page);
      await waitForGrid(page, 10, 10, first);
    });
  }
});

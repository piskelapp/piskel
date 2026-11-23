import test, { expect, Page } from "@playwright/test";
import {
  assertColorRows,
  assertLayerFrames,
  assertShortcutKey,
  assertToolTooltip,
  clickTool,
  clickTransparentSwatchOfPrimaryColor,
  closeCheatsheet,
  dragBetweenPixels,
  dragWithRightButton,
  drawAtPixel,
  getPenSizeButton,
  gridFromRows,
  hoverPixelAndAssertHighlight,
  openCheatsheet,
  openEditor,
  readPixelRows,
  redo,
  remapShortcut,
  rightClickAtPixel,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  undo,
  wait,
  waitForGrid,
} from "../../testutils";

const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 10x10 sprites */
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

/** 4x4 sprites, for the edge cases that need room beside the sprite */
const SMALL_EMPTY = [
  '....',
  '....',
  '....',
  '....',
];

const openEditorWithSprite = async (page: Page, rows: string[]) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(rows));
  await waitForGrid(page, rows[0].length, rows.length, rows);
};

/** The tool's action: a click on a pixel, or a drag between two pixels */
type Action = [number, number] | [number, number, number, number];

const applyAction = async (page: Page, action: Action) => {
  const [x1, y1, x2, y2] = action;
  if (x2 === undefined || y2 === undefined) {
    await drawAtPixel(page, x1, y1);
  } else {
    await dragBetweenPixels(page, x1, y1, x2, y2);
  }
};

test.describe('Undoing a tool', () => {
  // R is the sprite, K the primary color, ? a lightened color.
  const BEFORE = [
    'R..K......',
    'RRRR......',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ];
  const TOOLS: { tool: string; action: Action; after: string[] }[] = [
    {
      tool: 'tool-pen',
      action: [0, 2, 3, 2],
      after: [
        'R..K......',
        'RRRR......',
        'KKKK......',
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
      tool: 'tool-vertical-mirror-pen',
      action: [0, 2, 1, 2],
      after: [
        'R..K......',
        'RRRR......',
        'KK......KK',
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
      tool: 'tool-eraser',
      action: [0, 1, 3, 1],
      after: [
        'R..K......',
        '..........',
        '..........',
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
      tool: 'tool-stroke',
      action: [0, 2, 3, 2],
      after: [
        'R..K......',
        'RRRR......',
        'KKKK......',
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
      tool: 'tool-rectangle',
      action: [1, 2, 3, 3],
      after: [
        'R..K......',
        'RRRR......',
        '.KKK......',
        '.KKK......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      tool: 'tool-circle',
      action: [1, 2, 3, 3],
      after: [
        'R..K......',
        'RRRR......',
        '.KKK......',
        '.KKK......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      tool: 'tool-dithering',
      action: [0, 2, 3, 2],
      after: [
        'R..K......',
        'RRRR......',
        '.K.K......',
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
      tool: 'tool-lighten',
      action: [0, 1, 3, 1],
      after: [
        'R..K......',
        '????......',
        '..........',
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
      tool: 'tool-paint-bucket',
      action: [0, 2],
      after: [
        'R..KKKKKKK',
        'RRRRKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
      ],
    },
    {
      tool: 'tool-colorswap',
      action: [0, 2],
      after: [
        'RKKKKKKKKK',
        'RRRRKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
        'KKKKKKKKKK',
      ],
    },
    {
      tool: 'tool-move',
      action: [0, 1, 0, 2],
      after: [
        '..........',
        'R..K......',
        'RRRR......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
  ];

  for (const { tool, action, after } of TOOLS) {
    test(`should make ${tool} a single undo step`, { tag: ['@drawing-tools.undo'] }, async ({ page }) => {
      await openEditorWithSprite(page, [
        'X.........',
        'XXXX......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ]);

      // The previous undo step: a pixel drawn with the pen.
      await clickTool(page, 'tool-pen');
      await drawAtPixel(page, 3, 0);
      await assertColorRows(page, BEFORE);

      // Use the tool.
      await clickTool(page, tool);
      await applyAction(page, action);
      await assertColorRows(page, after);

      // One undo reverts the whole action, and nothing before it.
      // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
      await wait(100);
      await undo(page);
      await assertColorRows(page, BEFORE);

      // One redo brings it all back.
      await wait(100);
      await redo(page);
      await assertColorRows(page, after);
    });
  }
});

// These tests use a 4x4 sprite, so that the drags can go beside it.
test.describe('Clipping at the edges', () => {
  const PAST_THE_RIGHT_EDGE = [
    { tool: 'tool-pen', row: '.XXX' },
    { tool: 'tool-vertical-mirror-pen', row: 'XXXX' },
    { tool: 'tool-stroke', row: '.XXX' },
    { tool: 'tool-rectangle', row: '.XXX' },
    { tool: 'tool-circle', row: '.XXX' },
  ];

  for (const { tool, row } of PAST_THE_RIGHT_EDGE) {
    test(`should clip ${tool} past the right edge`, { tag: ['@drawing-tools.clipping'] }, async ({ page }) => {
      await openEditorWithSprite(page, SMALL_EMPTY);
      await clickTool(page, tool);

      // Drag from inside the sprite to beside it, past the right edge.
      await dragBetweenPixels(page, 1, 1, 7, 1);

      // Nothing wraps onto the next row, and the sprite keeps its size.
      await assertLayerFrames(page, 0, [[
        '....',
        row,
        '....',
        '....',
      ]]);
    });
  }

  test('should clip a stroke that starts outside the sprite', { tag: ['@drawing-tools.clipping'] }, async ({ page }) => {
    await openEditorWithSprite(page, SMALL_EMPTY);
    await clickTool(page, 'tool-pen');

    // Drag from beside the sprite into it.
    await dragBetweenPixels(page, 7, 2, 2, 2);

    // Only the part inside the sprite is drawn.
    await assertLayerFrames(page, 0, [[
      '....',
      '....',
      '..XX',
      '....',
    ]]);
  });

  test('should clip a shape past the bottom edge', { tag: ['@drawing-tools.clipping'] }, async ({ page }) => {
    // A sprite of 2 rows, so that the drag can end well below it.
    await openEditorWithSprite(page, [
      '......',
      '......',
    ]);
    await clickTool(page, 'tool-rectangle');

    // Drag a rectangle that ends below the 2 rows of the sprite.
    await dragBetweenPixels(page, 1, 0, 3, 5);

    // Only its top is drawn.
    await assertLayerFrames(page, 0, [[
      '.XXX..',
      '.X.X..',
    ]]);
  });

  test('should clip a large pen at the edges', { tag: ['@drawing-tools.clipping'] }, async ({ page }) => {
    await openEditorWithSprite(page, SMALL_EMPTY);
    await clickTool(page, 'tool-pen');
    await getPenSizeButton(page, 3).click();

    // At the right edge.
    await drawAtPixel(page, 3, 1);
    await assertLayerFrames(page, 0, [[
      '..XX',
      '..XX',
      '..XX',
      '....',
    ]]);

    // At the bottom left corner.
    await drawAtPixel(page, 0, 3);
    await assertLayerFrames(page, 0, [[
      '..XX',
      '..XX',
      'XXXX',
      'XX..',
    ]]);

    // At the top left corner.
    await drawAtPixel(page, 0, 0);
    await assertLayerFrames(page, 0, [[
      'XXXX',
      'XXXX',
      'XXXX',
      'XX..',
    ]]);
  });
});

test.describe('Drawing with a transparent color', () => {
  // Small circles draw nothing in any color, so they aren't tested here: see
  // docs/known-issues.md.
  const TOOLS: { tool: string; action: Action; after: string[] }[] = [
    {
      tool: 'tool-pen',
      action: [1, 1, 2, 1],
      after: [
        'XXXXXXXXXX',
        'X..XXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      tool: 'tool-vertical-mirror-pen',
      action: [0, 1, 1, 1],
      after: [
        'XXXXXXXXXX',
        '..XXXXXX..',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      tool: 'tool-stroke',
      action: [1, 1, 2, 1],
      after: [
        'XXXXXXXXXX',
        'X..XXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      tool: 'tool-rectangle',
      action: [1, 1, 2, 2],
      after: [
        'XXXXXXXXXX',
        'X..XXXXXXX',
        'X..XXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      tool: 'tool-circle',
      action: [0, 0, 2, 2],
      after: [
        'X.XXXXXXXX',
        '.X.XXXXXXX',
        'X.XXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
        'XXXXXXXXXX',
      ],
    },
    {
      tool: 'tool-paint-bucket',
      action: [1, 1],
      after: EMPTY,
    },
    {
      tool: 'tool-colorswap',
      action: [1, 1],
      after: EMPTY,
    },
  ];

  for (const { tool, action, after } of TOOLS) {
    test(`should erase with ${tool}`, { tag: ['@drawing-tools.transparent-color'] }, async ({ page }) => {
      await openEditorWithSprite(page, FULL);
      await clickTool(page, tool);
      await clickTransparentSwatchOfPrimaryColor(page);

      // Use the tool on a full sprite: it removes pixels.
      await applyAction(page, action);
      await waitForGrid(page, 10, 10, after);
    });
  }

  test('should erase with the right button, as the default secondary color is transparent', { tag: ['@drawing-tools.transparent-color'] }, async ({ page }) => {
    await openEditorWithSprite(page, FULL);
    await clickTool(page, 'tool-pen');

    // Drag with the right button: it removes pixels.
    await dragWithRightButton(page, 1, 1, 2, 1);
    await waitForGrid(page, 10, 10, [
      'XXXXXXXXXX',
      'X..XXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
    ]);
  });
});

test.describe('Hover highlight', () => {
  test('should use the light or dark overlay depending on the pixel underneath', { tag: ['@drawing-tools.highlight'] }, async ({ page }) => {
    // A sprite with a pixel of 50% lightness (red), then a white and a black one.
    await openEditorWithSprite(page, [
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FFFFFF');
    await drawAtPixel(page, 1, 0);
    await waitForGrid(page, 10, 10, [
      'XX........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    await setPrimaryColor(page, '#000000');
    await drawAtPixel(page, 2, 0);
    const SPRITE = [
      'XXX.......',
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
    await waitForGrid(page, 10, 10, SPRITE);

    // Hover each one: only the white pixel gets the dark overlay.
    await hoverPixelAndAssertHighlight(page, 0, 0, [
      'L.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    await hoverPixelAndAssertHighlight(page, 1, 0, [
      '.D........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    await hoverPixelAndAssertHighlight(page, 2, 0, [
      '..L.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Over a transparent pixel, the overlay is light too.
    await hoverPixelAndAssertHighlight(page, 3, 0, [
      '...L......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Hovering doesn't draw.
    expect(await readPixelRows(page, 10, 10)).toEqual(SPRITE);
  });

  const TOOLS_WITH_PEN_SIZE = [
    'tool-pen', 'tool-vertical-mirror-pen', 'tool-eraser', 'tool-stroke',
    'tool-rectangle', 'tool-circle', 'tool-dithering', 'tool-lighten',
  ];

  for (const tool of TOOLS_WITH_PEN_SIZE) {
    test(`should cover the pen size with ${tool}`, { tag: ['@drawing-tools.highlight-size'] }, async ({ page }) => {
      await openEditorWithSprite(page, EMPTY);
      await getPenSizeButton(page, 3).click();
      await clickTool(page, tool);

      // Hover a pixel: the highlight covers the 3x3 pen around it.
      await hoverPixelAndAssertHighlight(page, 2, 2, [
        '..........',
        '.LLL......',
        '.LLL......',
        '.LLL......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ]);
    });
  }

  for (const tool of ['tool-paint-bucket', 'tool-colorswap', 'tool-colorpicker', 'tool-move', 'tool-rectangle-select', 'tool-shape-select', 'tool-lasso-select']) {
    test(`should cover one pixel with ${tool}`, { tag: ['@drawing-tools.highlight-size'] }, async ({ page }) => {
      await openEditorWithSprite(page, EMPTY);
      await getPenSizeButton(page, 3).click();
      await clickTool(page, tool);

      // Hover a pixel: this tool ignores the pen size.
      await hoverPixelAndAssertHighlight(page, 2, 2, [
        '..........',
        '..........',
        '..L.......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ]);
    });
  }

  test('should remove the highlight when moving off the sprite', { tag: ['@drawing-tools.highlight-outside'] }, async ({ page }) => {
    // A 4x4 sprite, so that there is room beside it.
    await openEditorWithSprite(page, SMALL_EMPTY);
    await clickTool(page, 'tool-pen');

    await hoverPixelAndAssertHighlight(page, 3, 1, [
      '....',
      '...L',
      '....',
      '....',
    ]);

    // Move beside the sprite.
    await hoverPixelAndAssertHighlight(page, 7, 1, SMALL_EMPTY);
  });
});

test.describe('Tool tooltips', () => {
  // The labels depend on the browser's system: macOS labels have their own tests.
  test.use({ userAgent: WINDOWS_USER_AGENT });

  const SELECTION = 'Drag the selection to move it. You may switch to other layers and frames. CTRL+C Copy the selected area CTRL+V Paste the copied area SHIFT Hold to move the content';
  const TOOLTIPS = [
    { tool: 'tool-pen', text: 'Pen tool (P)' },
    { tool: 'tool-vertical-mirror-pen', text: 'Vertical Mirror pen (V) CTRL Use horizontal axis SHIFT Use horizontal and vertical axis' },
    { tool: 'tool-paint-bucket', text: 'Paint bucket tool (B)' },
    { tool: 'tool-colorswap', text: 'Paint all pixels of the same color (A) CTRL Apply to all layers SHIFT Apply to all frames' },
    { tool: 'tool-eraser', text: 'Eraser tool (E)' },
    { tool: 'tool-stroke', text: 'Stroke tool (L) SHIFT Hold shift to draw straight lines' },
    { tool: 'tool-rectangle', text: 'Rectangle tool (R) SHIFT Keep 1 to 1 ratio' },
    { tool: 'tool-circle', text: 'Circle tool (C) SHIFT Keep 1 to 1 ratio' },
    { tool: 'tool-move', text: 'Move tool (M) CTRL Apply to all layers SHIFT Apply to all frames ALT Wrap canvas borders' },
    { tool: 'tool-shape-select', text: `Shape selection (Z) ${SELECTION}` },
    { tool: 'tool-rectangle-select', text: `Rectangle selection (S) ${SELECTION}` },
    { tool: 'tool-lasso-select', text: `Lasso selection (H) ${SELECTION}` },
    { tool: 'tool-lighten', text: 'Lighten (U) CTRL Darken SHIFT Apply only once per pixel' },
    { tool: 'tool-dithering', text: 'Dithering tool (T)' },
    { tool: 'tool-colorpicker', text: 'Color picker (O)' },
  ];

  for (const { tool, text } of TOOLTIPS) {
    test(`should show the name, key and modifiers of ${tool}`, { tag: ['@drawing-tools.tooltips'] }, async ({ page }) => {
      await openEditor(page);

      await assertToolTooltip(page, tool, text);
    });
  }

  test('should show the current key after remapping it', { tag: ['@drawing-tools.tooltips'] }, async ({ page }) => {
    await openEditor(page);

    // Give the pen another key in the cheatsheet.
    await openCheatsheet(page);
    await remapShortcut(page, 'tool-pen', 'q');
    await assertShortcutKey(page, 'tool-pen', 'Q');
    await closeCheatsheet(page);

    await assertToolTooltip(page, 'tool-pen', 'Pen tool (Q)');
  });

  // Each tool used with the right button, with a blue secondary color.
  const RIGHT_BUTTON_TOOLS: Array<{
    tool: string;
    useRightButton: (page: Page) => Promise<void>;
    rows: string[];
  }> = [
    {
      tool: 'tool-pen',
      useRightButton: (page) => rightClickAtPixel(page, 4, 4),
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
      tool: 'tool-vertical-mirror-pen',
      useRightButton: (page) => rightClickAtPixel(page, 2, 2),
      rows: [
        '..........',
        '..........',
        '..B....B..',
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
      tool: 'tool-stroke',
      useRightButton: (page) => dragWithRightButton(page, 1, 4, 8, 4),
      rows: [
        '..........',
        '..........',
        '..........',
        '..........',
        '.BBBBBBBB.',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      tool: 'tool-rectangle',
      useRightButton: (page) => dragWithRightButton(page, 2, 2, 7, 7),
      rows: [
        '..........',
        '..........',
        '..BBBBBB..',
        '..B....B..',
        '..B....B..',
        '..B....B..',
        '..B....B..',
        '..BBBBBB..',
        '..........',
        '..........',
      ],
    },
    {
      tool: 'tool-circle',
      useRightButton: (page) => dragWithRightButton(page, 1, 1, 8, 8),
      rows: [
        '..........',
        '...BBBB...',
        '..B....B..',
        '.B......B.',
        '.B......B.',
        '.B......B.',
        '.B......B.',
        '..B....B..',
        '...BBBB...',
        '..........',
      ],
    },
    {
      tool: 'tool-paint-bucket',
      useRightButton: (page) => rightClickAtPixel(page, 0, 0),
      rows: [
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
        'BBBBBBBBBB',
      ],
    },
  ];
  for (const { tool, useRightButton, rows } of RIGHT_BUTTON_TOOLS) {
    test(`should use the secondary color with the right button: ${tool}`, { tag: ['@drawing-tools.mouse-buttons'] }, async ({ page }) => {
      // Start from an empty sprite, with a blue secondary color.
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(EMPTY));
      await setSecondaryColor(page, '#0000FF');
      await clickTool(page, tool);

      await useRightButton(page);
      await assertColorRows(page, rows);
    });
  }
});

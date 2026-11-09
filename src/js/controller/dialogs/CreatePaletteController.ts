import { Constants } from "../../Constants";
import { Events } from "../../Events";
import { app } from "../../app";
import { Palette } from "../../model/Palette";
import { PaletteGplWriter } from "../../service/palette/PaletteGplWriter";
import type { PaletteImportService } from "../../service/palette/PaletteImportService";
import type { PaletteService } from "../../service/palette/PaletteService";
import { BlobUtils } from "../../utils/BlobUtils";
import { Dom } from "../../utils/Dom";
import { FileUtils } from "../../utils/FileUtils";
import { UserSettings } from "../../utils/UserSettings";
import { Uuid } from "../../utils/Uuid";
import { assertDefined, escapeHtml, unescapeHtml } from "../../utils/core";
import { ColorsList } from "../../widgets/ColorsList";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { AbstractDialogController } from "./AbstractDialogController";

export class CreatePaletteController extends AbstractDialogController {
  paletteService: PaletteService | undefined;
  paletteImportService: PaletteImportService | undefined;
  hiddenFileInput: HTMLInputElement | null | undefined;
  nameInput: HTMLInputElement | null | undefined;
  colorsListWidget: ColorsList | undefined;
  palette: Palette | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.paletteService = app.paletteService;
    this.paletteImportService = app.paletteImportService;
  }

  init(paletteId: string): void {
    super.init();

    this.hiddenFileInput = Dom.getElement<HTMLInputElement>(
      ".create-palette-import-input"
    );
    this.nameInput = Dom.getElement<HTMLInputElement>(
      'input[name="palette-name"]'
    );

    const buttonsContainer = Dom.getElement<HTMLElement>(
      ".create-palette-actions"
    );
    const deleteButton = Dom.getElement<HTMLElement>(".create-palette-delete");
    const downloadButton = Dom.getElement<HTMLElement>(
      ".create-palette-download-button"
    );
    const importFileButton = Dom.getElement<HTMLElement>(
      ".create-palette-import-button"
    );

    this.addEventListener(this.nameInput, "input", this.onNameInputChange_);
    this.addEventListener(
      this.hiddenFileInput,
      "change",
      this.onFileInputChange_
    );

    this.addEventListener(buttonsContainer, "click", this.onButtonClick_);
    this.addEventListener(downloadButton, "click", this.onDownloadButtonClick_);
    this.addEventListener(
      importFileButton,
      "click",
      this.onImportFileButtonClick_
    );

    const colorsListContainer =
      Dom.getElement<HTMLElement>(".colors-container");
    this.colorsListWidget = new ColorsList(colorsListContainer);

    let palette;
    const isCurrentColorsPalette =
      paletteId == Constants.CURRENT_COLORS_PALETTE_ID;
    if (paletteId && !isCurrentColorsPalette) {
      importFileButton.style.display = "none";
      this.setTitle("Edit Palette");

      const paletteObject = assertDefined(
        this.paletteService,
        "paletteService"
      ).getPaletteById(paletteId);
      const paletteData = assertDefined(paletteObject, "paletteObject");
      palette = new Palette(
        paletteData.id,
        paletteData.name,
        paletteData.getColors().slice()
      );
    } else {
      downloadButton.style.display = "none";
      deleteButton.style.display = "none";
      this.setTitle("Create Palette");

      const uuid = Uuid.generate();
      if (isCurrentColorsPalette) {
        palette = new Palette(
          uuid,
          "Current colors clone",
          this.getCurrentColors_()
        );
      } else {
        palette = new Palette(uuid, "New palette", []);
      }
    }

    this.setPalette_(palette);
  }

  getCurrentColors_(): string[] {
    const palette = assertDefined(
      this.paletteService,
      "paletteService"
    ).getPaletteById(Constants.CURRENT_COLORS_PALETTE_ID);
    return assertDefined(palette, "palette").getColors();
  }

  setPalette_(palette: Palette): void {
    this.palette = palette;
    assertDefined(this.nameInput, "nameInput").value = unescapeHtml(
      palette.name
    );
    assertDefined(this.colorsListWidget, "colorsListWidget").setColors(
      palette.getColors()
    );
  }

  destroy(): void {
    assertDefined(this.colorsListWidget, "colorsListWidget").destroy();
    super.destroy();

    this.nameInput = null;
    this.hiddenFileInput = null;
  }

  onButtonClick_(evt: Event): void {
    const target = evt.target as HTMLElement;
    if (target.dataset.action === "submit") {
      this.saveAndSelectPalette_();
    } else if (target.dataset.action === "cancel") {
      this.closeDialog();
    } else if (target.dataset.action === "delete") {
      this.deletePalette_();
    }
  }

  saveAndSelectPalette_(): void {
    assertDefined(this.palette, "palette").setColors(
      assertDefined(this.colorsListWidget, "colorsListWidget").getColors()
    );
    assertDefined(this.paletteService, "paletteService").savePalette(
      assertDefined(this.palette, "palette")
    );
    UserSettings.set(
      UserSettings.SELECTED_PALETTE,
      assertDefined(this.palette, "palette").id
    );
    this.closeDialog();
  }

  deletePalette_(): void {
    if (
      window.confirm(
        "Are you sure you want to delete palette " +
          assertDefined(this.palette, "palette").name
      )
    ) {
      assertDefined(this.paletteService, "paletteService").deletePaletteById(
        assertDefined(this.palette, "palette").id
      );
      UserSettings.set(
        UserSettings.SELECTED_PALETTE,
        Constants.CURRENT_COLORS_PALETTE_ID
      );
      this.closeDialog();
    }
  }

  onDownloadButtonClick_(): void {
    const paletteWriter = new PaletteGplWriter(
      assertDefined(this.palette, "palette")
    );
    const paletteAsString = paletteWriter.write();

    BlobUtils.stringToBlob(
      paletteAsString,
      (blob: Blob) => {
        FileUtils.downloadAsFile(
          blob,
          assertDefined(this.palette, "palette").name + ".gpl"
        );
      },
      "application/json"
    );
  }

  onImportFileButtonClick_(): void {
    assertDefined(this.hiddenFileInput, "hiddenFileInput").click();
  }

  onFileInputChange_(evt: Event): void {
    const files = assertDefined(this.hiddenFileInput, "hiddenFileInput").files;
    if (files && files.length == 1) {
      assertDefined(this.paletteImportService, "paletteImportService").read(
        files[0],
        this.setPalette_.bind(this),
        this.displayErrorMessage_.bind(this)
      );
    }
  }

  displayErrorMessage_(message?: string): void {
    message = "Could not import palette : " + message;
    $.publish(Events.SHOW_NOTIFICATION, [
      {
        content: message
      }
    ]);
    window.setTimeout(function () {
      $.publish(Events.HIDE_NOTIFICATION);
    }, 2000);
  }

  onNameInputChange_(evt: Event): void {
    assertDefined(this.palette, "palette").name = escapeHtml(
      assertDefined(this.nameInput, "nameInput").value
    );
  }
}

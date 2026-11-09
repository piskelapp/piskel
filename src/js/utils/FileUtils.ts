const stopPropagation = function (e: Event) {
  e.stopPropagation();
};

export const FileUtils = {
  readFile(file: Blob, callback: (content: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener("loadend", function () {
      // readAsDataURL always produces a string
      callback(String(reader.result));
    });
    reader.readAsDataURL(file);
  },

  readFileAsArrayBuffer(
    file: File,
    callback: (arg0: string | ArrayBuffer | null) => void
  ): void {
    const reader = new FileReader();
    reader.addEventListener("loadend", function () {
      callback(reader.result);
    });
    reader.readAsArrayBuffer(file);
  },

  readImageFile(file: File, callback: (image: HTMLImageElement) => void): void {
    FileUtils.readFile(file, function (content: string) {
      const image = new Image();
      image.onload = callback.bind(null, image);
      image.src = content;
    });
  },

  downloadAsFile(content: Blob, filename: string): void {
    const downloadLink = document.createElement("a");
    const url = window.URL.createObjectURL(content);
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", filename);
    document.body.appendChild(downloadLink);
    downloadLink.addEventListener("click", stopPropagation);
    downloadLink.click();
    downloadLink.removeEventListener("click", stopPropagation);
    document.body.removeChild(downloadLink);
  }
};

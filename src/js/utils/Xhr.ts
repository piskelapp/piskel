type SuccessCallback = (xhr: XMLHttpRequest) => void;
type ErrorCallback = (error: unknown, xhr: XMLHttpRequest) => void;

export const Xhr = {
  get(url: string, success?: SuccessCallback, error?: ErrorCallback): void {
    const xhr = Xhr.xhr_(url, "GET", success, error);
    xhr.send();
  },

  post(
    url: string,
    data: Record<string, string | Blob>,
    success?: SuccessCallback,
    error?: ErrorCallback
  ): void {
    const xhr = Xhr.xhr_(url, "POST", success, error);
    const formData = new FormData();

    if (typeof data == "object") {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          formData.append(key, data[key]);
        }
      }
    }

    xhr.send(formData);
  },

  xhr_(
    url: string,
    method: string,
    success?: SuccessCallback,
    error?: ErrorCallback
  ): XMLHttpRequest {
    const onSuccess: SuccessCallback = success || function () {};
    const onError: ErrorCallback = error || function () {};

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    const handleError = function (this: XMLHttpRequest, e: unknown): void {
      onError(e, this);
    };

    xhr.onload = function (): void {
      if (this.status == 200) {
        onSuccess(this);
      } else {
        handleError.call(this, this);
      }
    };

    xhr.onerror = handleError;

    return xhr;
  }
};

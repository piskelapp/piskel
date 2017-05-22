(function () {
  var ns = $.namespace('pskl.utils');

  var base64Ranks;
  if (Uint8Array) {
    base64Ranks = new Uint8Array([
      62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1,
      -1, -1,  0, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
      -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
      36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
    ]);
  }

  ns.Base64 = {
    toText : function (base64) {
      return window.atob(base64.replace(/data\:.*?\;base64\,/, ''));
    },

    decode : function(base64) {
      var outptr = 0;
      var last = [0, 0];
      var state = 0;
      var save = 0;

      var undef;
      var len = base64.length;
      var i = 0;
      var buffer = new Uint8Array(len / 4 * 3 | 0);
      while (len--) {
        var code = base64.charCodeAt(i++);
        var rank = base64Ranks[code - 43];
        if (rank !== 255 && rank !== undef) {
          last[1] = last[0];
          last[0] = code;
          save = (save << 6) | rank;
          state++;
          if (state === 4) {
            buffer[outptr++] = save >>> 16;
            if (last[1] !== 61 /* padding character */) {
              buffer[outptr++] = save >>> 8;
            }
            if (last[0] !== 61 /* padding character */) {
              buffer[outptr++] = save;
            }
            state = 0;
          }
        }
      }
      // 2/3 chance there's going to be some null bytes at the end, but that
      // doesn't really matter with most image formats.
      // If it somehow matters for you, truncate the buffer up outptr.
      return buffer.buffer;
    }
  };
})();

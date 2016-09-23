(function () {
  var ns = $.namespace('pskl.utils.serialization');

  ns.Deserializer = function (data, callback) {
    this.data_ = data;
    this.callback_ = callback;
  };

  ns.Deserializer.deserialize = function (data, callback) {
    var modelVersion;

    var isJSON = false;
    if (data instanceof ArrayBuffer || data instanceof Array) {
      var uint8 = new Uint8Array(data);

      // Backward compatibility for JSON (modelVersion < 3)
      if (String.fromCharCode(uint8[0]) == '{') {
        data = '';
        for (var i = 0; i < uint8.length; i++) {
          data += String.fromCharCode(uint8[i]);
        }
        data = JSON.parse(data);
        modelVersion = data.modelVersion;
      } else {
        var arr16 = new Uint16Array(uint8.buffer);
        modelVersion = arr16[0];
      }
    } else {
      throw 'Invalid data for deserializing: ' + data;
    }

    var deserializer;
    if (modelVersion == Constants.MODEL_VERSION) {
      deserializer = new ns.Deserializer(data, callback);
    } else if (modelVersion == 2) {
      deserializer = new ns.backward.Deserializer_v2(data, callback);
    } else if (modelVersion == 1) {
      deserializer = new ns.backward.Deserializer_v1(data, callback);
    } else {
      deserializer = new ns.backward.Deserializer_v0(data, callback);
    }
    deserializer.deserialize();
  };

  ns.Deserializer.prototype.deserialize = function (name) {
    var i;
    var j;
    var buffer = this.data_;
    var arr8 = new Uint8Array(buffer);
    var arr16 = new Uint16Array(arr8.buffer);
    var sub;

    /********/
    /* META */
    /********/
    // Piskel meta
    var modelVersion = arr16[0];
    var width = arr16[1];
    var height = arr16[2];
    var fps = arr16[3];

    // Descriptor meta
    var descriptorNameLength = arr16[4];
    var descriptorDescriptionLength = arr16[5];

    // Layers meta
    var layerCount = arr16[6];

    /********/
    /* DATA */
    /********/
    // Descriptor name
    var descriptorName = '';
    for (i = 0; i < descriptorNameLength; i++) {
      descriptorName += String.fromCharCode(arr16[7 + i]);
    }

    // Descriptor description
    var descriptorDescription = '';
    for (i = 0; i < descriptorDescriptionLength; i++) {
      descriptorDescription = String.fromCharCode(arr16[7 + descriptorNameLength + i]);
    }

    // Layers
    var layerStartIndex = 7 + descriptorNameLength + descriptorDescriptionLength;
    var layers = [];
    var layer;
    for (i = 0; i < layerCount; i++) {
      layer = {};
      var frames = [];

      // Meta
      var layerNameLength = arr16[layerStartIndex];
      var opacity =  arr16[layerStartIndex + 1] / 65535;
      var frameCount = arr16[layerStartIndex + 2];
      var dataUriLengthFirstHalf = arr16[layerStartIndex + 3];
      var dataUriLengthSecondHalf = arr16[layerStartIndex + 4];
      var dataUriLength = (dataUriLengthSecondHalf >>> 0) | (dataUriLengthFirstHalf << 16 >>> 0);

      // Name
      var layerName = '';
      for (j = 0; j < layerNameLength; j++) {
        layerName += String.fromCharCode(arr16[layerStartIndex + 5 + j]);
      }

      // Data URI
      var dataUri = '';
      for (j = 0; j < dataUriLength; j++) {
        dataUri += String.fromCharCode(arr8[(layerStartIndex + 5 + layerNameLength) * 2 + j]);
      }
      dataUri = 'data:image/png;base64,' + dataUri;

      layerStartIndex += Math.ceil(5 + layerNameLength + (dataUriLength / 2));

      layer.name = layerName;
      layer.opacity = opacity;
      layer.frameCount = frameCount;
      layer.dataUri = dataUri;
      layers.push(layer);
    }

    var descriptor = new pskl.model.piskel.Descriptor(descriptorName, descriptorDescription);
    var piskel = new pskl.model.Piskel(width, height, descriptor);
    var loadedLayers = 0;

    var loadLayerImage = function(layer, cb) {
      var image = new Image();
      image.onload = function() {
        var frames = pskl.utils.LayerUtils.createFramesFromSpritesheet(this, layer.frameCount);
        frames.forEach(layer.model.addFrame.bind(layer.model));

        loadedLayers++;
        if (loadedLayers == layerCount) {
          cb(piskel, {fps: fps});
        }
      };
      image.src = layer.dataUri;
    };

    for (i = 0; i < layerCount; i++) {
      layer = layers[i];
      var nlayer = new pskl.model.Layer(layer.name);
      layer.model = nlayer;
      nlayer.setOpacity(layer.opacity);
      piskel.addLayer(nlayer);

      loadLayerImage.bind(this, layer, this.callback_)();
    }
  };
})();

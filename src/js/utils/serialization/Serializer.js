(function () {
  var ns = $.namespace('pskl.utils');

  ns.Serializer = {
    serializePiskel : function (piskel, expanded) {
      if (piskel.planes.length == 1) {
        var plane = piskel.getPlaneAt(0);
        var serializedLayers = plane.getLayers().map(function (l) {
          return pskl.utils.Serializer.serializeLayer(l, expanded);
        });
        return JSON.stringify({
          modelVersion : Constants.MODEL_VERSION,
          piskel : {
            name : piskel.getDescriptor().name,
            description : piskel.getDescriptor().description,
            fps : pskl.app.piskelController.getFPS(),
            height : piskel.getHeight(),
            width : piskel.getWidth(),
            layers : serializedLayers,
            expanded : expanded
          }
        });
      } else {
        var serializedPlanes = piskel.getPlanes().map(function (p) {
          return pskl.utils.Serializer.serializePlane(p, expanded);
        });
        return JSON.stringify({
          modelVersion : Constants.MODEL_VERSION,
          piskel : {
            name : piskel.getDescriptor().name,
            description : piskel.getDescriptor().description,
            fps : pskl.app.piskelController.getFPS(),
            height : piskel.getHeight(),
            width : piskel.getWidth(),
            planes : serializedPlanes,
            expanded : expanded,
            isMultiPlane: true
          }
        });
      }
    },

    serializePlane : function (plane, expanded) {
      var layers = plane.getLayers();
      var serializedLayers = plane.getLayers().map(function (l) {
        return pskl.utils.Serializer.serializeLayer(l, expanded);
      });
      return {
        name : plane.getName(),
        offset : plane.getOffset(),
        layerCount : layers.length,
        layers : serializedLayers
      };
    },

    serializeLayer : function (layer, expanded) {
      var frames = layer.getFrames();
      var layerToSerialize = {
        name : layer.getName(),
        opacity : layer.getOpacity(),
        frameCount : frames.length
      };
      if (expanded) {
        layerToSerialize.grids = frames.map(function (f) {return f.pixels;});
        return layerToSerialize;
      } else {
        var renderer = new pskl.rendering.FramesheetRenderer(frames);
        layerToSerialize.base64PNG = renderer.renderAsCanvas().toDataURL();
        return JSON.stringify(layerToSerialize);
      }
    }
  };
})();

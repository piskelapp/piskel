/**
* This class lets you encode animated GIF files
* Base class :  http://www.java2s.com/Code/Java/2D-Graphics-GUI/AnimatedGifEncoder.htm
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/


	//import flash.utils.ByteArray;
	//import flash.display.BitmapData;
	//import flash.display.Bitmap;
	//import org.bytearray.gif.encoder.NeuQuant
	//import flash.net.URLRequestHeader;
	//import flash.net.URLRequestMethod;
	//import flash.net.URLRequest;
	//import flash.net.navigateToURL;
	
	GIFEncoder = function()
	{
	    for(var i = 0, chr = {}; i < 256; i++)
        chr[i] = String.fromCharCode(i);
        
      function ByteArray(){
        this.bin = [];
      }

      ByteArray.prototype.getData = function(){
        
	      for(var v = '', l = this.bin.length, i = 0; i < l; i++)
          v += chr[this.bin[i]];
        return v;
      }
      ByteArray.prototype.writeByte = function(val){
        this.bin.push(val);
      }
      ByteArray.prototype.writeUTFBytes = function(string){
        for(var l = string.length, i = 0; i < l; i++)
          this.writeByte(string.charCodeAt(i));
      }
      ByteArray.prototype.writeBytes = function(array, offset, length){
        for(var l = length || array.length, i = offset||0; i < l; i++)
          this.writeByte(array[i]);
      }
	
	    var exports = {};
		/*private*/ var width/*int*/ // image size
  		/*private*/ var height/*int*/;
	    /*private*/ var transparent/***/ = null; // transparent color if given
	    /*private*/ var transIndex/*int*/; // transparent index in color table
	    /*private*/ var repeat/*int*/ = -1; // no repeat
	    /*private*/ var delay/*int*/ = 0; // frame delay (hundredths)
	    /*private*/ var started/*Boolean*/ = false; // ready to output frames
	    /*private*/ var out/*ByteArray*/;
	    /*private*/ var image/*Bitmap*/; // current frame
	    /*private*/ var pixels/*ByteArray*/; // BGR byte array from frame
	    /*private*/ var indexedPixels/*ByteArray*/ // converted frame indexed to palette
	    /*private*/ var colorDepth/*int*/; // number of bit planes
	    /*private*/ var colorTab/*ByteArray*/; // RGB palette
	    /*private*/ var usedEntry/*Array*/ = new Array; // active palette entries
	    /*private*/ var palSize/*int*/ = 7; // color table size (bits-1)
	    /*private*/ var dispose/*int*/ = -1; // disposal code (-1 = use default)
	    /*private*/ var closeStream/*Boolean*/ = false; // close stream when finished
	    /*private*/ var firstFrame/*Boolean*/ = true;
	    /*private*/ var sizeSet/*Boolean*/ = false; // if false, get size from first frame
	    /*private*/ var sample/*int*/ = 10; // default sample interval for quantizer
		
		/**
		* Sets the delay time between each frame, or changes it for subsequent frames
		* (applies to last frame added)
		* int delay time in milliseconds
		* @param ms
		*/
		
		var setDelay = exports.setDelay = function setDelay(ms/*int*/)/*void*/
		{
			
			delay = Math.round(ms / 10);
			
		}
		
		/**
		* Sets the GIF frame disposal code for the last added frame and any
		* 
		* subsequent frames. Default is 0 if no transparent color has been set,
		* otherwise 2.
		* @param code
		* int disposal code.
		*/
		
		var setDispose = exports.setDispose = function setDispose(code/*int*/)/*void*/ 
		{
			
			if (code >= 0) dispose = code;
			
		}
		
		/**
		* Sets the number of times the set of GIF frames should be played. Default is
		* 1; 0 means play indefinitely. Must be invoked before the first image is
		* added.
		* 
		* @param iter
		* int number of iterations.
		* @return
		*/
		
		var setRepeat = exports.setRepeat = function setRepeat(iter/*int*/)/*void*/ 
		{
			
			if (iter >= 0) repeat = iter;
			
		}
		
		/**
		* Sets the transparent color for the last added frame and any subsequent
		* frames. Since all colors are subject to modification in the quantization
		* process, the color in the final palette for each frame closest to the given
		* color becomes the transparent color for that frame. May be set to null to
		* indicate no transparent color.
		* @param
		* Color to be treated as transparent on display.
		*/
		
		var setTransparent = exports.setTransparent = function setTransparent(c/*Number*/)/*void*/
		{
			
			transparent = c;
			
		}
		
		/**
		* The addFrame method takes an incoming BitmapData object to create each frames
		* @param
		* BitmapData object to be treated as a GIF's frame
		*/
		
		var addFrame = exports.addFrame = function addFrame(im/*BitmapData*/, is_imageData)/*Boolean*/
		{
			
			if ((im == null) || !started || out == null) 
			{
				throw new Error ("Please call start method before calling addFrame");
				return false;
			}
			
		    var ok/*Boolean*/ = true;
			
		    try {
				if(!is_imageData){
				  image = im.getImageData(0,0, im.canvas.width, im.canvas.height).data;
				  if (!sizeSet) setSize(im.canvas.width, im.canvas.height);
				}else{
				  image = im;
				}
				getImagePixels(); // convert to correct format if necessary
				analyzePixels(); // build color table & map pixels
				
				if (firstFrame) 
				{
					writeLSD(); // logical screen descriptior
					writePalette(); // global color table
					if (repeat >= 0) 
					{
						// use NS app extension to indicate reps
						writeNetscapeExt();
					}
		      }
			  
			  writeGraphicCtrlExt(); // write graphic control extension
		      writeImageDesc(); // image descriptor
		      if (!firstFrame) writePalette(); // local color table
		      writePixels(); // encode and write pixel data
		      firstFrame = false;
		    } catch (e/*Error*/) {
		      ok = false;
		    }
		    
			return ok;
			
		}
		
		/**
		* Adds final trailer to the GIF stream, if you don't call the finish method
		* the GIF stream will not be valid.
		*/
		
		var finish = exports.finish = function finish()/*Boolean*/
		{
		    if (!started) return false;
		    var ok/*Boolean*/ = true;
		    started = false;
		    try {
		      out.writeByte(0x3b); // gif trailer
		    } catch (e/*Error*/) {
		      ok = false;
		    }
	
		    return ok;
			
		}
		
		/**
		* Resets some members so that a new stream can be started.
		* This method is actually called by the start method
		*/
		
		var reset = function reset ( )/*void*/
		{
			
			// reset for subsequent use
			transIndex = 0;
			image = null;
		    pixels = null;
		    indexedPixels = null;
		    colorTab = null;
		    closeStream = false;
		    firstFrame = true;
			
		}

		/**
		* * Sets frame rate in frames per second. Equivalent to
		* <code>setDelay(1000/fps)</code>.
		* @param fps
		* float frame rate (frames per second)         
		*/
		
		var setFrameRate = exports.setFrameRate = function setFrameRate(fps/*Number*/)/*void*/ 
		{
			
			if (fps != 0xf) delay = Math.round(100/fps);
			
		}
		
		/**
		* Sets quality of color quantization (conversion of images to the maximum 256
		* colors allowed by the GIF specification). Lower values (minimum = 1)
		* produce better colors, but slow processing significantly. 10 is the
		* default, and produces good color mapping at reasonable speeds. Values
		* greater than 20 do not yield significant improvements in speed.
		* @param quality
		* int greater than 0.
		* @return
		*/
		
		var setQuality = exports.setQuality = function setQuality(quality/*int*/)/*void*/
		{
			
		    if (quality < 1) quality = 1;
		    sample = quality;
			
		}
		
		/**
		* Sets the GIF frame size. The default size is the size of the first frame
		* added if this method is not invoked.
		* @param w
		* int frame width.
		* @param h
		* int frame width.
		*/
		
		var setSize = exports.setSize = function setSize(w/*int*/, h/*int*/)/*void*/
		{
			
			if (started && !firstFrame) return;
		    width = w;
		    height = h;
		    if (width < 1)width = 320;
		    if (height < 1)height = 240;
		    sizeSet = true
			
		}
		
		/**
		* Initiates GIF file creation on the given stream.
		* @param os
		* OutputStream on which GIF images are written.
		* @return false if initial write failed.
		* 
		*/
		
		var start = exports.start = function start()/*Boolean*/
		{
			
			reset(); 
		    var ok/*Boolean*/ = true;
		    closeStream = false;
		    out = new ByteArray;
		    try {
		      out.writeUTFBytes("GIF89a"); // header
		    } catch (e/*Error*/) {
		      ok = false;
		    }
			
		    return started = ok;
			
		}
		
		var cont = exports.cont = function cont()/*Boolean*/
		{
			
		    reset(); 
		    var ok/*Boolean*/ = true;
		    closeStream = false;
		    out = new ByteArray;
			
		    return started = ok;
			
		}
		
		/**
		* Analyzes image colors and creates color map.
		*/
		
		var analyzePixels = function analyzePixels()/*void*/
		{
		    
			var len/*int*/ = pixels.length;
		    var nPix/*int*/ = len / 3;
		    indexedPixels = [];
		    var nq/*NeuQuant*/ = new NeuQuant(pixels, len, sample);
		    // initialize quantizer
		    colorTab = nq.process(); // create reduced palette
		    // map image pixels to new palette
		    var k/*int*/ = 0;
		    for (var j/*int*/ = 0; j < nPix; j++) {
		      var index/*int*/ = nq.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
		      usedEntry[index] = true;
		      indexedPixels[j] = index;
		    }
		    pixels = null;
		    colorDepth = 8;
		    palSize = 7;
		    // get closest match to transparent color if specified
		    if (transparent != null) {
		      	transIndex = findClosest(transparent);

			    var r = colorTab[transIndex*3];
			    var g = colorTab[transIndex*3+1];
			    var b = colorTab[transIndex*3+2];
			    var trans_indices = [];
			    for (var i=0; i<colorTab.length; i+=3)
			    {
			        var index = i / 3;
			        if (!usedEntry[index]) continue;
			        if (colorTab[i] == r && colorTab[i+1] == g && colorTab[i+2] == b)
			            trans_indices.push(index);
			    }
			    for (var i=0; i<indexedPixels.length; i++) {
			        if (trans_indices.indexOf(indexedPixels[i]) >= 0) {
			            indexedPixels[i] = transIndex;
			        }
			    }
		    }
		}
		
		/**
		* Returns index of palette color closest to c
		*
		*/
		
		var findClosest = function findClosest(c/*Number*/)/*int*/
		{
			
			if (colorTab == null) return -1;
		    var r/*int*/ = (c & 0xFF0000) >> 16;
		    var g/*int*/ = (c & 0x00FF00) >> 8;
		    var b/*int*/ = (c & 0x0000FF);
		    var minpos/*int*/ = 0;
		    var dmin/*int*/ = 256 * 256 * 256;
		    var len/*int*/ = colorTab.length;
			
		    for (var i/*int*/ = 0; i < len;) {
		      var dr/*int*/ = r - (colorTab[i++] & 0xff);
		      var dg/*int*/ = g - (colorTab[i++] & 0xff);
		      var db/*int*/ = b - (colorTab[i] & 0xff);
		      var d/*int*/ = dr * dr + dg * dg + db * db;
		      var index/*int*/ = i / 3;
		      if (usedEntry[index] && (d < dmin)) {
		        dmin = d;
		        minpos = index;
		      }
		      i++;
		    }
		    return minpos;
			
		}
		
		/**
		* Extracts image pixels into byte array "pixels
		*/
		
		var getImagePixels = function getImagePixels()/*void*/
		{
		    
		    var w/*int*/ = width;
		    var h/*int*/ = height;
		    pixels = [];
  			var data = image;
		    var count/*int*/ = 0;
		    
		    for ( var i/*int*/ = 0; i < h; i++ )
		    {
		    	
		    	for (var j/*int*/ = 0; j < w; j++ )
		    	{
		    		
	        		var b = (i*w*4)+j*4;
	        		pixels[count++] = data[b];
	        		pixels[count++] = data[b+1];
	        		pixels[count++] = data[b+2];
		    		
		    	}
		    	
		    }
		    
		}
		
		/**
		* Writes Graphic Control Extension
		*/
		
		var writeGraphicCtrlExt = function writeGraphicCtrlExt()/*void*/
		{
			out.writeByte(0x21); // extension introducer
		    out.writeByte(0xf9); // GCE label
		    out.writeByte(4); // data block size
		    var transp/*int*/
		    var disp/*int*/;
		    if (transparent == null) {
		      transp = 0;
		      disp = 0; // dispose = no action
		    } else {
		      transp = 1;
		      disp = 2; // force clear if using transparent color
		    }
		    if (dispose >= 0) {
		      disp = dispose & 7; // user override
		    }
		    disp <<= 2;
		    // packed fields
		    out.writeByte(0 | // 1:3 reserved
		        disp | // 4:6 disposal
		        0 | // 7 user input - 0 = none
		        transp); // 8 transparency flag
		
		    WriteShort(delay); // delay x 1/100 sec
		    out.writeByte(transIndex); // transparent color index
		    out.writeByte(0); // block terminator
			
		}
		  
		/**
		* Writes Image Descriptor
		*/
		
		var writeImageDesc = function writeImageDesc()/*void*/
		{
		  	
		    out.writeByte(0x2c); // image separator
		   	WriteShort(0); // image position x,y = 0,0
		    WriteShort(0);
		    WriteShort(width); // image size
		    WriteShort(height);

		    // packed fields
		    if (firstFrame) {
		      // no LCT - GCT is used for first (or only) frame
		      out.writeByte(0);
		    } else {
		      // specify normal LCT
		      out.writeByte(0x80 | // 1 local color table 1=yes
		          0 | // 2 interlace - 0=no
		          0 | // 3 sorted - 0=no
		          0 | // 4-5 reserved
		          palSize); // 6-8 size of color table
		    }
		}
		
		/**
		* Writes Logical Screen Descriptor
		*/
		
		var writeLSD = function writeLSD()/*void*/
		{
			
			// logical screen size
		    WriteShort(width);
		    WriteShort(height);
		    // packed fields
		    out.writeByte((0x80 | // 1 : global color table flag = 1 (gct used)
		        0x70 | // 2-4 : color resolution = 7
		        0x00 | // 5 : gct sort flag = 0
		        palSize)); // 6-8 : gct size
		
		    out.writeByte(0); // background color index
		    out.writeByte(0); // pixel aspect ratio - assume 1:1
			
		}
		
		/**
		* Writes Netscape application extension to define repeat count.
		*/
		
		var writeNetscapeExt = function writeNetscapeExt()/*void*/
		{
			
		    out.writeByte(0x21); // extension introducer
		    out.writeByte(0xff); // app extension label
		    out.writeByte(11); // block size
		    out.writeUTFBytes("NETSCAPE" + "2.0"); // app id + auth code
		    out.writeByte(3); // sub-block size
		    out.writeByte(1); // loop sub-block id
		    WriteShort(repeat); // loop count (extra iterations, 0=repeat forever)
		    out.writeByte(0); // block terminator
		
		}
		
		/**
		* Writes color table
		*/
		
		var writePalette = function writePalette()/*void*/
		{
		    out.writeBytes(colorTab);
		    var n/*int*/ = (3 * 256) - colorTab.length;
		    for (var i/*int*/ = 0; i < n; i++) out.writeByte(0);
			
		}
		
		var WriteShort = function WriteShort (pValue/*int*/)/*void*/
		{  	
			
		  	out.writeByte( pValue & 0xFF );
		  	out.writeByte( (pValue >> 8) & 0xFF);
			
		}
		
		/**
		* Encodes and writes pixel data
		*/
		
		var writePixels = function writePixels()/*void*/
		{
			
		    var myencoder/*LZWEncoder*/ = new LZWEncoder(width, height, indexedPixels, colorDepth);
		    myencoder.encode(out);
			
		}
		
		/**
		* retrieves the GIF stream
		*/
		var stream = exports.stream = function stream ( )/*ByteArray*/
		{
			
			return out; 
			
		}
		
		var setProperties = exports.setProperties = function setProperties(has_start, is_first){
		  started = has_start;
		  firstFrame = is_first;
		  //out = new ByteArray; //??
		}
		
		return exports
		  
	}

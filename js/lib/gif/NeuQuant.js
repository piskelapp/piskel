/*
* NeuQuant Neural-Net Quantization Algorithm
* ------------------------------------------
* 
* Copyright (c) 1994 Anthony Dekker
* 
* NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994. See
* "Kohonen neural networks for optimal colour quantization" in "Network:
* Computation in Neural Systems" Vol. 5 (1994) pp 351-367. for a discussion of
* the algorithm.
* 
* Any party obtaining a copy of these files from the author, directly or
* indirectly, is granted, free of charge, a full and unrestricted irrevocable,
* world-wide, paid up, royalty-free, nonexclusive right and license to deal in
* this software and documentation files (the "Software"), including without
* limitation the rights to use, copy, modify, merge, publish, distribute,
* sublicense, and/or sell copies of the Software, and to permit persons who
* receive copies from any such party to do so, with the only requirement being
* that this copyright notice remain intact.
*/
 
/*
* This class handles Neural-Net quantization algorithm
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/

	//import flash.utils.ByteArray;
	
	NeuQuant = function()
	{
	    var exports = {};
		/*private_static*/ var netsize/*int*/ = 256; /* number of colours used */
		
		/* four primes near 500 - assume no image has a length so large */
		/* that it is divisible by all four primes */
		
		/*private_static*/ var prime1/*int*/ = 499;
		/*private_static*/ var prime2/*int*/ = 491;
		/*private_static*/ var prime3/*int*/ = 487;
		/*private_static*/ var prime4/*int*/ = 503;
		/*private_static*/ var minpicturebytes/*int*/ = (3 * prime4);
		
		/* minimum size for input image */
		/*
		* Program Skeleton ---------------- [select samplefac in range 1..30] [read
		* image from input file] pic = (unsigned char*) malloc(3*width*height);
		* initnet(pic,3*width*height,samplefac); learn(); unbiasnet(); [write output
		* image header, using writecolourmap(f)] inxbuild(); write output image using
		* inxsearch(b,g,r)
		*/

		/*
		* Network Definitions -------------------
		*/
		
		/*private_static*/ var maxnetpos/*int*/ = (netsize - 1);
		/*private_static*/ var netbiasshift/*int*/ = 4; /* bias for colour values */
		/*private_static*/ var ncycles/*int*/ = 100; /* no. of learning cycles */
		
		/* defs for freq and bias */
		/*private_static*/ var intbiasshift/*int*/ = 16; /* bias for fractions */
		/*private_static*/ var intbias/*int*/ = (1 << intbiasshift);
		/*private_static*/ var gammashift/*int*/ = 10; /* gamma = 1024 */
		/*private_static*/ var gamma/*int*/ = (1 << gammashift);
		/*private_static*/ var betashift/*int*/ = 10;
		/*private_static*/ var beta/*int*/ = (intbias >> betashift); /* beta = 1/1024 */
		/*private_static*/ var betagamma/*int*/ = (intbias << (gammashift - betashift));
		
		/* defs for decreasing radius factor */
		/*private_static*/ var initrad/*int*/ = (netsize >> 3); /*
	                                                         * for 256 cols, radius
	                                                         * starts
	                                                         */
															 
		/*private_static*/ var radiusbiasshift/*int*/ = 6; /* at 32.0 biased by 6 bits */
		/*private_static*/ var radiusbias/*int*/ = (1 << radiusbiasshift);
		/*private_static*/ var initradius/*int*/ = (initrad * radiusbias); /*
	                                                                   * and
	                                                                   * decreases
	                                                                   * by a
	                                                                   */
																	   
		/*private_static*/ var radiusdec/*int*/ = 30; /* factor of 1/30 each cycle */
		
		/* defs for decreasing alpha factor */
		/*private_static*/ var alphabiasshift/*int*/ = 10; /* alpha starts at 1.0 */
		/*private_static*/ var initalpha/*int*/ = (1 << alphabiasshift);
		/*private*/ var alphadec/*int*/ /* biased by 10 bits */
		
		/* radbias and alpharadbias used for radpower calculation */
		/*private_static*/ var radbiasshift/*int*/ = 8;
		/*private_static*/ var radbias/*int*/ = (1 << radbiasshift);
		/*private_static*/ var alpharadbshift/*int*/ = (alphabiasshift + radbiasshift);
		
		/*private_static*/ var alpharadbias/*int*/ = (1 << alpharadbshift);
		
		/*
		* Types and Global Variables --------------------------
		*/
		
		/*private*/ var thepicture/*ByteArray*//* the input image itself */
		/*private*/ var lengthcount/*int*/; /* lengthcount = H*W*3 */
		/*private*/ var samplefac/*int*/; /* sampling factor 1..30 */
		
		// typedef int pixel[4]; /* BGRc */
		/*private*/ var network/*Array*/; /* the network itself - [netsize][4] */
		/*protected*/ var netindex/*Array*/ = new Array();
		
		/* for network lookup - really 256 */
		/*private*/ var bias/*Array*/ = new Array();
		
		/* bias and freq arrays for learning */
		/*private*/ var freq/*Array*/ = new Array();
		/*private*/ var radpower/*Array*/ = new Array();
		
		var NeuQuant = exports.NeuQuant = function NeuQuant(thepic/*ByteArray*/, len/*int*/, sample/*int*/)
		{
			
			var i/*int*/;
			var p/*Array*/;
			
			thepicture = thepic;
			lengthcount = len;
			samplefac = sample;
			
			network = new Array(netsize);
			
			for (i = 0; i < netsize; i++)
			{
				
				network[i] = new Array(4);
				p = network[i];
				p[0] = p[1] = p[2] = (i << (netbiasshift + 8)) / netsize;
				freq[i] = intbias / netsize; /* 1/netsize */
				bias[i] = 0;
			}
			
		}
		
		var colorMap = function colorMap()/*ByteArray*/
		{
			
			var map/*ByteArray*/ = [];
		    var index/*Array*/ = new Array(netsize);
		    for (var i/*int*/ = 0; i < netsize; i++)
		      index[network[i][3]] = i;
		    var k/*int*/ = 0;
		    for (var l/*int*/ = 0; l < netsize; l++) {
		      var j/*int*/ = index[l];
		      map[k++] = (network[j][0]);
		      map[k++] = (network[j][1]);
		      map[k++] = (network[j][2]);
		    }
		    return map;
			
		}
		
		/*
	   * Insertion sort of network and building of netindex[0..255] (to do after
	   * unbias)
	   * -------------------------------------------------------------------------------
	   */
	   
	   var inxbuild = function inxbuild()/*void*/
	   {
		   
		  var i/*int*/;
		  var j/*int*/;
		  var smallpos/*int*/;
		  var smallval/*int*/;
		  var p/*Array*/;
		  var q/*Array*/;
		  var previouscol/*int*/
		  var startpos/*int*/
		  
		  previouscol = 0;
		  startpos = 0;
		  for (i = 0; i < netsize; i++)
		  {
			  
			  p = network[i];
			  smallpos = i;
			  smallval = p[1]; /* index on g */
			  /* find smallest in i..netsize-1 */
			  for (j = i + 1; j < netsize; j++)
			  {
				  q = network[j];
				  if (q[1] < smallval)
				  { /* index on g */
				  
					smallpos = j;
					smallval = q[1]; /* index on g */
				}
			  }
			  
			  q = network[smallpos];
			  /* swap p (i) and q (smallpos) entries */
			  
			  if (i != smallpos)
			  {
				  
				  j = q[0];
				  q[0] = p[0];
				  p[0] = j;
				  j = q[1];
				  q[1] = p[1];
				  p[1] = j;
				  j = q[2];
				  q[2] = p[2];
				  p[2] = j;
				  j = q[3];
				  q[3] = p[3];
				  p[3] = j;
				  
			  }
			  
			  /* smallval entry is now in position i */
			  
			  if (smallval != previouscol)
			  
			  {
				  
				netindex[previouscol] = (startpos + i) >> 1;
				  
				for (j = previouscol + 1; j < smallval; j++) netindex[j] = i;
				  
				previouscol = smallval;
				startpos = i;
				
			  }
			  
			}
			
			netindex[previouscol] = (startpos + maxnetpos) >> 1;
			for (j = previouscol + 1; j < 256; j++) netindex[j] = maxnetpos; /* really 256 */
			
	   }
	   
	   /*
	   * Main Learning Loop ------------------
	   */
	   
	   var learn = function learn()/*void*/ 
	   
	   {
		   
		   var i/*int*/;
		   var j/*int*/;
		   var b/*int*/;
		   var g/*int*/
		   var r/*int*/;
		   var radius/*int*/;
		   var rad/*int*/;
		   var alpha/*int*/;
		   var step/*int*/;
		   var delta/*int*/;
		   var samplepixels/*int*/;
		   var p/*ByteArray*/;
		   var pix/*int*/;
		   var lim/*int*/;
		   
		   if (lengthcount < minpicturebytes) samplefac = 1;
		   
		   alphadec = 30 + ((samplefac - 1) / 3);
		   p = thepicture;
		   pix = 0;
		   lim = lengthcount;
		   samplepixels = lengthcount / (3 * samplefac);
		   delta = samplepixels / ncycles;
		   alpha = initalpha;
		   radius = initradius;
		   
		   rad = radius >> radiusbiasshift;
		   if (rad <= 1) rad = 0;
		   
		   for (i = 0; i < rad; i++) radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));
		   
		   
		   if (lengthcount < minpicturebytes) step = 3;
		   
		   else if ((lengthcount % prime1) != 0) step = 3 * prime1;
		   
		   else
		   
		   {
			   
			   if ((lengthcount % prime2) != 0) step = 3 * prime2;
			   
			   else
			   
			   {
				   
				   if ((lengthcount % prime3) != 0) step = 3 * prime3;
				   
				   else step = 3 * prime4;
				   
			   }
			   
		   }
		   
		   i = 0;
		   
		   while (i < samplepixels)
		   
		   {
			   
			   b = (p[pix + 0] & 0xff) << netbiasshift;
			   g = (p[pix + 1] & 0xff) << netbiasshift;
			   r = (p[pix + 2] & 0xff) << netbiasshift;
			   j = contest(b, g, r);
			   
			   altersingle(alpha, j, b, g, r);
			   
			   if (rad != 0) alterneigh(rad, j, b, g, r); /* alter neighbours */
			   
			   pix += step;
			   
			   if (pix >= lim) pix -= lengthcount;
			   
			   i++;
			   
			   if (delta == 0) delta = 1;
			   
			   if (i % delta == 0)
			   
			   {
				   
				   alpha -= alpha / alphadec;
				   radius -= radius / radiusdec;
				   rad = radius >> radiusbiasshift;
				   
				   if (rad <= 1) rad = 0;
				   
				   for (j = 0; j < rad; j++) radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
				   
			   }
			   
		   }
		   
	   }
	   
	   /*
	   ** Search for BGR values 0..255 (after net is unbiased) and return colour
	   * index
	   * ----------------------------------------------------------------------------
	   */
	   
	   var map = exports.map = function map(b/*int*/, g/*int*/, r/*int*/)/*int*/
	  
	   {
		   
		   var i/*int*/;
		   var j/*int*/;
		   var dist/*int*/
		   var a/*int*/;
		   var bestd/*int*/;
		   var p/*Array*/;
		   var best/*int*/;
		   
		   bestd = 1000; /* biggest possible dist is 256*3 */
		   best = -1;
		   i = netindex[g]; /* index on g */
		   j = i - 1; /* start at netindex[g] and work outwards */
	
	    while ((i < netsize) || (j >= 0))
		
		{
			
			if (i < netsize)
			
			{
				
				p = network[i];
				
				dist = p[1] - g; /* inx key */
				
				if (dist >= bestd) i = netsize; /* stop iter */
				
				else
				
				{
					
					i++;
					
					if (dist < 0) dist = -dist;
					
					a = p[0] - b;
					
					if (a < 0) a = -a;
					
					dist += a;
					
					if (dist < bestd)
					
					{
						
						a = p[2] - r;
						
						if (a < 0) a = -a;
						
						dist += a;
						
						if (dist < bestd)
						
						{
							
							bestd = dist;
							best = p[3];
							
						}
						
					}
					
				}
				
			}
		  
	      if (j >= 0)
		  {
			  
			  p = network[j];
			  
			  dist = g - p[1]; /* inx key - reverse dif */
			  
			  if (dist >= bestd) j = -1; /* stop iter */
			  
			  else 
			  {
				  
				  j--;
				  if (dist < 0) dist = -dist;
				  a = p[0] - b;
				  if (a < 0) a = -a;
				  dist += a;
				  
				  if (dist < bestd)
				  
				  {
					  
					  a = p[2] - r;
					  if (a < 0)a = -a;
					  dist += a;
					  if (dist < bestd)
					  {
						  bestd = dist;
						  best = p[3];
					  }
					  
				  }
				  
			  }
			  
		  }
		  
		}
		
	    return (best);
		
	  }
	  
	  var process = exports.process = function process()/*ByteArray*/
	  {
	   
	    learn();
	    unbiasnet();
	    inxbuild();
	    return colorMap();
		
	  }
	  
	  /*
	  * Unbias network to give byte values 0..255 and record position i to prepare
	  * for sort
	  * -----------------------------------------------------------------------------------
	  */
	  
	  var unbiasnet = function unbiasnet()/*void*/
	  
	  {
	
	    var i/*int*/;
	    var j/*int*/;
	
	    for (i = 0; i < netsize; i++)
		{
	      network[i][0] >>= netbiasshift;
	      network[i][1] >>= netbiasshift;
	      network[i][2] >>= netbiasshift;
	      network[i][3] = i; /* record colour no */
	    }
		
	  }
	  
	  /*
	  * Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2)) in
	  * radpower[|i-j|]
	  * ---------------------------------------------------------------------------------
	  */
	  
	  var alterneigh = function alterneigh(rad/*int*/, i/*int*/, b/*int*/, g/*int*/, r/*int*/)/*void*/
	  
	  {
		  
		  var j/*int*/;
		  var k/*int*/;
		  var lo/*int*/;
		  var hi/*int*/;
		  var a/*int*/;
		  var m/*int*/;
		  
		  var p/*Array*/;
		  
		  lo = i - rad;
		  if (lo < -1) lo = -1;
		  
		  hi = i + rad;
		  
		  if (hi > netsize) hi = netsize;
		  
		  j = i + 1;
		  k = i - 1;
		  m = 1;
		  
		  while ((j < hi) || (k > lo))
		  
		  {
			  
			  a = radpower[m++];
			  
			  if (j < hi)
			  
			  {
				  
				  p = network[j++];
				  
				  try {
					  
					  p[0] -= (a * (p[0] - b)) / alpharadbias;
					  p[1] -= (a * (p[1] - g)) / alpharadbias;
					  p[2] -= (a * (p[2] - r)) / alpharadbias;
					  
					  } catch (e/*Error*/) {} // prevents 1.3 miscompilation
					  
				}
				
				if (k > lo)
				
				{
					
					p = network[k--];
					
					try
					{
						
						p[0] -= (a * (p[0] - b)) / alpharadbias;
						p[1] -= (a * (p[1] - g)) / alpharadbias;
						p[2] -= (a * (p[2] - r)) / alpharadbias;
						
					} catch (e/*Error*/) {}
					
				}
				
		  }
		  
	  }
	  
	  /*
	  * Move neuron i towards biased (b,g,r) by factor alpha
	  * ----------------------------------------------------
	  */
	  
	  var altersingle = function altersingle(alpha/*int*/, i/*int*/, b/*int*/, g/*int*/, r/*int*/)/*void*/ 
	  {
		  
		  /* alter hit neuron */
		  var n/*Array*/ = network[i];
		  n[0] -= (alpha * (n[0] - b)) / initalpha;
		  n[1] -= (alpha * (n[1] - g)) / initalpha;
		  n[2] -= (alpha * (n[2] - r)) / initalpha;
		
	  }
	  
	  /*
	  * Search for biased BGR values ----------------------------
	  */
	  
	  var contest = function contest(b/*int*/, g/*int*/, r/*int*/)/*int*/
	  {
		  
		  /* finds closest neuron (min dist) and updates freq */
		  /* finds best neuron (min dist-bias) and returns position */
		  /* for frequently chosen neurons, freq[i] is high and bias[i] is negative */
		  /* bias[i] = gamma*((1/netsize)-freq[i]) */
		  
		  var i/*int*/;
		  var dist/*int*/;
		  var a/*int*/;
		  var biasdist/*int*/;
		  var betafreq/*int*/;
		  var bestpos/*int*/;
		  var bestbiaspos/*int*/;
		  var bestd/*int*/;
		  var bestbiasd/*int*/;
		  var n/*Array*/;
		  
		  bestd = ~(1 << 31);
		  bestbiasd = bestd;
		  bestpos = -1;
		  bestbiaspos = bestpos;
		  
		  for (i = 0; i < netsize; i++)
		  
		  {
			  
			  n = network[i];
			  dist = n[0] - b;
			  
			  if (dist < 0) dist = -dist;
			  
			  a = n[1] - g;
			  
			  if (a < 0) a = -a;
			  
			  dist += a;
			  
			  a = n[2] - r;
			  
			  if (a < 0) a = -a;
			  
			  dist += a;
			  
			  if (dist < bestd)
			  
			  {
				  
				  bestd = dist;
				  bestpos = i;
				  
			  }
			  
			  biasdist = dist - ((bias[i]) >> (intbiasshift - netbiasshift));
			  
			  if (biasdist < bestbiasd)
			  
			  {
				  
				  bestbiasd = biasdist;
				  bestbiaspos = i;
				  
			  }
			  
			  betafreq = (freq[i] >> betashift);
			  freq[i] -= betafreq;
			  bias[i] += (betafreq << gammashift);
			  
		  }
		  
		  freq[bestpos] += beta;
		  bias[bestpos] -= betagamma;
		  return (bestbiaspos);
		  
	  }
	  
	  NeuQuant.apply(this, arguments);
	  return exports;
	}

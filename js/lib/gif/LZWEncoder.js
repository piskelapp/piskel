/**
* This class handles LZW encoding
* Adapted from Jef Poskanzer's Java port by way of J. M. G. Elliott.
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/

	//import flash.utils.ByteArray;
	
	LZWEncoder = function()
	{
	    var exports = {};
		/*private_static*/ var EOF/*int*/ = -1;
		/*private*/ var imgW/*int*/;
		/*private*/ var imgH/*int*/
		/*private*/ var pixAry/*ByteArray*/;
		/*private*/ var initCodeSize/*int*/;
		/*private*/ var remaining/*int*/;
		/*private*/ var curPixel/*int*/;
		
		// GIFCOMPR.C - GIF Image compression routines
		// Lempel-Ziv compression based on 'compress'. GIF modifications by
		// David Rowley (mgardi@watdcsu.waterloo.edu)
		// General DEFINEs
		
		/*private_static*/ var BITS/*int*/ = 12;
		/*private_static*/ var HSIZE/*int*/ = 5003; // 80% occupancy
		
		// GIF Image compression - modified 'compress'
		// Based on: compress.c - File compression ala IEEE Computer, June 1984.
		// By Authors: Spencer W. Thomas (decvax!harpo!utah-cs!utah-gr!thomas)
		// Jim McKie (decvax!mcvax!jim)
		// Steve Davies (decvax!vax135!petsd!peora!srd)
		// Ken Turkowski (decvax!decwrl!turtlevax!ken)
		// James A. Woods (decvax!ihnp4!ames!jaw)
		// Joe Orost (decvax!vax135!petsd!joe)
		
		/*private*/ var n_bits/*int*/ // number of bits/code
		/*private*/ var maxbits/*int*/ = BITS; // user settable max # bits/code
		/*private*/ var maxcode/*int*/ // maximum code, given n_bits
		/*private*/ var maxmaxcode/*int*/ = 1 << BITS; // should NEVER generate this code
		/*private*/ var htab/*Array*/ = new Array;
		/*private*/ var codetab/*Array*/ = new Array;
		/*private*/ var hsize/*int*/ = HSIZE; // for dynamic table sizing
		/*private*/ var free_ent/*int*/ = 0; // first unused entry
		
		// block compression parameters -- after all codes are used up,
		// and compression rate changes, start over.
		
		/*private*/ var clear_flg/*Boolean*/ = false;
		
		// Algorithm: use open addressing double hashing (no chaining) on the
		// prefix code / next character combination. We do a variant of Knuth's
		// algorithm D (vol. 3, sec. 6.4) along with G. Knott's relatively-prime
		// secondary probe. Here, the modular division first probe is gives way
		// to a faster exclusive-or manipulation. Also do block compression with
		// an adaptive reset, whereby the code table is cleared when the compression
		// ratio decreases, but after the table fills. The variable-length output
		// codes are re-sized at this point, and a special CLEAR code is generated
		// for the decompressor. Late addition: construct the table according to
		// file size for noticeable speed improvement on small files. Please direct
		// questions about this implementation to ames!jaw.
		
		/*private*/ var g_init_bits/*int*/;
		/*private*/ var ClearCode/*int*/;
		/*private*/ var EOFCode/*int*/;
		
		// output
		// Output the given code.
		// Inputs:
		// code: A n_bits-bit integer. If == -1, then EOF. This assumes
		// that n_bits =< wordsize - 1.
		// Outputs:
		// Outputs code to the file.
		// Assumptions:
		// Chars are 8 bits long.
		// Algorithm:
		// Maintain a BITS character long buffer (so that 8 codes will
		// fit in it exactly). Use the VAX insv instruction to insert each
		// code in turn. When the buffer fills up empty it and start over.
		
		/*private*/ var cur_accum/*int*/ = 0;
		/*private*/ var cur_bits/*int*/ = 0;
		/*private*/ var masks/*Array*/ = [ 0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F, 0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF ];
		
		// Number of characters so far in this 'packet'
		/*private*/ var a_count/*int*/;
		
		// Define the storage for the packet accumulator
		/*private*/ var accum/*ByteArray*/ = [];
		
		var LZWEncoder = exports.LZWEncoder = function LZWEncoder (width/*int*/, height/*int*/, pixels/*ByteArray*/, color_depth/*int*/)
		{
			
			imgW = width;
			imgH = height;
			pixAry = pixels;
			initCodeSize = Math.max(2, color_depth);
			
		}
		
		// Add a character to the end of the current packet, and if it is 254
		// characters, flush the packet to disk.
		var char_out = function char_out(c/*Number*/, outs/*ByteArray*/)/*void*/
		{
			accum[a_count++] = c;
			if (a_count >= 254) flush_char(outs);
			
		}
		
		// Clear out the hash table
		// table clear for block compress
		
		var cl_block = function cl_block(outs/*ByteArray*/)/*void*/
		{
			
			cl_hash(hsize);
			free_ent = ClearCode + 2;
			clear_flg = true;
			output(ClearCode, outs);
			
		}
		
		// reset code table
		var cl_hash = function cl_hash(hsize/*int*/)/*void*/
		{
			
			for (var i/*int*/ = 0; i < hsize; ++i) htab[i] = -1;
			
		}
		
		var compress = exports.compress = function compress(init_bits/*int*/, outs/*ByteArray*/)/*void*/
		
		{
			var fcode/*int*/;
			var i/*int*/ /* = 0 */;
			var c/*int*/;
			var ent/*int*/;
			var disp/*int*/;
			var hsize_reg/*int*/;
			var hshift/*int*/;
			
			// Set up the globals: g_init_bits - initial number of bits
			g_init_bits = init_bits;
			
			// Set up the necessary values
			clear_flg = false;
			n_bits = g_init_bits;
			maxcode = MAXCODE(n_bits);
	
			ClearCode = 1 << (init_bits - 1);
			EOFCode = ClearCode + 1;
			free_ent = ClearCode + 2;
	
			a_count = 0; // clear packet
		
			ent = nextPixel();
	
			hshift = 0;
			for (fcode = hsize; fcode < 65536; fcode *= 2)
			  ++hshift;
			hshift = 8 - hshift; // set hash code range bound
	
			hsize_reg = hsize;
			cl_hash(hsize_reg); // clear hash table
		
			output(ClearCode, outs);
		
			outer_loop: while ((c = nextPixel()) != EOF)
			
			{
				
				fcode = (c << maxbits) + ent;
				i = (c << hshift) ^ ent; // xor hashing
	
				if (htab[i] == fcode)
				{
				ent = codetab[i];
				continue;
				} else if (htab[i] >= 0) // non-empty slot
				{
					disp = hsize_reg - i; // secondary hash (after G. Knott)
					if (i == 0)
					disp = 1;
					do 
					{
						
						if ((i -= disp) < 0) i += hsize_reg;
	
						if (htab[i] == fcode)
						{
						ent = codetab[i];
						continue outer_loop;
						}
					} while (htab[i] >= 0);
				}
	      
				output(ent, outs);
				ent = c;
				if (free_ent < maxmaxcode)
				{
					codetab[i] = free_ent++; // code -> hashtable
					htab[i] = fcode;
				} else cl_block(outs);
			}
			
			// Put out the final code.
			output(ent, outs);
			output(EOFCode, outs);
			
		}
		
		// ----------------------------------------------------------------------------
		var encode = exports.encode = function encode(os/*ByteArray*/)/*void*/
		{
			os.writeByte(initCodeSize); // write "initial code size" byte
			remaining = imgW * imgH; // reset navigation variables
			curPixel = 0;
			compress(initCodeSize + 1, os); // compress and write the pixel data
			os.writeByte(0); // write block terminator
			
		}
		
		// Flush the packet to disk, and reset the accumulator
		var flush_char = function flush_char(outs/*ByteArray*/)/*void*/
		{
			
			if (a_count > 0)
			{
				outs.writeByte(a_count);
				outs.writeBytes(accum, 0, a_count);
				a_count = 0;
			}
			
		}
		
		var MAXCODE = function MAXCODE(n_bits/*int*/)/*int*/
		{
			
			return (1 << n_bits) - 1;
			
		}
		
		// ----------------------------------------------------------------------------
		// Return the next pixel from the image
		// ----------------------------------------------------------------------------
		
		var nextPixel = function nextPixel()/*int*/
		{
			
			if (remaining == 0) return EOF;
			
			--remaining;
			
			var pix/*Number*/ = pixAry[curPixel++];
			
			return pix & 0xff;
			
		}
		
		var output = function output(code/*int*/, outs/*ByteArray*/)/*void*/
		
		{
			cur_accum &= masks[cur_bits];
			
			if (cur_bits > 0) cur_accum |= (code << cur_bits);
			else cur_accum = code;
			
			cur_bits += n_bits;
			
			while (cur_bits >= 8)
			
			{
				
				char_out((cur_accum & 0xff), outs);
				cur_accum >>= 8;
				cur_bits -= 8;
				
			}
			
			// If the next entry is going to be too big for the code size,
			// then increase it, if possible.
			
			if (free_ent > maxcode || clear_flg)
			{
				
				if (clear_flg)
				{
					
					maxcode = MAXCODE(n_bits = g_init_bits);
					clear_flg = false;
					
				} else
				{
					
					++n_bits;
					
					if (n_bits == maxbits) maxcode = maxmaxcode;
					
					else maxcode = MAXCODE(n_bits);
					
				}
				
			}
			
			if (code == EOFCode) 
			{
				
				// At EOF, write the rest of the buffer.
				while (cur_bits > 0) 
				{
					
					char_out((cur_accum & 0xff), outs);
					cur_accum >>= 8;
					cur_bits -= 8;
				}
				
				
				flush_char(outs);
				
			}
			
		}
		LZWEncoder.apply(this, arguments);
	   return exports;
	}
	

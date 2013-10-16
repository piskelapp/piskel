/* This file is in the public domain. Peter O., 2012-2013. http://upokecenter.dreamhosters.com
    Public domain dedication: http://creativecommons.org/publicdomain/zero/1.0/  */

/* global getComputedValue, getWidth, getHeight, getPageX,
   getPageY, setPageX, setPageY, setWidth, setHeight, rgbToColor,
   colorToRgba, subclass, colorToRgb, rgbToColorHtml, removeListener,
   addListener, addReadyListener, rgbaToColorRgba, rgbaToColorArgb,
   rgbToColorDisplay, colorRgbaToRgba, colorArgbToRgba, isRgbDark,
   MethodBinder, eventDetails, 
   rgbToColorRgba, rgbToColorArgb */
(function(window,rootobj){
  "use strict";
var doNothingURL="javascript:void(null)";
  var removeFilter=function(o,filter){
   if("filter" in o.style){
    var fs=(o.style.filter||"");
    if(fs==="none")return;
    fs=(getComputedValue(o,"filter")||"");
    if(fs==="none"||fs==="")return;
    var ftmp=fs;
    var ff=[];
    filter=filter.toLowerCase();
    while(ftmp.length>0){
     var e=(/^(\s*([^\(\s\,]+)\s*(\([^\)]+\))?\s*)/).exec(ftmp);
     if(e){
      var filtername=e[2];
      var filterparams=(e[3]||"");
      var lcfiltername=e[2].toLowerCase();
      if(lcfiltername!==filter && lcfiltername!=="progid:dximagetransform.microsoft."+filter){
       ff[ff.length]=filtername+filterparams;
      }
      ftmp=ftmp.substr(e[1].length);
     } else break;
    }
    var newfs=ff.join(" ");
    if(newfs.length===0)newfs="none";
    if(fs!==newfs)o.style.filter=newfs;
   }
  };
 var fakeMultiGradient=function(o,colors){
  if(colors.length===2)return applyCssGradient(o,colors);
  var nodes=o.getElementsByTagName("div");
  var i;
  if(nodes.length===colors.length-1){
   for(i=0;i<nodes.length;i++){
    if(!applyCssGradient(nodes[i],[colors[i],colors[i+1]]))return false ;
   }
   return true;
  } else {
   if(nodes.length<colors.length-1){
    var nodearray=[];
    for(i=0;i<colors.length-1;i++){
     if(i<nodes.length)nodearray[i]=nodes[i];
     else {
      nodearray[i]=document.createElement("div");
      nodearray[i].style.position="absolute";
      o.appendChild(nodearray[i]);
     }
    }
    nodes=nodearray;
   }
   var w=getWidth(o);
   var h=getHeight(o);
   var px=getPageX(o);
   var py=getPageY(o);
   for(i=0;i<nodes.length;i++){
    var y=Math.floor((i)*h*1.0/(colors.length-1));
    var hnext=Math.floor((i+1)*h*1.0/(colors.length-1));
    var ht=hnext-y;
    var n=nodes[i];
    if(ht<=0)o.removeChild(n);
    else {
     setPageX(n,px);
     setPageY(n,py+y);
     setWidth(n,w);
     setHeight(n,ht);
     if(!applyCssGradient(n,[colors[i],colors[i+1]]))return false;
    }
   }
   return true;
  }
 };
 var applyCssGradient=function(o,colors){
 if(!o || !colors || colors.length===0)return false;// no colors
 var colorstrings=[];
 for(var i=0;i<colors.length;i++){
  if(colors[i] && colors[i].constructor===Array)
   colorstrings[colorstrings.length]=rgbToColor(colors[i]);
  else
   colorstrings[colorstrings.length]=""+colors[i];
 }
 if(colors.length===1){ // single color
  o.style.backgroundColor=colorstrings[0];
  return true ;
 }
 var bi=o.style.backgroundImage;
 if(bi.indexOf("linear-gradient(")!==0)o.style.backgroundImage="none";
 try { o.style.backgroundImage="linear-gradient("+colorstrings.join(",")+")";
 bi=o.style.backgroundImage;
 if(bi!=="none" && bi!=="")return true;} catch(ex){}
 try { o.style.backgroundImage="-moz-linear-gradient("+colorstrings.join(",")+")";
 bi=o.style.backgroundImage;
 if(bi!=="none" && bi!=="")return true;} catch(ex){}
 var gradientstring="linear, 0 0, 0 100%";
 for(var j=0;j<colorstrings.length;j++){
   if(j===0)gradientstring+=", from(";
   else if(j===colorstrings.length-1)gradientstring+=", to(";
   else gradientstring+=", color-stop("+(j*1.0/(colors.length-1))+", ";
   gradientstring+=colorstrings[j]+")";
 }
 try { o.style.background="-webkit-gradient("+gradientstring+")";
 bi=o.style.backgroundImage;
 if(bi!=="none" && bi!=="")return true;} catch(ex){}
 try { o.style.backgroundImage="-o-linear-gradient("+colorstrings.join(",")+")";
 bi=o.style.backgroundImage;
 if(bi!=="none" && bi!=="")return true;} catch(ex){}
 try { o.style.backgroundImage="-ms-linear-gradient("+colorstrings.join(",")+")";
 bi=o.style.backgroundImage;
 if(bi!=="none" && bi!=="")return true;} catch(ex){}
 if(colors.length===2 && "filters" in o){
  var c=0;
  var s=colorToRgba(colorstrings[0])||[0,0,0,0];
  var e=colorToRgba(colorstrings[1])||[0,0,0,0];
  var tohex=function(v){
   var hx="0123456789ABCDEF";
   var d=0; var c=((d=Math.round(v))<0 ? 0 : (d>255 ? 255 : d));
   return hx.charAt((c>>4)&15)+hx.charAt(c&15);
  };
  var ss="#"+tohex(s[3])+tohex(s[0])+tohex(s[1])+tohex(s[2]);
  var es="#"+tohex(e[3])+tohex(e[0])+tohex(e[1])+tohex(e[2]);
  if((""+o.style.zoom)==="")o.style.zoom="1";
  removeFilter(o,"gradient");
  var filter=(o.style.filter||"");
  if(filter!=="" && filter!=="none")filter+=","; else filter="";
  filter+="progid:DXImageTransform.Microsoft.Gradient(GradientType=0,StartColorStr='"+ss+"',EndColorStr='"+es+"')";
  o.style.filter=filter;
  return true;
 } else if("filters" in o){
  return fakeMultiGradient(o,colors) ;
 }
 return false;
} ;
var ColorSpace=subclass(Object,{
  initialize:function(info,usealpha){
  this.usealpha=usealpha;
  this.info=info;
  var faster=(navigator.userAgent.indexOf("Gecko/")>=0);
  faster=true;
  this.maxWidth=(faster ? 36 : 60);
  this.maxHeight=(faster ? 36 : 60);
  this.areas=[];
  this.emptyArea=[0,0,0,0];
  this.swatchWidth=Math.floor(this.maxWidth*1/3);
  this.matrixWidth=Math.floor(this.maxWidth*(this.usealpha ? 80 : 85)/100);
  this.matrixHeight=Math.floor(this.maxHeight*80/100);
  this.setupdimensions();
  this.areacache=[];
 },
fromrgbcolor:function(c){
 var ret=(typeof this.info.fromrgbcolor!=="undefined" && this.info.fromrgbcolor) ?
   this.info.fromrgbcolor(c) : [0,0,0];
 if(ret===c){ ret=[c[0],c[1],c[2]];}
 ret[3]=((c[3]===null || typeof c[3]==="undefined")) ? 255 : c[3];
 return ret;
},
torgbcolor:function(c){
 var ret=this.info.torgbcolor(c);
 if(ret===c){ ret=[c[0],c[1],c[2]];}
 ret[3]=((c[3]===null || typeof c[3]==="undefined")) ? 255 : c[3];
 return ret;
},
dimensions:function(){
  return [this.maxWidth,this.maxHeight];
},
areadimensions:function(area){
 var a=this.areas[area];
 if(!a)return this.emptyArea;
 return a;
},
setupdimensions:function(){
 if(!(typeof this.info.fromrgbcolor!=="undefined" && this.info.fromrgbcolor)){
 if(!this.usealpha)this.areas[1]=[0,0,this.maxWidth,this.matrixHeight];
 else this.areas[1]=[0,0,this.matrixWidth+
                Math.floor((this.maxWidth-this.matrixWidth)/2),this.matrixHeight];
 // side bar
 this.areas[2]=[0,0,0,0];
 // alpha bar
  if(this.usealpha)this.areas[6]=[this.matrixWidth+
                Math.floor((this.maxWidth-this.matrixWidth)/2),0,
                Math.floor((this.maxWidth-this.matrixWidth)/2),
               this.matrixHeight];
 } else {
 // color matrix
 this.areas[1]=[0,0,this.matrixWidth,this.matrixHeight];
 // side bar
 if(this.usealpha)this.areas[2]=[this.matrixWidth,0,
               Math.floor((this.maxWidth-this.matrixWidth)/2),
               this.matrixHeight];
 else this.areas[2]=[this.matrixWidth,0,
                this.maxWidth-this.matrixWidth,
               this.matrixHeight];
 // alpha bar
  if(this.usealpha)this.areas[6]=[this.matrixWidth+
                Math.floor((this.maxWidth-this.matrixWidth)/2),0,
                Math.floor((this.maxWidth-this.matrixWidth)/2),
               this.matrixHeight];
  }
 // swatch
 this.areas[3]=[0,this.matrixHeight,this.swatchWidth,
               this.maxHeight-this.matrixHeight] ;
 // color value
 this.areas[4]=[this.swatchWidth,
               this.matrixHeight,
               this.maxWidth-this.swatchWidth,
               Math.floor((this.maxHeight-this.matrixHeight)/2)] ;
 // reset link
 this.areas[5]=[this.swatchWidth,
               this.matrixHeight+Math.floor((this.maxHeight-this.matrixHeight)/2),
               this.maxWidth-this.swatchWidth,
               Math.floor((this.maxHeight-this.matrixHeight)/2)] ;
},
confinetoarea:function(area,xy){
 var nxy=[xy[0],xy[1]];
 var dims=this.areadimensions(area);
 if(nxy[0]<dims[0])nxy[0]=dims[0];
 if(nxy[0]>dims[0]+dims[2]-1)nxy[0]=dims[0]+dims[2]-1;
 if(nxy[1]<dims[1])nxy[1]=dims[1];
 if(nxy[1]>dims[1]+dims[3]-1)nxy[1]=dims[1]+dims[3]-1;
 return nxy;
},
getarea:function(x,y){
 var unrounded=(Math.round(x)===x && Math.round(y)===y);
 if(unrounded){
  var ret=this.areacache[y*this.maxWidth+x];
  if((ret!==null && typeof ret!=="undefined"))return ret;
 }
 for(var i=1;i<this.areas.length;i++){
  if(!this.areas[i])continue;
  var dims=this.areas[i];
  if(x>=dims[0] && x<dims[0]+dims[2] &&
      y>=dims[1] && y<dims[1]+dims[3]){
   if(unrounded)this.areacache[y*this.maxWidth+x]=i;
   return i ;
  }
 }
 if(unrounded)this.areacache[y*this.maxWidth+x]=this.areas.length;
 return this.areas.length;
},
rgbatorgb:function(rgba,shade){
 if(rgba[3]<255){
  var bgalpha=255-rgba[3];
  return [
   ((rgba[0]*rgba[3])+(shade*bgalpha))/255,
   ((rgba[1]*rgba[3])+(shade*bgalpha))/255,
   ((rgba[2]*rgba[3])+(shade*bgalpha))/255
  ];
 }
 return rgba;
},
getcolor:function(x,y,current){ // for display only
 var area=this.getarea(x,y);
 var rgba,xx,yy,dims;
 if(area===1){
    rgba=this.torgbcolor(this.changecolor(x,y,current));
    rgba[3]=((current[3]===null || typeof current[3]==="undefined")) ? 255 : current[3]; return rgba;
 } else if(area===2){
    var c=this.changecolor(x,y,current);
    rgba=this.info.torgbcolor(c);
    if(rgba===c){ rgba=[c[0],c[1],c[2],0];}
    rgba[3]=((current[3]===null || typeof current[3]==="undefined")) ? 255 : current[3]; return rgba;
 } else if(area===6){
    rgba=this.torgbcolor(this.changecolor(x,y,current)) ;
    if(rgba[3]===255)return rgba;
    dims=this.areadimensions(area);
    xx=Math.floor((x-dims[0])*2/dims[2]);
    yy=Math.floor((y-dims[1])*2/dims[3]);
    return this.rgbatorgb(rgba,xx===yy ? 160 : 220);
 } else if(area===3){ // swatch
    rgba=this.torgbcolor(current) ;
    if(rgba[3]===255)return rgba;
    dims=this.areadimensions(area);
    xx=Math.floor((x-dims[0])*4/dims[2]);
    if(xx<2)
      return [rgba[0],rgba[1],rgba[2],255] ;// plain color
    else
      xx-=2; // alpha color
    yy=Math.floor((y-dims[1])*2/dims[3]);
    return this.rgbatorgb(rgba,xx===yy ? 160 : 220);
 } else {
    return [255,255,255,255];
 }
},
colortopos:function(current){
 var ret=[];
 var dims=this.areadimensions(1);
 var dimsside=this.areadimensions(2);
 var dimsalpha=this.areadimensions(6);
 for(var i=0;i<this.info.maxes.length;i++){
  var v=current[this.info.indexes[i]];
  if(this.info.reversed[this.info.indexes[i]])v=this.info.maxes[this.info.indexes[i]]-v;
  v/=this.info.maxes[this.info.indexes[i]];
  if(i===0)v=dims[0]+v*(dims[2]-1) ;// matrix X
  if(i===1)v=dims[1]+v*(dims[3]-1) ;// matrix Y
  if(i===2)v=dimsside[1]+v*(dimsside[3]-1) ;// side Y
  ret[i]=v;
 }
 ret[3]=dimsalpha[1]+(255-current[3])*(dimsalpha[3]-1)/255.0 ;// alpha side Y
 return ret;
},
changecolor:function(x,y,current){
 var ret=[current[0],current[1],current[2],((current[3]===null || typeof current[3]==="undefined")) ? 255 : current[3]];
 var info=this.info;
 var ci0=info.indexes[0];
 var ci1=info.indexes[1];
 var ci2=info.indexes[2];
 var area=this.areas[1] ;// matrix
 if(x>=area[0] && x<(area[0]+area[2]) &&
    y>=area[1] && y<(area[1]+area[3])){
   var h=((x-area[0])*info.maxes[ci0])/(area[2]-1);
   var s=((y-area[1])*info.maxes[ci1])/(area[3]-1);
   if(info.reversed[ci0])h=info.maxes[ci0]-h;
   if(info.reversed[ci1])s=info.maxes[ci1]-s;
   ret[ci0]=h;
   ret[ci1]=s;
   return ret;
 }
 var lum;
 area=this.areas[2];// side
 if(x>=area[0] && x<(area[0]+area[2]) &&
    y>=area[1] && y<(area[1]+area[3])){
   lum=((y-area[1])*info.maxes[ci2]/(area[3]-1));
   if(info.reversed[ci2])lum=info.maxes[ci2]-lum;
   ret[ci2]=lum;
   return ret;
 }
 area=this.areadimensions(6) ;// alpha side
 if(x>=area[0] && x<(area[0]+area[2]) &&
    y>=area[1] && y<(area[1]+area[3])){
   lum=((y-area[1])*255.0/(area[3]-1));
   ret[3]=255-lum;
   return ret;
  }
  return ret;
}
});

////////////////

  var _namedColorsDatalist=[];
var namedColorsDatalist=function(){
   if(_namedColorsDatalist.length>0)
     return _namedColorsDatalist;
 colorToRgba.setUpNamedColors();var b=_namedColorsDatalist;
 var datalist=document.createElement("datalist");
 for(var o in colorToRgba.namedColors){
  var v=colorToRgba.namedColors[o];
  if(typeof v==="string"){
   var op=document.createElement("option");
   op.value=o; datalist.appendChild(op);
   if(o.indexOf("gray")>=0){
     var o2=o.replace("gray","grey");
     op=document.createElement("option");
     op.value=o2; datalist.appendChild(op);
   }
  }
  }
   var datalistid=""; var dlid=0;
   do{
        datalistid="datalist-colorpicker"+dlid; dlid+=1;
   }while(document.getElementById(datalistid));
   datalist.id=datalistid;
      document.body.appendChild(datalist);
    _namedColorsDatalist=datalistid;
    return _namedColorsDatalist;
};

  var _namedColorsDatalist2=null;
  var namedColorsDatalist2=function(){
   if((_namedColorsDatalist2!==null && typeof _namedColorsDatalist2!=="undefined"))return _namedColorsDatalist2;
   colorToRgba.setUpNamedColors();var colors=[];
   var i,d;
   var exists=false;
   for(var o in colorToRgba.namedColors){
    var v=colorToRgba.namedColors[o];
    if(typeof v==="string" && o.indexOf("grey")<0){
     exists=false;
     var c=rootobj.HueLumSat.fromrgbcolor(colorToRgb(v));
     for(i=0;i<colors.length;i++){
      d=colors[i];if(d[0]===c[0]&&d[1]===c[1]&&
          d[2]===c[2]){ exists=true;break;}
     }
     if(!exists){colors.push(c);}
    }
   }
   for(var r=0;r<=255;r+=85){
   for(var g=0;g<=255;g+=85){
   for(var b=0;b<=255;b+=85){
     var c2=rootobj.HueLumSat.fromrgbcolor([r,g,b]);
     exists=false;
     for(i=0;i<colors.length;i++){
      d=colors[i];if(d[0]===c2[0]&&d[1]===c2[1]&&
          d[2]===c2[2]){ exists=true;break;}
     }
     if(!exists){colors.push(c2);}
   }}}
   colors.sort(function(a,b){
     var vividA=Math.floor(((a[2]*(127.5-Math.abs(a[1]-127.5))/127.5)));
     var vividB=Math.floor(((b[2]*(127.5-Math.abs(b[1]-127.5))/127.5)));
     if(vividA===0 && vividB===0)return a[1]-b[1];
     vividA=Math.ceil(vividA/16);
     vividB=Math.ceil(vividB/16);
     return ((vividA===vividB) ? a[0]-b[0] : vividB-vividA);
   });
   var datalist=document.createElement("datalist");
   for(i=0;i<colors.length;i++){
    var ele=document.createElement("option");
    ele.value=rgbToColorHtml(rootobj.HueLumSat.torgbcolor(colors[i]));
    datalist.appendChild(ele);
   }
   var datalistid=""; var dlid=0;
   do{
        datalistid="datalist-colorpicker"+dlid; dlid+=1;
   }while(document.getElementById(datalistid));
   datalist.id=datalistid;
   document.body.appendChild(datalist);
    _namedColorsDatalist2=datalistid;
    return _namedColorsDatalist2;
  };

// temporarily stubbed here; ieversionorbelow
// is deprecated
var ieversionorbelow=function(ver){
  return false;
};

var useNativeColorPicker=function(thisInput,usealpha){
   if(thisInput.getAttribute("rgbahex")!=="0")return;
     if(!usealpha && supportsColorInput() && (thisInput.type==="text" || thisInput.type==="color")){
      var normalizedRgb=rootobj.normalizeRgb(thisInput);
      var datalistid=("list" in thisInput) ? namedColorsDatalist2() : "";
      var oldtitle=thisInput.getAttribute("title");
      var oldlist=thisInput.getAttribute("list") ;// list applies to "color" inputs differently from "text" inputs
      thisInput.type="color";
      thisInput.title="";
      thisInput.setAttribute("list",datalistid);
      thisInput.value=normalizedRgb;
      // needed because Chrome will align color box to
      // baseline and not to the middle like other input
      // elements
      thisInput.style.verticalAlign="middle";
      var infolink=document.createElement("a");
      infolink.href=doNothingURL;
      infolink.innerHTML=normalizedRgb;
      if(thisInput.nextSibling)thisInput.parentNode.insertBefore(infolink,thisInput.nextSibling);
      else thisInput.parentNode.appendChild(infolink);
      var thisInputBlur=function(){
         if(thisInput.type==="text"){
           infolink.style.display="inline";
           thisInput.type="color";
           thisInput.setAttribute("list",datalistid);
           thisInput.title="";
           thisInput.value=rootobj.normalizeRgb(thisInput);
           removeListener(thisInput,"blur",thisInputBlur);
         }
      };
      addListener(infolink,(window.opera ? "mouseup" : "click"),function(){
         var currentValue=thisInput.value;
         infolink.style.display="none";
         thisInput.type="text";
         thisInput.title=oldtitle;
         thisInput.setAttribute("list",oldlist);
         // needed because Opera won't save value when changing to text
         thisInput.value=rgbToColorDisplay(colorToRgb(currentValue)) ;
         thisInput.focus();
         setTimeout(function(){
           addListener(thisInput,"blur",thisInputBlur);
         },200);
      });
      var oldvalue=thisInput.value;
      setInterval(function(){
         if(oldvalue!==thisInput.value){
           infolink.innerHTML=thisInput.value; oldvalue=thisInput.value;
         }
      },100);
     }
};

  var _supportsPattern=null;
  var supportsPattern=function(){
    if((_supportsPattern!==null && typeof _supportsPattern!=="undefined"))return _supportsPattern;
    var inp=document.createElement("input");
    inp.style.display="none";
    if(!("pattern" in inp) || typeof inp.validity==="undefined"){
     _supportsPattern=false; return _supportsPattern;
    }
    if(navigator.vendor==="Apple Computer, Inc."){
     // Safari doesn't validate forms even though it includes a validation API
     _supportsPattern=false; return _supportsPattern;
    }
    _supportsPattern=true; return _supportsPattern;
  };
  var validatePattern=function(e){
   e=eventDetails(e);
   for(var i=0;i<e.target.elements.length;i++){
    var inp=e.target.elements[i];
    var a=inp.getAttribute("pattern");
    if(!a || a.length===0)continue;
    var inval=false;
    if(inp.getAttribute("required")!==null && inp.value.length===0){
            window.alert("Please fill in the field: "+inp.title);inval=true;
    } else if(inp.value.length>0 && !(new RegExp("^(?:"+a+")$").test(inp.value))){
            window.alert("Please match the requested format: "+inp.title);inval=true;
    }
    if(inval){
            inp.focus();
            e=eventDetails(e);
            e.preventDefault();
            return false;
    }
   }
   return false;
  };

var namedPattern=null;
var setPatternAndTitle=function(thisInput,usealpha){
     if(thisInput.getAttribute("rgbahex")!=="0")return;
     if(thisInput.tagName.toLowerCase()==="input" && thisInput.type==="text"){
      var numberOrPercent="\\s*-?(\\d+|\\d+(\\.\\d+)?%)\\s*";
      var number="\\s*-?\\d+(\\.\\d+)?\\s*";
      var percent="\\s*-?\\d+(\\.\\d+)?%\\s*";
      var datalistid=("list" in thisInput) ? namedColorsDatalist() : "";
      thisInput.setAttribute("list",datalistid);
      if(!namedPattern)namedPattern=colorToRgba.namedColorsPattern();
      var pattern=namedPattern;
      var patternother="|#[A-Fa-f0-9]{6,6}|#[A-Fa-f0-9]{3,3}"+
          "|rgb\\("+numberOrPercent+","+numberOrPercent+","+numberOrPercent+"\\)"+
          "|hsl\\("+number+","+percent+","+percent+"\\)";
      if(usealpha){
          patternother+="|rgba\\("+numberOrPercent+","+numberOrPercent+","+numberOrPercent+","+number+"\\)"+
                      "|hsla\\("+number+","+percent+","+percent+","+number+"\\)";
      }
      if(thisInput.getAttribute("rgbahex")!=="0"){
         patternother+="|[A-Fa-f0-9]{8,8}";
      }
      if(usealpha){
       patternother+="|[Tt][Rr][Aa][Nn][Ss][Pp][Aa][Rr][Ee][Nn][Tt]"
      }
      pattern+=patternother;
      if(window.opera && supportsPattern()){
       // In Opera, use a faster pattern while focused, because Opera seems to verify the
       // pattern for every suggestion
       var patternstart="[Yy][Ee][Ll][Ll][Oo][Ww](?:[Gg][Rr][Ee][Ee][Nn])?|[A-Wa-w][A-Za-z]{1,19}";
       addListener(thisInput,"focus",function(){ this.setAttribute("pattern",patternstart+patternother) ;    });
       addListener(thisInput,"blur",function(){ this.setAttribute("pattern",pattern) ;    });
      }
      var n=window.navigator;
      var lang=(("userLanguage" in n) ? n.userLanguage : (("language" in n) ? n.language : ""));
      if((lang==="en" || lang.indexOf("en-")===0)){
       if(usealpha){
         thisInput.setAttribute("title","Enter an RGB/RGBA color, color name, or HSL/HSLA color "+
            "[ ex.: #FF8020 or rgb(200,0,0) or rgba(200,0,0,0.5) or royalblue or hsl(200,100%,50%) or hsla(200,100%,50%,0.5) ].");
       } else {
         thisInput.setAttribute("title","Enter an RGB color, color name, or HSL color [ "+
            "ex.: #FF8020 or rgb(200,0,0) or royalblue or hsl(200,100%,50%) ].");
       }
      }
      thisInput.setAttribute("pattern","("+pattern+")");
      if(!supportsPattern()){
       // Fallback for browsers without "pattern" support
       if(thisInput.form){
        removeListener(thisInput.form,"submit",validatePattern);
        addListener(thisInput.form,"submit",validatePattern);
       }
      }
     }
};

////////////////
var MyColorPicker=subclass(Object,{
initialize:function(info,parent,startingvalue,usealpha){
  var w=window;
  this.binder=new MethodBinder(this);
  this.isoriginal=(info===rootobj.HueSatVal);
  this.ishueslider=(info===rootobj.HueSatVal || info===rootobj.HueLumSat);
  // TODO: check for data URL support
  if(ieversionorbelow(6))this.isoriginal=false;
  else if(!(navigator.userAgent.indexOf("MSIE ")>=0 ||
   navigator.userAgent.indexOf("like Mac OS X")>=0 ||
   navigator.userAgent.indexOf("like Gecko")>=0 ||
   navigator.userAgent.indexOf("Opera/")>=0 ||
   navigator.userAgent.indexOf("AppleWebKit/")>=0 ||
   navigator.userAgent.indexOf("Gecko/")>=0))this.isoriginal=false;
  this.faster=(navigator.userAgent.indexOf("Gecko/")>=0);
  this.faster=true;
  this.pixelHeight=(this.faster ? 5 : 3);
  this.pixelWidth=(this.faster ? 5 : 3);
  this.p=parent;
  this.origvalue=[startingvalue[0],
     startingvalue[1],
     startingvalue[2],
     ((startingvalue[3]===null || typeof startingvalue[3]==="undefined") || !usealpha) ? 255 : startingvalue[3]] ;
  this.info=info;
  this.usealpha=usealpha;
  this.colorspace=new ColorSpace(info,usealpha);
  this.overalldims=this.colorspace.dimensions();
  this.current=this.colorspace.fromrgbcolor(this.origvalue);
   var changed=false;
   var pagex=0;
   var pagey=0;
  this.origPageX=getPageX(this.p);
  this.origPageY=getPageY(this.p);
  this.divs=[];
  this.divstyles=[];
  this.areacache=[];
  this.handleclick=false;
  var pxheight=this.pixelHeight+"px";
  var pxwidth=this.pixelWidth+"px";
  this.p=parent;
  this.padding=4;
  this.pwidth=(this.padding*2)+(this.overalldims[0]*this.pixelWidth);
  this.pheight=(this.padding*2)+(this.overalldims[1]*this.pixelHeight);
  this.bgcolors=[];
  this.adjustPos();
  this.startx=(this.p.style.position==="absolute") ? 0 : getPageX(this.p);
  this.starty=(this.p.style.position==="absolute") ? 0 : getPageY(this.p);
  this.endx=this.startx+this.pwidth;
  this.endy=this.starty+this.pheight;
  this.p.style.border="1px solid black";
  this.p.style.zIndex=1000;
  try { this.p.style.borderRadius=this.padding+"px" ; }catch(ex){}
  this.p.style.backgroundColor="white";
  this.p.style.width=this.pwidth+"px";
  this.p.style.height=this.pheight+"px";
  var tbl=null;
  tbl=document.createElement("div");
    tbl.style.margin=this.padding+"px";
    tbl.style.padding="0px";
    tbl.style.color="transparent";
    tbl.style.fontSize="1px";
    var ihtml="<table cellspacing='0' cellpadding='0' style='border:none;'>";
    var areadims=this.colorspace.areadimensions(1);
    var area1pure=[areadims[0]+areadims[2]-1,areadims[1]];
    var y,x;
    for(y=0;y<this.overalldims[1];y++){
    ihtml+="<tr>";
    for(x=0;x<this.overalldims[0];x++){
     ihtml+="<td width="+this.pixelWidth+" height="+this.pixelHeight+" style='";
     var area=this.colorspace.getarea(x,y);
     if(area===1 || area===2 || area===6)ihtml+="cursor:crosshair;";
     ihtml+="padding:0;font-size:1px;border:0"+
        ((this.isoriginal && (area===1||(!this.usealpha && area===3))) ? "" : (";background-color:"+rgbToColorHtml(this.colorspace.getcolor(x,y,this.current))));
     ihtml+="'></td>";
    }
    ihtml+="</tr>";
    }
    ihtml+="</table>";
    this.p.appendChild(tbl);
    // for performance reasons, get pageX and pageY before setting the HTML
    this.pagex=getPageX(tbl);
    this.pagey=getPageY(tbl);
    tbl.innerHTML=ihtml;
    tbl=tbl.getElementsByTagName("table")[0];
    var i=0;
    for(y=0;y<this.overalldims[1];y++){
    for(x=0;x<this.overalldims[0];x++){
     this.divs[i]=tbl.rows[y].cells[x];
     this.divstyles[i]=this.divs[i].style;
     i+=1;
    }}
    this.tbl=tbl;
   this.hexvalue=document.createElement("div");
   this.hexvalue.style.position="absolute";
   this.hexvalue.style.color="black";
   this.hexvalue.style.whiteSpace="nowrap";
   this.hueslider=document.createElement("div");
   this.colorbg=document.createElement("div");
   this.swatchbg=document.createElement("div");
   this.overlay=document.createElement("div");
   this.swatchbg.style.position="absolute";
   this.swatchbg.style.whiteSpace="nowrap";
   areadims=this.colorspace.areadimensions(3);
   this.swatchbg.style.width=(this.pixelWidth*areadims[2])+"px";
   this.swatchbg.style.height=(this.pixelHeight*areadims[3])+"px";
   if(this.usealpha)this.swatchbg.style.display="none";
   this.swatchbg.style.backgroundColor=rgbToColorHtml(this.origvalue);
   if(this.ishueslider){
    this.hueslider.style.position="absolute";
    this.hueslider.style.cursor="crosshair";
    this.hueslider.style.whiteSpace="nowrap";
    areadims=this.colorspace.areadimensions(2);
    this.hueslider.style.width=(this.pixelWidth*areadims[2])+"px";
    this.hueslider.style.height=(this.pixelHeight*areadims[3])+"px";
    if(!this.updateHueSlider(this.hueslider,this.current))this.ishueslider=false;
   }
   if(this.isoriginal){
    this.colorbg.style.position="absolute";
    this.colorbg.style.cursor="crosshair";
    this.colorbg.style.whiteSpace="nowrap";
    areadims=this.colorspace.areadimensions(1);
    this.colorbg.style.width=(this.pixelWidth*areadims[2])+"px";
    this.colorbg.style.height=(this.pixelHeight*areadims[3])+"px";
    this.colorbg.style.backgroundColor=rgbToColorHtml(this.colorspace.getcolor(area1pure[0],area1pure[1],this.current));
    this.overlay.style.position="absolute";
    this.overlay.style.cursor="crosshair";
    this.overlay.style.whiteSpace="nowrap";
    var datapng="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAALF0lEQVRYR8XV"+
"91PU5xbH8W9iiqZqqqZqKpZoNIlRE2NJLLErxsQa1KjYiRIVRQUFYwQjhCCI"+
"KArCgEoRBASRKh1cKS5tcWEpuywLW9hllwW+c9+be+eOc/+BuzPnl4x5Xs/n"+
"nPN9EMR//yyUjlJRDVQVJaHy+/v7M6hEKoYKpy5S/tRpyoN/40o5U9uoDdQq"+
"ahk1j5rBv5lMje/r6xtJDbdarUMtFstgnU43ULD9zGaz2N3dbTaZTFpKSTUY"+
"jcYqStLV1VVAZRoMhmQqVq/XR/I/XqICtVqtT2dn58mOjg639vb2A2q12kml"+
"Ujm2trY6NDc3r1QoFEsfPnw4t7a2dvqDBw8m37t3b3xOTo5dUlLSiJCQkGG/"+
"/vrrEPhBAgeJHGKmdBqNRkU1cmA1B5a1tbUVcmi2UqlM4eD4lpaWaxwe1tTU"+
"FNzY2OjX0NDgDeIhk8kO19TUOFdVVe2sqKjYdP/+/XUlJSUr8vLyFmVlZc1J"+
"SUmZFhcXN+ny5cvjfHx87JydnYcvXLhwGBcYInC4yMFmDtZRbRzO5RW1AOVy"+
"ubwY4G59fX0aSCJpoqurqyOAQiorKwPKy8t9wE6Wlpa6FxUVuQDuIeX29PT0"+
"jaBr4uPjl1+7dm1hWFjY7ICAgG9+//33ib/99tu4tWvX2k2ZMmUEFxgmgIgA"+
"FgB9XV2dGqQJpA6kUiqVlgLlkSq9rKwsWSKRxIFFFRcXhxYUFATl5ub6ZWdn"+
"e2dkZHimpaUduXXr1v6EhASnmJiYrZGRkRtIvOrcuXP2Z86cWeDh4TFr7969"+
"U9evXz9x3rx540aNGmXHBUYIICKIBUQPoiZRM/OSAUmBJIWFhQX5+flZYKmk"+
"S6Cl0SSMuH379kXAwMTERN8bN26cio6OPg7qeuXKlX0XL17cTWJH2r2e1KsO"+
"Hz5sD75ww4YNs5YuXfoNv0nvvffeeC4wSgATmZeFFhrA2sFawB7evXu3inRl"+
"mZmZRXfu3MkBvENb2aGkOFJGMdNQ0OCoqCj/8PDwM6Q9GRwc7A58CNj51KlT"+
"u44dO7bFxcXFwcnJadUvv/xiv2LFigVz586d/dlnn0175513JnOBCQJzE0lm"+
"ATOAaWhnK6AcsIaE5YAlN2/ezCVlRmxsbMr169cTQKMj+IWGhoaQ9lxQUJCf"+
"v7+/N/AJLy8vN09Pz4NHjhzZy7x37Ny5czO4wyp+CxYssCf9wk8++WTOa6+9"+
"Np0LTBFopwjWk5qa2gXYAagEbGCBaklZScp7LFIB7c0maRpoEp9R3Pnz56NI"+
"G+bn53eBGQcA+544ccLLzc3N8+DBg0dpucv27dv30PYdq1ev3kLr13/77ber"+
"Jk6cuPyjjz5a9Morr8zlAjMFZiiC9YB1kbATUHX16lUFoIyQUja47NKlS0Uk"+
"zQXNAE0h7U3SRp8+fTryjz/+CGXBgo8ePXoW2IfUXrt37/Z0dHQ86uDg4PLT"+
"Tz/tXbJkya7Zs2c7fvXVVxvGjh27Zvjw4SteeumlpVxgvgAoAvYAGgE7WaI2"+
"UjaRsv7ChQvVoBWBgYGloPl//fVX9p9//plG2mSW6wbwdeCIQ4cOXd63b995"+
"Hhf/HTt2+GzatOnUzz//7Al+lOQHmbvz9OnTd3/xxRdb7ezsNr799tvrBg8e"+
"vJIL2Au0VQTsIaWRlFoWSc2n00xS+d9//10L+oAWS7y9vYtIm8t8M1iuVOBE"+
"EscCX92zZ084sw4hddDGjRv9+c59wL1I7vn999+7zZw58xDf/b5x48Y5ffjh"+
"h9uHDh266bnnnnPgAqsFUooskZWUprNnz+pA2319fVtAG0FloFXMtuz48eMl"+
"zDefTyoHOB34FnDCrl27YrZu3RpF6iu0PIR5B/3www/+ixcv9gH3Aj9B693Z"+
"fFe+/f0jRozY8/rrr+/kAo5cYKNAa0VSWpmpifbqaa8GVAmqAK13d3evYaMr"+
"abPkwIEDRcw4j1ZnAadt27YtGTieRYshdRSpr9jb24eAnwc/C+779ddfe7N4"+
"J5n9cZbvCO13efnll52fffZZJy6wXSClCGhlpt3MVE97O2iviqTNJJWD1oFK"+
"SVvOcpUy40IS5wJn8qrdBk7mC0sgdQwtj5o/f374nDlzLs+YMSOY5AHM3e/T"+
"Tz89w+xPsXyew4YNc2cBDw8cOPAAF3AWQEVSWknZ7erqagDt3L9/fxtoC2gj"+
"j0g9860mbeWWLVvu802XABcA56xcuTKDx+X2smXLkvnjEk/qmFmzZl1l4SJI"+
"Hgp+Afwcrfdn9r6k9+b7P/niiy96PP30025cwFWgtSKvVS+omb9SXaBa0HZQ"+
"Jd9xE4slJ20dba5isyvWrFkjAS4GzgfOod0ZpL5N6mS+8wQemliSX6ftkeBh"+
"o0ePDvn444+DmX3gG2+84ffqq6/6vPDCC95c4CQX8BB4MERm2stMzaBGkupA"+
"NaAqNrqFxWokbT3LVcuMpbS6HFgCXAyczyeWQ+pMWp42derUW2x7IslvgEeP"+
"GTMmitZH8O6Hkv4iyxdE+wNYQD8u4MMFvAVAEbB38+bNFtpror16knaAqpmt"+
"ErQJtAFUxoxraLWUv2blJJZ89913xcAFpM4Fzvryyy/T2fZUPrdk8Jskj3v/"+
"/fejefejSB/B6xfK9x/CAgY/+eSTgVzAX6C1ImDvunXrLLTXBGr48ccftaAa"+
"NrqNh6R10aJFCtLKmbGMF60GWMqcy0ksod0lkyZNKiR13oQJE3J45zOYeRob"+
"nwKe9O677ya8+eabcaSPJn0U7Y8YNGhQ2BNPPHGJC1wQAEVS9jHTnuXLl3eT"+
"tIukOpJ2gKpJqwJtps0KPis5sAy4hsRSElcA3wcuJXUR884fOXJkLng2eAZ4"+
"GngKD08S6RNIH0f7o2n/VS4QyQXCBUARsI+UPfy1MgMamaseVEtSDagaVAna"+
"zGYrJk+eLGfBZMC1wFXAlaQuJ7WElpd88MEHRSxcPngueDZ4Bot3h/SppE+m"+
"/YlcIH7AgAGxXCBaABQB+wCtpLSwySbm2jVt2jQdaCct1oC2kVYJ2syMFePH"+
"j2/gYalnznUkrgaW8plVsmxlfOsSZl7KzIvAC8BzwXNIn0X6dNqfxvxTuEAy"+
"F0gUwESwPjArCS20tpuZGgENgDrATpJq2Go1qAq0lbRNbHcjrZaTuB64DrgG"+
"uIrUD3hsKph5GW2/N2TIkBK++6Lnn3++4JlnnsnjAbrLBbIff/zxTC6QLpBO"+
"BOunrb2ff/55D6CZhCZAI6CB9uqYbSdJNSRVg7aBKkFbaHUTrW7kE5OTuB5Y"+
"BlxL6mqeWyl4JW0vBy+j9RLSlz711FPFzL+QCxRwgTwBTGSO/WC9YFYwCwnN"+
"gCZSGgENgDqWSgvYQVINSdWgqrfeeksJ3ALcDKwAbgSWA9fTchl4LXgNeBW4"+
"lNlXkr6cC5Q99thjEi5wTwASSdYP1Ef1gvWAWUhoBjOR0AjYBagH1NFiLWAH"+
"89WAtoO20WoVsBK4BbiZljcBK4AbaLsc/CG4jPR1XKCW9NVcoIoLSAUQEaAf"+
"oA+gl7KC9JDMAmQG6gYy8YYbwbrADGB6FksHqAXsBOwgrQa0nUVTA7cBq4CV"+
"zLwVvAW8meRNLJ+CCzRygQYuIBcARAARoB+gD6DXViBWkB4Qy3/KDNYNZrIV"+
"oBGwC9AAqLcVqA5UC9hpK9AOEmuA24HVtgJvA1eBK/8pDhU5UOTAfltxaJ+t"+
"OLjXVhxstRWH99gKwGIrkpltBdRtKzCTrQCNtgLtshWowVbAeluB62wFrv2n"+
"OETkgP8Wh/Q/WhzW92hxaO+jxeHWRwuk59ECszxaoOb/KUHkP/zf6l8TfjKF"+
"E35nOQAAAABJRU5ErkJggg==";
     this.overlay.innerHTML="<img src='"+datapng+"' width='"+(this.pixelWidth*areadims[2])+
        "' height='"+(this.pixelHeight*areadims[3])+"'>";
   } else {
    this.colorbg.style.display="none";
    this.overlay.style.display="none";
   }
   var dims=this.colorspace.areadimensions(4);
   this.hexvalue.style.height=(dims[3]*this.pixelHeight)+"px";
   this.resetdiv=document.createElement("div");
   this.resetdiv.style.position="absolute";
   dims=this.colorspace.areadimensions(5);
   this.resetdiv.style.height=(dims[3]*this.pixelHeight)+"px";
   this.resetlink=document.createElement("a");
   this.resetlink.setAttribute("href",doNothingURL);
   this.resetlink.innerHTML="Reset";
   this.resetdiv.appendChild(this.resetlink);
   this.p.appendChild(this.swatchbg);
   this.p.appendChild(this.colorbg);
   this.p.appendChild(this.hueslider);
   this.p.appendChild(this.overlay);
   this.p.appendChild(this.resetdiv);
   this.p.appendChild(this.hexvalue);
   this.cursors=[];
   for(i=0;i<3;i++){
    this.cursors[i]=document.createElement("div");
    this.cursors[i].style.position="absolute";
    this.cursors[i].style.cursor="crosshair";
    this.cursors[i].style.backgroundColor="transparent";
    this.cursors[i].style.padding="2px 2px 2px 2px";
    this.cursors[i].style.border=(i===0) ? "2px dotted black" : "2px solid black";
    this.cursors[i].style.fontSize="1px" ; // needed for quirks mode
    this.p.appendChild(this.cursors[i]);
   }
   if(!this.usealpha)this.cursors[2].style.display="none";
   this.currentArea=0;
   this.adjustPos();
   this.pagex=getPageX(tbl) ; // get page X again since table's x may have changed
   this.startx=(this.p.style.position==="absolute") ? 0 : getPageX(this.p);
   this.starty=(this.p.style.position==="absolute") ? 0 : getPageY(this.p);
   this.endx=this.startx+this.pwidth;
   this.endy=this.starty+this.pheight;
   this.readjustpos(this.current);
   this.focusedCursor=0;
   this.setValueText(rgbToColorDisplay(this.origvalue));
   addListener(this.resetlink,"click",this.binder.bind(this.resetLinkClick));
   addListener(window,"resize",this.binder.bind(this.windowResize));
   addListener(document,"keydown",this.binder.bind(this.documentKeyDown));
   addListener(document,"mousedown",this.binder.bind(this.documentMouseDown));
   addListener(document,"mouseup",this.binder.bind(this.documentMouseUp));
   addListener(document,"mousemove",this.binder.bind(this.documentMouseMove));
   addListener(document,"touchstart",this.binder.bind(this.documentMouseDown));
   addListener(document,"touchend",this.binder.bind(this.documentMouseUp));
   addListener(document,"touchmove",this.binder.bind(this.documentMouseMove));
},
documentKeyDown:function(e){
  e=eventDetails(e);
  var key=e.key();
  if(key===9){ // tab
   this.focusedCursor++;
   var m=("focus" in this.resetlink) ? 3 : 2;
   var choices=((this.usealpha) ? m+1 : m);
   this.focusedCursor%=choices;
   for(var i=0;i<3;i++){
     this.cursors[i].style.borderStyle=(i===this.focusedCursor) ? "dotted" : "solid";
   }
   if("focus" in this.resetlink){
    if(this.focusedCursor===choices-1)this.resetlink.focus();
    else this.resetlink.blur();
   }
   e.preventDefault();
   return false;
  }
  var focusedArea=[1,2,6][this.focusedCursor];
  var curpos=this.colorspace.colortopos(this.current);
  var dimsmatrix=this.colorspace.areadimensions(focusedArea) ;// matrix dimensions
  var xy=[dimsmatrix[0]+curpos[0],dimsmatrix[1]+curpos[1]];
  if(focusedArea===2){
   xy=[dimsmatrix[0],dimsmatrix[1]+curpos[2]];
  }
  if(focusedArea===6){
   xy=[dimsmatrix[0],dimsmatrix[1]+curpos[3]];
  }
  if(key===37){ // left
    xy[0]-=1;
  } else if(key===38){ //up
    xy[1]-=1;
  } else if(key===39){ //right
    xy[0]+=1;
  } else if(key===40){ //down
    xy[1]+=1;
  }
  if(key>=37 && key<=40){
   xy=this.colorspace.confinetoarea(focusedArea,xy);
   var oldcurrentarea=this.currentArea;
   this.respondToMouseDown(e,xy,focusedArea);
   this.currentArea=oldcurrentarea;
   return false;
  }
  return true;
},
updateHueSlider:function(o,current){
 var areadims=this.colorspace.areadimensions(2);
 var huecolors=[
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1],current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+Math.floor((areadims[3]-1)*1/6),current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+Math.floor((areadims[3]-1)*2/6),current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+Math.floor((areadims[3]-1)*3/6),current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+Math.floor((areadims[3]-1)*4/6),current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+Math.floor((areadims[3]-1)*5/6),current)),
     rgbToColorHtml(this.colorspace.getcolor(areadims[0],areadims[1]+areadims[3]-1,current))
    ];
    return applyCssGradient(this.hueslider,huecolors);
},
adjustPos:function(){
   if(this.p.style.position==="absolute"){
    var viewport=getViewport();
    var height=getHeight(this.p);
    var clw=Math.min(viewport.width-getWidth(this.p),this.origPageX);
    setPageX(this.p,clw);
    if(this.origPageY+height>viewport.top+viewport.height){
      setPageY(this.p,this.origPageY-20-height);
    } else {
      setPageY(this.p,this.origPageY); 
    }
    this.pagex=getPageX(this.tbl) ;// get page X again since table's x may have changed
    this.pagey=getPageY(this.tbl) ;// get page Y again since table's y may have changed
   }},
windowResize:function(){
  this.adjustPos();
  if(this.p.style.position!=="absolute"){
   this.startx=getPageX(this.p);
   this.starty=getPageY(this.p);
  } else {
   this.startx=0;
   this.starty=0;
  }
  this.endx=this.startx+this.pwidth;
  this.endy=this.starty+this.pheight;
  this.readjustpos(this.current);
},
setValueText:function(text){
    var size=100;
    var hexarea=this.colorspace.areadimensions(4);
    do {
     this.hexvalue.style.fontSize=size+"%";
     this.hexvalue.innerHTML=text;
     size-=10;
    } while(size>=50 && (text.length>=8 && (getWidth(this.hexvalue)>(hexarea[2]*this.pixelWidth))));
},
isdifferentcolor:function(c1,c2){
    for(var i=0;i<c1.length;i++){
     if(c1[i]!==c2[i])return true;
    }
    return false;
},
getxy:function(evt,pagex,pagey,pixelWidth,pixelHeight){
    var px=evt.pageX();
    px=(px-pagex)*1.0/pixelWidth;
    var py=evt.pageY();
    py=(py-pagey)*1.0/pixelHeight;
    return [px,py];
},
readjustpos:function(current){
    var curpos=this.colorspace.colortopos(current);
    var dimsmatrix=this.colorspace.areadimensions(1) ;         // matrix dimensions
    var dimsswatch=this.colorspace.areadimensions(3) ;         // matrix dimensions
    var dimsside=this.colorspace.areadimensions(2) ;         // side dimensions
    var dimsalpha=this.colorspace.areadimensions(6) ;         // side dimensions
    var dimshex=this.colorspace.areadimensions(4) ;         // color value
    var dimsreset=this.colorspace.areadimensions(5) ;         // reset value
    var suggx;
    var sx=this.startx+this.padding;
    var sy=this.starty+this.padding;
    setPageX(this.hueslider,sx+(dimsside[0]*this.pixelWidth));
    setPageY(this.hueslider,sy+(dimsside[1]*this.pixelHeight));
    setPageX(this.swatchbg,sx+(dimsswatch[0]*this.pixelWidth));
    setPageY(this.swatchbg,sy+(dimsswatch[1]*this.pixelHeight));
    setPageX(this.colorbg,sx+(dimsmatrix[0]*this.pixelWidth));
    setPageY(this.colorbg,sy+(dimsmatrix[1]*this.pixelHeight));
    setPageX(this.overlay,sx+(dimsmatrix[0]*this.pixelWidth));
    setPageY(this.overlay,sy+(dimsmatrix[1]*this.pixelHeight));
    setPageX(this.hexvalue,sx+(dimshex[0]*this.pixelWidth));
    setPageY(this.hexvalue,sy+(dimshex[1]*this.pixelHeight));
    setPageX(this.resetdiv,sx+(dimsreset[0]*this.pixelWidth));
    setPageY(this.resetdiv,sy+(dimsreset[1]*this.pixelHeight));
    setPageX(this.cursors[0],sx+dimsmatrix[0]+((curpos[0]*this.pixelWidth)-4));
    setPageY(this.cursors[0],sy+dimsmatrix[1]+((curpos[1]*this.pixelHeight)-4));
    suggx=dimsside[0]+Math.floor(dimsside[2]/2);
    setPageX(this.cursors[1],sx+((suggx*this.pixelWidth)-4));
    setPageY(this.cursors[1],sy+dimsside[1]+((curpos[2]*this.pixelHeight)-4));
    suggx=dimsalpha[0]+Math.floor(dimsalpha[2]/2);
    setPageX(this.cursors[2],sx+((suggx*this.pixelWidth)-4));
    setPageY(this.cursors[2],sy+dimsalpha[1]+((curpos[3]*this.pixelHeight)-4));
    var rgbcurrent=this.colorspace.torgbcolor(current);
    var dark=isRgbDark(rgbcurrent);
    for(var i=0;i<3;i++){
     this.cursors[i].style.borderColor=(dark) ? "white" : "black";
    }
    this.setValueText(rgbToColorDisplay(rgbcurrent));
},
hide:function(){ // public
    this.p.style.display="none";
    removeListener(this.resetlink,"click",this.binder.bind(this.resetLinkClick));
    removeListener(window,"resize",this.binder.bind(this.windowResize));
    removeListener(document,"keydown",this.binder.bind(this.documentKeyDown));
    removeListener(document,"mousedown",this.binder.bind(this.documentMouseDown));
    removeListener(document,"mouseup",this.binder.bind(this.documentMouseUp));
    removeListener(document,"mousemove",this.binder.bind(this.documentMouseMove));
    removeListener(document,"touchstart",this.binder.bind(this.documentMouseDown));
    removeListener(document,"touchend",this.binder.bind(this.documentMouseUp));
    removeListener(document,"touchmove",this.binder.bind(this.documentMouseMove));
},
isInAreas3:function(o,x,y){
 var a=o.areacache[y*o.overalldims[0]+x];
 if((a===null || typeof a==="undefined")){
  a=o.colorspace.getarea(x,y);
  o.areacache[y*o.overalldims[0]+x]=a;
 }
 return (a===3);
},
cachedarea:function(o,x,y){
 var a=o.areacache[y*o.overalldims[0]+x];
 if((a===null || typeof a==="undefined")){
  a=o.colorspace.getarea(x,y);
  o.areacache[y*o.overalldims[0]+x]=a;
 }
 return a;
},
isInAreas2:function(o,x,y){
 var a=o.areacache[y*o.overalldims[0]+x];
 if((a===null || typeof a==="undefined")){
  a=o.colorspace.getarea(x,y);
  o.areacache[y*o.overalldims[0]+x]=a;
 }
 return (a===1 || a===3 || a===6);
},
isInAreas1:function(o,x,y){
 var a=o.areacache[y*o.overalldims[0]+x];
 if((a===null || typeof a==="undefined")){
  a=o.colorspace.getarea(x,y);
  o.areacache[y*o.overalldims[0]+x]=a;
 }
 return (a===2 || a===3 || a===6);
},
updatedivs:function(area){
    var i=0;
    var areafunc=null;
    var justswatch=false;
    if(area===1)areafunc=this.isInAreas1;
    else if(area===2){justswatch=true; areafunc=this.isInAreas2; }
    else if((area!==null && typeof area!=="undefined")){justswatch=true; areafunc=this.isInAreas3; }
    var maxwidth=this.overalldims[0];
    var maxheight=this.overalldims[1];
    this.swatchbg.style.backgroundColor=rgbToColorHtml(this.colorspace.torgbcolor(this.current));
    if(this.ishueslider && area!==2){
       this.updateHueSlider(this.hueslider,this.current);
       if(this.isoriginal && !this.usealpha)justswatch=true;
    }
    if(this.isoriginal){
     var areadims=this.colorspace.areadimensions(1);
     var area1pure=[areadims[0]+areadims[2]-1,areadims[1]];
     var purecolor=this.colorspace.getcolor(area1pure[0],area1pure[1],this.current);
     this.colorbg.style.backgroundColor=rgbToColorHtml(purecolor);
     if(justswatch && !this.usealpha){
      return;
     }
    }
    for(var y=0;y<maxheight;y++){
    for(var x=0;x<maxwidth;x++){
     var ca=this.cachedarea(this,x,y);
     if((!this.usealpha) && ca===3){i++;continue;}
     if(this.isoriginal){if(ca===1){i++;continue;}}
     if(this.ishueslider){if(ca===2){i++;continue;}}
     if(!areafunc || areafunc(this,x,y)){
      var bgc=this.bgcolors[i]||"";
      var cp=this.colorspace.getcolor(x,y,this.current);
      var c=rgbToColorHtml(cp);
      if(c!==bgc){
       this.divs[i].style.backgroundColor=c;
       this.bgcolors[i]=c;
      }
     }
     i+=1;
    }}
},
setChangeCallback:function(func){ // public
 this.changeCallback=func;
},
triggerChangeCallback:function(c){
 if(this.changeCallback)this.changeCallback(c);
},
resetLinkClick:function(e){
     this.changed=false;
     this.current=this.colorspace.fromrgbcolor(this.origvalue);
     this.readjustpos(this.current);
     this.setValueText(rgbToColorDisplay(this.origvalue));
     this.updatedivs(null);
     var rgb=[this.origvalue[0],this.origvalue[1],this.origvalue[2],this.usealpha ? this.origvalue[3] : 255];
     this.triggerChangeCallback(rgb);
     return false;
},
respondToMouseDown:function(e,xy,area){
     this.currentArea=area;
     var oldcolor=this.current;
     this.current=this.colorspace.changecolor(xy[0],xy[1],this.current);
     this.readjustpos(this.current);
     this.changed=true;
     if(this.isdifferentcolor(oldcolor,this.current)){
      this.updatedivs(area);
      var rgb=this.colorspace.torgbcolor(this.current);
      this.triggerChangeCallback(rgb);
     }
     e.preventDefault();
},
documentMouseDown:function(e){
    this.handleclick=true;
    e=eventDetails(e);
    var xy=this.getxy(e,this.pagex,this.pagey,this.pixelWidth,this.pixelHeight);
    var area=this.colorspace.getarea(xy[0],xy[1]);
    if(area===1 || area===2 || area===6){
       this.respondToMouseDown(e,xy,area);
    }
},
documentMouseUp:function(e){
    this.handleclick=true;
    this.currentArea=0;
},
documentMouseMove:function(e){
    this.handleclick=true;
    if(this.currentArea===1 || this.currentArea===2 || this.currentArea===6){
     e=eventDetails(e);
     var xy=this.getxy(e,this.pagex,this.pagey,this.pixelWidth,this.pixelHeight);
     xy=this.colorspace.confinetoarea(this.currentArea,xy);
     this.respondToMouseDown(e,xy,this.currentArea);
    }
}
});

  var defaultModel=null;
  var EventHandlers=subclass(Object,{
  initialize:function(){ this.handlers=[]; },
  add:function(func){ if(func)this.handlers.push(func) ;      },
  remove:function(func){
   var newhandlers=[];
   var removed=false;
   for(var i=0;i<this.handlers.length;i++){
    if(this.handlers[i]===func && !removed){
     newhandlers[newhandlers.length]=this.handlers[i];
    }
   }
   return newhandlers;
  },
  clear:function(){ this.handlers=[] ;      },
  trigger:function(){
   for(var i=0;i<this.handlers.length;i++){
    if(this.handlers[i])this.handlers[i].apply(this,arguments);
   }
  }
  });
  var PublicEventHandlers=subclass(Object,{
   initialize:function(o){ this.o=o; },
   add:function(f){ this.o.add(f); },
   remove:function(f){ this.o.remove(f); },
   clear:function(f){ this.o.clear(f); }
  });
  var colorChangeEvent=new EventHandlers();
  var colorPreviewEvent=new EventHandlers();
  var colorPickerAdapters=[];
  rootobj.doColorChange=function(input,extra,button){
    var usealpha=extra.usealpha;
    var c=rootobj.getRgba(input);
    coloredInput(input,button);
    colorChangeEvent.trigger(c,input);
  };
  rootobj.setRgba=function(thisInput,cc){
   var attr=thisInput.getAttribute("rgbahex");
   if(attr==="1")thisInput.value=rgbToColorRgba(cc);
   else if(attr==="2")thisInput.value=rgbToColorArgb(cc);
   else thisInput.value=rgbToColorDisplay(cc);
  };
  rootobj.normalizeRgb=function(thisInput){
   var attr=thisInput.getAttribute("rgbahex");
   if(attr==="1")return rgbaToColorRgba(colorRgbaToRgba(thisInput.value));
   else
  if(attr==="2")return rgbaToColorArgb(colorArgbToRgba(thisInput.value));
   else
  return rgbToColorHtml(colorToRgb(thisInput.value));
  };
  rootobj.normalizeRgba=function(thisInput){
   var attr=thisInput.getAttribute("rgbahex");
   if(attr==="1")return rgbaToColorRgba(colorRgbaToRgba(thisInput.value));
   else
 if(attr==="2")return rgbaToColorArgb(colorArgbToRgba(thisInput.value));
   else
 return rgbToColorHtml(colorToRgba(thisInput.value));
  };
  rootobj.getRgba=function(thisInput){
   var attr=thisInput.getAttribute("rgbahex");
   if(attr==="1")return colorRgbaToRgba(thisInput.value)||[0,0,0,255];
   else if(attr==="2")return colorArgbToRgba(thisInput.value)||[0,0,0,255];
   else if(thisInput.getAttribute("usealpha")==="1")return colorToRgba(thisInput.value)||[0,0,0,255];
   else return colorToRgb(thisInput.value)||[0,0,0,255];
  };
  rootobj.doColorPreview=function(input,extra,button){
    var c=rootobj.getRgba(input);
    coloredInput(input,button);
    colorPreviewEvent.trigger(c,input);
  };
  rootobj.getColorChangeEvent=function(){
    return new PublicEventHandlers(colorChangeEvent);
  };
  rootobj.getColorPreviewEvent=function(){
    return new PublicEventHandlers(colorPreviewEvent);
  };
  rootobj.getDefaultColorModel=function(){
    return defaultModel;
  };
  rootobj.setDefaultColorModel=function(model){
    defaultModel=model;
  };
  rootobj.addColorPickerAdapter=function(adapter){
    if(adapter){
     colorPickerAdapters[colorPickerAdapters.length]=adapter;
    }
  };
  var _supportsColorInput=null;
  var supportsColorInput=function(){
    if((_supportsColorInput!==null && typeof _supportsColorInput!=="undefined"))return _supportsColorInput;
    var f=document.createElement("form");
    var inp=document.createElement("input");
    try { inp.type="color" ; } catch(ex){
      _supportsColorInput=false; return _supportsColorInput; }
    inp.style.display="none";
    f.style.display="none";
    f.appendChild(inp);
    document.body.appendChild(f);
    var val=(inp.value||"");
    _supportsColorInput=(val.indexOf("#")===0);
    document.body.removeChild(f);
    return _supportsColorInput;
  };
  var dobgcolordelayfunc=function(o,val){
   return function(){
      if(o.getAttribute("data-currentbgcolor")===val){
       try { o.style.background=val;
       } catch(ex){ o.style.background=rgbToColorHtml(colorToRgba(val)) ; }
       o.setAttribute("data-currentbgcolor","");
      }
     };
  };
  var nobgcolordelay=null;
  var dobgcolordelay=function(o,val){
   if((nobgcolordelay===null || typeof nobgcolordelay==="undefined"))
    nobgcolordelay=(!ieversionorbelow(8));
   if(nobgcolordelay){
    try { o.style.background=val; }
    catch(ex){ o.style.background=rgbToColorHtml(colorToRgba(val)) ; }  return;
   }
   o.setAttribute("data-currentbgcolor",val);
   setTimeout(dobgcolordelayfunc(o,val),100);
  };
  var coloredInput=function(input,button){
   var c=rootobj.getRgba(input);
   dobgcolordelay(input,rgbToColorHtml(c));
   removeFilter(input,"gradient");//IE's filter takes precedence over background, so remove
   input.style.color=(isRgbDark(c)) ? "white" : "black";
   if(button){
    removeFilter(button,"gradient");//IE's filter takes precedence over background, so remove
    dobgcolordelay(button,rgbToColor(c));
    button.style.color=(isRgbDark(c)) ? "white" : "black";
   }
  };
  coloredInput.norgba=false;
  function onNewInputClickFunction(newInput,thisInput,extra){
   return function(){
       var ie7=ieversionorbelow(7) ; // IE7 and below doesn't support div inline-block
       var o=document.createElement((ie7 && extra.flat) ? "span" : "div");
       var cj=null;
       if(!extra.flat){
        o.style.position="absolute";
        document.body.appendChild(o);
       } else {
        if(newInput)newInput.parentNode.insertBefore(o,newInput);
        else
 thisInput.parentNode.insertBefore(o,thisInput);
        if(newInput)newInput.style.display="none";
        o.style.display="inline-block";
       }
       var currentValue=rootobj.getRgba(thisInput);
       o.style.left=getPageX(newInput)+"px";
       o.style.top=(getPageY(newInput)+getHeight(newInput))+"px";
       o.style.margin="0px";
       var cp=new MyColorPicker(extra.info,o,currentValue,extra.usealpha);
       cp.setChangeCallback(function(cc){
         rootobj.setRgba(thisInput,cc);
         coloredInput(thisInput,newInput);
         colorPreviewEvent.trigger(cc,thisInput);
       });
       var checkclick=false;
       var binder=new MethodBinder({});
       var endColorBox=function(){
           cp.hide();
           o.parentNode.removeChild(o);
           removeListener(document,"keydown",binder.bind(keydown));
           removeListener(document,"click",binder.bind(docclick));
           removeListener(document,"mousedown",binder.bind(docdown));
           var cc=rootobj.getRgba(thisInput);
           colorChangeEvent.trigger(cc,thisInput);
       };
       var keydown=function(e){
         e=eventDetails(e);
         if(e.key()===27 || e.key()===13){ // escape or enter
           e.preventDefault();
           e.stopPropagation();
           endColorBox();
         }
       };
       var docclick=function(e){
         e=eventDetails(e);
         var cx=e.pageX(); var cy=e.pageY();
         if(checkclick && !(cx>=getPageX(o) && cy>=getPageY(o) &&
            cx<getPageX(o)+getWidth(o) &&
            cy<getPageY(o)+getHeight(o))){
           e.stopPropagation();
           endColorBox();
         }
       };
       var docdown=function(){ checkclick=true; };
       if(!extra.flat){
        addListener(document,"click",binder.bind(docclick));
        addListener(document,"mousedown",binder.bind(docdown));
        addListener(document,"keydown",binder.bind(keydown));
       }
   };
  }
  rootobj.setUpColoredInputButton=function(thisInput,extra,newInput){
     var chgfunc=function(newInput,thisInput,useAlpha){
      return function(){
          //console.log([thisInput.id,thisInput.value,"I"])
          var c=rootobj.getRgba(thisInput);
          coloredInput(thisInput,newInput);
          colorChangeEvent.trigger(c,thisInput);
          return true;
     };};
     var changefunc=chgfunc(newInput,thisInput,extra.usealpha);
     // because of suggestions, use "input" instead of "keyup" if
     // supported by the browser (IE9 supports input only partially;
     // backspace doesn't trigger the input event)
     addListener(thisInput,("oninput" in thisInput && !ieversionorbelow(9)) ?
      "input" : "keyup",changefunc);
     addListener(thisInput,"change",changefunc);
     return newInput;
  };
  rootobj.createColorPickerButton=function(thisInput,extra){
     var usealpha=extra.usealpha;
     var newInput=document.createElement("input");
     newInput.type="button";
     newInput.value="...";
     coloredInput(thisInput,newInput);
     try { newInput.style.textShadow="none"; }catch(ex){}
     var bid=0; var bidstring=""; do {
      bidstring="colorpickerbuttonid"+bid; bid+=1;
     } while(document.getElementById(bidstring));
     newInput.id=bidstring;
     thisInput.parentNode.insertBefore(newInput,thisInput);
     removeFilter(newInput,"gradient");// try again in case filter wasn't removed
     return rootobj.setUpColoredInputButton(thisInput,extra,newInput);
  };
  rootobj.setColorPicker=function(thisInput,extra){
     if(!extra)extra={};
     var newInput=null;
     var newextra={
      flat: ("flat" in extra) ? extra.flat : false,
      // Don't show a button. Instead, clicking the input
      // box calls up the color picker box.
      nobutton: ("nobutton" in extra) ? extra.nobutton : false,
      argbhex: ("argbhex" in extra) ? extra.argbhex : false,
      rgbahex: ("rgbahex" in extra) ? extra.rgbahex : false,
      usealpha: ("usealpha" in extra) ? extra.usealpha : false,
      info: ("info" in extra && extra.info) ? extra.info : (defaultModel || rootobj.HueSatVal)
     };
     extra=newextra;
     thisInput.setAttribute("usealpha",extra.usealpha ? "1" : "0");
     thisInput.setAttribute("rgbahex",extra.argbhex ? "2" : (extra.rgbahex ? "1" : "0"));
     try { thisInput.style.textShadow="none"; }catch(ex){}
     setPatternAndTitle(thisInput,extra.usealpha);
     for(var i=0;i<colorPickerAdapters.length;i++){
       if((colorPickerAdapters[i])(thisInput,extra)){return;}
     }
     useNativeColorPicker(thisInput,extra.usealpha);
     if(extra.flat){
      thisInput.style.display="none";
      onNewInputClickFunction(newInput,thisInput,extra)();
     } else {
      newInput=(extra.nobutton) ? 
        rootobj.setUpColoredInputButton(thisInput,extra,thisInput) :
        rootobj.createColorPickerButton(thisInput,extra);
      addListener(newInput,"click",onNewInputClickFunction(newInput,thisInput,extra));
     }
  };
  rootobj.hasIdOrClassName=function(o,tag){
   if(o.id.indexOf(tag)===0)return true;
   if(o.className){
    // there may be multiple class names so split them
    var cns=o.className.replace(/^\s+|\s+$/g,"").split(/\s+/);
    for(var i=0;i<cns.length;i++){
     if(cns[i].indexOf(tag)===0)return true;
    }
   }
   return false;
  };
  addReadyListener(function(){ // set up color pickers
   var inputs=document.getElementsByTagName("input");
   var inputsArray=[];
   // convert to array because contents may change
   var i;
   for(i=0;i<inputs.length;i++){ inputsArray[inputsArray.length]=inputs[i]; }
   for(i=0;i<inputsArray.length;i++){
    var thisInput=inputsArray[i];
    if(thisInput.getAttribute("type")==="color" ||
       (thisInput.type==="text" && rootobj.hasIdOrClassName(thisInput,"color_"))){
     rootobj.setColorPicker(thisInput,{usealpha:false});
    } else if(thisInput.getAttribute("type")==="text" && rootobj.hasIdOrClassName(thisInput,"rgbahex_")){
     rootobj.setColorPicker(thisInput,{usealpha:true,rgbahex:true});
    } else if(thisInput.getAttribute("type")==="text" && rootobj.hasIdOrClassName(thisInput,"argbhex_")){
     rootobj.setColorPicker(thisInput,{usealpha:true,argbhex:true});
    } else if(thisInput.getAttribute("type")==="text" && rootobj.hasIdOrClassName(thisInput,"acolor_")){
     rootobj.setColorPicker(thisInput,{usealpha:true});
    }
   }
  });
rootobj.HueLumSat={
 fromrgbcolor:function(rgb){
  var r=rgb[0];
  var g=rgb[1];
  var b=rgb[2];
  var vmax=r;
  if (g > vmax) vmax=g;
  if (b > vmax) vmax=b;
  var vmin=r;
  if (g<vmin) vmin=g;
  if (b<vmin) vmin=b;
  var vadd=(vmax+vmin);
  var lt=vadd/2.0;
  if (vmax===vmin){
   return [0,(lt<0 ? 0 : (lt>255 ? 255 : lt)),0];
  }
  var vd=(vmax-vmin);
   var divisor=(lt<=127.5)?vadd:510-vadd;
   var s=((vd*255)/divisor);
  var h=0;
   var hvd=vd/2;
   if (r === vmax){
    h=(((vmax-b)*60)+hvd)/vd;
    h-=(((vmax-g)*60)+hvd)/vd;
   } else if (b === vmax){
    h=240+(((vmax-g)*60)+hvd)/vd ;
    h-=(((vmax-r)*60)+hvd)/vd ;
   } else {
    h=120+(((vmax-r)*60)+hvd)/vd;
    h-=(((vmax-b)*60)+hvd)/vd;
   }
   if(h<0||h>=360)h=(((h%360)+360)%360);
  return [h,(lt<0 ? 0 : (lt>255 ? 255 : lt)),(s<0 ? 0 : (s>255 ? 255 : s))];
 },
 torgbcolor:function(hls){
 var hueval=hls[0]*1.0;//[0-360)
 var lum=hls[1]*1.0;//[0-255]
 var sat=hls[2]*1.0;//[0-255]
 lum=(lum<0 ? 0 : (lum>255 ? 255 : lum));
 sat=(sat<0 ? 0 : (sat>255 ? 255 : sat));
 if(sat===0){
  return [lum,lum,lum];
 }
 var b=0;
 if (lum<=127.5){
  b=(lum*(255.0+sat))/255.0;
 } else {
  b=lum*sat;
  b=b/255.0;
  b=lum+sat-b;
 }
 var a=(lum*2)-b;
 var r,g,bl;
 if(hueval<0||hueval>=360)hueval=(((hueval%360)+360)%360);
 var hue=hueval+120;
 if(hue>=360)hue-=360;
 if (hue<60) r=(a+(b-a)*hue/60);
 else if (hue<180) r=b;
 else if (hue<240) r=(a+(b-a)*(240-hue)/60);
 else r=a;
 hue=hueval;
 if (hue<60) g=(a+(b-a)*hue/60);
 else if (hue<180) g=b;
 else if (hue<240) g=(a+(b-a)*(240-hue)/60);
 else g=a;
 hue=hueval-120;
 if(hue<0)hue+=360;
 if (hue<60) bl=(a+(b-a)*hue/60);
 else if (hue<180) bl=b;
 else if (hue<240) bl=(a+(b-a)*(240-hue)/60);
 else bl=a;
 return [(r<0 ? 0 : (r>255 ? 255 : r)),
   (g<0 ? 0 : (g>255 ? 255 : g)),
   (bl<0 ? 0 : (bl>255 ? 255 : bl))];
 },
 maxes:[360,255,255], // Hue, Lum, Sat
 reversed:[true,false,false], // Hue, Lum, Sat
 indexes:[1,2,0] // SatxLum, and Hue on the side
};
rootobj.HueSatVal={
 fromrgbcolor:function(rgb){
  var r=rgb[0]/255.0;
  var g=rgb[1]/255.0;
  var b=rgb[2]/255.0;
  var max=r;
  if (g > max) max=g;
  if (b > max) max=b;
  var min=r;
  if (g<min) min=g;
  if (b<min) min=b;
  var v;
  if (max ===0 || max === min){
   v=(max<0 ? 0 : (max>1 ? 1 : max));
   return [0, 0, v*255.0];
  }
  var s=((max - min)/max)*255.0;
  var h;
  if (r === max){
   h=(g - b)/(max - min)*60;
  } else if (g === max){
   h=(2+(b - r)/(max - min))*60;
  } else {
   h=(4+(r - g)/(max - min))*60;
  }
  if (h<0||h>=360)h=(((h%360)+360)%360);
  v=max*255.0;
  return [
    (h<0 ? 0 : (h>360 ? 360 : h)),
    (s<0 ? 0 : (s>255 ? 255 : s)),
    (v<0 ? 0 : (v>255 ? 255 : v))];
},
torgbcolor:function(hsv){
  var hue=hsv[0];
  var sat=hsv[1];
  var val=hsv[2];
  if(hue<0||hue>=360)hue=(((hue%360)+360)%360);
  sat/=255.0;
  val/=255.0;
  var hi=Math.floor(hue/60);
  var f=(hue/60)-hi;
  var c=val*(1-sat);
  var a=val*(1-sat*f);
  var e=val*(1-sat*(1- f));
  var r, g, b;
  if (hi ===0){
   r=val;g=e;b=c;
  } else if (hi === 1){
   r=a;g=val;b=c;
  } else if (hi === 2){
   r=c;g=val;b=e;
  } else if (hi === 3){
   r=c;g=a;b=val;
  } else if (hi === 4){
   r=e;g=c;b=val;
  } else {
   r=val;g=c;b=a;
  }
  r*=255;g*=255;b*=255;
  return [
    (r<0 ? 0 : (r>255 ? 255 : r)),
    (g<0 ? 0 : (g>255 ? 255 : g)),
    (b<0 ? 0 : (b>255 ? 255 : b))];
},
maxes:[360,255,255],
  reversed:[true,false,true],
  indexes:[1,2,0]
 };
})(window,window.PDColorPicker={});
/////////////////////////////////////////
/*
 Copyright (c) 2010 Brian Silverman, Barry Silverman, Ed Spittles

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

var centerx=300, centery=300;
var zoom=1;
var dragMouseX, dragMouseY, moved;
var statbox;

// Some constants for the graphics presentation
// the canvas is embedded in an 800x600 clipping div
//   which gives rise to some of the 300 and 400 values in the code
//   there are also some 600 values
// the 6502D chip coords are in the box (216,179) to (8983,9807)
// we have 4 canvases all the same size, now 2000 pixels square
//   chip background - the layout
//   overlay - a red/white transparency to show logic high or low
//   hilite - to show the selected polygon
//   hitbuffer - abusing color values to return which polygon is under a point
// we no longer use a scaling transform - we now scale the chip data at 
//   the point of drawing line segments
// if the canvas is any smaller than chip coordinates there will be
//   rounding artifacts, and at high zoom there will be anti-aliasing on edges.
var grMaxZoom=12;
var grChipSize=10000;
var grCanvasSize=2000;
var grLineWidth=1;

// Index of layerNames corresponds to index into drawLayers
var layernames = ['metal', 'switched diffusion', 'inputdiode', 'grounded diffusion', 'powered diffusion', 'polysilicon'];
var colors = ['rgba(128,128,192,0.4)','#FFFF00','#FF00FF','#4DFF4D',
              '#FF4D4D','#801AC0','rgba(128,0,255,0.75)'];
var drawlayers = [true, true, true, true, true, true];
              
// some modes and parameters which can be passed in from the URL query
var moveHereFirst;
var expertMode=false
var animateChipLayout = true;
var userCode=[];
var userResetLow;
var userResetHigh;
var headlessSteps=1000;
var noSimulation=false;
var testprogram=[];
var testprogramAddress;

/////////////////////////
//
// Drawing Setup
//
/////////////////////////

// try to present a meaningful page before starting expensive work
function setup(){
	statbox = document.getElementById('status');
	setStatus('loading 6502...');
	setTimeout(setup_part2, 0);
}

function setup_part2(){
	frame = document.getElementById('frame');
	statbox = document.getElementById('status');
	setupParams();
	updateExpertMode(expertMode);
	setupNodes();
	setupTransistors();
	detectOldBrowser();
	setStatus('loading graphics...');
	setTimeout(setup_part3, 0);
}

function setup_part3(){
	if(chipLayoutIsVisible){
		// if user requests no chip layout, we can skip all canvas operations
		// which saves a lot of memory and allows us to run on small systems
		updateChipLayoutVisibility(true);
	}
	window.onkeypress = function(e){handleKey(e);}
	setStatus('resetting 6502...');
	setTimeout(setup_part4, 0);
}

function setup_part4(){
	setupTable();
	setupNodeNameList();
	logThese=signalSet(loglevel);
	loadProgram();
	if(noSimulation){
		running=undefined;
		setStatus('Ready!');
	} else {
		initChip();
		document.getElementById('stop').style.visibility = 'hidden';
		go();
	}
}

function detectOldBrowser(){
	if(!("getBoundingClientRect" in document.documentElement)){
		// simplify these functions (and adjust layout window position)
		localx=	function(el, gx){
				return gx-el.offsetLeft;
			}
		localy=	function(el, gy){
				return gy-el.offsetTop;
			}
		document.getElementById('plain').style["float"]="right";
		document.getElementById('chip').style.left=0;
		document.getElementById('chip').style.top=0;
		document.getElementById('chip').style.border=0;
	}
}

function setupParams(){
	if(location.search=="")
		return
	var queryParts=location.search.slice(1).split('&');
	var panx;
	var pany;
	var zoom;
	var userAddress;
	for(var i=0;i<queryParts.length;i++){
		var params=queryParts[i].split("=");
		if(params.length!=2){
			if(loglevel>0)
				console.log('malformed parameters',params);
			break;
		}
		var name=params[0];
		var value=params[1].replace(/\/$/,""); // chrome sometimes adds trailing slash
		// be (relatively) forgiving in what we accept
		//
		// user interface mode control
		if(name=="loglevel" && parseInt(value)!=NaN){
			updateLoglevel(value);
		} else if(name=="expert" && value.indexOf("t")==0){
			updateExpertMode(true);
		} else if(name=="headlesssteps" && parseInt(value)!=NaN){
			headlessSteps=parseInt(value);
		} else if(name=="graphics" && value.indexOf("f")==0){
			updateChipLayoutVisibility(false);
		} else if(name=="canvas" && parseInt(value)!=NaN){
			grCanvasSize=value;
		// suppress simulation (for layout viewing only on slow browsers)
		} else if(name=="nosim" && value.indexOf("t")==0){
			noSimulation=true;
		} else
		// place the graphics window at a point of interest
		if(name=="panx" && parseInt(value)!=NaN){
			panx=parseInt(value);
		} else if(name=="pany" && parseInt(value)!=NaN){
			pany=parseInt(value);
		} else if(name=="zoom" && parseInt(value)!=NaN){
			zoom=parseInt(value);
		} else
		// load a test program: Address, Data and Reset
		if(name=="a" && parseInt(value,16)!=NaN){
			userAddress=parseInt(value,16);
		} else if(name=="d" && value.match(/[0-9a-fA-F]*/)[0].length==value.length){
			for(var j=0;j<value.length;j+=2)
				userCode[userAddress++]=parseInt(value.slice(j,j+2),16);
		} else if(name=="r" && parseInt(value,16)!=NaN){
			userResetLow=parseInt(value,16)%256;
			userResetHigh=(parseInt(value,16)>>8)%256;
		} else
		// run a test program, and optionally check against a golden checksum
		if(name=="steps" && parseInt(value)!=NaN){
			userSteps=parseInt(value);
			running=true;
		} else if(name=="checksum" && parseInt(value,16)!=NaN){
			goldenChecksum=(0x100000000+parseInt(value,16)).toString(16).slice(-8);
		} else {
			if(loglevel>0)
				console.log('unrecognised parameters:',params);
			break;
		}
	}
	if(panx!=null && pany!=null && zoom!=null)
		moveHereFirst=[panx,pany,zoom];
}

function updateChipLayoutAnimation(isOn){
	// simulation is much faster if we don't update the chip layout on every step
	animateChipLayout=isOn;
	document.getElementById('animateModeCheckbox').checked = animateChipLayout;
}

/////////////////////////
//
// User Interface
//
/////////////////////////

function handleKey(e){
	var c = e.charCode;
	c = String.fromCharCode(c);
	if('<>?npZzx'.indexOf(c)==-1) return;
	if((c=='Z'||c=='x'||c=='<') && zoom>1) setZoom(zoom/1.2);
	else if((c=='z'||c=='>') && zoom<grMaxZoom) setZoom(zoom*1.2);
	else if(c=='?') setZoom(1);
	else if(c=='n') stepForward();
	else if(c=='p') stepBack();
}

function mouseDown(e){
	e.preventDefault();
	moved=false;	
	dragMouseX = e.clientX;	
	dragMouseY = e.clientY;
	window.onmousemove = function(e){mouseMove(e)};
	window.onmouseup = function(e){mouseUp(e)};
}

function mouseMove(e){
	moved = true;
	if(zoom==1) return;
	var dx = e.clientX-dragMouseX;
	var dy = e.clientY-dragMouseY;
	dragMouseX = e.clientX;
	dragMouseY = e.clientY;
	centerx-=dx/zoom;
	centerx = Math.max(centerx, 400/zoom);
	centerx = Math.min(centerx, 600-400/zoom);
	centery-=dy/zoom;
	centery = Math.max(centery, 300/zoom);
	centery = Math.min(centery, 600-300/zoom);
	recenter();
}

function mouseUp(e){
	if(!moved) handleClick(e);	
	window.onmousemove = undefined;
	window.onmouseup = undefined;
}

function setZoom(n){
	zoom = n;
	setChipStyle({
		width: 600*n+'px',
		height: 600*n+'px'
	});
	recenter();
}

function recenter(){
	var top = -centery*zoom+300;
	top = Math.min(top, 0);
	top = Math.max(top, -600*(zoom-1));
	var left = -centerx*zoom+400;
	left = Math.min(left, 0);
	left = Math.max(left, (zoom==1)?100:-600*zoom+800);
	setChipStyle({
		top: top+'px',
		left: left+'px',
	});
	document.getElementById('linkHere').href=location.pathname+"?"+whereAmIAsQuery();
}

function handleClick(e){
	var x = localx(hilite, e.clientX)/zoom;
	var y = localy(hilite, e.clientY)/zoom;
	var w = findNodeNumber(x,y);
	if(e.shiftKey) hiliteNode(getNodeGroup(w));
	else {var a=new Array(); a.push(w); hiliteNode(a);}
	var cx = Math.round(x*grChipSize/600);
	var cy = Math.round(y*grChipSize/600);	
	if(w==-1) {
		setStatus('x: '+cx, 'y: '+cy);
	} else {
		var s1='x: ' + cx + ' y: ' + cy;
		var s2='node: ' + w + ' ' + nodeName(w);
		setStatus(s1, s2);
		if(ctrace) console.log(s1, s2);
	}
}

function updateLoglevel(value){
	loglevel = value;
	logThese = signalSet(loglevel);
	initLogbox(logThese);
}

function updateExpertMode(isOn){
	expertMode=true
	document.getElementById('expertControlPanel').style.display = 'block';
	if(loglevel==0)
		updateLoglevel(1);
	if(chipLayoutIsVisible)
		document.getElementById('layoutControlPanel').style.display = 'block';
}

function updateChipLayoutVisibility(isOn){
	chipLayoutIsVisible=isOn;
	if(chipLayoutIsVisible) {
		document.getElementById('chipsurround').style.display = 'block';
		if(expertMode)
			document.getElementById('layoutControlPanel').style.display = 'block';
		document.getElementById('nochip').style.display = 'none';
		//document.getElementById('logstreamscroller').style.height="260px";
		// allow the display to update while we load the graphics
		updateChipLayoutAnimation(true);
		setStatus('loading graphics...');
		setTimeout(setupChipLayoutGraphics, 0);
	} else {
		// cannot animate the layout if there is no canvas
		updateChipLayoutAnimation(false);
		// replace the layout display with a button to show it
		document.getElementById('chipsurround').style.display = 'none';
		document.getElementById('layoutControlPanel').style.display = 'none';
		document.getElementById('nochip').style.display = 'block';
		//document.getElementById('logstreamscroller').style.height="880px";
	}
}

function setupChipLayoutGraphics(){
	setupLayerVisibility();
	setupBackground();
	setupOverlay();
	setupHilite();
	setupHitBuffer();
	recenter();
	refresh();
	document.getElementById('waiting').style.display = 'none';
	setStatus('Ready!');  // would prefer chipStatus but it's not idempotent
	if(moveHereFirst!=null)
		moveHere(moveHereFirst);
	hilite.onmousedown = function(e){mouseDown(e);}
}

// utility function to save graphics pan and zoom
function whereAmIAsQuery(){
	var w=whereAmI();
	return "panx="+w[0].toFixed(1)+"&pany="+w[1].toFixed(1)+"&zoom="+w[2].toFixed(1);
}
function whereAmI(){
	return [centerx, centery, zoom];
}

// restore graphics pan and zoom (perhaps as given in the URL)
function moveHere(place){
	centerx = place[0];
	centery = place[1];
	setZoom(place[2]);
}

/////////////////////////
//
// Etc.
//
/////////////////////////

function setChipStyle(props){
	for(var i in props){
		chipbg.style[i] = props[i];
		overlay.style[i] = props[i];
		hilite.style[i] = props[i];
		hitbuffer.style[i] = props[i];
	}
}

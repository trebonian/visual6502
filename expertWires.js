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
var findThese;
var labelThese=[];

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
var grChipOffsetX=400;
var grChipOffsetY=0;
var grCanvasSize=2000;
var grLineWidth=1;

// Index of layerNames corresponds to index into drawLayers
var layernames = ['metal', 'switched diffusion', 'inputdiode', 'grounded diffusion', 'powered diffusion', 'polysilicon'];
var colors = ['rgba(128,128,192,0.4)','#FFFF00','#FF00FF','#4DFF4D',
              '#FF4D4D','#801AC0','rgba(128,0,255,0.75)'];
var drawlayers = [true, true, true, true, true, true];

// some modes and parameters which can be passed in from the URL query
var moveHereFirst;
var expertMode=true;
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
	// load the circuit before acting on URL parameters
	setupNodes();
	setupTransistors();
	setupParams();
	setupExpertMode();
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
	setStatus('resetting ' + chipname + '...');
	setTimeout(setup_part4, 0);
}

function setup_part4(){
	setupTable();
	setupNodeNameList();
	logThese=signalSet(loglevel);
	loadProgram();
	setupConsole();
	if(noSimulation){
		stopChip();
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
		} else if(name=="logmore" && value!=""){
			updateLogList(value);
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
		// perform a search, highlight and zoom to object(s)
		if(name=="find" && value.length>0){
			findThese=value;
		} else
		// affix label with optional box to highlight an area of interest
		if(name=="label" && value.length>0){
			labelThese.push(value.split(","));
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
		// setup input pin events, breakpoints, watchpoints
		if(name=="reset0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow(nodenamereset);"].join("");
		} else if(name=="reset1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh(nodenamereset);"].join("");
		} else if(name=="irq0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('irq');"].join("");
		} else if(name=="irq1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('irq');"].join("");
		} else if(name=="nmi0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('nmi');"].join("");
		} else if(name=="nmi1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('nmi');"].join("");
		} else if(name=="rdy0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('rdy');"].join("");
		} else if(name=="rdy1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('rdy');"].join("");
		} else if(name=="so0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('so');"].join("");
		} else if(name=="so1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('so');"].join("");
		// Some Z80 inputs - we can refactor if this becomes unwieldy
		} else if(name=="int0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int');"].join("");
		} else if(name=="int1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int');"].join("");
		} else if(name=="wait0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('wait');"].join("");
		} else if(name=="wait1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('wait');"].join("");
		} else if(name=="busrq0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('busrq');"].join("");
		} else if(name=="busrq1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('busrq');"].join("");
		//
		} else if(name=="time" && parseInt(value)!=NaN){
			eventTime=value;
		} else if(name=="databus" && parseInt(value)!=NaN){
			clockTriggers[eventTime]=[clockTriggers[eventTime],"writeDataBus(0x"+value+");"].join("");
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


// these keyboard actions are primarily for the chip display
function handleKey(e){
	var c = e.charCode || e.keyCode;
	c = String.fromCharCode(c);
	if('<>?npZzx'.indexOf(c)==-1) return;
	if((c=='Z'||c=='x'||c=='<') && zoom>1) setZoom(zoom/1.2);
	else if((c=='z'||c=='>') && zoom<grMaxZoom) setZoom(zoom*1.2);
	else if(c=='?') setZoom(1);
	// FIXME these keys are for the simulator (but not when focus is in a textbox)
	else if(c=='n') stepForward();
	else if(c=='p') stepBack();
}

//  handler for zoom in/out using the mouse wheel
function handleWheelZoom(e){
	chipsurround.focus();
	e.preventDefault();
	var n = e.deltaY / 100;
	if(n>0 && zoom>1) setZoom(zoom/1.2);
	if(n<0 && zoom<grMaxZoom) setZoom(zoom*1.2);
}

//  handler for mousedown events over chip display
//  must handle click-to-select (and focus), and drag to pan
function mouseDown(e){
	chipsurround.focus();
	e.preventDefault();
	moved=false;
	dragMouseX = e.clientX;
	dragMouseY = e.clientY;
	chipsurround.onmousemove = function(e){mouseMove(e)};
	chipsurround.onmouseup = function(e){mouseUp(e)};
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
	chipsurround.onmousemove = undefined;
	chipsurround.onmouseup = undefined;
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
	updateLinkHere();
}

function updateLinkHere(){
	var target = location.pathname + "?nosim=t&";
	var findlist = document.getElementById('HighlightThese').value.split(/[\s,]+/).join(",");
	if (findlist != "")
		target = target + "find=" + findlist + "&";
	target = target + whereAmIAsQuery();
	document.getElementById('linkHere').href=target;
}

// place a text label on the highlight layer
// with an optional box around an area of interest
// coordinates used are those reported by a click
// for example:
//   boxLabel(['PD',   50, 8424, 3536, 9256, 2464])
//   boxLabel(['IR',   50, 8432, 2332, 9124,  984])
//   boxLabel(['PLA', 100, 1169, 2328, 8393,  934])
//   boxLabel(['Y',    50, 2143, 8820, 2317, 5689])
//   boxLabel(['X',    50, 2317, 8820, 2490, 5689])
//   boxLabel(['S',    50, 2490, 8820, 2814, 5689])
//   boxLabel(['ALU',  50, 2814, 8820, 4525, 5689])
//   boxLabel(['DAdj', 40, 4525, 8820, 5040, 5689])
//   boxLabel(['A',    50, 5040, 8820, 5328, 5689])
//   boxLabel(['PC',   50, 5559, 8820, 6819, 5689])
//   boxLabel(['ID',   50, 7365, 8820, 7676, 5689])
//   boxLabel(['TimC', 40,  600, 1926, 1174,  604])

function flashBoxLabel(args) {
	clearHighlight();
	var callBack = function(){boxLabel(args);};
	setTimeout(callBack, 400);
	setTimeout(clearHighlight,  800);
	setTimeout(callBack, 1200);
}

function boxLabel(args) {
	var text = args[0];
	var textsize = args[1];
	var thickness = 1+ textsize / 20;
	var boxXmin = args[2] * grCanvasSize / grChipSize;
	var boxYmin = args[3] * grCanvasSize / grChipSize;
	var boxXmax = args[4] * grCanvasSize / grChipSize;
	var boxYmax = args[5] * grCanvasSize / grChipSize;
	ctx.lineWidth   = thickness;
	ctx.font        = textsize + 'px sans-serif';
	ctx.fillStyle   = '#ff0';  // yellow
	ctx.fillStyle   = '#f8f';  // magenta
	ctx.fillStyle   = '#fff';  // white
	ctx.strokeStyle = '#fff';  // white
	if(args.length>4){
		ctxDrawBox(ctx, boxXmin, boxYmin, boxXmax, boxYmax);
		// offset the text label to the interior of the box
		boxYmin -= thickness * 2;
	}
	ctx.strokeStyle = '#fff';  // white
	ctx.strokeStyle = '#000';  // black
	ctx.lineWidth   = thickness*2;
	ctx.strokeText(text, boxXmin, boxYmin);
	ctx.fillText(text, boxXmin, boxYmin);
}

var highlightThese;

// flash some set of nodes according to user input
// also zoom to fit those nodes (not presently optional)
function hiliteNodeList(){
	var tmplist = document.getElementById('HighlightThese').value.split(/[\s,]+/);
	if(tmplist.join("").length==0){
		// request to highlight nothing, so switch off any signal highlighting
		hiliteNode(-1);
		return;
	}
	highlightThese = [];
	var seglist=[];
	var report="";
	for(var i=0;i<tmplist.length;i++){
		// get a node number from a signal name or a node number
		var name = tmplist[i];
		var value = parseInt(tmplist[i]);
		if((value!=NaN) && (typeof nodes[value] != "undefined")) {
			highlightThese.push(value);
			report="node: " + value + ' ' + nodeName(value);
			for(var s in nodes[value].segs)
				seglist.push(nodes[value].segs[s]);
		} else if(typeof nodenames[name] != "undefined") {
			highlightThese.push(nodenames[name]);
			report="node: " + nodenames[name] + ' ' + name;
			for(var s in nodes[nodenames[name]].segs)
				seglist.push(nodes[nodenames[name]].segs[s]);
		} else if(typeof transistors[name] != "undefined") {
			// normally we push numbers: a non-number is a transistor name
			highlightThese.push(name);
			report="transistor: " + name;
			seglist.push([
				transistors[name].bb[0],transistors[name].bb[2],
				transistors[name].bb[1],transistors[name].bb[3]
			]);
		} else {
			// allow match of underscore-delimited components, so
			// SUMS and dpc17 both match the node dpc17_SUMS
			for(var i in nodenames){
				re=new RegExp("(^" + name + "_|_" + name + "$)");
				if (re.test(i)){
					value = nodenames[i];
					highlightThese.push(value);
					report="node: " + value + ' ' + nodeName(value);
					for(var s in nodes[value].segs)
						seglist.push(nodes[value].segs[s]);
					break;
				}
			}
		}
	}
	if(highlightThese.length==0){
		setStatus('Find: nothing found!','(Enter a list of nodenumbers, names or transistor names)');
		return;
	} else if (highlightThese.length==1){
		setStatus('Find results:',report);
	} else {
		setStatus('Find: multiple objects found','(' + highlightThese.length + ' objects)');
	}
	var xmin=seglist[0][0], xmax=seglist[0][0];
	var ymin=seglist[0][1], ymax=seglist[0][1];
	for(var s in seglist){
		for(var i=0;i<seglist[s].length;i+=2){
			if(seglist[s][i]<xmin) xmin=seglist[s][i];
			if(seglist[s][i]>xmax) xmax=seglist[s][i];
			if(seglist[s][i+1]<ymin) ymin=seglist[s][i+1];
			if(seglist[s][i+1]>ymax) ymax=seglist[s][i+1];
		}
	}
	zoomToBox(xmin,xmax,ymin,ymax);
	updateLinkHere();
	clearHighlight();  // nullify the simulation overlay (orange/purple)
	hiliteNode(-1);    // unhighlight all nodes
	setTimeout("hiliteNode(highlightThese);", 400);
	setTimeout("hiliteNode(-1);", 800);
	setTimeout("hiliteNode(highlightThese);", 1200);
}

// some notes on coordinates:
// the localx and localy functions return canvas coordinate offsets from the canvas window top left corner
// we divide the results by 'zoom' to get drawn coordinates useful in findNodeNumber
// to convert to reported user chip coordinates we multiply by grChipSize/600
// to compare to segdefs and transdefs coordinates we subtract grChipOffsetX from x and subtract y from grChipSize plus grChipOffsetY

function handleClick(e){
	var x = localx(hilite, e.clientX)/zoom;
	var y = localy(hilite, e.clientY)/zoom;
	var w = findNodeNumber(x,y);
	// convert to chip coordinates
	var cx = Math.round(x*grChipSize/600);
	var cy = Math.round(y*grChipSize/600);
	// prepare two lines of status report
	var s1='x: ' + (cx - grChipOffsetX) + ' y: ' + (cy - grChipOffsetY);
	var s2='node:&nbsp;' + w + '&nbsp;' + nodeName(w);
	if(w==-1) {
		setStatus(s1); // no node found, so report only coordinates
		return;
	}
	// we have a node, but maybe we clicked over a transistor
	var nodelist=[w];
	// match the coordinate against transistor gate bounding boxes
	x=cx-grChipOffsetX;
	y=grChipSize+grChipOffsetY-cy;
	for(var i=0;i<nodes[w].gates.length;i++){
		var xmin=nodes[w].gates[i].bb[0], xmax=nodes[w].gates[i].bb[1];
		var ymin=nodes[w].gates[i].bb[2], ymax=nodes[w].gates[i].bb[3];
		if((x >= xmin) && (x <= xmax) && (y >= ymin) && (y <= ymax)){
			// only one match at most, so we replace rather than push
			nodelist=[nodes[w].gates[i].name];
			s2='transistor: ' + nodes[w].gates[i].name + ' on ' + s2;
		}
	}
	// if this is a shift-click, just find and highlight the pass-connected group
	// and list the nodes (or nodenames, preferably)
	if(e.shiftKey) {
		getNodeGroup(w);
		nodelist = group;
		s2 = "nodegroup from&nbsp;" + s2 +
			" (nodes:&nbsp;" +
				group.map(function(x){return nodeName(x)?nodeName(x):x;}).join(",") +
			")";
	}
	hiliteNode(nodelist);
	setStatus(s1, s2);
	if(ctrace) console.log(s1, s2);
}

function updateLoglevel(value){
	loglevel = value;
	logThese = signalSet(loglevel);
	initLogbox(logThese);
}

function setupExpertMode(isOn){
	document.getElementById('expertControlPanel').style.display = 'block';
	if(loglevel==0)
		updateLoglevel(1);
	if(chipLayoutIsVisible)
		document.getElementById('layoutControlPanel').style.display = 'block';
}

var consolegetc;    // global variable to hold last keypress in the console area
var consolebox;

function setupConsole(){
	consolebox=document.getElementById('consolebox');
	consolebox.onkeypress=function(e){consolegetc=e.charCode || e.keyCode;};
}

var chipsurround;

function updateChipLayoutVisibility(isOn){
	chipLayoutIsVisible=isOn;
	if(chipLayoutIsVisible) {
		updateChipLayoutAnimation(true);
		// resize the two panes appropriately
		$("#frame").trigger("resize", [ 810 ]);
		$("#rightcolumn").trigger("resize", [ 738 - 180 ]);
		// replace the Show Chip button with the chip graphics
		chipsurround=document.getElementById('chipsurround');
		chipsurround.style.display = 'block';
		document.getElementById('layoutControlPanel').style.display = 'block';
		document.getElementById('nochip').style.display = 'none';
		// allow the browser to respond while we load the graphics
		setStatus('loading graphics...');
		setTimeout(setupChipLayoutGraphics, 0);
	} else {
		// cannot animate the layout if there is no canvas
		updateChipLayoutAnimation(false);
		// resize the two panes appropriately
		$("#frame").trigger("resize", [ 120 ]);
		$("#rightcolumn").trigger("resize", [ 200 ]);
		// replace the layout display with a button to show it
		document.getElementById('chipsurround').style.display = 'none';
		document.getElementById('layoutControlPanel').style.display = 'none';
		document.getElementById('nochip').style.display = 'block';
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
	// pre-fill the Find box if parameters supplied
	if(typeof findThese != "undefined") {
		document.getElementById('HighlightThese').value = findThese;
		hiliteNodeList(); // will pan and zoom to fit
	}
	// pre-pan and zoom if requested (will override any zoom-to-fit by hiliteNodeList)
	if(moveHereFirst!=null)
		moveHere(moveHereFirst);
	// draw any URL-requested labels and boxes
	if(labelThese.length>0) {
		for(var i=0;i<labelThese.length;i+=1)
			flashBoxLabel(labelThese[i]);
	}
	// grant focus to the chip display to enable zoom keys
	chipsurround.focus();
	chipsurround.onwheel = function(e){handleWheelZoom(e);};
	chipsurround.onmousedown = function(e){mouseDown(e);};
	chipsurround.onkeypress = function(e){handleKey(e);};
	chipsurround.onmouseout = function(e){mouseLeave(e);};
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

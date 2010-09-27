/*
 Copyright (c) 2010 Brian Silverman, Barry Silverman

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

var frame, chipbg, overlay, hilite, hitbuffer, ctx;
var centerx=300, centery=300;
var zoom=1;
var dragMouseX, dragMouseY, moved;
var statbox;

// Index of layerNames corresponds to index into drawLayers
var layernames = ['metal', 'switched diffusion', 'inputdiode', 'grounded diffusion', 'powered diffusion', 'polysilicon'];
var colors = ['rgba(128,128,192,0.4)','#FFFF00','#FF00FF','#4DFF4D',
              '#FF4D4D','#801AC0','rgba(128,0,255,0.75)'];
var drawlayers = [true, true, true, true, true, true];
              
var nodes = new Array();
var transistors = {};
var nodenamelist=[];

var ngnd = nodenames['vss'];
var npwr = nodenames['vcc'];


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
	setupNodes();
	setupTransistors();
	setupLayerVisibility();
	setupBackground();
	setupOverlay();
	setupHilite();
	setupHitBuffer();
	recenter();
	refresh();
	setupTable();
	setupNodeNameList();
	window.onkeypress = function(e){handleKey(e);}
	hilite.onmousedown = function(e){mouseDown(e);}
	setStatus('resetting 6502...');
	setTimeout(setup_part3, 0);
}

function setup_part3(){
	initChip();
	document.getElementById('stop').style.visibility = 'hidden';
	go();
}

function setupNodes(){
	for(var i in segdefs){
		var seg = segdefs[i];
		var w = seg[0];
		if(nodes[w]==undefined) 
			nodes[w] = {segs: new Array(), num: w, pullup: seg[1]=='+',
			            state: 'fl', gates: new Array(), c1c2s: new Array()};
		if(w==ngnd) continue;
		if(w==npwr) continue;
		nodes[w].segs.push(seg.slice(3));
	}
}

function setupTransistors(){
	for(i in transdefs){
		var tdef = transdefs[i];
		var name = tdef[0];
		var gate = tdef[1];
		var c1 = tdef[2];
		var c2 = tdef[3];
		var trans = {name: name, on: false, gate: gate, c1: c1, c2: c2};
		nodes[gate].gates.push(name);
		nodes[c1].c1c2s.push(name);
		nodes[c2].c1c2s.push(name);
		transistors[name] = trans;
	}
}

function setupLayerVisibility(){
	var x=document.getElementById('updateShow');
	for (var i=0;i<x.childNodes.length;i++) {
		if(x.childNodes[i].type='checkbox'){
			x.childNodes[i].checked=drawlayers[x.childNodes[i].name];
		}
	}
}

function setupBackground(){
	chipbg = document.getElementById('chipbg');
	chipbg.width = 4000;
	chipbg.height = 4000;
	var ctx = chipbg.getContext('2d');
	ctx.scale(chipbg.width/10000, chipbg.height/10000);
	ctx.fillStyle = '#000000';
	ctx.strokeStyle = 'rgba(255,255,255,0.5)';
	ctx.lineWidth = 4;
	ctx.fillRect(0,0,10000,10000);
	for(var i in segdefs){
		var seg = segdefs[i];
		var c = seg[2];
		if (drawlayers[c]) {
			ctx.fillStyle = colors[c];
			drawSeg(ctx, segdefs[i].slice(3));
			ctx.fill();
			if((c==0)||(c==6)) ctx.stroke();
		}
	}		
}

function setupOverlay(){
	overlay = document.getElementById('overlay');
	overlay.width = 4000;
	overlay.height = 4000;
	ctx = overlay.getContext('2d');
	ctx.scale(overlay.width/10000, overlay.height/10000);
}

function setupHilite(){
	hilite = document.getElementById('hilite');
	hilite.width = 4000;
	hilite.height = 4000;
	var ctx = hilite.getContext('2d');
	ctx.scale(hilite.width/10000, hilite.height/10000);
}

function setupHitBuffer(){
	hitbuffer = document.getElementById('hitbuffer');
	hitbuffer.width = 4000;
	hitbuffer.height = 4000;
	hitbuffer.style.visibility = 'hidden';
	var ctx = hitbuffer.getContext('2d');
	ctx.scale(hitbuffer.width/10000, hitbuffer.height/10000);
	for(i in nodes) hitBufferNode(ctx, i, nodes[i].segs);
}

function hitBufferNode(ctx, i, w){
	var low = hexdigit(i&0xf);
	var mid = hexdigit((i>>4)&0xf);
	var high = hexdigit((i>>8)&0xf);
	ctx.fillStyle = '#'+high+'F'+mid+'F'+low+'F';
	for(i in w) {
		drawSeg(ctx, w[i]);
		ctx.fill();
	}
}

function hexdigit(n){return '0123456789ABCDEF'.charAt(n);}


/////////////////////////
//
// Drawing Runtime
//
/////////////////////////

function refresh(){
	ctx.clearRect(0,0,10000,10000);
	for(i in nodes){
		if(isNodeHigh(i)) overlayNode(nodes[i].segs);
	}
}

function overlayNode(w){
	ctx.fillStyle = 'rgba(255,0,64,0.4)';
	for(i in w) {
		drawSeg(ctx, w[i]);
		ctx.fill();
	}
}

function hiliteNode(n){
	var ctx = hilite.getContext('2d');
	ctx.clearRect(0,0,10000,10000);
	ctx.fillStyle = 'rgba(255,255,255,0.7)';
	if(n==-1) return;
	if(isNodeHigh(n[0]))
		ctx.fillStyle = 'rgba(255,0,0,0.7)';

	for(var i in n){
		var segs = nodes[n[i]].segs;
		for(var s in segs){drawSeg(ctx, segs[s]); ctx.fill();}
	}
}


function drawSeg(ctx, seg){
	if(noGraphics) return;
	var dx = 400;
	ctx.beginPath();
	ctx.moveTo(seg[0]+dx, 10000-seg[1])
	for(var i=2;i<seg.length;i+=2) ctx.lineTo(seg[i]+dx, 10000-seg[i+1]);
	ctx.lineTo(seg[0]+dx, 10000-seg[1])
}

/////////////////////////
//
// User Interface
//
/////////////////////////

function handleKey(e){
	var c = e.charCode;
	c = String.fromCharCode(c);
	if('<>?np'.indexOf(c)==-1) return;
	if(c=='<' && zoom>1) setZoom(zoom/1.2);
	else if(c=='>' && zoom<16) setZoom(zoom*1.2);
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
}

function handleClick(e){
	var x = localx(hilite, e.clientX)/zoom;
	var y = localy(hilite, e.clientY)/zoom;
	var w = findNodeNumber(x,y);
	if(e.shiftKey) hiliteNode(getNodeGroup(w));
	else {var a=new Array(); a.push(w); hiliteNode(a);}
	var cx = Math.round(x*10000/600);
	var cy = Math.round(y*10000/600);	
	if(w==-1) {
		setStatus('x:',cx,'<br>','y:',cy);
	} else {
		var s1='x: ' + cx + ' y: ' + cy;
		var s2='node: ' + w + ' ' + nodeName(w);
		setStatus(s1, '<br>', s2);
		if(ctrace) console.log(s1, s2);
	}
}

function findNodeNumber(x,y){
	var ctx = hitbuffer.getContext('2d');
	var pixels = ctx.getImageData(x*4000/600, y*4000/600, 2, 2).data;
	if(pixels[0]==0) return -1;
	var high = pixels[0]>>4;
	var mid = pixels[1]>>4;
	var low = pixels[2]>>4;
	return (high<<8)+(mid<<4)+low;
}

function updateExpertMode(on){
	if(on){
		document.getElementById('controlPanel').style.visibility = 'visible';
		loglevel=4;
	} else {
		document.getElementById('controlPanel').style.visibility = 'hidden';
		loglevel=0;
	}
}

function updateShow(layer, on){
	drawlayers[layer]=on;
	setupBackground();
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


function localx(el, gx){
	return gx-el.getBoundingClientRect().left;
}

function localy(el, gy){
	return gy-el.getBoundingClientRect().top;
}

function setStatus(){
	var res = '';
	for(var i=0;i<arguments.length;i++) res=res+arguments[i]+' ';
	statbox.innerHTML = res;
}

function setupNodeNameList(){
	for(var i in nodenames)
		nodenamelist.push(i);
}

function nodeName(n) {
	for(var i in nodenames){
		if(nodenames[i]==n) return i;
	}
	return '';
}

function now(){return  new Date().getTime();}

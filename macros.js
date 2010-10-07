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

var memory = Array();
var cycle = 0;
var trace = Array();
var logstream = Array();
var running = false;

function loadProgram(){
	// a moderate size of static testprogram might be loaded
	if(testprogram.length!=0 && testprogramAddress != undefined)
		for(var i=0;testprogram[i]!=undefined;i++){
			var a=testprogramAddress+i;
			mWrite(a, testprogram[i]);
			if(a<0x200)
				setCellValue(a, testprogram[i]);
		}
	// a small test program or patch might be passed in the URL
	if(userCode.length!=0)
		for(var i=0;i<userCode.length;i++){
			if(userCode[i] != undefined){
				mWrite(i, userCode[i]);
				if(i<0x200)
					setCellValue(i, userCode[i]);
			}
		}
	// default reset vector will be 0x0000 because undefined memory reads as zero
	if(userResetLow!=undefined)
		mWrite(0xfffc, userResetLow);
	if(userResetHigh!=undefined)
		mWrite(0xfffd, userResetHigh);
}

function go(){
	if(userSteps!=undefined){
		if(--userSteps==0){
			running=false;
			userSteps=undefined;
		}
	}
	if(running) {
           step();
	   setTimeout(go, 0); // schedule the next poll
        }
}

function goUntilSync(){
	halfStep();
	while(!isNodeHigh(nodenames['sync']) || isNodeHigh(nodenames['clk0']))
		halfStep();
}

function goUntilSyncOrWrite(){
	halfStep();
	while(
			!isNodeHigh(nodenames['clk0']) ||
			( !isNodeHigh(nodenames['sync']) && isNodeHigh(nodenames['rw']) )
	)
		halfStep();
}

function testNMI(n){
        initChip();

        mWrite(0x0000, 0x38); // set carry
        mWrite(0x0001, 0x4c); // jump to test code
        mWrite(0x0002, 0x06);
        mWrite(0x0003, 0x23);

        mWrite(0x22ff, 0x38); // set carry
        mWrite(0x2300, 0xea);
        mWrite(0x2301, 0xea);
        mWrite(0x2302, 0xea);
        mWrite(0x2303, 0xea);
        mWrite(0x2304, 0xb0); // branch carry set to self
        mWrite(0x2305, 0xfe);

        mWrite(0x2306, 0xb0); // branch carry set to self
        mWrite(0x2307, 0x01);
        mWrite(0x2308, 0x00); // brk should be skipped
        mWrite(0x2309, 0xa9); // anything
        mWrite(0x230a, 0xde); // anything
        mWrite(0x230b, 0xb0); // branch back with page crossing
        mWrite(0x230c, 0xf2);

        mWrite(0xc018, 0x40); // nmi handler

        mWrite(0xfffa, 0x18); // nmi vector
        mWrite(0xfffb, 0xc0);
        mWrite(0xfffc, 0x00); // reset vector
        mWrite(0xfffd, 0x00);

        for(var i=0;i<n;i++){step();}
        setLow('nmi');
        chipStatus();
        for(var i=0;i<8;i++){step();}
        setHigh('nmi');
        chipStatus();
        for(var i=0;i<16;i++){step();}
}

function initChip(){
        var start = now();
	for(var nn in nodes) nodes[nn].state = 'fl';
	nodes[ngnd].state = 'gnd';
	nodes[npwr].state = 'vcc';
	for(var tn in transistors) transistors[tn].on = false;
	setLow('res');
	setLow('clk0');
	setHigh('rdy'); setLow('so');
	setHigh('irq'); setHigh('nmi');
	recalcNodeList(allNodes()); 
	for(var i=0;i<8;i++){setHigh('clk0'), setLow('clk0');}
	setHigh('res');
	for(var i=0;i<18;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	refresh();
	cycle = 0;
	trace = Array();
	initLogbox(signalSet(loglevel));
	chipStatus();
	if(ctrace)console.log('initChip done after', now()-start);
}

var logThese=[
		['cycle'],
		['ab','db','rw','sync','pc','a','x','y','s','p'],
		['ir','tcstate','pd'],
		['adl','adh','sb','alu'],
		['alucin','alua','alub','alucout','aluvout','dasb'],
		['idb','dor'],
		['irq','nmi','res'],
	];

function signalSet(n){
	var signals=[];
	for (var i=0; (i<=n)&&(i<logThese.length) ; i++){
		for (var j=0; j<logThese[i].length; j++){
			signals.push(logThese[i][j]);
		}
	}
	return signals;
}

var traceChecksum='';
var goldenChecksum;

// simulate a single clock phase, updating trace and highlighting layout
function step(){
	var s=stateString();
	var m=getMem();
	trace[cycle]= {chip: s, mem: m};
	if(goldenChecksum != undefined)
		traceChecksum=adler32(traceChecksum+s+m.slice(0,511).toString(16));
	halfStep();
	if(animateChipLayout)
		refresh();
	cycle++;
	chipStatus();
}

// simulate a single clock phase with no update to graphics or trace
function halfStep(){
	var clk = isNodeHigh(nodenames['clk0']);
	if (clk) {setLow('clk0'); handleBusRead(); } 
	else {setHigh('clk0'); handleBusWrite();}
}

function handleBusRead(){
	if(isNodeHigh(nodenames['rw'])) writeDataBus(mRead(readAddressBus()));
}

function handleBusWrite(){
	if(!isNodeHigh(nodenames['rw'])){
		var a = readAddressBus();
		var d = readDataBus();
		mWrite(a,d);
		if(a<0x200) setCellValue(a,d);
	}
}

function readAddressBus(){return readBits('ab', 16);}
function readDataBus(){return readBits('db', 8);}
function readA(){return readBits('a', 8);}
function readY(){return readBits('y', 8);}
function readX(){return readBits('x', 8);}
function readP(){return readBits('p', 8);}
function readPstring(){
   var result;
   result = (isNodeHigh(nodenames['p7'])?'N':'n') +
            (isNodeHigh(nodenames['p6'])?'V':'v') +
            '&#8209' +  // non-breaking hyphen
            (isNodeHigh(nodenames['p3'])?'B':'b') +
            (isNodeHigh(nodenames['p3'])?'D':'d') +
            (isNodeHigh(nodenames['p2'])?'I':'i') +
            (isNodeHigh(nodenames['p1'])?'Z':'z') +
            (isNodeHigh(nodenames['p0'])?'C':'c');
   return result;
}
function readSP(){return readBits('s', 8);}
function readPC(){return (readBits('pch', 8)<<8) + readBits('pcl', 8);}
function readPCL(){return readBits('pcl', 8);}
function readPCH(){return readBits('pch', 8);}

function readBit(name){
        return isNodeHigh(nodenames[name])?1:0;
}
function readBits(name, n){
	var res = 0;
	for(var i=0;i<n;i++){
		var nn = nodenames[name+i];
		res+=((isNodeHigh(nn))?1:0)<<i;
	}
	return res;
}

function busToString(busname){
	// takes a signal name or prefix
	// returns an appropriate string representation
	if(busname=='cycle')
		return cycle>>1;
	if(busname=='pc')
		return busToHex('pch') + busToHex('pcl');
	if(busname=='p')
		return readPstring();
	if(busname=='tcstate')
		return ['clock1','clock2','t2','t3','t4','t5'].map(busToHex).join("");
	return busToHex(busname);
}

function busToHex(busname){
	// may be passed a bus or a signal, so allow multiple signals
	// signals may have multi-part names like pla51_T0SBC which should match either part
	// this is quite difficult to deal with, perhaps indicating that it is not such a good idea
	var width=0;
	var hit=-1;
	var r=new RegExp('(\\b|_)' + busname + '([_0-9]|\\b)');
	for(var i in nodenamelist){
		if(r.test(nodenamelist[i])) {
			width++;
			hit=i;
		}
	}
	if(width>16)
		return -1;
	if(hit<0)
		return -1;
	// we may have a partial match, so find the full name of the last match
	// we might have matched the first part, second part, or the whole thing (maybe with a numeric suffix)
	var match1 = '^(' + busname + '_.*[^0-9])([0-9]*$|$)';
	var match2 = '^(.*_' + busname + ')([0-9]*$|$)';
	var match3 = '^(' + busname + ')([0-9]*$|$)';
	r=new RegExp(match1);
	var fullname=r.exec(nodenamelist[hit]);
	if(fullname==undefined){
		r=new RegExp(match2);
		fullname=r.exec(nodenamelist[hit]);
		if(fullname==undefined){
			r=new RegExp(match3);
			fullname=r.exec(nodenamelist[hit]);
		}
	}
	// finally, convert from logic values to hex
	if(width==1)
		return isNodeHigh(nodenames[fullname[1]])?1:0;
	return (0x10000+readBits(fullname[1],width)).toString(16).slice(-(width-1)/4-1);
}

function writeDataBus(x){
	var recalcs = Array();
	for(var i=0;i<8;i++){
		var nn = nodenames['db'+i];
		var n = nodes[nn];
		if((x%2)==0) {n.pulldown=true; n.pullup=false;}
		else {n.pulldown=false; n.pullup=true;}
		recalcs.push(nn);
		x>>=1;
	}
	recalcNodeList(recalcs);
}

function mRead(a){
	if(memory[a]==undefined) return 0;
	else return memory[a];
}

function mWrite(a, d){memory[a]=d;}


function clkNodes(){
	var res = Array();
	res.push(943);
	for(var i in nodes[943].gates){
		var t = transistors[nodes[943].gates[i]];
		if(t.c1==npwr) res.push(t.c2);
		if(t.c2==npwr) res.push(t.c1);
	}
	hiliteNode(res);
}

function runChip(){
	var start = document.getElementById('start');
	var stop = document.getElementById('stop');
	start.style.visibility = 'hidden';
	stop.style.visibility = 'visible';
	running = true;
        go();
}

function stopChip(){
	var start = document.getElementById('start');
	var stop = document.getElementById('stop');
	start.style.visibility = 'visible';
	stop.style.visibility = 'hidden';
	running = false;
}

function resetChip(){
	stopChip();
        setStatus('resetting 6502...');                          
	setTimeout(initChip,0);
}

function stepForward(){
	stopChip();
	step();
}

function stepBack(){
	if(cycle==0) return;
	showState(trace[--cycle].chip);
	setMem(trace[cycle].mem);
	var clk = isNodeHigh(nodenames['clk0']);
	if(!clk) writeDataBus(mRead(readAddressBus()));
	chipStatus();
}

function chipStatus(){
	var ab = readAddressBus();
	var machine1 =
	        ' halfcyc:' + cycle +
	        ' phi0:' + readBit('clk0') +
                ' AB:' + hexWord(ab) +
	        ' D:' + hexByte(readDataBus()) +
	        ' RnW:' + readBit('rw');
	var machine2 =
	        ' PC:' + hexWord(readPC()) +
	        ' A:' + hexByte(readA()) +
	        ' X:' + hexByte(readX()) +
	        ' Y:' + hexByte(readY()) +
	        ' SP:' + hexByte(readSP()) +
	        ' ' + readPstring();
	var chk='';
	if(goldenChecksum != undefined)
		chk=" Chk:" + traceChecksum + ((traceChecksum==goldenChecksum)?" OK":" no match");
	setStatus(machine1, machine2, "Hz: " + estimatedHz().toFixed(1) + chk);
	if (loglevel>0) {
		updateLogbox(signalSet(loglevel));
	}
	selectCell(ab);
}

var prevHzTimeStamp=0;
var prevHzCycleCount=0;
var prevHzEstimate1=1;
var prevHzEstimate2=1;
var HzSamplingRate=10;
function estimatedHz(){
	if(cycle%HzSamplingRate!=3)
		return prevHzEstimate1;
	var HzTimeStamp = now();
	var HzEstimate = (cycle-prevHzCycleCount+.01)/(HzTimeStamp-prevHzTimeStamp+.01);
	HzEstimate=HzEstimate*1000/2; // convert from phases per millisecond to Hz
	if(HzEstimate<5)
		HzSamplingRate=5;  // quicker
	if(HzEstimate>10)
		HzSamplingRate=10; // smoother
	prevHzEstimate2=prevHzEstimate1;
	prevHzEstimate1=(HzEstimate+prevHzEstimate1+prevHzEstimate2)/3; // wrong way to average speeds
	prevHzTimeStamp=HzTimeStamp;
	prevHzCycleCount=cycle;
	return prevHzEstimate1
}

function initLogbox(names){
	var logbox=document.getElementById('logstream');
	if(logbox==null)return;

	logStream = [];
        logStream.push("<td>" + names.join("</td><td>") + "</td>");
	logbox.innerHTML = "<tr>"+logStream.join("</tr><tr>")+"</tr>";
}

function updateLogbox(names){
	var logbox=document.getElementById('logstream');
	var signals=[];

	for(i in names){
		signals.push(busToString(names[i]));
	}
        logStream.push("<td>" + signals.join("</td><td>") + "</td>");

	logbox.innerHTML = "<tr>"+logStream.join("</tr><tr>")+"</tr>";
}

function getMem(){
	var res = Array();
	for(var i=0;i<0x200;i++) res.push(mRead(i));
	return res;
}

function setMem(arr){
	for(var i=0;i<0x200;i++){mWrite(i, arr[i]); setCellValue(i, arr[i]);}
}

function hexWord(n){return (0x10000+n).toString(16).substring(1)}
function hexByte(n){return (0x100+n).toString(16).substring(1)}

function adler32(x){
	var a=1;
	var b=0;
	for(var i=0;i<x.length;i++){
		a=(a+x.charCodeAt(i))%65521;
		b=(b+a)%65521;
	}
	return (0x100000000+(b<<16)+a).toString(16).slice(-8);
}

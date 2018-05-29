/*
 Copyright (c) 2010 Brian Silverman, Barry Silverman, Ed Spittles, Achim Breidenbach

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
var logThese=[];
var chipname='6502';
var nodenamereset='res';
var presetLogLists=[
		['cycle'],
		['ab','db','rw','Fetch','pc','a','x','y','s','p'],
		['Execute','State'],
		['ir','tcstate','-pd'],
		['adl','adh','sb','alu'],
		['alucin','alua','alub','alucout','aluvout','dasb'],
		['plaOutputs','DPControl'],
		['idb','dor'],
		['irq','nmi',nodenamereset],
	];

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
	if(typeof userSteps != "undefined"){
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
	cycle++;
	while(
		!isNodeHigh(nodenames['clk0']) ||
		( !isNodeHigh(nodenames['sync']) && isNodeHigh(nodenames['rw']) )
	) {
		halfStep();
		cycle++;
	}
	chipStatus();
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
	for(var nn in nodes) {
		nodes[nn].state = false;
		nodes[nn].float = true;
	}

	nodes[ngnd].state = false;
	nodes[ngnd].float = false;
	nodes[npwr].state = true;
	nodes[npwr].float = false;
	for(var tn in transistors) transistors[tn].on = false;
	setLow(nodenamereset);
	setLow('clk0');
	setHigh('rdy'); setLow('so');
	setHigh('irq'); setHigh('nmi');
	recalcNodeList(allNodes()); 
	for(var i=0;i<8;i++){setHigh('clk0'), setLow('clk0');}
	setHigh(nodenamereset);
	for(var i=0;i<18;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	refresh();
	cycle = 0;
	trace = Array();
	if(typeof expertMode != "undefined")
		updateLogList();
	chipStatus();
	if(ctrace)console.log('initChip done after', now()-start);
}

function signalSet(n){
	var signals=[];
	for (var i=0; (i<=n)&&(i<presetLogLists.length) ; i++){
		for (var j=0; j<presetLogLists[i].length; j++){
			signals.push(presetLogLists[i][j]);
		}
	}
	return signals;
}

function updateLogList(names){
	// user supplied a list of signals, which we append to the set defined by loglevel
	logThese = signalSet(loglevel);
	if(typeof names == "undefined")
		// this is a UI call - read the text input
		names = document.getElementById('LogThese').value;
	else
		// this is an URL call - update the text input box
		document.getElementById('LogThese').value = names;
	names = names.split(/[\s,]+/);
	for(var i=0;i<names.length;i++){
		// could be a signal name, a node number, or a special name
		if(typeof busToString(names[i]) != "undefined")
			logThese.push(names[i]);
	}
	initLogbox(logThese);
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

// triggers for breakpoints, watchpoints, input pin events
// almost always are undefined when tested, so minimal impact on performance
clockTriggers={};
writeTriggers={};
readTriggers={};
fetchTriggers={};

// example instruction tracing triggers
// fetchTriggers[0x20]="console.log('0x'+readAddressBus().toString(16)+': JSR');";
// fetchTriggers[0x60]="console.log('0x'+readAddressBus().toString(16)+': RTS');";
// fetchTriggers[0x4c]="console.log('0x'+readAddressBus().toString(16)+': JMP');";

// simulate a single clock phase with no update to graphics or trace
function halfStep(){
	var clk = isNodeHigh(nodenames['clk0']);
	if (clk) {setLow('clk0'); handleBusRead(); } 
	else {setHigh('clk0'); handleBusWrite();}
	eval(clockTriggers[cycle+1]);  // pre-apply next tick's inputs now, so the updates are displayed

}

function handleBusRead(){
	if(isNodeHigh(nodenames['rw'])){
		var a = readAddressBus();
		var d = eval(readTriggers[a]);
		if(d == undefined)
			d = mRead(readAddressBus());
		if(isNodeHigh(nodenames['sync']))
			eval(fetchTriggers[d]);
		writeDataBus(d);
	}
}

function handleBusWrite(){
	if(!isNodeHigh(nodenames['rw'])){
		var a = readAddressBus();
		var d = readDataBus();
		eval(writeTriggers[a]);
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
            (isNodeHigh(nodenames['p4'])?'B':'b') +
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

// for one-hot or few-hot signal collections we want to list the active ones
// and for brevity we remove the common prefix
function listActiveSignals(pattern){
	var r=new RegExp(pattern);
	var list=[];
	for(var i in nodenamelist){
		if(r.test(nodenamelist[i])) {
			if(isNodeHigh(nodenames[nodenamelist[i]]))
				// also map hyphen to a non-breaking version
				list.push(nodenamelist[i].replace(r,'').replace(/-/g,'&#8209'));
		}
	}
	return list;
}

// The 6502 TCState is almost but not quite an inverted one-hot shift register
function listActiveTCStates() {
	var s=[];
	if(!isNodeHigh(nodenames['clock1']))	s.push("T0");
	if(!isNodeHigh(nodenames['clock2']))	s.push("T1");
	if(!isNodeHigh(nodenames['t2']))	s.push("T2");
	if(!isNodeHigh(nodenames['t3']))	s.push("T3");
	if(!isNodeHigh(nodenames['t4']))	s.push("T4");
	if(!isNodeHigh(nodenames['t5']))	s.push("T5");
	return s.join("+");
}

    // Show all time code node states (active and inactive) in fixed format,
    // with non-PLA-controlling internal state indication in square
    // brackets, followed by RCL-resident timing state indication.
    // ".." for a PLA-controlling node indicates inactive state, "T"* for a
    // PLA-controlling node indicates active state.
    // Bracketed codes are one of T1/V0/T6/..
    // V0 indicates the VEC0 node, T6 is a synonym for the VEC1 node.
    // The RCL codes are one of SD1/SD2/...
    // For discussion of this reconstruction, see:
    // http://visual6502.org/wiki/index.php?title=6502_Timing_States
function allTCStates( useHTML )
{
    var s = "";
    var _spc;
    useHTML = (typeof useHTML === 'undefined') ? false : useHTML;
        // Use Non-Breaking Space for presentation in an HTML (browser)
        // context, else use ASCII space for logging context
    _spc = useHTML ? '&nbsp;' : ' ';
    if ( !isNodeHigh( nodenames[ 'clock1' ] ) ) s += "T0"; else s += "..";
    s += _spc;
        // T+ in visual6502 is called T1x in
        // http://www.weihenstephan.org/~michaste/pagetable/6502/6502.jpg
        // Notated as T+ for compatibility with PLA node names
    if ( !isNodeHigh( nodenames[ 'clock2' ] ) ) s += "T+"; else s += "..";
    s += _spc;
    if ( !isNodeHigh( nodenames[ 't2' ] ) ) s += "T2"; else s += "..";
    s += _spc;
    if ( !isNodeHigh( nodenames[ 't3' ] ) ) s += "T3"; else s += "..";
    s += _spc;
    if ( !isNodeHigh( nodenames[ 't4' ] ) ) s += "T4"; else s += "..";
    s += _spc;
    if ( !isNodeHigh( nodenames[ 't5' ] ) ) s += "T5"; else s += "..";
    s += _spc + "[";
    // Check three confirmed exclusive states (three nodes)
    if ( isNodeHigh( 862 ) ) {
        s += "T1";
        // ...else if VEC0 is on...
    } else if ( isNodeHigh( nodenames[ 'VEC0' ] ) ) {
        // ...then tell the outside world
        s += "V0";
        // ...else if VEC1 is on...
    } else if ( isNodeHigh( nodenames[ 'VEC1' ] ) ) {
        // ...then this is the canonical T6. It is a synonym for VEC1
        s += "T6";
    } else {
        // ...else none of the "hidden" bits in the clock state is active
        s += "..";
    }
    s += "]" + _spc;
    // Check the RCL's two confirmed exclusive states (two nodes)
        // If this node is grounding ~WR...
    if ( isNodeHigh( 440 ) ) {
        // ...then we can regard this state as Store Data 1
        s += "SD1";
        // ...else if this node is grounding ~WR...
    } else if ( isNodeHigh( 1258 ) ) {
        // ...then we can regard this state as Store Data 2
        s += "SD2";
    } else {
        // ...else none of the RCL-resident timing bits is active
        s += "...";
    }
    return s;
}

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
	// some 'signal names' are CPU-specific aliases to user-friendly string output
	if(busname=='cycle')
		return cycle>>1;
	if(busname=='pc')
		return busToHex('pch') + busToHex('pcl');
	if(busname=='p')
		return readPstring();
	if(busname=='tcstate')
		return ['clock1','clock2','t2','t3','t4','t5'].map(busToHex).join("");
	if(busname=='State')
		return listActiveTCStates();
	if(busname=='TState')
		return allTCStates( true );
	if(busname=='Phi')
		// Pretty-printed phase indication based on the state of cp1,
                // the internal Phase 1 node
		return '&Phi;' +
		       (isNodeHigh( nodenames[ 'cp1' ] ) ? '1' : '2');
	if(busname=='Execute')
		return disassemblytoHTML(readBits('ir',8));
	if(busname=='Fetch')
		return isNodeHigh(nodenames['sync'])?disassemblytoHTML(readDataBus()):"";
	if(busname=='plaOutputs')
		// PLA outputs are mostly ^op- but some have a prefix too
		//    - we'll allow the x and xx prefix but ignore the #
		return listActiveSignals('^([x]?x-)?op-');
	if(busname=='DPControl')
		return listActiveSignals('^dpc[-]?[0-9]+_');
	if(busname[0]=="-"){
		// invert the value of the bus for display
		var value=busToHex(busname.slice(1))
		if(typeof value != "undefined")
			return value.replace(/./g,function(x){return (15-parseInt(x,16)).toString(16)});
		else
			return undefined;;
	} else {
		return busToHex(busname);
	}
}

function busToHex(busname){
	// may be passed a bus or a signal, so allow multiple signals
	var width=0;
	var r=new RegExp('^' + busname + '[0-9]+$');
	for(var i in nodenamelist){
		if(r.test(nodenamelist[i])) {
			width++;
		}
	}
	if(width==0) {
		// not a bus, so could be a signal, a nodenumber or a mistake
		if(typeof nodenames[busname] != "undefined")
			return isNodeHigh(nodenames[busname])?"1":"0";
		if((parseInt(busname)!=NaN) && (typeof nodes[busname] != "undefined"))
			return isNodeHigh(busname)?"1":"0";
		return undefined;
	}
	if(width>16)
		return undefined;
	// finally, convert from logic values to hex
	return (0x10000+readBits(busname,width)).toString(16).slice(-(width-1)/4-1);
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
		var t = nodes[943].gates[i];
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
	if(typeof running == "undefined")
		initChip();
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
        setStatus('resetting ' + chipname + '...');
	setTimeout(initChip,0);
}

function stepForward(){
	if(typeof running == "undefined")
		initChip();
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
	var machine3 = 
		'Hz: ' + estimatedHz().toFixed(1);
	if(typeof expertMode != "undefined") {
		machine3 += ' Exec: ' + busToString('Execute') + '(' + busToString('State') + ')';
		if(isNodeHigh(nodenames['sync']))
			machine3 += ' (Fetch: ' + busToString('Fetch') + ')';
		if(goldenChecksum != undefined)
			machine3 += " Chk:" + traceChecksum + ((traceChecksum==goldenChecksum)?" OK":" no match");
	}
	setStatus(machine1, machine2, machine3);
	if (logThese.length>1) {
		updateLogbox(logThese);
	}
	selectCell(ab);
}

// run for an extended number of cycles, with low overhead, for interactive programs or for benchmarking
//    note: to run an interactive program, use an URL like
//    http://visual6502.org/JSSim/expert.html?graphics=f&loglevel=-1&headlesssteps=-500
function goFor(){
	var n = headlessSteps;  //  a negative value is a request to free-run
	if(headlessSteps<0)
		n=-n;
	var start = document.getElementById('start');
	var stop = document.getElementById('stop');
	start.style.visibility = 'hidden';
	stop.style.visibility = 'visible';
	if(typeof running == "undefined") {
		initChip();
	}
	running = true;
	setTimeout("instantaneousHz(); goForN("+n+")",0);
}

// helper function: allows us to poll 'running' without resetting it when we're re-scheduled
function goForN(n){
	var n2=n;  // save our parameter so we can re-submit ourselves
	while(n--){
		halfStep();
		cycle++;
	}
	instantaneousHz();
	chipStatus();
	if((headlessSteps<0) && running){
		setTimeout("goForN("+n2+")",0); // re-submit ourselves if we are meant to free-run
		return;
	}
	running = false;
	var start = document.getElementById('start');
	var stop = document.getElementById('stop');
	start.style.visibility = 'visible';
	stop.style.visibility = 'hidden';
}

var prevHzTimeStamp=0;
var prevHzCycleCount=0;
var prevHzEstimate1=1;
var prevHzEstimate2=1;
var HzSamplingRate=10;

// return an averaged speed: called periodically during normal running
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

// return instantaneous speed: called twice, before and after a timed run using goFor()
function instantaneousHz(){
	var HzTimeStamp = now();
	var HzEstimate = (cycle-prevHzCycleCount+.01)/(HzTimeStamp-prevHzTimeStamp+.01);
	HzEstimate=HzEstimate*1000/2; // convert from phases per millisecond to Hz
	prevHzEstimate1=HzEstimate;
	prevHzEstimate2=prevHzEstimate1;
	prevHzTimeStamp=HzTimeStamp;
	prevHzCycleCount=cycle;
	return prevHzEstimate1
}

var logbox;
function initLogbox(names){
	logbox=document.getElementById('logstream');
	if(logbox==null)return;

	names=names.map(function(x){return x.replace(/^-/,'')});
	logStream = [];
	logStream.push("<td class=header>" + names.join("</td><td class=header>") + "</td>");
	logbox.innerHTML = "<tr>"+logStream.join("</tr><tr>")+"</tr>";
}

var logboxAppend=true;

// can append or prepend new states to the log table
// when we reverse direction we need to reorder the log stream
function updateLogDirection(){
	var loglines=[];
	logboxAppend=!logboxAppend;
	// the first element is the header so we can't reverse()
	for (var i=1;i<logStream.length;i++) {
		loglines.unshift(logStream[i]);
	}
	loglines.unshift(logStream[0]);
	logStream=loglines;
	logbox.innerHTML = "<tr>"+logStream.join("</tr><tr>")+"</tr>";
}

// update the table of signal values, by prepending or appending
function updateLogbox(names){
	var signals=[];
	var odd=true;
	var bg;
	var row;

	for(var i in names){
		if(cycle % 4 < 2){
			bg = odd ? " class=oddcol":"";
		} else {
			bg = odd ? " class=oddrow":" class=oddrowcol";
		}
		signals.push("<td" + bg + ">" + busToString(names[i]) + "</td>");
		odd =! odd;
	}
	row = "<tr>" + signals.join("") + "</tr>";
	if(logboxAppend)
	        logStream.push(row);
	else
		logStream.splice(1,0,row);

	logbox.innerHTML = logStream.join("");
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

// sanitised opcode for HTML output
function disassemblytoHTML(byte){
	var opcode=disassembly[byte];
	if(typeof opcode == "undefined")
		return "unknown"
	return opcode.replace(/ /,'&nbsp;');
}

// opcode lookup for 6502 - not quite a disassembly
//   javascript derived from Debugger.java by Achim Breidenbach
var disassembly={
0x00:"BRK",
0x01:"ORA (zp,X)",
0x05:"ORA zp",
0x06:"ASL zp",
0x08:"PHP",
0x09:"ORA #",
0x0A:"ASL ",
0x0D:"ORA Abs",
0x0E:"ASL Abs",
0x10:"BPL ",
0x11:"ORA (zp),Y",
0x15:"ORA zp,X",
0x16:"ASL zp,X",
0x18:"CLC",
0x19:"ORA Abs,Y",
0x1D:"ORA Abs,X",
0x1E:"ASL Abs,X",
0x20:"JSR Abs",
0x21:"AND (zp,X)",
0x24:"BIT zp",
0x25:"AND zp",
0x26:"ROL zp",
0x28:"PLP",
0x29:"AND #",
0x2A:"ROL ",
0x2C:"BIT Abs",
0x2D:"AND Abs",
0x2E:"ROL Abs",
0x30:"BMI ",
0x31:"AND (zp),Y",
0x35:"AND zp,X",
0x36:"ROL zp,X",
0x38:"SEC",
0x39:"AND Abs,Y",
0x3D:"AND Abs,X",
0x3E:"ROL Abs,X",
0x40:"RTI",
0x41:"EOR (zp,X)",
0x45:"EOR zp",
0x46:"LSR zp",
0x48:"PHA",
0x49:"EOR #",
0x4A:"LSR ",
0x4C:"JMP Abs",
0x4D:"EOR Abs",
0x4E:"LSR Abs",
0x50:"BVC ",
0x51:"EOR (zp),Y",
0x55:"EOR zp,X",
0x56:"LSR zp,X",
0x58:"CLI",
0x59:"EOR Abs,Y",
0x5D:"EOR Abs,X",
0x5E:"LSR Abs,X",
0x60:"RTS",
0x61:"ADC (zp,X)",
0x65:"ADC zp",
0x66:"ROR zp",
0x68:"PLA",
0x69:"ADC #",
0x6A:"ROR ",
0x6C:"JMP (Abs)",
0x6D:"ADC Abs",
0x6E:"ROR Abs",
0x70:"BVS ",
0x71:"ADC (zp),Y",
0x75:"ADC zp,X",
0x76:"ROR zp,X",
0x78:"SEI",
0x79:"ADC Abs,Y",
0x7D:"ADC Abs,X",
0x7E:"ROR Abs,X",
0x81:"STA (zp,X)",
0x84:"STY zp",
0x85:"STA zp",
0x86:"STX zp",
0x88:"DEY",
0x8A:"TXA",
0x8C:"STY Abs",
0x8D:"STA Abs",
0x8E:"STX Abs",
0x90:"BCC ",
0x91:"STA (zp),Y",
0x94:"STY zp,X",
0x95:"STA zp,X",
0x96:"STX zp,Y",
0x98:"TYA",
0x99:"STA Abs,Y",
0x9A:"TXS",
0x9D:"STA Abs,X",
0xA0:"LDY #",
0xA1:"LDA (zp,X)",
0xA2:"LDX #",
0xA4:"LDY zp",
0xA5:"LDA zp",
0xA6:"LDX zp",
0xA8:"TAY",
0xA9:"LDA #",
0xAA:"TAX",
0xAC:"LDY Abs",
0xAD:"LDA Abs",
0xAE:"LDX Abs",
0xB0:"BCS ",
0xB1:"LDA (zp),Y",
0xB4:"LDY zp,X",
0xB5:"LDA zp,X",
0xB6:"LDX zp,Y",
0xB8:"CLV",
0xB9:"LDA Abs,Y",
0xBA:"TSX",
0xBC:"LDY Abs,X",
0xBD:"LDA Abs,X",
0xBE:"LDX Abs,Y",
0xC0:"CPY #",
0xC1:"CMP (zp,X)",
0xC4:"CPY zp",
0xC5:"CMP zp",
0xC6:"DEC zp",
0xC8:"INY",
0xC9:"CMP #",
0xCA:"DEX",
0xCC:"CPY Abs",
0xCD:"CMP Abs",
0xCE:"DEC Abs",
0xD0:"BNE ",
0xD1:"CMP (zp),Y",
0xD5:"CMP zp,X",
0xD6:"DEC zp,X",
0xD8:"CLD",
0xD9:"CMP Abs,Y",
0xDD:"CMP Abs,X",
0xDE:"DEC Abs,X",
0xE0:"CPX #",
0xE1:"SBC (zp,X)",
0xE4:"CPX zp",
0xE5:"SBC zp",
0xE6:"INC zp",
0xE8:"INX",
0xE9:"SBC #",
0xEA:"NOP",
0xEC:"CPX Abs",
0xED:"SBC Abs",
0xEE:"INC Abs",
0xF0:"BEQ ",
0xF1:"SBC (zp),Y",
0xF5:"SBC zp,X",
0xF6:"INC zp,X",
0xF8:"SED",
0xF9:"SBC Abs,Y",
0xFD:"SBC Abs,X",
0xFE:"INC Abs,X",
};

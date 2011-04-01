// chip-specific support functions
//
// may override function definitions made previously

chipname='6800';

grChipSize=7000;

ngnd = nodenames['gnd'];
npwr = nodenames['vcc'];

nodenamereset = 'reset';

presetLogLists=[
                ['cycle','phi1','phi2'],
                ['ab','db','rw','pc','a','b'],
                ['ir'],
                ['irq','nmi',nodenamereset],
        ];

function setupTransistors(){
	for(i in transdefs){
		var tdef = transdefs[i];
		var name = tdef[0];
		var gate = tdef[1];
		var c1 = tdef[2];
		var c2 = tdef[3];
		var bb = tdef[4];
		if(tdef[6])
			// just ignore all the 'weak' transistors for now
			continue;
		if(c1==ngnd) {c1=c2;c2=ngnd;}
		if(c1==npwr) {c1=c2;c2=npwr;}
		var trans = {name: name, on: false, gate: gate, c1: c1, c2: c2, bb: bb};
		nodes[gate].gates.push(trans);
		nodes[c1].c1c2s.push(trans);
		nodes[c2].c1c2s.push(trans);
		transistors[name] = trans;
	}
}

// simulate a single clock phase with no update to graphics or trace
function halfStep(){
	var clk = isNodeHigh(nodenames['phi2']);
	eval(clockTriggers[cycle]);
	if (clk) {setLow('phi2'); handleBusRead(); setHigh('phi1'); }
	else {setHigh('phi1'); setLow('phi1'); setHigh('phi2'); handleBusWrite();}
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
	setHigh('phi1'); setLow('phi2');
	setHigh('dbe'); setLow('tsc'); setHigh('halt');
	setHigh('irq'); setHigh('nmi');
	recalcNodeList(allNodes()); 
	for(var i=0;i<8;i++){setLow('phi1'); setHigh('phi2'); setLow('phi2'); setHigh('phi1');}
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

function handleBusRead(){
	if(isNodeHigh(nodenames['rw'])){
		var a = readAddressBus();
		var d = eval(readTriggers[a]);
		if(d == undefined)
			d = mRead(readAddressBus());
		// we have no SYNC pin on 6800
		// if(isNodeHigh(nodenames['sync']))
		// 	eval(fetchTriggers[d]);
		writeDataBus(d);
	}
}

function chipStatus(){
	var ab = readAddressBus();
	var machine1 =
	        ' halfcyc:' + cycle +
	        ' phi0:' + readBit('phi2') +
                ' AB:' + hexWord(ab) +
	        ' D:' + hexByte(readDataBus()) +
	        ' RnW:' + readBit('rw');
/* 6800 machine state names are not in place yet */
	var machine2 = ''
	var machine3 = ''
/*
	var machine2 =
	        ' PC:' + hexWord(readPC()) +
	        ' A:' + hexByte(readA()) +
	        ' X:' + hexByte(readX()) +
	        ' Y:' + hexByte(readY()) +
	        ' SP:' + hexByte(readSP()) +
	        ' ' + readPstring();
*/
	var machine3 = 
		'Hz: ' + estimatedHz().toFixed(1);
/*
	if(typeof expertMode != "undefined") {
		machine3 += ' Exec: ' + busToString('Execute') + '(' + busToString('State') + ')';
		if(isNodeHigh(nodenames['sync']))
			machine3 += ' (Fetch: ' + busToString('Fetch') + ')';
		if(goldenChecksum != undefined)
			machine3 += " Chk:" + traceChecksum + ((traceChecksum==goldenChecksum)?" OK":" no match");
	}
*/
	setStatus(machine1, machine2, machine3);
	if (loglevel>0) {
		updateLogbox(logThese);
	}
	selectCell(ab);
}

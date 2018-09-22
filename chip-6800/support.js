// chip-specific support functions
//
// may override function definitions made previously

chipname='6800';

grChipSize=6600;
grChipOffsetX=25
grChipOffsetY=-200;

ngnd = nodenames['gnd'];
npwr = nodenames['vcc'];

nodenamereset = 'reset';

presetLogLists=[
                ['cycle',],
                ['ab','db','rw','vma','Fetch','pc','acca','accb','ix','sp','p'],
                ['ir','sync','Execute','State'],			// instruction fetch and execution control
                ['dbi','dbo','tmp','sum','inc'],			// internal register-sized state
                ['idb','abh','abl','ablx'],				// internal datapath busses
                ['irq','nmi',nodenamereset,'tsc','dbe','halt','ba'],	// other pins
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
	if (clk) {setLow('phi2'); setLow('dbe'); setHigh('phi1'); handleBusRead(); }
	else {setHigh('phi1'); setLow('phi1'); setHigh('phi2'); setHigh('dbe'); handleBusWrite();}
}

function goUntilSyncOrWrite(){
	halfStep();
	cycle++;
	while(
		!isNodeHigh(nodenames['phi2']) ||
		( !isNodeHigh(nodenames['sync']) && isNodeHigh(nodenames['rw']) )
	) {
		halfStep();
		cycle++;
	}
	chipStatus();
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
	setHigh('phi1'); setLow('phi2'); setLow('dbe');
	setHigh('dbe'); setLow('tsc'); setHigh('halt');
	setHigh('irq'); setHigh('nmi');
	recalcNodeList(allNodes()); 
	for(var i=0;i<8;i++){
		setLow('phi1');
		setHigh('phi2'); setHigh('dbe');
		setLow('phi2'); setLow('dbe');
		setHigh('phi1');
	}
	setHigh(nodenamereset);
	for(var i=0;i<6;i++){halfStep();} // avoid updating graphics and trace buffer before user code
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
		if(isNodeHigh(nodenames['sync']))
			eval(fetchTriggers[d]);
		writeDataBus(d);
	}
}

function readAccA(){return readBits('acca', 8);}
function readAccB(){return readBits('accb', 8);}
function readIX(){return (readBits('ixh', 8)<<8) + readBits('ixl', 8);}
function readSP(){return (readBits('sph', 8)<<8) + readBits('spl', 8);}
function readPstring(){
   var result;
   result = '&#8209' +  // non-breaking hyphen
            '&#8209' +  // non-breaking hyphen
            (isNodeHigh(nodenames['flagh'])?'H':'h') +
            (isNodeHigh(nodenames['flagi'])?'I':'i') +
            (isNodeHigh(nodenames['flagn'])?'N':'n') +
            (isNodeHigh(nodenames['flagz'])?'Z':'z') +
            (isNodeHigh(nodenames['flagv'])?'V':'v') +
            (isNodeHigh(nodenames['flagc'])?'C':'c');
   return result;
}

// The 6800 state control is something like a branching shift register
// ... but not quite like that
TCStates=[
        "Ts",   "Tf",
        "Tx0",  "Tx1",   "Tx2",
                                "Ta0", "Ta1", "Ta2",
        "Td0_0",
	"#Te0", "Te1_0",
        "Tg0",  "Tg1",   "Tg2", "Tg3", "Tg4", "Tg5", "Tg6", "Tg7", "Tg8",
                                "Tr3", "Tr4", "Tr5", "Tr6", "Tr7", "Tr8",
];

function listActiveTCStates() {
	var s=[];
	for(var i=0;i<TCStates.length;i++){
		var t=TCStates[i];
		// remove a leading hash, but invert the signal
		// in any case, remove any trailing suffix
		if(t[0]=="#"){
			if(!isNodeHigh(nodenames[t])) s.push(t.slice(1,4));
		} else {
			if(isNodeHigh(nodenames[t])) s.push(t.slice(0,3));
		}
	}
	return s.join("+");
}

function busToString(busname){
	// takes a signal name or prefix
	// returns an appropriate string representation
	// some 'signal names' are CPU-specific aliases to user-friendly string output
	if(busname=='cycle')
		return cycle>>1;
	if(busname=='pc')
		return busToHex('pch') + busToHex('pcl');
	if(busname=='sp')
		return busToHex('sph') + busToHex('spl');
	if(busname=='ix')
		return busToHex('ixh') + busToHex('ixl');
	if(busname=='inc')
		return busToHex('inch') + busToHex('incl');
	if(busname=='p')
		return readPstring();
	if(busname=='State')
		return listActiveTCStates();
	if(busname=='Execute')
		return disassemblytoHTML(readBits('ir',8));
	if(busname=='Fetch')
		return isNodeHigh(nodenames['sync'])?disassemblytoHTML(readDataBus()):"";
	if(busname=='plaOutputs')
		// PLA outputs are mostly ^op- but some have a prefix too
		//    - we'll allow the x and xx prefix but ignore the #
		return listActiveSignals('^([x]?x-)?op-');
	if(busname=='DPControl')
		return listActiveSignals('^dpc[0-9]+_');
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

function chipStatus(){
	var ab = readAddressBus();
	var machine1 =
	        ' halfcyc:' + cycle +
	        ' phi0:' + readBit('phi2') +
                ' AB:' + hexWord(ab) +
	        ' D:' + hexByte(readDataBus()) +
	        ' RnW:' + readBit('rw') +
	        ' VMA:' + readBit('vma');
	var machine2 =
	        ' PC:' + hexWord(readPC()) +
	        ' A:' + hexByte(readAccA()) +
	        ' B:' + hexByte(readAccB()) +
	        ' IX:' + hexWord(readIX()) +
	        ' SP:' + hexWord(readSP()) +
	        ' ' + readPstring();
	var machine3 = 
		'Hz: ' + estimatedHz().toFixed(1);
	if(typeof expertMode != "undefined") {
		machine3 += ' Exec: ' + busToString('Execute'); // no T-state info for 6800 yet
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

// javascript derived from http://segher.ircgeeks.net/6800/OPS
var disassembly={
0x00: "!",
0x01: "nop",
0x02: "!",
0x03: "!",
0x04: "!",
0x05: "!",
0x06: "tap",
0x07: "tpa",
0x10: "sba",
0x11: "cba",
0x12: "!",
0x13: "!",
0x14: "!nba",
0x15: "!",
0x16: "tab",
0x17: "tba",
0x20: "bra N",
0x21: "!",
0x22: "bhi N",
0x23: "bls N",
0x24: "bcc N",
0x25: "bcs N",
0x26: "bne N",
0x27: "beq N",
0x30: "tsx",
0x31: "ins",
0x32: "pul a",
0x33: "pul b",
0x34: "des",
0x35: "txs",
0x36: "psh a",
0x37: "psh b",
0x40: "neg a",
0x41: "!",
0x42: "!",
0x43: "com a",
0x44: "lsr a",
0x45: "!",
0x46: "ror a",
0x47: "asr a",
0x50: "neg b",
0x51: "!",
0x52: "!",
0x53: "com b",
0x54: "lsr b",
0x55: "!",
0x56: "ror b",
0x57: "asr b",
0x60: "neg Nx",
0x61: "!",
0x62: "!",
0x63: "com Nx",
0x64: "lsr Nx",
0x65: "!",
0x66: "ror Nx",
0x67: "asr Nx",
0x70: "neg NN",
0x71: "!",
0x72: "!",
0x73: "com NN",
0x74: "lsr NN",
0x75: "!",
0x76: "ror NN",
0x77: "asr NN",
0x80: "sub a #",
0x81: "cmp a #",
0x82: "sbc a #",
0x83: "!",
0x84: "and a #",
0x85: "bit a #",
0x86: "lda a #",
0x87: "!",
0x90: "sub a N",
0x91: "cmp a N",
0x92: "sbc a N",
0x93: "!",
0x94: "and a N",
0x95: "bit a N",
0x96: "lda a N",
0x97: "sta a N",
0xa0: "sub a Nx",
0xa1: "cmp a Nx",
0xa2: "sbc a Nx",
0xa3: "!",
0xa4: "and a Nx",
0xa5: "bit a Nx",
0xa6: "lda a Nx",
0xa7: "sta a Nx",
0xb0: "sub a NN",
0xb1: "cmp a NN",
0xb2: "sbc a NN",
0xb3: "!",
0xb4: "and a NN",
0xb5: "bit a NN",
0xb6: "lda a NN",
0xb7: "sta a NN",
0xc0: "sub b #",
0xc1: "cmp b #",
0xc2: "sbc b #",
0xc3: "!",
0xc4: "and b #",
0xc5: "bit b #",
0xc6: "lda b #",
0xc7: "!",
0xd0: "sub b N",
0xd1: "cmp b N",
0xd2: "sbc b N",
0xd3: "!",
0xd4: "and b N",
0xd5: "bit b N",
0xd6: "lda b N",
0xd7: "sta b N",
0xe0: "sub b Nx",
0xe1: "cmp b Nx",
0xe2: "sbc b Nx",
0xe3: "!",
0xe4: "and b Nx",
0xe5: "bit b Nx",
0xe6: "lda b Nx",
0xe7: "sta b Nx",
0xf0: "sub b NN",
0xf1: "cmp b NN",
0xf2: "sbc b NN",
0xf3: "!",
0xf4: "and b NN",
0xf5: "bit b NN",
0xf6: "lda b NN",
0xf7: "sta b NN",
0x08: "inx",
0x09: "dex",
0x0a: "clv",
0x0b: "sev",
0x0c: "clc",
0x0d: "sec",
0x0e: "cli",
0x0f: "sei",
0x18: "!",
0x19: "daa",
0x1a: "!",
0x1b: "aba",
0x1c: "!",
0x1d: "!",
0x1e: "!",
0x1f: "!",
0x28: "bvc N",
0x29: "bvs N",
0x2a: "bpl N",
0x2b: "bmi N",
0x2c: "bge N",
0x2d: "blt N",
0x2e: "bgt N",
0x2f: "ble N",
0x38: "!",
0x39: "rts",
0x3a: "!",
0x3b: "rti",
0x3c: "!",
0x3d: "!",
0x3e: "wai",
0x3f: "swi",
0x48: "asl a",
0x49: "rol a",
0x4a: "dec a",
0x4b: "!",
0x4c: "inc a",
0x4d: "tst a",
0x4e: "!",
0x4f: "clr a",
0x58: "asl b",
0x59: "rol b",
0x5a: "dec b",
0x5b: "!",
0x5c: "inc b",
0x5d: "tst b",
0x5e: "!",
0x5f: "clr b",
0x68: "asl Nx",
0x69: "rol Nx",
0x6a: "dec Nx",
0x6b: "!",
0x6c: "inc Nx",
0x6d: "tst Nx",
0x6e: "jmp Nx",
0x6f: "clr Nx",
0x78: "asl NN",
0x79: "rol NN",
0x7a: "dec NN",
0x7b: "!",
0x7c: "inc NN",
0x7d: "tst NN",
0x7e: "jmp NN",
0x7f: "clr NN",
0x88: "eor a #",
0x89: "adc a #",
0x8a: "ora a #",
0x8b: "add a #",
0x8c: "cpx ##",
0x8d: "bsr N",
0x8e: "lds ##",
0x8f: "!",
0x98: "eor a N",
0x99: "adc a N",
0x9a: "ora a N",
0x9b: "add a N",
0x9c: "cpx N",
0x9d: "!hcf",
0x9e: "lds N",
0x9f: "sts N",
0xa8: "eor a Nx",
0xa9: "adc a Nx",
0xaa: "ora a Nx",
0xab: "add a Nx",
0xac: "cpx Nx",
0xad: "jsr Nx",
0xae: "lds Nx",
0xaf: "sts Nx",
0xb8: "eor a NN",
0xb9: "adc a NN",
0xba: "ora a NN",
0xbb: "add a NN",
0xbc: "cpx NN",
0xbd: "jsr NN",
0xbe: "lds NN",
0xbf: "sts NN",
0xc8: "eor b #",
0xc9: "adc b #",
0xca: "ora b #",
0xcb: "add b #",
0xcc: "!",
0xcd: "!",
0xce: "ldx ##",
0xcf: "!",
0xd8: "eor b N",
0xd9: "adc b N",
0xda: "ora b N",
0xdb: "add b N",
0xdc: "!",
0xdd: "!hcf",
0xde: "ldx N",
0xdf: "stx N",
0xe8: "eor b Nx",
0xe9: "adc b Nx",
0xea: "ora b Nx",
0xeb: "add b Nx",
0xec: "!",
0xed: "!",
0xee: "ldx Nx",
0xef: "stx Nx",
0xf8: "eor b NN",
0xf9: "adc b NN",
0xfa: "ora b NN",
0xfb: "add b NN",
0xfc: "!",
0xfd: "!",
0xfe: "ldx NN",
0xff: "stx NN",
};

// chip-specific support functions
//
// may override function definitions made previously

chipname='sm83';

grChipSize=7348;
grChipOffsetX=0;
grChipOffsetY=-286;
grCanvasSize=7348;
grMaxZoom=24;

ngnd = nodenames['gnd'];
npwr = nodenames['vdd'];

// Index of layerNames corresponds to index into drawLayers
var layernames = ['nwell', 'switched diffusion', 'grounded n-diffusion',
                  'powered p-diffusion', 'polysilicon', 'contact', 'metal'];
var colors = ['rgba(96,64,0,0.6)', '#FFFF00', '#4DFF4D', '#FF4D4D', '#801AC0',
              '#4F4F4F', 'rgba(128,128,192,0.4)'];
var drawlayers = [true, true, true, true, true, true, true];

presetLogLists=[
	['cycle',],
	['adr', 'data', 'm1', 'rd', 'wr', 'pc', 'Fetch', 'Execute', 'State'],
	['acc', 'flags', 'bc', 'de', 'hl', 'sp', 'wz'],
	['mreq', 'pwron_reset', 'sys_reset', 'wake', 'clk_ready', 'halt', 'stop'],
	['nmi', 'ime', 'ie', 'int', 'inta', 'in_intr', 'int_vector'],
];

var tclk_state = 0;
var suspendRecalcCount = 0;
var nbaList = new Array();

function recalcNodeList(list){
	if(suspendRecalcCount > 0){
		list.forEach(function(nn){
			if(recalcHash[nn] == 1)return;
			recalclist.push(nn);
			recalcHash[nn] = 1;
		});
		return;
	}
	recalclist = new Array();
	recalcHash = new Array();
	for(var j=0;j<100;j++){
		if(list.length==0) {
			applyNbaList(nbaList);
			if(recalclist.length==0 && nbaList.length==0) return;
		}
		list.forEach(recalcNode);
		list = recalclist;
		recalclist = new Array();
		recalcHash = new Array();
	}
}

function applyNbaList(list){
	nbaList = new Array();
	list.forEach(function(state, nn){
		applyNewState(nodes[nn], state);
	});
}

function suspendRecalc() {suspendRecalcCount++;}
function resumeRecalc()  {suspendRecalcCount--; recalcNodeList(recalclist);}

function getNodename(id) {return Object.keys(nodenames).find(key => nodenames[key] == id);}

// Override ChipSim recalcNode() function to implement active-low gate
// enable of PMOS transistors.
function recalcNode(node){
	if(node==ngnd) return;
	if(node==npwr) return;
	getNodeGroup(node);
	var newState = getNodeValue();
	if(ctrace && (traceTheseNodes.indexOf(node)!=-1)) {
		var n = nodes[node];
		console.log('recalc', node, getNodename(node), group, n.state, '->', newState);
	}
	group.forEach(function(i){
		var n = nodes[i];
		if(ctrace && i != node && (traceTheseNodes.indexOf(i)!=-1)) {
			console.log('recalc', i, getNodename(i), 'because of', node, getNodename(node), group, n.state, '->', newState);
		}
		if(nbaNodes[i] == 1)
			nbaList[i] = newState;
		else
			applyNewState(n, newState);
	});
}

function applyNewState(n, s){
	if(!n.float && n.state==s) return;
	n.state = s;
	n.float = false;
	n.gates.forEach(function(t){
		if(n.state != t.pmos) turnTransistorOn(t);
		else turnTransistorOff(t);});
}

// Override ChipSim getNodeValue() function to allow an estimate of capacitance
// (node area) to be used when joining floating segments. We also need to resolve
// weak driving transistors when a group is connected to both, gnd and vdd.
function getNodeValue(){
	// 1. Deal with power connections first. If connected to both power rails,
	//    determine which one has the stronger transistor. This is only checked
	//    for the transistor that has the power rail directly connected to its
	//    source, which is the case in SM83 its SR-latches. May not work for
	//    other designs this way.
	var has_gnd = arrayContains(group, ngnd);
	var has_vdd = arrayContains(group, npwr);
	if(has_gnd && has_vdd) {
		var gnd_str = 0.0;
		var vdd_str = 0.0;
		group.forEach(function(i){
			if (i == ngnd || i == npwr) return;
			var n = nodes[i];
			n.c1c2s.forEach(function(t){
				if(t.on && !t.pmos && t.c2 == ngnd)
					gnd_str += (t.c1width + t.c2width) / t.gatewidth;
				if(t.on && t.pmos && t.c2 == npwr)
					vdd_str += (t.c1width + t.c2width) / t.gatewidth / 2; // PMOS are half as strong usually
			});
		});
		return vdd_str >= gnd_str;
	} else if(has_gnd) {
		return false;
	} else if(has_vdd) {
		return true;
	}
	// 2. deal with pullup/pulldowns next
	for(var i in group){
		var nn = group[i];
		var n = nodes[nn];
		if(n.pullup) return true;
		if(n.pulldown) return false;
	}
	// 3. resolve connected set of floating nodes
	// based on state of largest (by area) node
	// (previously this was any node with state true wins)
	var max_state = false;
	var max_area = 0;
	for(var i in group){
		var nn = group[i];
		var n = nodes[nn];
		var area = n.area;
		if (area > max_area) {
			max_area  = area;
			max_state = n.state;
		}
	}
	return max_state;
}

function setupBackground(){
	chipbg = document.getElementById('chipbg');
	chipbg.width = grCanvasSize;
	chipbg.height = grCanvasSize;
	var ctx = chipbg.getContext('2d');
	ctx.fillStyle = '#000000';
	ctx.strokeStyle = 'rgba(255,255,255,0.5)';
	ctx.lineWidth = grLineWidth;
	ctx.fillRect(0,0,grCanvasSize,grCanvasSize);
	for(var i in segdefs){
		var seg = segdefs[i];
		var c = seg[2];
		if (drawlayers[c]) {
			ctx.fillStyle = colors[c];
			drawSeg(ctx, segdefs[i].slice(4));
			ctx.fill();
			if((c==0)||(c==6)) ctx.stroke();
		}
	}
}

// Override ChipSim drawSeg() to deal with holes
function drawSeg(ctx, seg){
	var dx = grChipOffsetX;
	var dy = grChipOffsetY;
	ctx.beginPath();
	var moveTo = true;
	var sx;
	var sy;
	for (var i=0;i<seg.length;i+=2) {
		if (moveTo) {
			sx = seg[i];
			sy = seg[i+1];
			ctx.moveTo(grScale(sx+dx), grScale(grChipSize-sy+dy));
			moveTo = false;
		} else if (seg[i] == sx && seg[i + 1] == sy) {
			ctx.closePath();
			moveTo = true;
		} else {
			ctx.lineTo(grScale(seg[i]+dx), grScale(grChipSize-seg[i+1]+dy));
		}
	}
	if (!moveTo) {
		ctx.closePath();
	}
}

// Override ChipSim hitBufferNode() and findNodeNumber(), because we need more than 12 bits
// for node numbers.
function hitBufferNode(ctx, i, w){
	var low = hexdigit(i&0xf);
	var mid = hexdigit((i>>8)&0xf) + hexdigit((i>>4)&0xf);
	var high = hexdigit((i>>12)&0xf);
	ctx.fillStyle = '#'+high+'F'+mid+low+'F';
	for(i in w) {
		drawSeg(ctx, w[i]);
		ctx.fill();
	}
}

function findNodeNumber(x,y){
	var ctx = hitbuffer.getContext('2d');
	var pixels = ctx.getImageData(x*grCanvasSize/600, y*grCanvasSize/600, 2, 2).data;
	if(pixels[0]==0) return -1;
	var high = pixels[0]>>4;
	var mid = pixels[1];
	var low = pixels[2]>>4;
	return (high<<12)+(mid<<4)+low;
}

function setupTransistors(){
	for(i in transdefs){
		var tdef = transdefs[i];
		var name = tdef[0];
		var pmos = tdef[1]=='+';
		var gate = tdef[2];
		var c1 = tdef[3];
		var c2 = tdef[4];
		var bb = tdef[5];
		var gatewidth = tdef[6];
		var c1width = tdef[7];
		var c2width = tdef[8];
		if(c1==ngnd) {c1=c2;c2=ngnd;}
		if(c1==npwr) {c1=c2;c2=npwr;}
		var trans = {name: name, pmos: pmos, on: false, gate: gate, c1: c1, c2: c2, bb: bb,
		             gatewidth: gatewidth, c1width: c1width, c2width: c2width};
		nodes[gate].gates.push(trans);
		nodes[c1].c1c2s.push(trans);
		nodes[c2].c1c2s.push(trans);
		transistors[name] = trans;
	}
}

function setupNodes(){
	for(var i in segdefs){
		var seg = segdefs[i];
		var w = seg[0];
		if(nodes[w]==undefined)
			nodes[w] = {segs: new Array(), num: w, pullup: seg[1]=='+', pulldown: false,
			            state: false, gates: new Array(), c1c2s: new Array(), area: seg[3]};
		if(w==ngnd) continue;
		if(w==npwr) continue;
		nodes[w].segs.push(seg.slice(4));
	}
}

function stepBack(){
	if(cycle==0) return;
	showState(trace[--cycle].chip);
	setMem(trace[cycle].mem);
	tclk_state--;
	tclk_state &= 7;
	chipStatus();
}

// simulate a single clock phase with no update to graphics or trace
function halfStep(){
	eval(clockTriggers[cycle]);
	advanceClkState();
	handleBusRead();
	handleBusWrite();
}

function goUntilSyncOrWrite(){
	halfStep();
	cycle++;
	while((isNodeHigh(nodenames['halt_n']) && isNodeHigh(nodenames['stop_n'])) &&
	      ((tclk_state != 7) || (!isNodeHigh(nodenames['m1']) && !isNodeHigh(nodenames['wr'])))) {
		halfStep();
		cycle++;
	}
	chipStatus();
}

var clk_pattern = [
	//          W
	//    E  D  R  P
	// C  X  A  I  C
	// L  E  T  T  H
	// K  C  A  E  #
	[  1, 0, 0, 0, 1  ], // T1+
	[  0, 1, 0, 0, 0  ], // T1-
	[  0, 1, 0, 0, 0  ], // T2+
	[  0, 1, 0, 0, 0  ], // T2-
	[  0, 1, 1, 0, 0  ], // T3+
	[  0, 1, 1, 0, 0  ], // T3-
	[  0, 1, 1, 1, 1  ], // T4+
	[  0, 1, 1, 1, 1  ]  // T4-
];

function applyClkState(){
	if(ctrace) console.log('apply clocks');
	var pat = clk_pattern[tclk_state];
	var halt = false;
	var halt_after = !isNodeHigh(nodenames['halt_n']);
	do {
		halt = halt_after;
		suspendRecalc();
		if(pat[4] && !halt)
			setHigh('pch_phase_n');
		else
			setLow('pch_phase_n');
		if(pat[3] && !halt) {
			setHigh('write_phase');
			setLow('write_phase_n');
		} else {
			setLow('write_phase');
			setHigh('write_phase_n');
		}
		if(pat[2] && !halt) {
			setHigh('data_phase');
			setLow('data_phase_n');
		} else {
			setLow('data_phase');
			setHigh('data_phase_n');
		}
		if(pat[0]) {
			setHigh('clk');
			setLow('clk_n');
		} else {
			setLow('clk');
			setHigh('clk_n');
		}
		if(pat[1] && !halt) {
			setHigh('exec_phase');
			setLow('exec_phase_n');
		} else {
			setLow('exec_phase');
			setHigh('exec_phase_n');
		}
		resumeRecalc();
		halt_after = !isNodeHigh(nodenames['halt_n']);
	} while(halt != halt_after); // If halt_n changes due to clock changes, then re-evaluate the clock states.
}

function advanceClkState(){
	tclk_state++;
	tclk_state &= 7;
	applyClkState();
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
	tclk_state = 0;
	suspendRecalcCount = 1;
	setLow('test_freeze');
	setHigh('pwron_reset');
	setLow('sys_reset');
	setLow('pch_phase_n');
	setLow('write_phase');
	setHigh('write_phase_n');
	setLow('data_phase');
	setHigh('data_phase_n');
	setLow('clk');
	setHigh('clk_n');
	setLow('exec_phase');
	setHigh('exec_phase_n');
	setLow('int0');
	setLow('int1');
	setLow('int2');
	setLow('int3');
	setLow('int4');
	setLow('int5');
	setLow('int6');
	setLow('int7');
	setLow('nmi');
	setLow('wake');
	setLow('clk_ready');
	setLow('internal_access');
	setLow('shadow_access');
	setLow('shadow_override');
	setLow('oe_n');
	suspendRecalcCount = 0;
	recalcNodeList(allNodes());
	for(var i=0;i<8;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	setHigh('sys_reset');
	for(var i=0;i<16;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	setLow('pwron_reset');
	for(var i=0;i<16;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	setHigh('clk_ready');
	for(var i=0;i<8;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	setLow('sys_reset');
	for(var i=0;i<8;i++){halfStep();} // avoid updating graphics and trace buffer before user code
	setLow('clk_ready');
	// At this point the CPU will let go of halt_n and we are good to go.
	refresh();
	cycle = 0;
	trace = Array();
	if(typeof expertMode != "undefined")
		updateLogList();
	chipStatus();
	if(ctrace)console.log('initChip done after', now()-start);
}

var prefix_cb    = false;
var opcode       = 0x00;
var state        = 0;
var last_rd_done = 1;

function handleBusRead(){
	if(isNodeHigh(nodenames['rd'])) {
		// Memory read
		var a = readAddressBus();
		var d = eval(readTriggers[a]);
		if(d == undefined)
			d = mRead(readAddressBus());
		if(isNodeHigh(nodenames['m1'])) {
			eval(fetchTriggers[d]);
		}
		writeDataBus(d);
	} else {
		// In all other cases, make sure the data bus is not pulled up/down externally.
		releaseDataBus();
	}

	// Only advance the state machine on the rising edge of read
	if (last_rd_done && isNodeHigh(nodenames['rd'])) {
		switch (state) {
		case 0:
			// In state 0 we are ready to start a new instruction
			if(isNodeHigh(nodenames['m1'])) {
				prefix_cb = false;
				opcode = d;
				switch (d) {
				case 0xcb:
					state = 1;
					break;
				}
			} else {
				// This case covers other reads in the instruction
				prefix_cb = false;
				opcode = -1;   // If opcode < 0, then no fetch will be displayed
			}
			break;
		case 1:
			// In state 1 we have just seen the CB prefix and expect the opcode
			prefix_cb = true;
			opcode = d;
			state  = 0;
			break;
		default:
			// This should never be needed
			prefix = 0;
			opcode = -1;
			state  = 0;
			break;
		}
	}
	last_rd_done = (!isNodeHigh(nodenames['rd']));
}

function handleBusWrite(){
	if(isNodeHigh(nodenames['wr'])){
		var a = readAddressBus();
		var d = readDataBus();
		eval(writeTriggers[a]);
		mWrite(a,d);
		if(a<0x200) setCellValue(a,d);
	}
}

function writeDataBus(x){
	var recalcs = Array();
	for(var i=0;i<8;i++){
		var nn = nodenames['d'+i];
		var n = nodes[nn];
		var ppd = n.pulldown;
		var ppu = n.pullup;
		if((x%2)==0) {n.pulldown=true; n.pullup=false;}
		else {n.pulldown=false; n.pullup=true;}
		if(ppd != n.pulldown || ppu != n.pullup)
			recalcs.push(nn);
		x>>=1;
	}
	recalcNodeList(recalcs);
}

function releaseDataBus(){
	var recalcs = Array();
	for(var i=0;i<8;i++){
		var nn = nodenames['d'+i];
		var n = nodes[nn];
		if(n.pulldown || n.pullup)
			recalcs.push(nn);
		n.pulldown=false; n.pullup=false;
	}
	recalcNodeList(recalcs);
}

function readAddressBus(){return readBits('a',    16);}
function readDataBus()   {return readBits('d',     8);}
function readA()         {return readBits('reg_a', 8);}
function readB()         {return readBits('reg_b', 8);}
function readC()         {return readBits('reg_c', 8);}
function readD()         {return readBits('reg_d', 8);}
function readE()         {return readBits('reg_e', 8);}
function readH()         {return readBits('reg_h', 8);}
function readL()         {return readBits('reg_l', 8);}
function readW()         {return readBits('reg_w', 8);}
function readZ()         {return readBits('reg_z', 8);}

function readF() {
	return readBit('flag_c')      |
	       (readBit('flag_h')<<1) |
	       (readBit('flag_n')<<2) |
	       (readBit('flag_z')<<3);
}

function readSP() {return (readBits('reg_sph', 8)<<8) + readBits('reg_spl', 8);}
function readPC() {return (readBits('reg_pch', 8)<<8) + readBits('reg_pcl', 8);}
function readPCL(){return readBits('reg_pcl', 8);}
function readPCH(){return readBits('reg_pch', 8);}

function formatFstring(f){
	return ((f & 8)?'Z':'z') +
	       ((f & 4)?'N':'n') +
	       ((f & 2)?'H':'h') +
	       ((f & 1)?'C':'c');
}

function busToString(busname){
	// takes a signal name or prefix
	// returns an appropriate string representation
	// some 'signal names' are CPU-specific aliases to user-friendly string output
	if(busname=='cycle')
		return (cycle>>1)+' '+tclkToStr(tclk_state);
	if(busname=='adr')
		return busToHex('a');
	if(busname=='data')
		return busToHex('d');
	if(busname=='acc')
		return hexByte(readA());
	if(busname=='f' || busname=='flags')
		return formatFstring(readF());
	if(busname=='bc')
		return hexByte(readB()) + hexByte(readC());
	if(busname=='de')
		return hexByte(readD()) + hexByte(readE());
	if(busname=='hl')
		return hexByte(readH()) + hexByte(readL());
	if(busname=='wz')
		return busToHex('reg_w') + busToHex('reg_z');
	if(busname=='pc')
		return busToHex('reg_pch') + busToHex('reg_pcl');
	if(busname=='sp')
		return busToHex('reg_sph') + busToHex('reg_spl');
	if(busname=='ime')
		return isNodeHigh(nodenames['ime_n'])?'0':'1';
	if(busname=='ie')
		return busToHex('reg_ie');
	if(busname=='int_vector'){
		var v = (isNodeHigh(nodenames['int_vector3'])?0x08:0) +
		        (isNodeHigh(nodenames['int_vector4'])?0x10:0) +
		        (isNodeHigh(nodenames['int_vector5'])?0x20:0) +
		        (isNodeHigh(nodenames['int_vector6'])?0x40:0) +
		        (isNodeHigh(nodenames['int_vector7'])?0x80:0);
		return hexByte(v);
	}
	if(busname=='State')
		return 'M'+readBits('mcyc',3);
	if(busname=='Execute')
		return disassemblytoHTML(readBit('table_cb'),readBits('opcode',8));
	if(busname=='Fetch')
		return (isNodeHigh(nodenames['rd']) && (opcode >= 0))?disassemblytoHTML(prefix_cb?1:0,opcode):"";
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

function tclkToStr(c){
	return 'T'+((c>>1)+1)+((c&1)?'&perp;':'&top;');
}

function chipStatus(){
	var ab = readAddressBus();
	var machine1 =
		' halfcyc:' + cycle +
		' tclk:' + tclkToStr(tclk_state) +
		' ADR:' + hexWord(ab) +
		' D:' + hexByte(readDataBus()) +
		' M1:' + readBit('m1') +
		' RD:' + readBit('rd') +
		' WR:' + readBit('wr');
	var machine2 =
		' PC:' + hexWord(readPC()) +
		' ACC:' + hexByte(readA()) +
		' F:'  + formatFstring(readF()) +
		' BC:' + hexByte(readB()) + hexByte(readC()) +
		' DE:' + hexByte(readD()) + hexByte(readE()) +
		' HL:' + hexByte(readH()) + hexByte(readL()) +
		' SP:' + hexWord(readSP()) +
		' WZ:' + hexByte(readW()) + hexByte(readZ());
	var machine3 =
		'State: ' + busToString('State') +
		' Hz: ' + estimatedHz().toFixed(1);
	if(typeof expertMode != "undefined") {
		machine3 += ' Exec: ' + busToString('Execute');
		if(isNodeHigh(nodenames['m1']) && isNodeHigh(nodenames['rd']))
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

// sanitised opcode for HTML output
function disassemblytoHTML(prefix_cb, opcode){

	var disassembly;
	switch (prefix_cb) {
	case 1:  disassembly = disassembly_cb; break;
	default: disassembly = disassembly_00; break;
	}

	var opstr=disassembly[opcode];
	if(typeof opstr == "undefined")
		return "unknown"
	return opstr.replace(/ /,'&nbsp;');
}

function setupParams(){
	if(location.search=="")
		return;
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
		// load a test program: Address and Data
		if(name=="a" && parseInt(value,16)!=NaN){
			userAddress=parseInt(value,16);
		} else if(name=="d" && value.match(/[0-9a-fA-F]*/)[0].length==value.length){
			for(var j=0;j<value.length;j+=2)
				userCode[userAddress++]=parseInt(value.slice(j,j+2),16);
		} else
		// setup input pin events, breakpoints, watchpoints
		if(name=="int00" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int0');"].join("");
		} else if(name=="int01" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int0');"].join("");
		} else if(name=="int10" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int1');"].join("");
		} else if(name=="int11" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int1');"].join("");
		} else if(name=="int20" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int2');"].join("");
		} else if(name=="int21" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int2');"].join("");
		} else if(name=="int30" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int3');"].join("");
		} else if(name=="int31" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int3');"].join("");
		} else if(name=="int40" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int4');"].join("");
		} else if(name=="int41" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int4');"].join("");
		} else if(name=="int50" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int5');"].join("");
		} else if(name=="int51" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int5');"].join("");
		} else if(name=="int60" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int6');"].join("");
		} else if(name=="int61" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int6');"].join("");
		} else if(name=="int70" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('int7');"].join("");
		} else if(name=="int71" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('int7');"].join("");
		} else if(name=="nmi0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('nmi');"].join("");
		} else if(name=="nmi1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('nmi');"].join("");
		} else if(name=="wake0" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setLow('wake');"].join("");
		} else if(name=="wake1" && parseInt(value)!=NaN){
			clockTriggers[value]=[clockTriggers[value],"setHigh('wake');"].join("");
		//
		} else if(name=="time" && parseInt(value)!=NaN){
			eventTime=value;
		} else if(name=="databus" && value==""){
			clockTriggers[eventTime]=[clockTriggers[eventTime],"releaseDataBus();"].join("");
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

var disassembly_00={

	0x00: "NOP",
	0x01: "LD BC, nn",
	0x02: "LD (BC), A",
	0x03: "INC BC",
	0x04: "INC B",
	0x05: "DEC B",
	0x06: "LD B, n",
	0x07: "RLCA",
	0x08: "LD (nn), SP",
	0x09: "ADD HL, BC",
	0x0A: "LD A, (BC)",
	0x0B: "DEC BC",
	0x0C: "INC C",
	0x0D: "DEC C",
	0x0E: "LD C, n",
	0x0F: "RRCA",

	0x10: "STOP",
	0x11: "LD DE, nn",
	0x12: "LD (DE), A",
	0x13: "INC DE",
	0x14: "INC D",
	0x15: "DEC D",
	0x16: "LD D, n",
	0x17: "RLA",
	0x18: "JR e",
	0x19: "ADD HL, DE",
	0x1A: "LD A, (DE)",
	0x1B: "DEC DE",
	0x1C: "INC E",
	0x1D: "DEC E",
	0x1E: "LD E, n",
	0x1F: "RRA",

	0x20: "JR NZ, e",
	0x21: "LD HL, nn",
	0x22: "LD (HLI), A",
	0x23: "INC HL",
	0x24: "INC H",
	0x25: "DEC H",
	0x26: "LD H, n",
	0x27: "DAA",
	0x28: "JR Z, e",
	0x29: "ADD HL, HL",
	0x2A: "LD A, (HLI)",
	0x2B: "DEC HL",
	0x2C: "INC L",
	0x2D: "DEC L",
	0x2E: "LD L, n",
	0x2F: "CPL",

	0x30: "JR NC, e",
	0x31: "LD SP, nn",
	0x32: "LD (HLD), A",
	0x33: "INC SP",
	0x34: "INC (HL)",
	0x35: "DEC (HL)",
	0x36: "LD (HL), n",
	0x37: "SCF",
	0x38: "JR C, e",
	0x39: "ADD HL, SP",
	0x3A: "LD A, (HLD)",
	0x3B: "DEC SP",
	0x3C: "INC A",
	0x3D: "DEC A",
	0x3E: "LD A, n",
	0x3F: "CCF",

	0x40: "LD B, B",
	0x41: "LD B, C",
	0x42: "LD B, D",
	0x43: "LD B, E",
	0x44: "LD B, H",
	0x45: "LD B, L",
	0x46: "LD B, (HL)",
	0x47: "LD B, A",
	0x48: "LD C, B",
	0x49: "LD C, C",
	0x4A: "LD C, D",
	0x4B: "LD C, E",
	0x4C: "LD C, H",
	0x4D: "LD C, L",
	0x4E: "LD C, (HL)",
	0x4F: "LD C, A",

	0x50: "LD D, B",
	0x51: "LD D, C",
	0x52: "LD D, D",
	0x53: "LD D, E",
	0x54: "LD D, H",
	0x55: "LD D, L",
	0x56: "LD D, (HL)",
	0x57: "LD D, A",
	0x58: "LD E, B",
	0x59: "LD E, C",
	0x5A: "LD E, D",
	0x5B: "LD E, E",
	0x5C: "LD E, H",
	0x5D: "LD E, L",
	0x5E: "LD E, (HL)",
	0x5F: "LD E, A",

	0x60: "LD H, B",
	0x61: "LD H, C",
	0x62: "LD H, D",
	0x63: "LD H, E",
	0x64: "LD H, H",
	0x65: "LD H, L",
	0x66: "LD H, (HL)",
	0x67: "LD H, A",
	0x68: "LD L, B",
	0x69: "LD L, C",
	0x6A: "LD L, D",
	0x6B: "LD L, E",
	0x6C: "LD L, H",
	0x6D: "LD L, L",
	0x6E: "LD L, (HL)",
	0x6F: "LD L, A",

	0x70: "LD (HL), B",
	0x71: "LD (HL), C",
	0x72: "LD (HL), D",
	0x73: "LD (HL), E",
	0x74: "LD (HL), H",
	0x75: "LD (HL), L",
	0x76: "HALT",
	0x77: "LD (HL), A",
	0x78: "LD A, B",
	0x79: "LD A, C",
	0x7A: "LD A, D",
	0x7B: "LD A, E",
	0x7C: "LD A, H",
	0x7D: "LD A, L",
	0x7E: "LD A, (HL)",
	0x7F: "LD A, A",

	0x80: "ADD A, B",
	0x81: "ADD A, C",
	0x82: "ADD A, D",
	0x83: "ADD A, E",
	0x84: "ADD A, H",
	0x85: "ADD A, L",
	0x86: "ADD A, (HL)",
	0x87: "ADD A, A",
	0x88: "ADC A, B",
	0x89: "ADC A, C",
	0x8A: "ADC A, D",
	0x8B: "ADC A, E",
	0x8C: "ADC A, H",
	0x8D: "ADC A, L",
	0x8E: "ADC A, (HL)",
	0x8F: "ADC A, A",

	0x90: "SUB B",
	0x91: "SUB C",
	0x92: "SUB D",
	0x93: "SUB E",
	0x94: "SUB H",
	0x95: "SUB L",
	0x96: "SUB (HL)",
	0x97: "SUB A",
	0x98: "SBC A, B",
	0x99: "SBC A, C",
	0x9A: "SBC A, D",
	0x9B: "SBC A, E",
	0x9C: "SBC A, H",
	0x9D: "SBC A, L",
	0x9E: "SBC A, (HL)",
	0x9F: "SBC A, A",

	0xA0: "AND B",
	0xA1: "AND C",
	0xA2: "AND D",
	0xA3: "AND E",
	0xA4: "AND H",
	0xA5: "AND L",
	0xA6: "AND (HL)",
	0xA7: "AND A",
	0xA8: "XOR B",
	0xA9: "XOR C",
	0xAA: "XOR D",
	0xAB: "XOR E",
	0xAC: "XOR H",
	0xAD: "XOR L",
	0xAE: "XOR (HL)",
	0xAF: "XOR A",

	0xB0: "OR B",
	0xB1: "OR C",
	0xB2: "OR D",
	0xB3: "OR E",
	0xB4: "OR H",
	0xB5: "OR L",
	0xB6: "OR (HL)",
	0xB7: "OR A",
	0xB8: "CP B",
	0xB9: "CP C",
	0xBA: "CP D",
	0xBB: "CP E",
	0xBC: "CP H",
	0xBD: "CP L",
	0xBE: "CP (HL)",
	0xBF: "CP A",

	0xC0: "RET NZ",
	0xC1: "POP BC",
	0xC2: "JP NZ, nn",
	0xC3: "JP nn",
	0xC4: "CALL NZ, nn",
	0xC5: "PUSH BC",
	0xC6: "ADD A, n",
	0xC7: "RST 00H",
	0xC8: "RET Z",
	0xC9: "RET",
	0xCA: "JP Z, nn",
	0xCB: "PREFIX CB",
	0xCC: "CALL Z, nn",
	0xCD: "CALL nn",
	0xCE: "ADC A, n",
	0xCF: "RST 08H",

	0xD0: "RET NC",
	0xD1: "POP DE",
	0xD2: "JP NC, nn",
	0xD3: "invalid $D3",
	0xD4: "CALL NC, nn",
	0xD5: "PUSH DE",
	0xD6: "SUB n",
	0xD7: "RST 10H",
	0xD8: "RET C",
	0xD9: "RETI",
	0xDA: "JP C, nn",
	0xDB: "invalid $DB",
	0xDC: "CALL C, nn",
	0xDD: "invalid $DD",
	0xDE: "SBC A, n",
	0xDF: "RST 18H",

	0xE0: "LD (n), A",
	0xE1: "POP HL",
	0xE2: "LD (C), A",
	0xE3: "invalid $E3",
	0xE4: "invalid $E4",
	0xE5: "PUSH HL",
	0xE6: "AND n",
	0xE7: "RST 20H",
	0xE8: "ADD SP, e",
	0xE9: "JP (HL)",
	0xEA: "LDX (nn), A",
	0xEB: "invalid $EB",
	0xEC: "invalid $EC",
	0xED: "invalid $ED",
	0xEE: "XOR n",
	0xEF: "RST 28H",

	0xF0: "LD A, (n)",
	0xF1: "POP AF",
	0xF2: "LD A, (C)",
	0xF3: "DI",
	0xF4: "invalid $F4",
	0xF5: "PUSH AF",
	0xF6: "OR n",
	0xF7: "RST 30H",
	0xF8: "LDHL SP, e",
	0xF9: "LD SP, HL",
	0xFA: "LDX A, (nn)",
	0xFB: "EI",
	0xFC: "invalid $FC",
	0xFD: "invalid $FD",
	0xFE: "CP n",
	0xFF: "RST 38H"
};

var disassembly_cb={

	0x00: "RLC B",
	0x01: "RLC C",
	0x02: "RLC D",
	0x03: "RLC E",
	0x04: "RLC H",
	0x05: "RLC L",
	0x06: "RLC (HL)",
	0x07: "RLC A",
	0x08: "RRC B",
	0x09: "RRC C",
	0x0A: "RRC D",
	0x0B: "RRC E",
	0x0C: "RRC H",
	0x0D: "RRC L",
	0x0E: "RRC (HL)",
	0x0F: "RRC A",

	0x10: "RL B",
	0x11: "RL C",
	0x12: "RL D",
	0x13: "RL E",
	0x14: "RL H",
	0x15: "RL L",
	0x16: "RL (HL)",
	0x17: "RL A",
	0x18: "RR B",
	0x19: "RR C",
	0x1A: "RR D",
	0x1B: "RR E",
	0x1C: "RR H",
	0x1D: "RR L",
	0x1E: "RR (HL)",
	0x1F: "RR A",

	0x20: "SLA B",
	0x21: "SLA C",
	0x22: "SLA D",
	0x23: "SLA E",
	0x24: "SLA H",
	0x25: "SLA L",
	0x26: "SLA (HL)",
	0x27: "SLA A",
	0x28: "SRA B",
	0x29: "SRA C",
	0x2A: "SRA D",
	0x2B: "SRA E",
	0x2C: "SRA H",
	0x2D: "SRA L",
	0x2E: "SRA (HL)",
	0x2F: "SRA A",

	0x30: "SWAP B",
	0x31: "SWAP C",
	0x32: "SWAP D",
	0x33: "SWAP E",
	0x34: "SWAP H",
	0x35: "SWAP L",
	0x36: "SWAP (HL)",
	0x37: "SWAP A",
	0x38: "SRL B",
	0x39: "SRL C",
	0x3A: "SRL D",
	0x3B: "SRL E",
	0x3C: "SRL H",
	0x3D: "SRL L",
	0x3E: "SRL (HL)",
	0x3F: "SRL A",

	0x40: "BIT 0, B",
	0x41: "BIT 0, C",
	0x42: "BIT 0, D",
	0x43: "BIT 0, E",
	0x44: "BIT 0, H",
	0x45: "BIT 0, L",
	0x46: "BIT 0, (HL)",
	0x47: "BIT 0, A",
	0x48: "BIT 1, B",
	0x49: "BIT 1, C",
	0x4A: "BIT 1, D",
	0x4B: "BIT 1, E",
	0x4C: "BIT 1, H",
	0x4D: "BIT 1, L",
	0x4E: "BIT 1, (HL)",
	0x4F: "BIT 1, A",

	0x50: "BIT 2, B",
	0x51: "BIT 2, C",
	0x52: "BIT 2, D",
	0x53: "BIT 2, E",
	0x54: "BIT 2, H",
	0x55: "BIT 2, L",
	0x56: "BIT 2, (HL)",
	0x57: "BIT 2, A",
	0x58: "BIT 3, B",
	0x59: "BIT 3, C",
	0x5A: "BIT 3, D",
	0x5B: "BIT 3, E",
	0x5C: "BIT 3, H",
	0x5D: "BIT 3, L",
	0x5E: "BIT 3, (HL)",
	0x5F: "BIT 3, A",

	0x60: "BIT 4, B",
	0x61: "BIT 4, C",
	0x62: "BIT 4, D",
	0x63: "BIT 4, E",
	0x64: "BIT 4, H",
	0x65: "BIT 4, L",
	0x66: "BIT 4, (HL)",
	0x67: "BIT 4, A",
	0x68: "BIT 5, B",
	0x69: "BIT 5, C",
	0x6A: "BIT 5, D",
	0x6B: "BIT 5, E",
	0x6C: "BIT 5, H",
	0x6D: "BIT 5, L",
	0x6E: "BIT 5, (HL)",
	0x6F: "BIT 5, A",

	0x70: "BIT 6, B",
	0x71: "BIT 6, C",
	0x72: "BIT 6, D",
	0x73: "BIT 6, E",
	0x74: "BIT 6, H",
	0x75: "BIT 6, L",
	0x76: "BIT 6, (HL)",
	0x77: "BIT 6, A",
	0x78: "BIT 7, B",
	0x79: "BIT 7, C",
	0x7A: "BIT 7, D",
	0x7B: "BIT 7, E",
	0x7C: "BIT 7, H",
	0x7D: "BIT 7, L",
	0x7E: "BIT 7, (HL)",
	0x7F: "BIT 7, A",

	0x80: "RES 0, B",
	0x81: "RES 0, C",
	0x82: "RES 0, D",
	0x83: "RES 0, E",
	0x84: "RES 0, H",
	0x85: "RES 0, L",
	0x86: "RES 0, (HL)",
	0x87: "RES 0, A",
	0x88: "RES 1, B",
	0x89: "RES 1, C",
	0x8A: "RES 1, D",
	0x8B: "RES 1, E",
	0x8C: "RES 1, H",
	0x8D: "RES 1, L",
	0x8E: "RES 1, (HL)",
	0x8F: "RES 1, A",

	0x90: "RES 2, B",
	0x91: "RES 2, C",
	0x92: "RES 2, D",
	0x93: "RES 2, E",
	0x94: "RES 2, H",
	0x95: "RES 2, L",
	0x96: "RES 2, (HL)",
	0x97: "RES 2, A",
	0x98: "RES 3, B",
	0x99: "RES 3, C",
	0x9A: "RES 3, D",
	0x9B: "RES 3, E",
	0x9C: "RES 3, H",
	0x9D: "RES 3, L",
	0x9E: "RES 3, (HL)",
	0x9F: "RES 3, A",

	0xA0: "RES 4, B",
	0xA1: "RES 4, C",
	0xA2: "RES 4, D",
	0xA3: "RES 4, E",
	0xA4: "RES 4, H",
	0xA5: "RES 4, L",
	0xA6: "RES 4, (HL)",
	0xA7: "RES 4, A",
	0xA8: "RES 5, B",
	0xA9: "RES 5, C",
	0xAA: "RES 5, D",
	0xAB: "RES 5, E",
	0xAC: "RES 5, H",
	0xAD: "RES 5, L",
	0xAE: "RES 5, (HL)",
	0xAF: "RES 5, A",

	0xB0: "RES 6, B",
	0xB1: "RES 6, C",
	0xB2: "RES 6, D",
	0xB3: "RES 6, E",
	0xB4: "RES 6, H",
	0xB5: "RES 6, L",
	0xB6: "RES 6, (HL)",
	0xB7: "RES 6, A",
	0xB8: "RES 7, B",
	0xB9: "RES 7, C",
	0xBA: "RES 7, D",
	0xBB: "RES 7, E",
	0xBC: "RES 7, H",
	0xBD: "RES 7, L",
	0xBE: "RES 7, (HL)",
	0xBF: "RES 7, A",

	0xC0: "SET 0, B",
	0xC1: "SET 0, C",
	0xC2: "SET 0, D",
	0xC3: "SET 0, E",
	0xC4: "SET 0, H",
	0xC5: "SET 0, L",
	0xC6: "SET 0, (HL)",
	0xC7: "SET 0, A",
	0xC8: "SET 1, B",
	0xC9: "SET 1, C",
	0xCA: "SET 1, D",
	0xCB: "SET 1, E",
	0xCC: "SET 1, H",
	0xCD: "SET 1, L",
	0xCE: "SET 1, (HL)",
	0xCF: "SET 1, A",

	0xD0: "SET 2, B",
	0xD1: "SET 2, C",
	0xD2: "SET 2, D",
	0xD3: "SET 2, E",
	0xD4: "SET 2, H",
	0xD5: "SET 2, L",
	0xD6: "SET 2, (HL)",
	0xD7: "SET 2, A",
	0xD8: "SET 3, B",
	0xD9: "SET 3, C",
	0xDA: "SET 3, D",
	0xDB: "SET 3, E",
	0xDC: "SET 3, H",
	0xDD: "SET 3, L",
	0xDE: "SET 3, (HL)",
	0xDF: "SET 3, A",

	0xE0: "SET 4, B",
	0xE1: "SET 4, C",
	0xE2: "SET 4, D",
	0xE3: "SET 4, E",
	0xE4: "SET 4, H",
	0xE5: "SET 4, L",
	0xE6: "SET 4, (HL)",
	0xE7: "SET 4, A",
	0xE8: "SET 5, B",
	0xE9: "SET 5, C",
	0xEA: "SET 5, D",
	0xEB: "SET 5, E",
	0xEC: "SET 5, H",
	0xED: "SET 5, L",
	0xEE: "SET 5, (HL)",
	0xEF: "SET 5, A",

	0xF0: "SET 6, B",
	0xF1: "SET 6, C",
	0xF2: "SET 6, D",
	0xF3: "SET 6, E",
	0xF4: "SET 6, H",
	0xF5: "SET 6, L",
	0xF6: "SET 6, (HL)",
	0xF7: "SET 6, A",
	0xF8: "SET 7, B",
	0xF9: "SET 7, C",
	0xFA: "SET 7, D",
	0xFB: "SET 7, E",
	0xFC: "SET 7, H",
	0xFD: "SET 7, L",
	0xFE: "SET 7, (HL)",
	0xFF: "SET 7, A"
};

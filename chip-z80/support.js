// chip-specific support functions
//
// may override function definitions made previously

chipname='z80';

grChipSize=5000;
grChipOffsetX=150;
grChipOffsetY=0;
grCanvasSize=5000;
grMaxZoom=24;

ngnd = nodenames['vss'];
npwr = nodenames['vcc'];

nodenamereset = '_reset';

presetLogLists=[
    ['cycle',],
    ['ab', 'db', '_m1', '_rd', '_wr', '_mreq', '_iorq', 'State', 'pc', 'Fetch'],
    ['a', 'f', 'bc', 'de', 'hl', 'ix', 'iy', 'sp'],
    ['wz', 'ir'],
    ['alubus', '-alua', '-alub', 'aluout', 'alulat'],
    ['d_u', 'r_u', '-ubus', 'r_v', 'u_v', '-vbus', 'regbit', 'r_p', 'pcbit', 'rl_wr', 'rh_wr', 'r_x1'],
    ['dp_dl', 'dl_dp', '-dlatch', 'dl_d', 'd_dl', '-dbus', 'instr', 'load_ir'],
    ['a2', 'f2', 'bc2', 'de2', 'hl2'],
    ['_int','_nmi', nodenamereset],
];

// Override ChipSim getNodeValue() function to allow an estimate of capacitance
// (number of connections) to be used when joining floating segments.

function getNodeValue(){
    // 1. deal with power connections first
    if(arrayContains(group, ngnd)) return false;
    if(arrayContains(group, npwr)) return true;
    // 2. deal with pullup/pulldowns next
    for(var i in group){
        var nn = group[i];
        var n = nodes[nn];
        if(n.pullup) return true;
        if(n.pulldown) return false;
    }
    // 3. resolve connected set of floating nodes
    // based on state of largest (by #connections) node
    // (previously this was any node with state true wins)
    var max_state = false;
    var max_connections = 0;
    for(var i in group){
        var nn = group[i];
        var n = nodes[nn];
        var connections = n.gates.length + n.c1c2s.length;
        if (connections > max_connections) {
            max_connections = connections;
            max_state = n.state;
        }
    }
    return max_state;
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

function stepBack(){
   if(cycle==0) return;
   showState(trace[--cycle].chip);
   setMem(trace[cycle].mem);
   var clk = isNodeHigh(nodenames['clk']);
   if(!clk) writeDataBus(mRead(readAddressBus()));
   chipStatus();
}

// simulate a single clock phase with no update to graphics or trace
function halfStep(){
    var clk = isNodeHigh(nodenames['clk']);
    eval(clockTriggers[cycle]);
    if (clk) {setLow('clk'); }
    else {setHigh('clk'); }
    // DMB: It's almost certainly wrong to execute these on both clock edges
    handleBusRead();
    handleBusWrite();
}

function goUntilSyncOrWrite(){
    halfStep();
    cycle++;
    while(
        !isNodeHigh(nodenames['clk']) ||
            ( isNodeHigh(nodenames['_m1']) && isNodeHigh(nodenames['_wr']) )
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
    setHigh('clk');
    setHigh('_busrq');
    setHigh('_int');
    setHigh('_nmi');
    setHigh('_wait');
    recalcNodeList(allNodes());
    // DMB: Not sure why the 6800 sim did something like this
    //for(var i=0;i<8;i++){
    //   setHigh('clk');
    //   setLow('clk');
    //}
    for(var i=0;i<31;i++){halfStep();} // avoid updating graphics and trace buffer before user code
    setHigh(nodenamereset);
    refresh();
    cycle = 0;
    trace = Array();
    if(typeof expertMode != "undefined")
        updateLogList();
    chipStatus();
    if(ctrace)console.log('initChip done after', now()-start);
}

var prefix       = 0x00;
var opcode       = 0x00;
var state        = 0;
var last_rd_done = 1;

function handleBusRead(){
    if(!isNodeHigh(nodenames['_rd']) && !isNodeHigh(nodenames['_mreq'])) {
        // Memory read
        var a = readAddressBus();
        var d = eval(readTriggers[a]);
        if(d == undefined)
            d = mRead(readAddressBus());
        if(!isNodeHigh(nodenames['_m1'])) {
            eval(fetchTriggers[d]);
        }
        writeDataBus(d);
    } else if(!isNodeHigh(nodenames['_m1']) && !isNodeHigh(nodenames['_iorq'])) {
        // Interrupt acknownledge cycle, force 0xFF onto the bus
        // In IM0 this is seen as JP (HL)
        // In IM1 this is ignored
        // In IM2 this is used as the low byte of the vector
        // TODO: ideally this "vector" would be a configurable parameter
        writeDataBus(0xe9);
    } else {
        // In all other cases we set the data bus to FF
        // as a crude indicateion that it's not being driven
        writeDataBus(0xff);
    }

    // Prefix / displacement / opcode state machine, deals with:
    //   CB <op>
    //   ED <op>
    //   [DD|FD]+ <op>
    //   [DD|FD]+ CB <displacement> <op>

    // Only advance the state machine on the falling edge of read
    if (last_rd_done && !isNodeHigh(nodenames['_rd']) && !isNodeHigh(nodenames['_mreq'])) {
        switch (state) {
        case 0:
            // In state 0 we are ready to start a new instruction
            if(!isNodeHigh(nodenames['_m1'])) {
                prefix = 0;
                opcode = d;
                switch (d) {
                case 0xcb: case 0xed:
                    state = 1;
                    break;
                case 0xdd: case 0xfd:
                    state = 2;
                    break;
                }
            } else {
                // This case covers other reads in the instruction
                prefix = 0;
                opcode = -1;   // If opcode < 0, then no fetch will be displayed
            }
            break;
        case 1:
            // In state 1 we have just seen the CB/ED prefix and expect the opcode
            prefix = opcode; // The prefix(s) just seen
            opcode = d;
            state  = 0;
            break;
        case 2:
            // In state 2 we have just seen the DD/FD prefix
            prefix = opcode; // the prefix just seen
            opcode = d;
            switch (d) {
            case 0xdd: case 0xfd:
                state = 2;   // remain in state 1
                break;
            case 0xcb:
                state = 3;
                break;
            default:
                state = 0;
                break;
            }
            break;
        case 3:
            // In state 3 we expect the displacement byte
            prefix = (prefix << 8) | opcode; // The prefix(s) just seen
            opcode = 0x100; // Trick the disassembler into marking fetch as DISP
            state  = 4;
            break;
        case 4:
            // In state 4 we expect the opcode
            opcode = d;
            state  = 0;
            break;
        default:
            // This should never be needd
            prefix = 0;
            opcode = -1;
            state  = 0;
            break;
        }
    }
    last_rd_done = (isNodeHigh(nodenames['_rd']) || isNodeHigh(nodenames['_mreq']));
}

function handleBusWrite(){
    if(!isNodeHigh(nodenames['_wr'])){
        var a = readAddressBus();
        var d = readDataBus();
        eval(writeTriggers[a]);
        mWrite(a,d);
        if(a<0x200) setCellValue(a,d);
    }
}

function readA() {
    if (!isNodeHigh(nodenames['ex_af'])) {
        return readBits('reg_aa', 8);
    } else {
        return readBits('reg_a', 8);
    }
}

function readF() {
    if (!isNodeHigh(nodenames['ex_af'])) {
        return readBits('reg_ff', 8);
    } else {
        return readBits('reg_f', 8);
    }
}

function readB() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        return readBits('reg_bb', 8);
    } else {
        return readBits('reg_b', 8);
    }
}

function readC() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        return readBits('reg_cc', 8);
    } else {
        return readBits('reg_c', 8);
    }
}

function readD() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_hh', 8);
        } else {
            return readBits('reg_dd', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_h', 8);
        } else {
            return readBits('reg_d', 8);
        }
    }
}

function readE() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_ll', 8);
        } else {
            return readBits('reg_ee', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_l', 8);
        } else {
            return readBits('reg_e', 8);
        }
    }
}

function readH() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_dd', 8);
        } else {
            return readBits('reg_hh', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_d', 8);
        } else {
            return readBits('reg_h', 8);
        }
    }
}

function readL() {
    if (isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_ee', 8);
        } else {
            return readBits('reg_ll', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_e', 8);
        } else {
            return readBits('reg_l', 8);
        }
    }
}

function readA2() {
    if (isNodeHigh(nodenames['ex_af'])) {
        return readBits('reg_aa', 8);
    } else {
        return readBits('reg_a', 8);
    }
}

function readF2() {
    if (isNodeHigh(nodenames['ex_af'])) {
        return readBits('reg_ff', 8);
    } else {
        return readBits('reg_f', 8);
    }
}

function readB2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        return readBits('reg_bb', 8);
    } else {
        return readBits('reg_b', 8);
    }
}

function readC2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        return readBits('reg_cc', 8);
    } else {
        return readBits('reg_c', 8);
    }
}

function readD2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_hh', 8);
        } else {
            return readBits('reg_dd', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_h', 8);
        } else {
            return readBits('reg_d', 8);
        }
    }
}

function readE2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_ll', 8);
        } else {
            return readBits('reg_ee', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_l', 8);
        } else {
            return readBits('reg_e', 8);
        }
    }
}

function readH2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_dd', 8);
        } else {
            return readBits('reg_hh', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_d', 8);
        } else {
            return readBits('reg_h', 8);
        }
    }
}

function readL2() {
    if (!isNodeHigh(nodenames['ex_bcdehl'])) {
        if (isNodeHigh(nodenames['ex_dehl1'])) {
            return readBits('reg_ee', 8);
        } else {
            return readBits('reg_ll', 8);
        }
    } else {
        if (isNodeHigh(nodenames['ex_dehl0'])) {
            return readBits('reg_e', 8);
        } else {
            return readBits('reg_l', 8);
        }
    }
}

function readI(){return readBits('reg_i', 8);}
function readR(){return readBits('reg_r', 8);}
function readW(){return readBits('reg_w', 8);}
function readZ(){return readBits('reg_z', 8);}

function readIX(){return (readBits('reg_ixh', 8)<<8) + readBits('reg_ixl', 8);}
function readIY(){return (readBits('reg_iyh', 8)<<8) + readBits('reg_iyl', 8);}
function readSP(){return (readBits('reg_sph', 8)<<8) + readBits('reg_spl', 8);}
function readPC(){return (readBits('reg_pch', 8)<<8) + readBits('reg_pcl', 8);}
function readPCL(){return readBits('reg_pcl', 8);}
function readPCH(){return readBits('reg_pch', 8);}

function formatFstring(f){
    var result;
    result=
        ((f & 0x80)?'S':'s') +
        ((f & 0x40)?'Z':'z') +
        ((f & 0x20)?'Y':'y') +
        ((f & 0x10)?'H':'h') +
        ((f & 0x08)?'X':'x') +
        ((f & 0x04)?'P':'p') +
        ((f & 0x02)?'N':'n') +
        ((f & 0x01)?'C':'c');
    return result;
}

// The 6800 state control is something like a branching shift register
// ... but not quite like that
TCStates=[
    "m1", "m2", "m3", "m4", "m5",
    "t1", "t2", "t3", "t4", "t5", "t6",
];

function listActiveTCStates() {
    var s=[];
    for(var i=0;i<TCStates.length;i++){
        var t=TCStates[i];
        if (isNodeHigh(nodenames[t])) s.push(t.slice(0,3));
    }
    return s.join(" ");
}

function busToString(busname){
    // takes a signal name or prefix
    // returns an appropriate string representation
    // some 'signal names' are CPU-specific aliases to user-friendly string output
    if(busname=='cycle')
        return cycle>>1;
    if(busname=='a')
        return hexByte(readA());
    if(busname=='f')
        return formatFstring(readF());
    if(busname=='bc')
        return hexByte(readB()) + hexByte(readC());
    if(busname=='de')
        return hexByte(readD()) + hexByte(readE());
    if(busname=='hl')
        return hexByte(readH()) + hexByte(readL());
    if(busname=='a2')
        return hexByte(readA2());
    if(busname=='f2')
        return formatFstring(readF2());
    if(busname=='bc2')
        return hexByte(readB2()) + hexByte(readC2());
    if(busname=='de2')
        return hexByte(readD2()) + hexByte(readE2());
    if(busname=='hl2')
        return hexByte(readH2()) + hexByte(readL2());
    if(busname=='ir')
        return busToHex('reg_i') + busToHex('reg_r');
    if(busname=='wz')
        return busToHex('reg_w') + busToHex('reg_z');
    if(busname=='pc')
        return busToHex('reg_pch') + busToHex('reg_pcl');
    if(busname=='sp')
        return busToHex('reg_sph') + busToHex('reg_spl');
    if(busname=='ix')
        return busToHex('reg_ixh') + busToHex('reg_ixl');
    if(busname=='iy')
        return busToHex('reg_iyh') + busToHex('reg_iyl');
    if(busname=='State')
        return listActiveTCStates();
    // DMB: TODO
    //   if(busname=='Execute')
    //      return disassemblytoHTML(readBits('ir',8));
    if(busname=='Fetch')
        return (!isNodeHigh(nodenames['_mreq']) && !isNodeHigh(nodenames['_rd']) && (opcode >= 0))?disassemblytoHTML(prefix,opcode):"";
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
        ' clk:' + readBit('clk') +
        ' AB:' + hexWord(ab) +
        ' D:' + hexByte(readDataBus()) +
        ' M1:' + readBit('_m1') +
        ' RD:' + readBit('_rd') +
        ' WR:' + readBit('_wr') +
        ' MREQ:' + readBit('_mreq') +
        ' IORQ:' + readBit('_iorq');
    var machine2 =
        ' PC:' + hexWord(readPC()) +
        ' A:'  + hexByte(readA()) +
        ' F:'  + formatFstring(readF()) +
        ' BC:' + hexByte(readB()) + hexByte(readC()) +
        ' DE:' + hexByte(readD()) + hexByte(readE()) +
        ' HL:' + hexByte(readH()) + hexByte(readL()) +
        ' IX:' + hexWord(readIX()) +
        ' IY:' + hexWord(readIY()) +
        ' SP:' + hexWord(readSP()) +
        ' IR:' + hexByte(readI()) + hexByte(readR()) +
        ' WZ:' + hexByte(readW()) + hexByte(readZ());
    var machine3 =
        'State: ' + busToString('State') +
        ' Hz: ' + estimatedHz().toFixed(1);
    if(typeof expertMode != "undefined") {
        // machine3 += ' Exec: ' + busToString('Execute'); // no T-state info for 6800 yet
        if(!isNodeHigh(nodenames['_m1']) && !isNodeHigh(nodenames['_mreq']) && !isNodeHigh(nodenames['_rd']))
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
function disassemblytoHTML(prefix, opcode){

    var disassembly;
    switch (prefix) {
    case 0xCB:   disassembly = disassembly_cb;   break;
    case 0xDD:   disassembly = disassembly_dd;   break;
    case 0xED:   disassembly = disassembly_ed;   break;
    case 0xFD:   disassembly = disassembly_fd;   break;
    case 0xDDCB: disassembly = disassembly_ddcb; break;
    case 0xFDCB: disassembly = disassembly_ddfd; break;
    default:     disassembly = disassembly_00;   break;
    }

    var opstr=disassembly[opcode];
    if(typeof opstr == "undefined")
        return "unknown"
    return opstr.replace(/ /,'&nbsp;');
}


var disassembly_00={

    0x00: "NOP",
    0x01: "LD BC,NNNN",
    0x02: "LD (BC),A",
    0x03: "INC BC",
    0x04: "INC B",
    0x05: "DEC B",
    0x06: "LD B,NN",
    0x07: "RLCA",
    0x08: "EX AF,AF'",
    0x09: "ADD HL,BC",
    0x0A: "LD A,(BC)",
    0x0B: "DEC BC",
    0x0C: "INC C",
    0x0D: "DEC C",
    0x0E: "LD C,NN",
    0x0F: "RRCA",

    0x10: "DJNZ REL",
    0x11: "LD DE,NNNN",
    0x12: "LD (DE),A",
    0x13: "INC DE",
    0x14: "INC D",
    0x15: "DEC D",
    0x16: "LD D,NN",
    0x17: "RLA",
    0x18: "JR REL",
    0x19: "ADD HL,DE",
    0x1A: "LD A,(DE)",
    0x1B: "DEC DE",
    0x1C: "INC E",
    0x1D: "DEC E",
    0x1E: "LD E,NN",
    0x1F: "RRA",

    0x20: "JR NZ,REL",
    0x21: "LD HL,NNNN",
    0x22: "LD (NNNN),HL",
    0x23: "INC HL",
    0x24: "INC H",
    0x25: "DEC H",
    0x26: "LD H,NN",
    0x27: "DAA",
    0x28: "JR Z,REL",
    0x29: "ADD HL,HL",
    0x2A: "LD HL,(NNNN)",
    0x2B: "DEC HL",
    0x2C: "INC L",
    0x2D: "DEC L",
    0x2E: "LD L,NN",
    0x2F: "CPL",

    0x30: "JR NC,REL",
    0x31: "LD SP,NNNN",
    0x32: "LD (NNNN),A",
    0x33: "INC SP",
    0x34: "INC (HL)",
    0x35: "DEC (HL)",
    0x36: "LD (HL),NN",
    0x37: "SCF",
    0x38: "JR C,REL",
    0x39: "ADD HL,SP",
    0x3A: "LD A,(NNNN)",
    0x3B: "DEC SP",
    0x3C: "INC A",
    0x3D: "DEC A",
    0x3E: "LD A,NN",
    0x3F: "CCF",

    0x40: "LD B,B",
    0x41: "LD B,C",
    0x42: "LD B,D",
    0x43: "LD B,E",
    0x44: "LD B,H",
    0x45: "LD B,L",
    0x46: "LD B,(HL)",
    0x47: "LD B,A",
    0x48: "LD C,B",
    0x49: "LD C,C",
    0x4A: "LD C,D",
    0x4B: "LD C,E",
    0x4C: "LD C,H",
    0x4D: "LD C,L",
    0x4E: "LD C,(HL)",
    0x4F: "LD C,A",

    0x50: "LD D,B",
    0x51: "LD D,C",
    0x52: "LD D,D",
    0x53: "LD D,E",
    0x54: "LD D,H",
    0x55: "LD D,L",
    0x56: "LD D,(HL)",
    0x57: "LD D,A",
    0x58: "LD E,B",
    0x59: "LD E,C",
    0x5A: "LD E,D",
    0x5B: "LD E,E",
    0x5C: "LD E,H",
    0x5D: "LD E,L",
    0x5E: "LD E,(HL)",
    0x5F: "LD E,A",

    0x60: "LD H,B",
    0x61: "LD H,C",
    0x62: "LD H,D",
    0x63: "LD H,E",
    0x64: "LD H,H",
    0x65: "LD H,L",
    0x66: "LD H,(HL)",
    0x67: "LD H,A",
    0x68: "LD L,B",
    0x69: "LD L,C",
    0x6A: "LD L,D",
    0x6B: "LD L,E",
    0x6C: "LD L,H",
    0x6D: "LD L,L",
    0x6E: "LD L,(HL)",
    0x6F: "LD L,A",

    0x70: "LD (HL),B",
    0x71: "LD (HL),C",
    0x72: "LD (HL),D",
    0x73: "LD (HL),E",
    0x74: "LD (HL),H",
    0x75: "LD (HL),L",
    0x76: "HALT",
    0x77: "LD (HL),A",
    0x78: "LD A,B",
    0x79: "LD A,C",
    0x7A: "LD A,D",
    0x7B: "LD A,E",
    0x7C: "LD A,H",
    0x7D: "LD A,L",
    0x7E: "LD A,(HL)",
    0x7F: "LD A,A",

    0x80: "ADD A,B",
    0x81: "ADD A,C",
    0x82: "ADD A,D",
    0x83: "ADD A,E",
    0x84: "ADD A,H",
    0x85: "ADD A,L",
    0x86: "ADD A,(HL)",
    0x87: "ADD A,A",
    0x88: "ADC A,B",
    0x89: "ADC A,C",
    0x8A: "ADC A,D",
    0x8B: "ADC A,E",
    0x8C: "ADC A,H",
    0x8D: "ADC A,L",
    0x8E: "ADC A,(HL)",
    0x8F: "ADC A,A",

    0x90: "SUB B",
    0x91: "SUB C",
    0x92: "SUB D",
    0x93: "SUB E",
    0x94: "SUB H",
    0x95: "SUB L",
    0x96: "SUB (HL)",
    0x97: "SUB A",
    0x98: "SBC A,B",
    0x99: "SBC A,C",
    0x9A: "SBC A,D",
    0x9B: "SBC A,E",
    0x9C: "SBC A,H",
    0x9D: "SBC A,L",
    0x9E: "SBC A,(HL)",
    0x9F: "SBC A,A",

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
    0xC2: "JP NZ,NNNN",
    0xC3: "JP NNNN",
    0xC4: "CALL NZ,NNNN",
    0xC5: "PUSH BC",
    0xC6: "ADD A,NN",
    0xC7: "RST 00h",
    0xC8: "RET Z",
    0xC9: "RET",
    0xCA: "JP Z,NNNN",
    0xCB: "CB PREFIX",
    0xCC: "CALL Z,NNNN",
    0xCD: "CALL NNNN",
    0xCE: "ADC A,NN",
    0xCF: "RST 08h",

    0xD0: "RET NC",
    0xD1: "POP DE",
    0xD2: "JP NC,NNNN",
    0xD3: "OUT (NN),A",
    0xD4: "CALL NC,NNNN",
    0xD5: "PUSH DE",
    0xD6: "SUB NN",
    0xD7: "RST 10h",
    0xD8: "RET C",
    0xD9: "EXX",
    0xDA: "JP C,NNNN",
    0xDB: "IN A,(NN)",
    0xDC: "CALL C,NNNN",
    0xDD: "DD PREFIX",
    0xDE: "SBC A,NN",
    0xDF: "RST 18h",

    0xE0: "RET PO",
    0xE1: "POP HL",
    0xE2: "JP PO,NNNN",
    0xE3: "EX (SP),HL",
    0xE4: "CALL PO,NNNN",
    0xE5: "PUSH HL",
    0xE6: "AND NN",
    0xE7: "RST 20h",
    0xE8: "RET PE",
    0xE9: "JP (HL)",
    0xEA: "JP PE,NNNN",
    0xEB: "EX DE,HL",
    0xEC: "CALL PE,NNNN",
    0xED: "ED PREFIX",
    0xEE: "XOR NN",
    0xEF: "RST 28h",

    0xF0: "RET P",
    0xF1: "POP AF",
    0xF2: "JP P,NNNN",
    0xF3: "DI",
    0xF4: "CALL P,NNNN",
    0xF5: "PUSH AF",
    0xF6: "OR NN",
    0xF7: "RST 30h",
    0xF8: "RET M",
    0xF9: "LD SP,HL",
    0xFA: "JP M,NNNN",
    0xFB: "EI",
    0xFC: "CALL M,NNNN",
    0xFD: "FD PREFIX",
    0xFE: "CP NN",
    0xFF: "RST 38h"
};

var disassembly_ed={

    0x00: "???",
    0x01: "???",
    0x02: "???",
    0x03: "???",
    0x04: "???",
    0x05: "???",
    0x06: "???",
    0x07: "???",
    0x08: "???",
    0x09: "???",
    0x0A: "???",
    0x0B: "???",
    0x0C: "???",
    0x0D: "???",
    0x0E: "???",
    0x0F: "???",

    0x10: "???",
    0x11: "???",
    0x12: "???",
    0x13: "???",
    0x14: "???",
    0x15: "???",
    0x16: "???",
    0x17: "???",
    0x18: "???",
    0x19: "???",
    0x1A: "???",
    0x1B: "???",
    0x1C: "???",
    0x1D: "???",
    0x1E: "???",
    0x1F: "???",

    0x20: "???",
    0x21: "???",
    0x22: "???",
    0x23: "???",
    0x24: "???",
    0x25: "???",
    0x26: "???",
    0x27: "???",
    0x28: "???",
    0x29: "???",
    0x2A: "???",
    0x2B: "???",
    0x2C: "???",
    0x2D: "???",
    0x2E: "???",
    0x2F: "???",

    0x30: "???",
    0x31: "???",
    0x32: "???",
    0x33: "???",
    0x34: "???",
    0x35: "???",
    0x36: "???",
    0x37: "???",
    0x38: "???",
    0x39: "???",
    0x3A: "???",
    0x3B: "???",
    0x3C: "???",
    0x3D: "???",
    0x3E: "???",
    0x3F: "???",

    0x40: "IN B,(C)",
    0x41: "OUT (C),B",
    0x42: "SBC HL,BC",
    0x43: "LD (NNNN),BC",
    0x44: "NEG",
    0x45: "RETN",
    0x46: "IM 0",
    0x47: "LD I,A",
    0x48: "IN C,(C)",
    0x49: "OUT (C),C",
    0x4A: "ADC HL,BC",
    0x4B: "LD BC,(NNNN)",
    0x4C: "NEG",
    0x4D: "RETI",
    0x4E: "IM 0/1",
    0x4F: "LD R,A",

    0x50: "IN D,(C)",
    0x51: "OUT (C),D",
    0x52: "SBC HL,DE",
    0x53: "LD (NNNN),DE",
    0x54: "NEG",
    0x55: "RETN",
    0x56: "IM 1",
    0x57: "LD A,I",
    0x58: "IN E,(C)",
    0x59: "OUT (C),E",
    0x5A: "ADC HL,DE",
    0x5B: "LD DE,(NNNN)",
    0x5C: "NEG",
    0x5D: "RETN",
    0x5E: "IM 2",
    0x5F: "LD A,R",

    0x60: "IN H,(C)",
    0x61: "OUT (C),H",
    0x62: "SBC HL,HL",
    0x63: "LD (NNNN),HL",
    0x64: "NEG",
    0x65: "RETN",
    0x66: "IM 0",
    0x67: "RRD",
    0x68: "IN L,(C)",
    0x69: "OUT (C),L",
    0x6A: "ADC HL,HL",
    0x6B: "LD HL,(NNNN)",
    0x6C: "NEG",
    0x6D: "RETN",
    0x6E: "IM 0/1",
    0x6F: "RLD",

    0x70: "IN (C)",
    0x71: "OUT (C),0",
    0x72: "SBC HL,SP",
    0x73: "LD (NNNN),SP",
    0x74: "NEG",
    0x75: "RETN",
    0x76: "IM 1",
    0x77: "???",
    0x78: "IN A,(C)",
    0x79: "OUT (C),A",
    0x7A: "ADC HL,SP",
    0x7B: "LD SP,(NNNN)",
    0x7C: "NEG",
    0x7D: "RETN",
    0x7E: "IM 2",
    0x7F: "???",

    0x80: "???",
    0x81: "???",
    0x82: "???",
    0x83: "???",
    0x84: "???",
    0x85: "???",
    0x86: "???",
    0x87: "???",
    0x88: "???",
    0x89: "???",
    0x8A: "???",
    0x8B: "???",
    0x8C: "???",
    0x8D: "???",
    0x8E: "???",
    0x8F: "???",

    0x90: "???",
    0x91: "???",
    0x92: "???",
    0x93: "???",
    0x94: "???",
    0x95: "???",
    0x96: "???",
    0x97: "???",
    0x98: "???",
    0x99: "???",
    0x9A: "???",
    0x9B: "???",
    0x9C: "???",
    0x9D: "???",
    0x9E: "???",
    0x9F: "???",

    0xA0: "LDI",
    0xA1: "CPI",
    0xA2: "INI",
    0xA3: "OUTI",
    0xA4: "???",
    0xA5: "???",
    0xA6: "???",
    0xA7: "???",
    0xA8: "LDD",
    0xA9: "CPD",
    0xAA: "IND",
    0xAB: "OUTD",
    0xAC: "???",
    0xAD: "???",
    0xAE: "???",
    0xAF: "???",

    0xB0: "LDIR",
    0xB1: "CPIR",
    0xB2: "INIR",
    0xB3: "OTIR",
    0xB4: "???",
    0xB5: "???",
    0xB6: "???",
    0xB7: "???",
    0xB8: "LDDR",
    0xB9: "CPDR",
    0xBA: "INDR",
    0xBB: "OTDR",
    0xBC: "???",
    0xBD: "???",
    0xBE: "???",
    0xBF: "???",

    0xC0: "???",
    0xC1: "???",
    0xC2: "???",
    0xC3: "???",
    0xC4: "???",
    0xC5: "???",
    0xC6: "???",
    0xC7: "???",
    0xC8: "???",
    0xC9: "???",
    0xCA: "???",
    0xCB: "???",
    0xCC: "???",
    0xCD: "???",
    0xCE: "???",
    0xCF: "???",

    0xD0: "???",
    0xD1: "???",
    0xD2: "???",
    0xD3: "???",
    0xD4: "???",
    0xD5: "???",
    0xD6: "???",
    0xD7: "???",
    0xD8: "???",
    0xD9: "???",
    0xDA: "???",
    0xDB: "???",
    0xDC: "???",
    0xDD: "???",
    0xDE: "???",
    0xDF: "???",

    0xE0: "???",
    0xE1: "???",
    0xE2: "???",
    0xE3: "???",
    0xE4: "???",
    0xE5: "???",
    0xE6: "???",
    0xE7: "???",
    0xE8: "???",
    0xE9: "???",
    0xEA: "???",
    0xEB: "???",
    0xEC: "???",
    0xED: "???",
    0xEE: "???",
    0xEF: "???",

    0xF0: "???",
    0xF1: "???",
    0xF2: "???",
    0xF3: "???",
    0xF4: "???",
    0xF5: "???",
    0xF6: "???",
    0xF7: "???",
    0xF8: "???",
    0xF9: "???",
    0xFA: "???",
    0xFB: "???",
    0xFC: "???",
    0xFD: "???",
    0xFE: "???",
    0xFF: "???"
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

    0x30: "SLL B",
    0x31: "SLL C",
    0x32: "SLL D",
    0x33: "SLL E",
    0x34: "SLL H",
    0x35: "SLL L",
    0x36: "SLL (HL)",
    0x37: "SLL A",
    0x38: "SRL B",
    0x39: "SRL C",
    0x3A: "SRL D",
    0x3B: "SRL E",
    0x3C: "SRL H",
    0x3D: "SRL L",
    0x3E: "SRL (HL)",
    0x3F: "SRL A",

    0x40: "BIT 0,B",
    0x41: "BIT 0,C",
    0x42: "BIT 0,D",
    0x43: "BIT 0,E",
    0x44: "BIT 0,H",
    0x45: "BIT 0,L",
    0x46: "BIT 0,(HL)",
    0x47: "BIT 0,A",
    0x48: "BIT 1,B",
    0x49: "BIT 1,C",
    0x4A: "BIT 1,D",
    0x4B: "BIT 1,E",
    0x4C: "BIT 1,H",
    0x4D: "BIT 1,L",
    0x4E: "BIT 1,(HL)",
    0x4F: "BIT 1,A",

    0x50: "BIT 2,B",
    0x51: "BIT 2,C",
    0x52: "BIT 2,D",
    0x53: "BIT 2,E",
    0x54: "BIT 2,H",
    0x55: "BIT 2,L",
    0x56: "BIT 2,(HL)",
    0x57: "BIT 2,A",
    0x58: "BIT 3,B",
    0x59: "BIT 3,C",
    0x5A: "BIT 3,D",
    0x5B: "BIT 3,E",
    0x5C: "BIT 3,H",
    0x5D: "BIT 3,L",
    0x5E: "BIT 3,(HL)",
    0x5F: "BIT 3,A",

    0x60: "BIT 4,B",
    0x61: "BIT 4,C",
    0x62: "BIT 4,D",
    0x63: "BIT 4,E",
    0x64: "BIT 4,H",
    0x65: "BIT 4,L",
    0x66: "BIT 4,(HL)",
    0x67: "BIT 4,A",
    0x68: "BIT 5,B",
    0x69: "BIT 5,C",
    0x6A: "BIT 5,D",
    0x6B: "BIT 5,E",
    0x6C: "BIT 5,H",
    0x6D: "BIT 5,L",
    0x6E: "BIT 5,(HL)",
    0x6F: "BIT 5,A",

    0x70: "BIT 6,B",
    0x71: "BIT 6,C",
    0x72: "BIT 6,D",
    0x73: "BIT 6,E",
    0x74: "BIT 6,H",
    0x75: "BIT 6,L",
    0x76: "BIT 6,(HL)",
    0x77: "BIT 6,A",
    0x78: "BIT 7,B",
    0x79: "BIT 7,C",
    0x7A: "BIT 7,D",
    0x7B: "BIT 7,E",
    0x7C: "BIT 7,H",
    0x7D: "BIT 7,L",
    0x7E: "BIT 7,(HL)",
    0x7F: "BIT 7,A",

    0x80: "RES 0,B",
    0x81: "RES 0,C",
    0x82: "RES 0,D",
    0x83: "RES 0,E",
    0x84: "RES 0,H",
    0x85: "RES 0,L",
    0x86: "RES 0,(HL)",
    0x87: "RES 0,A",
    0x88: "RES 1,B",
    0x89: "RES 1,C",
    0x8A: "RES 1,D",
    0x8B: "RES 1,E",
    0x8C: "RES 1,H",
    0x8D: "RES 1,L",
    0x8E: "RES 1,(HL)",
    0x8F: "RES 1,A",

    0x90: "RES 2,B",
    0x91: "RES 2,C",
    0x92: "RES 2,D",
    0x93: "RES 2,E",
    0x94: "RES 2,H",
    0x95: "RES 2,L",
    0x96: "RES 2,(HL)",
    0x97: "RES 2,A",
    0x98: "RES 3,B",
    0x99: "RES 3,C",
    0x9A: "RES 3,D",
    0x9B: "RES 3,E",
    0x9C: "RES 3,H",
    0x9D: "RES 3,L",
    0x9E: "RES 3,(HL)",
    0x9F: "RES 3,A",

    0xA0: "RES 4,B",
    0xA1: "RES 4,C",
    0xA2: "RES 4,D",
    0xA3: "RES 4,E",
    0xA4: "RES 4,H",
    0xA5: "RES 4,L",
    0xA6: "RES 4,(HL)",
    0xA7: "RES 4,A",
    0xA8: "RES 5,B",
    0xA9: "RES 5,C",
    0xAA: "RES 5,D",
    0xAB: "RES 5,E",
    0xAC: "RES 5,H",
    0xAD: "RES 5,L",
    0xAE: "RES 5,(HL)",
    0xAF: "RES 5,A",

    0xB0: "RES 6,B",
    0xB1: "RES 6,C",
    0xB2: "RES 6,D",
    0xB3: "RES 6,E",
    0xB4: "RES 6,H",
    0xB5: "RES 6,L",
    0xB6: "RES 6,(HL)",
    0xB7: "RES 6,A",
    0xB8: "RES 7,B",
    0xB9: "RES 7,C",
    0xBA: "RES 7,D",
    0xBB: "RES 7,E",
    0xBC: "RES 7,H",
    0xBD: "RES 7,L",
    0xBE: "RES 7,(HL)",
    0xBF: "RES 7,A",

    0xC0: "SET 0,B",
    0xC1: "SET 0,C",
    0xC2: "SET 0,D",
    0xC3: "SET 0,E",
    0xC4: "SET 0,H",
    0xC5: "SET 0,L",
    0xC6: "SET 0,(HL)",
    0xC7: "SET 0,A",
    0xC8: "SET 1,B",
    0xC9: "SET 1,C",
    0xCA: "SET 1,D",
    0xCB: "SET 1,E",
    0xCC: "SET 1,H",
    0xCD: "SET 1,L",
    0xCE: "SET 1,(HL)",
    0xCF: "SET 1,A",

    0xD0: "SET 2,B",
    0xD1: "SET 2,C",
    0xD2: "SET 2,D",
    0xD3: "SET 2,E",
    0xD4: "SET 2,H",
    0xD5: "SET 2,L",
    0xD6: "SET 2,(HL)",
    0xD7: "SET 2,A",
    0xD8: "SET 3,B",
    0xD9: "SET 3,C",
    0xDA: "SET 3,D",
    0xDB: "SET 3,E",
    0xDC: "SET 3,H",
    0xDD: "SET 3,L",
    0xDE: "SET 3,(HL)",
    0xDF: "SET 3,A",

    0xE0: "SET 4,B",
    0xE1: "SET 4,C",
    0xE2: "SET 4,D",
    0xE3: "SET 4,E",
    0xE4: "SET 4,H",
    0xE5: "SET 4,L",
    0xE6: "SET 4,(HL)",
    0xE7: "SET 4,A",
    0xE8: "SET 5,B",
    0xE9: "SET 5,C",
    0xEA: "SET 5,D",
    0xEB: "SET 5,E",
    0xEC: "SET 5,H",
    0xED: "SET 5,L",
    0xEE: "SET 5,(HL)",
    0xEF: "SET 5,A",

    0xF0: "SET 6,B",
    0xF1: "SET 6,C",
    0xF2: "SET 6,D",
    0xF3: "SET 6,E",
    0xF4: "SET 6,H",
    0xF5: "SET 6,L",
    0xF6: "SET 6,(HL)",
    0xF7: "SET 6,A",
    0xF8: "SET 7,B",
    0xF9: "SET 7,C",
    0xFA: "SET 7,D",
    0xFB: "SET 7,E",
    0xFC: "SET 7,H",
    0xFD: "SET 7,L",
    0xFE: "SET 7,(HL)",
    0xFF: "SET 7,A"
};


var disassembly_dd={

    0x00: "NOP",
    0x01: "LD BC,NNNN",
    0x02: "LD (BC),A",
    0x03: "INC BC",
    0x04: "INC B",
    0x05: "DEC B",
    0x06: "LD B,NN",
    0x07: "RLCA",
    0x08: "EX AF,AF'",
    0x09: "ADD IX,BC",
    0x0A: "LD A,(BC)",
    0x0B: "DEC BC",
    0x0C: "INC C",
    0x0D: "DEC C",
    0x0E: "LD C,NN",
    0x0F: "RRCA",

    0x10: "DJNZ REL",
    0x11: "LD DE,NNNN",
    0x12: "LD (DE),A",
    0x13: "INC DE",
    0x14: "INC D",
    0x15: "DEC D",
    0x16: "LD D,NN",
    0x17: "RLA",
    0x18: "JR REL",
    0x19: "ADD IX,DE",
    0x1A: "LD A,(DE)",
    0x1B: "DEC DE",
    0x1C: "INC E",
    0x1D: "DEC E",
    0x1E: "LD E,NN",
    0x1F: "RRA",

    0x20: "JR NZ,REL",
    0x21: "LD IX,NNNN",
    0x22: "LD (NNNN),IX",
    0x23: "INC IX",
    0x24: "INC IXH",
    0x25: "DEC IXH",
    0x26: "LD IXH,NN",
    0x27: "DAA",
    0x28: "JR Z,REL",
    0x29: "ADD IX,IX",
    0x2A: "LD IX,(NNNN)",
    0x2B: "DEC IX",
    0x2C: "INC IXL",
    0x2D: "DEC IXL",
    0x2E: "LD IXL,NN",
    0x2F: "CPL",

    0x30: "JR NC,REL",
    0x31: "LD SP,NNNN",
    0x32: "LD (NNNN),A",
    0x33: "INC SP",
    0x34: "INC (IX+d)",
    0x35: "DEC (IX+d)",
    0x36: "LD (IX+d),NN",
    0x37: "SCF",
    0x38: "JR C,REL",
    0x39: "ADD IX,SP",
    0x3A: "LD A,(NNNN)",
    0x3B: "DEC SP",
    0x3C: "INC A",
    0x3D: "DEC A",
    0x3D: "LD A,NN",
    0x3F: "CCF",

    0x40: "LD B,B",
    0x41: "LD B,C",
    0x42: "LD B,D",
    0x44: "LD B,E",
    0x44: "LD B,IXH",
    0x45: "LD B,IXL",
    0x46: "LD B,(IX+d)",
    0x47: "LD B,A",
    0x48: "LD C,B",
    0x49: "LD C,C",
    0x4A: "LD C,D",
    0x4B: "LD C,E",
    0x4C: "LD C,IXH",
    0x4D: "LD C,IXL",
    0x4E: "LD C,(IX+d)",
    0x4F: "LD C,A",

    0x50: "LD D,B",
    0x51: "LD D,C",
    0x52: "LD D,D",
    0x52: "LD D,E",
    0x54: "LD D,IXH",
    0x55: "LD D,IXL",
    0x56: "LD D,(IX+d)",
    0x57: "LD D,A",
    0x58: "LD E,B",
    0x59: "LD E,C",
    0x5A: "LD E,D",
    0x5B: "LD E,E",
    0x5C: "LD E,IXH",
    0x5D: "LD E,IXL",
    0x5E: "LD E,(IX+d)",
    0x5F: "LD E,A",

    0x60: "LD IXH,B",
    0x61: "LD IXH,C",
    0x62: "LD IXH,D",
    0x63: "LD IXH,E",
    0x64: "LD IXH,IXH",
    0x65: "LD IXH,IXL",
    0x66: "LD H,(IX+d)",
    0x67: "LD IXH,A",
    0x68: "LD IXL,B",
    0x69: "LD IXL,C",
    0x6A: "LD IXL,D",
    0x6B: "LD IXL,E",
    0x6C: "LD IXL,IXH",
    0x6D: "LD IXL,IXL",
    0x6E: "LD L,(IX+d)",
    0x6F: "LD IXL,A",

    0x70: "LD (IX+d),B",
    0x71: "LD (IX+d),C",
    0x72: "LD (IX+d),D",
    0x73: "LD (IX+d),E",
    0x74: "LD (IX+d),H",
    0x75: "LD (IX+d),L",
    0x76: "HALT",
    0x77: "LD (IX+d),A",
    0x78: "LD A,B",
    0x79: "LD A,C",
    0x7A: "LD A,D",
    0x7B: "LD A,E",
    0x7C: "LD A,IXH",
    0x7D: "LD A,IXL",
    0x7E: "LD A,(IX+d)",
    0x7F: "LD A,A",

    0x80: "ADD A,B",
    0x81: "ADD A,C",
    0x82: "ADD A,D",
    0x83: "ADD A,E",
    0x84: "ADD A,IXH",
    0x85: "ADD A,IXL",
    0x86: "ADD A,(IX+d)",
    0x87: "ADD A,A",
    0x88: "ADC A,B",
    0x89: "ADC A,C",
    0x8A: "ADC A,D",
    0x8B: "ADC A,E",
    0x8C: "ADC A,IXH",
    0x8D: "ADC A,IXL",
    0x8E: "ADC A,(IX+d)",
    0x8F: "ADC A,A",

    0x90: "SUB B",
    0x91: "SUB C",
    0x92: "SUB D",
    0x93: "SUB E",
    0x94: "SUB IXH",
    0x95: "SUB IXL",
    0x96: "SUB (IX+d)",
    0x97: "SUB A",
    0x98: "SBC A,B",
    0x99: "SBC A,C",
    0x9A: "SBC A,D",
    0x9B: "SBC A,E",
    0x9C: "SBC A,IXH",
    0x9D: "SBC A,IXL",
    0x9E: "SBC A,(IX+d)",
    0x9F: "SBC A,A",

    0xA0: "AND B",
    0xA1: "AND C",
    0xA2: "AND D",
    0xA3: "AND E",
    0xA4: "AND IXH",
    0xA5: "AND IXL",
    0xA6: "AND (IX+d)",
    0xA7: "AND A",
    0xA8: "XOR B",
    0xA9: "XOR C",
    0xAA: "XOR D",
    0xAB: "XOR E",
    0xAC: "XOR IXH",
    0xAD: "XOR IXL",
    0xAE: "XOR (IX+d)",
    0xEF: "XOR A",

    0xB0: "OR B",
    0xB1: "OR C",
    0xB2: "OR D",
    0xB3: "OR E",
    0xB4: "OR IXH",
    0xB5: "OR IXL",
    0xB6: "OR (IX+d)",
    0xB7: "OR A",
    0xB8: "CP B",
    0xB9: "CP C",
    0xBA: "CP D",
    0xBB: "CP E",
    0xBC: "CP IXH",
    0xBD: "CP IXL",
    0xBE: "CP (IX+d)",
    0xBF: "CP A",

    0xC0: "RET NZ",
    0xC1: "POP BC",
    0xC2: "JP NZ,NNNN",
    0xC3: "JP NNNN",
    0xC4: "CALL NZ,NNNN",
    0xC5: "PUSH BC",
    0xC6: "ADD A,NN",
    0xC7: "RST 00h",
    0xC8: "RET Z",
    0xC9: "RET",
    0xCA: "JP Z,NNNN",
    0xCB: "CB PREFIX",
    0xCC: "CALL Z,NNNN",
    0xCD: "CALL NNNN",
    0xCE: "ADC A,NN",
    0xCF: "RST 08h",

    0xD0: "RET NC",
    0xD1: "POP DE",
    0xD2: "JP NC,NNNN",
    0xD3: "OUT (NN),A",
    0xD4: "CALL NC,NNNN",
    0xD5: "PUSH DE",
    0xD6: "SUB NN",
    0xD7: "RST 10h",
    0xD8: "RET C",
    0xD9: "EXX",
    0xDA: "JP C,NNNN",
    0xDB: "IN A,(NN)",
    0xDC: "CALL C,NNNN",
    0xDD: "DD PREFIX",
    0xDE: "SBC A,NN",
    0xDF: "RST 18h",

    0xE0: "RET PO",
    0xE1: "POP IX",
    0xE2: "JP PO,NNNN",
    0xE3: "EX (SP),IX",
    0xE4: "CALL PO,NNNN",
    0xE5: "PUSH IX",
    0xE6: "AND NN",
    0xE7: "RST 20h",
    0xE8: "RET PE",
    0xE9: "JP (IX)",
    0xEA: "JP PE,NNNN",
    0xEB: "EX DE,HL",
    0xEC: "CALL PE,NNNN",
    0xED: "ED PREFIX",
    0xEE: "XOR NN",
    0xEF: "RST 28h",

    0xF0: "RET P",
    0xF1: "POP AF",
    0xF2: "JP P,NNNN",
    0xF3: "DI",
    0xF4: "CALL P,NNNN",
    0xF5: "PUSH AF",
    0xF7: "OR NN",
    0xF7: "RST 30h",
    0xF8: "RET M",
    0xF9: "LD SP,IX",
    0xFA: "JP M,NNNN",
    0xFB: "EI",
    0xFC: "CALL M,NNNN",
    0xFD: "FD PREFIX",
    0xFE: "CP NN",
    0xFF: "RST 38h"
};

var disassembly_fd={

    0x00: "NOP",
    0x01: "LD BC,NNNN",
    0x02: "LD (BC),A",
    0x03: "INC BC",
    0x04: "INC B",
    0x05: "DEC B",
    0x06: "LD B,NN",
    0x07: "RLCA",
    0x08: "EX AF,AF'",
    0x09: "ADD IY,BC",
    0x0A: "LD A,(BC)",
    0x0B: "DEC BC",
    0x0C: "INC C",
    0x0D: "DEC C",
    0x0E: "LD C,NN",
    0x0F: "RRCA",

    0x10: "DJNZ REL",
    0x11: "LD DE,NNNN",
    0x12: "LD (DE),A",
    0x13: "INC DE",
    0x14: "INC D",
    0x15: "DEC D",
    0x16: "LD D,NN",
    0x17: "RLA",
    0x18: "JR REL",
    0x19: "ADD IY,DE",
    0x1A: "LD A,(DE)",
    0x1B: "DEC DE",
    0x1C: "INC E",
    0x1D: "DEC E",
    0x1E: "LD E,NN",
    0x1F: "RRA",

    0x20: "JR NZ,REL",
    0x21: "LD IY,NNNN",
    0x22: "LD (NNNN),IY",
    0x23: "INC IY",
    0x24: "INC IYH",
    0x25: "DEC IYH",
    0x26: "LD IYH,NN",
    0x27: "DAA",
    0x28: "JR Z,REL",
    0x29: "ADD IY,IY",
    0x2A: "LD IY,(NNNN)",
    0x2B: "DEC IY",
    0x2C: "INC IYL",
    0x2D: "DEC IYL",
    0x2E: "LD IYL,NN",
    0x2F: "CPL",

    0x30: "JR NC,REL",
    0x31: "LD SP,NNNN",
    0x32: "LD (NNNN),A",
    0x33: "INC SP",
    0x34: "INC (IY+d)",
    0x35: "DEC (IY+d)",
    0x36: "LD (IY+d),NN",
    0x37: "SCF",
    0x38: "JR C,REL",
    0x39: "ADD IY,SP",
    0x3A: "LD A,(NNNN)",
    0x3B: "DEC SP",
    0x3C: "INC A",
    0x3D: "DEC A",
    0x3D: "LD A,NN",
    0x3F: "CCF",

    0x40: "LD B,B",
    0x41: "LD B,C",
    0x42: "LD B,D",
    0x44: "LD B,E",
    0x44: "LD B,IYH",
    0x45: "LD B,IYL",
    0x46: "LD B,(IY+d)",
    0x47: "LD B,A",
    0x48: "LD C,B",
    0x49: "LD C,C",
    0x4A: "LD C,D",
    0x4B: "LD C,E",
    0x4C: "LD C,IYH",
    0x4D: "LD C,IYL",
    0x4E: "LD C,(IY+d)",
    0x4F: "LD C,A",

    0x50: "LD D,B",
    0x51: "LD D,C",
    0x52: "LD D,D",
    0x52: "LD D,E",
    0x54: "LD D,IYH",
    0x55: "LD D,IYL",
    0x56: "LD D,(IY+d)",
    0x57: "LD D,A",
    0x58: "LD E,B",
    0x59: "LD E,C",
    0x5A: "LD E,D",
    0x5B: "LD E,E",
    0x5C: "LD E,IYH",
    0x5D: "LD E,IYL",
    0x5E: "LD E,(IY+d)",
    0x5F: "LD E,A",

    0x60: "LD IYH,B",
    0x61: "LD IYH,C",
    0x62: "LD IYH,D",
    0x63: "LD IYH,E",
    0x64: "LD IYH,IYH",
    0x65: "LD IYH,IYL",
    0x66: "LD H,(IY+d)",
    0x67: "LD IYH,A",
    0x68: "LD IYL,B",
    0x69: "LD IYL,C",
    0x6A: "LD IYL,D",
    0x6B: "LD IYL,E",
    0x6C: "LD IYL,IYH",
    0x6D: "LD IYL,IYL",
    0x6E: "LD L,(IY+d)",
    0x6F: "LD IYL,A",

    0x70: "LD (IY+d),B",
    0x71: "LD (IY+d),C",
    0x72: "LD (IY+d),D",
    0x73: "LD (IY+d),E",
    0x74: "LD (IY+d),H",
    0x75: "LD (IY+d),L",
    0x76: "HALT",
    0x77: "LD (IY+d),A",
    0x78: "LD A,B",
    0x79: "LD A,C",
    0x7A: "LD A,D",
    0x7B: "LD A,E",
    0x7C: "LD A,IYH",
    0x7D: "LD A,IYL",
    0x7E: "LD A,(IY+d)",
    0x7F: "LD A,A",

    0x80: "ADD A,B",
    0x81: "ADD A,C",
    0x82: "ADD A,D",
    0x83: "ADD A,E",
    0x84: "ADD A,IYH",
    0x85: "ADD A,IYL",
    0x86: "ADD A,(IY+d)",
    0x87: "ADD A,A",
    0x88: "ADC A,B",
    0x89: "ADC A,C",
    0x8A: "ADC A,D",
    0x8B: "ADC A,E",
    0x8C: "ADC A,IYH",
    0x8D: "ADC A,IYL",
    0x8E: "ADC A,(IY+d)",
    0x8F: "ADC A,A",

    0x90: "SUB B",
    0x91: "SUB C",
    0x92: "SUB D",
    0x93: "SUB E",
    0x94: "SUB IYH",
    0x95: "SUB IYL",
    0x96: "SUB (IY+d)",
    0x97: "SUB A",
    0x98: "SBC A,B",
    0x99: "SBC A,C",
    0x9A: "SBC A,D",
    0x9B: "SBC A,E",
    0x9C: "SBC A,IYH",
    0x9D: "SBC A,IYL",
    0x9E: "SBC A,(IY+d)",
    0x9F: "SBC A,A",

    0xA0: "AND B",
    0xA1: "AND C",
    0xA2: "AND D",
    0xA3: "AND E",
    0xA4: "AND IYH",
    0xA5: "AND IYL",
    0xA6: "AND (IY+d)",
    0xA7: "AND A",
    0xA8: "XOR B",
    0xA9: "XOR C",
    0xAA: "XOR D",
    0xAB: "XOR E",
    0xAC: "XOR IYH",
    0xAD: "XOR IYL",
    0xAE: "XOR (IY+d)",
    0xEF: "XOR A",

    0xB0: "OR B",
    0xB1: "OR C",
    0xB2: "OR D",
    0xB3: "OR E",
    0xB4: "OR IYH",
    0xB5: "OR IYL",
    0xB6: "OR (IY+d)",
    0xB7: "OR A",
    0xB8: "CP B",
    0xB9: "CP C",
    0xBA: "CP D",
    0xBB: "CP E",
    0xBC: "CP IYH",
    0xBD: "CP IYL",
    0xBE: "CP (IY+d)",
    0xBF: "CP A",

    0xC0: "RET NZ",
    0xC1: "POP BC",
    0xC2: "JP NZ,NNNN",
    0xC3: "JP NNNN",
    0xC4: "CALL NZ,NNNN",
    0xC5: "PUSH BC",
    0xC6: "ADD A,NN",
    0xC7: "RST 00h",
    0xC8: "RET Z",
    0xC9: "RET",
    0xCA: "JP Z,NNNN",
    0xCB: "CB PREFIX",
    0xCC: "CALL Z,NNNN",
    0xCD: "CALL NNNN",
    0xCE: "ADC A,NN",
    0xCF: "RST 08h",

    0xD0: "RET NC",
    0xD1: "POP DE",
    0xD2: "JP NC,NNNN",
    0xD3: "OUT (NN),A",
    0xD4: "CALL NC,NNNN",
    0xD5: "PUSH DE",
    0xD6: "SUB NN",
    0xD7: "RST 10h",
    0xD8: "RET C",
    0xD9: "EXX",
    0xDA: "JP C,NNNN",
    0xDB: "IN A,(NN)",
    0xDC: "CALL C,NNNN",
    0xDD: "DD PREFIX",
    0xDE: "SBC A,NN",
    0xDF: "RST 18h",

    0xE0: "RET PO",
    0xE1: "POP IY",
    0xE2: "JP PO,NNNN",
    0xE3: "EX (SP),IY",
    0xE4: "CALL PO,NNNN",
    0xE5: "PUSH IY",
    0xE6: "AND NN",
    0xE7: "RST 20h",
    0xE8: "RET PE",
    0xE9: "JP (IY)",
    0xEA: "JP PE,NNNN",
    0xEB: "EX DE,HL",
    0xEC: "CALL PE,NNNN",
    0xED: "ED PREFIX",
    0xEE: "XOR NN",
    0xEF: "RST 28h",

    0xF0: "RET P",
    0xF1: "POP AF",
    0xF2: "JP P,NNNN",
    0xF3: "DI",
    0xF4: "CALL P,NNNN",
    0xF5: "PUSH AF",
    0xF7: "OR NN",
    0xF7: "RST 30h",
    0xF8: "RET M",
    0xF9: "LD SP,IY",
    0xFA: "JP M,NNNN",
    0xFB: "EI",
    0xFC: "CALL M,NNNN",
    0xFD: "FD PREFIX",
    0xFE: "CP NN",
    0xFF: "RST 38h"
};

var disassembly_ddcb={

    0x00: "RLC (IX+d),B",
    0x01: "RLC (IX+d),C",
    0x02: "RLC (IX+d),D",
    0x03: "RLC (IX+d),E",
    0x04: "RLC (IX+d),H",
    0x05: "RLC (IX+d),L",
    0x06: "RLC (IX+d)",
    0x07: "RLC (IX+d),A",
    0x08: "RRC (IX+d),B",
    0x09: "RRC (IX+d),C",
    0x0A: "RRC (IX+d),D",
    0x0B: "RRC (IX+d),E",
    0x0C: "RRC (IX+d),H",
    0x0D: "RRC (IX+d),L",
    0x0E: "RRC (IX+d)",
    0x0F: "RRC (IX+d),A",

    0x10: "RL (IX+d),B",
    0x11: "RL (IX+d),C",
    0x12: "RL (IX+d),D",
    0x13: "RL (IX+d),E",
    0x14: "RL (IX+d),H",
    0x15: "RL (IX+d),L",
    0x16: "RL (IX+d)",
    0x17: "RL (IX+d),A",
    0x18: "RR (IX+d),B",
    0x19: "RR (IX+d),C",
    0x1A: "RR (IX+d),D",
    0x1B: "RR (IX+d),E",
    0x1C: "RR (IX+d),H",
    0x1D: "RR (IX+d),L",
    0x1E: "RR (IX+d)",
    0x1F: "RR (IX+d),A",

    0x20: "SLA (IX+d),B",
    0x21: "SLA (IX+d),C",
    0x22: "SLA (IX+d),D",
    0x23: "SLA (IX+d),E",
    0x24: "SLA (IX+d),H",
    0x25: "SLA (IX+d),L",
    0x26: "SLA (IX+d)",
    0x27: "SLA (IX+d),A",
    0x28: "SRA (IX+d),B",
    0x29: "SRA (IX+d),C",
    0x2A: "SRA (IX+d),D",
    0x2B: "SRA (IX+d),E",
    0x2C: "SRA (IX+d),H",
    0x2D: "SRA (IX+d),L",
    0x2E: "SRA (IX+d)",
    0x2F: "SRA (IX+d),A",

    0x30: "SLL (IX+d),B",
    0x31: "SLL (IX+d),C",
    0x32: "SLL (IX+d),D",
    0x33: "SLL (IX+d),E",
    0x34: "SLL (IX+d),H",
    0x35: "SLL (IX+d),L",
    0x36: "SLL (IX+d)",
    0x37: "SLL (IX+d),A",
    0x38: "SRL (IX+d),B",
    0x39: "SRL (IX+d),C",
    0x3A: "SRL (IX+d),D",
    0x3B: "SRL (IX+d),E",
    0x3C: "SRL (IX+d),H",
    0x3D: "SRL (IX+d),L",
    0x3E: "SRL (IX+d)",
    0x3F: "SRL (IX+d),A",

    0x40: "BIT 0,(IX+d)",
    0x41: "BIT 0,(IX+d)",
    0x42: "BIT 0,(IX+d)",
    0x43: "BIT 0,(IX+d)",
    0x44: "BIT 0,(IX+d)",
    0x45: "BIT 0,(IX+d)",
    0x46: "BIT 0,(IX+d)",
    0x47: "BIT 0,(IX+d)",
    0x48: "BIT 1,(IX+d)",
    0x49: "BIT 1,(IX+d)",
    0x4A: "BIT 1,(IX+d)",
    0x4B: "BIT 1,(IX+d)",
    0x4C: "BIT 1,(IX+d)",
    0x4D: "BIT 1,(IX+d)",
    0x4E: "BIT 1,(IX+d)",
    0x4F: "BIT 1,(IX+d)",

    0x50: "BIT 2,(IX+d)",
    0x51: "BIT 2,(IX+d)",
    0x52: "BIT 2,(IX+d)",
    0x53: "BIT 2,(IX+d)",
    0x54: "BIT 2,(IX+d)",
    0x55: "BIT 2,(IX+d)",
    0x56: "BIT 2,(IX+d)",
    0x57: "BIT 2,(IX+d)",
    0x58: "BIT 3,(IX+d)",
    0x59: "BIT 3,(IX+d)",
    0x5A: "BIT 3,(IX+d)",
    0x5B: "BIT 3,(IX+d)",
    0x5C: "BIT 3,(IX+d)",
    0x5D: "BIT 3,(IX+d)",
    0x5E: "BIT 3,(IX+d)",
    0x5F: "BIT 3,(IX+d)",

    0x60: "BIT 4,(IX+d)",
    0x61: "BIT 4,(IX+d)",
    0x62: "BIT 4,(IX+d)",
    0x63: "BIT 4,(IX+d)",
    0x64: "BIT 4,(IX+d)",
    0x65: "BIT 4,(IX+d)",
    0x66: "BIT 4,(IX+d)",
    0x67: "BIT 4,(IX+d)",
    0x68: "BIT 5,(IX+d)",
    0x69: "BIT 5,(IX+d)",
    0x6A: "BIT 5,(IX+d)",
    0x6B: "BIT 5,(IX+d)",
    0x6C: "BIT 5,(IX+d)",
    0x6D: "BIT 5,(IX+d)",
    0x6E: "BIT 5,(IX+d)",
    0x6F: "BIT 5,(IX+d)",

    0x70: "BIT 6,(IX+d)",
    0x71: "BIT 6,(IX+d)",
    0x72: "BIT 6,(IX+d)",
    0x73: "BIT 6,(IX+d)",
    0x74: "BIT 6,(IX+d)",
    0x75: "BIT 6,(IX+d)",
    0x76: "BIT 6,(IX+d)",
    0x77: "BIT 6,(IX+d)",
    0x78: "BIT 7,(IX+d)",
    0x79: "BIT 7,(IX+d)",
    0x7A: "BIT 7,(IX+d)",
    0x7B: "BIT 7,(IX+d)",
    0x7C: "BIT 7,(IX+d)",
    0x7D: "BIT 7,(IX+d)",
    0x7E: "BIT 7,(IX+d)",
    0x7F: "BIT 7,(IX+d)",

    0x80: "RES 0,(IX+d),B",
    0x81: "RES 0,(IX+d),C",
    0x82: "RES 0,(IX+d),D",
    0x83: "RES 0,(IX+d),E",
    0x84: "RES 0,(IX+d),H",
    0x85: "RES 0,(IX+d),L",
    0x86: "RES 0,(IX+d)",
    0x87: "RES 0,(IX+d),A",
    0x88: "RES 1,(IX+d),B",
    0x89: "RES 1,(IX+d),C",
    0x8A: "RES 1,(IX+d),D",
    0x8B: "RES 1,(IX+d),E",
    0x8C: "RES 1,(IX+d),H",
    0x8D: "RES 1,(IX+d),L",
    0x8E: "RES 1,(IX+d)",
    0x8F: "RES 1,(IX+d),A",

    0x90: "RES 2,(IX+d),B",
    0x91: "RES 2,(IX+d),C",
    0x92: "RES 2,(IX+d),D",
    0x93: "RES 2,(IX+d),E",
    0x94: "RES 2,(IX+d),H",
    0x95: "RES 2,(IX+d),L",
    0x96: "RES 2,(IX+d)",
    0x97: "RES 2,(IX+d),A",
    0x98: "RES 3,(IX+d),B",
    0x99: "RES 3,(IX+d),C",
    0x9A: "RES 3,(IX+d),D",
    0x9B: "RES 3,(IX+d),E",
    0x9C: "RES 3,(IX+d),H",
    0x9D: "RES 3,(IX+d),L",
    0x9E: "RES 3,(IX+d)",
    0x9F: "RES 3,(IX+d),A",

    0xA0: "RES 4,(IX+d),B",
    0xA1: "RES 4,(IX+d),C",
    0xA2: "RES 4,(IX+d),D",
    0xA3: "RES 4,(IX+d),E",
    0xA4: "RES 4,(IX+d),H",
    0xA5: "RES 4,(IX+d),L",
    0xA6: "RES 4,(IX+d)",
    0xA7: "RES 4,(IX+d),A",
    0xA8: "RES 5,(IX+d),B",
    0xA9: "RES 5,(IX+d),C",
    0xAA: "RES 5,(IX+d),D",
    0xAB: "RES 5,(IX+d),E",
    0xAC: "RES 5,(IX+d),H",
    0xAD: "RES 5,(IX+d),L",
    0xAE: "RES 5,(IX+d)",
    0xAF: "RES 5,(IX+d),A",

    0xB0: "RES 6,(IX+d),B",
    0xB1: "RES 6,(IX+d),C",
    0xB2: "RES 6,(IX+d),D",
    0xB3: "RES 6,(IX+d),E",
    0xB4: "RES 6,(IX+d),H",
    0xB5: "RES 6,(IX+d),L",
    0xB6: "RES 6,(IX+d)",
    0xB7: "RES 6,(IX+d),A",
    0xB8: "RES 7,(IX+d),B",
    0xB9: "RES 7,(IX+d),C",
    0xBA: "RES 7,(IX+d),D",
    0xBB: "RES 7,(IX+d),E",
    0xBC: "RES 7,(IX+d),H",
    0xBD: "RES 7,(IX+d),L",
    0xBE: "RES 7,(IX+d)",
    0xBF: "RES 7,(IX+d),A",

    0xC0: "SET 0,(IX+d),B",
    0xC1: "SET 0,(IX+d),C",
    0xC2: "SET 0,(IX+d),D",
    0xC3: "SET 0,(IX+d),E",
    0xC4: "SET 0,(IX+d),H",
    0xC5: "SET 0,(IX+d),L",
    0xC6: "SET 0,(IX+d)",
    0xC7: "SET 0,(IX+d),A",
    0xC8: "SET 1,(IX+d),B",
    0xC9: "SET 1,(IX+d),C",
    0xCA: "SET 1,(IX+d),D",
    0xCB: "SET 1,(IX+d),E",
    0xCC: "SET 1,(IX+d),H",
    0xCD: "SET 1,(IX+d),L",
    0xCE: "SET 1,(IX+d)",
    0xCF: "SET 1,(IX+d),A",

    0xD0: "SET 2,(IX+d),B",
    0xD1: "SET 2,(IX+d),C",
    0xD2: "SET 2,(IX+d),D",
    0xD3: "SET 2,(IX+d),E",
    0xD4: "SET 2,(IX+d),H",
    0xD5: "SET 2,(IX+d),L",
    0xD6: "SET 2,(IX+d)",
    0xD7: "SET 2,(IX+d),A",
    0xD8: "SET 3,(IX+d),B",
    0xD9: "SET 3,(IX+d),C",
    0xDA: "SET 3,(IX+d),D",
    0xDB: "SET 3,(IX+d),E",
    0xDC: "SET 3,(IX+d),H",
    0xDD: "SET 3,(IX+d),L",
    0xDE: "SET 3,(IX+d)",
    0xDF: "SET 3,(IX+d),A",

    0xE0: "SET 4,(IX+d),B",
    0xE1: "SET 4,(IX+d),C",
    0xE2: "SET 4,(IX+d),D",
    0xE3: "SET 4,(IX+d),E",
    0xE4: "SET 4,(IX+d),H",
    0xE5: "SET 4,(IX+d),L",
    0xE6: "SET 4,(IX+d)",
    0xE7: "SET 4,(IX+d),A",
    0xE8: "SET 5,(IX+d),B",
    0xE9: "SET 5,(IX+d),C",
    0xEA: "SET 5,(IX+d),D",
    0xEB: "SET 5,(IX+d),E",
    0xEC: "SET 5,(IX+d),H",
    0xED: "SET 5,(IX+d),L",
    0xEE: "SET 5,(IX+d)",
    0xEF: "SET 5,(IX+d),A",

    0xF0: "SET 6,(IX+d),B",
    0xF1: "SET 6,(IX+d),C",
    0xF2: "SET 6,(IX+d),D",
    0xF3: "SET 6,(IX+d),E",
    0xF4: "SET 6,(IX+d),H",
    0xF5: "SET 6,(IX+d),L",
    0xF6: "SET 6,(IX+d)",
    0xF7: "SET 6,(IX+d),A",
    0xF8: "SET 7,(IX+d),B",
    0xF9: "SET 7,(IX+d),C",
    0xFA: "SET 7,(IX+d),D",
    0xFB: "SET 7,(IX+d),E",
    0xFC: "SET 7,(IX+d),H",
    0xFD: "SET 7,(IX+d),L",
    0xFE: "SET 7,(IX+d)",
    0xFF: "SET 7,(IX+d),A",

    0x100: "DISPLACEMENT"
};

var disassembly_fdcb={

    0x00: "RLC (IY+d),B",
    0x01: "RLC (IY+d),C",
    0x02: "RLC (IY+d),D",
    0x03: "RLC (IY+d),E",
    0x04: "RLC (IY+d),H",
    0x05: "RLC (IY+d),L",
    0x06: "RLC (IY+d)",
    0x07: "RLC (IY+d),A",
    0x08: "RRC (IY+d),B",
    0x09: "RRC (IY+d),C",
    0x0A: "RRC (IY+d),D",
    0x0B: "RRC (IY+d),E",
    0x0C: "RRC (IY+d),H",
    0x0D: "RRC (IY+d),L",
    0x0E: "RRC (IY+d)",
    0x0F: "RRC (IY+d),A",

    0x10: "RL (IY+d),B",
    0x11: "RL (IY+d),C",
    0x12: "RL (IY+d),D",
    0x13: "RL (IY+d),E",
    0x14: "RL (IY+d),H",
    0x15: "RL (IY+d),L",
    0x16: "RL (IY+d)",
    0x17: "RL (IY+d),A",
    0x18: "RR (IY+d),B",
    0x19: "RR (IY+d),C",
    0x1A: "RR (IY+d),D",
    0x1B: "RR (IY+d),E",
    0x1C: "RR (IY+d),H",
    0x1D: "RR (IY+d),L",
    0x1E: "RR (IY+d)",
    0x1F: "RR (IY+d),A",

    0x20: "SLA (IY+d),B",
    0x21: "SLA (IY+d),C",
    0x22: "SLA (IY+d),D",
    0x23: "SLA (IY+d),E",
    0x24: "SLA (IY+d),H",
    0x25: "SLA (IY+d),L",
    0x26: "SLA (IY+d)",
    0x27: "SLA (IY+d),A",
    0x28: "SRA (IY+d),B",
    0x29: "SRA (IY+d),C",
    0x2A: "SRA (IY+d),D",
    0x2B: "SRA (IY+d),E",
    0x2C: "SRA (IY+d),H",
    0x2D: "SRA (IY+d),L",
    0x2E: "SRA (IY+d)",
    0x2F: "SRA (IY+d),A",

    0x30: "SLL (IY+d),B",
    0x31: "SLL (IY+d),C",
    0x32: "SLL (IY+d),D",
    0x33: "SLL (IY+d),E",
    0x34: "SLL (IY+d),H",
    0x35: "SLL (IY+d),L",
    0x36: "SLL (IY+d)",
    0x37: "SLL (IY+d),A",
    0x38: "SRL (IY+d),B",
    0x39: "SRL (IY+d),C",
    0x3A: "SRL (IY+d),D",
    0x3B: "SRL (IY+d),E",
    0x3C: "SRL (IY+d),H",
    0x3D: "SRL (IY+d),L",
    0x3E: "SRL (IY+d)",
    0x3F: "SRL (IY+d),A",

    0x40: "BIT 0,(IY+d)",
    0x41: "BIT 0,(IY+d)",
    0x42: "BIT 0,(IY+d)",
    0x43: "BIT 0,(IY+d)",
    0x44: "BIT 0,(IY+d)",
    0x45: "BIT 0,(IY+d)",
    0x46: "BIT 0,(IY+d)",
    0x47: "BIT 0,(IY+d)",
    0x48: "BIT 1,(IY+d)",
    0x49: "BIT 1,(IY+d)",
    0x4A: "BIT 1,(IY+d)",
    0x4B: "BIT 1,(IY+d)",
    0x4C: "BIT 1,(IY+d)",
    0x4D: "BIT 1,(IY+d)",
    0x4E: "BIT 1,(IY+d)",
    0x4F: "BIT 1,(IY+d)",

    0x50: "BIT 2,(IY+d)",
    0x51: "BIT 2,(IY+d)",
    0x52: "BIT 2,(IY+d)",
    0x53: "BIT 2,(IY+d)",
    0x54: "BIT 2,(IY+d)",
    0x55: "BIT 2,(IY+d)",
    0x56: "BIT 2,(IY+d)",
    0x57: "BIT 2,(IY+d)",
    0x58: "BIT 3,(IY+d)",
    0x59: "BIT 3,(IY+d)",
    0x5A: "BIT 3,(IY+d)",
    0x5B: "BIT 3,(IY+d)",
    0x5C: "BIT 3,(IY+d)",
    0x5D: "BIT 3,(IY+d)",
    0x5E: "BIT 3,(IY+d)",
    0x5F: "BIT 3,(IY+d)",

    0x60: "BIT 4,(IY+d)",
    0x61: "BIT 4,(IY+d)",
    0x62: "BIT 4,(IY+d)",
    0x63: "BIT 4,(IY+d)",
    0x64: "BIT 4,(IY+d)",
    0x65: "BIT 4,(IY+d)",
    0x66: "BIT 4,(IY+d)",
    0x67: "BIT 4,(IY+d)",
    0x68: "BIT 5,(IY+d)",
    0x69: "BIT 5,(IY+d)",
    0x6A: "BIT 5,(IY+d)",
    0x6B: "BIT 5,(IY+d)",
    0x6C: "BIT 5,(IY+d)",
    0x6D: "BIT 5,(IY+d)",
    0x6E: "BIT 5,(IY+d)",
    0x6F: "BIT 5,(IY+d)",

    0x70: "BIT 6,(IY+d)",
    0x71: "BIT 6,(IY+d)",
    0x72: "BIT 6,(IY+d)",
    0x73: "BIT 6,(IY+d)",
    0x74: "BIT 6,(IY+d)",
    0x75: "BIT 6,(IY+d)",
    0x76: "BIT 6,(IY+d)",
    0x77: "BIT 6,(IY+d)",
    0x78: "BIT 7,(IY+d)",
    0x79: "BIT 7,(IY+d)",
    0x7A: "BIT 7,(IY+d)",
    0x7B: "BIT 7,(IY+d)",
    0x7C: "BIT 7,(IY+d)",
    0x7D: "BIT 7,(IY+d)",
    0x7E: "BIT 7,(IY+d)",
    0x7F: "BIT 7,(IY+d)",

    0x80: "RES 0,(IY+d),B",
    0x81: "RES 0,(IY+d),C",
    0x82: "RES 0,(IY+d),D",
    0x83: "RES 0,(IY+d),E",
    0x84: "RES 0,(IY+d),H",
    0x85: "RES 0,(IY+d),L",
    0x86: "RES 0,(IY+d)",
    0x87: "RES 0,(IY+d),A",
    0x88: "RES 1,(IY+d),B",
    0x89: "RES 1,(IY+d),C",
    0x8A: "RES 1,(IY+d),D",
    0x8B: "RES 1,(IY+d),E",
    0x8C: "RES 1,(IY+d),H",
    0x8D: "RES 1,(IY+d),L",
    0x8E: "RES 1,(IY+d)",
    0x8F: "RES 1,(IY+d),A",

    0x90: "RES 2,(IY+d),B",
    0x91: "RES 2,(IY+d),C",
    0x92: "RES 2,(IY+d),D",
    0x93: "RES 2,(IY+d),E",
    0x94: "RES 2,(IY+d),H",
    0x95: "RES 2,(IY+d),L",
    0x96: "RES 2,(IY+d)",
    0x97: "RES 2,(IY+d),A",
    0x98: "RES 3,(IY+d),B",
    0x99: "RES 3,(IY+d),C",
    0x9A: "RES 3,(IY+d),D",
    0x9B: "RES 3,(IY+d),E",
    0x9C: "RES 3,(IY+d),H",
    0x9D: "RES 3,(IY+d),L",
    0x9E: "RES 3,(IY+d)",
    0x9F: "RES 3,(IY+d),A",

    0xA0: "RES 4,(IY+d),B",
    0xA1: "RES 4,(IY+d),C",
    0xA2: "RES 4,(IY+d),D",
    0xA3: "RES 4,(IY+d),E",
    0xA4: "RES 4,(IY+d),H",
    0xA5: "RES 4,(IY+d),L",
    0xA6: "RES 4,(IY+d)",
    0xA7: "RES 4,(IY+d),A",
    0xA8: "RES 5,(IY+d),B",
    0xA9: "RES 5,(IY+d),C",
    0xAA: "RES 5,(IY+d),D",
    0xAB: "RES 5,(IY+d),E",
    0xAC: "RES 5,(IY+d),H",
    0xAD: "RES 5,(IY+d),L",
    0xAE: "RES 5,(IY+d)",
    0xAF: "RES 5,(IY+d),A",

    0xB0: "RES 6,(IY+d),B",
    0xB1: "RES 6,(IY+d),C",
    0xB2: "RES 6,(IY+d),D",
    0xB3: "RES 6,(IY+d),E",
    0xB4: "RES 6,(IY+d),H",
    0xB5: "RES 6,(IY+d),L",
    0xB6: "RES 6,(IY+d)",
    0xB7: "RES 6,(IY+d),A",
    0xB8: "RES 7,(IY+d),B",
    0xB9: "RES 7,(IY+d),C",
    0xBA: "RES 7,(IY+d),D",
    0xBB: "RES 7,(IY+d),E",
    0xBC: "RES 7,(IY+d),H",
    0xBD: "RES 7,(IY+d),L",
    0xBE: "RES 7,(IY+d)",
    0xBF: "RES 7,(IY+d),A",

    0xC0: "SET 0,(IY+d),B",
    0xC1: "SET 0,(IY+d),C",
    0xC2: "SET 0,(IY+d),D",
    0xC3: "SET 0,(IY+d),E",
    0xC4: "SET 0,(IY+d),H",
    0xC5: "SET 0,(IY+d),L",
    0xC6: "SET 0,(IY+d)",
    0xC7: "SET 0,(IY+d),A",
    0xC8: "SET 1,(IY+d),B",
    0xC9: "SET 1,(IY+d),C",
    0xCA: "SET 1,(IY+d),D",
    0xCB: "SET 1,(IY+d),E",
    0xCC: "SET 1,(IY+d),H",
    0xCD: "SET 1,(IY+d),L",
    0xCE: "SET 1,(IY+d)",
    0xCF: "SET 1,(IY+d),A",

    0xD0: "SET 2,(IY+d),B",
    0xD1: "SET 2,(IY+d),C",
    0xD2: "SET 2,(IY+d),D",
    0xD3: "SET 2,(IY+d),E",
    0xD4: "SET 2,(IY+d),H",
    0xD5: "SET 2,(IY+d),L",
    0xD6: "SET 2,(IY+d)",
    0xD7: "SET 2,(IY+d),A",
    0xD8: "SET 3,(IY+d),B",
    0xD9: "SET 3,(IY+d),C",
    0xDA: "SET 3,(IY+d),D",
    0xDB: "SET 3,(IY+d),E",
    0xDC: "SET 3,(IY+d),H",
    0xDD: "SET 3,(IY+d),L",
    0xDE: "SET 3,(IY+d)",
    0xDF: "SET 3,(IY+d),A",

    0xE0: "SET 4,(IY+d),B",
    0xE1: "SET 4,(IY+d),C",
    0xE2: "SET 4,(IY+d),D",
    0xE3: "SET 4,(IY+d),E",
    0xE4: "SET 4,(IY+d),H",
    0xE5: "SET 4,(IY+d),L",
    0xE6: "SET 4,(IY+d)",
    0xE7: "SET 4,(IY+d),A",
    0xE8: "SET 5,(IY+d),B",
    0xE9: "SET 5,(IY+d),C",
    0xEA: "SET 5,(IY+d),D",
    0xEB: "SET 5,(IY+d),E",
    0xEC: "SET 5,(IY+d),H",
    0xED: "SET 5,(IY+d),L",
    0xEE: "SET 5,(IY+d)",
    0xEF: "SET 5,(IY+d),A",

    0xF0: "SET 6,(IY+d),B",
    0xF1: "SET 6,(IY+d),C",
    0xF2: "SET 6,(IY+d),D",
    0xF3: "SET 6,(IY+d),E",
    0xF4: "SET 6,(IY+d),H",
    0xF5: "SET 6,(IY+d),L",
    0xF6: "SET 6,(IY+d)",
    0xF7: "SET 6,(IY+d),A",
    0xF8: "SET 7,(IY+d),B",
    0xF9: "SET 7,(IY+d),C",
    0xFA: "SET 7,(IY+d),D",
    0xFB: "SET 7,(IY+d),E",
    0xFC: "SET 7,(IY+d),H",
    0xFD: "SET 7,(IY+d),L",
    0xFE: "SET 7,(IY+d)",
    0xFF: "SET 7,(IY+d),A",

    0x100: "DISPLACEMENT"
};

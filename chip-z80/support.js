// chip-specific support functions
//
// may override function definitions made previously

chipname='z80';

// DMB: Update this
grChipSize=7000;

ngnd = nodenames['vss'];
npwr = nodenames['vcc'];

nodenamereset = '_reset';

presetLogLists=[
    ['cycle',],
    ['ab','db','_m1','_rd','_wr','_mreq','_iorq','pc'],
    ['af', 'bc', 'de', 'hl', 'ix', 'iy', 'sp', 'wz', 'ir'],
    ['af2', 'bc2', 'de2', 'hl2', 'State'],
    ['_int','_nmi',nodenamereset],
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
    setLow('clk');
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

function handleBusRead(){
    if(!isNodeHigh(nodenames['_rd'])){
        var a = readAddressBus();
        var d = eval(readTriggers[a]);
        if(d == undefined)
            d = mRead(readAddressBus());
        if(!isNodeHigh(nodenames['_m1']))
            eval(fetchTriggers[d]);
        writeDataBus(d);
    }
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

function readA(){return 0xFF ^ readBits('reg_a', 8);}
function readF(){return 0xFF ^ readBits('reg_f', 8);}
function readB(){return 0xFF ^ readBits('reg_b', 8);}
function readC(){return 0xFF ^ readBits('reg_c', 8);}
function readD(){return 0xFF ^ readBits('reg_d', 8);}
function readE(){return 0xFF ^ readBits('reg_e', 8);}
function readH(){return 0xFF ^ readBits('reg_h', 8);}
function readL(){return 0xFF ^ readBits('reg_l', 8);}
function readI(){return 0xFF ^ readBits('reg_i', 8);}
function readR(){return 0xFF ^ readBits('reg_r', 8);}
function readW(){return 0xFF ^ readBits('reg_w', 8);}
function readZ(){return 0xFF ^ readBits('reg_z', 8);}

function readIX(){return 0xFFFF ^ ((readBits('reg_ixh', 8)<<8) + readBits('reg_ixl', 8));}
function readIY(){return 0xFFFF ^ ((readBits('reg_iyh', 8)<<8) + readBits('reg_iyl', 8));}
function readSP(){return 0xFFFF ^ ((readBits('reg_sph', 8)<<8) + readBits('reg_spl', 8));}
function readPC(){return 0xFFFF ^ ((readBits('reg_pch', 8)<<8) + readBits('reg_pcl', 8));}
function readPCL(){return 0xFF ^ readBits('reg_pcl', 8);}
function readPCH(){return 0xFF ^ readBits('reg_pch', 8);}

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

function busToHexInv(busname){
    var value=busToHex(busname)
    if (typeof value != "undefined")
        return value.replace(/./g,function(x){return (15-parseInt(x,16)).toString(16)});
    else
        return undefined;;
}

function busToString(busname){
    // takes a signal name or prefix
    // returns an appropriate string representation
    // some 'signal names' are CPU-specific aliases to user-friendly string output
    if(busname=='cycle')
        return cycle>>1;
    if(busname=='af')
        return busToHexInv('reg_a') + busToHexInv('reg_f');
    if(busname=='bc')
        return busToHexInv('reg_b') + busToHexInv('reg_c');
    if(busname=='de')
        return busToHexInv('reg_d') + busToHexInv('reg_e');
    if(busname=='hl')
        return busToHexInv('reg_h') + busToHexInv('reg_l');
    if(busname=='af2')
        return busToHexInv('reg_aa') + busToHexInv('reg_ff');
    if(busname=='bc2')
        return busToHexInv('reg_bb') + busToHexInv('reg_cc');
    if(busname=='de2')
        return busToHexInv('reg_dd') + busToHexInv('reg_ee');
    if(busname=='hl2')
        return busToHexInv('reg_hh') + busToHexInv('reg_ll');
    if(busname=='ir')
        return busToHexInv('reg_i') + busToHexInv('reg_r');
    if(busname=='wz')
        return busToHexInv('reg_w') + busToHexInv('reg_z');
    if(busname=='pc')
        return busToHexInv('reg_pch') + busToHexInv('reg_pcl');
    if(busname=='sp')
        return busToHexInv('reg_sph') + busToHexInv('reg_spl');
    if(busname=='ix')
        return busToHexInv('reg_ixh') + busToHexInv('reg_ixl');
    if(busname=='iy')
        return busToHexInv('reg_iyh') + busToHexInv('reg_iyl');
    if(busname=='State')
        return listActiveTCStates();
    // DMB: TODO
    //   if(busname=='Execute')
    //      return disassemblytoHTML(readBits('ir',8));
    //   if(busname=='Fetch')
    //      return !isNodeHigh(nodenames['_m1'])?disassemblytoHTML(readDataBus()):"";
    //   if(busname=='plaOutputs')
    //      // PLA outputs are mostly ^op- but some have a prefix too
    //      //    - we'll allow the x and xx prefix but ignore the #
    //      return listActiveSignals('^([x]?x-)?op-');
    //   if(busname=='DPControl')
    //      return listActiveSignals('^dpc[0-9]+_');
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
        ' A:' + hexByte(readA()) +
        ' F:' + hexByte(readF()) +
        ' B:' + hexByte(readB()) +
        ' C:' + hexByte(readC()) +
        ' D:' + hexByte(readD()) +
        ' E:' + hexByte(readE()) +
        ' H:' + hexByte(readH()) +
        ' L:' + hexByte(readL()) +
        ' I:' + hexByte(readI()) +
        ' R:' + hexByte(readR()) +
        ' W:' + hexByte(readW()) +
        ' Z:' + hexByte(readZ()) +
        ' IX:' + hexWord(readIX()) +
        ' IY:' + hexWord(readIY()) +
        ' SP:' + hexWord(readSP());
    var machine3 =
        'State: ' + busToString('State') +
        'Hz: ' + estimatedHz().toFixed(1);
    if(typeof expertMode != "undefined") {
        machine3 += ' Exec: ' + busToString('Execute'); // no T-state info for 6800 yet
        if(!isNodeHigh(nodenames['_m1']))
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

// DMB: TODO
var disassembly={
    0x00: "nop",
};

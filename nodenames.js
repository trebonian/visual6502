/*
 Copyright (c) 2010 Brian Silverman, Barry Silverman, Ed Spittles, Segher Boessenkool

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

var nodenames ={
res: 159,       // pads: reset
rw: 1156,       // pads: read not write
db0: 1005,      // pads: databus
db1: 82,
db3: 650,
db2: 945,
db5: 175,
db4: 1393,
db7: 1349,
db6: 1591,
ab0: 268,       // pads: address bus
ab1: 451,
ab2: 1340,
ab3: 211,
ab4: 435,
ab5: 736,
ab6: 887,
ab7: 1493,
ab8: 230,
ab9: 148,
ab12: 1237,
ab13: 349,
ab10: 1443,
ab11: 399,
ab14: 672,
ab15: 195,
sync: 539,      // pads
so: 1672,       // pads: set overflow
clk0: 1171,     // pads
clk1out: 1163,  // pads
clk2out: 421,   // pads
rdy: 89,        // pads: ready
nmi: 1297,      // pads: non maskable interrupt
irq: 103,       // pads
vcc: 657,       // pads
vss: 558,       // pads

a0: 737,        // machine state: accumulator
a1: 1234,
a2: 978,
a3: 162,
a4: 727,
a5: 858,
a6: 1136,
a7: 1653,
y0: 64,         // machine state: y index register
y1: 1148,
y2: 573,
y3: 305,
y4: 989,
y5: 615,
y6: 115,
y7: 843,
x0: 1216,       // machine state: x index register
x1: 98,
x2: 1,
x3: 1648,
x4: 85,
x5: 589,
x6: 448,
x7: 777,
pcl0: 1139,     // machine state: program counter low (first storage node)
pcl1: 1022,
pcl2: 655,
pcl3: 1359,
pcl4: 900,
pcl5: 622,
pcl6: 377,
pcl7: 1611,
pclp0: 1227,    // machine state: program counter low (pre-incremented?, second storage node)
pclp1: 1102,
pclp2: 1079,
pclp3: 868,
pclp4: 39,
pclp5: 1326,
pclp6: 731,
pclp7: 536,
pch0: 1670,     // machine state: program counter high (first storage node)
pch1: 292,
pch2: 502,
pch3: 584,
pch4: 948,
pch5: 49,
pch6: 1551,
pch7: 205,
pchp0: 780,     // machine state: program counter high (pre-incremented?, second storage node)
pchp1: 113,
pchp2: 114,
pchp3: 124,
pchp4: 820,
pchp5: 33,
pchp6: 751,
pchp7: 535,
                // machine state: status register (not the storage nodes)
p0: 32,         // C bit of status register (storage node)
p1: 627,        // Z bit of status register (storage node)
p2: 1553,       // I bit of status register (storage node)
p3: 348,        // D bit of status register (storage node)
p4: 1119,       // there is no bit4 in the status register! (not a storage node)
p5: -1,         // there is no bit5 in the status register! (not a storage node)
p6: 77,         // V bit of status register (storage node)
p7: 1370,       // N bit of status register (storage node)

                // internal bus: status register outputs for push P
Pout0: 687,
Pout1: 1444,
Pout2: 1421,
Pout3: 439,
Pout4: 1119,    // there is no bit4 in the status register!
Pout5: -1,      // there is no bit5 in the status register!
Pout6: 77,
Pout7: 1370,

s0: 1403,       // machine state: stack pointer
s1: 183,
s2: 81,
s3: 1532,
s4: 1702,
s5: 1098,
s6: 1212,
s7: 1435,
ir0: 328,       // internal state: instruction register
ir1: 1626,
ir2: 1384,
ir3: 1576,
ir4: 1112,
ir5: 1329,      // ir5 distinguishes branch set from branch clear
ir6: 337,
ir7: 1328,
notir0: 194,    // internal signal: instruction register inverted outputs
notir1: 702,
notir2: 1182,  
notir3: 1125,  
notir4: 26,
notir5: 1394,
notir6: 895,
notir7: 1320,
irline3: 996,   // internal signal: PLA input - ir0 AND ir1
clock1: 1536,   // internal state: timing control aka #T0
clock2: 156,    // internal state: timing control aka #T+
t2: 971,        // internal state: timing control
t3: 1567,
t4: 690,
t5: 909,
nots0: 418,     // datapath state: not stack pointer
nots1: 1064,
nots2: 752,
nots3: 828,
nots4: 1603,
nots5: 601,
nots6: 1029,
nots7: 181,
notidl0: 116,   // datapath state: internal data latch (first storage node)
notidl1: 576,
notidl2: 1485,
notidl3: 1284,
notidl4: 1516,
notidl5: 498,
notidl6: 1537,
notidl7: 529,
idl0: 1597,     // datapath signal: internal data latch (driven output)
idl1: 870,
idl2: 1066,
idl3: 464,
idl4: 1306,
idl5: 240,
idl6: 1116,
idl7: 391,
sb0: 54,        // datapath bus: special bus
sb1: 1150,
sb2: 1287,
sb3: 1188,
sb4: 1405,
sb5: 166,
sb6: 1336,
sb7: 1001,
notalu0: 394,   // datapath state: alu output storage node (inverse) aka #ADD0
notalu1: 697,
notalu2: 276,
notalu3: 495,
notalu4: 1490,
notalu5: 893,
notalu6: 68,
notalu7: 1123,
alu0: 401,      // datapath signal: ALU output aka ADD0out
alu1: 872,
alu2: 1637,
alu3: 1414,
alu4: 606,
alu5: 314,
alu6: 331,
alu7: 765,
		// datapath signal: decimally adjusted special bus
dasb0: 54,      // same node as sb0
dasb1: 1009,
dasb2: 450,
dasb3: 1475,
dasb4: 1405,    // same node as sb4
dasb5: 263,
dasb6: 679,
dasb7: 1494,
adl0: 413,      // internal bus: address low
adl1: 1282,
adl2: 1242,
adl3: 684,
adl4: 1437,
adl5: 1630,
adl6: 121,
adl7: 1299,
adh0: 407,      // internal bus: address high
adh1: 52,
adh2: 1651,
adh3: 315,
adh4: 1160,
adh5: 483,
adh6: 13,
adh7: 1539,
idb0: 1108,     // internal bus: data bus
idb1: 991,
idb2: 1473,
idb3: 1302,
idb4: 892,
idb5: 1503,
idb6: 833,
idb7: 493,
notdor0: 222,   // internal state: data output register (storage node)
notdor1: 527,
notdor2: 1288,
notdor3: 823,
notdor4: 873,
notdor5: 1266,
notdor6: 1418,
notdor7: 158,
dor0: 97,       // internal signal: data output register
dor1: 746,
dor2: 1634,
dor3: 444,
dor4: 1088,
dor5: 1453,
dor6: 1415,
dor7: 63,
"pd0.clearIR": 1622,       // internal state: predecode register output (anded with not ClearIR)
"pd1.clearIR": 809,
"pd2.clearIR": 1671,
"pd3.clearIR": 1587,
"pd4.clearIR": 540,
"pd5.clearIR": 667,
"pd6.clearIR": 1460,
"pd7.clearIR": 1410,
pd0: 758,       // internal state: predecode register (storage node)
pd1: 361,
pd2: 955,
pd3: 894,
pd4: 369,
pd5: 829,
pd6: 1669,
pd7: 1690,
                // internal signals: predecode latch partial decodes
"PD-xxxx10x0": 1019,
"PD-1xx000x0": 1294,
"PD-0xx0xx0x": 365,
"PD-xxx010x1": 302,
"PD-n-0xx0xx0x": 125,
"#TWOCYCLE": 851,
"#TWOCYCLE.phi1": 792,
"ONEBYTE": 778,

abl0: 1096,     // internal bus: address bus low latched data out (inverse of inverted storage node)
abl1: 376,
abl2: 1502,
abl3: 1250,
abl4: 1232,
abl5: 234,
abl6: 178,
abl7: 178,
"#ABL0": 153,   // internal state: address bus low latched data out (storage node, inverted)
"#ABL1": 107,
"#ABL2": 707,
"#ABL3": 825,
"#ABL4": 364,
"#ABL5": 1513,
"#ABL6": 1307,
"#ABL7": 28,
abh0: 1429,     // internal bus: address bus high latched data out (inverse of inverted storage node)
abh1: 713,
abh2: 287,
abh3: 422,
abh4: 1143,
abh5: 775,
abh6: 997,
abh7: 489,
"#ABH0": 1062,  // internal state: address bus high latched data out (storage node, inverted)
"#ABH1": 907,
"#ABH2": 768,
"#ABH3": 92,
"#ABH4": 668,
"#ABH5": 1128,
"#ABH6": 289,
"#ABH7": 429,

notRdy0: 248,   // internal signal: global pipeline control
Reset0: 67,     // internal signal: retimed reset from pin
C1x5Reset: 926, // retimed and pipelined reset in progress
notRnWprepad: 187, // internal signal: to pad, yet to be inverted and retimed
RnWstretched: 353, // internal signal: control datapad output drivers, aka TRISTATE
"#DBE": 1035,      // internal signal: formerly from DBE pad (6501)
cp1: 710,       // internal signal: clock phase 1
cclk: 943,      // unbonded pad: internal non-overlappying phi2
fetch: 879,     // internal signal
clearIR: 1077,  // internal signal
D1x1: 827,      // internal signal: interrupt handler related
H1x1: 1042,     // internal signal: drive status byte onto databus
"brk-done": 1382,  // internal signal: interrupt handler related
INTG: 1350,     // internal signal: interrupt handler related

                // internal signal: pla outputs block 1 (west/left edge of die)
                // often 130 pla outputs are mentioned - we have 131 here
"op-sty/cpy-mem": 1601,        // pla0
"op-T3-ind-y": 60,             // pla1
"op-T2-abs-y": 1512,           // pla2
"op-T0-iny/dey": 382,          // pla3
"x-op-T0-tya": 1173,           // pla4
"op-T0-cpy/iny": 1233,         // pla5

                // internal signal: pla outputs block 2
"op-T2-idx-x-xy": 258,         // pla6
"op-xy": 1562,                 // pla7
"op-T2-ind-x": 84,             // pla8
"x-op-T0-txa": 1543,           // pla9
"op-T0-dex": 76,               // pla10
"op-T0-cpx/inx": 1658,         // pla11
"op-from-x": 1540,             // pla12
"op-T0-txs": 245,              // pla13
"op-T0-ldx/tax/tsx": 985,      // pla14
"op-T+-dex": 786,              // pla15
"op-T+-inx": 1664,             // pla16
"op-T0-tsx": 682,              // pla17
"op-T+-iny/dey": 1482,         // pla18
"op-T0-ldy-mem": 665,          // pla19
"op-T0-tay/ldy-not-idx": 286,  // pla20

                // internal signal: pla outputs block 3
                // not pla, feed through
"op-T0-jsr": 271,              // pla21
"op-T5-brk": 370,              // pla22
"op-T0-php/pha": 552,          // pla23
"op-T4-rts": 1612,             // pla24
"op-T3-plp/pla": 1487,         // pla25
"op-T5-rti": 784,              // pla26
"op-ror": 244,                 // pla27
"op-T2": 788,                  // pla28
"op-T0-eor": 1623,             // pla29
"op-jmp": 764,                 // pla30
"op-T2-abs": 1057,             // pla31
"op-T0-ora": 403,              // pla32
"op-T2-ADL/ADD":204,           // pla33 
"op-T0":1273,                  // pla34 
"op-T2-stack":1582,            // pla35 
"op-T3-stack/bit/jmp":1031,    // pla36 

                // internal signal: pla outputs block 4
"op-T4-brk/jsr":804,           //  pla37
"op-T4-rti":1311,              //  pla38
"op-T3-ind-x":1428,            //  pla39
"op-T4-ind-y":492,             //  pla40
"op-T2-ind-y":1204,            //  pla41
"op-T3-abs-idx":58,            //  pla42
"op-plp/pla":1520,             //  pla43
"op-inc/nop":324,              //  pla44
"op-T4-ind-x":1259,            //  pla45
"x-op-T3-ind-y":342,           //  pla46
"op-rti/rts":857,              //  pla47
"op-T2-jsr":712,               //  pla48
"op-T0-cpx/cpy/inx/iny":1337,  //  pla49
"op-T0-cmp":1355,              //  pla50
"op-T0-sbc":787,               //  pla51   //  52:111XXXXX  1  0  T0SBC
"op-T0-adc/sbc":575,           //  pla52   //  51:X11XXXXX  1  0  T0ADCSBC
"op-rol/ror":1466,             //  pla53

                // internal signal: pla outputs block 5
"op-T3-jmp":1381,              //  pla54
"op-shift":546,                //  pla55
"op-T5-jsr":776,               //  pla56
"op-T2-stack-access":157,      //  pla57
"op-T0-tya":257,               //  pla58
"op-T+-ora/and/eor/adc":1243,  //  pla59
"op-T+-adc/sbc":822,           //  pla60
"op-T+-shift-a":1324,          //  pla61
"op-T0-txa":179,               //  pla62
"op-T0-pla":131,               //  pla63
"op-T0-lda":1420,              //  pla64
"op-T0-acc":1342,              //  pla65
"op-T0-tay":4,                 //  pla66
"op-T0-shift-a":1396,          //  pla67
"op-T0-tax":167,               //  pla68
"op-T0-bit":303,               //  pla69
"op-T0-and":1504,              //  pla70
"op-T4-abs-idx":354,           //  pla71
"op-T5-ind-y":1168,            //  pla72

                // internal signal: pla outputs block 6
"op-branch-done":1721,         //  pla73    // has extra non-pla input
"op-T2-pha":1086,              //  pla74
"op-T0-shift-right-a":1074,    //  pla75
"op-shift-right":1246,         //  pla76
"op-T2-brk":487,               //  pla77
"op-T3-jsr":579,               //  pla78
"op-sta/cmp":145,              //  pla79
"op-T2-branch":1239,           //  pla80      //  T2BR, 83 for Balazs
"op-T2-zp/zp-idx":285,         //  pla81
                // not pla, feed through
                // not pla, feed through
"op-T2-ind":1524,              //  pla82
"op-T2-abs-access":273,        //  pla83      // has extra pulldown: pla97
"op-T5-rts":0,                 //  pla84
"op-T4":341,                   //  pla85
"op-T3":120,                   //  pla86
"op-T0-brk/rti":1478,          //  pla87
"op-T0-jmp":594,               //  pla88
"op-T5-ind-x":1210,            //  pla89
"op-T3-abs/idx/ind":677,       //  pla90      // has extra pulldown: pla97

                // internal signal: pla outputs block 7
"x-op-T4-ind-y":461,           //  pla91
"x-op-T3-abs-idx":447,         //  pla92
"op-T3-branch":660,            //  pla93
"op-brk/rti":1557,             //  pla94
"op-jsr":259,                  //  pla95
"x-op-jmp":1052,               //  pla96
                // gap
"op-push/pull":791,            //  pla97      // feeds into pla83 and pla90 (no normal pla output)
"op-store":517,                //  pla98
"op-T4-brk":352,               //  pla99
"op-T2-php":750,               //  pla100
"op-T2-php/pha":932,           //  pla101
"op-T4-jmp":1589,              //  pla102
                // gap
"op-T5-rti/rts":446,           //  pla103
"xx-op-T5-jsr":528,            //  pla104

                // internal signal: pla outputs block 8
"op-T2-jmp-abs":309,           //  pla105
"x-op-T3-plp/pla":1430,        //  pla106
"op-lsr/ror/dec/inc":53,       //  pla107
"op-asl/rol":691,              //  pla108
"op-T0-cli/sei":1292,          //  pla109
                // gap
"op-T+-bit":1646,              //  pla110
"op-T0-clc/sec":1114,          //  pla111
"op-T3-mem-zp-idx":904,        //  pla112
"x-op-T+-adc/sbc":1155,        //  pla113
"x-op-T0-bit":1476,            //  pla114
"op-T0-plp":1226,              //  pla115
"x-op-T4-rti":1569,            //  pla116
"op-T+-cmp":301,               //  pla117
"op-T+-cpx/cpy-abs":950,       //  pla118
"op-T+-asl/rol-a":1665,        //  pla119

                // internal signal: pla outputs block 9
"op-T+-cpx/cpy-imm/zp":1710,   //  pla120
"x-op-push/pull":1050,         //  pla121    // feeds into pla130 (no normal pla output)
"op-T0-cld/sed":1419,          //  pla122
"#op-branch-bit6":840,         //  pla123    // IR bit6 used only to detect branch type
"op-T3-mem-abs":607,           //  pla124
"op-T2-mem-zp":219,            //  pla125
"op-T5-mem-ind-idx":1385,      //  pla126
"op-T4-mem-abs-idx":281,       //  pla127
"#op-branch-bit7":1174,        //  pla128    // IR bit7 used only to detect branch type
"op-clv":1164,                 //  pla129
"op-implied":1006,             //  pla130    // has extra pulldowns: pla121 and ir0

// internal signals: derived from pla outputs
"#op-branch-done": 1048,
"op-ANDS": 1228,
"op-EORS": 1689,
"op-ORS": 522,
"op-SUMS": 1196,
"op-SRS": 934,
"#op-store": 925,
"#WR": 1352,
"op-rmw": 434,
"short-circuit-idx-add": 1185,
"#op-set-C": 252,

// internal signals: control signals
nnT2BR: 967,    // doubly inverted
BRtaken: 1544,  // aka #TAKEN

// interrupt and vector related
NMIP: 1032,
VEC0: 1465,
VEC1: 1481,
"#VEC": 1134,

// internal state: misc pipeline state clocked by cclk (phi2)
"pipe#VEC": 1431,     // latched #VEC
"pipeT-SYNC": 537,
pipeT2out: 40,
pipeT3out: 706,
pipeT4out: 1373,
pipeT5out: 940,
pipeBRtaken: 832,
pipeUNK01: 1530,
pipeUNK02: 974,
pipeUNK03: 1436,
pipeUNK04: 99,
pipeUNK05: 44,
pipeUNK06: 443,
pipeUNK07: 215,
pipeUNK08: 338,
pipeUNK09: 199,
pipeUNK10: 215,
pipeUNK11: 1011,
pipeUNK12: 1283,
pipeUNK13: 1442,
pipeUNK14: 1607,
pipeUNK15: 1577, // inverse of H1x1, write P onto idb (PHP, interrupt)
pipeUNK16: 1051,
pipeUNK17: 1078,
pipeUNK18: 899,
pipeUNK19: 832,
pipeUNK20: 294,
pipeUNK21: 1176,
pipeUNK22: 561, // becomes dpc22
pipeUNK23: 596,
pipephi2Reset0: 449,
pipephi2Reset0x: 1036, // a second copy of the same latch
pipeUNK26: 1321,
pipeUNK27: 73,
pipeUNK28: 685,
pipeUNK29: 1008,
pipeUNK30: 1652,
pipeUNK31: 614,
pipeUNK32: 960,
pipeUNK33: 848,
pipeUNK34: 56,
pipeUNK35: 1713,
pipeUNK36: 729,
pipeUNK37: 197,
"pipe#WR.phi2": 1131,
pipeUNK39: 151,
pipeUNK40: 456,
pipeUNK41: 1438,
pipeUNK42: 1104,
"pipe#T0": 554,   // aka #T0.phi2

// internal state: vector address pulldown control
pipeVectorA0: 357,
pipeVectorA1: 170,
pipeVectorA2: 45,

// internal signals: vector address pulldown control
"0/ADL0": 217,
"0/ADL1": 686,
"0/ADL2": 1193,

// internal state: datapath control drivers
pipedpc28: 683,

// internal signals: alu internal (private) busses
alua0: 1167,
alua1: 1248,
alua2: 1332,
alua3: 1680,
alua4: 1142,
alua5: 530,
alua6: 1627,
alua7: 1522,
alub0: 977,
alub1: 1432,
alub2: 704,
alub3: 96,
alub4: 1645,
alub5: 1678,
alub6: 235,
alub7: 1535,

// alu carry chain and decimal mode
C01: 1285,
C12: 505,
C23: 1023,
C34: 78,
C45: 142,
C56: 500,
C67: 1314,
C78: 808,
"C78.phi2": 560,
DC34: 1372,   // lower nibble decimal carry
DC78: 333,    // carry for decimal mode
"DC78.phi2": 164,
"#C01": 1506,
"#C12": 1122,
"#C23": 1003,
"#C34": 1425,
"#C45": 1571,
"#C56": 427,
"#C67": 592,
"#C78": 1327,
"DA-C01": 623,
"DA-AB2": 216,
"DA-AxB2": 516,
"DA-C45": 1144,
"#DA-ADD1": 901,
"#DA-ADD2": 699,

// misc alu internals
"#(AxBxC)0": 371,
"#(AxBxC)1": 965,
"#(AxBxC)2": 22,
"#(AxBxC)3": 274,
"#(AxBxC)4": 651,
"#(AxBxC)5": 486,
"#(AxBxC)6": 1197,
"#(AxBxC)7": 532,
AxB1: 425,
AxB3: 640,
AxB5: 1220,
AxB7: 1241,
"#(AxB)0": 1525,
"#(AxB)2": 701,
"#(AxB)4": 308,
"#(AxB)6": 1459,
"(AxB)0.#C0in": 555,
"(AxB)2.#C12": 193,
"(AxB)4.#C34": 65,
"(AxB)6.#C56": 174,
"#(AxB1).C01": 295,
"#(AxB3).C23": 860,
"#(AxB5).C45": 817,
"#(AxB7).C67": 1217,
"A+B1": 1021,
"A+B3": 1313,
"A+B5": 1236,
"A+B7": 117,

aluanorb0: 143,
aluanandb0: 1628,
aluaorb0: 693,
notaluoutmux0: 957,   // alu result latch input

aluanorb1: 155,
aluanandb1: 841,
aluaorb1: 1021,
notaluoutmux1: 250,   // alu result latch input

// internal signals: datapath control signals

"ADL/ABL": 639,      // load ABL latches from ADL bus
"ADH/ABH": 821,      // load ABH latches from ADH bus

dpc0_YSB: 801,       // drive sb from y
dpc1_SBY: 325,       // load y from sb
dpc2_XSB: 1263,      // drive sb from x
dpc3_SBX: 1186,      // load x from sb
dpc4_SSB: 1700,      // drive sb from stack pointer
dpc5_SADL: 1468,     // drive adl from stack pointer
dpc6_SBS: 874,       // load stack pointer from sb
dpc7_SS: 654,        // recirculate stack pointer
dpc8_nDBADD: 1068,   // alu b side: select not-idb input
dpc9_DBADD: 859,     // alu b side: select idb input

dpc10_ADLADD: 437,   // alu b side: select adl input
dpc11_SBADD: 549,    // alu a side: select sb
dpc12_0ADD: 984,     // alu a side: select zero
dpc13_ORS: 59,       // alu op: a or b
dpc14_SRS: 362,      // alu op: logical right shift
dpc15_ANDS: 574,     // alu op: a and b
dpc16_EORS: 1666,    // alu op: a xor b (?)
dpc17_SUMS: 921,     // alu op: a plus b (?)
alucin: 910,         // alu carry in
notalucin: 1165,
"dpc18_#DAA": 1201,  // decimal related (inverted)
dpc19_ADDSB7: 214,   // alu to sb bit 7 only

dpc20_ADDSB06: 129,  // alu to sb bits 6-0 only
dpc21_ADDADL: 1015,  // alu to adl
alurawcout: 808,     // alu raw carry out (no decimal adjust)
notalucout: 412,     // alu carry out (inverted)
alucout: 1146,       // alu carry out (latched by phi2)
notaluvout: 1308,    // alu overflow out
aluvout: 938,        // alu overflow out (latched by phi2)

"#DBZ": 1268,   // internal signal: not (databus is zero)
DBZ: 744,       // internal signal: databus is zero
DBNeg: 1200,    // internal signal: databus is negative (top bit of db) aka P-#DB7in

"dpc22_#DSA": 725,   // decimal related/SBC only (inverted)
dpc23_SBAC: 534,     // (optionalls decimal-adjusted) sb to acc
dpc24_ACSB: 1698,    // acc to sb
dpc25_SBDB: 1060,    // sb pass-connects to idb (bi-directionally)
dpc26_ACDB: 1331,    // acc to idb
dpc27_SBADH: 140,    // sb pass-connects to adh (bi-directionally)
dpc28_0ADH0: 229,    // zero to adh0 bit0 only
dpc29_0ADH17: 203,   // zero to adh bits 7-1 only

dpc30_ADHPCH: 48,    // load pch from adh
dpc31_PCHPCH: 741,   // load pch from pch incremented
dpc32_PCHADH: 1235,  // drive adh from pch incremented
dpc33_PCHDB: 247,    // drive idb from pch incremented
dpc34_PCLC: 1704,    // pch carry in and pcl FF detect?
dpc35_PCHC: 1334,    // pcl 0x?F detect - half-carry
dpc36_IPC: 379,      // pcl carry in
dpc37_PCLDB: 283,    // drive idb from pcl incremented
dpc38_PCLADL: 438,   // drive adl from pcl incremented
dpc39_PCLPCL: 898,   // load pcl from pcl incremented

dpc40_ADLPCL: 414,   // load pcl from adl
"dpc41_DL/ADL": 1564,// pass-connect adl to mux node driven by idl
"dpc42_DL/ADH": 41,  // pass-connect adh to mux node driven by idl
"dpc43_DL/DB": 863,  // pass-connect idb to mux node driven by idl

}

/* many bus names taken from Donald F. Hanson's block diagram, found
 * http://www.weihenstephan.org/~michaste/pagetable/6502/6502.jpg
 * from his paper "A VHDL conversion tool for logic equations with embedded D latches"
 * http://portal.acm.org/citation.cfm?id=1275143.1275151
 * also available at
 * http://www.ncsu.edu/wcae/WCAE1/hanson.pdf
 */

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
pclp0: 526,     // machine state: program counter low (pre-incremented?, second storage node)
pclp1: 1102,
pclp2: 1411,
pclp3: 868,
pclp4: 15,
pclp5: 1326,
pclp6: 993,
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
pchp1: 126,
pchp2: 114,
pchp3: 1061,
pchp4: 820,
pchp5: 469,
pchp6: 751,
pchp7: 663,
p0: 687,        // machine state: status register
p1: 1444,
p2: 1421,
p3: 439,
p4: 1119,       // there is no bit4 in the status register!
p5: 999999,     // there is no bit5 in the status register!
p6: 77,
p7: 1370,
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
ir5: 1329,
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
clock1: 156,    // internal state: timing control
clock2: 1536,   // internal state: timing control
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
notalu0: 394,      // datapath state: alu output storage node (inverse)
notalu1: 697,
notalu2: 276,
notalu3: 495,
notalu4: 1490,
notalu5: 893,
notalu6: 68,
notalu7: 1123,
alu0: 401,      // datapath signal: ALU output
alu1: 872,
alu2: 1637,
alu3: 1414,
alu4: 606,
alu5: 314,
alu6: 331,
alu7: 765,
adl0: 413,      // internal state: address latch low
adl1: 1282,
adl2: 1242,
adl3: 684,
adl4: 1437,
adl5: 1630,
adl6: 121,
adl7: 1299,
adh0: 407,      // internal state: address latch high
adh1: 52,
adh2: 1651,
adh3: 315,
adh4: 1160,
adh5: 483,
adh6: 13,
adh7: 1539,
idb0: 1108,     // internal state: data buffer
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
pd0: 758,       // internal state: predecode register
pd1: 361,
pd2: 955,
pd3: 894,
pd4: 369,
pd5: 829,
pd6: 1669,
pd7: 1690,
notRdy0: 248,   // internal signal: global pipeline control
cp1: 710,       // internal signal: clock phase 1
cclk: 943,      // unbonded pad: internal non-overlappying phi2
fetch: 879,     // internal signal
clearIR: 1077,  // internal signal
D1x1: 827,      // internal signal: interrupt handler related
H1x1: 1042,     // internal signal: drive status byte onto databus

                // internal signal: pla outputs block 1 (west/left edge of die)
pla0: 1601,
pla1: 60,
pla2: 1512,
pla3: 382,
pla4: 1173,
pla5: 1233,

                // internal signal: pla outputs block 2
pla6: 258,
pla7: 1562,
pla8: 84,
pla9: 1543,
pla10: 76,
pla11: 1658,
pla12: 1540,
pla13: 245,
pla14: 985,
pla15: 786,
pla16: 1664,
pla17: 682,
pla18: 1482,
pla19: 665,
pla20: 286,

                // internal signal: pla outputs block 3
                // not pla, feed through
pla21: 271,
pla22: 370,
pla23: 552,
pla24: 1612,
pla25: 1487,
pla26: 784,
pla27: 244,
pla28: 788,
pla29: 1623,
pla30: 764,
pla31: 1057,
pla32: 403,
pla33: 204,
pla34: 1273,
pla35: 1582,
pla36: 1031,

                // internal signal: pla outputs block 4
pla37: 804,
pla38: 1311,
pla39: 1428,
pla40: 492,
pla41: 1204,
pla42: 58,
pla43: 1520,
pla44: 324,
pla45: 1259,
pla46: 342,
pla47: 857,
pla48: 712,
pla49: 1337,
pla50: 1355,
pla51: 787,
pla52: 575,
pla53: 1466,

                // internal signal: pla outputs block 5
pla54: 1381,
pla55: 546,
pla56: 776,
pla57: 157,
pla58: 257,
pla59: 1243,
pla60: 822,
pla61: 1324,
pla62: 179,
pla63: 131,
pla64: 1420,
pla65: 1342,
pla66: 4,
pla67: 1396,
pla68: 167,
pla69: 303,
pla70: 1504,
pla71: 354,
pla72: 1168,

                // internal signal: pla outputs block 6
pla73: 1721,    // has extra non-pla input
pla74: 1086,
pla75: 1074,
pla76: 1246,
pla77: 487,
pla78: 579,
pla79: 145,
pla80: 1239,
pla81: 285,
                // not pla, feed through
                // not pla, feed through
pla82: 1524,
pla83: 273,     // has extra pulldown: pla100
pla84: 0,
pla85: 341,
pla86: 120,
pla87: 1478,
pla88: 594,
pla89: 1210,
pla90: 677,     // has extra pulldown: pla100

                // internal signal: pla outputs block 7
pla91: 461,
pla92: 447,
pla93: 660,
pla94: 1557,
pla95: 259,
pla96: 1052,
                // gap
pla97: 791,     // feeds into pla86 and pla93
pla98: 517,
pla99: 352,
pla100: 750,
pla101: 932,
pla102: 1589,
                // gap
pla103: 446,
pla104: 528,

                // internal signal: pla outputs block 8
pla105: 309,
pla106: 1430,
pla107: 53,
pla108: 691,
pla109: 1292,
                // gap
pla110: 1646,
pla111: 1114,
pla112: 904,
pla113: 1155,
pla114: 1476,
pla115: 1226,
pla116: 1569,
pla117: 301,
pla118: 950,
pla119: 1665,

                // internal signal: pla outputs block 9
pla120: 1710,
pla121: 1050,   // feeds into pla130 (no normal pla output)
pla122: 840,
pla123: 607,
pla124: 219,
pla125: 1385,
pla126: 281,
pla127: 1174,
pla128: 1164,
pla129: 1006,   // has extra pulldowns: pla122 and ir0

// internal signals: alu internal (private) busses
alua0: 1167,
alub0: 977,
aluanorb0: 143,
aluanandb0: 1628,
aluaorb0: 693,
notaluoutmux0: 957,   // alu result latch input

alua1: 1248,
alub1: 1432,
aluanorb1: 155,
aluanandb1: 841,
aluaorb1: 1021,
notaluoutmux1: 250,   // alu result latch input

// internal signals: datapath control signals
dpc0: 801,      // drive sb from y
dpc1: 325,      // load y from sb
dpc2: 1263,     // drive sb from x
dpc3: 1186,     // load x from sb
dpc4: 1700,     // drive sb from stack pointer
dpc5: 1468,     // drive adl from stack pointer
dpc6: 874,      // load stack pointer from sb
dpc7: 654,      // recirculate stack pointer
dpc8: 1068,     // alu b side: select not-idb input
dpc9: 859,      // alu b side: select idb input

dpc10: 437,     // alu b side: select adl input
dpc11: 549,     // alu a side: select sb
dpc12: 984,     // alu a side: select zero
dpc13: 59,      // alu op: a or b
dpc14: 362,     // alu op: logical right shift
dpc15: 574,     // alu op: a and b
dpc16: 1666,    // alu op: a xor b (?)
dpc17: 921,     // alu op: a plus b (?)
notalucin: 1165,  // alu carry in
dpc18: 1201,    // decimal related? bits 7 and 3 only
dpc19: 214,     // alu to sb bit 7 only

dpc20: 129,     // alu to sb bits 6-0 only
dpc21: 1015,    // alu to adl
dpc22: 725,     // decimal related? bits 3 and 4 only
dpc23: 534,     // sb to acc
dpc24: 1698,    // acc to sb
dpc25: 1060,    // sb pass-connects to idb
dpc26: 1331,    // acc to idb
dpc27: 140,     // sb pass-connects to adh
dpc28: 229,     // zero to adh0 bit0 only
dpc29: 203,     // zero to adh bits 7-1 only

dpc30: 48,      // load pch from adh
dpc31: 741,     // load pch from pch incremented
dpc32: 1235,    // drive adh from pch incremented
dpc33: 247,     // drive idb from pch incremented
dpc34: 1704,    // pch carry in and pcl FF detect?
dpc35: 1334,    // pcl 0x?F detect - half-carry
dpc36: 379,     // pcl carry in
dpc37: 283,     // drive idb from pcl incremented
dpc38: 438,     // drive adl from pcl incremented
dpc39: 898,     // load pcl from pcl incremented

dpc40: 414,     // load pcl from adl
dpc41: 1564,    // pass-connect adl to mux node driven by idl
dpc42: 41,      // pass-connect adh to mux node driven by idl
dpc43: 863,     // pass-connect idb to mux node driven by idl
}

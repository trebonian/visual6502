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
pcl0: 1139,     // machine state: program counter low (first storage node output)
pcl1: 1022,
pcl2: 655,
pcl3: 1359,
pcl4: 900,
pcl5: 622,
pcl6: 377,
pcl7: 1611,
pclp0: 488,    // machine state: program counter low (pre-incremented?, second storage node)
pclp1: 976,
pclp2: 481,
pclp3: 723,
pclp4: 208,
pclp5: 72,
pclp6: 1458,
pclp7: 1647,
"#pclp0": 1227,    // machine state: program counter low (pre-incremented?, inverse second storage node)
"~pclp0": 1227,     // automatic alias replacing hash with tilde
"#pclp1": 1102,
"~pclp1": 1102, // automatic alias replacing hash with tilde
"#pclp2": 1079,
"~pclp2": 1079, // automatic alias replacing hash with tilde
"#pclp3": 868,
"~pclp3": 868, // automatic alias replacing hash with tilde
"#pclp4": 39,
"~pclp4": 39, // automatic alias replacing hash with tilde
"#pclp5": 1326,
"~pclp5": 1326, // automatic alias replacing hash with tilde
"#pclp6": 731,
"~pclp6": 731, // automatic alias replacing hash with tilde
"#pclp7": 536,
"~pclp7": 536, // automatic alias replacing hash with tilde
pch0: 1670,     // machine state: program counter high (first storage node)
pch1: 292,
pch2: 502,
pch3: 584,
pch4: 948,
pch5: 49,
pch6: 1551,
pch7: 205,
pchp0: 1722,     // machine state: program counter high (pre-incremented?, second storage node output)
pchp1: 209,
pchp2: 1496,
pchp3: 141,
pchp4: 27,
pchp5: 1301,
pchp6: 652,
pchp7: 1206,
"#pchp0": 780,     // machine state: program counter high (pre-incremented?, inverse second storage node)
"~pchp0": 780,      // automatic alias replacing hash with tilde
"#pchp1": 113,
"~pchp1": 113, // automatic alias replacing hash with tilde
"#pchp2": 114,
"~pchp2": 114, // automatic alias replacing hash with tilde
"#pchp3": 124,
"~pchp3": 124, // automatic alias replacing hash with tilde
"#pchp4": 820,
"~pchp4": 820, // automatic alias replacing hash with tilde
"#pchp5": 33,
"~pchp5": 33, // automatic alias replacing hash with tilde
"#pchp6": 751,
"~pchp6": 751, // automatic alias replacing hash with tilde
"#pchp7": 535,
"~pchp7": 535, // automatic alias replacing hash with tilde
                // machine state: status register (not the storage nodes)
p0: 32,         // C bit of status register (storage node)
p1: 627,        // Z bit of status register (storage node)
p2: 1553,       // I bit of status register (storage node)
p3: 348,        // D bit of status register (storage node)
p4: 1119,       // there is no bit4 in the status register! (not a storage node)
p5: -1,         // there is no bit5 in the status register! (not a storage node)
p6: 1625,       // V bit of status register (storage node)
p7: 69,         // N bit of status register (storage node)

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
irline3: 996,   // internal signal: PLA input - ir0 OR ir1
clock1: 1536,   // internal state: timing control aka #T0
clock1: 1536,    // automatic alias replacing hash with tilde
clock2: 156,    // internal state: timing control aka #T+
clock2: 156,     // automatic alias replacing hash with tilde
t2: 971,        // internal state: timing control
t3: 1567,
t4: 690,
t5: 909,
nota0: 5,       // datapath state: not accumulator
nota1: 1549,
nota2: 419,
nota3: 947,
nota4: 556,
nota5: 1719,
nota6: 1356,
nota7: 128,
noty0: 1025,    // datapath state: not Y register
noty1: 1138,
noty2: 1484,
noty3: 184,
noty4: 565,
noty5: 981,
noty6: 1439,
noty7: 1640,
notx0: 987,     // datapath state: not X register
notx1: 1434,
notx2: 890,
notx3: 1521,
notx4: 485,
notx5: 1017,
notx6: 730,
notx7: 1561,
nots0: 418,     // datapath state: not stack pointer
nots1: 1064,
nots2: 752,
nots3: 828,
nots4: 1603,
nots5: 601,
nots6: 1029,
nots7: 181,
"~s0": 983,     // datapath state: not stack pointer (undelayed, cclk latches it into nots0)
"~s1": 1711,
"~s2": 1190,
"~s3": 34,
"~s4": 973,
"~s5": 496,
"~s6": 1187,
"~s7": 548,
aout0: 146,     // datapath signal: accumulator output (drives sb and idb)
aout1: 929,
aout2: 1618,
aout3: 1654,
aout4: 1344,
aout5: 831,
aout6: 326,
aout7: 1592,
yout0: 564,     // datapath signal: Y register output (drives sb)
yout1: 767,
yout2: 1491,
yout3: 1531,
yout4: 658,
yout5: 733,
yout6: 518,
yout7: 1251,
xout0: 1169,    // datapath signal: X register output (drives sb)
xout1: 1709,
xout2: 1694,
xout3: 242,
xout4: 436,
xout5: 578,
xout6: 1724,
xout7: 871,
sout0: 332,     // datapath signal: stack pointer output (drives sb and adl)
sout1: 694,
sout2: 1389,
sout3: 998,
sout4: 3,
sout5: 280,
sout6: 618,
sout7: 721,
"~db0": 718,    // datapath state: databus pad read back (cclk latches it into notidl)
"~db1": 213,
"~db2": 1199,
"~db3": 896,
"~db4": 490,
"~db5": 568,
"~db6": 1638,
"~db7": 588,
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
notalu0: 394,    // automatic alias replacing hash with tilde
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
"~adl0": 123,   // internal bus: address low (inverted)
"~adl1": 1016,
"~adl2": 935,
"~adl3": 1507,
"~adl4": 1519,
"~adl5": 1094,
"~adl6": 1548,
"~adl7": 1046,
"~adl0.phi1": 246, // internal bus: address low (inverted, latched by phi1)
"~adl1.phi1": 416,
"~adl2.phi1": 1636,
"~adl3.phi1": 864,
"~adl4.phi1": 738,
"~adl5.phi1": 463,
"~adl6.phi1": 524,
"~adl7.phi1": 577,
adh0: 407,      // internal bus: address high
adh1: 52,
adh2: 1651,
adh3: 315,
adh4: 1160,
adh5: 483,
adh6: 13,
adh7: 1539,
"~adh0": 1668,  // internal bus: address high (inverted)
"~adh1": 1267,
"~adh2": 168,
"~adh3": 883,
"~adh4": 212,
"~adh5": 254,
"~adh6": 880,
"~adh7": 494,
"~adh0.phi1": 705, // internal bus: address high (inverted, latched by phi1)
"~adh1.phi1": 1298,
"~adh2.phi1": 836,
"~adh3.phi1": 1667,
"~adh4.phi1": 1451,
"~adh5.phi1": 1353,
"~adh6.phi1": 1514,
"~adh7.phi1": 514,
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
"~db0.pre": 769, // internal signal: databus pad driver predriver, feeds both gates below
"~db1.pre": 288,
"~db2.pre": 224,
"~db3.pre": 1613,
"~db4.pre": 1463,
"~db5.pre": 1720,
"~db6.pre": 466,
"~db7.pre": 23,
"db0.up": 1325, // internal signal: databus pad driver pullup gate
"db1.up": 798,
"db2.up": 520,
"db3.up": 42,
"db4.up": 1076,
"db5.up": 373,
"db6.up": 7,
"db7.up": 298,
"db0.dn": 1072, // internal signal: databus pad driver pulldown gate
"db1.dn": 794,
"db2.dn": 37,
"db3.dn": 643,
"db4.dn": 147,
"db5.dn": 612,
"db6.dn": 471,
"db7.dn": 1501,
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
"~TWOCYCLE": 851, // automatic alias replacing hash with tilde
"#TWOCYCLE.phi1": 792,
"~TWOCYCLE.phi1": 792, // automatic alias replacing hash with tilde
"ONEBYTE": 778,

abl0: 1096,     // internal bus: address bus low latched data out (inverse of inverted storage node)
abl1: 376,
abl2: 1502,
abl3: 1250,
abl4: 1232,
abl5: 234,
abl6: 178,
abl7: 567,
"#ABL0": 153,   // internal state: address bus low latched data out (storage node, inverted)
"~ABL0": 153,    // automatic alias replacing hash with tilde
"#ABL1": 107,
"~ABL1": 107, // automatic alias replacing hash with tilde
"#ABL2": 707,
"~ABL2": 707, // automatic alias replacing hash with tilde
"#ABL3": 825,
"~ABL3": 825, // automatic alias replacing hash with tilde
"#ABL4": 364,
"~ABL4": 364, // automatic alias replacing hash with tilde
"#ABL5": 1513,
"~ABL5": 1513, // automatic alias replacing hash with tilde
"#ABL6": 1307,
"~ABL6": 1307, // automatic alias replacing hash with tilde
"#ABL7": 28,
"~ABL7": 28, // automatic alias replacing hash with tilde
"~abl0": 1660,  // internal signal: address pad driver predriver, low byte (~abl0 drives ab0)
"~abl1": 842,
"~abl2": 951,
"~abl3": 990,
"~abl4": 1676,
"~abl5": 172,
"~abl6": 1195,
"~abl7": 1026,
abh0: 1429,     // internal bus: address bus high latched data out (inverse of inverted storage node)
abh1: 713,
abh2: 287,
abh3: 422,
abh4: 1143,
abh5: 775,
abh6: 997,
abh7: 489,
"#ABH0": 1062,  // internal state: address bus high latched data out (storage node, inverted)
"~ABH0": 1062,   // automatic alias replacing hash with tilde
"#ABH1": 907,
"~ABH1": 907, // automatic alias replacing hash with tilde
"#ABH2": 768,
"~ABH2": 768, // automatic alias replacing hash with tilde
"#ABH3": 92,
"~ABH3": 92, // automatic alias replacing hash with tilde
"#ABH4": 668,
"~ABH4": 668, // automatic alias replacing hash with tilde
"#ABH5": 1128,
"~ABH5": 1128, // automatic alias replacing hash with tilde
"#ABH6": 289,
"~ABH6": 289, // automatic alias replacing hash with tilde
"#ABH7": 429,
"~ABH7": 429, // automatic alias replacing hash with tilde
"~abh0": 1315,  // internal signal: address pad driver predriver, high byte (~abh0 drives ab8)
"~abh1": 617,
"~abh2": 1034,
"~abh3": 1346,
"~abh4": 1677,
"~abh5": 1423,
"~abh6": 1523,
"~abh7": 1153,
"ab0.up": 855,  // internal signal: address pad driver pullup gate
"ab1.up": 1479,
"ab2.up": 1152,
"ab3.up": 1041,
"ab4.up": 634,
"ab5.up": 1633,
"ab6.up": 1191,
"ab7.up": 322,
"ab8.up": 826,
"ab9.up": 1140,
"ab10.up": 1545,
"ab11.up": 1296,
"ab12.up": 475,
"ab13.up": 1608,
"ab14.up": 963,
"ab15.up": 1639,
"ab0.dn": 1100, // internal signal: address pad driver pulldown gate
"ab1.dn": 66,
"ab2.dn": 642,
"ab3.dn": 138,
"ab4.dn": 86,
"ab5.dn": 210,
"ab6.dn": 1254,
"ab7.dn": 171,
"ab8.dn": 381,
"ab9.dn": 676,
"ab10.dn": 994,
"ab11.dn": 359,
"ab12.dn": 999,
"ab13.dn": 869,
"ab14.dn": 635,
"ab15.dn": 659,

"branch-back": 626,           // distinguish forward from backward branches
"branch-forward.phi1": 1110,  // distinguish forward from backward branches
"branch-back.phi1": 771,      // distinguish forward from backward branches in IPC logic
notRdy0: 248,           // internal signal: global pipeline control
"notRdy0.phi1": 1272,   // delayed pipeline control
"notRdy0.delay": 770,   // global pipeline control latched by phi1 and then phi2
"#notRdy0.delay": 559,  // global pipeline control latched by phi1 and then phi2 (storage node)
"~notRdy0.delay": 559,   // automatic alias replacing hash with tilde
Reset0: 67,     // internal signal: retimed reset from pin
C1x5Reset: 926, // retimed and pipelined reset in progress
notRnWprepad: 187, // internal signal: to pad, yet to be inverted and retimed
RnWstretched: 353, // internal signal: control datapad output drivers, aka TRISTATE
"#DBE": 1035,      // internal signal: formerly from DBE pad (6501)
"~DBE": 1035,       // automatic alias replacing hash with tilde
cp1: 710,       // internal signal: clock phase 1
cclk: 943,      // unbonded pad: internal non-overlapping phi2
fetch: 879,     // internal signal
clearIR: 1077,  // internal signal
H1x1: 1042,     // internal signal: drive status byte onto databus

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
"~op-branch-bit6":840,          // automatic alias replacing hash with tilde
"op-T3-mem-abs":607,           //  pla124
"op-T2-mem-zp":219,            //  pla125
"op-T5-mem-ind-idx":1385,      //  pla126
"op-T4-mem-abs-idx":281,       //  pla127
"#op-branch-bit7":1174,        //  pla128    // IR bit7 used only to detect branch type
"~op-branch-bit7":1174,         // automatic alias replacing hash with tilde
"op-clv":1164,                 //  pla129
"op-implied":1006,             //  pla130    // has extra pulldowns: pla121 and ir0

// internal signals: derived from pla outputs
"#op-branch-done": 1048,
"~op-branch-done": 1048, // automatic alias replacing hash with tilde
"#op-T3-branch": 1708,
"~op-T3-branch": 1708, // automatic alias replacing hash with tilde
"op-ANDS": 1228,
"op-EORS": 1689,
"op-ORS": 522,
"op-SUMS": 1196,
"op-SRS": 934,
"#op-store": 925,
"~op-store": 925, // automatic alias replacing hash with tilde
"#WR": 1352,
"~WR": 1352, // automatic alias replacing hash with tilde
"op-rmw": 434,
"short-circuit-idx-add": 1185,
"short-circuit-branch-add": 430,
"#op-set-C": 252,
"~op-set-C": 252, // automatic alias replacing hash with tilde

// internal signals: control signals
nnT2BR: 967,    // doubly inverted
"#BRtaken": 1544,  // aka #TAKEN
"~BRtaken": 1544,   // automatic alias replacing hash with tilde

// internal signals and state: interrupt and vector related
// segher says:
//   "P" are the latched external signals.
//   "G" are the signals that actually trigger the interrupt.
//   "NMIL" is to do the edge detection -- it's pretty much just a delayed NMIG.
//   INTG is IRQ and NMI taken together.
IRQP: 675,
"#IRQP": 888,
"~IRQP": 888, // automatic alias replacing hash with tilde
"~nmi": 1392,   // internal signal: nmi pad read back (gates NMIP)
NMIP: 1032,
"#NMIP": 297,
"~NMIP": 297, // automatic alias replacing hash with tilde
"#NMIG": 264,
"~NMIG": 264, // automatic alias replacing hash with tilde
NMIL: 1374,
RESP: 67,
RESG: 926,
"~RESG": 1054,  // internal signal: inverse of RESG
VEC0: 1465,
"~VEC0": 728,   // internal signal: inverse of VEC0
VEC1: 1481,
"#VEC": 1134,
"~VEC": 1134, // automatic alias replacing hash with tilde
D1x1: 827,         // internal signal: interrupt handler related
"brk-done": 1382,  // internal signal: interrupt handler related
INTG: 1350,        // internal signal: interrupt handler related

// internal state: misc pipeline state clocked by cclk (phi2)
"pipe#VEC": 1431,     // latched #VEC
"pipe~VEC": 1431,      // automatic alias replacing hash with tilde
"pipeT-SYNC": 537,
pipeT2out: 40,
pipeT3out: 706,
pipeT4out: 1373,
pipeT5out: 940,
pipeIPCrelated: 832,
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
"pipe~WR.phi2": 1131, // automatic alias replacing hash with tilde
pipeUNK39: 151,
pipeUNK40: 456,
pipeUNK41: 1438,
pipeUNK42: 1104,
"pipe#T0": 554,   // aka #T0.phi2
"pipe~T0": 554,    // automatic alias replacing hash with tilde

// internal state: vector address pulldown control
pipeVectorA0: 357,
pipeVectorA1: 170,
pipeVectorA2: 45,

// internal signals: vector address pulldown control
"0/ADL0": 217,
"0/ADL1": 686,
"0/ADL2": 1193,
"~0/ADL2": 815, // drives 0/ADL2 (inverted)

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
"~C01": 1506, // automatic alias replacing hash with tilde
"#C12": 1122,
"~C12": 1122, // automatic alias replacing hash with tilde
"#C23": 1003,
"~C23": 1003, // automatic alias replacing hash with tilde
"#C34": 1425,
"~C34": 1425, // automatic alias replacing hash with tilde
"#C45": 1571,
"~C45": 1571, // automatic alias replacing hash with tilde
"#C56": 427,
"~C56": 427, // automatic alias replacing hash with tilde
"#C67": 592,
"~C67": 592, // automatic alias replacing hash with tilde
"#C78": 1327,
"~C78": 1327, // automatic alias replacing hash with tilde
"DA-C01": 623,
"DA-AB2": 216,
"DA-AxB2": 516,
"DA-C45": 1144,
"#DA-ADD1": 901,
"~DA-ADD1": 901, // automatic alias replacing hash with tilde
"#DA-ADD2": 699,
"~DA-ADD2": 699, // automatic alias replacing hash with tilde

// misc alu internals
"#(AxBxC)0": 371,
"~(AxBxC)0": 371, // automatic alias replacing hash with tilde
"#(AxBxC)1": 965,
"~(AxBxC)1": 965, // automatic alias replacing hash with tilde
"#(AxBxC)2": 22,
"~(AxBxC)2": 22, // automatic alias replacing hash with tilde
"#(AxBxC)3": 274,
"~(AxBxC)3": 274, // automatic alias replacing hash with tilde
"#(AxBxC)4": 651,
"~(AxBxC)4": 651, // automatic alias replacing hash with tilde
"#(AxBxC)5": 486,
"~(AxBxC)5": 486, // automatic alias replacing hash with tilde
"#(AxBxC)6": 1197,
"~(AxBxC)6": 1197, // automatic alias replacing hash with tilde
"#(AxBxC)7": 532,
"~(AxBxC)7": 532, // automatic alias replacing hash with tilde
AxB1: 425,
AxB3: 640,
AxB5: 1220,
AxB7: 1241,
"#(AxB)0": 1525,
"~(AxB)0": 1525, // automatic alias replacing hash with tilde
"#(AxB)2": 701,
"~(AxB)2": 701, // automatic alias replacing hash with tilde
"#(AxB)4": 308,
"~(AxB)4": 308, // automatic alias replacing hash with tilde
"#(AxB)6": 1459,
"~(AxB)6": 1459, // automatic alias replacing hash with tilde
"(AxB)0.#C0in": 555,
"(AxB)0.~C0in": 555, // automatic alias replacing hash with tilde
"(AxB)2.#C12": 193,
"(AxB)2.~C12": 193, // automatic alias replacing hash with tilde
"(AxB)4.#C34": 65,
"(AxB)4.~C34": 65, // automatic alias replacing hash with tilde
"(AxB)6.#C56": 174,
"(AxB)6.~C56": 174, // automatic alias replacing hash with tilde
"#(AxB1).C01": 295,
"~(AxB1).C01": 295, // automatic alias replacing hash with tilde
"#(AxB3).C23": 860,
"~(AxB3).C23": 860, // automatic alias replacing hash with tilde
"#(AxB5).C45": 817,
"~(AxB5).C45": 817, // automatic alias replacing hash with tilde
"#(AxB7).C67": 1217,
"~(AxB7).C67": 1217, // automatic alias replacing hash with tilde
"#A.B0": 1628,
"~A.B0": 1628, // automatic alias replacing hash with tilde
"#A.B1": 841,
"~A.B1": 841, // automatic alias replacing hash with tilde
"#A.B2": 681,
"~A.B2": 681, // automatic alias replacing hash with tilde
"#A.B3": 350,
"~A.B3": 350, // automatic alias replacing hash with tilde
"#A.B4": 1063,
"~A.B4": 1063, // automatic alias replacing hash with tilde
"#A.B5": 477,
"~A.B5": 477, // automatic alias replacing hash with tilde
"#A.B6": 336,
"~A.B6": 336, // automatic alias replacing hash with tilde
"#A.B7": 1318,
"~A.B7": 1318, // automatic alias replacing hash with tilde
"A.B1": 936,    // true sense; only these four bits have it, 2 is the DA-AB2 above
"A.B3": 988,
"A.B5": 647,
"A.B7": 748,
"A+B0": 693,
"A+B1": 1021,
"A+B2": 110,
"A+B3": 1313,
"A+B4": 918,
"A+B5": 1236,
"A+B6": 803,
"A+B7": 117,
"#(A+B)0": 143,
"~(A+B)0": 143, // automatic alias replacing hash with tilde
"#(A+B)1": 155,
"~(A+B)1": 155, // automatic alias replacing hash with tilde
"#(A+B)2": 1691,
"~(A+B)2": 1691, // automatic alias replacing hash with tilde
"#(A+B)3": 649,
"~(A+B)3": 649, // automatic alias replacing hash with tilde
"#(A+B)4": 404,
"~(A+B)4": 404, // automatic alias replacing hash with tilde
"#(A+B)5": 1632,
"~(A+B)5": 1632, // automatic alias replacing hash with tilde
"#(A+B)6": 1084,
"~(A+B)6": 1084, // automatic alias replacing hash with tilde
"#(A+B)7": 1398,
"~(A+B)7": 1398, // automatic alias replacing hash with tilde
"#(AxB)0": 1525,
"~(AxB)0": 1525, // automatic alias replacing hash with tilde
"#(AxB)2": 701,
"~(AxB)2": 701, // automatic alias replacing hash with tilde
"#(AxB)4": 308,
"~(AxB)4": 308, // automatic alias replacing hash with tilde
"#(AxB)6": 1459,
"~(AxB)6": 1459, // automatic alias replacing hash with tilde
"#(AxB)1": 953,
"~(AxB)1": 953, // automatic alias replacing hash with tilde
"#(AxB)3": 884,
"~(AxB)3": 884, // automatic alias replacing hash with tilde
"#(AxB)5": 1469,
"~(AxB)5": 1469, // automatic alias replacing hash with tilde
"#(AxB)7": 177,
"~(AxB)7": 177, // automatic alias replacing hash with tilde
"#aluresult0": 957,   // alu result latch input
"~aluresult0": 957,    // automatic alias replacing hash with tilde
"#aluresult1": 250,
"~aluresult1": 250, // automatic alias replacing hash with tilde
"#aluresult2": 740,
"~aluresult2": 740, // automatic alias replacing hash with tilde
"#aluresult3": 1071,
"~aluresult3": 1071, // automatic alias replacing hash with tilde
"#aluresult4": 296,
"~aluresult4": 296, // automatic alias replacing hash with tilde
"#aluresult5": 277,
"~aluresult5": 277, // automatic alias replacing hash with tilde
"#aluresult6": 722,
"~aluresult6": 722, // automatic alias replacing hash with tilde
"#aluresult7": 304,
"~aluresult7": 304, // automatic alias replacing hash with tilde

// internal signals: datapath control signals

"ADL/ABL": 639,      // load ABL latches from ADL bus
"dpc-1_ADL/ABL": 639,// alias for DPControl pseudo-bus

"ADH/ABH": 821,      // load ABH latches from ADH bus
"dpc-2_ADH/ABH": 821,// alias for DPControl pseudo-bus
"~ADL/ABL": 190,     // predriver inside the ADL/ABL driver (inverted)
"~ADH/ABH": 610,     // predriver inside the ADH/ABH driver (inverted)

clearDPC: 1247,      // clamps the 18 dpc assert lines every phi1 (inverse of cp1)
"clearDPC.up": 38,   // pullup gate of clearDPC
clearDPCpre: 43,     // clamps the 14 dpc predrivers every phi1 (inverse of cp1)
"clearDPCpre.up": 839, // pullup gate of clearDPCpre

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
C0in: 105,           // alu carry in, buffered (the C0in of (AxB)0.~C0in)
"dpc18_#DAA": 1201,  // decimal related (inverted)
"dpc18_~DAA": 1201,   // automatic alias replacing hash with tilde
dpc19_ADDSB7: 214,   // alu to sb bit 7 only

dpc20_ADDSB06: 129,  // alu to sb bits 6-0 only
dpc21_ADDADL: 1015,  // alu to adl
alurawcout: 808,     // alu raw carry out (no decimal adjust)
notalucout: 412,     // alu carry out (inverted)
alucout: 1146,       // alu carry out (latched by phi2)
"#alucout": 206,
"~alucout": 206, // automatic alias replacing hash with tilde
"##alucout": 465,
"~~alucout": 465, // automatic alias replacing hash with tilde
notaluvout: 1308,    // alu overflow out
aluvout: 938,        // alu overflow out (latched by phi2)
"~aluvout": 1245,    // alu overflow out (inverted)

"#DBZ": 1268,   // internal signal: not (databus is zero)
"~DBZ": 1268,    // automatic alias replacing hash with tilde
DBZ: 744,       // internal signal: databus is zero
DBNeg: 1200,    // internal signal: databus is negative (top bit of db) aka P-#DB7in
DBNeg: 1200,     // automatic alias replacing hash with tilde

"dpc22_#DSA": 725,   // decimal related/SBC only (inverted)
"dpc22_~DSA": 725,    // automatic alias replacing hash with tilde
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
dpc35_PCHC: 1334,    // pch 0x?F detect - half-carry
"dpc36_#IPC": 379,   // pcl carry in (inverted)
"dpc36_~IPC": 379,    // automatic alias replacing hash with tilde
dpc37_PCLDB: 283,    // drive idb from pcl incremented
dpc38_PCLADL: 438,   // drive adl from pcl incremented
dpc39_PCLPCL: 898,   // load pcl from pcl incremented

dpc40_ADLPCL: 414,   // load pcl from adl
"dpc41_DL/ADL": 1564,// pass-connect adl to mux node driven by idl
"dpc42_DL/ADH": 41,  // pass-connect adh to mux node driven by idl
"dpc43_DL/DB": 863,  // pass-connect idb to mux node driven by idl

// ~dpcN_X grounds the gate of dpcN_X's pullup, so it is that line inverted, and
// ~dpcN_X.pre is the stage cclk latches into it. dpc19_ADDSB7 has no pair here:
// its clamp inverts once rather than twice, so the node equals the line instead
"~dpc0_YSB": 1113,
"~dpc1_SBY": 460,
"~dpc1_SBY.pre": 616,
"~dpc2_XSB": 1404,
"~dpc2_XSB.pre": 1106,
"~dpc3_SBX": 459,
"~dpc3_SBX.pre": 844,
"~dpc4_SSB": 621,
"~dpc4_SSB.pre": 1586,
"~dpc5_SADL": 339,
"~dpc5_SADL.pre": 632,
"~dpc6_SBS": 521,
"~dpc6_SBS.pre": 1358,
"~dpc7_SS": 796,
"~dpc7_SS.pre": 396,
"~dpc8_nDBADD": 805,
"~dpc8_nDBADD.pre": 779,
"~dpc9_DBADD": 688,
"~dpc9_DBADD.pre": 1594,
"~dpc10_ADLADD": 1477,
"~dpc10_ADLADD.pre": 604,
"~dpc11_SBADD": 360,
"~dpc11_SBADD.pre": 795,
"~dpc12_0ADD": 1027,
"~dpc12_0ADD.pre": 1649,
"~dpc13_ORS": 95,
"~dpc14_SRS": 226,
"~dpc15_ANDS": 1529,
"~dpc15_ANDS.pre": 1089,
"~dpc16_EORS": 101,
"~dpc17_SUMS": 1674,
"~dpc18_~DAA": 1450,
"~dpc20_ADDSB06": 512,
"~dpc21_ADDADL": 745,
"~dpc23_SBAC": 1505,
"~dpc23_SBAC.pre": 1455,
"~dpc24_ACSB": 55,
"~dpc24_ACSB.pre": 11,
"~dpc25_SBDB": 1527,
"~dpc25_SBDB.pre": 1347,
"~dpc26_ACDB": 266,
"~dpc26_ACDB.pre": 1037,
"~dpc27_SBADH": 1602,
"~dpc27_SBADH.pre": 506,
"~dpc29_0ADH17": 1683,
"~dpc29_0ADH17.pre": 1090,
"~dpc30_ADHPCH": 1162,
"~dpc30_ADHPCH.pre": 272,
"~dpc31_PCHPCH": 1509,
"~dpc31_PCHPCH.pre": 952,
"~dpc32_PCHADH": 598,
"~dpc32_PCHADH.pre": 176,
"~dpc33_PCHDB": 398,
"~dpc33_PCHDB.pre": 824,
"~dpc37_PCLDB": 878,
"~dpc37_PCLDB.pre": 462,
"~dpc38_PCLADL": 897,
"~dpc38_PCLADL.pre": 1211,
"~dpc39_PCLPCL": 509,
"~dpc39_PCLPCL.pre": 442,
"~dpc40_ADLPCL": 265,
"~dpc40_ADLPCL.pre": 182,
"~dpc41_DL/ADL": 1121,
"~dpc41_DL/ADL.pre": 1225,
"~dpc42_DL/ADH": 1020,
"~dpc42_DL/ADH.pre": 1705,
"~dpc43_DL/DB": 1221,
"~dpc43_DL/DB.pre": 104,

}

/* many bus names taken from Donald F. Hanson's block diagram, found
 * http://www.weihenstephan.org/~michaste/pagetable/6502/6502.jpg
 * from his paper "A VHDL conversion tool for logic equations with embedded D latches"
 * http://portal.acm.org/citation.cfm?id=1275143.1275151
 * also available at
 * http://www.ncsu.edu/wcae/WCAE1/hanson.pdf
 */

/*
 Copyright (c) 2011 Ijor, Segher Boessenkool, Ed Spittles

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
gnd: 663,      // pads: ground
vcc: 31,       // pads: power
phi1: 1507,    // pads: phase 1 clock input
phi2: 1511,    // pads: phase 2 clock input
reset: 1461,   // pads: reset
db0: 686,       // pads: data bus
db1: 683,
db2: 677,
db3: 676,
db4: 669,
db5: 670,
db6: 664,
db7: 691,
ab0: 1854,       // pads: address bus
ab1: 1857,
ab2: 1855,
ab3: 1858,
ab4: 1856,
ab5: 1859,
ab6: 1860,
ab7: 1865,
ab8: 1861,
ab9: 1863,
ab10: 1862,
ab11: 1864,
ab12: 1948,
ab13: 1946,
ab14: 1949,
ab15: 1947,
irq: 1496,     // input pads: interrupt request (active low)
nmi: 1501,     // pads: non maskable interrupt (active low)
dbe: 1456,     // pads: data bus enable
halt: 1492,    // pads: halt (active low)
tsc: 1459,     // pads: tristate control
rw: 1965,      // output pads: read / not write
vma: 1971,     // pads: valid memory address
ba: 1964,      // pads: bus available
//

notir0: 1302, // internal state: Instruction Register
notir1: 1290,
notir2: 1296,
notir3: 1297,
notir4: 1298,
notir5: 1299,
notir6: 1278,
notir7: 1279,

ir0: 1271,
ir1: 1269,
ir2: 1268,
ir3: 1267,
ir4: 1265,
ir5: 1264,
ir6: 1263,
ir7: 1261,

// internal control signals
sync: 1528,
}

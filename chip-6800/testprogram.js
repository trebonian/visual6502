// This file testprogram.js can be substituted by one of several tests
testprogramAddress=0x0000;

// we want to auto-clear the console if any output is sent by the program
var consoleboxStream="";

// for opcodes, see ftp://ftp.comlab.ox.ac.uk/pub/Cards/txt/6800.txt

testprogram = [
  0x86, 0x00, 0x9d, 0x10, 0x7e, 0x00, 0x02, 0x08, 0x5a, 0x7c, 0x00,
  0x0f, 0x0d, 0x89, 0x02, 0x39,
]

// Crasm LYB 1.3:                                                   page  1
//                          1  CPU  6800
//                          2  
//   0000                   3  * = 0
//                          4  
//                          5  CODE
//                          6  
// 0000 8600                7  LDAA #$00
// 0002 9D10                8  JSR $0010
// 0004 7E0002              9  JMP $0002
// 0007 08                 10  INX
// 0008 5A                 11  DECB
// 0009 7C000F             12  INC $0F
// 000C 0D                 13  SEC
// 000D 8902               14  ADCA #$02
// 000F 39                 15  RTS
//                         16  
// ERRORS:       0
// WARNINGS:     0
// Successful assembly...
//  Last address        f (15)
//  Code length        20 (32)

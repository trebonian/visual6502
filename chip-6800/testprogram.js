// This file testprogram.js can be substituted by one of several tests
testprogramAddress=0x0000;

// we want to auto-clear the console if any output is sent by the program
var consoleboxStream="";

// for opcodes, see ftp://ftp.comlab.ox.ac.uk/pub/Cards/txt/6800.txt

testprogram = [
  0xce, 0x21, 0x43,  // LDX #4321
  0x35,              // TXS
  0xc6, 0x00,        // LDAA #$00
  0xbd, 0x10, 0x00,  // JSR $0010
  0x7e, 0x02, 0x00,  // JMP $0002
  0x01,
  0x01,
  0x01,              // NOP
  0x01,
  0x08,              // INX
  0x5a,              // DECB
  0x7c, 0x0f, 0x00,  // INC $0F
  0x0d,              // SEC
  0xc9, 0x02,        // ADCA #$02
  0x39,              // RTS
]

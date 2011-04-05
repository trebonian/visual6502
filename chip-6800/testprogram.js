// This file testprogram.js can be substituted by one of several tests
testprogramAddress=0x0000;

// we want to auto-clear the console if any output is sent by the program
var consoleboxStream="";

// for opcodes, see ftp://ftp.comlab.ox.ac.uk/pub/Cards/txt/6800.txt

testprogram = [
  0xce, 0x43, 0x21,  // LDX #4321
  0x35,              // TXS
  0xc6, 0xfb,        // LDAB #$FB
  0xbd, 0x00, 0x10,  // JSR $0010
  0x7e, 0x00, 0x04,  // JMP $0004
  0x01,              // NOP
  0x01,              // NOP
  0x01,              // NOP
  0x01,              // NOP
  0x08,              // INX
  0x4a,              // DECA
  0x7c, 0x00, 0x0f,  // INC $0F
  0x0d,              // SEC
  0xc9, 0x02,        // ADCB #$02
  0x39,              // RTS
]

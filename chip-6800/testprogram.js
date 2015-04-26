// This file testprogram.js can be substituted by one of several tests
testprogramAddress=0x0000;

// we want to auto-clear the console if any output is sent by the program
var consoleboxStream="";

// demonstrate write hook
writeTriggers[0x8000]="consoleboxStream += String.fromCharCode(d);"+
                      "consolebox.innerHTML = consoleboxStream;";

// demonstrate read hook (not used by this test program)
readTriggers[0x8004]="((consolegetc==undefined)?0:0xff)";  // return zero until we have a char
readTriggers[0x8000]="var c=consolegetc; consolegetc=undefined; (c)";

// for opcodes, see http://www.textfiles.com/programming/CARDS/6800

testprogram = [
  0xce, 0x43, 0x21,  // LDX #4321
  0x35,              // TXS
  0xce, 0x80, 0x00,  // LDX #8000
  0xc6, 0x40,        // LDAB #$40
  0xbd, 0x00, 0x10,  // JSR $0010
  0x7e, 0x00, 0x09,  // JMP $0009
  0x01,              // NOP
  0x4a,              // DECA
  0xe7, 0x00,        // STAB 0, X
  0x7c, 0x00, 0x0f,  // INC $0F
  0x0d,              // SEC
  0xc9, 0x02,        // ADCB #$02
  0x39,              // RTS
]

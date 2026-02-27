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

testprogram = [
	0x21, 0x34, 0x12,        // LD HL, $1234
	0x31, 0xfe, 0xdc,        // LD SP, $DCFE
	0xe5,                    // PUSH HL
	0x21, 0x78, 0x56,        // LD HL, $5678
	0xaf,                    // XOR A
	0x22,                    // LD (HLI), A
	0x3c,                    // INC A
	0x3c,                    // INC A
	0x32,                    // LD (HLD), A
	0x76,                    // HALT
	0x00                     // NOP
]

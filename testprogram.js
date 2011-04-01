// This file testprogram.js can be substituted by one of several tests
// which may not be redistributable
// for example
//    cbmbasic  loaded at 0xa000 with entry point 0xe394
//    test6502 (by Bird Computer) loaded at 0x8000 with entry point 0x8000
//
// (can use xxd -i to convert binary into C include syntax, as a starting point)
//
testprogramAddress=0x0000;

// we want to auto-clear the console if any output is sent by the program
var consoleboxStream="";

// demonstrate write hook
writeTriggers[0x000F]="consoleboxStream += String.fromCharCode(d);"+
                      "consolebox.innerHTML = consoleboxStream;";

// demonstrate read hook (not used by this test program)
readTriggers[0xD011]="((consolegetc==undefined)?0:0xff)";  // return zero until we have a char
readTriggers[0xD010]="var c=consolegetc; consolegetc=undefined; (c)";

testprogram = [
	0xa9, 0x00,              // LDA #$00
	0x20, 0x10, 0x00,        // JSR $0010
	0x4c, 0x02, 0x00,        // JMP $0002

	0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x40,

	0xe8,                    // INX
	0x88,                    // DEY
	0xe6, 0x0F,              // INC $0F
	0x38,                    // SEC
	0x69, 0x02,              // ADC #$02
	0x60                     // RTS
];

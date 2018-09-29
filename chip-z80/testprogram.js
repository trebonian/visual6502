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
    0x00,                    // NOP
    0x31, 0x00, 0x01,        // LD SP,0x0100
    0xCD, 0x0B, 0x00,        // CALL $000B
    0x00,                    // NOP
    0x21, 0x78, 0x56,        // LD HL,$5678
    0x21, 0x34, 0x12,        // LD HL,$1234
    0xe5,                    // PUSH HL
    0x00,                    // NOP
    0x00,                    // NOP
    0x3C,                    // INC A
    0x04,                    // INC B
    0x15,                    // DEC D
    0x24,                    // INC H
    0xEB,                    // EXX DE,HL
    0x00,                    // NOP
    0x3C,                    // INC A
    0x04,                    // INC B
    0x15,                    // DEC D
    0x24,                    // INC H
    0xD9,                    // EXX
    0x00,                    // NOP
    0x3C,                    // INC A
    0x04,                    // INC B
    0x15,                    // DEC D
    0x24,                    // INC H
    0xEB,                    // EXX DE,HL
    0x00,                    // NOP
    0x3C,                    // INC A
    0x04,                    // INC B
    0x15,                    // DEC D
    0x24,                    // INC H
    0x08,                    // EXX AF,AF'
    0x00,                    // NOP
    0x3C,                    // INC A
    0x04,                    // INC B
    0x15,                    // DEC D
    0x24,                    // INC H
    0x00,                    // NOP
    0x00,                    // NOP
    0x00,                    // NOP
    0x21, 0x00, 0x01,        // LD HL,$0100
    0x36, 0xCC,              // LD (HL),$CC
    0x00,                    // NOP
    0x7E,                    // LD A, (HL)
    0x00,                    // NOP
    // Pavel's original test program
    0x21, 0x34, 0x12,        // LD HL,$1234
    0x31, 0xfe, 0xdc,        // LD SP,0xDCFE
    0xe5,                    // PUSH HL
    0x21, 0x78, 0x56,        // LD HL,$5678
    0xe3,                    // EX (SP),HL
    0xdd, 0x21, 0xbc,0x9a,   // LD IX, 0x9ABC
    0xdd, 0xe3,              // EX (SP),IX
    0x76,                    // HALT
    0x00                     // NOP    
]

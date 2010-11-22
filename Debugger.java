/*
Copyright (c) 2010 Achim Breidenbach, Ed Spittles

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

// opcode lookup for 6502 - not quite a disassembly
//   javascript derived from Debugger.java by Achim Breidenbach
//   by one-off unmaintainable adhoc transformation:

tr -d :\; |
egrep 0x\|adres\|short\|case |
awk '
  /case/{c=$2}
  $1=="adressString"&&a[c]==""{a[c]=$0}
  /0x/{o=$2}
  /shortc/{m[o]=$3}
  /adressmode/&&s[o]==""{s[o]=m[o];sa[o]=$3}
  END{for(b in s)print b,s[b],sa[b],a[sa[b]]}
  ' |
awk '{print $1":"$2,substr($0,index($0,"= \""))","}' |
sed 's/" = "/ /' |
egrep -v ^= |
sed '
  s/ Implied//;
  s/Indierect/zp/;
  s/Immediate/#/;
  s/Accumulator//;
  s/Absolute/Abs/;
  s/Relative//;
  s/Zero Page/zp/
  ' |
sort |
awk 'BEGIN{print "var dis6502={"}{print}END{print "};"}'

var dis6502={
0x00:"BRK",
0x01:"ORA (zp,X)",
0x05:"ORA zp",
0x06:"ASL zp",
0x08:"PHP",
0x09:"ORA #",
0x0A:"ASL ",
0x0D:"ORA Abs",
0x0E:"ASL Abs",
0x10:"BPL ",
0x11:"ORA (zp),Y",
0x15:"ORA zp,X",
0x16:"ASL zp,X",
0x18:"CLC",
0x19:"ORA Abs,Y",
0x1D:"ORA Abs,X",
0x1E:"ASL Abs,X",
0x20:"JSR Abs",
0x21:"AND (zp,X)",
0x24:"BIT zp",
0x25:"AND zp",
0x26:"ROL zp",
0x28:"PLP",
0x29:"AND #",
0x2A:"ROL ",
0x2C:"BIT Abs",
0x2D:"AND Abs",
0x2E:"ROL Abs",
0x30:"BMI ",
0x31:"AND (zp),Y",
0x35:"AND zp,X",
0x36:"ROL zp,X",
0x38:"SEC",
0x39:"AND Abs,Y",
0x3D:"AND Abs,X",
0x3E:"ROL Abs,X",
0x40:"RTI",
0x41:"EOR (zp,X)",
0x45:"EOR zp",
0x46:"LSR zp",
0x48:"PHA",
0x49:"EOR #",
0x4A:"LSR ",
0x4C:"JMP Abs",
0x4D:"EOR Abs",
0x4E:"LSR Abs",
0x50:"BVC ",
0x51:"EOR (zp),Y",
0x55:"EOR zp,X",
0x56:"LSR zp,X",
0x58:"CLI",
0x59:"EOR Abs,Y",
0x5D:"EOR Abs,X",
0x5E:"LSR Abs,X",
0x60:"RTS",
0x61:"ADC (zp,X)",
0x65:"ADC zp",
0x66:"ROR zp",
0x68:"PLA",
0x69:"ADC #",
0x6A:"ROR ",
0x6C:"JMP zp",
0x6D:"ADC Abs",
0x6E:"ROR Abs",
0x70:"BVS ",
0x71:"ADC (zp),Y",
0x75:"ADC zp,X",
0x76:"ROR zp,X",
0x78:"SEI",
0x79:"ADC Abs,Y",
0x7D:"ADC Abs,X",
0x7E:"ROR Abs,X",
0x81:"STA (zp,X)",
0x84:"STY zp",
0x85:"STA zp",
0x86:"STX zp",
0x88:"DEY",
0x8A:"TXA",
0x8C:"STY Abs",
0x8D:"STA Abs",
0x8E:"STX Abs",
0x90:"BCC ",
0x91:"STA (zp),Y",
0x94:"STY zp,X",
0x95:"STA zp,X",
0x96:"STX zp,Y",
0x98:"TYA",
0x99:"STA Abs,Y",
0x9A:"TXS",
0x9D:"STA Abs,X",
0xA0:"LDY #",
0xA1:"LDA (zp,X)",
0xA2:"LDX #",
0xA4:"LDY zp",
0xA5:"LDA zp",
0xA6:"LDX zp",
0xA8:"TAY",
0xA9:"LDA #",
0xAA:"TAX",
0xAC:"LDY Abs",
0xAD:"LDA Abs",
0xAE:"LDX Abs",
0xB0:"BCS ",
0xB1:"LDA (zp),Y",
0xB4:"LDY zp,X",
0xB5:"LDA zp,X",
0xB6:"LDX zp,Y",
0xB8:"CLV",
0xB9:"LDA Abs,Y",
0xBA:"TSX",
0xBC:"LDY Abs,X",
0xBD:"LDA Abs,X",
0xBE:"LDX Abs,Y",
0xC0:"CPY #",
0xC1:"CMP (zp,X)",
0xC4:"CPY zp",
0xC5:"CMP zp",
0xC6:"DEC zp",
0xC8:"INY",
0xC9:"CMP #",
0xCA:"DEX",
0xCC:"CPY Abs",
0xCD:"CMP Abs",
0xCE:"DEC Abs",
0xD0:"BNE ",
0xD1:"CMP (zp),Y",
0xD5:"CMP zp,X",
0xD6:"DEC zp,X",
0xD8:"CLD",
0xD9:"CMP Abs,Y",
0xDD:"CMP Abs,X",
0xDE:"DEC Abs,X",
0xE0:"CPX #",
0xE1:"SBC (zp,X)",
0xE4:"CPX zp",
0xE5:"SBC zp",
0xE6:"INC zp",
0xE8:"INX",
0xE9:"SBC #",
0xEA:"NOP",
0xEC:"CPX Abs",
0xED:"SBC Abs",
0xEE:"INC Abs",
0xF0:"BEQ ",
0xF1:"SBC (zp),Y",
0xF5:"SBC zp,X",
0xF6:"INC zp,X",
0xF8:"SED",
0xF9:"SBC Abs,Y",
0xFD:"SBC Abs,X",
0xFE:"INC Abs,X",
};

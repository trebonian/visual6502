/*
Copyright (c) 2010 Achim Breidenbach

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

public class Debugger {


    public static String hex(int value, int stringLength) {
    
        String returnString = (String)(Integer.toHexString(value)).toUpperCase();
        return addLeadingZeros(returnString, stringLength);
    }
    
    public static int hexStringToInt(String theHexString) {
    
	int result = 0;
        
        if(theHexString != null){
            
            char c;
            theHexString = theHexString.toUpperCase();
            
            for(int i=0; i<theHexString.length(); i++)
            {
                c = theHexString.charAt(i);
                
                if(c>='0' && c<='9'){
                    result = result << 4;
                    result += c - '0';
                }
                                
                if(c>='A' && c<='F'){
                    result = result << 4;
                    result += c - 'A' + 10;
                }

            }
        }
        return result;
    }

    
    public static String binary(int value, int stringLength) {
    
        String returnString = Integer.toBinaryString(value);
        return addLeadingZeros(returnString, stringLength);
    }
    
    public static int binStringToInt(String theBinString) {
    
	int result = 0;
        
        if(theBinString != null){
            
            char c;
            
            for(int i=0; i<theBinString.length(); i++)
            {
                c = theBinString.charAt(i);
                
                if(c=='0' || c=='1'){
                    result = result << 1;
                    result += c - '0';
                }
            }
        }
        return result;
    }


    public static String addLeadingZeros(String theString, int stringLength) {
    
        if(theString == null)
            theString = "";
            
        while(theString.length() < stringLength)
            theString = "0" + theString;
            
        return theString;
    }

    public static String addTrailingSpace(String theString, int stringLength) {
    
        if(theString == null)
            theString = "";
            
        while(theString.length() < stringLength)
            theString += " ";
            
        return theString;
    }

    public static String getDebugString(int pc, int code, int opcode1, int opcode2){
    
        String shortcode  = "";
        String comment    = "";
        String statusbyte = "";
        int adressmode    = 0;
        int syntax        = 0;
        int bytecount     = 0;
        int cylces        = 0;
        String adressString = "";
        
        switch(code){
    
      case 0x69:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x65:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x75:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x6D:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x7D:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x79:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x61:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x71:
         shortcode  = "ADC";
         comment    = "Add memory to accumulator with carry";
         statusbyte = "***--*";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x29:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x25:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x35:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x2D:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x3D:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x39:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x21:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x31:
         shortcode  = "AND";
         comment    = "'AND' memory with accumulator";
         statusbyte = "**----";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x0A:
         shortcode  = "ASL";
         comment    = "Shift left one Bit (memory or accumulator)";
         statusbyte = "***---";
         adressmode = 9;
         syntax     = 6;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x06:
         shortcode  = "ASL";
         comment    = "Shift left one Bit (memory or accumulator)";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x16:
         shortcode  = "ASL";
         comment    = "Shift left one Bit (memory or accumulator)";
         statusbyte = "***---";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x0E:
         shortcode  = "ASL";
         comment    = "Shift left one Bit (memory or accumulator)";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0x1E:
         shortcode  = "ASL";
         comment    = "Shift left one Bit (memory or accumulator)";
         statusbyte = "***---";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0x90:
         shortcode  = "BCC";
         comment    = "Branch on carry clear";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xB0:
         shortcode  = "BCS";
         comment    = "Branch on carry set";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xF0:
         shortcode  = "BEQ";
         comment    = "Branch on result zero";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x24:
         shortcode  = "BIT";
         comment    = "Test bits in memory with accumulator";
         statusbyte = "7*---6";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x2C:
         shortcode  = "BIT";
         comment    = "Test bits in memory with accumulator";
         statusbyte = "7*---6";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x30:
         shortcode  = "BMI";
         comment    = "Branch on result minus";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xD0:
         shortcode  = "BNE";
         comment    = "Branch on result not zero";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x10:
         shortcode  = "BPL";
         comment    = "Branch on result plus";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x00:
         shortcode  = "BRK";
         comment    = "Force Break";
         statusbyte = "---1--";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 7;
         break;

      case 0x50:
         shortcode  = "BVC";
         comment    = "Branch on overflow clear";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x70:
         shortcode  = "BVS";
         comment    = "Branch on overflow set";
         statusbyte = "------";
         adressmode = 10;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x18:
         shortcode  = "CLC";
         comment    = "Clear carry flag";
         statusbyte = "--0---";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xD8:
         shortcode  = "CLD";
         comment    = "Clear dezimal mode";
         statusbyte = "----0-";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x58:
         shortcode  = "CLI";
         comment    = "Clear interrupt disable bit";
         statusbyte = "---0--";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xB8:
         shortcode  = "CLV";
         comment    = "Clear overflow flag";
         statusbyte = "-----0";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xC9:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xC5:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xD5:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0xCD:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xDD:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xD9:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xC1:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0xD1:
         shortcode  = "CMP";
         comment    = "Compare memory and accumulator";
         statusbyte = "***---";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0xE0:
         shortcode  = "CPX";
         comment    = "Compare memory and index X";
         statusbyte = "***---";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xE4:
         shortcode  = "CPX";
         comment    = "Compare memory and index X";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xEC:
         shortcode  = "CPX";
         comment    = "Compare memory and index X";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xC0:
         shortcode  = "CPY";
         comment    = "Compare memory and index Y";
         statusbyte = "***---";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xC4:
         shortcode  = "CPY";
         comment    = "Compare memory and index Y";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xCC:
         shortcode  = "CPY";
         comment    = "Compare memory and index Y";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xC6:
         shortcode  = "DEC";
         comment    = "Decrement memory by one";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0xD6:
         shortcode  = "DEC";
         comment    = "Decrement memory by one";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0xCE:
         shortcode  = "DEC";
         comment    = "Decrement memory by one";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0xDE:
         shortcode  = "DEC";
         comment    = "Decrement memory by one";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0xCA:
         shortcode  = "DEX";
         comment    = "Decrement index X by one";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x88:
         shortcode  = "DEY";
         comment    = "Dekrement index Y by one";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x49:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x45:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x55:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x4D:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x5D:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x59:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x41:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x51:
         shortcode  = "EOR";
         comment    = "'Exclusive-Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0xE6:
         shortcode  = "INC";
         comment    = "Increment memory by one";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0xF6:
         shortcode  = "INC";
         comment    = "Increment memory by one";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0xEE:
         shortcode  = "INC";
         comment    = "Increment memory by one";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0xFE:
         shortcode  = "INC";
         comment    = "Increment memory by one";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0xE8:
         shortcode  = "INX";
         comment    = "Increment index X by one";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xC8:
         shortcode  = "INY";
         comment    = "Increment index Y by one";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x4C:
         shortcode  = "JMP";
         comment    = "Jump to new location";
         statusbyte = "------";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 3;
         break;

      case 0x6C:
         shortcode  = "JMP";
         comment    = "Jump to new location";
         statusbyte = "------";
         adressmode = 13;
         syntax     = 8;
         bytecount  = 3;
         cylces     = 5;
         break;

      case 0x20:
         shortcode  = "JSR";
         comment    = "Jump to new location saving return address";
         statusbyte = "------";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0xA9:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xA5:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xB5:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0xAD:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xBD:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xB9:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xA1:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0xB1:
         shortcode  = "LDA";
         comment    = "Load accumulator with memory";
         statusbyte = "**----";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0xA2:
         shortcode  = "LDX";
         comment    = "Load index X with memory";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xA6:
         shortcode  = "LDX";
         comment    = "Load index X with memory";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xB6:
         shortcode  = "LDX";
         comment    = "Load index X with memory";
         statusbyte = "**----";
         adressmode = 12;
         syntax     = 4;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0xAE:
         shortcode  = "LDX";
         comment    = "Load index X with memory";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xBE:
         shortcode  = "LDX";
         comment    = "Load index X with memory";
         statusbyte = "**----";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xA0:
         shortcode  = "LDY";
         comment    = "Load index Y with memory";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xA4:
         shortcode  = "LDY";
         comment    = "Load index Y with memory";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xB4:
         shortcode  = "LDY";
         comment    = "Load index Y with memory";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0xAC:
         shortcode  = "LDY";
         comment    = "Load index Y with memory";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xBC:
         shortcode  = "LDY";
         comment    = "Load index Y with memory";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x4A:
         shortcode  = "LSR";
         comment    = "Shift right one bit";
         statusbyte = "0**---";
         adressmode = 9;
         syntax     = 6;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x46:
         shortcode  = "LSR";
         comment    = "Shift right one bit";
         statusbyte = "0**---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x56:
         shortcode  = "LSR";
         comment    = "Shift right one bit";
         statusbyte = "0**---";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x4E:
         shortcode  = "LSR";
         comment    = "Shift right one bit";
         statusbyte = "0**---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0x5E:
         shortcode  = "LSR";
         comment    = "Shift right one bit";
         statusbyte = "0**---";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0xEA:
         shortcode  = "NOP";
         comment    = "No operation";
         statusbyte = "------";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x09:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0x05:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x15:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x0D:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x1D:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x19:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x01:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x11:
         shortcode  = "ORA";
         comment    = "'Or' memory with accumulator";
         statusbyte = "**----";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x48:
         shortcode  = "PHA";
         comment    = "Push accumulator on stack";
         statusbyte = "------";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 3;
         break;

      case 0x08:
         shortcode  = "PHP";
         comment    = "Push prozessor status on stack";
         statusbyte = "------";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 3;
         break;

      case 0x68:
         shortcode  = "PLA";
         comment    = "Pull accumulator from stack**";
         statusbyte = "------";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 4;
         break;

      case 0x28:
         shortcode  = "PLP";
         comment    = "Pull prozessor status from stack";
         statusbyte = "->Stak";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 4;
         break;

      case 0x2A:
         shortcode  = "ROL";
         comment    = "Rotate one bit left";
         statusbyte = "***---";
         adressmode = 9;
         syntax     = 6;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x26:
         shortcode  = "ROL";
         comment    = "Rotate one bit left";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x36:
         shortcode  = "ROL";
         comment    = "Rotate one bit left";
         statusbyte = "***---";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x2E:
         shortcode  = "ROL";
         comment    = "Rotate one bit left";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0x3E:
         shortcode  = "ROL";
         comment    = "Rotate one bit left";
         statusbyte = "***---";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0x6A:
         shortcode  = "ROR";
         comment    = "Rotate one bit right";
         statusbyte = "***---";
         adressmode = 9;
         syntax     = 6;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x66:
         shortcode  = "ROR";
         comment    = "Rotate one bit right";
         statusbyte = "***---";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x76:
         shortcode  = "ROR";
         comment    = "Rotate one bit right";
         statusbyte = "***---";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x6E:
         shortcode  = "ROR";
         comment    = "Rotate one bit right";
         statusbyte = "***---";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 6;
         break;

      case 0x7E:
         shortcode  = "ROR";
         comment    = "Rotate one bit right";
         statusbyte = "***---";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 7;
         break;

      case 0x40:
         shortcode  = "RTI";
         comment    = "Return from interrupt";
         statusbyte = "->Stak";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 6;
         break;

      case 0x60:
         shortcode  = "RTS";
         comment    = "Return from subroutine";
         statusbyte = "------";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 6;
         break;

      case 0xE9:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 1;
         syntax     = 7;
         bytecount  = 2;
         cylces     = 2;
         break;

      case 0xE5:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0xF5:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0xED:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xFD:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xF9:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xE1:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0xF1:
         shortcode  = "SBC";
         comment    = "Subtrac memory from accumulator with borrow";
         statusbyte = "***--*";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 5;
         break;

      case 0x38:
         shortcode  = "SEC";
         comment    = "Set carry flag";
         statusbyte = "--1---";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xF8:
         shortcode  = "SED";
         comment    = "Set dezimal mode";
         statusbyte = "----1-";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x78:
         shortcode  = "SEI";
         comment    = "Set interrupt disable status";
         statusbyte = "---1--";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x85:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x95:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x8D:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x9D:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 5;
         syntax     = 2;
         bytecount  = 3;
         cylces     = 5;
         break;

      case 0x99:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 6;
         syntax     = 4;
         bytecount  = 3;
         cylces     = 5;
         break;

      case 0x81:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 7;
         syntax     = 3;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x91:
         shortcode  = "STA";
         comment    = "Store accumulator in memory";
         statusbyte = "------";
         adressmode = 8;
         syntax     = 5;
         bytecount  = 2;
         cylces     = 6;
         break;

      case 0x86:
         shortcode  = "STX";
         comment    = "Store index X in memory";
         statusbyte = "------";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x96:
         shortcode  = "STX";
         comment    = "Store index X in memory";
         statusbyte = "------";
         adressmode = 12;
         syntax     = 4;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x8E:
         shortcode  = "STX";
         comment    = "Store index X in memory";
         statusbyte = "------";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0x84:
         shortcode  = "STY";
         comment    = "Store index Y in memory";
         statusbyte = "------";
         adressmode = 2;
         syntax     = 1;
         bytecount  = 2;
         cylces     = 3;
         break;

      case 0x94:
         shortcode  = "STY";
         comment    = "Store index Y in memory";
         statusbyte = "------";
         adressmode = 3;
         syntax     = 2;
         bytecount  = 2;
         cylces     = 4;
         break;

      case 0x8C:
         shortcode  = "STY";
         comment    = "Store index Y in memory";
         statusbyte = "------";
         adressmode = 4;
         syntax     = 1;
         bytecount  = 3;
         cylces     = 4;
         break;

      case 0xAA:
         shortcode  = "TAX";
         comment    = "Transfer accumulator to index X";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xA8:
         shortcode  = "TAY";
         comment    = "Transfer accumulator to index Y";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x98:
         shortcode  = "TYA";
         comment    = "Transfer index X to accumulator";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0xBA:
         shortcode  = "TSX";
         comment    = "Transfer stack pointer to index X";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x8A:
         shortcode  = "TXA";
         comment    = "Transfer index X to accumulator";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;

      case 0x9A:
         shortcode  = "TXS";
         comment    = "Transfer index X to stackpointer";
         statusbyte = "**----";
         adressmode = 11;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 2;
         break;
         
      default:
        shortcode  = " " + hex(code,2);
         comment    = "Unkown code";
         statusbyte = "-RESET";
         adressmode = 0;
         syntax     = 0;
         bytecount  = 1;
         cylces     = 1;
         break;
       }
       
       switch(adressmode){
	case 1:
		adressString = "Immediate";
		break;
		
	case 2:
		adressString = "Zero Page";
		break;
		
	case 3:
		adressString = "Zero Page,X";
		break;
		
	case 4:
		adressString = "Absolute";
		break;
		
	case 5:
		adressString = "Absolute,X";
		break;
		
	case 6:
		adressString = "Absolute,Y";
		break;
		
	case 7:
		adressString = "(Indierect,X)";
		break;
		
	case 8:
		adressString = "(Indierect),Y";
		break;
		
	case 9:
		adressString = "Accumulator";
		break;
		
	case 10:
		adressString = "Relative";
		break;
		
	case 11:
		adressString = "Implied";
		break;
		
	case 12:
		adressString = "Zero Page,Y";
		break;
		
	case 13:
		adressString = "Indierect";
                break;
                
        default:
                adressString = "";
                break;
       }
       
        String operString = "";
        
        switch(bytecount){
        case 2:
            operString = hex(opcode1,2);
            break;
            
        case 3:
            operString = hex(opcode2,4);
            break;
            
        default:
            operString = "";
        }

        String syntaxString = "";
    
       switch(syntax){
       	case 1:
		syntaxString = " " + operString;
		break;

	case 2:
		syntaxString = " " + operString + ",X";
		break;

	case 3:
		syntaxString = "(" + operString + ",X)";
		break;

	case 4:
		syntaxString = " " + operString + ",Y";
		break;

	case 5:
		syntaxString = "(" + operString + "),Y";
		break;

	case 6:
		syntaxString = "";
		break;

	case 7:
		syntaxString = "#" + operString;
		break;

	case 8:
		syntaxString = "(" + operString + ")";
		break;
                
        default:
                syntaxString = "";

        }
        comment = addTrailingSpace(comment + " " + adressString, 50);
        syntaxString = addTrailingSpace(syntaxString, 10);
        
        String debugString = hex(pc,4) + ": " + shortcode + " " + syntaxString + " "; // + comment;
        
        return debugString;
    } 
}

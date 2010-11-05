/*
 Copyright (c) 2010 Brian Silverman, Barry Silverman

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

var table;
var selected;

function setupTable(){
	table = document.getElementById('memtable');
	for(var r=0;r<32;r++){
		var row = document.createElement('tr');
		table.appendChild(row);
		var col = document.createElement('td');
		col.appendChild(document.createTextNode(hexWord(r*16)+':'));
		col.onmousedown = unselectCell;
		row.appendChild(col);
		for(var c=0;c<16;c++){
			col = document.createElement('td');
			col.addr = r*16+c;
			col.val = 0;
			col.onmousedown = function(e){handleCellClick(e);};
			col.appendChild(document.createTextNode('00'));
			row.appendChild(col);
		}
	}
}

function handleCellClick(e){
	var c = e.target;
	selectCell(c.addr);
}

function cellKeydown(e){
	var c = e.keyCode;
	if(c==13) unselectCell();
	else if(c==32) selectCell((selected+1)%0x200);
	else if(c==8) selectCell((selected+0x1ff)%0x200);
	else if((c>=48)&&(c<58)) setCellValue(selected, getCellValue(selected)*16+c-48);
	else if((c>=65)&&(c<71)) setCellValue(selected, getCellValue(selected)*16+c-55);
	mWrite(selected, getCellValue(selected));
}

function setCellValue(n, val){
	if(val==undefined)
		val=0x00;
	val%=256;
	cellEl(n).val=val;
	cellEl(n).innerHTML=hexByte(val);
}

function getCellValue(n){return cellEl(n).val;}

function selectCell(n){
	unselectCell();
	if(n>=0x200) return;
	cellEl(n).style.background = '#ff8';
	selected = n;
	table.onkeydown = function(e){cellKeydown(e);};
}

function unselectCell(){
	if(selected==undefined) return;
	cellEl(selected).style.background = '#fff';
	selected = undefined;
	window.onkeydown = undefined;
}

function cellEl(n){
	var r = n>>4;
	var c = n%16;
	var e = table.childNodes[r].childNodes[c+1];
	return e;
}

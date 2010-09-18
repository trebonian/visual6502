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
	window.onkeydown = function(e){cellKeydown(e);};
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
	var e = table.children[r].children[c+1];
	return e;
}

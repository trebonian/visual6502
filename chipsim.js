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

var ctrace = false;
var traceTheseNodes = [];
var traceTheseTransistors = [];
var loglevel = 0;
var recalclist = new Array();
var recalcHash = new Array();
var group = new Array();

function recalcNodeList(list){
	var n = list[0];
	recalclist = new Array();
	recalcHash = new Array();
	for(var j=0;j<100;j++){		// loop limiter
		if(list.length==0) return;
		if(ctrace) {
			var i;
			for(i=0;i<traceTheseNodes.length;i++) {
				if(list.indexOf(traceTheseNodes[i])!=-1) break;
			}
			if((traceTheseNodes.length==0)||(list.indexOf(traceTheseNodes[i])==-1)) {
				console.log('recalcNodeList iteration: ', j, list.length, 'nodes');
			} else {
				console.log('recalcNodeList iteration: ', j, list.length, 'nodes', list);
			}
		}
		for(var i in list) recalcNode(list[i]);
		list = recalclist;
		recalclist = new Array();
		recalcHash = new Array();
	}
	if(ctrace) console.log(n,'looping...');
}

function recalcNode(node){
	if(node==ngnd) return;
	if(node==npwr) return;
	group = getNodeGroup(node);
	var newv = getNodeValue();
	var newState = (newv[0]=='h');
	var newFloat = (newv[1]=='f');
	if(ctrace && (traceTheseNodes.indexOf(node)!=-1))
		console.log('recalc', node, group);
	for(var i in group){
		var n = nodes[group[i]];
		n.float = newFloat;
		if(n.state==newState)continue;	/******Performance********/
		n.state = newState;
		n.gates.forEach(
			function(t){
				recalcTransistor(t);
			});
	}
}

function recalcTransistor(t){
	if(isNodeHigh(t.gate)) turnTransistorOn(t);
	else turnTransistorOff(t);
}

function turnTransistorOn(t){
	if(t.on) return;
	if(ctrace && (traceTheseTransistors.indexOf(t.name)!=-1))
		console.log(t.name, 'on', t.gate, t.c1, t.c2);
	t.on = true;
	addRecalcNode(t.c1);
	addRecalcNode(t.c2);
}

function turnTransistorOff(t){
	if(!t.on) return;
	if(ctrace && (traceTheseTransistors.indexOf(t.name)!=-1))
		console.log(t.name, 'off', t.gate, t.c1, t.c2);
	t.on = false;
	floatnode(t.c1);
	floatnode(t.c2);
	addRecalcNode(t.c1);
	addRecalcNode(t.c2);
}

function floatnode(nn){
	if(nn==ngnd) return;
	if(nn==npwr) return;
	var n = nodes[nn];
	n.float = true;
	if(ctrace && (traceTheseNodes.indexOf(nn)!=-1))
		console.log('floating', nn, 'at', n.state);
}

function addRecalcNode(nn){
	if(nn==ngnd) return;
	if(nn==npwr) return;
	if(recalcHash[nn] == 1)return; 
	recalclist.push(nn);
	recalcHash[nn] = 1;
}

function getNodeGroup(i){
	group = new Array();
	addNodeToGroup(i);
	return group;
}

function addNodeToGroup(i){
	if(group.indexOf(i) != -1) return;
	group.push(i);
	if(i==ngnd) return;
	if(i==npwr) return;
	addNodeToGroup1(i);
}

function addNodeToGroup1(i){
	var output=nodes[i].c1c2s;
	output.forEach(
		function(t){
			if(t.on)addNodeTransistor(i,t);
		});
}

function addNodeTransistor(node, tr){
	var other;
	if(tr.c1==node) other=tr.c2;
	if(tr.c2==node) other=tr.c1;
	addNodeToGroup(other);
}


function getNodeValue(){
	if(arrayContains(group, ngnd)) return 'l ';
	if(arrayContains(group, npwr)) return 'h ';
	var flstate;
	for(var i in group){
		var nn = group[i];
		var n = nodes[nn];
		if(n.pullup) return 'h ';
		if(n.pulldown) return 'l ';
		if((!n.state && n.float)&&(flstate==undefined)) flstate = 'lf';
		if(n.state && n.float) flstate = 'hf';
	}
	if(flstate==undefined && ctrace) console.log(group);
	return flstate;
}


function isNodeHigh(nn){
	return(nodes[nn].state);
}

function saveString(name, str){
	var request = new XMLHttpRequest();
	request.onreadystatechange=function(){};
	request.open('PUT', 'save.php?name='+name, true);
	request.setRequestHeader('Content-Type', 'text/plain');
	request.send(str);
}

function allNodes(){
	var res = new Array();
	for(var i in nodes) if((i!=npwr)&&(i!=ngnd)) res.push(i);
	return res;
}

function stateString(){
	var codes = ['g','l','h','f' ];
	var res = '';
	for(var i=0;i<1725;i++){
		var n = nodes[i];
		if(n==undefined) res+='x';
		else if(i==ngnd) res+='g';
		else if(i==npwr) res+='h';
		else res+= codes[n.state*2 + n.float];
	}
	return res;
}

function showState(str){
	var codes = {g: 'l ', h: 'h ', f: 'hf', l: 'lf'};
	for(var i=0;i<str.length;i++){
		if(str[i]=='x') continue;
		nodes[i].state = ((codes[str[i]])[0]=='h');
		nodes[i].float = ((codes[str[i]])[1]=='f');
		var gates = nodes[i].gates;
		gates.forEach(function(t){t.on=isNodeHigh(i);});
	}
	refresh();
}


function setPd(name){
	var nn = nodenames[name];
	nodes[nn].pullup = false;
	nodes[nn].pulldown = true;
}

function setHigh(name){
	var nn = nodenames[name];
	nodes[nn].pullup = true;
	nodes[nn].pulldown = false;
	recalcNodeList([nn]);
}

function setLow(name){
	var nn = nodenames[name];
	nodes[nn].pullup = false;
	nodes[nn].pulldown = true;
	recalcNodeList([nn]);
}

function arrayContains(arr, el){return arr.indexOf(el)!=-1;}

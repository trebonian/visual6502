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
var ridx = 0;

function recalcNodeList(list){
	var n = list[0];
	var recalclist = new Array();
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
		for(var i in list) recalcNode(list[i], recalclist);
		list = recalclist;
		recalclist = new Array();
	}
	if(ctrace) console.log(n,'looping...');
}

function recalcNode(node, recalclist){
	if(node==ngnd) return;
	if(node==npwr) return;
	var group = getNodeGroup(node);
	var newv = getNodeValue(group);
	if(ctrace && (traceTheseNodes.indexOf(node)!=-1))
		console.log('recalc', node, group);
	for(var i in group){
		var n = nodes[group[i]];
		if(n.state!=newv && ctrace && (traceTheseNodes.indexOf(n)!=-1))
			console.log(group[i], n.state, newv);
		n.state = newv;
		for(var t in n.gates) recalcTransistor(n.gates[t], recalclist);
	}
}

function recalcTransistor(tn, recalclist){
	var t = transistors[tn];
	if(isNodeHigh(t.gate)) turnTransistorOn(t, recalclist);
	else turnTransistorOff(t, recalclist);
}

function turnTransistorOn(t, recalclist){
	if(t.on) return;
	if(ctrace && (traceTheseTransistors.indexOf(t.name)!=-1))
		console.log(t.name, 'on', t.gate, t.c1, t.c2);
	t.on = true;
	addRecalcNode(t.c1, recalclist);
	addRecalcNode(t.c2, recalclist);
}

function turnTransistorOff(t, recalclist){
	if(!t.on) return;
	if(ctrace && (traceTheseTransistors.indexOf(t.name)!=-1))
		console.log(t.name, 'off', t.gate, t.c1, t.c2);
	t.on = false;
	floatnode(t.c1);
	floatnode(t.c2);
	addRecalcNode(t.c1, recalclist);
	addRecalcNode(t.c2, recalclist);
}

function floatnode(nn){
	if(nn==ngnd) return;
	if(nn==npwr) return;
	var n = nodes[nn];
	if(n.state=='gnd') n.state = 'fl';
	if(n.state=='pd') n.state = 'fl';
	if(n.state=='vcc') n.state = 'fh';
	if(n.state=='pu') n.state = 'fh';
	if(ctrace && (traceTheseNodes.indexOf(nn)!=-1))
		console.log('floating', nn, 'to', n.state);
}

function addRecalcNode(nn, recalclist){
	if(nn==ngnd) return;
	if(nn==npwr) return;
	if(arrayContains(recalclist, nn)) return;
	recalclist.push(nn);
//	setAdd(recalclist, nn);
}

function getNodeGroup(i){
	var group = new Array();
	addNodeToGroup(i, group);
	return group;
}

function addNodeToGroup(i, group){
	if(arrayContains(group, i)) return;
	group.push(i);
	if(i==ngnd) return;
	if(i==npwr) return;
	for(var t in nodes[i].c1c2s) addNodeTransistor(i, nodes[i].c1c2s[t], group);
}

function addNodeTransistor(node, t, group){
	var tr = transistors[t];
	if(!tr.on) return;
	var other;
	if(tr.c1==node) other=tr.c2;
	if(tr.c2==node) other=tr.c1;
	addNodeToGroup(other, group);
}


function getNodeValue(group){
	if(arrayContains(group, ngnd)) return 'gnd';
	if(arrayContains(group, npwr)) return 'vcc';
	var flstate;
	for(var i in group){
		var nn = group[i];
		var n = nodes[nn];
		if(n.pullup) return 'pu';
		if(n.pulldown) return 'pd';
		if((n.state=='fl')&&(flstate==undefined)) flstate = 'fl';
		if(n.state=='fh') flstate = 'fh';
	}
	if(flstate==undefined && ctrace) console.log(group);
	return flstate;
}


function isNodeHigh(nn){
	return arrayContains(['vcc','pu','fh'], nodes[nn].state);
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
	var codes = {gnd: 'g', vcc: 'v', pu: 'p', pd: 'd', fh: 'f', fl: 'l'};
	var res = '';
	for(var i=0;i<1725;i++){
		var n = nodes[i];
		if(n==undefined) res+='x';
		else if(i==ngnd) res+='g';
		else if(i==npwr) res+='v';
		else res+= codes[n.state];
	}
	return res;
}

function showState(str){
	var codes = {g: 'gnd', v: 'vcc', p: 'pu', d: 'pd', f: 'fh', l: 'fl'};
	for(var i=0;i<str.length;i++){
		if(str[i]=='x') continue;
		nodes[i].state = codes[str[i]];
		var gates = nodes[i].gates;
		for(var t in gates) transistors[gates[t]].on = isNodeHigh(i);
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

function setAdd(arr, el){
	var idx = ridx%(arr.length+1);
	ridx+=131;
	ridx%=123;
	arr.splice(idx, 0, el);
	return arr;
}

function arrayContains(arr, el){return arr.indexOf(el)!=-1;}

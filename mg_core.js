//some very frequest short function from cmp
function console_log(){try{console.log.apply(console,arguments);}catch(ex){}}
function isEmpty(o){if(o==null)return true;if(typeof(o)=='object'||typeof(o)=='array'){var t;for(t in o)return!1;return!0}else{return null;}}
function ns(s,rr,c,i,k){var r=rr;if(null==r)r=/^u/.test(typeof window)?global:window;c=(s||"").split('.');for(i=0;i<c.length;i++){k=c[i];if(!k)break;r[k]||(r[k]={});r=r[k];}return r}
function nst(s,r){var rt=ns(s,r);return isEmpty(rt)?null:rt;}
function try_require(m){try{return require(m);}catch(ex){return null}}
function argv2o(argv){
	var argv_o={};
	for(k in argv){
		var v=argv[k];
		argv_o[""+k]=v;
		var m=null;
		if (m=v.match(/^--?([a-zA-Z0-9-_]*)=(.*)/)){
			var mm=null;
			if(mm=m[2].match(/^".*"$/)){
				argv_o[m[1]]=mm[1];
			}else{
				argv_o[m[1]]=m[2];
			}
		}
	}
	return argv_o;
}
function sha1(d){var l=0,a=0,f=[],b,c,g,h,p,e,m=[b=1732584193,c=4023233417,~b,~c,3285377520],n=[],k=unescape(encodeURI(d));for(b=k.length;a<=b;)n[a>>2]|=(k.charCodeAt(a)||128)<<8*(3-a++%4);for(n[d=b+8>>2|15]=b<<3;l<=d;l+=16){b=m;for(a=0;80>a;b=[[(e=((k=b[0])<<5|k>>>27)+b[4]+(f[a]=16>a?~~n[l+a]:e<<1|e>>>31)+1518500249)+((c=b[1])&(g=b[2])|~c&(h=b[3])),p=e+(c^g^h)+341275144,e+(c&g|c&h|g&h)+882459459,p+1535694389][0|a++/20]|0,k,c<<30|c>>>2,g,h])e=f[a-3]^f[a-8]^f[a-14]^f[a-16];for(a=5;a;)m[--a]=m[a]+b[a]|0}for(d="";40>a;)d+=(m[a>>3]>>4*(7-a++%8)&15).toString(16);return d}
function date_pattern(fmt,dt){
	if(!dt) dt=new Date();
	var o = {
		"M+" : dt.getMonth()+1,
		"d+" : dt.getDate(),
		"h+" : dt.getHours()%12 == 0 ? 12 : dt.getHours()%12,
		"H+" : dt.getHours(),
		"m+" : dt.getMinutes(),
		"s+" : dt.getSeconds(),
		"q+" : Math.floor((dt.getMonth()+3)/3),//quarter/season
		"S" : dt.getMilliseconds()
	};
	var week = {
		"0" : "\u65e5",
		"1" : "\u4e00",
		"2" : "\u4e8c",
		"3" : "\u4e09",
		"4" : "\u56db",
		"5" : "\u4e94",
		"6" : "\u516d"
	};
	if(/(y+)/.test(fmt)){
		fmt=fmt.replace(RegExp.$1, (dt.getFullYear()+"").substr(4 - RegExp.$1.length));
	}
	if(/(E+)/.test(fmt)){
		fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "\u661f\u671f" : "\u5468") : "")+week[dt.getDay()+""]);
	}
	for(var k in o){
		if(new RegExp("("+ k +")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
		}
	}
	return fmt;
}
function string_endsWith(suffix){
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
function s2o(s){try{return (new Function('return '+s))();}catch(ex){}};
function o2s(o,f,t){
	if(null==o)return "null";
	f=arguments.callee;
	t=typeof o;
	var r=[];
	if('object'==t){if(Array==o.constructor)t='array';else if(RegExp==o.constructor)t='regexp'};
	switch(t){
		case 'undefined':case 'unknown':return;
		case 'function':return !('prototype' in o)?"function(){}":(""+o);break;
		case 'boolean':case 'regexp':return o.toString(); break;
		case 'number':return isFinite(o)?o.toString():'null';break;
		case 'string':return '"'+o.replace(/(\\|\")/g,"\\$1").replace(/\n/g,"\\n").replace(/\r/g,"\\r")+'"';break;
		case 'object':
			try{for(var p in o){v=f(o[p]);if(v!==undefined)r.push('"'+p+'":'+v);}}catch(e){};return '{'+r.join(',')+'}';break;
		case 'array':
			if(o.length>=0){
				for(var i=0;i<o.length;i++){var v=f(o[i]);if (v!==undefined)r.push(v);};return '['+r.join(',')+']';
			}else{
				for(var k in o){var v=f(o[k]);if(v!==undefined)r.push('"'+k+'":'+v);};return '{'+r.join(',')+'}';
			}
	}
};
function str_len(o){
	if(o){
		if(o.length) return o.length;
		var c=0;
		for(x in o){
			//if(o.hasOwnProperty(x)){  
			c++;
			//}
		}
		return c;
	}else{
		return -1;
	}
}
function UniqTimeSeq(){
	if("undefined"==typeof(this._timeseq_lock)){
		this._timeseq_lock=0;
	}
	//临时算法
	var _now=(new Date()).pattern("yyyyMMddHHmmss");
	return ""+_now+"."+((++ this._timeseq_lock) % 99999);

	//盲加也还不一定是原子的..但已经足够了，所以...先就这样吧，js端没什么好的Mutex方法，而我也相信在一毫秒里面单机能做x个运算，在2014-2024年是不可能的，
	//就算可能也就打个补丁 % 个 99999999 咯
}
var _tm_a={};
function UniqTimer(funcToCall,time_c,name){
	if(!name) throw new Error("UniqTimer()");
	var _tm_prev=_tm_a['_tm_'+name];
	try{
		if(_tm_prev) clearTimeout(_tm_prev);
	}catch(e){};

	_tm_a['_tm_'+name]=setTimeout(funcToCall,time_c);
}
function ClearUniqTimer(name){
	if(!name) throw new Error("ClearUniqTimer()");
	var _tm_prev = _tm_a['_tm_'+name];
	try{
		if(_tm_prev) {
			clearTimeout(_tm_prev);
		}
	}catch (e){
	};
}
function trimStr(str){return str.replace(/(^\s*)|(\s*$)/g,"");}
function FormatMoney(moneyStr){
	var rtn = 0;
	var rtnstr= "";
	moneyStr = trimStr(moneyStr);
	if(moneyStr.indexOf("($")>=0){
		rtnStr= moneyStr.replace("($","-").replace(",","").replace(")","");

	}else{
		rtnStr = moneyStr.replace("$","").replace(",","");
	}
	rtn = parseFloat(rtnStr);
	return rtn;
}

/* (@deprecated, use Promise/Q.js instead)
 * 异步调用时，有些地方可能忘记加上callback，或者出错未能调用到callback，造成业务流程中断。
 * 添加此方法处理未调用callback的情况。
 * 设置一定超时时间，若handler超过时间未调用callback，此函数调用callback保证业务流程继续。
 *
 * handler:		执行处理的函数，形式为： function(callback) {}
 * callback:  逻辑完成时要调用的方法
 *
 * 举例：
 * 原调用异步方法：
 * aAsyncMethod(param1, param2, callbackFunction);
 * 则改为：
 * asyncDo(function(callback) {
 *	aAsyncMethod(param1, param2, callback);
 * }, callbackFunction);
 *
 */
var ASYNC_TIMEOUT = 300000;	// async 调用超时时间 5分钟
function asyncDo(handler, callback) {
	var checkTimer;
	var cb = function() {
		clearTimeout(checkTimer);
		callback.apply(null, arguments);		
	};

	handler.call(null, cb);

	checkTimer = setTimeout(function() {		
		_d_("INFO", "Async Timeout", '' + handler);
		cb("Async Timeout");
	}, ASYNC_TIMEOUT);
}

function formatResponse(err,data) {
	var ret;
	if (data == null)
		ret = {};
	else if (data instanceof Array)
		ret = {data: data};
	else if (data instanceof Object)
		ret = data;
	else
		ret = {data: data};

	if (err) {
		ret.STS = "KO";
		if (err instanceof Error)
			ret.errmsg = err.message;
		else
			ret.errmsg = err;
	} else {
		if (!ret.STS) ret.STS = "OK";
	}

	return ret;
}
var ajax={
	x:function(){var cls=nst('ActiveXObject')||nst('XMLHttpRequest',try_require('xmlhttprequest'));
		var rt=new cls("Microsoft.XMLHTTP");
		return rt;}
	,send:function(u,f,m,a){var x=this.x();x.open(m,u,true);x.onerror=function(ex){f({STS:"KO",errmsg:"Network Failed."+ex},-1,u);};x.onreadystatechange=function(){if(x.readyState==4){f(x.responseText,x.status,u);}};if(m=='POST')x.setRequestHeader('Content-type','application/x-www-form-urlencoded');x.send(a);}
	,get:function(url,func){this.send(url,func,'GET');}
	,gets:function(url){var x=this.x();x.open('GET',url,false);x.send(null);return x.responseText;}
	,post:function(url,func,args){this.send(url,func,'POST',args);}
};
if(typeof(exports)!="undefined"){
	exports.ajax=ajax;
	exports.ns=ns;//namespace
	exports.console_log=console_log;//wrapper for the console.log
	exports.argv2o=argv2o;//quick func for convert the argv to o
	exports.UniqTimer=UniqTimer;
	exports.UniqTimeSeq=UniqTimeSeq;
	exports.len=str_len;
	exports.o2s=o2s;
	exports.s2o=s2o;
	exports.string_endsWith=string_endsWith;
	exports.date_pattern=date_pattern;
	exports.asyncDo = asyncDo;
	exports.formatResponse = formatResponse;
}
Date.prototype.pattern=date_pattern;
String.prototype.endsWith =string_endsWith;

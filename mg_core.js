//some very frequest short function from cmp
function console_log(){try{console.log.apply(console,arguments);}catch(ex){}}
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
function ns(s,r,c,i,k){r=r||/^u/.test(typeof window)?global:window;c=(s||"").split('.');for(i=0;i<c.length;i++){k=c[i];if(!k)break;r[k]||(r[k]={});r=r[k];}return r}
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
/*
	 function s2o(strJson) {
	 var myjson=null;
	 try{myjson=JSON;}catch(e){};
	 if(myjson) return myjson.parse(strJson);
	 return eval( "(" + strJson + ")");
	 }
	 function o2s(object){
	 var myjson=null;
	 try{myjson=JSON;}catch(e){};
	 if(myjson) return myjson.stringify(object);
	 if(null==object)return "null";
	 var type = typeof object;
	 if ('object' == type) { if (Array == object.constructor) type = 'array';
	 else if (RegExp == object.constructor) type = 'regexp';
	 else type = 'object'; }
	 switch(type) {
	 case 'undefined':
	 case 'unknown':
	 return; break;
	 case 'function':
	 case 'boolean':
	 case 'regexp':
	 return object.toString(); break;
	 case 'number':
	 return isFinite(object) ? object.toString() : 'null'; break;
	 case 'string':
	 return '"' + object.replace(/(\\|\")/g,"\\$1").replace(/\n|\r|\t/g, function(){ var a = arguments[0]; return (a == '\n') ? '\\n': (a == '\r') ? '\\r': (a == '\t') ? '\\t': "" }) + '"'; break;
	 case 'object':
	 if (object === null) return 'null';var pp="";var value ="";
	 var results = []; 
	 try{
	 for (var property in object) {pp=object[property]; value = o2s(pp); if (value !== undefined) results.push('"'+property + '":' + value); };
	 }catch(e){
//_d_(property+":"+value+"\n"+results.join(','));
}
return '{' + results.join(',') + '}';
break;
case 'array':
var results = [];
if(object.length>0){
for(var i = 0; i < object.length; i++) { 
var value = o2s(object[i]);
if (value !== undefined) results.push(value); };
return '[' + results.join(',') + ']';
}
else{
for(k in object) {var kk=k; var value = o2s(object[k]); if (value !== undefined) results.push('"'+kk+'":'+value); }
return '{' + results.join(',') + '}';
}
break;
}
}
 */
function s2o(s){try{return(new Function('return '+s))()}catch(ex){}}
function o2s(o,l){
	if(null==o)return "null";
	var f=arguments.callee;
	if (!l>0) l=10;
	if (l<=0) return;
	var t=typeof o;
	if('object'==t){ if(RegExp==o.constructor)t='regexp'; }
	switch(t){
		case 'undefined':case 'unknown':return;
		case 'boolean':case 'regexp':return o.toString(); break;
		case 'number':return isFinite(o)?o.toString():'null';break;
		case 'object':
		case 'array':
									var r=[];
									if(o.constructor==Array && o.length>=0){
										for(var i=0;i<o.length;i++){var v=f(o[i],l-1);if(v!==undefined)r.push(v);};return '['+r.join(',')+']';
									}
									try{for(var p in o){v=f(o[p],l-1);if(v!==undefined)r.push('"'+p+'":'+v);}}catch(ex){return ""+ex;};
									if(r.length==0 && (""+o)!=""){
										//if really empty, let 'default' handle..
									}else{
										return '{'+r.join(',')+'}';
									}
		default:
									//var s= o.toString?o.toString():(""+o);
									var s= ""+o;
									return '"'+s.replace(/(\\|\")/g,"\\$1").replace(/\n/g,"\\n").replace(/\r/g,"\\r")+'"';
	}
}
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
	var _now=(new Date()).pattern("yyyyMMddhhmmss");
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

/*
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

if(typeof(exports)!="undefined"){
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

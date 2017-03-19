//mg nodejs websocket 类...



var escapable = /[\x00-\x1f\ud800-\udfff\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufff0-\uffff]/g;

function filterUnicode(quoted){

  escapable.lastIndex = 0;
  if( !escapable.test(quoted)) return quoted;

  return quoted.replace( escapable, function(a){
    return '';
  });
}

if(typeof(exports)!="undefined"){
	exports.options = {
		debug: true,
		debug_handler: console.log
	};

	_d_=function() {
		if (exports.options && exports.options.debug) {
			if (typeof exports.options.debug_handler == "function") {
				exports.options.debug_handler.apply(null, arguments);
			} else {
				console.log.apply(null, arguments);
			}
		}
	};

	mg_core=require("./mg_core.js");
	s2o=mg_core.s2o;
	o2s=mg_core.o2s;
	UniqTimeSeq=mg_core.UniqTimeSeq;

	ws = require("nodejs-websocket");
	/**
	 * binary模式未有时间研究
	 * 原文件由 npm install nodejs-websocket, wanjo增补了一个Server.stop();
	 */
}
function WS_Send_Raw(ws_conn,raw_s){
//  raw_s = strencode(raw_s);//zyq added test
//  raw_s = filterUnicode(raw_s);
	if(ws_conn.send){
		//标准WebSocket（浏览器）
		ws_conn.send(raw_s);
	}else{
		if(ws_conn.sendText){
			//nodejs-websocket包...
			ws_conn.sendText(raw_s);
		}else{
			//_d_("ws_conn has no send() or sendText() ?");
			throw new Error("ws_conn has no send() or sendText()");
		}
	}
}
//先看看有没有token，有就看看有没有resp，如果有就把callback调出来
function WS_OnMessage
(ws_conn,data_s,func_req_handler //:处理收到 req 的处理函数
){
//  data_s = strdecode(data_s);
	var data_o=null;
	try{
		data_o=s2o(data_s);
	}
	catch(e){
		_d_("Not JSON:"+data_s);
		//throw new Error("返回非JSON");
		return false;
	}
	if(data_o==null){
		//TODO BSON?
		_d_("Unexpected",data_s);
		throw new Error("Unexpected Format");
		//return false;
	}
	//if(typeof(exports)!="undefined"){
	//	//_d_("WS_OnMessage",data_s);
	//	_d_("WS_OnMessage");
	//}
	///////////////////////////////////////
	var _token=data_o['token'];	
	var _resp_o=null;//返回的object
	if(!_token){
		//如果没有token，直接由用户自己的处理器去处理
		_resp_o=func_req_handler(ws_conn,data_o);
	}else{
		//有token的情况下
		var _resp=data_o['resp'];
		if(_resp){
			//如果信息里面有resp，表示这个是返回的结果，找回相关的callback
				var _callback_obj=_callback_pool[_token];
				if(_callback_obj){
					var _ws_callback=_callback_obj['callback'];
					if(_ws_callback){
						if (_callback_obj['status']==0) {	// 已返回或已超时的不再处理
							//if (_callback_obj['log']==1)	
							//	_d_("DEBUG", "ws time", _token + ", wss req:" + data_o['req_time'] + ", wss rsp:" + data_o['rsp_time'] + ", rsp:" + (new Date()).pattern('hhmmss.S'));
                            _callback_obj['status']=1;//tell it done...yes...whatever
                            _ws_callback(_resp);//还有机会处理出错的哦，所以全双工是会有各种出错可能，逻辑要自己处理好
						}
					}else{
						throw new Error("找不到callback obj for token="+_token);
					}
				}else{
					throw new Error("找不到callback for token="+_token);
				}
				return false;
		}
		var _req=data_o['req'];
		if(_req){			
			//if(func_req_handler) _resp_o={token:_token,resp:func_req_handler(ws_conn,_req,_token)};
			if(func_req_handler) _resp_o={token:_token,resp:func_req_handler(ws_conn,data_o,_token)};
		}
	}
	////////////////////////////////// 是否返回信息
	var _txt=o2s(_resp_o);
	if(_resp_o && _txt && _txt!=""){
		//非空串就返回
		//_d_("准备返回:"+_txt);
		WS_Send_Raw(ws_conn,_txt);
	}else{
		//_d_("未有返回");
	}
}
var _callback_pool={};
//function _WS_Stack(){
//}
function _WS_Stack_CleanUp(){
	var _now=(new Date()).getTime();
	if(Math.random()<0.2)
		//0.2 概率的判断
	{
		for(x in _callback_pool){
			var _time=_callback_pool[x].time || 0;//数字
//			var _cleanup_time=300;//300秒清理,我们的相应要求5分钟(暂时),以后有机会就做成AppConfig
			var _cleanup_time=300*1000;//300秒清理,我们的相应要求5分钟(暂时),以后有机会就做成AppConfig
			var _diff=(_time-_now+_cleanup_time);
			if(_diff<0)
			{
				//_d_("diff="+_diff);
//				_d_("cleanup x="+x);
				_callback_pool[x]=null;//release link
				delete _callback_pool[x];//delete key
			}
		}
	}
}
function WS_Request(ws_conn,req,cb){
	if(!req)req={};
	var _token=UniqTimeSeq();

	var _msg=o2s({
		"token":_token,//自己定义的token,用来追踪返回处理，因为websocket是全双工的
			"req":req
	});

	//堆栈
	_callback_pool[_token]={
		"time":(new Date()).getTime(),//用于house keeping
		"status":0,//0:等待回复,1:已经回复,-1:已经timeout
		//"req":req,
		"callback":cb
	};

	var _readyState=ws_conn?ws_conn.readyState:null;
	if(_readyState==1){
		WS_Send_Raw(ws_conn,_msg);

		//超时检查，目前版本hardcode 30秒...
		setTimeout(function(){
			if(_callback_pool[_token] && _callback_pool[_token].status==0){
				_callback_pool[_token].status=-1;
				cb({errcode:998,errmsg:"timeout"});
			}
		},30000);//在30秒内无操作，基本可以放弃，那不是我们的系统处理水平.当然，可以考虑引入mg_core.Config类，暂时先hardcode
	}else{
		if(cb){
			cb({errcode:999,errmsg:"conn fail "+_readyState});
			//throw new Error("服务器未链接");
		}else{
			throw new Error("cb empty");
		}
	}

	//堆栈清洁...
	_WS_Stack_CleanUp();

    return _token;
}
function WS_Pipe(ws_conn,req,cb,worker){
	if(!req)req={};
    req.pipe = worker;
    return WS_Request(ws_conn,req,cb);
}
function WS_Reply(conn,o,_token){
    WS_Send_Raw(conn,o2s(
        {token:_token,resp:o}
    ));//TODO gzip to save bandwidth
    ////@ref http://nodejs.org/api/zlib.html#zlib_zlib_inflate_buf_callback
    ////@ref http://nodejs.org/api/zlib.html
}

var _ws_conn_pool_2 = {};
var _ws_conn_pool_3 = {};
var _ws_conn_waitlist = {};
var _ws_conn_created_cnt = {};

function getConnectionCount(url) {
	var cnt = 0;
	if (_ws_conn_pool_2[url]) cnt += _ws_conn_pool_2[url].length; 
	if (_ws_conn_pool_3[url]) cnt += _ws_conn_pool_3[url].length;
	return cnt;
}

function getConnectionIds(url) {
	var ret = [];
	if (_ws_conn_pool_2[url]) 
		for(var i=0;i<_ws_conn_pool_2[url].length;i++)
			ret.push(_ws_conn_pool_2[url][i].id);
	if (_ws_conn_pool_3[url]) 
		for(var i=0;i<_ws_conn_pool_3[url].length;i++)
			ret.push(_ws_conn_pool_3[url][i].id);
	return ret;
}

function WS_ReleaseConn(conn) {	
	conn.usingCount --;
	if (conn.usingCount <= 0) {		
		if (_ws_conn_waitlist[conn.url] && _ws_conn_waitlist[conn.url].length > 0) {
			var waitItem = _ws_conn_waitlist[conn.url].shift();
			_d_("DEBUG", "wait connection finished - begin: " + waitItem.beginTime.pattern("yyyy-MM-dd HH:mm:ss.S") + ", now: " + (new Date()).pattern("yyyy-MM-dd HH:mm:ss.S"));
			conn.usingCount = 1;
			waitItem.callback(null, conn);
		} else {
			var inx = _ws_conn_pool_3[conn.url].indexOf(conn);
			if (inx >= 0) _ws_conn_pool_3[conn.url].splice(inx, 1);
			_ws_conn_pool_2[conn.url].push(conn);
		}
	}	
}

function sortConnection(a,b) {
	if (a.readyState != 1) return b.readyState != 1 ? 0 : 1;
	if (b.readyState != 1) return -1;
	return a.usingCount - b.usingCount;
}

function WS_GetConnAsync(ws_url,options,callback){
	if (!_ws_conn_pool_2[ws_url]) _ws_conn_pool_2[ws_url] = [];
	var ws_conn_list = _ws_conn_pool_2[ws_url];
	var ws_conn;
	while (ws_conn_list.length > 0) {
		ws_conn = ws_conn_list.shift();
		if (ws_conn.readyState == 1) {
			// 重复使用备份， 从pool2中拿出时copy一份到pool3，usingCount设为1
			// 每次从pool3拿出来用时usingCount+1, release时usingCount-1。到usingCount=0时，从pool3移除，加回pool2
			// 采取如此复杂的方案，是因为每个conn必须要可以同时使用。
			// 单纯连接池方案必须等待一个任务使用完成之后才能下一个使用，效率很低
			// 一开始创建N个连接必须做在Connection这层，原来那样在WC层的话重连终究是个问题，在Connection层改动也不小，并且思路不清晰，暂时放弃
			// 动态创建Connection方案，因为无上限限制，短时间大量Connection需求的话会造成创建过多连接从而是wss失去响应
			if (!_ws_conn_pool_3[ws_url]) _ws_conn_pool_3[ws_url] = [];
			_ws_conn_pool_3[ws_url].push(ws_conn);
			ws_conn.usingCount = 1;
			callback(null,ws_conn);
			return;
		} else {
			if (_ws_conn_created_cnt[ws_url]>0)
				_ws_conn_created_cnt[ws_url] --;
			else
				_ws_conn_created_cnt[ws_url] = 0;
		}
	}

	if (_ws_conn_created_cnt[ws_url] >= 10) {
		if (!_ws_conn_pool_3[ws_url]) _ws_conn_pool_3[ws_url] = [];	
		_ws_conn_pool_3[ws_url].sort(sortConnection);

		if (_ws_conn_pool_3[ws_url].length > 0 && _ws_conn_pool_3[ws_url][0].readyState == 1) {
			_ws_conn_pool_3[ws_url][0].usingCount ++;
			callback(null, _ws_conn_pool_3[ws_url][0]);
		} else {
			if (!_ws_conn_waitlist[ws_url]) _ws_conn_waitlist[ws_url]=[];
			_ws_conn_waitlist[ws_url].push({callback: callback, beginTime: new Date()});
		}
	} else {
		if (_ws_conn_created_cnt[ws_url]>0)
			_ws_conn_created_cnt[ws_url] ++;
		else
			_ws_conn_created_cnt[ws_url] = 1;

		var isCallbacked = false;
		var cb = function(err,conn) {
			if (!isCallbacked) {
				callback(err,conn);
				if (!conn) _ws_conn_created_cnt[ws_url] --; 
			}
			isCallbacked = true;
		};
	
		try {
            if (typeof WebSocket == "undefined") {
                ws_conn = require("nodejs-websocket").connect(ws_url, function() {
                    _d_("联系上服务器"+ws_url+"，正在报到");
                    WS_Request(ws_conn
                        ,{"_c":"client",_m:"OnWSClientOpen",ping: (new Date()).pattern("MMddhhmmss.S")}//[_c.]_m[(_p)]
                        ,function(rto){
                            _d_("报到后服务器返回resp："+typeof(rto),rto);//连接性测试，对我们来说返回什么也不用鸟它...
                        }
                    );

                    if (!_ws_conn_pool_3[ws_url]) _ws_conn_pool_3[ws_url] = [];
                    _ws_conn_pool_3[ws_url].push(ws_conn);
                    ws_conn.usingCount = 1;
                    cb(null,ws_conn);
                });

                ws_conn.on("text", function (data_s) {
                    //_d_("on text",data_s);
                    try{
                        WS_OnMessage(ws_conn,data_s);
                    }catch(ex){
                        _d_("conn.text.err",ex.stack);
                    }
                });
                ws_conn.on("error",function(e){
                    _d_('ws_conn.onerror=',arguments);
                    cb("Connection error");
                });

            } else {
                ws_conn= new WebSocket(ws_url);
                ws_conn.id = _ws_conn_created_cnt[ws_url];
                ws_conn.addEventListener("open", function(){
                    //默认处理
                    _d_("联系上服务器"+ws_url+"，正在报到");
                    WS_Request(ws_conn
                        ,{"_m":"OnWSClientOpen","ping":((new Date()).pattern("MMddhhmmss.S"))}//[_c.]_m[(_p)]
                        ,function(rto){
                            _d_("报到后服务器返回resp："+typeof(rto),rto);//连接性测试，对我们来说返回什么也不用鸟它...
                        }
                    );

                    if (!_ws_conn_pool_3[ws_url]) _ws_conn_pool_3[ws_url] = [];
                    _ws_conn_pool_3[ws_url].push(ws_conn);
                    ws_conn.usingCount = 1;
                    cb(null,ws_conn);
                });
                ws_conn.addEventListener("error",function(evt){
                    //_d_('ws_conn.onerror=' + ((e&&e.data)?e.data:e));
                    _d_('ws_conn.onerror=',arguments);
                    cb("Connection error");
                });

                //onmessage(event)中的event只有.data，根据：https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
                //ws_conn.onmessage =
                ws_conn.addEventListener("message",function(ws_evt){
                    var _data_s=(ws_evt?ws_evt.data:"");//raw text return
                    //			try{
                    WS_OnMessage(ws_conn,_data_s);
                    //			}catch(ex){this.emit("error",ex);}
                });

                ws_conn.addEventListener("close",function (e){
                    var _readyState=ws_conn.readyState;
                    _d_('ws_conn.onclose='+ws_conn.readyState);
                });
            }
		} catch(e) {
			cb(e);
		}
	}
}

//WS_Request
var _ws_conn_pool={};
function WS_GetConn(ws_url,ensureOpen){
	var ws_conn=_ws_conn_pool[ws_url];
	if(!ws_conn) return null;
	var _readyState=ws_conn?ws_conn.readyState:null;
	if(_readyState==1 || (!ensureOpen && _readyState==0)){
		return ws_conn;
	}
	return null;
}

var _callback_on_open=[];
function WS_Init(ws_url,ws_keepalive_checktime,reconn_callback,errBreak){
	var ws_conn=_ws_conn_pool[ws_url];

	//readyState
	//0： 正在连接
	//1： 连接成功
	//2： 正在关闭
	//3： 连接关闭

	var _readyState=ws_conn?ws_conn.readyState:null;
	if(_readyState!=1 && _readyState!=0){
		//_d_("new WebSocket, 'coz ws_conn.readyState="+_readyState);
		if(_readyState==null){
			_d_("状态("+_readyState+"),首次连接 "+ws_url);
		}else{
			_d_("状态("+_readyState+"),重连 "+ws_url);
		}
		try{
			//先把之前的给尝试断开
			if(ws_conn) ws_conn.close();
			//旧的应该是会被内存回收的...吧...
			_ws_conn_pool[ws_url]=null;
			delete _ws_conn_pool[ws_url];
		}catch(e){_d_("WS_Init.e="+e);}

		ws_conn= new WebSocket(ws_url);
		_ws_conn_pool[ws_url]=ws_conn;

		//reattach事件
		//WebSocket#onopen, onmessage, onclose, onerror

		ws_conn.addEventListener("open", function(){
			var _ws_conn=_ws_conn_pool[ws_url];
			if(reconn_callback){
				reconn_callback(_ws_conn);
			}else{
				//默认处理
				_d_("联系上服务器"+ws_url+"，正在报到");
				WS_Request(_ws_conn
				 ,{"_c":"client","_m":"OnWSClientOpen","ping":((new Date()).pattern("MMddhhmmss.S"))}//[_c.]_m[(_p)]
				 ,function(rto){
				 _d_("报到后服务器返回resp："+typeof(rto)+","+$.toJSON(rto));//连接性测试，对我们来说返回什么也不用鸟它...
				 }
				);
			}

			var cb;
			while(cb = _callback_on_open.pop()) {
				cb.call();	
			}
		});
		ws_conn.addEventListener("error",function(ex){
				//_d_('ws_conn.onerror=' + ((e&&e.data)?e.data:e));
				_d_('ws_conn.onerror=');
				_d_(ex);
      if(errBreak){
        reconn_callback(null);
      }
				//这里除了报告外不用其它操作，因为Timer每n秒会检测重连的了
		});

		//onmessage(event)中的event只有.data，根据：https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
		//ws_conn.onmessage =
		ws_conn.addEventListener("message",function(ws_evt){
			var _ws_conn=_ws_conn_pool[ws_url];
			var _data_s=(ws_evt?ws_evt.data:"");//raw text return
//			try{
				WS_OnMessage(_ws_conn,_data_s);
//			}catch(ex){this.emit("error",ex);}
		});

		//我们的应用暂时不需要用到binary&scream，以后如果要用到的话。。再说。。
		//ws_conn.binaryType = 'arraybuffer';
		//ws_conn.onmessage = function(e) {
		//	_d_(e.data.byteLength); // ArrayBuffer object if binary
		//};

		//ws_conn.onclose =
		ws_conn.addEventListener("close",
			function (e){
				var _ws_conn=_ws_conn_pool[ws_url];
       if(_ws_conn) {
				var _readyState=_ws_conn.readyState;
				if(_readyState==1 || _readyState==0){
					_d_('ws_conn.onclose='+_ws_conn.readyState);
				}
				}
			}
		);
	}

	//检测与server的连接...
	var time_check_conn=(ws_keepalive_checktime?ws_keepalive_checktime:5000);//默认5秒确诊一次..
	//是啊，我知道怪怪的...:
  if(!errBreak){
	UniqTimer(function(){
			WS_Init(ws_url,time_check_conn,reconn_callback,false);
			},time_check_conn,"WS_Init"+ws_url);
  }
	//return ws_conn;
};//WS_Init

function WS_RemoveConn(ws_url){
  ClearUniqTimer("WS_Init"+ws_url);
  _ws_conn_pool[ws_url]=null;
 delete _ws_conn_pool[ws_url] ;
}
if(typeof(exports)!="undefined"){
	exports.WS_OnMessage=WS_OnMessage;//mg ws logic standard...
	exports.WS_Send_Raw=WS_Send_Raw;
	exports.WS_Request=WS_Request;
    exports.WS_Reply = WS_Reply;
    exports.WS_GetConnAsync = WS_GetConnAsync;
}else{
	//////////////////////////////////////////////////////
}

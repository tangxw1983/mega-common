var try_require=function(m){try{return require(m);}catch(ex){return null}};
//var xmlhttprequest=try_require('xmlhttprequest');
//console.log("xmlhttprequest",xmlhttprequest);
var mg_core=try_require('mega-common') || try_require('../mg_core.js') || try_require('./mg_core.js');
//console.log(mg_core);

mg_core.ajax.get("http://www.baidu.com/",function(s){
	mg_core.console_log(s);
});

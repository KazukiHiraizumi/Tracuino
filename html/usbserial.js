var ab2str=function(buf){
  var ary=new Uint8Array(buf);
	var str='';
	for(var i=0;i<buf.byteLength;i++){
		str+=String.fromCharCode(ary.buffer[i]);
	}
	return str;
}
var dv2str=function(buf){
	var str='';
	for(var i=0;i<buf.byteLength;i++){
		str+=String.fromCharCode(buf.getUint8(i));
	}
	return str;
}
var str2ab=function(str){
  var ab=new Uint8Array(str.length);
  for (var i=0;i<str.length;i++) {
    ab[i]=str.charCodeAt(i);
  }
  return ab;
}

var ab2hex=function(buf){
  var ary=new Uint8Array(buf);
	var hex=[0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x41,0x42,0x43,0x44,0x45,0x46];
	var str='';
	for(var i=0;i<buf.byteLength;i++){
		str+=String.fromCharCode(hex[ary[i]>>4]);
		str+=String.fromCharCode(hex[ary[i]&0x0f]);
		str+=',';
	}
	return str;
}

var USBSerial=function(){
	this.device=null;
	this.wdt=0;
	this.decoder=new TextDecoder();
}
USBSerial.prototype={
	device:null,
	wdt:0,
	onConnect:null,
	onReceive:null,
	onReceiveError:null,
	onTimeout:null,
	lineBuffer:"",
	readLoop:function(){
		this.device.transferIn(5, 64).then(result => {
			this.lineBuffer+=dv2str(result.data);
			while(true){
				var sof=this.lineBuffer.indexOf(String.fromCharCode(0xF0));
				var eof=this.lineBuffer.indexOf(String.fromCharCode(0xF7));
				if(sof>=0 && eof>0 && sof<eof){
					var f=this.lineBuffer.slice(sof,eof+1);
					this.onReceive(f);
					this.lineBuffer=this.lineBuffer.slice(eof+1);
				}
				else break;
			}
			this.readLoop();
		}, error => {
			this.onReceiveError(error);
		});
	},
//	const filters = [{ 'vendorId': 0x2341, 'productId': 0x8036 } , { 'vendorId': 0x2341, 'productId': 0x8037 }];
	connect:function(filters){
		this.lineBuffer = "";
		this.wdt=0;
		if(this.device!=null){
			throw 'Connecton Busy';
			return;
		}
		navigator.usb.requestDevice({ 'filters': filters }).then(device => {
			return this.device=device;
		}).then(device => {
			return device.open();
		}).then(_ => {
			if (this.device.configuration == null){
				return this.device.selectConfiguration(1);
			}
		}).then(_ => {
			return this.device.claimInterface(2);
		}).then(_ => {
			return this.device.controlTransferOut({
				'requestType': 'class',
				'recipient': 'interface',
				'request': 0x22,
				'value': 0x01,
				'index': 0x02});
		}).then(_ => {
			var target=this;
			setInterval(function(){
				if(target.wdt>0){
					target.wdt--;
					if(target.wdt==0) target.onTimeout();
				}
			},100);
			this.onConnect();
			this.readLoop();
		}).catch(error => {
			console.log('>>Argh! '+error);
			throw error;
		});
	},
	disconnect:function(){
		if(this.device==null){
			throw 'Not Connected';
			return;
		}
		return this.device.controlTransferOut({
			'requestType': 'class',
			'recipient': 'interface',
			'request': 0x22,
			'value': 0x00,
			'index': 0x02}
		).then(_ => {
			this.device.close();
			this.device=null;
		}).catch(error => {
			console.log('>>Argh! '+error);
			throw error;
		});
	},
	send:function(msg){
		this.lineBuffer="";
		if (this.device==null) return;
		return this.device.transferOut(4,str2ab(msg)).then(_ => {
			console.log('send:'+ab2hex(str2ab(msg)));
		}).catch(error => {
			console.log('>>Argh! '+error);
			throw error;
		});
	},
	flush:function(){
		this.lineBuffer="";
		if (this.device==null) return;
	}
}

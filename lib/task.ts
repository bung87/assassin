/// <reference path="../typings/raphael/raphael.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

class Task{
    arg:string
    ws:WebSocket
    type:string
    deferred: any;
    constructor(t:string,a:any,ws:WebSocket){
           this.type = t;
           let local = getLocation(a);
           this.arg = local ? local.hostname : a;
           this.ws = ws;
           this.deferred = $.Deferred();
    }
    ipResolve = (arg:string):Thenable<any> => {
         let dtd = $.Deferred(),
         ip = localStorage.getItem(arg);
           if(ip){
                dtd.resolve(ip);
                return dtd;
           }else{
               return $.getJSON('/ip?net='+encodeURIComponent(arg),function(d){
                            console.log(d)
                            localStorage.setItem(d.host_name,d.ip)
                   }
                )
           }
           return dtd;    
      }
    resolveGeoip (ip){
            let d = new Date(),t = d.getTime(), dtd = $.Deferred();
            window[t.toString()] = function(data){
                dtd.resolve(data);
            };
            let data =JSON.stringify({t:'resolveGeoip',a:ip,cb:"window['"+ t.toString() + "']"});
            this.ws.send(data);
            return dtd;
    }
    resolveIp(){//resolve hostname, get ip address
        let dtd = $.Deferred(),
        task = this;
        $.when(this.ipResolve(this.arg))
        .done( (data)=>console.log('resolve ip:',data) )
        .then(function(data){
            let ip = null;
            if(typeof data =='string'){ //resolved by localStorage
                ip = data;
            }else if(typeof data == 'object'){
                ip = data.ip;
            }else{
                //nothing to do
            }       
                 
            $.when(task.resolveGeoip(ip))
            .done(function(data){
                // window[resolveGeoipTask.tid] = null;   
                
                dtd.resolve(data) 
                console.log('resolve Geoip:',data);
            })
            .fail(function(){
                dtd.reject();
        console.log('resolve Geoip failed!');
        });
       })
       return dtd

    }
}
 class AssassinTask extends Task {
    constructor(t:string,a:any,ws:WebSocket){
    super(t, a, ws);
    }
   prepare() {
     return this.resolveIp()
    }
    run(){
        
        let d = new Date(),t = d.getTime(),
        ts = t.toString()+Math.random().toString();
        window[ts] = (data) =>{
          console.log('process data',data);          
          this.deferred.notifyWith(this ,[data]);
          };
        let data = JSON.stringify({t:this.type,a:this.arg,cb:"window['"+ ts.toString() + "']"});
        console.log('send data',data)
        this.ws.send(data);
        return this.deferred;
    }
}
class Url{
    protocol:string;
    host:string;
    hostname:string;
    port:number;
    pathname:string;
    search:string;
    hash:string;
}

function getLocation(href:string) :Url{
    let match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match &&  {
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port:parseInt( match[4]),
        pathname: match[5],
        search: match[6],
        hash: match[7]}
}

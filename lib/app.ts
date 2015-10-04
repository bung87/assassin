/// <reference path="../typings/raphael/raphael.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="task.ts" />
/// <reference path="sanzio.ts" />
/// <reference path="geoip.ts" />

(function (window, $) {

    let ws = new WebSocket(window.ws_url)
    ;

    ws.onmessage = function (event) {
        let data = JSON.parse(event.data);
        if(data.cb){
            console.log('callback:', "(" + data.cb + "(" + JSON.stringify(data.data) + "))");
            eval("(" + data.cb + "(" + JSON.stringify(data.data)+"))");
        }
        console.log('onmessage data:', JSON.stringify(data.data));
    }
    $(document).ready(function(){


        let paper = Raphael('central', 1000, 400)
        , sanzio =  new Sanzio(paper)
        ,$task_types = $('#task_types')
        , $task_types_links = $task_types.find('a')
        , $central_front = $('#central_front')
        , $request_send_btn = $('#request_send_btn')
        , $request_ipt = $('#request_ipt')
        , $task_result = $('#task_result')
        , $task_result_inner = $('#task_result_inner')
        , task_type = null
        ;
        $.getJSON('/static/json/world.json',  (worldmap) => sanzio.drawWorld(worldmap));
        
    $task_types_links.on('click', function (e) {
        let input = $(this).get(0);

        $task_types_links.each(function (i, v) {
            let $v = $(v);
            if (v != input) {
                $v.removeClass('active');
            } else {
                if($v.hasClass('active')){
                    $v.removeClass('active');
                    task_type = null
                }else{
                    $v.addClass('active');
                    task_type = $v.data('task');
                }

            }
        });

    });
 $('#fullpage').fullpage({
     anchors: ['main'],
     onSlideLeave: function(anchorLin, index, slideIndex, direction, nextSlideIndex){
             let $active_task = $task_types_links.filter('.active')
                 ,task_type = $active_task.data('task')
                 , active_index = $task_types_links.index($active_task)
                 ,leavingSlide = $(this);
             if (direction == 'right' && task_type && active_index+1!= nextSlideIndex){
                 $.fn.fullpage.silentMoveTo(index, active_index+1);
                return false;
             } else if (direction == 'left' && task_type && nextSlideIndex!=0){
                 $.fn.fullpage.silentMoveTo(index, 0);
                return false;
             }


     }
        });
    $request_send_btn.on('click', function () {
        let request_val =$request_ipt.val()
        ,request_content = (!!request_val) && request_val.trim()
        task_type = $task_types_links.filter('.active').data('task')
        ;
        if(!request_content){

        }

        console.info('task :',task_type,request_content);
        let task = new AssassinTask(task_type,request_content,ws);
        task.prepare().done(function(geoip:GeoIp){
            $central_front.hide();
            let showurl = task.arg;
            sanzio.paper.text(0, 14, showurl).attr({
                'font-size': '14',
                'text-anchor': 'start'
            });
            let table_id = `#${task_type}-table`;
            if ($.fn.dataTable.isDataTable(table_id) ){
                $(table_id).DataTable().destroy();
            }
            let table_settings = {
                ping:{
                    "columns": [
                    {'data':'executor.host'},
                    { "data": "task_result.minping" },
                    {"data": "task_result.maxping" }, 
                    { "data": "task_result.avgping" }]
                },
                dns:{
                    "columns": [
                    {'data':'executor.host'},
                    { "data":"task_result.time" }]
                }, 
                traceroute:  {
                    "columns":[
                    { 'data': 'hostname' },
                    {'data':'ms1'},
                    {'data':'ms2'},
                    {'data':'ms3'},
                    ]
                }

            };
            let api = $(table_id).DataTable(table_settings[task_type]);
            task.run().progress(function(data){ 
                console.log('resolve result', data, 'task type:',this.type);
                var result = data.task_result, cb = data.cb, source, executor = data.executor,target = this.arg;
                if (this.type == 'ping') {
                    let tem = `<p>${executor.host} PING ${target} min:${result.minping}ms,avg:${result.avgping}ms,max:${result.maxping}ms`;
                    $task_result_inner.append(tem);
                        // try{
                            let source = sanzio.setPoint(data.executor.geoip);
                         // }catch(e){
                            // console.error(e);
                              // }
                              let pos = sanzio.getXY(geoip.lat,geoip.lon)
                              ,anim = Raphael.animation(pos, 2e3)
                              ;
                              if (source)
                                  source.animate(anim);
                              api.row.add(data).draw();
                          }else if(this.type == 'dns'){
                              api.row.add(data).draw();
                              console.info(data);
                          } else if (this.type == 'traceroute') {
                              api.rows.add(result).draw();
                          }
                      }).done(function(data){
                          console.log('task done')
                      });
                  })
.fail(function(){
    console.log('could not resolve ip!');
});

});
   function showSampleDot(){
        let geoip:GeoIp ={lat: 35.69, lon: 139.69},
        targetDot = sanzio.setPoint(geoip),
        outterDotAni = Raphael.animation({r: 20, opacity: 0}, 2e3),
        innerDotAni = Raphael.animation({r: 15, opacity: 0}, 2e3),
        innerDot = targetDot.clone().attr({fill:'#238CC3', stroke: '#fff',opacity:0.8,
                'stroke-width':1}),
        outterDot=targetDot.clone().attr({opacity:0.5});
        innerDot.animate(innerDotAni.repeat(500)); 
        outterDot.animate(outterDotAni.delay(1.5e3).repeat(500)); 
   }

});//end ready
        

})(window, $);


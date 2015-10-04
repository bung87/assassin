/// <reference path="../typings/raphael/raphael.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="geoip" />


//Sanzio
// let COLORS = new symbol();


const latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i
 class Sanzio {
    paper:RaphaelPaper;
    COLORS:  string[] =[
             '#2DB200',
             '#85B200',
             '#D9A300',
             '#D96D00',
             '#D90000'
        ]
    constructor(paper){
    this.paper = paper;
}
    born(){

    }
    drawWorld(worldmap){
        this.paper.setStart();
        var over = function () {
            this._color = this._color || this.attr("fill");
            this.stop().animate({fill: "#bacabd"}, 500);
        },
        out = function () {
            this.stop().animate({fill: this._color}, 500);
        };
    
    
         for (let country in worldmap.shapes) {
            let path = this.paper.path(worldmap.shapes[country])
            .attr({stroke: "#ccc6ae", fill: "#f0efeb", "stroke-opacity": 0.25}).data('country',worldmap.names[country]);
            path.hover($.proxy(over,path), $.proxy(out,path));

        }
        this.paper.setFinish();
        
    }
    getXY (lat:number, lon:number) {
        return {
            cx: lon * 2.6938 + 465.4,
            cy: lat * -2.6938 + 227.066
        };
    }
    geo2pos(geo:GeoIp){
         return {x: geo.lon * 2.6938 + 465.4,
           y: geo.lat * -2.6938 + 227.066
         }
    }
    parseLatLon  (latlon:string) {
        let m = String(latlon).split(latlonrg),
            lat = m && +m[1] + (parseInt(m[2]) || 0) / 60 + ( parseInt(m[3]) || 0) / 3600;
        if (m[4].toUpperCase() == "S") {
            lat = -lat;
        }
        let lon = m && +m[6] + (parseInt(m[7]) || 0) / 60 + ( parseInt(m[8]) || 0) / 3600;
        if (m[9].toUpperCase() == "W") {
            lon = -lon;
        }
        return this.getXY(lat, lon);
    }
     
    pick_color_by_timefunction(time:Number){
             if (time < 1) return this.COLORS[0];
             else if (time < 2) return this.COLORS[1];
             else if (time < 3) return this.COLORS[2];
             else if (time < 5) return this.COLORS[3];
             else return this.COLORS[4];
        }
    setPoint(p) {
        let a = {
                "x": 0,
                "y": 0,
                "r": 5,
                // "opacity": 0.5,
                "fill": "#238CC3",
                "stroke": "#238CC3",
                "stroke-width": 0,
                "stroke-linejoin": "round"
            },
            city = p.city,
            pos = this.geo2pos(p);
            if(!!city)
                this.paper.text(pos.x, pos.y-20, city);
            else
                console.warn("Sanzio.setPoint(p) p should has city property");
            $.extend(true, a, p);
        return this.paper.circle(pos.x, pos.y, a.r).attr(a);
        }
};
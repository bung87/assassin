# Assassin  
Assassin is a web-based ping,dig,traceroute service.

![brower preview](assassin_preview.png) 

## Technology stack
* [Tornado](https://www.tornadoweb.org/)
* [SaltStack](http://saltstack.com/) 
* [jQuery](https://jquery.com/)
* see [requirements.txt](./requirements.txt) [bower.json](./bower.json) for full list  

## Prerequisites  
This product includes GeoLite2 data created by MaxMind, available from [http://www.maxmind.com](http://www.maxmind.com)  
`wget http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz`  
`gzip -d GeoLite2-City.mmdb.gz`  
## Installation  
`pip install -r requirements.txt`  
`npm install && bower install && tsd install`  

## Development  
`python server.py --debug=true`
Just take a look at `localhost:8080/client`

## LICENSE
GNU GENERAL PUBLIC LICENSE Version 2

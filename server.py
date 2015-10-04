#-*- coding: utf-8 -*-
#!/usr/bin/env python
import os
from functools import  partial
from tornado.options import options
from tornado.web import url
import tornado.websocket
# import tornadoredis.pubsub
import tornado.web
import tornado.gen
import tornado.ioloop
import json
import time
import tornado.httpserver
# from tornado.httpclient import AsyncHTTPClient
from six.moves.urllib.parse import urlparse
# import uuid
import six
try:
    import salt_client
except:
    pass
import string
import salt_result_parser
# c = tornadoredis.Client()
# c.connect()
# client = tornadoredis.Client(host='127.0.0.1',port=6379,selected_db=0)
# subscriber = tornadoredis.pubsub.SocketIOSubscriber(client)
client_post_minimal_keys = frozenset(['a','t'])
ALLOWED_COMMANDS = {
    'ping':'network.ping',
    'traceroute':'network.traceroute',
    'dns':'network.dig'
}
import socket
import geoip2.database
reader = geoip2.database.Reader('GeoLite2-City.mmdb')

class ClientHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html",**{'host_port':self.request.host})


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello")

class IpHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        # http_client = AsyncHTTPClient()
        net = self.get_argument('net')
        print(net)
        if net.startswith('http'):
            host_name = urlparse(net).hostname
        else:
            host_name = net
        if host_name:
            try:
                host_ip = socket.gethostbyname(host_name)
                self.finish(json.dumps({
                    'host_name':host_name
                    ,'ip':host_ip
                }))
            except socket.gaierror as e:
                pass
        # since request need geoip deprecated
        # address = self.get_argument('address')
        # try:
        #     response = yield http_client.fetch("http://ip.taobao.com/service/getIpInfo.php?ip=%s" % address)
        # except tornado.web.HTTPError:
        #     self.finish(json.dumps({'code':1}))
        # self.write(response.body)
import test_data
def fake_run(tgt,func,args,**kwargs):
    print('fake run')
    key = None
    for k,f in ALLOWED_COMMANDS.items():
        if f == func:
            key = k
            break
    print(key)
    for s in getattr(test_data,key):
        time.sleep(0.3)
        yield s

class Assassin(tornado.websocket.WebSocketHandler):

    # def open(self):
        # print("WebSocket opened")
         # Generate a user ID and name to demonstrate 'private' channels
        # self.user_id = str(uuid.uuid4())[:5]
        # print('user_id:',self.user_id)
        # Subscribe to 'broadcast' and 'private' message channels
        # subscriber.subscribe(['private.{}'.format(self.user_id)],  self)

    def resolveGeoip(self,ip):
        response = reader.city(ip)
        return response.location.latitude,response.location.longitude,response.city.name


    def on_message(self, message):
        #message from redis or user
        # print(type(message)) <type 'unicode'>
        data = json.loads(message)
        keys = data.keys()

        l = len(client_post_minimal_keys.intersection(keys))
        if(l==0):
            pass
            # assuming task result
        else:
            t = data['t']
            a = data['a']
            print('t:%s,a:%s' % (t,a))
            # assuming task request
            if t == 'resolveGeoip':
                lat,lon,city = self.resolveGeoip(a)
                data = dict(t='resolvedGeoip',data = {'lat':lat,'lon':lon,'city':city},cb = data['cb'])
                self.write_message(json.dumps(data))
            if not isinstance(a, list):
                a = [a]

            if t in ALLOWED_COMMANDS.keys():
                tgt = '*'
                if not options.debug:
                    runner = salt_client.SaltRunner()
                func = ALLOWED_COMMANDS[t]
                print('func:%s' % func)
                if options.debug:
                    generator  = fake_run(tgt, func, a)
                else:
                    generator  = runner.run(tgt, func, a)
                # generator  = fake_run(tgt, t, a)
                func = partial(self.loop,generator,t,a,data['cb'])
                tornado.ioloop.IOLoop.current().spawn_callback(func)

    def loop(self,generator,t,a,cb):
        try:
            result = {}
            text = six.next(generator)
            data = json.loads(text)
            minion_host, v = data.popitem()
            try:
                host_ip = socket.gethostbyname(minion_host)
            except Exception as e:
                print('can not get host by name %s' % e)
            lat,lon,city = self.resolveGeoip(host_ip)
            try:
                task_result=salt_result_parser.parse(t,v)
            except Exception as e:
                print('can not get task result %s' % e)
            result['executor'] = {
                'host':minion_host,
                'geoip':{'lat':lat,'lon':lon,'city':city}
            }
            result['task_result'] = task_result
            self.write_message(json.dumps({'t':t,'data':result,'cb':cb}))
            func = partial(self.loop,generator,t,a,cb)
            tornado.ioloop.IOLoop.current().spawn_callback(func)
        except StopIteration:
            # self.finish()
            pass
        except Exception as e:
            print(e)




    # def on_close(self):
    #     print("WebSocket closed")
    #     subscriber.unsubscribe('private.{}'.format(self.user_id), self)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            url(r'/', MainHandler, name='index'),
            url(r'/client', ClientHandler, name='client'),
            url(r'/assassin', Assassin, name='assassin'),
            url(r'/ip', IpHandler, name='ip'),
        ]
        tornado.web.Application.__init__(self,

                                         handlers = handlers,
                                         debug=options.debug,
                                         template_path=os.path.join(os.path.dirname(__file__), "templates"),
                                         static_path=os.path.join(os.path.dirname(__file__), "static")
        )


def main():
    tornado.options.parse_config_file("config.py")
    tornado.options.parse_command_line()
    application = Application()
    if options.debug:
        application.listen(options.port)
    else:
        server = tornado.httpserver.HTTPServer(application)
        server.bind(options.port)
        server.start(0)
    tornado.ioloop.IOLoop.current().start()
    reader.close()

if __name__ == '__main__':
    main()
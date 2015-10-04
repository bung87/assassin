import salt.client
from  urlparse import urlparse

class SaltRunner():
    #http://docs.saltstack.cn/zh_CN/latest/ref/clients/index.html
    def __init__(self):
        self.client = salt.client.LocalClient() #https://github.com/saltstack/salt/issues/24750
    def run(self,tgt,func,args,**kwargs):
        if func in ['network.ping','network.traceroute','network.dig']:

            r = urlparse(args[0])
            args[0] = r.hostname
        return self.client.cmd_iter.apply(tgt,func,args,**kwargs)

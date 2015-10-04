import utils.pingparser
from dnslib.dns import RR,QTYPE,CLASS,DNSRecord
import re
def rr_toJSON(self):
    if self.rtype == QTYPE.OPT:
        # s = ["<DNS OPT: edns_ver=%d do=%d ext_rcode=%d udp_len=%d>" % (
        #             self.edns_ver,self.edns_do,self.edns_rcode,self.edns_len)]
        data = dict(edns_ver=self.edns_ver,do=self.edns_do,ext_rcode=self.edns_rcode,udp_len=self.edns_len)
        data.update(opts=[repr(opt) for opt in self.rdata])
        return data
    else:
        # "<DNS RR: '%s' rtype=%s rclass=%s ttl=%d rdata='%s'>" % (
        #         self.rname, QTYPE.get(self.rtype), CLASS.get(self.rclass),
        #         self.ttl, self.rdata)
        data = dict(rname = str(self.rname),
                    rtype = QTYPE.get(self.rtype), # 1:'A', 2:'NS', 5:'CNAME', 6:'SOA', 12:'PTR', 15:'MX'
                    rclass = CLASS.get(self.rclass),# 1:'IN', 2:'CS', 3:'CH', 4:'Hesiod', 254:'None', 255:'*'
                    ttl = self.ttl,
                    rdata = str(self.rdata))
        return data

setattr(RR,'toJSON',rr_toJSON)

def parse(t,d):
    if t == 'traceroute':
        #minionid:list({'count': 1, 'ip': '106.187.33.3', 'hostname': '106.187.33.3', 'ms3': 13.132, 'ms2': 13.153, 'ms1': 6.3280000000000003})
        return d
    elif t == 'ping':
        #minionid:{'received': '2', 'jitter': '3.736', 'avgping': '17.682', 'minping': '13.946',
        #  'host': 'www.l.google.com', 'maxping': '21.418', 'sent': '2'}
        return utils.pingparser.parse(d)
    elif t == 'dns':
        time = 'unknown'
        i = d.find('Query time')
        s = d[i:]
        pattern = re.compile(r'Query time: (\d+) msec')
        match = pattern.match(s)
        if match:
            time = match.group(1)
        #minionid:list({'rname':'www.163.com.','rtype':'CNAME','rclass':'IN','ttl':534,'rdata':'www.163.com.lxdns.com.'})
        res = dict(time = time,records = [r.toJSON() for r in RR.fromZone(d)])
        return res
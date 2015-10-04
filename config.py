from tornado.options import define

define("port", default=8080, help="run on the given port", type=int)
define("debug", default=False, type=bool)

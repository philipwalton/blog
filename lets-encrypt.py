import webapp2


class LetsEncryptHandler(webapp2.RequestHandler):

  def get(self, challenge):
    self.response.headers['Content-Type'] = 'text/plain'
    responses = {
      'bbqu0YGnx9b8Hxsif46PuxFKZGXtnmYtiAuO5tk4vPo': 'bbqu0YGnx9b8Hxsif46PuxFKZGXtnmYtiAuO5tk4vPo.tHis8AlNXPoEkqw8t5LYC_pdB-aK5ZjNvEXeGa59H3Q',
      'hMO3M9IBfvdE7ba_r_V2yzShIm8t2nF-IwL3-U_SZSw': 'hMO3M9IBfvdE7ba_r_V2yzShIm8t2nF-IwL3-U_SZSw.tHis8AlNXPoEkqw8t5LYC_pdB-aK5ZjNvEXeGa59H3Q'
    }
    self.response.write(responses.get(challenge, ''))


app = webapp2.WSGIApplication([
  ('/.well-known/acme-challenge/([\w-]+)', LetsEncryptHandler),
])
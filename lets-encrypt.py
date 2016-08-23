import webapp2


class LetsEncryptHandler(webapp2.RequestHandler):

  def get(self, challenge):
    self.response.headers['Content-Type'] = 'text/plain'
    responses = {
      'eGct83-Lcg9d5tYLHc_zi6j5L7Xpdrjfi_i1D4rSnC8': 'eGct83-Lcg9d5tYLHc_zi6j5L7Xpdrjfi_i1D4rSnC8.16cQAAO3n4I2S_GnHM0iIAaBK2Cmy1N6_W-SO7zZWxQ',
    }
    self.response.write(responses.get(challenge, ''))


app = webapp2.WSGIApplication([
  ('/.well-known/acme-challenge/([\w-]+)', LetsEncryptHandler),
])
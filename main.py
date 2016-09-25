import copy
import dateutil.parser
import htmlmin
import webapp2
import jinja2
import json
import logging
import pytz
import yaml

from datetime import datetime
from webapp2_extras.routes import RedirectRoute


env = jinja2.Environment(loader=jinja2.FileSystemLoader('templates'))


# This only needs to be loaded once.
with open('book.yaml') as file:
  book = yaml.load(file)


# This only needs to be loaded once.
with open('build/book.json') as file:
  book = json.load(file)


def to_local_dt(utc_dt, tz_str):
  tz = pytz.timezone(tz_str)
  local_dt = utc_dt.replace(tzinfo=pytz.utc).astimezone(tz)
  return tz.normalize(local_dt)


def datetimeformat(value, format='%B %-d, %Y'):
  date = dateutil.parser.parse(value)
  return to_local_dt(date, book['site']['timezone']).strftime(format)


env.filters['datetimeformat'] = datetimeformat


def get_page(slug):
  path = '/' + (slug + '/' if slug != 'index' else '')
  return [p for p in book['pages'] if p['path'] == path][0]


def get_article(slug):
  path = '/articles/' + slug + '/'
  return [a for a in book['articles'] if a['path'] == path][0]


def respond_404(response):
  template = env.get_template('404.html')
  template_data = copy.deepcopy(book)
  template_data['page'] = {'title': 'Page Not Found'}
  response.status = 404
  response.write(minify_html(template.render(template_data)));


def minify_html(html):
  return htmlmin.minify(html, {
    'remove_all_empty_space': True,
    'reduce_boolean_attributes': True,
    'remove_optional_attribute_quotes': True,
  })


class FeedHandler(webapp2.RequestHandler):
  def get(self):
    try:
      template = env.get_template('atom.xml')
      html = template.render(book)
      self.response.content_type = 'application/xml; charset=utf-8'
      self.response.write(html)
    except Exception as err:
      logging.error(err)
      respond_404(self.response)


class PageHandler(webapp2.RequestHandler):
  def get(self, slug='index'):
    try:
      template = env.get_template(slug + '.html')
      template_data = copy.deepcopy(book)
      template_data['page'] = get_page(slug)

      html = minify_html(template.render(template_data))
      self.response.write(html)
    except Exception as err:
      logging.error(err)
      respond_404(self.response)


class ArticleHandler(webapp2.RequestHandler):
  def get(self, slug):
    try:
      template = env.get_template('article.html')
      template_data = copy.deepcopy(book)
      template_data['page'] = get_article(slug)

      html = minify_html(template.render(template_data))
      self.response.write(html)
    except Exception as err:
      logging.error(err)
      respond_404(self.response)


class NotFoundHandler(webapp2.RequestHandler):
  def get(self):
    respond_404(self.response)


app = webapp2.WSGIApplication([

  ('/atom.xml', FeedHandler),
  RedirectRoute('/feed/', handler=FeedHandler, name='Feed', strict_slash=True),

  RedirectRoute('/', handler=PageHandler,
      name='Home', strict_slash=True),
  RedirectRoute('/<slug>/', handler=PageHandler,
      name='Page', strict_slash=True),
  RedirectRoute('/articles/<slug>/', handler=ArticleHandler,
      name='Article', strict_slash=True),

  (r'/.*', NotFoundHandler),

], debug=False)

module Jekyll
  module Excerpt
    def excerpt(post, count = 50)
      if post["excerpt"]
        excerpt = post["excerpt"]
      else
        excerpt = post["content"].split(/\s+/, count+1)[0...count].join(' ')
        excerpt.gsub!(/<[^>]*>/, '')
      end
      excerpt
    end
  end
end

Liquid::Template.register_filter(Jekyll::Excerpt)
# module Jekyll

#   module Partials
#     def write_partial(dest, page)
#       path = destination(dest)
#       if path =~ /index\.html$/
#         path.gsub!(/index\.html$/, "_index.html")
#         if page.output =~ /<main[^>]*>([\s\S]*?)<\/main>/
#           partial = $1
#           FileUtils.mkdir_p(File.dirname(path))
#           File.open(path, 'w') do |f|
#             f.write(partial)
#           end
#         end
#       end
#     end
#   end

#   class Page
#     include Partials
#     alias_method :orig_write, :write
#     def write(dest)
#       write_partial(dest, self)
#       orig_write(dest)
#     end
#   end

#   class Post
#     include Partials
#     alias_method :orig_write, :write
#     def write(dest)
#       write_partial(dest, self)
#       orig_write(dest)
#     end
#   end

# end
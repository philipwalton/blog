module Jekyll

  class TagIndex < Page

    def initialize(site, base, dir, tag)
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'
      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'tag.html')
      self.data['tag'] = tag
      self.data['title'] = tag
    end

  end

  class TagGenerator < Generator

    safe true

    def generate(site)
      if site.layouts.key? 'tag'
        dir = '/tags'
        site.tags.keys.each do |tag|
          site.pages << TagIndex.new(site, site.source, File.join(dir, tag.downcase), tag)
        end
      end
    end

  end

end
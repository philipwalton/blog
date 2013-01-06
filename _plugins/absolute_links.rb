module Jekyll
  module AbsoluteLinks
    def absolute(input)
      config = @context.registers[:site].config
      dev_mode = config['server']
      if dev_mode
        root_url = "#{config['devroot']}:#{config['server_port']}#{input}"
      else
        root_url = "#{config['root']}#{input}"
      end
      root_url
    end
  end
end

Liquid::Template.register_filter(Jekyll::AbsoluteLinks)
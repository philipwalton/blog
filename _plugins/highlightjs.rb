require 'cgi'

module Jekyll
  class HighlightJsBlock < Liquid::Block

    def initialize(tag_name, args, tokens)
      super
    end

    def render(context)
      code = CGI.escapeHTML(super)
      code = code.gsub(/\*\*(.+)\*\*/, "<em>\\1</em>")
      "<pre class=\"highlight\"><code>#{code.strip}</code></pre>"
    end

  end
end

Liquid::Template.register_tag('highlightjs', Jekyll::HighlightJsBlock)
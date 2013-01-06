module Jekyll
  module KeySorter
    def sort_by_keys(input)
      # sort the collection alphabetically based on the key of the first item
      input.sort{ |a,b| a.first <=> b.first }
    end
  end
end

Liquid::Template.register_filter(Jekyll::KeySorter)
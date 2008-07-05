
require 'xml/xslt'

class Shiny
  
  def version
    return '0.8.0'
  end

end


class Shiny::Controller < ApplicationController

  before_filter :shiny_setup!

  protected

    def shiny_render(options = nil, extra_options = {}, &block)
      @@shiny_xslt.xml = render_to_string(options)
      render :text => @@shiny_xslt.serve, :shiny => true
    end

  private

    def shiny_setup!
      if (not defined? @@shiny_xslt) then
        logger.info 'Shiny: Starting XSL Transform Engine'
        @@shiny_xslt = XML::XSLT.new
        @@shiny_xslt.xsl = '../compiler/shiny.xslt'
      end
      return @@shiny_xslt
    end

end


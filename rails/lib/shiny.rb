
require 'xml/xslt'

class Shiny
  
  def version
    return '0.8.0'
  end

end


class Shiny::Controller < ApplicationController

  before_filter :shiny_setup!
  after_filter :shiny_send!

  public

    def render(options = nil, extra_options = {})
      if options != nil and options[:shiny] then
        super(options, extra_options)
      else
        shiny_render(options, extra_options)
      end
    end

  protected

    def shiny_render(options = nil, extra_options = {})
      options = {} unless (options)
      @shiny_xml += render_to_string(options.merge(:shiny => true))
    end

  private

    def shiny_setup!
      shiny_reset!
      if (not defined? @@shiny_xslt) then
        logger.info 'Shiny: Starting XSL Transform Engine'
        @@shiny_xslt = XML::XSLT.new
        @@shiny_xslt.xsl = '../compiler/shiny.xslt'
      end
      return @@shiny_xslt
    end

    def shiny_send!
      @@shiny_xslt.xml = @shiny_xml
      render :text => @@shiny_xslt.serve, :shiny => true
      shiny_reset!
    end

    def shiny_reset!
      @shiny_xml = ''
    end

end



require 'xml/xslt'

class Shiny
  def version
    return '0.8.0'
  end
end


class Shiny::Controller < ApplicationController

  before_filter :shiny_setup!

  public

    def render(options = nil, extra_options = {})
      if options != nil and options[:shiny] then
        return super(options, extra_options)
      else
        return shiny_render(options, extra_options)
      end
    end

  protected

    def shiny_render(options = nil, extra_options = {})
      options = {} unless (options)
      @shiny_xml = render_to_string(options.merge(:shiny => true))
      return shiny_send!
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
      logger.debug 'Shiny: Compiling'
      @xhtml = @@shiny_xslt.serve
 
      unless @xhtml then
        logger.warn 'Shiny: Compiler Generated No Output'
        @xhtml = '<!-- No Output -->'
      end

      logger.debug 'Shiny: Sending XHTML'
      render :text => @xhtml, :shiny => true

      return shiny_reset!
    end

    def shiny_reset!
      @shiny_xml = ''
    end

end


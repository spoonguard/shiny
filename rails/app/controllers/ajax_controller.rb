
require 'shiny'

class AjaxController < Shiny::Controller

  layout 'application'

  public

    def collection
      fetch
      logger.info "Shiny: Updating Collection (container = #{@container}, action = #{@action})"
      debug
    end

    def panels
      fetch
      logger.info "Shiny: Updating Panels (container = #{@container}, action = #{@action})"
    end

    def panel
      fetch
      logger.info "Shiny: Updating Panel (container = #{@container}, action = #{@action})"
      debug

      @render = {};
      @render[:panels] = [ @id.gsub(/_panel$/, '') ]
    end

    def tuple
      fetch
      logger.info "Shiny: Updating Tuple (container = #{@container}, action = #{@action})"
      debug
    end

  protected

    def param(name)
      return params[name.to_s.intern]
    end

    def fetch
      @tuples = { }
      @id = params[:id]
      @action = params[:action]
      @container = params[:container]
      @collection = param(@container)
    end

    def debug
      logger.info "Shiny: Collection Modified - #{@collection.inspect}" \
        if (@collection)
    end

end


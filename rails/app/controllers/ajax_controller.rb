
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

      @render = {};
      @render[:panels] = [ @container ]
      @render[:collection] = @parent_collection
      @render[:selected] = (@parent_collection[:selected] || [])
    end

    def panel
      fetch
      logger.info "Shiny: Updating Panel (#{@id}, container = #{@container}, action = #{@action})"
      debug

      @render = {};
      @render[:panel] = [ @id.gsub(/_panel$/, '') ]
      @render[:collection] = @collection
      @render[:open] = !!(@panel[:open])
      @render[:selected] = (@collection[:selected] || [])
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
      @id = params[:id]
      @panel = param(@id) || {}
      @action = params[:action]
      @container = params[:container]
      @collection = param(@container) || {}
      @parent_collection = param(@container.gsub(/_detail$/, ''))
    end

    def debug
      logger.info "Shiny: Collection Modified - #{@collection.inspect}" \
        if (@collection)
    end

end


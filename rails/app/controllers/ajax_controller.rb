
require 'shiny.rb'

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
      @action = params[:action]
      @container = params[:container]
      @tuples[:selected] = (param(@container) || []).to_a
      @tuples[:moved] = (param(@container + '_drag') || '').split(',')
    end

    def debug
      logger.info "Shiny: Moved Tuple(s) - #{@tuples[:moved].join(', ')}" \
        if (@tuples[:moved].length > 0)

      logger.info "Shiny: Selected Tuple(s) - #{@tuples[:selected].join(', ')}" \
        if (@tuples[:selected].length > 0)
    end

end


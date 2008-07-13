
require 'shiny.rb'

class AjaxController < Shiny::Controller

  public

  def collection
    action = params[:action]; container = params[:container]
    logger.info "Shiny: Updating Collection (container = #{container}, action = #{action})"
    debug_selected
  end


  def panels
    action = params[:action]; container = params[:container]
    logger.info "Shiny: Updating Panels (container = #{container}, action = #{action})"
  end


  def panel
    action = params[:action]; container = params[:container]
    logger.info "Shiny: Updating Panel (container = #{container}, action = #{action})"
  end


  def tuple
    action = params[:action]; container = params[:container]
    logger.info "Shiny: Updating Tuple (container = #{container}, action = #{action})"
    debug_selected
  end

  private

  def debug_selected
    container = params[:container];
    selected = (params[container.to_s.intern] || []).to_a
    logger.info "Shiny: Selected Elements (selected = '#{selected.join(', ')}')"
  end

end


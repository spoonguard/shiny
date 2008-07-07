
require 'shiny.rb'

class AjaxController < Shiny::Controller

  def collection
    action = params[:action]; id = params[:id]
    logger.info "Shiny: Updating Panels (id = #{id}, action = #{action})"
  end


  def panels
    action = params[:action]; id = params[:id]
    logger.info "Shiny: Updating Panels (id = #{id}, action = #{action})"
  end


  def panel
    action = params[:action]; id = params[:id]
    logger.info "Shiny: Updating Panels (id = #{id}, action = #{action})"
  end

end


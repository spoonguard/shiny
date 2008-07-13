ActionController::Routing::Routes.draw do |map|

  map.connect ':controller/:container/:action', :controller => 'ajax'
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
  map.connect '', :controller => 'shiny'

end

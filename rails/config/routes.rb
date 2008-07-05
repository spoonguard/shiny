ActionController::Routing::Routes.draw do |map|

  map.connect 'ajax/:id/collection/:action', :controller => 'ajax'
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'

end

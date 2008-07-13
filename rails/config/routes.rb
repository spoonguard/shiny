ActionController::Routing::Routes.draw do |map|

  map.connect 'ajax/:container/collection/:action',
    :controller => 'ajax', :action => 'collection'

  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
  map.connect '', :controller => 'shiny'

end

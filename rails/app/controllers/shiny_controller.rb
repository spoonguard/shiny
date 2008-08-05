
require 'shiny'

class ShinyController < Shiny::Controller

  layout 'application'

  def index
    @env = Shiny::Environment.new(params, logger).parse!
    @env.allow_models :clinical_trials, :specimens, :storage_location

    @render = {};
    @render[:models] = [ :clinical_trials, :specimens ]
  end

end


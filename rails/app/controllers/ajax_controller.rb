
require 'shiny'

class AjaxController < Shiny::Controller

  layout 'application'
  before_filter :initialize!

  public

    def collection
      @render = {};
      @render[:partials] = [ @updating[:id] + '_collection' ]
    end

    def panels
      @render = {};
      @render[:partials] = [ @updating[:id] ]
    end

    def panel
      @render = {};
      @render[:partials] = [ @acting[:name] ]
    end

    def tuple
      @render = {};
    end

  protected

    def initialize!
      @env = Shiny::Environment.new(params, logger).parse!
      @env.allow_models :clinical_trials, :specimens, :storage_locations

      @self = @env.container(:self)
      @acting = @env.container(:acting)
      @updating = @env.container(:updating)
      @predecessor_name = @updating[:predecessor_name]
      logger.debug "predecessor_name: #{@predecessor_name.inspect}"
      @predecessor = @env.fetch_container(@predecessor_name)
      logger.debug "predecessor: #{@predecessor.inspect}"

      @selected = (@self[:selected] || {})
      @predecessor_selected = (@predecessor[:selected] || {})

      @models = @env.fetch_models(
        @env.name, @predecessor_name, @predecessor_selected
      )
    end

end


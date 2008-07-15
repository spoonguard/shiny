
require 'shiny'

class ShinyController < Shiny::Controller

  layout 'application'

  def index
    @render = {};
    @render[:panels] = [
      'genes', 'exons', 'exon_groups', 'primer_sets',
      'primer_set_groups', 'mutation_types'
    ]
  end

end


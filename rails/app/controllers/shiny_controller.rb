
require 'shiny'

class ShinyController < Shiny::Controller

  layout 'application'

  def index
    @render = {};
    @render[:panel] = [
      #'tissue_types', 'tumor_sites', 'tumor_types', 'publications',
      #'extract_types', 'healthcare_locations', 'specimen_types',
      #'exon_groups', 'primer_sets', 'primer_set_groups', 'mutation_types',
      'clinical_trials', 'storage_locations', 'genes', 'exons'
    ]
  end

end



require 'xml/xslt'
require 'will_paginate'


class Array
  def to_hash
    return self.inject({}) { |h, x| h[x] = x; h }
  end
end


class String
  def to_hash
    return { self => self }
  end
end


class Shiny
  def version
    return '0.8.0'
  end
end


class Shiny::Environment

  public
    def initialize(params, logger)
      @logger = logger
      @params = params
      @allowed_models = { }

      WillPaginate.enable_activerecord
      return self
    end


    def allow_model(model)
      @allowed_models[model.to_s.intern] = true
      return self
    end


    def allow_models(*params)
      params.each { |p| allow_model(p) }
      return self
    end


    def fetch_const_model(name)
      return nil unless (name)

      name = name.to_s.downcase
      klass = name.classify

      return nil if (name == '')
      return nil unless @allowed_models[name.intern]

      begin
        return Object.const_get(klass)
      rescue
        @logger.warn "Shiny: Unable to instansiate class '#{klass}'"
      end

      return nil
    end


    def fetch_associated(model, association, criteria, *args)
      association = association.to_s.intern

      return nil unless model.is_a?(Class)
      return nil unless @allowed_models[association]

      options = (args.first || {})
      options = options.merge({
        :include => (options[:include] || []).push(association)
      });

      begin
        # Find all models associated with each member of $model
        models = model.send('find', criteria, options).inject({}) { |h, x|
          x.send(association).each { |y| h[y.id] = y; }; h;
        }
        return models.values.sort_by(&:id).paginate(:page => 1)
      rescue
        @logger.warn 'Shiny: Unable to retrieve ' \
          + "association '#{association.to_s}' via model '#{model.to_s}'"
      end
      
      return nil
    end


    def fetch_models(model_name, predecessor_name, predecessor_sel, *args)
      if (predecessor_name) then
        return fetch_associated(
          fetch_const_model(predecessor_name), model_name,
          predecessor_sel.keys.map { |s| extract_suffix(s) }
        )
      else
        model = fetch_const_model(model_name)
        return model.paginate(:page => 1) if (model)
      end

      return nil
    end


    def fetch_container(id, acting_id = nil)
      return parse_container(id, acting_id, param(id) || {})
    end


    def parse_container(id, acting_id, ct)
      order = ct[:order] || ''
      order = order.split(/\s*,\s*/) unless (order.is_a?(Array))
      
      rv = {}
      acting_id ||= id
      index = order.index(acting_id)

      rv[:predecessor_id] = (
        (index != nil && index > 0) ? order[index - 1] : nil
      )

      rv[:successor_id] = (
        (index != nil && index + 1 < order.size) ? order[index + 1] : nil
      )

      rv[:predecessor_name] = remove_suffix(rv[:predecessor_id])
      rv[:successor_name] = remove_suffix(rv[:successor_id])
      rv[:predecessor] = param(rv[:predecessor_id]) || {}
      rv[:successor] = param(rv[:successor_id]) || {}

      rv[:id] = id
      rv[:order] = order
      rv[:name] = remove_suffix(id)

      rv[:selected] = ct[:selected].to_hash \
        if (ct[:selected] && [Array, String].include?(ct[:selected].class))

      return rv
    end


    def parse!
      @logger.debug "Shiny: Examining Rails Enviromnent"

      @id = @params[:id] || ''
      @name = remove_suffix(@id)
      @action = @params[:action] || ''
      @container = @params[:container] || ''
      @enclosing_container = remove_suffix(@container)

      @containers = {
        :self => fetch_container(@name, @id),
        :acting => fetch_container(@id),
        :updating => fetch_container(@container, @id),
        :enclosing => fetch_container(@enclosing_container)
      }

      @logger.debug "Shiny: Requested name = '#{@name}', " \
        + "id = '#{@id}', action = '#{@action}', container = '#{@container}'"

      @logger.debug "Shiny: Container -  #{@containers[:self].inspect}"
      @logger.debug "Shiny: Acting Container - #{@containers[:acting].inspect}"
      @logger.debug "Shiny: Updating Container - #{@containers[:updating].inspect}"

      return self
    end


    def id
      return @id
    end


    def name
      return @name
    end


    def container(kind)
      return @containers[kind]
    end


    def remove_suffix(s)
      return (s ? s.gsub(/_(?:detail|panel)\d*$/, '') : nil)
    end

    
    def extract_suffix(s)
      return s.gsub(/^[^_]*_([^_]*)$/, '\1')
    end

  protected

    def param(s)
      s = s.to_s
      return (s != nil && s != '' ? @params[s.intern] : nil)
    end

end




class Shiny::Controller < ApplicationController

  before_filter :shiny_setup!

  public

    def render(options = nil, extra_options = {})
      if options != nil and options[:shiny] then
        return super(options, extra_options)
      else
        return shiny_render(options, extra_options)
      end
    end


  protected

    def shiny_render(options = nil, extra_options = {})
      options = {} unless (options)
      @shiny_xml = render_to_string(options.merge(:shiny => true))
      return shiny_send!
    end


  private

    def shiny_setup!
      shiny_reset!
      if (not defined? @@shiny_xslt) then
        logger.info 'Shiny: Starting XSL Transform Engine'
        @@shiny_xslt = XML::XSLT.new
        @@shiny_xslt.xsl = '../compiler/shiny.xslt'
      end
      return @@shiny_xslt
    end


    def shiny_send!
      @@shiny_xslt.xml = @shiny_xml
      logger.debug 'Shiny: Compiling'
      @xhtml = @@shiny_xslt.serve
 
      unless @xhtml then
        logger.warn 'Shiny: Compiler Generated No Output'
        @xhtml = '<!-- No Output -->'
      end

      logger.debug 'Shiny: Sending XHTML'
      render :text => @xhtml, :shiny => true

      return shiny_reset!
    end


    def shiny_reset!
      @shiny_xml = ''
    end

end


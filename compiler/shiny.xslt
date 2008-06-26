<?xml version="1.0" encoding="utf-8" ?>

<!--
   Shiny: A Portable Javascript User-Interface Toolkit
    Copyright 2006-2008, David Brown <dave@spoonguard.org>
    $Id$
   
   This Program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License, version 2, as
   published by the Free Software Foundation.

   The Program is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   General Public License for more details.

   You should have received a copy of the GNU General Public
   License along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301
   USA.
-->


<xsl:stylesheet version="1.0"
  xmlns:sml="http://xml.spoonguard.org/shiny"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exsl="http://exslt.org/common"
  xmlns:str="http://exslt.org/strings"
  extension-element-prefixes="str sml exsl"
  exclude-result-prefixes="str sml exsl">

  <xsl:output method="xml"
    encoding="utf-8" indent="no" omit-xml-declaration="yes"
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
    doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN" />

  <xsl:strip-space elements="*" />

  <!--
      Utility Functions
  <-->

  <!-- maximum-child-count:
        For the node in $nodes that has the greatest
        number of children, return the count of its children. -->

  <xsl:template name="maximum-child-count">
    <xsl:param name="nodes" />
    <xsl:param name="node-name" type="xs:string" />
    <xsl:variable name="current-count"
      select="count($nodes[1]/*[local-name() = $node-name])" />
    <xsl:variable name="successors"
      select="$nodes[position() > 1][count(*) > $current-count]" />
    <xsl:choose>
      <xsl:when test="$successors">
        <xsl:call-template name="maximum-child-count">
          <xsl:with-param name="nodes" select="$successors" />
          <xsl:with-param name="node-name" select="$node-name" />
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$current-count" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


  <xsl:template name="generate-id">
    <xsl:param name="id" select="''" />
    <xsl:param name="prefix" select="''" />
    <xsl:param name="suffix" select="''" />
    <xsl:param name="random" select="''" />
    <xsl:param name="separator" select="'_'" />
    <xsl:param name="base-id" select="''" />
    <xsl:param name="skip-own-id" select="false()" />
    <xsl:param name="prefer-parent" select="false()" />
    <xsl:choose>
      <xsl:when test="$id != ''">
        <xsl:choose>
          <xsl:when test="$prefer-parent and ../@id">
            <xsl:value-of select="../@id" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$id" />
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="$skip-own-id = false() and @id != ''">
        <xsl:value-of select="@id" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="$prefer-parent">
            <xsl:choose>
              <xsl:when test="../@id">
                <xsl:value-of select="../@id" />
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$base-id" />
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$base-id">
                <xsl:value-of select="$base-id" />
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="ancestor::*[@id != ''][1]/@id" />
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:value-of select="$separator" />
        <xsl:value-of select="$prefix" /><xsl:number />
      </xsl:otherwise>
    </xsl:choose><xsl:if test="$suffix">
      <xsl:value-of select="$separator" /><xsl:value-of select="$suffix" />
    </xsl:if>
  </xsl:template>


  <xsl:template name="generate-id-attribute">
    <xsl:param name="id" select="''" />
    <xsl:param name="prefix" select="''" />
    <xsl:param name="suffix" select="''" />
    <xsl:param name="random" select="''" />
    <xsl:param name="separator" select="'_'" />
    <xsl:param name="attribute" select="'id'" />
    <xsl:param name="base-id" select="''" />
    <xsl:param name="skip-own-id" select="false()" />
    <xsl:param name="prefer-parent" select="false()" />
    <xsl:attribute name="{$attribute}">
      <xsl:call-template name="generate-id">
        <xsl:with-param name="id" select="$id" />
        <xsl:with-param name="prefix" select="$prefix" />
        <xsl:with-param name="suffix" select="$suffix" />
        <xsl:with-param name="random" select="$random" />
        <xsl:with-param name="separator" select="$separator" />
        <xsl:with-param name="base-id" select="$base-id" />
        <xsl:with-param name="skip-own-id" select="$skip-own-id" />
        <xsl:with-param name="prefer-parent" select="$prefer-parent" />
      </xsl:call-template>
    </xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-id-and-name-attributes">
    <xsl:param name="id" select="''" />
    <xsl:param name="prefix" select="''" />
    <xsl:param name="suffix" select="''" />
    <xsl:param name="random" select="''" />
    <xsl:param name="separator" select="'_'" />
    <xsl:param name="base-id" select="''" />
    <xsl:param name="skip-own-id" select="false()" />
    <xsl:param name="prefer-parent" select="false()" />
    <xsl:call-template name="generate-id-attribute">
      <xsl:with-param name="id" select="$id" />
      <xsl:with-param name="prefix" select="$prefix" />
      <xsl:with-param name="suffix" select="$suffix" />
      <xsl:with-param name="random" select="$random" />
      <xsl:with-param name="separator" select="$separator" />
      <xsl:with-param name="base-id" select="$base-id" />
      <xsl:with-param name="skip-own-id" select="$skip-own-id" />
      <xsl:with-param name="prefer-parent" select="$prefer-parent" />
    </xsl:call-template>
    <xsl:call-template name="generate-id-attribute">
      <xsl:with-param name="id" select="$id" />
      <xsl:with-param name="prefix" select="$prefix" />
      <xsl:with-param name="suffix" select="$suffix" />
      <xsl:with-param name="random" select="$random" />
      <xsl:with-param name="separator" select="$separator" />
      <xsl:with-param name="attribute">name</xsl:with-param>
      <xsl:with-param name="base-id" select="$base-id" />
      <xsl:with-param name="skip-own-id" select="$skip-own-id" />
      <xsl:with-param name="prefer-parent" select="$prefer-parent" />
    </xsl:call-template>
  </xsl:template>


  <xsl:template name="generate-panel-or-collection-id">
    <xsl:choose>
      <xsl:when test="local-name(.) = 'collection'">
        <xsl:call-template name="generate-id">
          <xsl:with-param name="suffix">ps</xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="generate-id" />
      </xsl:otherwise>
    </xsl:choose> 
  </xsl:template>


  <xsl:template
    name="copy-without-namespaces" mode="copy-without-namespaces" match="*">
    <xsl:element name="{local-name(.)}">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates mode="copy-without-namespaces" />
    </xsl:element>
  </xsl:template>


  <xsl:template name="rewrite-attributes">
    <xsl:param name="id" type="xs:ID" select="@id" />
    <xsl:param name="ref-node" />
    <xsl:param name="attribute-map" />
    <xsl:variable name="prev-id" select="@id" />
    <xsl:variable name="at" select="exsl:node-set($attribute-map)" />
    <xsl:copy-of select="@*" />
    <xsl:copy-of
      select="$ref-node/@*[not(local-name() = 'ref' or local-name() = 'label')]" />
    <xsl:call-template name="generate-id-attribute">
      <xsl:with-param name="id" select="$id" />
    </xsl:call-template>
    <xsl:if test="$at/*[@ref = $prev-id]">
      <xsl:copy-of
        select="$at/*[@ref = $prev-id]/@*[not(local-name() = 'ref' or local-name = 'id')]" />
    </xsl:if>
  </xsl:template>


  <xsl:template name="generate-automatic-elements">
    <xsl:param name="root" select="." />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="id" type="xs:ID" select="$root/@id" />
    <xsl:param name="suffix" type="xs:string" select="':'" />

    <xsl:variable name="edit-batch"
      select="$root/ancestor::sml:collection[1]/@edit-mode = 'batch'" />
    <xsl:variable name="checkbox-id">
      <xsl:call-template name="generate-id">
        <xsl:with-param name="id" select="$id" />
        <xsl:with-param name="suffix" select="'guard'" />
      </xsl:call-template>
    </xsl:variable>
    <xsl:if test="$edit-batch">
      <input id="{$checkbox-id}" type="checkbox" class="shiny checkbox guard">
        <xsl:if test="$root/@edit-enabled = true()">
          <xsl:attribute name="checked">checked</xsl:attribute>
        </xsl:if>
      </input>
      <script type="text/javascript">
        <xsl:if test="$update != true()">
          document.observe('dom:loaded', function() {
        </xsl:if>
        _shiny.<xsl:value-of select="$checkbox-id" /> =
          new Shiny.Control.Guard(
            '<xsl:value-of select="$checkbox-id" />',
            '<xsl:value-of select="$id" />'
          );
        <xsl:if test="$update != true()">
          });
        </xsl:if>
      </script>
    </xsl:if>
    <xsl:if test="$root/@label or $root/ancestor::sml:collection[1][@type = 'form']">
      <label>
        <xsl:attribute name="for">
          <xsl:choose>
            <xsl:when test="$edit-batch">
              <xsl:value-of select="$checkbox-id" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="$id" />
            </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <xsl:choose>
          <xsl:when test="$root/@label">
            <xsl:value-of select="$root/@label"
              /><xsl:value-of select="$suffix" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$id"
              /><xsl:value-of select="$suffix" />
          </xsl:otherwise>
        </xsl:choose>
      </label>
      <br />
    </xsl:if>
  </xsl:template>


  <xsl:template name="output-using-library">
    <xsl:param name="id" type="xs:ID" select="@id" />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="content" />
    <xsl:param name="attribute-map" />
    <xsl:for-each select="$content">
      <xsl:variable name="new-id">
        <xsl:call-template name="generate-id">
          <xsl:with-param name="base-id" select="$id" />
          <xsl:with-param name="prefix" select="'i'" />
        </xsl:call-template>
      </xsl:variable>
      <xsl:choose>
        <xsl:when test="local-name(.) = 'library'">
          <xsl:variable name="ref" select="@ref" />
          <xsl:variable name="node" select="." />
          <xsl:for-each select="/sml:shiny/sml:library/*[@id = $ref]">
            <xsl:if test="not(@type = 'checkbox' or @type = 'radio')">
              <xsl:call-template name="generate-automatic-elements">
                <xsl:with-param name="id" select="$new-id" />
                <xsl:with-param name="root" select="$node" />
                <xsl:with-param name="update" select="$update" />
              </xsl:call-template>
            </xsl:if>
            <xsl:choose>
              <!-- Arbitrary markup (xhtml) in library -->
              <xsl:when test="local-name(.) = 'xhtml'">
                <!-- Copy interior content only -->
                <xsl:apply-templates mode="copy-without-namespaces" />
              </xsl:when>
              <!-- Input control (xhtml) in library -->
              <xsl:when test="local-name(.) = 'input'">
                <xsl:element name="{local-name(.)}">
                  <xsl:call-template name="rewrite-attributes">
                    <xsl:with-param name="id" select="$new-id" />
                    <xsl:with-param name="ref-node" select="$node" />
                    <xsl:with-param name="attribute-map" select="$attribute-map" />
                  </xsl:call-template>
                  <xsl:for-each select="*">
                    <xsl:apply-templates mode="copy-without-namespaces" />
                  </xsl:for-each>
                </xsl:element>
              </xsl:when>
              <!-- Selection (drop-down; xhtml) list in library -->
              <xsl:when test="local-name(.) = 'select'">
                <!-- Copy with modifications -->
                <xsl:element name="{local-name(.)}">
                  <xsl:call-template name="rewrite-attributes">
                    <xsl:with-param name="id" select="$new-id" />
                    <xsl:with-param name="ref-node" select="$node" />
                    <xsl:with-param name="attribute-map" select="$attribute-map" />
                  </xsl:call-template>
                  <xsl:for-each select="*">
                    <xsl:choose>
                      <!--
                        Option inside of a <select>:
                          Apply the library reference's 'selected'
                          attribute to the library element as we're copying it.
                       -->
                      <xsl:when test="local-name() = 'option'">
                        <xsl:element name="{local-name(.)}">
                          <xsl:choose>
                            <xsl:when test="$node/@selected">
                              <xsl:copy-of
                                select="@*[local-name() != 'selected']" />
                            </xsl:when>
                            <xsl:otherwise test="$node/@selected">
                              <xsl:copy-of select="@*" />
                            </xsl:otherwise>
                          </xsl:choose>
                          <xsl:copy-of select="@*"/>
                          <xsl:if test="@value = $node/@selected">
                            <xsl:attribute name="selected" value="selected" />
                          </xsl:if>
                          <xsl:apply-templates mode="copy-without-namespaces" />
                        </xsl:element>
                      </xsl:when>
                      <!-- All other <select> content -->
                      <xsl:otherwise>
                        <xsl:apply-templates mode="copy-without-namespaces" />
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:for-each>
                </xsl:element>
              </xsl:when>
              <!-- Anything else in library -->
              <xsl:otherwise>
                <xsl:call-template name="generate-automatic-elements">
                  <xsl:with-param name="id" select="$new-id" />
                  <xsl:with-param name="root" select="$node" />
                  <xsl:with-param name="update" select="$update" />
                </xsl:call-template>
                <xsl:element name="{local-name(.)}">
                  <xsl:call-template name="rewrite-attributes">
                    <xsl:with-param name="id" select="$new-id" />
                    <xsl:with-param name="ref-node" select="$node" />
                    <xsl:with-param
                      name="attribute-map" select="$attribute-map" />
                  </xsl:call-template>
                  <xsl:apply-templates mode="copy-without-namespaces" />
                </xsl:element>
              </xsl:otherwise>
            </xsl:choose>
            <xsl:if test="@type = 'checkbox' or @type = 'radio'">&#160;
              <xsl:call-template name="generate-automatic-elements">
                <xsl:with-param name="id" select="$new-id" />
                <xsl:with-param name="root" select="$node" />
                <xsl:with-param name="update" select="$update" />
                <xsl:with-param name="suffix" select="''" />
              </xsl:call-template>
            </xsl:if>
          </xsl:for-each>
        </xsl:when>
        <xsl:otherwise>
          <!-- Anything else -->
          <xsl:apply-templates mode="copy-without-namespaces" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>


  <xsl:template name="generate-dialog">
    <xsl:param name="update" select="false()" />
    <xsl:choose>
      <xsl:when test="/sml:shiny/sml:dialog">
        <xsl:for-each select="/sml:shiny/sml:dialog">
          <div id="dialog" class="dialog" style="display: none;">
            <div class="fill-x xr">
              <div class="pad-bottom">
                <xsl:call-template name="default-output">
                  <xsl:with-param name="update" select="$update" />
                </xsl:call-template>
              </div>
              <div class="controls left pad xr">
                <xsl:for-each select="/sml:shiny/sml:dialog/sml:status">
                  <xsl:call-template name="output-using-library">
                    <xsl:with-param name="content" select="*" />
                    <xsl:with-param name="update" select="$update" />
                  </xsl:call-template>
                </xsl:for-each>
              </div>
              <div class="controls right bottom xr">
                <button class="shiny button"
                  id="dialog_info" name="dialog" value="info">
                    More Information...
                </button>
                <button type="button" class="shiny button"
                  onclick="return _shiny.dialog.hide();">
                    Close
                </button>
              </div>
              <div class="clear"></div>
            </div>
          </div>
          <script type="text/javascript">
            <xsl:if test="not($update = true())">
              document.observe('dom:loaded', function() {
                setTimeout(function() {
            </xsl:if>
                _shiny.dialog =
                  new Shiny.Dialog('dialog', _shiny.screen).show();
            <xsl:if test="not($update = true())">
                }, 1000);
              });
            </xsl:if>
          </script>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <xsl:if test="not($update = true())">
          <div id="dialog" class="dialog" style="display: none;">
          </div>
        </xsl:if>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


  <xsl:template name="generate-panels-class">
    <xsl:param name="scroll" select="true()" />
    <xsl:param name="recursive" select="false()" />
    <xsl:attribute name="class"><xsl:if
      test="$recursive = true()"> tiny</xsl:if>
      panels fill-y<xsl:choose>
      <xsl:when
        test="@scroll = true() and $scroll != false()"> scrollable</xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose></xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-panel-class">
    <xsl:param name="recursive" select="false()" />
    <xsl:attribute name="class">panel<xsl:choose>
      <xsl:when
        test="@size = 'small' or ../@size = 'small'"> small</xsl:when>
      <xsl:when
        test="@size = 'large' or ../@size = 'large'"> large</xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose></xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-schema-elt-class">
    <xsl:attribute name="class">elt xr i<xsl:number
      value="position()" /></xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-tuple-input-class">
    <xsl:attribute name="class">shiny selector checkbox<xsl:if
      test="ancestor::sml:collection[@checkboxes][1]/@checkboxes = 'none'"> hidden</xsl:if>
    </xsl:attribute>
    <xsl:attribute name="type"><xsl:choose>
      <xsl:when test="ancestor::sml:collection[@select][1]/@select = 'single'"
        >radio</xsl:when>
      <xsl:otherwise>checkbox</xsl:otherwise>
    </xsl:choose></xsl:attribute>
  </xsl:template>
 

  <xsl:template name="generate-tuple-elt-class">
    <xsl:attribute name="class">elt xr i<xsl:number value="position()"
    /></xsl:attribute>
  </xsl:template>
 

  <xsl:template name="generate-panel-input-attributes">
    <xsl:attribute name="class">shiny title arrow checkbox</xsl:attribute>
    <xsl:if test="@open != '' and @open != false()">
      <xsl:attribute name="checked">checked</xsl:attribute>
    </xsl:if>
  </xsl:template>


  <xsl:template name="generate-header-class">
    <xsl:attribute name="class">header collection x<xsl:value-of
      select="count(ancestor::sml:collection[1]/sml:schema/sml:elt)" /></xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-collection-class">
    <xsl:param name="scrollable" type="xs:boolean" select="true()" />
    <xsl:choose>
      <xsl:when test="@type = 'form'">
        <xsl:attribute name="class">scrollable resizable form xr<xsl:if
          test="@appearance = 'dark'"> dark</xsl:if></xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
        <xsl:attribute name="class">x-blue xr<xsl:if
          test="$scrollable"> height-<xsl:choose>
            <xsl:when test="@extent >= 0">
              <xsl:value-of select="@extent" />
            </xsl:when>
            <xsl:otherwise>1</xsl:otherwise>
          </xsl:choose> resizable scrollable region</xsl:if></xsl:attribute>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


  <xsl:template name="generate-collection-panels-class">
    <xsl:attribute name="class">normal panels fill-y collection x<xsl:choose>
      <xsl:when test="ancestor-or-self::sml:collection[1]/sml:schema[1]">
        <xsl:value-of
          select="count(ancestor-or-self::sml:collection[1]/sml:schema[1]/sml:elt)" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="maximum-child-count">
          <xsl:with-param name="nodes" select="ancestor-or-self::sml:collection[1]/sml:tuple" />
          <xsl:with-param name="node-name" select="'elt'" />
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose></xsl:attribute>
  </xsl:template>


  <xsl:template name="generate-collection-panel-class">
    <xsl:attribute name="class">panel xr x<xsl:choose>
      <xsl:when test="position() mod 2 = 0">-</xsl:when>
      <xsl:otherwise>_</xsl:otherwise>
    </xsl:choose></xsl:attribute>
  </xsl:template>



  <!--
      AJAX-style Asynchronous XML Message
  <-->

  <xsl:template name="default-output">
    <xsl:param name="update" select="false()" />
    <xsl:param name="round-panels" select="false()" />
    <xsl:for-each select="sml:panels">
      <xsl:choose>
        <xsl:when test="$update = true()">
          <xsl:call-template name="generate-panels-content">
            <xsl:with-param name="update" select="$update" />
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="generate-panels">
            <xsl:with-param name="update" select="$update" />
            <xsl:with-param name="round" select="$round-panels" />
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:call-template name="generate-panels-script">
        <xsl:with-param name="update" select="$update" />
      </xsl:call-template>
    </xsl:for-each>
    <xsl:for-each select="sml:panel">
      <xsl:call-template name="generate-panel-content">
        <xsl:with-param name="update" select="$update" />
      </xsl:call-template>
    </xsl:for-each>
    <xsl:for-each select="sml:collection">
      <xsl:call-template name="generate-collection-content">
        <xsl:with-param name="update" select="$update" />
      </xsl:call-template>
    </xsl:for-each>
    <xsl:call-template name="output-using-library">
      <xsl:with-param name="content" select="sml:xhtml | sml:library" />
      <xsl:with-param name="update" select="$update" />
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="/sml:shiny/sml:update">
    <xsl:call-template name="default-output">
      <xsl:with-param name="update" select="true()" />
    </xsl:call-template>
  </xsl:template>


  <!--
      Whole Workspace
  <-->

  <xsl:template match="/sml:shiny/sml:page">
    <html>
    <head>
      <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
      <link href="../styles/shiny.css" rel="stylesheet" type="text/css" />
      <xsl:comment>[if lte IE 6]&gt;
        &lt;link href="../styles/shiny-ie6.css" rel="stylesheet" type="text/css" /&gt;
      &lt;![endif]</xsl:comment>
      <xsl:comment>[if lte IE 7]&gt;
        &lt;link href="../styles/shiny-ie7.css" rel="stylesheet" type="text/css" /&gt;
      &lt;![endif]</xsl:comment>
      <xsl:comment>[if lte IE 8]&gt;
        &lt;link href="../styles/shiny-ie.css" rel="stylesheet" type="text/css" /&gt;
      &lt;![endif]</xsl:comment>
      <script src="../source/contrib/prototype.js" type="text/javascript"></script>
      <script src="../source/contrib/effects.js" type="text/javascript"></script>
      <script src="../source/contrib/dragdrop.js" type="text/javascript"></script>
      <script src="../source/shiny.js" type="text/javascript"></script>
      <title>
        <xsl:choose>
          <xsl:when test="@subtitle != ''">
            <xsl:value-of select="@subtitle" />:
            <xsl:value-of select="@title" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="@title" />
          </xsl:otherwise>
        </xsl:choose>
      </title>
      <!-- Namespace for library-gnerated script objects -->
      <script type="text/javascript">
        _shiny = {};
        document.observe('dom:loaded', function() {
          _shiny.screen = new Shiny.Screen();
        });
      </script>
    </head>
    <body onresize="Shiny.Browser.Emulation.Css(this, 'height', ['sidebar', 'body']);">
      <form action="{@action}" method="post">
        <div id="shiny" class="shiny">
          <xsl:call-template name="generate-dialog" />
          <div class="fill-x">
            <div id="header" class="margin round dark-gray">
              <h1><xsl:value-of select="@title" /></h1>
              <xsl:if test="@subtitle != ''">
                <h2><xsl:value-of select="@subtitle" /></h2>
              </xsl:if>
            </div>
            <script type="text/javascript">
              var header;
              var body_resizer;
              var sidebar_resizer;

              document.observe('dom:loaded', function() {
                body_resizer = new Shiny.Resizer('body-resizer', {
                  containment: 'parent', use_percentages: true,
                  direction: 'horizontal', reflect: 'sidebar',
                  scroll_adjust: 16
                });

                sidebar_resizer = new Shiny.Resizer('sidebar-resizer', {
                  containment: 'parent', use_percentages: true,
                  direction: 'horizontal', position: 'minimal',
                  reflect: 'body'
                });
              });
            </script>
          </div>
          <xsl:for-each select="sml:sidebar">
            <xsl:call-template name="generate-sidebar" />
          </xsl:for-each>
          <xsl:for-each select="sml:body">
            <xsl:call-template name="generate-body" />
          </xsl:for-each>
        </div>
      </form>
    </body>
    </html>
  </xsl:template>


  <xsl:template match="sml:library">
    <!-- Hide from output -->
  </xsl:template>


  <xsl:template match="sml:dialog">
    <!-- Hide from output -->
  </xsl:template>


  <!--
      Secondary Workspace
  <-->

  <xsl:template name="generate-sidebar" match="sml:sidebar">
    <div id="sidebar" class="scrollable">
      <input class="persist resize" type="hidden">
        <xsl:call-template name="generate-id-and-name-attributes">
          <xsl:with-param name="id">sidebar</xsl:with-param>
          <xsl:with-param name="suffix">size</xsl:with-param>
        </xsl:call-template>
      </input>
      <div id="sidebar-resizer" class="resize-x"></div>
      <xsl:for-each select="sml:panels">
        <xsl:call-template name="generate-panels">
          <xsl:with-param name="scroll" select="false()" />
        </xsl:call-template>
        <xsl:call-template name="generate-panels-script" />
      </xsl:for-each>
    </div>
  </xsl:template>


  <!--
      Primary Workspace
  <-->

  <xsl:template name="generate-body" match="sml:body">
    <div id="body" class="scrollable">
      <input class="persist resize" type="hidden">
        <xsl:call-template name="generate-id-and-name-attributes">
          <xsl:with-param name="id">body</xsl:with-param>
          <xsl:with-param name="suffix">size</xsl:with-param>
        </xsl:call-template>
      </input>
      <div id="body-resizer" class="right-abs resize-x"></div>
      <xsl:for-each select="sml:panels">
        <xsl:call-template name="generate-panels">
          <xsl:with-param name="scroll" select="false()" />
        </xsl:call-template>
        <xsl:call-template name="generate-panels-script" />
      </xsl:for-each>
    </div>
  </xsl:template>


  <!--
      Shiny.Panels
  <-->

  <xsl:template name="generate-panels-content">
    <xsl:param name="round" type="xs:boolean" select="true()" />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="recursive" type="xs:boolean" select="false()" />
    <input class="persist order" type="hidden">
      <xsl:call-template name="generate-id-and-name-attributes">
        <xsl:with-param name="suffix">order</xsl:with-param>
      </xsl:call-template>
    </input>
    <xsl:if test="$recursive != true()">
      <div class="status no-drop">
        <xsl:if test="sml:status">
          <div class="right pad">
            <xsl:call-template name="output-using-library">
              <xsl:with-param name="content" select="sml:status/*" />
              <xsl:with-param name="update" select="$update" />
            </xsl:call-template>
          </div>
        </xsl:if>
        <xsl:if test="@title">
          <h3><xsl:value-of select="@title" /></h3>
        </xsl:if>
      </div>
      <div class="divider"></div>
    </xsl:if>
    <xsl:for-each select="sml:panel">
      <xsl:call-template name="generate-panel">
        <xsl:with-param name="round" select="$round" />
        <xsl:with-param name="update" select="$update" />
        <xsl:with-param name="recursive" select="$recursive" />
      </xsl:call-template>
    </xsl:for-each>
  </xsl:template>


  <xsl:template name="generate-panels" match="sml:panels">
    <xsl:param name="round" type="xs:boolean" select="true()" />
    <xsl:param name="scroll" type="xs:boolean" select="true()" />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="recursive" type="xs:boolean" select="false()" />
    <!-- Attribute @id is required -->
    <div id="{@id}">
      <xsl:call-template name="generate-panels-class">
        <xsl:with-param name="scroll" select="$scroll" />
        <xsl:with-param name="recursive" select="$recursive" />
      </xsl:call-template>
      <xsl:call-template name="generate-panels-content">
        <xsl:with-param name="round" select="$round" />
        <xsl:with-param name="update" select="$update" />
        <xsl:with-param name="recursive" select="$recursive" />
      </xsl:call-template>
    </div>
  </xsl:template>


  <xsl:template name="generate-collection-script-fragment">
    <xsl:param name="update" select="false()" />
    <xsl:for-each select="sml:panels/sml:panel/sml:collection |
                          sml:panel/sml:collection | sml:collection">
      <xsl:variable name="collection_id">
        <xsl:call-template name="generate-id">
          <xsl:with-param name="suffix">ps</xsl:with-param>
        </xsl:call-template>
      </xsl:variable>
      if ($('<xsl:value-of select="@id" />')) {
        if (_shiny.<xsl:value-of select="$collection_id" /> != null) {
          _shiny.<xsl:value-of select="$collection_id" />.reset();
        } else {
          _shiny.<xsl:value-of select="$collection_id" /> =
            new Shiny.Collection(
              '<xsl:value-of select="$collection_id" />'
              <xsl:if test="ancestor::sml:panels[1]/@id">, {
                panels:
                  _shiny.<xsl:value-of select="ancestor::sml:panels[1]/@id" />
              }
              </xsl:if>
            );
        }
      }
    </xsl:for-each>
  </xsl:template>


  <xsl:template name="generate-panels-script">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <!-- Script output: Process whole subtree -->
    <script type="text/javascript">

      <xsl:if test="$update != true()">
        document.observe('dom:loaded', function() {
      </xsl:if>

      <xsl:if test="$update != true()">
        _shiny.<xsl:value-of select="@id" /> = 
          new Shiny.Panels('<xsl:value-of select="@id" />', {
            progress_containers: {
              shiny: 'shiny'
              <xsl:for-each select=".//sml:panels | sml:panel | .//sml:collection | .">,
                <xsl:call-template name="generate-panel-or-collection-id" />:
                  '<xsl:for-each select="ancestor-or-self::sml:panel[1]">
                    <xsl:call-template name="generate-id" />
                  </xsl:for-each>'
              </xsl:for-each>
            },
            no_reorder: {
              shiny: 'shiny'
              <xsl:for-each select=".//sml:panels | .//sml:collection | .">
                <xsl:if test="@no-reorder = true()">,
                  <xsl:call-template name="generate-panel-or-collection-id" />
                    : true
                </xsl:if>
              </xsl:for-each>
            },
            ajax: {
              shiny: 'shiny'
              <xsl:for-each select=".//sml:panels | .//sml:collection | .">
                <xsl:if test="@ajax != ''">,
                  <xsl:call-template name="generate-panel-or-collection-id" />:
                  <xsl:choose>
                    <xsl:when test="@ajax = 'inherit'">
                      '<xsl:value-of select="ancestor::*[@ajax != ''][1]/@ajax" />'
                    </xsl:when>
                    <xsl:otherwise>
                      '<xsl:value-of select="@ajax" />'
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:if>
              </xsl:for-each>
            },
            accept: {
              shiny: 'shiny'
              <xsl:for-each select=".//sml:panels | .//sml:collection | .">,
                <xsl:call-template name="generate-panel-or-collection-id" />
                : [ '<xsl:value-of select="@id" />'
                <xsl:for-each select="str:tokenize(@accept, ' ')">
                  <xsl:variable name="panels_id">
                    <xsl:call-template name="generate-id">
                      <xsl:with-param name="id" select="." />
                      <xsl:with-param name="suffix">ps</xsl:with-param>
                    </xsl:call-template>
                  </xsl:variable>
                  , '<xsl:value-of select="$panels_id" />'
                </xsl:for-each>
                ]
              </xsl:for-each>
            },
            reparent: {
              shiny: 'shiny'
              <xsl:for-each select=".//sml:panels | .//sml:collection | .">
                <xsl:variable name="collection_id">
                  <xsl:value-of select="@id" />
                </xsl:variable>
                <xsl:if test="//sml:panels[contains(attribute::accept, $collection_id)]
                              | //sml:collection[contains(attribute::accept, $collection_id)]">
                  ,<xsl:call-template name="generate-id">
                    <xsl:with-param name="id" select="$collection_id" />
                    <xsl:with-param name="suffix">ps</xsl:with-param>
                  </xsl:call-template>: 'shiny'
                </xsl:if>
              </xsl:for-each>
            },
            sortable: <xsl:choose>
              <xsl:when test="@sort = 'false'">false</xsl:when>
              <xsl:otherwise>true</xsl:otherwise>
            </xsl:choose>,
            scroll: true, recursive: true,
            resize_css_selector: 'collection', opacity: true,
            recursive_options: function(elt) {
              return { scroll: elt.parentNode.id };
            },
            before_setup: function() {
              <xsl:call-template name="generate-collection-script-fragment" />
            }
          }, true /* Delay setup */);
          _shiny.<xsl:value-of select="@id" />.invoke_setup();
        </xsl:if>

        <!-- Collections -->
        <xsl:if test="$update = true()">
          <xsl:call-template name="generate-collection-script-fragment" />
        </xsl:if>

        <!-- Collection headers, each computed from schema -->
        <xsl:for-each select="sml:panels/sml:panel/sml:collection |
                              sml:panel/sml:collection | sml:collection">
          <xsl:variable name="collection_id">
            <xsl:call-template name="generate-id">
              <xsl:with-param name="id" select="@id" />
              <xsl:with-param name="suffix">ps</xsl:with-param>
            </xsl:call-template>
          </xsl:variable>
          <xsl:variable name="schema_id">
            <xsl:call-template name="generate-id">
              <xsl:with-param name="id" select="@id" />
              <xsl:with-param name="suffix">hdr</xsl:with-param>
            </xsl:call-template>
          </xsl:variable>
          if ($('<xsl:value-of select="$schema_id" />')) {
            if (_shiny.<xsl:value-of select="$schema_id" /> != null) {
              _shiny.<xsl:value-of select="$schema_id" />.reset();
            } else {
              _shiny.<xsl:value-of select="$schema_id" /> = new Shiny.Collection.Header(
                '<xsl:value-of select="$schema_id" />',
                _shiny.<xsl:value-of select="$collection_id" />
              );
            }
          }
        </xsl:for-each>

      <xsl:if test="$update != true()">
        });
      </xsl:if>
    </script>
  </xsl:template>


  <!--
      Shiny.Panel
  <-->

  <xsl:template name="generate-panel-content">
    <xsl:param name="round" type="xs:boolean" select="true()" />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="recursive" type="xs:boolean" select="false()" />
    <div>
      <xsl:attribute name="class">xr<xsl:if
        test="$recursive = false()"> pad</xsl:if><xsl:if
        test="$round = true()"> round</xsl:if>
      </xsl:attribute>
      <div class="progress"></div>
      <div class="handle xr">
        <input class="shiny arrow" type="checkbox">
          <xsl:call-template name="generate-id-and-name-attributes">
            <xsl:with-param name="suffix">ck</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="generate-panel-input-attributes" />
        </input>
        <label class="title">
          <xsl:call-template name="generate-id-attribute">
            <xsl:with-param name="suffix">ck</xsl:with-param>
            <xsl:with-param name="attribute">for</xsl:with-param>
          </xsl:call-template>
          <xsl:value-of select="@title" />
        </label>
      </div>
      <div class="body xr">
        <div class="pad-top xr">
          <xsl:call-template name="output-using-library">
            <xsl:with-param name="content" select="sml:xhtml" />
            <xsl:with-param name="update" select="$update" />
          </xsl:call-template>
          <xsl:for-each select="sml:collection">
            <xsl:call-template name="generate-collection">
              <xsl:with-param name="update" select="$update" />
            </xsl:call-template>
          </xsl:for-each>
          <xsl:for-each select="sml:panels">
            <xsl:call-template name="generate-panels">
              <xsl:with-param name="round" select="false()" />
              <xsl:with-param name="scroll" select="false()" />
              <xsl:with-param name="recursive" select="true()" />
            </xsl:call-template>
          </xsl:for-each>
          <xsl:if test="sml:panels/preceding-sibling::sml:collection">
            <div class="resize"></div>
          </xsl:if>
        </div>
      </div>
    </div>
    <xsl:if test="sml:transition">
      <xsl:variable name="transition-id">
        <xsl:call-template name="generate-id">
          <xsl:with-param name="suffix">tr</xsl:with-param>
        </xsl:call-template>
      </xsl:variable>
      <xsl:variable name="transition-select-id">
        <xsl:call-template name="generate-id">
          <xsl:with-param name="suffix">trsel</xsl:with-param>
        </xsl:call-template>
      </xsl:variable>
      <div class="xr transition">
        <img alt="&gt;&gt;"
          class="left png" src="../images/arrow-from-large.png" />
        <img id="{$transition-id}" alt="&gt;&gt;" style="padding-top: 8px;"
          class="right png" src="../images/arrow-to-large.png" />
        <div class="xr interior">
        <div class="gray round">
          <xsl:call-template name="output-using-library">
            <xsl:with-param name="update" select="$update" />
            <xsl:with-param name="content" select="sml:transition/*" />
            <xsl:with-param name="attribute-map">
              <map ref="transition-select" id="{$transition-select-id}" />
            </xsl:with-param>
          </xsl:call-template>
        </div>
        </div>
      </div>
      <script type="text/javascript">
        <xsl:if test="$update != true()">
          document.observe('dom:loaded', function() {
        </xsl:if>
          if (_shiny.<xsl:value-of select="$transition-select-id" /> != null) {
            _shiny.<xsl:value-of select="$transition-select-id" />.reset();
          } else {
            _shiny.<xsl:value-of select="$transition-select-id" /> =
              new Shiny.Facade(
                '<xsl:value-of select="$transition-select-id" />', {
                  element: '<xsl:value-of select="$transition-id" />',
                  images: Shiny.Assets.Images.get('transition')
                }
              );
          }
        <xsl:if test="$update != true()">
          });
        </xsl:if>
      </script>
    </xsl:if>
  </xsl:template>


  <xsl:template name="generate-panel" match="sml:panel">
    <xsl:param name="round" type="xs:boolean" select="true()" />
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="recursive" type="xs:boolean" select="false()" />
    <div class="center xr">
      <xsl:call-template name="generate-id-attribute" />
      <xsl:call-template name="generate-panel-class">
        <xsl:with-param name="recursive" select="$recursive" />
      </xsl:call-template>
      <xsl:call-template name="generate-panel-content">
        <xsl:with-param name="round" select="$round" />
        <xsl:with-param name="update" select="$update" />
        <xsl:with-param name="recursive" select="$recursive" />
      </xsl:call-template>
    </div>
  </xsl:template>


  <!--
      Shiny.Collection
  <-->

  <xsl:template name="generate-collection-content">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:if test="$update = true()">
      <!--
        Input element persists sort order:
          This is necessary only on update; the markup generated
          by 'generate-panels-content' tracks this otherwise.
      <-->
      <input class="persist order" type="hidden">
        <xsl:call-template name="generate-id-and-name-attributes">
          <xsl:with-param name="suffix">order</xsl:with-param>
        </xsl:call-template>
      </input>
    </xsl:if>
    <xsl:choose>
      <xsl:when test="@type = 'form'">
        <div class="xr interior">
          <xsl:call-template name="generate-id-attribute">
            <xsl:with-param name="suffix">i</xsl:with-param>
          </xsl:call-template>
          <xsl:apply-templates select="sml:tuple" />
        </div>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="sml:tuple" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


  <xsl:template name="generate-collection" match="sml:collection">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:param name="recursive" type="xs:boolean" select="false()" />
    <xsl:for-each select="sml:schema">
      <xsl:call-template name="generate-header">
        <xsl:with-param name="update" select="$update" />
      </xsl:call-template>
    </xsl:for-each>
    <!-- Attribute @id is required -->
    <div id="{@id}">
      <xsl:call-template name="generate-collection-class">
        <xsl:with-param name="scrollable" select="not($recursive)" />
      </xsl:call-template>
      <div>
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="suffix">ps</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="generate-collection-panels-class" />
        <input type="hidden" class="persist order">
          <xsl:call-template name="generate-id-and-name-attributes">
            <xsl:with-param name="suffix">order</xsl:with-param>
          </xsl:call-template>
        </input>
        <xsl:call-template name="generate-collection-content" />
      </div>
    </div>
    <xsl:if test="$recursive = false() or local-name(..) = 'panel'">
      <input type="hidden" class="persist resize">
        <xsl:call-template name="generate-id-and-name-attributes">
          <xsl:with-param name="suffix">size</xsl:with-param>
        </xsl:call-template>
      </input>
      <div class="resize">
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="suffix">rs</xsl:with-param>
        </xsl:call-template>
      </div>
      <xsl:if test="local-name(..) = 'panel'">
        <div class="divider"></div>
      </xsl:if>
    </xsl:if>
  </xsl:template>


  <!--
      Shiny.Collection.Header
  <-->

  <xsl:template name="generate-header-tuple">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <div class="tuple xr">
      <xsl:call-template name="generate-id-attribute">
        <!-- Attribute @id on collection is required -->
        <xsl:with-param name="id" select="../@id" />
        <xsl:with-param name="suffix">hdr</xsl:with-param>
      </xsl:call-template>
      <xsl:for-each select="sml:elt">
        <xsl:call-template name="generate-header-tuple-elt">
          <xsl:with-param name="update" select="$update" />
        </xsl:call-template>
      </xsl:for-each>
    </div>
  </xsl:template>


  <xsl:template name="generate-header-tuple-elt">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <div>
      <xsl:call-template name="generate-id-attribute" />
      <xsl:call-template name="generate-schema-elt-class" />
      <input type="hidden" class="persist resize">
        <xsl:call-template name="generate-id-and-name-attributes">
          <xsl:with-param name="suffix">size</xsl:with-param>
        </xsl:call-template>
      </input>
      <!-- Resize control for column -->
      <div class="resize">
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="suffix">rs</xsl:with-param>
        </xsl:call-template>
      </div>
      <!-- Sort options for column -->
      <select>
        <xsl:attribute name="class">sort<xsl:if
          test="$update = true()"> hidden</xsl:if>
        </xsl:attribute>
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="prefix">sort</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="prefix">sort</xsl:with-param>
          <xsl:with-param name="attribute">name</xsl:with-param>
        </xsl:call-template>
        <option value="2">
          <xsl:if test="@sort = 'asc' or @sort = 'ascending'">
            <xsl:attribute name="selected">selected</xsl:attribute>
          </xsl:if>
          &#8593;
        </option>
        <option value="">
          <xsl:if test="not(@sort) or @sort = ''">
            <xsl:attribute name="selected">selected</xsl:attribute>
          </xsl:if>
          &#215;
        </option>
        <option value="1">
          <xsl:if test="@sort = 'desc' or @sort = 'descending'">
            <xsl:attribute name="selected">selected</xsl:attribute>
          </xsl:if>
          &#8595;
        </option>
      </select>
      <label>
        <xsl:call-template name="generate-id-attribute">
          <xsl:with-param name="prefix">sort</xsl:with-param>
          <xsl:with-param name="attribute">for</xsl:with-param>
        </xsl:call-template>
        <xsl:choose>
          <xsl:when test="normalize-space(.)">
            <xsl:value-of select="." />
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>&amp;nbsp;</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </label>
    </div>
  </xsl:template>


  <xsl:template name="generate-header" match="sml:schema">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <!-- Header for collection -->
    <div>
      <xsl:call-template name="generate-id-attribute">
        <xsl:with-param name="suffix">hdr</xsl:with-param>
      </xsl:call-template>
      <xsl:call-template name="generate-header-class" />
      <xsl:call-template name="generate-header-tuple">
        <xsl:with-param name="update" select="$update" />
      </xsl:call-template>
    </div>
   </xsl:template>


  <!--
      Shiny.Collection.Tuple
  <-->

  <xsl:template name="generate-tuple" match="sml:tuple">
    <xsl:param name="update" type="xs:boolean" select="false()" />
    <xsl:variable name="panel-id">
      <xsl:call-template name="generate-id">
        <xsl:with-param name="prefix" select="'p'" />
        <xsl:with-param name="skip-own-id" select="true()" />
      </xsl:call-template>
    </xsl:variable>
    <xsl:variable name="tuple-id">
      <xsl:call-template name="generate-id">
        <xsl:with-param name="prefix" select="'t'" />
        <xsl:with-param name="skip-own-id" select="true()" />
      </xsl:call-template>
    </xsl:variable>
    <div id="{$panel-id}">
      <xsl:call-template name="generate-collection-panel-class" />
      <div id="{$tuple-id}" class="tuple xr">
        <!-- First element -->
        <xsl:for-each select="sml:elt[1]">
          <xsl:variable name="elt-id">
            <xsl:call-template name="generate-id">
              <xsl:with-param name="base-id" select="$tuple-id" />
              <xsl:with-param name="prefix" select="'e'" />
              <xsl:with-param name="prefer-parent" select="true()" />
            </xsl:call-template>
          </xsl:variable>
          <div id="{$elt-id}">
            <xsl:attribute name="class">elt i0 xr<xsl:if
              test="not(ancestor::sml:collection[1]/@type = 'form')"> handle
            </xsl:if></xsl:attribute>
            <xsl:if test="not(ancestor::sml:collection[1]/@type = 'form')">
              <!-- Attribute 'id' is required on sml:collection -->
              <input name="{ancestor::sml:collection[1]/@id}">
                <xsl:call-template name="generate-tuple-input-class" />
                <xsl:call-template name="generate-id-attribute">
                  <xsl:with-param name="id" select="$tuple-id" />
                  <xsl:with-param name="suffix">ck</xsl:with-param>
                </xsl:call-template>
                <xsl:attribute name="value">
                  <xsl:choose>
                    <xsl:when test="../@id"><xsl:value-of select="../@id" /></xsl:when>
                    <xsl:otherwise>x<xsl:value-of
                      select="count(../preceding-sibling::*) - count(../sml:schema)"
                    /></xsl:otherwise>
                  </xsl:choose>
                </xsl:attribute>
              </input>
              <xsl:choose>
                <xsl:when test="../sml:collection">
                  <input type="checkbox" class="shiny arrow title checkbox">
                    <xsl:call-template name="generate-id-and-name-attributes">
                      <xsl:with-param name="id" select="$tuple-id" />
                      <xsl:with-param name="suffix">arr</xsl:with-param>
                    </xsl:call-template>
                  </input>
                </xsl:when>
                <xsl:otherwise>
                  <img src="../images/dot-gray.png"
                    class="png icon control" alt="*" />
                </xsl:otherwise>
              </xsl:choose>
              <xsl:if test="normalize-space(text()) != ''">
                <label class="title">
                  <xsl:call-template name="generate-id-attribute">
                    <xsl:with-param name="id" select="$tuple-id" />
                    <xsl:with-param name="suffix">ck</xsl:with-param>
                    <xsl:with-param name="attribute">for</xsl:with-param>
                  </xsl:call-template>
                  <xsl:value-of select="text()" />
                </label>
              </xsl:if>
            </xsl:if>
            <xsl:call-template name="output-using-library">
              <xsl:with-param name="id" select="$elt-id" />
              <xsl:with-param name="update" select="$update" />
              <xsl:with-param name="content" select="*" />
            </xsl:call-template>
          </div>
        </xsl:for-each>
        <!-- Elements two through final -->
        <xsl:for-each select="sml:elt[1]/following-sibling::sml:elt">
          <xsl:variable name="elt-id">
            <xsl:call-template name="generate-id">
              <xsl:with-param name="prefix" select="'e'" />
              <xsl:with-param name="base-id" select="$tuple-id" />
              <xsl:with-param name="prefer-parent" select="true()" />
            </xsl:call-template>
          </xsl:variable>
          <div id="{$elt-id}">
            <xsl:call-template name="generate-tuple-elt-class" />
            <xsl:if test="normalize-space(text()) != ''">
              <label>
                <xsl:if test="@color">
                  <xsl:attribute name="style">
                    color: <xsl:value-of select="@color" />;
                  </xsl:attribute>
                </xsl:if>
                <xsl:value-of select="text()" />
              </label>
            </xsl:if>
            <xsl:call-template name="output-using-library">
              <xsl:with-param name="id" select="$elt-id" />
              <xsl:with-param name="update" select="$update" />
              <xsl:with-param name="content" select="*" />
            </xsl:call-template>
          </div>
        </xsl:for-each>
        <xsl:for-each select="sml:collection">
          <div class="body xr">
            <xsl:call-template name="generate-collection">
              <xsl:with-param name="update" select="$update" />
              <xsl:with-param name="recursive">true</xsl:with-param>
            </xsl:call-template>
          </div>
        </xsl:for-each>
      </div>
    </div>
  </xsl:template>
  

</xsl:stylesheet>


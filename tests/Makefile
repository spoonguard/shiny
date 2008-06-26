
all: xml-index

xml-index: all-xml
	mv ../demo/ajax/shiny.html ../demo/index.html
	
all-xml:
	for i in xml/simple/*.xml; do \
		xsltproc --xinclude ../compiler/shiny.xslt "$$i" \
			> "../demo/ajax/`basename "$$i" .xml`.html"; \
	done


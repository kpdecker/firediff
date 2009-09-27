/* See license.txt for terms of usage */
var FireDiff  = FireDiff || {};

FireDiff.formatter = FBL.ns(function() { with (FBL) {
  const CSSModel = FireDiff.CSSModel;

  /**
   * Object passed to the formatter used to output the formatted object
   */
  this.Writer = function(indentToken) {
    this.lines = [];
    this.indentToken = indentToken;
    this.indent = 0;
    this.completeLine = true;
  };
  this.Writer.prototype = {
    toString: function() {
      return this.lines.join("");
    },
    write: function(text) {
      var newLines = text.split("\n");
      var indentStr = "";
      for (var i = 0; i < this.indent; i++) {
        indentStr += this.indentToken;
      }

      for (var i = 0; i < newLines.length; i++) {
        if (!this.completeLine) {
          this.completeLine = true;
        } else if (i < newLines.length - 1 || newLines[i]){
          newLines[i] = indentStr + newLines[i];
          
          // If the final line is not blank then we did not end on a new line char
          this.completeLine = i != newLines.length - 1;
        }
      }
      this.lines.push(newLines.join("\n"));
    },
    increaseIndent: function() {
      this.indent++;
    },
    decreaseIndent: function() {
      if (this.indent > 0) {
        this.indent--;
      }
    }
  };

  this.DOMFormatter = function(writer) {
    this.writer = writer;
  };
  this.DOMFormatter.prototype = {
    printNode: function(node) {
      if (node instanceof Element) {
        this.printElement(node);
      } else if (node instanceof Text) {
        this.printText(node);
      }
    },
    
    printElement: function(el) {
      this.writer.write("<");
      this.writer.write(el.tagName);
      
      var attrs = el.attributes;
      for (var i = 0; i < attrs.length; i++) {
        this.printAttr(attrs[i]);
      }
      this.writer.write(">");

      var childNodes = el.childNodes;
      for (var i = 0; i < childNodes.length; i++) {
        this.printNode(childNodes[i]);
      }

      this.writer.write("</");
      this.writer.write(el.tagName);
      this.writer.write(">");
    },
    printText: function(text) {
      // TODO : HTML Entity escape
      this.writer.write(text.data);
    },
    printAttr: function(attr) {
      this.writer.write(" ");
      this.writer.write(attr.nodeName);
      this.writer.write("=\"");
      this.writer.write(attr.nodeValue);
      this.writer.write("\"");
    },
    printComment: function(comment) {
      this.writer.write("<!--");
      this.writer.write(comment.data);
      this.writer.write("-->");
    },
    printCDATA: function(cdata) {
      this.writer.write("<![CDATA[");
      this.writer.write(cdata.data);
      this.writer.write("]]>");
    }
  };

  // TODO : What is this?
  function createIterStatus(collection, index, parent) {
    return {
        parent: parent,
        collection: collection,
        index: index,
        first: index == 0,
        last: index == (collection.length-1)
    };
  }
  this.CSSFormatter = function(writer) {
    this.writer = writer;
  };
  this.CSSFormatter.prototype = {
    printSheet: function(sheet) {
      var cssRules = sheet.cssRules;
      for (var i = 0; i < cssRules.length; i++) {
        var iterStatus = createIterStatus(cssRules, i);
        this.printRule(cssRules[i], iterStatus);
      }
    },
    printRule: function(cssRule, iterStatus) {
      if (cssRule instanceof CSSStyleRule || cssRule instanceof CSSModel.CSSStyleRuleClone) {
        this.printStyleRule(cssRule, iterStatus);
      } else if (cssRule instanceof CSSMediaRule || cssRule instanceof CSSModel.CSSMediaRuleClone) {
        this.printMediaRule(cssRule, iterStatus);
      } else if (cssRule instanceof CSSFontFaceRule || cssRule instanceof CSSModel.CSSFontFaceRuleClone) {
        this.printFontFaceRule(cssRule, iterStatus);
      } else if (cssRule instanceof CSSImportRule || cssRule instanceof CSSModel.CSSImportRuleClone) {
        this.printImportRule(cssRule, iterStatus);
      } else if (cssRule instanceof CSSCharsetRule || cssRule instanceof CSSModel.CSSCharsetRuleClone) {
        this.printCharsetRule(cssRule, iterStatus);
      }
    },
    printStyleRule: function(styleRule, iterStatus) {
      this.writer.write(styleRule.selectorText + " {\n");
      this.writer.increaseIndent();
      this.printStyleDeclaration(styleRule.style, iterStatus);
      this.writer.decreaseIndent();
      this.writer.write("}\n");
      if (!iterStatus.last) {
        this.writer.write("\n");
      }
    },
    printFontFaceRule: function(styleRule, iterStatus) {
      this.writer.write("@font-face {\n");
      this.writer.increaseIndent();
      this.printStyleDeclaration(styleRule.style, iterStatus);
      this.writer.decreaseIndent();
      this.writer.write("}\n");
      this.writer.write("\n");
    },
    printStyleDeclaration: function(style, iterStatus) {
      // Copied from CSS Panel's getRuleProperties implementation
      // TODO : Attempt to unify these as a lib method?
      var lines = style.cssText.match(/(?:[^;\(]*(?:\([^\)]*?\))?[^;\(]*)*;?/g),
          propRE = /\s*([^:\s]*)\s*:\s*(.*?)\s*(! important)?;?$/,
          line, m, i = 0;
      while(line=lines[i++]){
        m = propRE.exec(line);
        if(!m)    continue;
        //var name = m[1], value = m[2], important = !!m[3];
        if (m[2]) {
          this.printProperty(m[1], m[2], m[3]);
        }
      }
    },
    printProperty: function(propName, value, priority, iterStatus) {
      this.writer.write(propName + ": " + value + (priority ? " " + priority : "") + ";\n");
    },
    printMediaRule: function(mediaRule, iterStatus) {
      this.writer.write("@media " + mediaRule.media.mediaText + " {\n");
      this.writer.increaseIndent();
      var cssRules = mediaRule.cssRules;
      
      for (var i = 0; i < cssRules.length; i++) {
        var childIterStatus = createIterStatus(cssRules, i, iterStatus);
        this.printRule(cssRules[i], childIterStatus);
      }

      this.writer.decreaseIndent();
      this.writer.write("}\n");
      this.writer.write("\n");
    },
    printImportRule: function(importRule, iterStatus) {
      this.writer.write("@import url(\"" + importRule.href + "\");\n");
      var nextSibling = iterStatus.collection[iterStatus.index+1];
      if (!(nextSibling instanceof CSSImportRule)
          && !(nextSibling instanceof CSSModel.CSSImportRuleClone)) {
        this.writer.write("\n");
      }
    },
    printCharsetRule: function(charsetRule, iterStatus) {
      this.writer.write("@charset \"" + charsetRule.encoding + "\";\n");
    }
  };
}});
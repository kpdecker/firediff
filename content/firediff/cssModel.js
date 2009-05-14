/* See license.txt for terms of usage */
var FireDiff = FireDiff || {};

/*
 * Implements the logic necessary to deep clone as CSS object.
 * 
 * Note that this does not clone the CSS value types, so this could
 * introduce some inconsistencies with the stored data model
 */
FireDiff.CSSModel = FBL.ns(function() { with (FBL) {
  function elementEquals(left, right, i) {
    if (left && left.equals) {
      if (!left.equals(right)) {
        FBTrace.sysout("Not Equal equals: " + i + " '" + left + "' '" + right + "'", left);
        return false;
      }
    } else {
      if (left != right) {
        FBTrace.sysout("Not Equal ==: " + i + " '" + left + "' '" + right + "'", left);
        return false;
      }
    }
    return true;
  }
  
  function CloneObject() {}
  CloneObject.prototype = {
    equals: function(test) {
      var tested = { cssText: true },
          i;
      for (i in this) {
        if (this.hasOwnProperty(i) && !tested[i]) {
          var left = this[i], right = test[i];
          if (!elementEquals(this[i], test[i], i))    return false;
          tested[i] = true;
        }
      }
      for (i in test) {
        if (test.hasOwnProperty(i) && !tested[i]) {
          // We haven't seen it before, so it must not equal
          return false;
        }
      }
      return true;
    },
    clone: function() {
      return cloneCSSObject(this);
    }
  }
  function ArrayCloneObject(array) {
    this.length = 0;
    for (var i = 0; i < array.length; i++) {
      this.push(cloneCSSObject(array[i]));
    }
  }
  ArrayCloneObject.prototype = {
    push: Array.prototype.push,
    equals: function arrayEquals(right) {
      if (this.length != right.length)    return false;
      for (var i = 0; i < this.length; i++) {
        if (!elementEquals(this[i], right[i], i))    return false;
      }
      return true;
    }
  };
  
  function StyleDeclarationClone(style) {
    this.cssText = style.cssText;
    this.properties = {};
    this.length = 0;

    // Copied from CSS Panel's getRuleProperties implementation
    // TODO : Attempt to unify these as a lib method?
    var lines = this.cssText.match(/(?:[^;\(]*(?:\([^\)]*?\))?[^;\(]*)*;?/g);
    var propRE = /\s*([^:\s]*)\s*:\s*(.*?)\s*(! important)?;?$/;
    var line,i=0;
    while(line=lines[i++]){
      m = propRE.exec(line);
      if(!m)    continue;
      //var name = m[1], value = m[2], important = !!m[3];
      if (m[2]) {
        this.setProperty(m[1], m[2], m[3]);
      }
    }
  }
  StyleDeclarationClone.prototype = extend(CloneObject.prototype, {
    getPropertyValue: function(propertyName) {
      var prop = this.properties[propertyName];
      return prop && prop.value;
    },
    getPropertyPriority: function(propertyName) {
      var prop = this.properties[propertyName];
      return prop && prop.priority;
    },
    setProperty: function(propertyName, value, priority) {
      this.properties[propertyName] = {
          value: value,
          priority: priority || "",
          
          equals: function(right) {
            return this.value == right.value && this.priority == right.priority;
          }
      };
      // TODO : Don't add this if the prop already exists
      this[this.length++] = propertyName;
      // TODO : Update cssText so we can clone properly
    },
    removeProperty: function(propertyName) {
      // TODO : Fix the indexes
      delete this.properties[propertyName];
      // TODO : Update cssText so we can clone properly
    },
    equals: function(test) {
      return CloneObject.prototype.equals.call(this.properties, test.properties);
    }
  });

  function MediaListClone(media) {
    ArrayCloneObject.call(this, []);
    
    // To comment on my own confusion, even though my expected is not really spec:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=492925
    for (var i = 0; i < media.length; i++) {
      this.push(media.item(i));
    }
    this.mediaText = media.mediaText;
  }
  MediaListClone.prototype = ArrayCloneObject.prototype;
  
  var RulesClone = ArrayCloneObject;
  
  function StyleSheetClone(sheet) {
    this.type = sheet.type;
    this.disabled = sheet.disabled;
    this.href = sheet.href;
    this.title = sheet.title;
    this.media = new MediaListClone(sheet.media);
    
    this.cssRules = new RulesClone(sheet.cssRules);
  }
  StyleSheetClone.prototype = extend(CloneObject.prototype, {
    insertRule: function(rule, index) {
      // TODO : Parse the the rule text
      this.cssRules.splice(index, 0, {});
    },
    deleteRule: function(index) {
      this.cssRules.splice(index, 1);
    }
  });
  
  function CSSRuleClone(rule) {
    this.type = rule.type;
    this.cssText = rule.cssText;
  }
  CSSRuleClone.prototype = CloneObject.prototype;
  
  function CSSStyleRuleClone(rule) {
    CSSRuleClone.call(this, rule);
    this.selectorText = rule.selectorText;
    this.style = new StyleDeclarationClone(rule.style);
  }
  CSSStyleRuleClone.prototype = CSSRuleClone.prototype;
  
  function CSSMediaRuleClone(rule) {
    CSSRuleClone.call(this, rule);
    this.cssRules = new RulesClone(rule.cssRules);
    this.media = new MediaListClone(rule.media);
  }
  CSSMediaRuleClone.prototype = extend(CSSRuleClone.prototype, {
    // TODO : Impl the functions for this class
  });
  var CSSFontFaceRuleClone = CSSStyleRuleClone;
  var CSSPageRuleClone = CSSStyleRuleClone;
  
  function CSSImportRuleClone(rule) {
    CSSRuleClone.call(this, rule);
    
    this.href = rule.href;
    this.media = new MediaListClone(rule.media);
    this.styleSheet = new StyleSheetClone(rule.styleSheet);
  }
  CSSImportRuleClone.prototype = CSSRuleClone.prototype;
  
  function CSSCharsetRuleClone(rule) {
    CSSRuleClone.call(this, rule);
    this.encoding = rule.encoding;
  }
  CSSCharsetRuleClone.prototype = CSSRuleClone.prototype;
  

  function cloneCSSObject(cssRule) {
    if (cssRule instanceof CSSStyleSheet || cssRule instanceof StyleSheetClone) {
      return new StyleSheetClone(cssRule);
    } else if (cssRule instanceof CSSStyleRule || cssRule instanceof CSSStyleRuleClone) {
      return new CSSStyleRuleClone(cssRule);
    } else if (cssRule instanceof CSSMediaRule || cssRule instanceof CSSMediaRuleClone) {
      return new CSSMediaRuleClone(cssRule);
    } else if (cssRule instanceof CSSFontFaceRule || cssRule instanceof CSSFontFaceRuleClone) {
      return new CSSFontFaceRuleClone(cssRule);
    } else if (cssRule instanceof CSSPageRule || cssRule instanceof CSSPageRuleClone) {
      return new CSSPageRuleClone(cssRule);
    } else if (cssRule instanceof CSSImportRule || cssRule instanceof CSSImportRuleClone) {
      return new CSSImportRuleClone(cssRule);
    } else if (cssRule instanceof CSSCharsetRule || cssRule instanceof CSSCharsetRuleClone) {
      return new CSSCharsetRuleClone(cssRule);
    } else if (cssRule instanceof CSSUnknownRule || cssRule instanceof CSSRuleClone) {
      return new CSSRuleClone(cssRule);
    } else if (cssRule instanceof CSSStyleDeclaration || cssRule instanceof StyleDeclarationClone) {
      return new StyleDeclarationClone(cssRule);
    }
  }
  
  this.cloneCSSObject = cloneCSSObject;
}});
function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "lib/cssModel.htm", function(win) {
    var Path = FBTest.FirebugWindow.FireDiff.Path,
        FBTrace = FBTest.FirebugWindow.FBTrace;
    
    var expectedStylePaths, expectedStyles = [];
    if (FBTestFireDiff.isFirefox30()) {
      expectedStylePaths = [
          "/style()[1]",
          "/style()[1]/rule()[1]",
          "/style()[1]/rule()[2]",
          "/style()[1]/rule()[3]",
          "/style()[@id='cssId']",
          "/style()[@id='cssId']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[2]/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[3]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[3]/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[4]",
          "/style()[@href='" + urlBase + "lib/link2.css']",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/import.css']",
          "/style()[@href='" + urlBase + "lib/import.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[3]",
          "/style()[@href='" + urlBase + "lib/link2.css']",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/import.css']",
          "/style()[@href='" + urlBase + "lib/import.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[3]",
          "/style()[6]",
          "/style()[6]/rule()[1]"
          ];
    } else {
      expectedStylePaths = [
          "/style()[1]",
          "/style()[1]/rule()[1]",
          "/style()[1]/rule()[2]",
          "/style()[1]/rule()[3]",
          "/style()[@id='cssId']",
          "/style()[@id='cssId']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[3]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[3]/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[4]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[4]/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link1.css']/rule()[5]",
          "/style()[@href='" + urlBase + "lib/link2.css']",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/import.css']",
          "/style()[@href='" + urlBase + "lib/import.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[3]",
          "/style()[@href='" + urlBase + "lib/link2.css']",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/import.css']",
          "/style()[@href='" + urlBase + "lib/import.css']/rule()[1]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[2]",
          "/style()[@href='" + urlBase + "lib/link2.css']/rule()[3]",
          "/style()[6]",
          "/style()[6]/rule()[1]"
          ];
    }

    function testSheet(curStyle, expectedStylePaths) {
      FBTest.compare(
          expectedStylePaths[expectedIndex++],
          Path.getStylePath(curStyle),
          "Check generated CSS Path");
      expectedStyles.push(curStyle);
      for (var testIndex = 0; testIndex < curStyle.cssRules.length; testIndex++) {
        var rule = curStyle.cssRules[testIndex];
        if (rule instanceof CSSMediaRule) {
          testSheet(rule, expectedStylePaths);
        } else {
          FBTest.compare(
              expectedStylePaths[expectedIndex++],
              Path.getStylePath(rule),
              "Check generated CSS Path");
          expectedStyles.push(rule);
        }
        
        if (rule instanceof CSSImportRule) {
          testSheet(rule.styleSheet, expectedStylePaths);
        }
      }
    }
    // Iterate over style and link objects
    var iterate = win.document.evaluate("//style|//link", win.document, null, XPathResult.ANY_TYPE, null);
    var curEl, expectedIndex = 0;
    while ((curEl = iterate.iterateNext())) {
      var curStyle = curEl.sheet;
      testSheet(curStyle, expectedStylePaths);
    }
    
    // Iterate via the stylesheets collection (This appears to mirror the xpath above)
    var curEl, expectedIndex = 0;
    for (var i = 0; i < win.document.styleSheets.length; i++) {
      testSheet(win.document.styleSheets[i], expectedStylePaths);
    }
    
    function compareStyle(style, expectedStyle, path) {
      if (style instanceof CSSRule) {
        FBTest.compare(
            expectedStyle.type,
            style.type,
            "Style returned by path " + path + " type");
        FBTest.compare(
            expectedStyle.cssText,
            style.cssText,
            "Style returned by path " + path + " cssText");
      } else {
        for (var name in style) {
          if (name == "ownerNode" || name == "parentRule"
              || name == "parentStyleSheet" || name == "styleSheet"
              || name == "cssRules" || name === "media" || name === "ownerRule"
              || name === "insertRule" || name === "deleteRule")  continue;
            
          FBTest.compare(
              expectedStyle[name],
              style[name],
              "Style returned by path " + path + " " + name);
        }
      }
      
      if (style.cssRules) {
        for (var ruleIndex = 0; ruleIndex < style.cssRules.length; ruleIndex++) {
          compareStyle(
              expectedStyle.cssRules[ruleIndex],
              style.cssRules[ruleIndex],
              path + "/rule()[" + (ruleIndex+1) + "]");
        }
      }
    }
    for (var i = 0; i < expectedStylePaths.length; i++) {
      var style = Path.evaluateStylePath(expectedStylePaths[i], win.document);
      
      compareStyle(expectedStyles[i], style, expectedStylePaths[i]);
    }
    
    FBTestFirebug.testDone();
  });
}
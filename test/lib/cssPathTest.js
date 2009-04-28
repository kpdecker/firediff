function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  FBTest.loadScript("FBTestFireDiff.js", this);
  FBTestFirebug.openNewTab(urlBase + "lib/cssModel.htm", function(win) {
    var Path = FBTest.FirebugWindow.FireDiff.Path,
        FBTrace = FBTest.FirebugWindow.FBTrace;
    
    var expectedStylePaths = [
        "/style()[1]",
        "/style()[1]/rule()[1]",
        "/style()[1]/rule()[2]",
        "/style()[1]/rule()[3]",
        "/style()[@id='cssId']",
        "/style()[@id='cssId']/rule()[1]",
        "/style()[@href='" + urlBase + "lib/link1.css']",
        "/style()[@href='" + urlBase + "lib/link1.css']/rule()[1]",
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
    
    // TODO : Look at all of the other CSS rule types that could be in use

    function testSheet(curStyle, expectedStylePaths) {
      FBTest.compare(
          expectedStylePaths[expectedIndex++],
          Path.generateStylePath(curStyle),
          "Check generated CSS Path");
      for (var testIndex = 0; testIndex < curStyle.cssRules.length; testIndex++) {
        FBTrace.sysout("Test: " + expectedStylePaths[expectedIndex], curStyle.cssRules[testIndex]);
        FBTest.compare(
            expectedStylePaths[expectedIndex++],
            Path.generateStylePath(curStyle.cssRules[testIndex]),
            "Check generated CSS Path");
        
        FBTrace.sysout("cssRule: " + testIndex, curStyle.cssRules[testIndex]);
        if (curStyle.cssRules[testIndex] instanceof CSSImportRule) {
          testSheet(curStyle.cssRules[testIndex].styleSheet, expectedStylePaths);
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
    
    // TODO : Test on @media and other CSS constructs
    
    // TODO : Test CSS Path Lookup
    //    This should verify that duplicate links return the last one in the
    //    page
    
    FBTestFirebug.testDone();
  });
}
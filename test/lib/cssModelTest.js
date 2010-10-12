function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  var CSSModel = FBTest.FirebugWindow.FireDiff.CSSModel,
      FBTrace = FBTest.FirebugWindow.FBTrace;

  FBTestFirebug.openNewTab(urlBase + "lib/cssModel.htm", function(win) {
    var doc = win.document;
    
    function createSheet(cssText) {
      var style = doc.createElement("style");
      style.type = "text/css";
      style.innerHTML = cssText;
      
      // Sheet is only defined if it is a part of the document
      doc.getElementsByTagName("head")[0].appendChild(style);
      
      return style.sheet;
    }
    
    function compareCSS(left, right, expected, msg) {
      var cloneLeft = CSSModel.cloneCSSObject(left),
          cloneRight = CSSModel.cloneCSSObject(right);

      FBTest.compare(true, cloneLeft.equals(CSSModel.cloneCSSObject(left)), msg + " left clone identity");
      FBTest.compare(true, cloneRight.equals(CSSModel.cloneCSSObject(right)), msg + " right clone identity");
      FBTest.compare(expected, cloneLeft.equals(cloneRight), msg);
    }
    
    var sheetOne = createSheet(".rule1 {} .rule2 {} .rule3 { border: medium none; }"),
        sheetTwo = createSheet(".rule1 {}"),
        sheetThree = createSheet(".rule1 {} .rule2 {} .rule3 { border: medium none; }");
    
    // Test clone contents
    var cloneOne = CSSModel.cloneCSSObject(sheetOne);
    FBTest.compare("text/css", cloneOne.type, "clone type");
    FBTest.compare(false, cloneOne.disabled, "clone disabled");
    FBTest.compare(undefined, cloneOne.href, "clone href");
    FBTest.compare(0, cloneOne.media && cloneOne.media.length, "clone media");
    FBTest.compare("", cloneOne.title, "clone title");
    FBTest.compare(3, cloneOne.cssRules && cloneOne.cssRules.length, "clone cssRules.length");
    
    var testRule = cloneOne.cssRules[0];
    FBTest.compare(CSSRule.STYLE_RULE, testRule.type, "clone .rule1 type");
    FBTest.compare(".rule1", testRule.selectorText, "clone .rule1 selectorText");
    FBTest.compare(0, testRule.style.length, "clone .rule1 style length");
    
    testRule = cloneOne.cssRules[1];
    FBTest.compare(CSSRule.STYLE_RULE, testRule.type, "clone .rule2 type");
    FBTest.compare(".rule2", testRule.selectorText, "clone .rule2 selectorText");
    FBTest.compare(0, testRule.style.length, "clone .rule2 style length");
    
    testRule = cloneOne.cssRules[2];
    FBTest.compare(CSSRule.STYLE_RULE, testRule.type, "clone .rule3 type");
    FBTest.compare(".rule3", testRule.selectorText, "clone .rule3 selectorText");
    FBTest.compare(1, testRule.style.length, "clone .rule3 style length");
    FBTest.compare("border", testRule.style[0], "clone .rule3 style prop lookup");
    FBTest.compare("medium none", testRule.style.getPropertyValue("border"), "clone .rule3 style prop value");
    FBTest.compare("", testRule.style.getPropertyPriority("border"), "clone .rule3 style prop priority");
    
    var link1 = doc.styleSheets[2], link2 = doc.styleSheets[doc.styleSheets.length - 2];
    cloneOne = CSSModel.cloneCSSObject(link1);

    // This is lazy, but firefox 3.0 doesn't match the expected behavior, so we'll ignore
    if (!FBTestFireDiff.isFirefox30()) {
      testRule = cloneOne.cssRules[2];
      FBTest.compare(true, testRule.equals(testRule), "clone media equal");
      FBTest.compare(CSSRule.MEDIA_RULE, testRule.type, "clone media type");
      FBTest.compare(2, testRule.media && testRule.media.length, "clone media lenth");
      FBTest.compare("tv", testRule.media[0], "clone media value");
      FBTest.compare("print", testRule.media[1], "clone media value");
      FBTest.compare(1, testRule.cssRules && testRule.cssRules.length, "clone media rules length");
      
      testRule = testRule.cssRules[0];
      FBTest.compare(CSSRule.STYLE_RULE, testRule.type, "clone #div2 type");
      FBTest.compare("#div2", testRule.selectorText, "clone #div2 selectorText");
      FBTest.compare(1, testRule.style.length, "clone #div2 style length");
      FBTest.compare("overflow", testRule.style[0], "clone #div2 style prop lookup");
      FBTest.compare("hidden", testRule.style.getPropertyValue("overflow"), "clone #div2 style prop value");
      FBTest.compare("", testRule.style.getPropertyPriority("overflow"), "clone #div2 style prop priority");
    }
    
    cloneOne = CSSModel.cloneCSSObject(link2);
    
    testRule = cloneOne.cssRules[0];
    var importSheet = testRule.styleSheet;
    FBTest.compare(true, testRule.equals(testRule), "clone import equal");
    FBTest.compare(CSSRule.IMPORT_RULE, testRule.type, "clone import type");
    FBTest.compare("import.css", testRule.href, "clone import href");
    FBTest.compare(0, testRule.media && testRule.media.length, "clone import media lenth");
    FBTest.sysout("import " + testRule, testRule);
    FBTest.compare(urlBase + "lib/import.css", testRule.styleSheet && testRule.styleSheet.href, "clone import media sheet href");
    
    // Test CSS equals
    compareCSS(link1, link1, true, "link1 equals link1");
    compareCSS(link2, link2, true, "link2 equals link2");
    compareCSS(importSheet, importSheet, true, "import equals import");
    
    compareCSS(sheetOne, sheetOne, true, "sheetOne equals sheetOne");
    compareCSS(sheetOne, sheetTwo, false, "sheetOne not equals sheetTwo");
    compareCSS(sheetOne, sheetThree, true, "sheetOne equals sheetThree");
    
    compareCSS(sheetTwo, sheetTwo, true, "sheetTwo equals sheetTwo");
    compareCSS(sheetTwo, sheetThree, false, "sheetOne not equals sheetOne");

    // (.rule1, .rule1) equal, styles equal
    compareCSS(sheetOne.cssRules[0], sheetOne.cssRules[0], true, "sheetOne.rule1 equals sheetOne.rule1");
    compareCSS(sheetOne.cssRules[0], sheetTwo.cssRules[0], true, "sheetOne.rule1 equals sheetTwo.rule1");
    compareCSS(sheetOne.cssRules[0], sheetThree.cssRules[0], true, "sheetOne.rule1 equals sheetThree.rule1");
    compareCSS(sheetOne.cssRules[0].style, sheetOne.cssRules[0].style, true, "sheetOne.rule1.style equals sheetOne.rule1.style");
    compareCSS(sheetOne.cssRules[0].style, sheetTwo.cssRules[0].style, true, "sheetOne.rule1.style equals sheetTwo.rule1.style");
    compareCSS(sheetOne.cssRules[0].style, sheetThree.cssRules[0].style, true, "sheetOne.rule1.style equals sheetThree.rule1.style");
    
    // (.rule1, .rule2) not equal, styles equal
    compareCSS(sheetOne.cssRules[0], sheetOne.cssRules[1], false, "sheetOne.rule1 not equals sheetOne.rule2");
    compareCSS(sheetOne.cssRules[0], sheetThree.cssRules[1], false, "sheetOne.rule1 not equals sheetThree.rule2");
    compareCSS(sheetOne.cssRules[0].style, sheetOne.cssRules[1].style, true, "sheetOne.rule1.style equals sheetOne.rule2.style");
    compareCSS(sheetOne.cssRules[0].style, sheetThree.cssRules[1].style, true, "sheetOne.rule1.style equals sheetThree.rule2.style");
    
    // (.rule1, .rule3) not equal, styles not equal
    compareCSS(sheetOne.cssRules[0], sheetOne.cssRules[2], false, "sheetOne.rule1 not equals sheetOne.rule3");
    compareCSS(sheetOne.cssRules[0], sheetThree.cssRules[2], false, "sheetOne.rule1 not equals sheetThree.rule3");
    compareCSS(sheetOne.cssRules[0].style, sheetOne.cssRules[2].style, false, "sheetOne.rule1.style not equals sheetOne.rule3.style");
    compareCSS(sheetOne.cssRules[0].style, sheetThree.cssRules[2].style, false, "sheetOne.rule1.style not equals sheetThree.rule3.style");
    
    // Test Apply + Revert on the clone + equality
    var cloneOne = CSSModel.cloneCSSObject(sheetOne.cssRules[0].style);
    // Yes cheating here. FF converts 'none' -> 'medium none' behind the scenes
    // meaning we can't have a true one to one mapping, but it should be close
    // enough as we are recording input from the developer who in theory knows 
    // what's going on and FF should apply the same transformations on application
    cloneOne.setProperty("border", "medium none");
    FBTest.compare(true, cloneOne.equals(CSSModel.cloneCSSObject(sheetThree.cssRules[2].style)), "Compare add property");

    cloneOne = CSSModel.cloneCSSObject(sheetOne.cssRules[2].style);
    cloneOne.removeProperty("border");
    FBTest.compare(true, cloneOne.equals(CSSModel.cloneCSSObject(sheetThree.cssRules[0].style)), "Compare remove property");
    
    // Test clone of a changed style declaration
    cloneOne = CSSModel.cloneCSSObject(sheetOne.cssRules[0].style);
    cloneOne.setProperty("border", "medium none");
    FBTest.compare(true, cloneOne.equals(CSSModel.cloneCSSObject(cloneOne)), "Compare change style clone");
    
    // Test stylesheet deleteRule
    cloneOne = CSSModel.cloneCSSObject(sheetOne);
    cloneOne.deleteRule(1);
    cloneOne.deleteRule(1);
    FBTest.compare(true, cloneOne.equals(CSSModel.cloneCSSObject(sheetTwo)), "Compare deleteRule clone");
    
    // Test stylesheet insertRule
    cloneOne = CSSModel.cloneCSSObject(sheetTwo);
    cloneOne.insertRule(CSSModel.cloneCSSObject(sheetOne.cssRules[1]), 1);
    cloneOne.insertRule(CSSModel.cloneCSSObject(sheetOne.cssRules[2]), 2);
    FBTest.compare(true, cloneOne.equals(CSSModel.cloneCSSObject(sheetOne)), "Compare insertRule clone");
    
    FBTestFirebug.testDone();
  });
}
function runTest() {
  // TODO : Use the lib method
  FBTest.compareObjects = function(expected, test, msg) {
    var tested = {};
    
    if (expected) {
      for (var i in expected) {
        tested[i] = true;
        
        FBTest.compare(expected[i], test && test[i], msg + " " + i);
      }
    }
    if (test) {
      for (var i in test) {
        if (!tested[i]) {
          // These are all errors, but run through compare anyway
          FBTest.compare(expected && expected[i], test[i], msg + " " + i);
        }
      }
    }
  }
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "lib/path.htm", function(win) {
    var Path = FBTest.FirebugWindow.FireDiff.Path,
        FBL = FBTest.FirebugWindow.FBL;
    
    // FireDiff.Path.updateForRemove
    FBTest.compare(
        "/node()[1]/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/node()[2]/body[1]/div[3]/text()[3]", "/node()[1]"),
        "updateForRemove: root update case");
    FBTest.compare(
        undefined,
        Path.updateForRemove("/node()[2]/body[1]/div[3]/text()[3]", "/node()[2]"),
        "updateForRemove: root identity case");
    FBTest.compare(
        undefined,
        Path.updateForRemove("/node()[2]", "/node()[2]"),
        "updateForRemove: root identity case");
    FBTest.compare(
        "/node()[2]",
        Path.updateForRemove("/node()[2]", "/node()[2]/body[1]/div[3]/text()[3]"),
        "updateForRemove: reverse root identity case");
    FBTest.compare(
        "/html[1]/body[1]/div[2]/text()[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[1]"),
        "updateForRemove: update case");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[4]"),
        "updateForRemove: update case");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[3]/div[1]"),
        "updateForRemove: different sibling");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[2]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[3]/text()[2]"),
        "updateForRemove: same sibling");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[2]/div[2]"),
        "updateForRemove: different cousin");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[2]/text()[2]"),
        "updateForRemove: same cousin");
    FBTest.compare(
        "/html[1]/body[1]/div[3]",
        Path.updateForRemove("/html[1]/body[1]/div[3]", "/html[1]/body[1]/div[3]/text()[2]"),
        "updateForRemove: child");
    FBTest.compare(
        undefined,
        Path.updateForRemove("/html[1]/body[1]/div[3]/text()[2]", "/html[1]/body[1]/div[3]"),
        "updateForRemove: parent");
        
    // FireDiff.Path.updateForInsert
    FBTest.compare(
        "/node()[3]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/node()[2]/body[1]/div[3]/text()[3]", "/node()[1]"),
        "updateForInsert: root update case");
    FBTest.compare(
        "/node()[3]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/node()[2]/body[1]/div[3]/text()[3]", "/node()[2]"),
        "updateForInsert: root identity case");
    FBTest.compare(
        "/node()[2]",
        Path.updateForInsert("/node()[2]", "/node()[2]/body[1]/div[3]/text()[3]"),
        "updateForInsert: reverse root identity case");
    FBTest.compare(
        "/node()[3]",
        Path.updateForInsert("/node()[2]", "/node()[2]"),
        "updateForInsert: identity case");
    FBTest.compare(
        "/html[1]/body[1]/div[4]/text()[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[1]"),
        "updateForInsert: update case");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[4]"),
        "updateForInsert: update case");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[3]/div[1]"),
        "updateForInsert: different sibling");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[4]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[3]/text()[2]"),
        "updateForInsert: same sibling");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[2]/div[2]"),
        "updateForInsert: different cousin");
    FBTest.compare(
        "/html[1]/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[3]", "/html[1]/body[1]/div[2]/text()[2]"),
        "updateForInsert: same cousin");
    FBTest.compare(
        "/html[1]/body[1]/div[3]",
        Path.updateForInsert("/html[1]/body[1]/div[3]", "/html[1]/body[1]/div[3]/text()[2]"),
        "updateForInsert: child");
    FBTest.compare(
        "/html[1]/body[1]/div[4]/text()[2]",
        Path.updateForInsert("/html[1]/body[1]/div[3]/text()[2]", "/html[1]/body[1]/div[3]"),
        "updateForInsert: parent");
    
    // FireDiff.Path.getIdentifier
    FBTest.compareObjects(undefined, Path.getIdentifier("/"), "getIdentifier");
    FBTest.compareObjects({tag: "body", index: undefined }, Path.getIdentifier("/html[1]/body"), "getIdentifier");
    FBTest.compareObjects({tag: "div", index: 1 }, Path.getIdentifier("/html[1]/body[1]/div[1]"), "getIdentifier");
    FBTest.compareObjects({tag: "text()", index: 2 }, Path.getIdentifier("/html[1]/body[1]/text()[2]"), "getIdentifier");
    FBTest.compareObjects({tag: "test()", index: 6 }, Path.getIdentifier("/html[1]/body[1]/element[1]/item[1]/test()[6]"), "getIdentifier");
    
    // FireDiff.Path.getParentPath
    FBTest.compare("/", Path.getParentPath("/"), "getParentPath /");
    FBTest.compare("/html[1]", Path.getParentPath("/html[1]/body"), "getParentPath body");
    FBTest.compare("/html[1]/body[1]", Path.getParentPath("/html[1]/body[1]/div[1]"), "getParentPath div[1]");
    FBTest.compare("/html[1]/body[1]", Path.getParentPath("/html[1]/body[1]/text()[2]"), "getParentPath text()");
    FBTest.compare("/html[1]/body[1]/element[1]/item[1]", Path.getParentPath("/html[1]/body[1]/element[1]/item[1]/test()[6]"), "getParentPath test()");
    
    // FireDiff.Path.getRelativeComponents
    FBTest.compareObjects(
        { common: "/html[1]", left: "", right: "" },
        Path.getRelativeComponents("/html[1]", "/html[1]"),
        "getRelativeComponents - ID");
    FBTest.compareObjects(
        { common: "/html[1]", left: "", right: "div[1]" },
        Path.getRelativeComponents("/html[1]", "/html[1]/div[1]"),
        "getRelativeComponents - child");
    FBTest.compareObjects(
        { common: "/html[1]", left: "", right: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]", "/html[1]/div[1]/text()[1]"),
        "getRelativeComponents - grandchild");
    FBTest.compareObjects(
        { common: "/html[1]", left: "text()[1]", right: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/text()[1]", "/html[1]/div[1]/text()[1]"),
        "getRelativeComponents - nephew");
    FBTest.compareObjects(
        { common: "/html[1]", right: "", left: "div[1]" },
        Path.getRelativeComponents("/html[1]/div[1]", "/html[1]"),
        "getRelativeComponents - parent");
    FBTest.compareObjects(
        { common: "/html[1]", right: "", left: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/div[1]/text()[1]", "/html[1]"),
        "getRelativeComponents - grandparent");
    FBTest.compareObjects(
        { common: "/html[1]", right: "text()[1]", left: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/div[1]/text()[1]", "/html[1]/text()[1]"),
        "getRelativeComponents - nephew");
    FBTest.compareObjects(
        { common: "/", right: "html[1]/text()[1]", left: "html[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("/html[2]/div[1]/text()[1]", "/html[1]/text()[1]"),
        "getRelativeComponents - root disjoint");
    FBTest.compareObjects(
        { common: "", right: "html[1]/text()[1]", left: "html[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("html[2]/div[1]/text()[1]", "html[1]/text()[1]"),
        "getRelativeComponents - complete disjoint");
    FBTest.compareObjects(
        { common: "/", right: "node()[1]/text()[1]", left: "node()[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("/node()[2]/div[1]/text()[1]", "/node()[1]/text()[1]"),
        "getRelativeComponents - root disjoint");
    
    // FireDiff.Path.getElementPath
    function compareXPath(expected, element, msg, useTagNames) {
      FBTest.sysout(msg + " test element", element);
      var actual = Path.getElementPath(element, useTagNames);
      FBTest.compare(expected, actual, msg + " xpath");
      
      var actualElements = FBL.getElementsByXPath(win.document, actual);
      FBTest.compare(1, actualElements.length, msg + " elements length");
      FBTest.compare(element, actualElements[0], msg + " elements");
    }
    compareXPath(
        "/html[1]/body[1]/div[1]",
        win.document.getElementById("div1"),
        "getElementPath - div1",
        true);
    compareXPath(
        "/html[1]/body[1]/div[2]",
        win.document.getElementById("div2"),
        "getElementPath - div2",
        true);
    compareXPath(
        "/html[1]/body[1]/div[3]",
        win.document.getElementById("div3"),
        "getElementPath - div3",
        true);
    compareXPath(
        "/html[1]/body[1]/p[1]",
        win.document.getElementById("p1"),
        "getElementPath - p1",
        true);
    compareXPath(
        "/html[1]/body[1]/div[3]/div[1]",
        win.document.getElementById("nestedDiv"),
        "getElementPath - nestedDiv",
        true);
    compareXPath(
        "/html[1]/body[1]/comment()[1]",
        win.document.getElementById("div2").nextSibling,
        "getElementPath - comment",
        true);
    /* CDATA Is a comment in the rendering mode that we are currently usin.
     * TODO : Invalidate this test if necessary.
    compareXPath(
        "/html[1]/body[1]/div[3]/text()[2]",
        win.document.getElementById("nestedDiv").nextSibling,
        "getElementPath - CDATA/Text",
        true);
    */
    compareXPath(
        "/html[1]/body[1]/p[1]/text()[1]",
        win.document.getElementById("p1").firstChild,
        "getElementPath - p1 - text1",
        true);
    compareXPath(
        "/html[1]/body[1]/p[1]/text()[2]",
        win.document.getElementById("p1").lastChild,
        "getElementPath - p1 - text2",
        true);

    compareXPath(
        "/node()[2]/node()[2]/node()[2]",
        win.document.getElementById("div1"),
        "getElementPath - div1");
    compareXPath(
        "/node()[2]/node()[2]/node()[6]",
        win.document.getElementById("div2"),
        "getElementPath - div2");
    compareXPath(
        "/node()[2]/node()[2]/node()[9]",
        win.document.getElementById("div3"),
        "getElementPath - div3");
    compareXPath(
        "/node()[2]/node()[2]/node()[4]",
        win.document.getElementById("p1"),
        "getElementPath - p1");
    compareXPath(
        "/node()[2]/node()[2]/node()[9]/node()[6]",
        win.document.getElementById("nestedDiv"),
        "getElementPath - nestedDiv");
    compareXPath(
        "/node()[2]/node()[2]/node()[7]",
        win.document.getElementById("div2").nextSibling,
        "getElementPath - comment");
    compareXPath(
        "/node()[2]/node()[2]/node()[9]/node()[7]",
        win.document.getElementById("nestedDiv").nextSibling,
        "getElementPath - CDATA/Text");
    compareXPath(
        "/node()[2]/node()[2]/node()[4]/node()[1]",
        win.document.getElementById("p1").firstChild,
        "getElementPath - p1 - text1");
    compareXPath(
        "/node()[2]/node()[2]/node()[4]/node()[3]",
        win.document.getElementById("p1").lastChild,
        "getElementPath - p1 - text2");

    // TODO : Need to design a lookup method for CSS elements. Currently this is
    // not needed, but if we allow inserting rules or diff the free edits it will
    // be

    FBTestFirebug.testDone();
  });
}
function runTest() {
  try {
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
    FBTest.compare(
        "/node()[@id='test/value']/body[1]/div[3]/text()[3]",
        Path.updateForRemove("/node()[@id='test/value']/body[1]/div[3]/text()[3]", "/node()[1]"),
        "updateForRemove: root path selector");
        
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
    FBTest.compare(
        "/node()[@id='test/value']/body[1]/div[3]/text()[3]",
        Path.updateForInsert("/node()[@id='test/value']/body[1]/div[3]/text()[3]", "/node()[1]"),
        "updateForInsert: root path selector");
    
    // FireDiff.Path.getIdentifier
    FBTestFireDiff.compareObjects(undefined, Path.getIdentifier("/"), "getIdentifier");
    FBTestFireDiff.compareObjects({tag: "body", index: undefined }, Path.getIdentifier("/html[1]/body"), "getIdentifier");
    FBTestFireDiff.compareObjects({tag: "div", index: 1 }, Path.getIdentifier("/html[1]/body[1]/div[1]"), "getIdentifier");
    FBTestFireDiff.compareObjects({tag: "text()", index: 2 }, Path.getIdentifier("/html[1]/body[1]/text()[2]"), "getIdentifier");
    FBTestFireDiff.compareObjects({tag: "test()", index: 6 }, Path.getIdentifier("/html[1]/body[1]/element[1]/item[1]/test()[6]"), "getIdentifier");
    FBTestFireDiff.compareObjects({tag: "test()", index: "@id='test/value'" }, Path.getIdentifier("/html[1]/body[1]/element[1]/item[1]/test()[@id='test/value']"), "getIdentifier path selector");
    FBTestFireDiff.compareObjects({tag: "test()", index: 1 }, Path.getIdentifier("/html[1]/body[1]/element[1]/item[@id='test/value']/test()[1]"), "getIdentifier path selector parent");
    
    // FireDiff.Path.getParentPath
    FBTest.compare("/", Path.getParentPath("/"), "getParentPath /");
    FBTest.compare("/html[1]", Path.getParentPath("/html[1]/body"), "getParentPath body");
    FBTest.compare("/html[1]/body[1]", Path.getParentPath("/html[1]/body[1]/div[1]"), "getParentPath div[1]");
    FBTest.compare("/html[1]/body[1]", Path.getParentPath("/html[1]/body[1]/text()[2]"), "getParentPath text()");
    FBTest.compare("/html[1]/body[1]/element[1]/item[1]", Path.getParentPath("/html[1]/body[1]/element[1]/item[1]/test()[6]"), "getParentPath test()");
    FBTest.compare("/html[1]/body[1]", Path.getParentPath("/html[1]/body[1]/div[@id='test/value']"), "getParentPath path selector child");
    FBTest.compare("/html[1]/body[@id='test/value']", Path.getParentPath("/html[1]/body[@id='test/value']/div[1]"), "getParentPath path selector parent");
    
    // FireDiff.Path.getTopPath
    FBTest.compare("/", Path.getTopPath("/"), "getTopPath /");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]"), "getTopPath html");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body"), "getTopPath body");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body[1]/div[1]"), "getTopPath div[1]");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body[1]/text()[2]"), "getTopPath text()");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body[1]/element[1]/item[1]/test()[6]"), "getTopPath test()");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body[1]/div[@id='test/value']"), "getTopPath path selector child");
    FBTest.compare("/html[1]", Path.getTopPath("/html[1]/body[@id='test/value']/div[1]"), "getTopPath path selector parent");
    FBTest.compare("", Path.getTopPath(""), "getTopPath blank");
    FBTest.compare("body", Path.getTopPath("body"), "getTopPath body");
    FBTest.compare("body[1]", Path.getTopPath("body[1]/div[@id='test/value']"), "getTopPath path selector child");
    FBTest.compare("body[@id='test/value']", Path.getTopPath("body[@id='test/value']/div[1]"), "getTopPath path selector parent");

    // FireDiff.Path.getTopPath
    FBTest.compare(true, Path.isNextSibling("/node()[1]/node()[1]", "/node()[1]/node()[2]"), "isNextSibling sibling");
    FBTest.compare(false, Path.isNextSibling("/node()[1]/node()[2]", "/node()[1]/node()[1]"), "isNextSibling reverse sibling");
    FBTest.compare(false, Path.isNextSibling("/node()[1]", "/node()[1]/node()[2]"), "isNextSibling parent");
    FBTest.compare(false, Path.isNextSibling("/node()[1]/node()[2]", "/node()[1]"), "isNextSibling child");
    FBTest.compare(false, Path.isNextSibling("/html[1]/body[1]/div[@id='test/value']", "/html[1]/body[1]/div[2]"), "isNextSibling id");
    
    // FireDiff.Path.getRelativeComponents
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", left: "", right: "" },
        Path.getRelativeComponents("/html[1]", "/html[1]"),
        "getRelativeComponents - ID");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", left: "", right: "div[1]" },
        Path.getRelativeComponents("/html[1]", "/html[1]/div[1]"),
        "getRelativeComponents - child");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", left: "", right: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]", "/html[1]/div[1]/text()[1]"),
        "getRelativeComponents - grandchild");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", left: "text()[1]", right: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/text()[1]", "/html[1]/div[1]/text()[1]"),
        "getRelativeComponents - nephew");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", right: "", left: "div[1]" },
        Path.getRelativeComponents("/html[1]/div[1]", "/html[1]"),
        "getRelativeComponents - parent");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", right: "", left: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/div[1]/text()[1]", "/html[1]"),
        "getRelativeComponents - grandparent");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", right: "text()[1]", left: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/div[1]/text()[1]", "/html[1]/text()[1]"),
        "getRelativeComponents - nephew");
    FBTestFireDiff.compareObjects(
        { common: "/", right: "html[1]/text()[1]", left: "html[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("/html[2]/div[1]/text()[1]", "/html[1]/text()[1]"),
        "getRelativeComponents - root disjoint");
    FBTestFireDiff.compareObjects(
        { common: "", right: "html[1]/text()[1]", left: "html[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("html[2]/div[1]/text()[1]", "html[1]/text()[1]"),
        "getRelativeComponents - complete disjoint");
    FBTestFireDiff.compareObjects(
        { common: "/", right: "node()[1]/text()[1]", left: "node()[2]/div[1]/text()[1]" },
        Path.getRelativeComponents("/node()[2]/div[1]/text()[1]", "/node()[1]/text()[1]"),
        "getRelativeComponents - root disjoint");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]/text()[@id='test/value']", left: "text()[1]", right: "div[1]/text()[1]" },
        Path.getRelativeComponents("/html[1]/text()[@id='test/value']/text()[1]", "/html[1]/text()[@id='test/value']/div[1]/text()[1]"),
        "getRelativeComponents - nephew path lookup");
    FBTestFireDiff.compareObjects(
        { common: "/html[1]", left: "text()[@id='test/value']", right: "text()[@id='test/value2']" },
        Path.getRelativeComponents("/html[1]/text()[@id='test/value']", "/html[1]/text()[@id='test/value2']"),
        "getRelativeComponents - sibling path lookup");
    
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

    compareXPath(
        "/",
        win.document,
        "getElementPath - document",
        true);
    compareXPath(
        "/",
        win.document,
        "getElementPath - document");

    FBTest.compare(-1, Path.compareXPaths("/", "/node()[1]"), "Child path");
    FBTest.compare(0, Path.compareXPaths("/node()[1]", "/node()[1]"), "Identity");
    FBTest.compare(1, Path.compareXPaths("/node()[1]", "/"), "Parent path path");
    FBTest.compare(-1, Path.compareXPaths("/node()[6]", "/node()[11]"), "Numeric sort");
    FBTest.compare(1, Path.compareXPaths("/node()[11]", "/node()[6]"), "Numeric sort");
    
    FBTestFirebug.testDone();
  });
  } catch (err) { FBTrace.sysout(err, err); }
}
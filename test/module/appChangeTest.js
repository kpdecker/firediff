function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events;
  
  function compareChange(subType, change, type) {
    FBTest.compare(change.changeSource, Events.ChangeSource.APP_CHANGE, "Change source: " + change.changeSource);
    FBTest.compare(change.changeType, type || "DOM", "Change type: " + change.changeType);
    FBTest.compare(change.subType, subType, "Sub type: " + change.subType);
  }

  var tests = [
    {
      name: "textModified_innerHTML",
      execute: function(win) {
        var textModified = win.document.getElementById("textModified");
        textModified.innerHTML = "New Value";
      },
      verify: function(win, number, change) {
        compareChange(number ? "dom_inserted" : "dom_removed", change);
      },
      eventCount: 2
    },
    {
      name: "textModified_appendData",
      execute: function(win) {
        var textModified = win.document.getElementById("textModified");
        textModified.firstChild.appendData("More Data");
      },
      verify: function(win, number,change) {
        compareChange("char_data_modified", change);
      },
      eventCount: 1
    },
    {
      name: "attrModified_assign",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.align = "right";
      },
      verify: function(win, number, change) {
        compareChange("attr_changed", change);
        FBTest.ok(change.isAddition(), "change.isAddition");
        FBTest.ok(!change.isRemoval(), "!change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "attrModified_setAttr",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.setAttribute("align", "left");
      },
      verify: function(win, number, change) {
        compareChange("attr_changed", change);
        FBTest.ok(!change.isAddition(), "!change.isAddition");
        FBTest.ok(!change.isRemoval(), "!change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "attrModified_remove",
      execute: function(win) {
        var attrModified = win.document.getElementById("attrModified");
        attrModified.removeAttribute("align");
      },
      verify: function(win, number, change) {
        compareChange("attr_changed", change);
        FBTest.ok(!change.isAddition(), "!change.isAddition");
        FBTest.ok(change.isRemoval(), "change.isRemoval");
      },
      eventCount: 1
    },
    {
      name: "insertNode",
      execute: function(win) {
        var insertNode = win.document.getElementById("insertNode");
        var p = document.createElement("p");
        p.setAttribute("align", "left");
        insertNode.appendChild(p);
      },
      verify: function(win, number, change) {
        compareChange("dom_inserted", change);
      },
      eventCount: 1
    },
    {
      name: "insertNode_innerHTML",
      execute: function(win) {
        var insertNodeHtml = win.document.getElementById("insertNode_innerHTML");
        insertNodeHtml.innerHTML = "<p>test</p>";
      },
      verify: function(win, number, change) {
        compareChange("dom_inserted", change);
      },
      eventCount: 1
    },
    {
      name: "removeNode",
      execute: function(win) {
        var removeNode = win.document.getElementById("removeNode").getElementsByTagName("p")[0];
        removeNode.parentNode.removeChild(removeNode);
        removeNode.setAttribute("class", "testClass");
      },
      verify: function(win, number, change) {
        compareChange("dom_removed", change);
      },
      eventCount: 1
    },
    {
      name: "removeNode_innerHTML",
      execute: function(win) {
        var removeNodeHtml = win.document.getElementById("removeNode_innerHTML");
        var removeNode = removeNodeHtml.getElementsByTagName("p")[0];
        removeNodeHtml.innerHTML = "";

        removeNode.setAttribute("class", "testClass");
      },
      verify: function(win, number, change) {
        compareChange("dom_removed", change);
      },
      eventCount: 3
    }
  ];


  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "module/index.htm", function(win) {
    FBTestFirebug.openFirebug();
    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFireDiff.executeModuleTests(tests, win);
        });
  });
}
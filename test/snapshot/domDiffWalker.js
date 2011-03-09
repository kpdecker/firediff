function runTest() {
  var Reps = FBTest.FirebugWindow.FireDiff.reps,
      Search = FBTest.FirebugWindow.FireDiff.search,
      Firebug = FBTest.FirebugWindow.Firebug,
      FBTrace = FBTest.FirebugWindow.FBTrace;
  var htmlPanel, cssPanel;
  FBTestFirebug.enableAllPanels();
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "snapshot/domDiffWalker.htm", function(win) {
    // TODO : Test coverage for iframes
    FBTestFirebug.openFirebug();

    var textModified = win.document.getElementById("textModified");
    textModified.innerHTML = "New Value";
    textModified.firstChild.appendData("More Data");

    var attrModified = win.document.getElementById("attrModified");
    attrModified.align = "right";
    attrModified.removeAttribute("align");
    attrModified.removeAttribute("style");

    var insertNode = win.document.getElementById("insertNode");
    var p = win.document.createElement("p");
    insertNode.appendChild(p);
    p.setAttribute("align", "left");

    var removeNode = win.document.getElementById("removeNode");
    removeNode.removeChild(removeNode.getElementsByTagName("p")[0]);
    removeNode.removeChild(removeNode.getElementsByTagName("p")[0]);
    removeNode.removeChild(removeNode.getElementsByTagName("p")[0]);

    var expected = [
      { nodeType: Node.DOCUMENT_NODE },
      { nodeType: Node.DOCUMENT_TYPE_NODE },
      { tagName: "HTML" },
      { tagName: "HEAD" },
      { nodeValue: "\n" },
      { tagName: "TITLE" },
      { nodeValue: "Firediff Test" },
      { nodeValue: "\n" },
      { tagName: "BODY" },
      { nodeValue: "\n  " },
      { tagName: "DIV" },
      { localName: "id", nodeValue: "insertNode" },
      { tagName: "P" },
      { localName: "align", nodeValue: "left" },
      { nodeValue: "\n  " },
      { tagName: "DIV" },
      { localName: "id", nodeValue: "attrModified" },
      { localName: "style", nodeValue: "display: block;",  // TODO : Provide a unified access method
        test: function(node) {
          return node.change
              && node.change.isRemoval()
              && node.change.previousValue == "display: block;";
        }
      },
      { nodeValue: "\n    Text Value\n  " },
      { nodeValue: "\n  " },
      { tagName: "DIV" },
      { localName: "id", nodeValue: "textModified" },
      { subType: "dom_removed", previousValue: "\n    Text Value\n  " },
      { subType: "dom_inserted", value: "New ValueMore Data" },
      { nodeValue: "\n  " },
      { tagName: "DIV" },
      { localName: "id", nodeValue: "removeNode" },
      { nodeValue: "\n    "},
      { subType: "dom_removed",
        test: function(node) {
          return node.clone
              && node.clone.tagName == "P";
          }
      },
      { localName: "id", nodeValue: "remove1" },
      { nodeValue: "Test" },
      { subType: "dom_removed",
        test: function(node) {
          return node.clone
              && node.clone.tagName == "P";
          }
      },
      { localName: "id", nodeValue: "remove2" },
      { nodeValue: "Test" },
      { subType: "dom_removed",
        test: function(node) {
          return node.clone
              && node.clone.tagName == "P";
          }
      },
      { localName: "id", nodeValue: "remove3" },
      { nodeValue: "Test" },
      { nodeValue: "\n  " },
      { nodeValue: "\n" },
    ];
    var changes = Firebug.DiffModule.getChanges(),
        lastChange = changes[changes.length-1],
        snapshot = new Reps.DOMSnapshot(lastChange, win.document),
        domWalker = new Search.DOMDiffWalker(snapshot.displayTree);
    
    var i = 0;
    while (domWalker.nextNode()) {
      var node = domWalker.currentNode();
      var expectedNode = expected[i];
      for (var field in expectedNode) {
        if (field == "test") {
          FBTest.ok(expectedNode.test(node), "Node " + i + " test");
        } else {
          FBTest.compare(expectedNode[field], node[field], "Node " + i + " Field: " + field);
        }
      }
      if (FBTrace.DBG_FIREDIFF) { FBTrace.sysout("domDiffWalker: " + i, domWalker.currentNode()); }
      i++;
    }
    FBTest.compare(expected.length, i, "Expected entry count");
    FBTest.compare(undefined, domWalker.currentNode(), "Walker current node");

    while (domWalker.previousNode()) {
      var node = domWalker.currentNode();
      var expectedNode = expected[i-1];
      for (var field in expectedNode) {
        if (field == "test") {
          FBTest.ok(expectedNode.test(node), "Reverse Node " + (i-1) + " test");
        } else {
          FBTest.compare(expectedNode[field], node[field], "Reverse Node " + (i-1) + " Field: " + field);
        }
      }
      if (FBTrace.DBG_FIREDIFF) { FBTrace.sysout("Reverse domDiffWalker: " + (i-1), domWalker.currentNode()); }
      i--;
    }
    FBTest.compare(0, i, "Reverse Expected entry count");
    FBTest.compare(undefined, domWalker.currentNode(), "Reverse walker current node");

    FBTestFirebug.testDone();
  });
}

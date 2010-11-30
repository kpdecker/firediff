function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Firebug = FBTest.FirebugWindow.Firebug,
      FBTrace = FBTest.FirebugWindow.FBTrace;
  var htmlPanel;

  function getEditor(htmlPanel, editNode) {
    return htmlPanel.localEditors[FBTest.FirebugWindow.FBL.getElementType(editNode)];
  }
  function setEditorValue(editor, value) {
    var editorInput = editor.input;
    editorInput.value = value;
    Firebug.Editor.update(true);
  }

  var tests = [
    {
      name: "newAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editNewAttribute(attrMod);
        
        var attrEditor = htmlPanel.attrEditor;
        setEditorValue(attrEditor, "style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "align");
        Firebug.Editor.tabNextEditor();
        
        setEditorValue(attrEditor, "left");
        setEditorValue(attrEditor, "right");
        Firebug.Editor.stopEditing();
      },
      eventCount: 3
    },
    {
      name: "editAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        var attrEditor = htmlPanel.attrEditor;
        
        setEditorValue(attrEditor, "left");
        
        var removeAttrMod = win.document.getElementById("removeNode");
        removeAttrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "center");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "styleAttribute",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("style", "background-color: red;");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod, true);
        htmlPanel.editAttribute(attrMod, "style");
        
        var attrEditor = htmlPanel.attrEditor;
        FBTrace.sysout("styleAttr attrEditor", attrEditor);
        setEditorValue(attrEditor, "background-color: green;");
        Firebug.Editor.stopEditing();
      },
      eventCount: 1
    },
    {
      name: "deleteAttributeValue",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        var attrEditor = htmlPanel.attrEditor;
        
        setEditorValue(attrEditor, "left");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "deleteAttributeName",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
        attrMod.removeAttribute("style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.editAttribute(attrMod, "align");
        
        Firebug.Editor.tabPreviousEditor();
        var attrEditor = htmlPanel.attrEditor;
        setEditorValue(attrEditor, "style");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(attrEditor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "deleteAttributeMethod",
      setup: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        attrMod.setAttribute("align", "right");
      },
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        htmlPanel.deleteAttribute(attrMod, "align");
      },
      eventCount: 1
    },
    {
      name: "deleteNode",
      execute: function(win) {
        var attrMod = win.document.getElementById("attrModified");
        htmlPanel.select(attrMod);
        Firebug.HTMLModule.deleteNode(attrMod, htmlPanel.context);
      },
      eventCount: 1
    },
    {
      name: "editTextNode",
      setup: function(win) {
        var textMod = win.document.getElementById("textModified");
        textMod.innerHTML = "Text Value";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var textMod = win.document.getElementById("textModified");
        htmlPanel.select(textMod);
        
        var nodeBox = htmlPanel.ioBox.findObjectBox(textMod);
        var textNodeBox = nodeBox.getElementsByClassName("nodeText")[0];
        
        Firebug.Editor.startEditing(textNodeBox, textNodeBox.textContent);
        var textEditor = htmlPanel.textNodeEditor;
        setEditorValue(textEditor, "test");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "test2");
        Firebug.Editor.stopEditing();
      },
      eventCount: 3
    },
    {
      name: "editTextNode_remove",
      setup: function(win) {
        var textMod = win.document.getElementById("textModified");
        textMod.innerHTML = "Text Value";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var textMod = win.document.getElementById("textModified");
        htmlPanel.select(textMod);
        
        var nodeBox = htmlPanel.ioBox.findObjectBox(textMod);
        var textNodeBox = nodeBox.getElementsByClassName("nodeText")[0];
        
        Firebug.Editor.startEditing(textNodeBox, textNodeBox.textContent);
        var textEditor = htmlPanel.textNodeEditor;
        setEditorValue(textEditor, "test");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "editNode_self",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<div id=\"insertNode\"><p>test2</p></div>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "<div id=\"insertNode\"><p>test3</p></div>");
        Firebug.Editor.stopEditing();
      },
      eventCount: 3
    },
    {
      name: "editNode_sibling",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test2</p></div><p>after</p>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test3</p></div><p>after</p>");
        Firebug.Editor.stopEditing();
      },
      eventCount: 5
    },
    {
      name: "editNode_delete",
      setup: function(win) {
        var editNode = win.document.getElementById("insertNode");
        editNode.innerHTML = "<p>test</p>";
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "center");
      },
      execute: function(win) {
        // Force a page refresh as the style attribute change is not always picked up
        htmlPanel.select(document.createElement("div"));

        var editNode = win.document.getElementById("insertNode");
        htmlPanel.select(editNode);
        htmlPanel.toggleEditing();
        
        var textEditor = getEditor(htmlPanel, editNode);
        setEditorValue(textEditor, "<p>before</p><div id=\"insertNode\"><p>test2</p></div>");
        
        var attrMod = win.document.getElementById("removeNode");
        attrMod.setAttribute("align", "left");
        
        setEditorValue(textEditor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 3
    },
  ];

  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "snapshot/index.htm", function(win) {
    FBTestFirebug.openFirebug();
    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFirebug.selectPanel("html");
          htmlPanel = FBTestFirebug.getSelectedPanel();

          var textModified = win.document.getElementById("textModified");
          textModified.innerHTML = "New Value";
          textModified.firstChild.appendData("More Data");

          var attrModified = win.document.getElementById("attrModified");
          attrModified.align = "right";
          attrModified.setAttribute("align", "left");
          attrModified.removeAttribute("align");

          var insertNode = win.document.getElementById("insertNode");
          var p = document.createElement("p");
          p.setAttribute("align", "left");
          insertNode.appendChild(p);

          var insertNodeHtml = win.document.getElementById("insertNode_innerHTML");
          insertNodeHtml.innerHTML = "<p>test</p>";

          var removeNode = win.document.getElementById("removeNode").getElementsByTagName("p")[0];
          removeNode.parentNode.removeChild(removeNode);
          removeNode.setAttribute("class", "testClass");

          var removeNodeHtml = win.document.getElementById("removeNode_innerHTML");
          var removeNode = removeNodeHtml.getElementsByTagName("p")[0];
          removeNodeHtml.innerHTML = "";

          FBTestFireDiff.executeModuleTests(tests, win,
              function() {
                var Format = {};
                Components.utils.import("resource://fireformat/formatters.jsm", Format);

                FBTestFirebug.selectPanel("firediff");
                var diffPanel = FBTestFirebug.getSelectedPanel(),
                    formatter = Format.Formatters.getFormatter("com.incaseofstairs.fireformatHTMLFormatter"),
                    doc = win.document,
                    changes = diffPanel.context.diffContext.changes;

                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[changes.length-1], diffPanel.context);
                    },
                    "snapshot/domChange_-1.html",
                    "-1 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[changes.length-1], diffPanel.context);
                    },
                    "snapshot/domChange_-1.diff",
                    "-1 Diff");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[changes.length-4], diffPanel.context);
                    },
                    "snapshot/domChange_-4.html",
                    "-4 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[changes.length-4], diffPanel.context);
                    },
                    "snapshot/domChange_-4.diff",
                    "-4 Diff");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[0], diffPanel.context);
                    },
                    "snapshot/domChange_0.html",
                    "0 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[0], diffPanel.context);
                    },
                    "snapshot/domChange_0.diff",
                    "0 Diff");

                Firebug.DiffModule.revertChange(changes[changes.length-3], diffPanel.context, true);
                FBTestFireDiff.verifyFile(
                    "snapshot/domChange_revert-4.html",
                    formatter.format(doc),
                    "Verify Revert - -4");

                Firebug.DiffModule.revertChange(changes[0], diffPanel.context, true);
                FBTestFireDiff.verifyFile(
                    "snapshot/domChange_revert0.html",
                    formatter.format(doc),
                    "Verify Revert - 0");

                FBTestFirebug.testDone();
              });
        });
  });
}
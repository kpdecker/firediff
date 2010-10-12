function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
      Firebug = FBTest.FirebugWindow.Firebug,
      FBTrace = FBTest.FirebugWindow.FBTrace;

  var listener = {
    onDiffChange: function(change) {
      FBTest.fail("Change event occurred");
      testDone();
    }
  };
  FBTest.FirebugWindow.Firebug.DiffModule.addListener(listener);

  function setEditorValue(editor, value) {
    var editorInput = editor.input;
    editorInput.value = value;
    Firebug.Editor.update(true);
  }
  function testDone() {
    FBTest.FirebugWindow.Firebug.DiffModule.removeListener(listener);
    FBTestFirebug.testDone();
  }

  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "module/index.htm", function(win) {
    FBTestFirebug.openFirebug();
    FBTestFireDiff.enableDiffPanel(
        function() {
          // Simple action to make sure that the context is cleared on disable
          var insertNode = win.document.getElementById("insertNode");
          var p = document.createElement("p");
          p.setAttribute("align", "left");
          insertNode.appendChild(p);
          FBTest.compare(1, Firebug.DiffModule.getChanges().length, "Enabled Expected number of events");

          FBTestFireDiff.disableDiffPanel(
              function() {
                FBTest.compare(0, Firebug.DiffModule.getChanges().length, "Disabled Expected number of events");

                // App Changes
                var insertNode = win.document.getElementById("insertNode");
                var p = document.createElement("p");
                p.setAttribute("align", "left");
                insertNode.appendChild(p);
                
                // HTML Panel Editor
                FBTestFirebug.selectPanel("html");
                var htmlPanel = FBTestFirebug.getSelectedPanel();
                var attrMod = win.document.getElementById("attrModified");
                htmlPanel.select(attrMod);
                htmlPanel.editNewAttribute(attrMod);
                
                var attrEditor = htmlPanel.attrEditor;
                setEditorValue(attrEditor, "style");
                
                var removeNode = win.document.getElementById("removeNode");
                removeNode.setAttribute("align", "left");
                
                setEditorValue(attrEditor, "align");
                Firebug.Editor.tabNextEditor();
                
                setEditorValue(attrEditor, "left");
                setEditorValue(attrEditor, "right");
                Firebug.Editor.stopEditing();
                
                // Stylesheet Panel Editor
                FBTestFirebug.selectPanel("stylesheet");
                var cssPanel = FBTestFirebug.getSelectedPanel();
                cssPanel.select();
                var panelNode = cssPanel.panelNode;
                var rule = panelNode.getElementsByClassName("cssRule")[0];
                
                cssPanel.insertPropertyRow(rule);
                
                var editor = cssPanel.editor;
                setEditorValue(editor, "whitespace");
                setEditorValue(editor, "display");
                Firebug.Editor.tabNextEditor();
                
                setEditorValue(editor, "inline");
                setEditorValue(editor, "block");
                Firebug.Editor.stopEditing();

                setTimeout(function() {
                  FBTest.compare(0, Firebug.DiffModule.getChanges().length, "Disabled Actions Expected number of events");
                  testDone();
                }, 100);
              });
        });
  });
}
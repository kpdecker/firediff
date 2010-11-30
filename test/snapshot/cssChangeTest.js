function runTest() {
  var Events = FBTest.FirebugWindow.FireDiff.events,
    Firebug = FBTest.FirebugWindow.Firebug,
    FBTrace = FBTest.FirebugWindow.FBTrace;
  var cssPanel;
  
  function setEditorValue(editor, value) {
    var editorInput = editor.input;
    editorInput.value = value;
    Firebug.Editor.update(true);
  }
  function resetCSS(win, inline) {
    var style = win.document.getElementsByTagName(inline ? "style" : "link")[0];
    cssPanel.navigate(style.sheet);
  }
  function resetInlineCSS(win) {
    resetCSS(win, true);
  }
  
  var tests = [
    {
      name: "newProperty",
      setup: resetCSS,
      execute: function(win) {
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
      },
      eventCount: 1
    },
    {
      name: "editProperty",
      setup: resetCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropValue")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "yellow");
        setEditorValue(editor, "blue !important");
        Firebug.Editor.stopEditing();
      },
      eventCount: 1
    },
    {
      name: "renameProperty",
      setup: resetCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropName")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "border-color");
        setEditorValue(editor, "color");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "deleteProperty_name",
      setup: resetCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssPropName")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.editor;
        setEditorValue(editor, "border-color");
        setEditorValue(editor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 1
    },
    {
      name: "disableProperty",
      setup: resetCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssProp")[0];
        
        cssPanel.disablePropertyRow(rule);
        cssPanel.disablePropertyRow(rule);
      },
      eventCount: 2
    },
    {
      name: "deleteProperty_menu",
      setup: resetCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssProp")[0];
        
        cssPanel.deletePropertyRow(rule);
      },
      eventCount: 1
    },

    {
      name: "newRule",
      setup: resetInlineCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var sheet = panelNode.getElementsByClassName("cssSheet")[0];
        
        cssPanel.insertRule(sheet);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "div");
        setEditorValue(editor, "*");
        Firebug.Editor.stopEditing();
      },
      eventCount: 1
    },
    {
      name: "editRule",
      setup: resetInlineCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssSelector")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "div");
        setEditorValue(editor, "#yellow");
        Firebug.Editor.stopEditing();
      },
      eventCount: 2
    },
    {
      name: "deleteRule",
      setup: resetInlineCSS,
      execute: function(win) {
        var panelNode = cssPanel.panelNode;
        var rule = panelNode.getElementsByClassName("cssSelector")[0];
        
        Firebug.Editor.startEditing(rule, rule.textContent);
        
        var editor = cssPanel.ruleEditor;
        setEditorValue(editor, "border-color");
        setEditorValue(editor, "");
        Firebug.Editor.stopEditing();
      },
      eventCount: 1
    }
  ];
  
  var urlBase = FBTest.getHTTPURLBase();
  FBTestFirebug.openNewTab(urlBase + "snapshot/index.htm", function(win) {
    FBTestFirebug.openFirebug();

    FBTestFireDiff.enableDiffPanel(
        function() {
          FBTestFirebug.selectPanel("stylesheet");
          cssPanel = FBTestFirebug.getSelectedPanel();
          cssPanel.select();
          
          FBTestFireDiff.executeModuleTests(tests, win,
              function() {
                var Format = {};
                Components.utils.import("resource://fireformat/formatters.jsm", Format);

                FBTestFirebug.selectPanel("firediff");
                var diffPanel = FBTestFirebug.getSelectedPanel(),
                    formatter = Format.Formatters.getFormatter("com.incaseofstairs.fireformatCSSFormatter"),
                    doc = win.document,
                    changes = diffPanel.context.diffContext.changes;

                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[changes.length-1], diffPanel.context);
                    },
                    "snapshot/cssChange_-1.css",
                    "-1 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[changes.length-1], diffPanel.context);
                    },
                    "snapshot/cssChange_-1.diff",
                    "-1 Diff");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[changes.length-4], diffPanel.context);
                    },
                    "snapshot/cssChange_-4.css",
                    "-4 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[changes.length-4], diffPanel.context);
                    },
                    "snapshot/cssChange_-4.diff",
                    "-4 Diff");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[changes.length-6], diffPanel.context);
                    },
                    "snapshot/cssChange_-6.css",
                    "-4 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[changes.length-6], diffPanel.context);
                    },
                    "snapshot/cssChange_-6.diff",
                    "-6 Diff");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveSnapshot(changes[0], diffPanel.context);
                    },
                    "snapshot/cssChange_0.css",
                    "0 Snapshot");
                FBTestFireDiff.fileOutTest(
                    function() {
                      diffPanel.selection.saveDiff(changes[0], diffPanel.context);
                    },
                    "snapshot/cssChange_0.diff",
                    "0 Diff");

                var secondRevert = changes[changes.length-3];

                Firebug.DiffModule.revertChange(changes[1], diffPanel.context, true);
                FBTestFireDiff.verifyFile(
                    "snapshot/cssChange_-1.css",
                    formatter.format(doc.styleSheets[1]),
                    "Verify Revert - Sheet");
                FBTestFireDiff.verifyFile(
                    "snapshot/cssChange_revert1.css",
                    formatter.format(doc.styleSheets[0]),
                    "Verify Revert - Inline");

                Firebug.DiffModule.revertChange(secondRevert, diffPanel.context, true);
                FBTestFireDiff.verifyFile(
                    "snapshot/cssChange_-4.css",
                    formatter.format(doc.styleSheets[1]),
                    "Verify Revert - Sheet");
                FBTestFireDiff.verifyFile(
                    "snapshot/cssChange_revert1.css",
                    formatter.format(doc.styleSheets[0]),
                    "Verify Revert - Inline");

                Firebug.DiffModule.revertChange(changes[0], diffPanel.context, true);
                FBTestFireDiff.verifyFile(
                    "snapshot/cssChange_-4.css",
                    formatter.format(doc.styleSheets[1]),
                    "Verify Revert - Sheet");
                FBTestFireDiff.verifyFile(
                    "snapshot/external.css",
                    formatter.format(doc.styleSheets[0]),
                    "Verify Revert - Inline");

                FBTestFirebug.testDone();
              });
        });
  });
}
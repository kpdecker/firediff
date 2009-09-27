function runTest() {
  var urlBase = FBTest.getHTTPURLBase();
  var Formatter = FBTest.FirebugWindow.FireDiff.formatter,
      FBTrace = FBTest.FirebugWindow.FBTrace;
  
  FBTest.loadScript("FBTestFireDiff.js", this);
  FBTestFirebug.openNewTab(urlBase + "formatter/index.htm", function(win) {
    var doc = win.document;

    var expected = '@charset "ISO-8859-1";\n'
      + '@import url("import.css");\n'
      + '@import url("import.css");\n'
      + '\n'
      + '@font-face {\n'
      + '  font-family: "Robson Celtic";\n'
      + '  src: url("http://site/fonts/rob-celt");\n'
      + '}\n'
      + '\n'
      + '@media tv, print {\n'
      + '  #div2 {\n'
      + '    overflow: hidden;\n'
      + '  }\n'
      + '  \n'
      + '  #div3 {\n'
      + '    overflow: hidden;\n'
      + '  }\n'
      + '}\n'
      + '\n'
      + '@media screen {\n'
      + '  #div2 {\n'
      + '    overflow: visible;\n'
      + '  }\n'
      + '}\n'
      + '\n'
      + '#div2 {\n'
      + '  font-weight: bold;\n'
      + '  color: green;\n'
      + '}\n'
    var writer = new Formatter.Writer("  ");
    var cssFormatter = new Formatter.CSSFormatter(writer);
    cssFormatter.printSheet(doc.styleSheets[0]);
    FBTrace.sysout("cssFormatter", writer.toString());
    FBTest.compare(expected, writer.toString(), "Formatter value");

    FBTestFirebug.testDone();
  });
}
(function() {
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const ScriptableInputStream = Cc["@mozilla.org/scriptableinputstream;1"];
  const nsIScriptableInputStream = Ci.nsIScriptableInputStream;

  const ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService)

  const DiffModule = FBTest.FirebugWindow.Firebug.DiffModule,
        FireDiff = FBTest.FirebugWindow.FireDiff,
        FBTrace = FBTest.FirebugWindow.FBTrace;

  FBTestFireDiff = {
    isFirefox30: function() {
      return navigator.userAgent.indexOf("Firefox/3.0") >= 0;
    },

    enableDiffPanel: function(callback) {
        FBTestFirebug.setPanelState(FW.Firebug.DiffModule, "firediff", callback, true);
    },
    disableDiffPanel: function(callback) {
        FBTestFirebug.setPanelState(FW.Firebug.DiffModule, "firediff", callback, false);
    },

    compareChangeList: function(expected, actual, msg) {
      FBTest.FirebugWindow.FBTrace.sysout(msg);
      FBTest.compare(expected.length, actual.length, msg + " length");
      for (var i = 0; i < actual.length; i++) {
        this.compareObjects(
            expected[i],
            actual[i],
            msg + " value " + i,
            {date: true});
      }
    },
    
    compareObjects: function(expected, actual, msg, excluded) {
      var tested = {};
      excluded = excluded || {};
      
      if (expected) {
        for (var i in expected) {
          if (i in excluded || (typeof expected[i] == "function"))    continue;
          
          tested[i] = true;
          
          if (expected[i] && expected[i].isEqualNode) {
            var equal = actual[i] && expected[i].isEqualNode(actual[i]);
            FBTest.ok(equal, msg + " " + i);
            if (!equal) {
              FBTest.sysout(msg + " " + i + " expected", expected[i]);
              FBTest.sysout(msg + " " + i + " actual", actual[i]);
            }
          } else if (expected[i] && expected[i].equals) {
            var equal = actual[i] && expected[i].equals(actual[i]);
            FBTest.ok(equal, msg + " " + i);
            if (!equal) {
              FBTest.sysout(msg + " " + i + " expected", expected[i]);
              FBTest.sysout(msg + " " + i + " actual", actual[i]);
            }
          } else {
            FBTest.compare(expected[i], actual && actual[i], msg + " " + i);
          }
        }
      }
      if (actual) {
        for (var i in actual) {
          // These are all errors, but run through compare anyway
          if (!(i in excluded) && !tested[i] && !(typeof actual[i] == "function")) {
            FBTest.compare(expected && expected[i], actual[i], msg + " " + i);
          }
        }
      }
    },
    
    executeModuleTests: function(tests, win, finalizer) {
      var running = true, setup = false;
      var curTest = -1;
      var changeNum = 0;
      var timeout;
      
      var listener = {
        onDiffChange: cleanupWrapper(function(change) {
          if (timeout) {
            clearTimeout(timeout);  timeout = undefined;
          }
          if (!running || setup) {
            return;
          }
          
          if (tests[curTest].verify) {
            tests[curTest].verify(win, changeNum, change);
          }
          
          changeNum++;
          if (tests[curTest].eventCount == changeNum) {
            tests[curTest].verified = true;
            setCatchTimeout(executeTest, 0);
          } else if (tests[curTest].eventCount < changeNum) {
            FBTest.compare(tests[curTest].eventCount, changeNum, "Unexpected number of events");
          } else {
            timeout = setCatchTimeout(cancelTest, 5000);
          }
        })
      };
      FBTest.FirebugWindow.Firebug.DiffModule.addListener(listener);
      function testDone(err) {
        FBTest.progress("Module tests done");
        FBTest.FirebugWindow.Firebug.DiffModule.removeListener(listener);
        if (finalizer && !err) {
          finalizer();
        } else {
          FBTestFirebug.testDone();
        }
      }
      function cleanupWrapper(exec) {
        return function() {
          try {
            return exec.apply(this, arguments);
          } catch (exc) {
            FBTest.FirebugWindow.FBTrace.sysout("runTest FAILS "+exc, exc);
            FBTest.ok(false, "runTest FAILS "+exc);
            testDone(exc);
          }
        };
      }
      function setCatchTimeout(exec, timeout) {
        return setTimeout(cleanupWrapper(exec), timeout);
      }
      
      function cancelTest() {
        running = false;
        FBTest.ok(false, "Did not recieve all expected events for " + tests[curTest].name);
        testDone();
      }
      
      function executeTest() {
        changeNum = 0;
        curTest++;
        FBTest.progress("Execute Test: " + (tests[curTest] || {name:""}).name);
        FBTest.FirebugWindow.FBTrace.sysout("Execute Test: " + (tests[curTest] || {name:""}).name, tests[curTest]);
        if (curTest < tests.length) {
          if (tests[curTest].setup) {
            setup = true;
            tests[curTest].setup(win);
            setup = false;
          }
          
          tests[curTest].execute(win);
          if (!tests[curTest].verified) {
            timeout = setCatchTimeout(cancelTest, 5000);
          }
        } else {
          testDone();
        }
      }
      
      cleanupWrapper(executeTest)();
    },

    fileOutTest: function(execCallback, verifyPath, msg) {
      var DiffMonitor = FBTestFirebug.getPanel("firediff"),
          originalPickFile = FireDiff.FileIO.promptForFileName,
          originalWriteString = FireDiff.FileIO.writeString,
          run = false,
          self = this;
      try {
        FireDiff.FileIO.promptForFileName = function() {
          return "testFile";
        };
        FireDiff.FileIO.writeString = function(file, text) {
          self.verifyFile(verifyPath, text, msg + " - Output");
          run = true;
        };
        execCallback();

        FBTest.ok(run, msg + " - Write string run");
      } finally {
          FireDiff.FileIO.promptForFileName = originalPickFile;
          FireDiff.FileIO.writeString = originalWriteString;
      }
    },
    
    verifyFile: function(verifyPath, text, msg) {
      var channel = ios.newChannel(verifyPath, null, ios.newURI(FBTest.getHTTPURLBase(), null, null)),
          istream = channel.open();

      var scriptStream = ScriptableInputStream.createInstance(nsIScriptableInputStream); 
      scriptStream.init(istream);
      var fileContent = "",
          len;
      while ((len = scriptStream.available())) {
        fileContent += scriptStream.read(len);
      }
      scriptStream.close();
      istream.close();

      FBTest.compare(fileContent, text, msg);
    }
  };
})();
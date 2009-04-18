(function() {
  FBTestFireDiff = {
    compareChangeList: function(expected, actual, msg) {
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
      // TODO : Update to use compareNode for any node elements
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
    
    executeModuleTests: function(tests, win) {
      var running = true, setup = false;
      var curTest = -1;
      var changeNum = 0;
      var timeout;
      
      var listener = {
        onDiffChange: function(change) {
          if (timeout) {
            clearTimeout(timeout);  timeout = undefined;
          }
          if (!running || setup) {
            return;
          }
          
          tests[curTest].verify(win, changeNum, change);
          
          changeNum++;
          if (tests[curTest].eventCount == changeNum) {
            tests[curTest].verified = true;
            setTimeout(executeTest, 0);
          } else if (tests[curTest].eventCount < changeNum) {
            FBTest.compare(changeNum, tests[curTest].eventCount, "Unexpected number of events");
          } else {
            timeout = setTimeout(cancelTest, 5000);
          }
        }
      };
      FBTest.FirebugWindow.Firebug.DiffModule.addListener(listener);
      function testDone() {
        FBTest.progress("Module tests done");
        FBTest.FirebugWindow.Firebug.DiffModule.removeListener(listener);
        FBTestFirebug.testDone();
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
        FBTest.FirebugWindow.FBTrace.sysout("Execute Test: " + (tests[curTest] || {name:""}).name);
        if (curTest < tests.length) {
          if (tests[curTest].setup) {
            setup = true;
            tests[curTest].setup(win);
            setup = false;
          }
          
          tests[curTest].execute(win);
          if (!tests[curTest].verified) {
            timeout = setTimeout(cancelTest, 5000);
          }
        } else {
          testDone();
        }
      }
      
      executeTest();
    }
  };
})();
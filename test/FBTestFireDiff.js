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
    }
  };
})();
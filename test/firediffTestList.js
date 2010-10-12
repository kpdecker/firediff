testIncludes.push("FBTestFireDiff.js");

var testList = testList || [];
testList.push.apply(testList, [
    {group: "module", uri: "module/appChangeTest.js",               desc: "Diff Module: Application Generated Events" },
    {group: "module", uri: "module/domEditorTest.js",               desc: "Diff Module: DOM Editor Generated Events" },
    {group: "module", uri: "module/cssEditorTest.js",               desc: "Diff Module: CSS Editor Generated Events" },
    {group: "module", uri: "module/stylesEditorTest.js",            desc: "Diff Module: Styles Editor Generated Events" },
    {group: "module", uri: "module/disabledChangeTest.js",          desc: "Diff Module: Disabled Events" },

    {group: "lib",    uri: "lib/jsDiffTest.js",                     desc: "Lib: JS Diff" },
    {group: "lib",    uri: "lib/pathTest.js",                       desc: "Lib: Custom XPath Test" },
    {group: "lib",    uri: "lib/cssPathTest.js",                   desc: "Lib: CSS Path Test" },
    {group: "lib",    uri: "lib/cssModelTest.js",                   desc: "Lib: CSS Model Test" },

    {group: "event",  uri: "event/applyRevertTest.js",              desc: "Events: Apply Revert Test" },
    {group: "event",  uri: "event/attrMergeTest.js",                desc: "Events: Attribute Change Merge Test" },
    {group: "event",  uri: "event/charDataMergeTest.js",            desc: "Events: Char Data Change Merge Test" },
    {group: "event",  uri: "event/insertMergeTest.js",              desc: "Events: Insert Node Merge Test" },
    {group: "event",  uri: "event/removeMergeTest.js",              desc: "Events: Remove Node Merge Test" },
    {group: "event",  uri: "event/cssMergeTest.js",                 desc: "Events: CSS Merge Test" },
    {group: "event",  uri: "event/revertMergeTest.js",                desc: "Events: Revert Merge Test" },

    {group: "snapshot", uri: "snapshot/domDiffWalker.js",          desc: "Snapshot: DOM Diff Walker Test" },
    {group: "snapshot", uri: "snapshot/domChangeTest.js",          desc: "Snapshot: DOM Diff+Snapshot Test" },
    {group: "snapshot", uri: "snapshot/cssChangeTest.js",          desc: "Snapshot: CSS Diff+Snapshot Test" },

    {group: "manual", uri: "manual/manualAutomation.js",            desc: "Manual: Manual display test with scripted setup" }
]);

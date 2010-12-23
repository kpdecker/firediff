/* See license.txt for terms of usage */

FireDiff.FileIO = FBL.ns(function() {
    const DOM_MODE = "DOM",
          CSS_MODE = "CSS",
          DIFF_MODE = "diff";

    const Cc = Components.classes;
    const Ci = Components.interfaces;
    const nsIDocumentEncoder = Ci.nsIDocumentEncoder;
    const nsIFileOutputStream = Ci.nsIFileOutputStream;
    const nsIFilePicker = Ci.nsIFilePicker;
    const EncoderService = Cc["@mozilla.org/layout/documentEncoder;1?type=text/plain"];
    const FileOutputService = Cc["@mozilla.org/network/file-output-stream;1"];
    const PickerService = Cc["@mozilla.org/filepicker;1"];

    var i18n = document.getElementById("strings_firediff");

    this.DOM_MODE = DOM_MODE;
    this.CSS_MODE = CSS_MODE;
    this.DIFF_MODE = DIFF_MODE;

    this.promptForFileName = function(caption, mode) {
        var picker = PickerService.createInstance(nsIFilePicker);
        picker.init(window, caption, nsIFilePicker.modeSave);
        if (mode == DOM_MODE) {
            picker.appendFilters(nsIFilePicker.filterHTML);
            picker.defaultExtension = "html";
        } else if (mode == CSS_MODE) {
            picker.appendFilter(i18n.getString("prompt.cssFiles"), "*.css");
            picker.defaultExtension = "css";
        } else if (mode == DIFF_MODE) {
            picker.appendFilter(i18n.getString("prompt.diffFiles"), "*.diff");
            picker.defaultExtension = "diff";
        }
        picker.appendFilters(nsIFilePicker.filterText);
        picker.appendFilters(nsIFilePicker.filterAll);
        var ret = picker.show();
        if ((ret == nsIFilePicker.returnOK || ret == nsIFilePicker.returnReplace) && picker.file) {
            return picker.file;
        }
    };


    this.writeString = function(file, string) {
        var outputStream = FileOutputService.createInstance(nsIFileOutputStream);
        outputStream.init(file, -1, -1, 0);   // Default mode and permissions

        // The Document encoder handles all of the heavy lifting here: encoding and line break conversion
        var serializer = EncoderService.createInstance(nsIDocumentEncoder);
        serializer.init(document, "text/plain", nsIDocumentEncoder.OutputPreformatted);
        serializer.setCharset("UTF-8");
        serializer.setNode(document.createTextNode(string));
        serializer.encodeToStream(outputStream);

        outputStream.close();
    };
});
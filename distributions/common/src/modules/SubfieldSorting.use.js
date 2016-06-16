use("Marc");
use("MarcClasses");
use("Log");
use("StringUtil");

EXPORTED_SYMBOLS = ['SubfieldSorting'];

var SubfieldSorting = function () {
    var sortingList;
    var BUNDLE_NAME = "validation";

    /**
     * The sort function is responsible for sorting the subfield on the given field
     * The sort order is defined by the sorting attribute on the input field
     * Note that the amount of subfields in sorting and the actual amount of subfields on the field might not match
     * Any subfields not listed in the sorting list will be moved to after the subfields listed in the sorting list
     *
     * @param field - the field must include both sorting list and subfields
     *
     * Returns the field object with the subfields ordered after the sorting list
     */
    function sort(field) {
        Log.trace("Enter - SubfieldSorting.sort", field);
        try {

            var bundle = ResourceBundleFactory.getBundle(BUNDLE_NAME);

            if (field.sorting === undefined || field.sorting === null) {
                Log.debug(ResourceBundle.getString(bundle, "subfieldSorting.sort.sorting.error"));
                return field;
            }

            if (field.subfields === undefined || field.subfields === null) {
                Log.debug(ResourceBundle.getString(bundle, "subfieldSorting.sort.subfields.error"));
                return field;
            }

            sortingList = field.sorting;

            var keys = Object.keys(field.subfields);

            keys.sort(function (a, b) {
                var indexA = findIndexInSortingList(a);
                var indexB = findIndexInSortingList(b);

                return indexA - indexB;
            });

            var sortedSubfields = {};

            for (var i = 0; i < keys.length; i++) {
                sortedSubfields[keys[i]] = field.subfields[keys[i]];
            }

            field.subfields = sortedSubfields;

            return field;
        } finally {
            Log.trace("Exit -- SubfieldSorting.sort");
        }
    }


    /**
     * The sorting rules are as follow:
     * * Subfields that match the sorting list should appear in the defined sort order
     * * If a subfield name is upper case but only the lower case version is in the sort order then that field
     * should appear right before the lower case subfield
     * * A subfield name not defined in the sort order should just be moved to the end of the list
     *
     * Note: Lower value = earlier in the list
     *
     * @param arg subfield name
     * @returns the index of the subfield name
     */
    function findIndexInSortingList(arg) {
        var index;

        if (sortingList.indexOf(arg) > -1) {
            index = sortingList.indexOf(arg);
        } else if (sortingList.indexOf(arg.toLowerCase()) > -1) {
            // Upper case should be before lower case so we give it a slight nudge forward
            index = sortingList.indexOf(arg.toLowerCase()) - 0.5;
        } else if (sortingList.indexOf(arg.toUpperCase()) > -1) {
            // Reverse situation then above - lower case subfield but only upper case version found in the sort order
            // and since upper case should be before lower case we push the lower case subfield just a nudge back
            index = sortingList.indexOf(arg.toUpperCase()) + 0.5;
        } else {
            index = 999; // Not found so move to the end of the list
        }

        return index;
    }

    return {
        'BUNDLE_NAME': BUNDLE_NAME,
        'sort': sort
    }
}();

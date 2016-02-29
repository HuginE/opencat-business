//-----------------------------------------------------------------------------
use( "ClassificationData" );
use( "Log" );
use( "Marc" );
use( "Solr" );

//-----------------------------------------------------------------------------
EXPORTED_SYMBOLS = [ 'DoubleRecordFinder' ];

//-----------------------------------------------------------------------------
/**
 * Module to find double records in rawrepo for a given record.
 *
 * @namespace
 * @name DoubleRecordFinder
 */
var DoubleRecordFinder = function(  ) {
    /**
     * Finds all double record candidates for a given record.
     *
     * @param record {record}  The record to find double records for.
     * @param solrUrl {String} Url to the solr service to use.
     *
     * @return {Array} Array of objects with found records. See DefaultDoubleRecordHandler#formatMessage
     *                 for an explanation.
     *
     * @name DoubleRecordFinder#find
     */

    /**
     * Contains the value of 250a for fictional books and music
     * @type {undefined}
     */
    var field250a = undefined;
    var solrUrl = undefined;
    var materialType = { unknown:0, literature:1, technical:2 };
    var andingTogether = true;

    function find( record, callSolrUrl ) {
        Log.trace( "Enter - DoubleRecordFinder.find()", 0 );

        var result = [];
        solrUrl = callSolrUrl;
        try {
            var array = [];

            // Keep this as the first ISSN,ISBN;ISMN etc has highest priority
            array.push({
                matcher: __matchNumbers,
                searcher: __findNumbersRun,
                continueOnHit: false
            });
            // Keep Music245 and 538 grouped together
            array.push({
                matcher: __matchMusic,
                searcher: __findMusic245Run,
                continueOnHit: true
            });
            array.push({
                matcher: __matchMusic,
                searcher: __findMusic538Run,
                continueOnHit: false
            });
            // END Keep Music245 and 538 grouped together
            array.push({
                matcher: __matchTechnicalLiterature,
                searcher: __findTechnicalLiterature,
                continueOnHit: false
            });
            array.push({
                matcher: __matchSoundMovieMultimedia,
                searcher: __findSoundMovieMultimedia,
                continueOnHit: false
            });
            array.push({
                matcher: __matchFictionBookMusic,
                searcher: __findFictionBookMusicRun,
                continueOnHit: false
            });
            array.push({
                matcher: __matchComposedMaterials,
                searcher: __findComposedMaterials,
                continueOnHit: false
            });

            for (var i = 0; i < array.length; i++) {
                var findObj = array[i];

                if (findObj.matcher(record)) {
                    result = result.concat(findObj.searcher(record));
                    if ( ! findObj.continueOnHit ) {
                        return result;
                    }
                }
            }

            return result;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.find(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    //-----------------------------------------------------------------------------
    //                  ISSN,ISBN,ISMN etc
    //-----------------------------------------------------------------------------

    function __checkSubfieldExistence( field, name, subfields) {
        if (field.name === name ) {
            for (var j = 0; j < field.count(); j++) {
                var subfield = field.subfield(j);
                return subfield.name.match(subfields);
            }
        }
    }

    function __matchNumbers( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchNumbers()" );

        var result = undefined;
        var doit = false;
        try {
            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field(i);
                doit = __checkSubfieldExistence( field, "021", /[ea]/);
                if (!doit) doit = __checkSubfieldExistence( field, "022", /[a]/);
                if (!doit) doit = __checkSubfieldExistence( field, "024", /[a]/);
                if (!doit) doit = __checkSubfieldExistence( field, "028", /[a]/);
                if (!doit) doit = __checkSubfieldExistence( field, "023", /[ab]/);
                if (doit) return result = true;
            }
            return result = false;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchNumbers(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findNumbers( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findNumbersRun( record );
    }
    function __findNumbersRun( record ) {
        Log.trace("Enter - DoubleRecordFinder.__findNumbersRun()");
        var result = undefined;
        try {
            var formatters = {
                '021e': __querySubfieldFormatter,
                '021a': __querySubfieldFormatter,
                '022a': __querySubfieldFormatter,
                '024a': __querySubfieldFormatter,
                '028a': __querySubfieldFormatter,
                '023a': __querySubfieldSpecificRegister("023ab"),
                '023b': __querySubfieldSpecificRegister("023ab")
            };

            andingTogether = false;
            result = __executeQueryAndFindRecords(record, formatters);
            andingTogether = true;
            return result;
        }
        finally {
            Log.trace("Exit - DoubleRecordFinder.__findNumbersRun(): ", result !== undefined ? JSON.stringify(result) : "undef");
        }
    }

    //-----------------------------------------------------------------------------
    //                  Music
    //-----------------------------------------------------------------------------

    function __matchSoundMovieMultimedia( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchSoundMovieMultimedia()" );

        var result = undefined;
        var subfield = undefined;
        var count009a = 0;
        var count009g = 0;
        var value009g = "";
        try {
            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field(i);
                // 009 check - Possible target for moving to a function
                if (field.name === "009") {
                    for (var j = 0; j < field.count(); j++) {
                        subfield = field.subfield(j);

                        if (subfield.name === "a") {
                            count009a++;
                            if (["r", "m", "t"].indexOf(subfield.value) === -1) {
                                return false;
                            }
                        }
                    }
                    if (subfield.name === "g") {
                        count009g++;
                        value009g = subfield.value;
                    }
                }
            }

            if ( count009a > 1 || count009g > 1 ) {
                return result = false;
            }
            if (["xe"].indexOf(value009g) === -1) {
                if ( value009g[0] !== "t" ) {
                    return result = false;
                }
            }
            return result = true;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchSoundMovieMultimedia(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findSoundMovieMultimedia( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findSoundMovieMultimediaRun( record );
    }
    function __findSoundMovieMultimediaRun( record ) {
        Log.trace("Enter - DoubleRecordFinder.__findSoundMovieMultimediaRun()");
        var result = undefined;
        try {
            var formatters = {
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '245a': __querySubfieldFormatter,
                '245ø': __querySubfieldFormatter
            };

            result = __executeQueryAndFindRecords(record, formatters);
            return result;
        }
        finally {
            Log.trace("Exit - DoubleRecordFinder.__findSoundMovieMultimediaRun(): ", result !== undefined ? JSON.stringify(result) : "undef");
        }
    }


    //-----------------------------------------------------------------------------
    //                  Music
    //-----------------------------------------------------------------------------

    function __matchMusic( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchMusic()" );

        var result = undefined;
        var subfield = undefined;
        var count009a = 0;
        var found009as = false;
        try {
            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field(i);
                // 009 check - Possible target for moving to a function
                if (field.name === "009") {
                    for (var j = 0; j < field.count(); j++) {
                        subfield = field.subfield(j);

                        if (subfield.name === "a") {
                            count009a++;
                            if (["s"].indexOf(subfield.value) !== -1) {
                                found009as = true;
                            }
                        }
                    }
                }
            }

            if ( found009as  && count009a === 1 ) {
                return result = true;
            }
            return result = false;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchMusic(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findMusic245( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findMusic245Run( record );
    }
    function __findMusic245Run( record ) {
        Log.trace("Enter - DoubleRecordFinder.__findMusic245Run()");
        var result = undefined;
        try {
            var formatters = {
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '245a': __querySubfieldFormatter
            };

            result = __executeQueryAndFindRecords(record, formatters);
            return result;
        }
        finally {
            Log.trace("Exit - DoubleRecordFinder.__findMusic245Run(): ", result !== undefined ? JSON.stringify(result) : "undef");
        }
    }
    // TESTING only
    function __findMusic538( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findMusic538Run( record );
    }
    function __findMusic538Run( record ) {
        Log.trace("Enter - DoubleRecordFinder.__findMusic538Run()");
        var result = undefined;
        try {
            var formatters = {
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '538g': __querySubfieldFormatter
            };

            result = __executeQueryAndFindRecords(record, formatters);
            return result;
        }
        finally {
            Log.trace("Exit - DoubleRecordFinder.__findMusic538Run(): ", result !== undefined ? JSON.stringify(result) : "undef");
        }
    }

    //-----------------------------------------------------------------------------
    //                  Composed materials
    //-----------------------------------------------------------------------------

    function __matchComposedMaterials( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchComposedMaterials()" );

        var result = undefined;
        var subfield = undefined;
        var count009a = 0;
        var found009av = false;
        try {
            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field(i);
                // 009 check - Possible target for moving to a function
                if (field.name === "009") {
                    for (var j = 0; j < field.count(); j++) {
                        subfield = field.subfield(j);

                        if (subfield.name === "a") {
                            count009a++;
                            if (["v"].indexOf(subfield.value) !== -1) {
                                found009av = true;
                            }
                        }
                    }
                }

                if (field.name === "250") {
                    for (var k = 0; k < field.count(); k++) {
                        subfield = field.subfield(k);
                        if (subfield.name === "a") {
                            field250a = subfield.value;
                        }
                    }
                }
            }

            // Conditions - (count009a > 1 and content != v) OR ( count009a == 1 and content == v ) then found
            if ( found009av ) {
                return result = count009a == 1;
            } else {
                return result = count009a > 1;
            }
            return result = false;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchComposedMaterials(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findComposedMaterials( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findComposedMaterialsRun( record );
    }
    function __findComposedMaterialsRun( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__findComposeMaterialsRun()" );
        var result = undefined;
        var normalized250a = undefined;
        try {
            var formatters = {
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '245a': __querySubfieldValueLengthFormatter( 20 ),
                '260b': __querySubfieldValueLengthFormatter( 2 )
            };

            result = __executeQueryAndFindRecords( record, formatters );
            if ( field250a !== undefined ) {
                normalized250a = Solr.analyse( solrUrl, field250a, "match.field250a" );
            } else {
                // When incoming rec doesn't have a 250a all found are possible matches
                return result;
            }
            /* Walk through all findings and select those that has empty 250a, have 009a=v or multiple 009a
             */
            var finalResult = [];
            for (var i = 0; i < result.length; i++ ) {
                var workRes = result[i];
                var pushMe = false;
                if (workRes.edition !== undefined ) {
                    var normalizedFind250a = Solr.analyse(solrUrl, workRes.edition, "match.field250a");
                    if (normalized250a === normalizedFind250a) {
                        pushMe = true;
                    }
                }
                if ( 1 < workRes.composed.length ) {
                    pushMe = true;
                } else {
                    if ( workRes.composed == "v" ) {
                        pushMe = true;
                    }
                }
                if ( pushMe ) {
                    finalResult.push( workRes );
                }
            }
            return finalResult;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__findComposedMaterialsRun(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }
    //-----------------------------------------------------------------------------
    //                  Paper or Musical - fiction
    //-----------------------------------------------------------------------------

    function __matchFictionBookMusic( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchFictionBookMusic()" );

        var result = undefined;
        var subfield = undefined;
        var found009a = false;
        var found009g = false;
        var found652m = false;
        try {
            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field(i);
                // 009 check - Possible target for moving to a function
                if (field.name === "009") {
                    for (var j = 0; j < field.count(); j++) {
                        subfield = field.subfield(j);

                        if (subfield.name === "a") {
                            if (found009a) {
                                return false;
                            }
                            if (["a", "c"].indexOf(subfield.value) === -1) {
                                return false;
                            }

                            found009a = true;
                        }
                        if (subfield.name === "g") {
                            if (found009g) {
                                return false;
                            }
                            if (["xx", "xe"].indexOf(subfield.value) === -1) {
                                return false;
                            }
                            found009g = true;
                        }
                    }
                }

                if (field.name === "652") {
                    if (__get_652MaterialType(field) === materialType.literature ) {
                        found652m = true;
                    }
                }
                if (field.name === "250") {
                    for (var k = 0; k < field.count(); k++) {
                        subfield = field.subfield(k);
                        if (subfield.name === "a") {
                            field250a = subfield.value;
                        }
                    }
                }
            }

            return result = found009a && found009g && found652m;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchFictionBookMusic(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findFictionBookMusic( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findFictionBookMusicRun( record );
    }
    function __findFictionBookMusicRun( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__findFictionBookMusicRun()" );
        var result = undefined;
        var normalized250a = undefined;
        try {
            var formatters = {
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '245a': __querySubfieldValueLengthFormatter( 20 ),
                '260b': __querySubfieldValueLengthFormatter( 2 )
            };

            result = __executeQueryAndFindRecords( record, formatters );
            if ( field250a !== undefined ) {
                normalized250a = Solr.analyse( solrUrl, field250a, "match.field250a" );
            } else {
                // When incoming rec doesn't have a 250a all found are possible matches
                return result;
            }
            var finalResult = [];
            for (var i = 0; i < result.length; i++ ) {
                var workRes = result[i];
                if (workRes.edition !== undefined ) {
                    var normalizedFind250a = Solr.analyse( solrUrl, workRes.edition, "match.field250a" );
                    if (normalized250a === normalizedFind250a ) {
                        finalResult.push( workRes );
                    }
                } else {
                    finalResult.push( workRes );
                }
            }
            return finalResult;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__findFictionBookMusicRun(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    //-----------------------------------------------------------------------------
    //                  Paper or Musical - technical
    //-----------------------------------------------------------------------------

    function __matchTechnicalLiterature( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__matchTechnicalLiterature()" );

        var result = undefined;
        try {
            var found009a = false;
            var found009g = false;
            var found652m = false;

            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field( i );
                // 009 check - Possible target for moving to a function
                if( field.name === "009" ) {
                    for( var j = 0; j < field.count(); j++ ) {
                        var subfield = field.subfield( j );

                        if( subfield.name === "a" ) {
                            if( found009a ) {
                                Log.debug( "__matchTechnicalLiterature(): t1" );
                                return false;
                            }
                            if( [ "a", "c" ].indexOf( subfield.value ) === -1 ) {
                                Log.debug( "__matchTechnicalLiterature(): t2" );
                                return false;
                            }

                            found009a = true;
                        }
                        if( subfield.name === "g" ) {
                            if( found009g ) {
                                Log.debug( "__matchTechnicalLiterature(): t3" );
                                return false;
                            }
                            if( [ "xx", "xe" ].indexOf( subfield.value ) === -1 ) {
                                return false;
                            }
                            found009g = true;
                        }
                    }
                }
                if( field.name === "652" ) {
                    if ( __get_652MaterialType(field) === materialType.technical ) {
                        Log.debug( "Found 652 for technical literature" );
                        found652m = true;
                    }
                }
            }

            Log.debug( "__matchTechnicalLiterature(): t4" );
            return result = found009a && found009g && found652m;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__matchTechnicalLiterature(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    // TESTING only
    function __findTechnicalLiterature( record, newsolrUrl ) {
        solrUrl = newsolrUrl;
        return __findTechnicalLiteratureRun( record );
    }
    function __findTechnicalLiteratureRun( record ) {
        Log.trace( "Enter - DoubleRecordFinder.__findTechnicalLiteratureRun()" );

        var result = undefined;
        try {
            var formatters = {
                '008a': __querySubfieldYearFormatter(),
                '009a': __querySubfieldFormatter,
                '009g': __querySubfieldFormatter,
                '245a': __querySubfieldValueLengthFormatter( 20 ),
                '260b': __querySubfieldValueLengthFormatter( 2 )
            };

            return result = __executeQueryAndFindRecords( record, formatters );
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__findTechnicalLiteratureRun(): ", result !== undefined ? JSON.stringify(result) : "undef" );
        }
    }

    //-----------------------------------------------------------------------------
    //                  Type checkers
    //-----------------------------------------------------------------------------

    function __get_652MaterialType( field ) {
        Log.trace( "Enter - DoubleRecordFinder.__get_652MaterialType()", 0 );

        var result = undefined;
        try {
            if( field.name === "652" ) {
                for( var j = 0; j < field.count(); j++ ) {
                    var subfield = field.subfield( j );

                    if( subfield.name === "m" ) {
                        if( subfield.value === "sk" ) {
                            return materialType.literature;
                            return result = true;
                        }
                        if( subfield.value === "Uden klassem\xe6rke" ) {
                            Log.debug("Found 652m = 'Uden\sklassem\xe6rke'");
                            return result = materialType.technical;
                        }
                        if( /^(8[2-8])/i.test( subfield.value ) ) {
                            if( subfield.value.indexOf( "88.1") > -1 || subfield.value.indexOf( "88.2") > -1 ) {
                                return result = materialType.technical;
                            }
                            return materialType.literature;
                        }
                        return materialType.technical;
                    }
                }
            }

            return result = materialType.unknown;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__get_652MaterialType(): ", result !== undefined ? JSON.stringify(result) : "undef"  );
        }
    }

    //-----------------------------------------------------------------------------
    //                  Query executor
    //-----------------------------------------------------------------------------

    function __executeQueryAndFindRecords( record, queryFormatter ) {
        Log.trace( "Enter - DoubleRecordFinder.__executeQueryAndFindRecords()" );

        var result = [];
        try {
            var reason = [];
            var queryElements = [];

            for( var i = 0; i < record.numberOfFields(); i++ ) {
                var field = record.field( i );

                for( var j = 0; j < field.count(); j++ ) {
                    var subfield = field.subfield( j );

                    var formatter = queryFormatter[ field.name + subfield.name ];
                    if( formatter !== undefined ) {
                        reason.push( field.name + subfield.name );

                        queryElements.push( formatter( field, subfield ) );
                    }
                }
            }

            query = "";
            if ( andingTogether ) {
                var query = queryElements.join( " and " );
            } else {
                var query = queryElements.join( " or " );
            }
            Log.debug( "Solr query: ", query );

            if( query === "" ) {
                return result = [];
            }

            var solr = Solr.search( solrUrl, query );
            for( var k = 0; k < solr.response.docs.length; k++ ) {
                var document = solr.response.docs[k];
                var recordId;
                var index = document.id.indexOf( ":" );

                if( index > -1 ) {
                    recordId = document.id.substring(0, index);
                }
                else {
                    recordId = document.id;
                }

                result.push(  {
                    id: recordId,
                    reason: reason.join( ", " ),
                    edition: document["match.250a"],
                    composed: document["match.009a"]
                } );
            }

            return result;
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__executeQueryAndFindRecords(): ", result );
        }

    }

    //-----------------------------------------------------------------------------
    //                  Query executor
    //-----------------------------------------------------------------------------

    function __querySubfieldFormatter( field, subfield ) {
        Log.trace( "Enter - DoubleRecordFinder.__querySubfieldFormatter()", 0 );
        Log.trace("HIK!", 0);

        var result = undefined;
        try {
            var value = Solr.analyse( solrUrl, subfield.value, "match." + field.name + subfield.name );

            return result = "match." + field.name + subfield.name + ":\"" + value + "\"";
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__querySubfieldFormatter ", result !== undefined ? JSON.stringify(result) : "undefined" );
        }
    }

    function __querySubfieldYearFormatter() {
        Log.trace( "Enter - DoubleRecordFinder.__querySubfieldYearFormatter()", 0 );

        try {
            return function( field, subfield ) {
                var sf;
                var year = parseInt( subfield.value, 10 );
                var array = [];

                sf = new Subfield( subfield.name, ( year - 1 ).toString() );
                array.push( __querySubfieldFormatter( field, sf ) );

                sf = new Subfield( subfield.name, year.toString() );
                array.push( __querySubfieldFormatter( field, sf ) );

                sf = new Subfield( subfield.name, ( year + 1 ).toString() );
                array.push( __querySubfieldFormatter( field, sf ) );

                return "( " + array.join( " or " ) + " )";
            }
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__querySubfieldYearFormatter()", 0 );
        }
    }

    function __querySubfieldSpecificRegister( register ) {
        Log.trace( "Enter - DoubleRecordFinder.__querySubfieldSpecificRegister()", 0);

        var result = undefined;
        try {
            return function( field, subfield ) {
                var value = Solr.analyse( solrUrl, subfield.value, "match." + register );
                return result = "match." + register + ":\"" + value + "\"";
            }
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__querySubfieldSpecificRegister(): ", result !== undefined ? JSON.stringify(result) : "undef" );
        }
    }

    function __querySubfieldValueLengthFormatter( valueLength ) {
        Log.trace( "Enter - DoubleRecordFinder.__querySubfieldValueLengthFormatter()", 0);

        var result = undefined;
        try {
            return function( field, subfield ) {
                var value = Solr.analyse( solrUrl, subfield.value, "match." + field.name + subfield.name );
                // hvis den uklippede men trimmede strengs længde er større end ønsket længde skal der trunkes
                var value1 = value.substr(0, valueLength );
                if ( value.length > valueLength ) {
                    value1 = value1 + "?";
                }

                return result = "match." + field.name + subfield.name + ":\"" + value1 + "\"";
            }
        }
        finally {
            Log.trace( "Exit - DoubleRecordFinder.__querySubfieldValueLengthFormatter(): ", result !== undefined ? JSON.stringify(result) : "undef" );
        }
    }

    return {
        'find': find,

        // Functions is exported so they are accessible from the unittests.
        '__matchNumbers': __matchNumbers,
        '__findNumbers': __findNumbers,
        '__matchSoundMovieMultimedia': __matchSoundMovieMultimedia,
        '__findSoundMovieMultimedia': __findSoundMovieMultimedia,
        '__matchMusic': __matchMusic,
        '__findMusic245': __findMusic245,
        '__findMusic538': __findMusic538,
        '__matchComposedMaterials': __matchComposedMaterials,
        '__findComposedMaterials': __findComposedMaterials,
        '__matchTechnicalLiterature': __matchTechnicalLiterature,
        '__findTechnicalLiterature': __findTechnicalLiterature,
        '__matchFictionBookMusic': __matchFictionBookMusic,
        '__findFictionBookMusic': __findFictionBookMusic
    }

}();


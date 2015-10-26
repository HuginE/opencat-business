//-----------------------------------------------------------------------------
use( "ClassificationData" );
use( "DanMarc2Converter" );
use( "UnitTest" );
use( "UpdateConstants" );
use( "Log" );

//-----------------------------------------------------------------------------
UnitTest.addFixture( "ClassificationData.hasClassificationData", function() {
    function callFunction( jsonObj ) {
        return ClassificationData.hasClassificationData( ClassificationData.create( UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS ), DanMarc2Converter.convertToDanMarc2( jsonObj ) );
    };
    
    function callWithFields( fields ) {
        var record = { fields: [] };
        
        for( var i = 0; i < fields.length; i++ ) {
            record.fields.push( {
                    name: fields[ i ][ 0 ],
                    indicator: "00",
                    subfields: [
                        {
                            name: fields[ i ][ 1 ],
                            value: fields[ i ][ 2 ]
                        }
                    ]
                } );
        };
        
        return callFunction( record );
    };
    
    Assert.equalValue( "Empty", callWithFields( [] ), false ); 
    Assert.equalValue( "001a", callWithFields( [ [ "001", "a", "12345678" ] ] ), false ); 
    Assert.equalValue( "245a", callWithFields( [ [ "245", "a", "Titel" ] ] ), true ); 
    Assert.equalValue( "001a,245a", callWithFields( [ [ "001", "a", "12345678" ],
                                                      [ "245", "a", "Titel" ] ] ), true ); 
    Assert.equalValue( "008t,245a", callWithFields( [ [ "008", "t", "m" ],
                                                      [ "245", "a", "Titel" ] ] ), true ); 
} );

UnitTest.addFixture( "ClassificationData.hasClassificationsChanged", function() {
    function callFunction( oldMarc, newMarc ) {
        return ClassificationData.hasClassificationsChanged( ClassificationData.create( UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS ),
                                                             DanMarc2Converter.convertToDanMarc2( oldMarc ),
                                                             DanMarc2Converter.convertToDanMarc2( newMarc ) );
    };
    
    function callSubfieldChanged( fieldname, subfieldname, oldValue, newValue ) {
        var oldRecord;
        var newRecord;

        oldRecord = {
            fields: [
                { 
                    name: fieldname, indicator: "00",
                    subfields: [ { name: subfieldname, value: oldValue } ]
                }
            ]
        };
        newRecord = {
            fields: [
                {
                    name: fieldname, indicator: "00",
                    subfields: [ { name: subfieldname, value: newValue } ]
                }
            ]
        };
        
        return callFunction( oldRecord, newRecord );
    };
    
    function testField652( subfieldname, oldValue, newEqualValue, newNotEqualValue ) {
        var oldRecord;
        var newRecord;

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "q", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }                                     
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "q", value: "xy" },
                                 { name: subfieldname, value: newEqualValue } ]
                }                                     
            ]
        };
        Assert.equalValue( "652: !*m|!*o, *" + subfieldname + " === *" + subfieldname, callFunction( oldRecord, newRecord ), false );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "q", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "q", value: "xy" },
                                 { name: subfieldname, value: newNotEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: !*m|!*o, *" + subfieldname + " !== *" + subfieldname, callFunction( oldRecord, newRecord ), false );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xy" },
                                 { name: subfieldname, value: newEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: *m|!*o, *" + subfieldname + " === *" + subfieldname, callFunction( oldRecord, newRecord ), false );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xy" },
                                 { name: subfieldname, value: newNotEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: *m|!*o, *" + subfieldname + " !== *" + subfieldname, callFunction( oldRecord, newRecord ), true );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "o", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "o", value: "xy" },
                                 { name: subfieldname, value: newEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: !*m|*o, *" + subfieldname + " === *" + subfieldname, callFunction( oldRecord, newRecord ), false );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "o", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "o", value: "xy" },
                                 { name: subfieldname, value: newNotEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: !*m|*o, *" + subfieldname + " !== *" + subfieldname, callFunction( oldRecord, newRecord ), true );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xx" },
                                 { name: "o", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xx" },
                                 { name: "o", value: "xy" },
                                 { name: subfieldname, value: newEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: *m|*o, *" + subfieldname + " === *" + subfieldname, callFunction( oldRecord, newRecord ), false );

        oldRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xx" },
                                 { name: "o", value: "xy" },
                                 { name: subfieldname, value: oldValue } ]
                }            
            ]
        };
        newRecord = {
            fields: [
                {
                    name: "652", indicator: "00",
                    subfields: [ { name: "m", value: "xx" },
                                 { name: "o", value: "xy" },
                                 { name: subfieldname, value: newNotEqualValue } ]
                }            
            ]
        };
        Assert.equalValue( "652: *m|*o, *" + subfieldname + " !== *" + subfieldname, callFunction( oldRecord, newRecord ), true );        
    }
    
    var oldRecord;
    var newRecord;
    
    //-------------------------------------------------------------------------
    //         Changes values in classification data (single fields)
    //-------------------------------------------------------------------------
    
    Assert.equalValue( "004a e -> e", callSubfieldChanged( "004", "a", "e", "e" ), false ); 
    Assert.equalValue( "004a e -> i", callSubfieldChanged( "004", "a", "e", "i" ), false ); 
    Assert.equalValue( "004a e -> b", callSubfieldChanged( "004", "a", "e", "b" ), true ); 
    Assert.equalValue( "008t m -> m", callSubfieldChanged( "008", "t", "m", "m" ), false ); 
    Assert.equalValue( "008t m -> z", callSubfieldChanged( "008", "t", "m", "z" ), false ); 
    Assert.equalValue( "008t m -> p", callSubfieldChanged( "008", "t", "m", "p" ), true ); 
    Assert.equalValue( "008t s -> p", callSubfieldChanged( "008", "t", "s", "p" ), true ); 
    Assert.equalValue( "009a xx -> xx", callSubfieldChanged( "009", "a", "xx", "xx" ), false ); 
    Assert.equalValue( "009a xx -> xy", callSubfieldChanged( "009", "a", "xx", "xy" ), true ); 
    Assert.equalValue( "009g xx -> xx", callSubfieldChanged( "009", "g", "xx", "xx" ), false ); 
    Assert.equalValue( "009g xx -> xy", callSubfieldChanged( "009", "g", "xx", "xy" ), true ); 
    Assert.equalValue( "100c 1970 -> 1970", callSubfieldChanged( "100", "c", "1970", "1970" ), false ); 
    Assert.equalValue( "100c 1970 -> 1967", callSubfieldChanged( "100", "c", "1970", "1967" ), false ); 
    Assert.equalValue( "110c 1970 -> 1970", callSubfieldChanged( "110", "c", "1970", "1970" ), false ); 
    Assert.equalValue( "110c 1970 -> 1967", callSubfieldChanged( "110", "c", "1970", "1967" ), true ); 
    Assert.equalValue( "239c 1970 -> 1970", callSubfieldChanged( "239", "c", "1970", "1970" ), false ); 
    Assert.equalValue( "239c 1970 -> 1967", callSubfieldChanged( "239", "c", "1970", "1967" ), false ); 
    Assert.equalValue( "245a xx -> xx", callSubfieldChanged( "245", "a", "xx", "xx" ), false ); 
    Assert.equalValue( "245a xx -> xy", callSubfieldChanged( "245", "a", "xx", "xy" ), true ); 
    Assert.equalValue( "245g xx -> xx", callSubfieldChanged( "245", "g", "xx", "xx" ), false ); 
    Assert.equalValue( "245g xx -> xy", callSubfieldChanged( "245", "g", "xx", "xy" ), true ); 
    Assert.equalValue( "245m xx -> xx", callSubfieldChanged( "245", "m", "xx", "xx" ), false ); 
    Assert.equalValue( "245m xx -> xy", callSubfieldChanged( "245", "m", "xx", "xy" ), true ); 
    Assert.equalValue( "245n xx -> xx", callSubfieldChanged( "245", "n", "xx", "xx" ), false ); 
    Assert.equalValue( "245n xx -> xy", callSubfieldChanged( "245", "n", "xx", "xy" ), true ); 
    Assert.equalValue( "245o xx -> xx", callSubfieldChanged( "245", "o", "xx", "xx" ), false ); 
    Assert.equalValue( "245o xx -> xy", callSubfieldChanged( "245", "o", "xx", "xy" ), true ); 
    Assert.equalValue( "245y xx -> xx", callSubfieldChanged( "245", "y", "xx", "xx" ), false ); 
    Assert.equalValue( "245y xx -> xy", callSubfieldChanged( "245", "y", "xx", "xy" ), true ); 
    Assert.equalValue( "245\u00E6 xx -> xx", callSubfieldChanged( "245\u00E6", "\u00E6", "xx", "xx" ), false ); 
    Assert.equalValue( "245\u00E6 xx -> xy", callSubfieldChanged( "245\u00E6", "\u00E6", "xx", "xy" ), true ); 
    Assert.equalValue( "245\u00F8 xx -> xx", callSubfieldChanged( "245\u00E6", "\u00F8", "xx", "xx" ), false ); 
    Assert.equalValue( "245\u00F8 xx -> xy", callSubfieldChanged( "245\u00E6", "\u00F8", "xx", "xy" ), true ); 

    //-------------------------------------------------------------------------
    //         Changes values in classification data (field: 038)
    //-------------------------------------------------------------------------

    oldRecord = {
        fields: [
            {
                name: "038", indicator: "00",
                subfields: [ { name: "a", value: "te" } ]
            }
        ]
    };
    newRecord = { fields: [] };
    Assert.equalValue( "X", callFunction( oldRecord, newRecord ), true );

    oldRecord = {
        fields: [
            {
                name: "038", indicator: "00",
                subfields: [ { name: "a", value: "te" } ]
            },
            {
                name: "038", indicator: "00",
                subfields: [ { name: "a", value: "dr" } ]
            }
        ]
    };
    newRecord = {
        fields: [
            {
                name: "038", indicator: "00",
                subfields: [ { name: "a", value: "dr" } ]
            },
            {
                name: "038", indicator: "00",
                subfields: [ { name: "a", value: "te" } ]
            }
        ]
    };    
    Assert.equalValue( "Two 038: Changed order", callFunction( oldRecord, newRecord ), false );
    
    //-------------------------------------------------------------------------
    //              Changes values in non classification data
    //-------------------------------------------------------------------------

    Assert.equalValue( "666f xx -> xy", callSubfieldChanged( "666", "f", "xx", "xy" ), false );

    //-------------------------------------------------------------------------
    //              Empty subfields in classification field
    //-------------------------------------------------------------------------

    oldRecord = {
        fields: [
            {
                name: "100", indicator: "00",
                subfields: [ { name: "a", value: "Oscar K." } ]
            }
        ]
    };
    newRecord = {
        fields: [
            {
                name: "100", indicator: "00",
                subfields: [
                    { name: "a", value: "Oscar K." },
                    { name: "h", value: "" }
                ]
            }
        ]
    };

    Assert.equalValue( "Empty subfields in classification field", callFunction( oldRecord, newRecord ), false );

    //-------------------------------------------------------------------------
    //              Added new classification field
    //-------------------------------------------------------------------------
    
    oldRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            }
        ]
    };
    newRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "009", indicator: "00",
                subfields: [ { name: "g", value: "xx" } ]
            }           
        ]
    };
    
    Assert.equalValue( "", callFunction( oldRecord, newRecord ), true );

    //-------------------------------------------------------------------------
    //              Removed classification field
    //-------------------------------------------------------------------------
    
    oldRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "009", indicator: "00",
                subfields: [ { name: "g", value: "xx" } ]
            }
            
        ]
    };
    newRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            }
        ]
    };
    
    Assert.equalValue( "", callFunction( oldRecord, newRecord ), true );

    //-------------------------------------------------------------------------
    //              Added new non classification field
    //-------------------------------------------------------------------------
    
    oldRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            }
        ]
    };
    newRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "666", indicator: "00",
                subfields: [ { name: "f", value: "xx" } ]
            }            
        ]
    };
    
    Assert.equalValue( "", callFunction( oldRecord, newRecord ), false );

    //-------------------------------------------------------------------------
    //              Removed non classification field
    //-------------------------------------------------------------------------
    
    oldRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "666", indicator: "00",
                subfields: [ { name: "f", value: "xx" } ]
            }            
        ]
    };
    newRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            }
        ]
    };
    
    Assert.equalValue( "", callFunction( oldRecord, newRecord ), false );

    //-------------------------------------------------------------------------
    //              Changed non classification field
    //-------------------------------------------------------------------------
    
    oldRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "666", indicator: "00",
                subfields: [ { name: "f", value: "xx" } ]
            }            
        ]
    };
    newRecord = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "666", indicator: "00",
                subfields: [ { name: "f", value: "xy" },
                             { name: "a", value: "Hansen" } ]
            }            
        ]
    };
    
    Assert.equalValue( "", callFunction( oldRecord, newRecord ), false );

    //-------------------------------------------------------------------------
    //              Field 652
    //-------------------------------------------------------------------------
    
    testField652( "a", "The \u00A4book of life", "The \u00A4book of liberty", "Book of life" );
    testField652( "b", "The \u00A4book of life", "The \u00A4book of liberty", "Book of life" );
    testField652( "e", "The \u00A4book of life", "The \u00A4book of life", "Book of life" );
    testField652( "f", "The \u00A4book of life", "The \u00A4book of life", "Book of life" );
    testField652( "h", "The \u00A4book of life", "The \u00A4book of life", "Book of life" );

    Assert.equalValue( "652m xx -> xx", callSubfieldChanged( "652", "m", "xx", "xx" ), false ); 
    Assert.equalValue( "652m xx -> x[[x", callSubfieldChanged( "652", "m", "xx", "x[[x" ), false ); 
    Assert.equalValue( "652m xx -> xy", callSubfieldChanged( "652", "m", "xx", "xy" ), true ); 
    Assert.equalValue( "652o xx -> xx", callSubfieldChanged( "652", "o", "xx", "xx" ), false ); 
    Assert.equalValue( "652o xx -> x[[x", callSubfieldChanged( "652", "o", "xx", "x[[x" ), false ); 
    Assert.equalValue( "652o xx -> xy", callSubfieldChanged( "652", "o", "xx", "xy" ), true ); 
    
} );

UnitTest.addFixture( "ClassificationData.removeClassificationsFromRecord", function() {
    var record = {
        fields: [
            {
                name: "001", indicator: "00",
                subfields: [ { name: "a", value: "xxx" } ]
            },
            {
                name: "245", indicator: "00",
                subfields: [ { name: "f", value: "xy" },
                             { name: "a", value: "Hansen" } ]
            }            
        ]
    };
    
    var result = ClassificationData.removeClassificationsFromRecord( ClassificationData.create( UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS ), DanMarc2Converter.convertToDanMarc2( record ) );
    
    Assert.equalValue( "Remove fields", result.size(), 1 ); 
} );

UnitTest.addFixture( "ClassificationData.__stripValue", function() {
    Assert.equalValue( "", ClassificationData.__stripValue( "" ), "" ); 
    Assert.equalValue( "", ClassificationData.__stripValue( " " ), "" ); 
    Assert.equalValue( "", ClassificationData.__stripValue( "[" ), "" ); 
    Assert.equalValue( "", ClassificationData.__stripValue( "]" ), "" ); 
    Assert.equalValue( "", ClassificationData.__stripValue( String.fromCharCode( 0xA4 ) ), "" );

    var date = new Date();
} );

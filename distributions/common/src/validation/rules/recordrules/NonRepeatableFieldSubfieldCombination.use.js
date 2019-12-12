use( "Exception" );
use( "Log" );
use( "ResourceBundle" );
use( "ResourceBundleFactory" );
use( "TemplateUrl" );
use( "ValidateErrors" );
use( "ValueCheck" );

EXPORTED_SYMBOLS = ['NonRepeatableFieldSubfieldCombination'];

var NonRepeatableFieldSubfieldCombination = function() {
    var BUNDLE_NAME = "validation";

    /**
     * Validation rule to checks that a combination of field and subfield is not present in the record at the
     * same time
     *
     * @syntax RecordRules.NonRepeatableFieldSubfieldCombination( record, params )
     *
     * @param {Object} record A DanMarc2 record as descriped in DanMarc2Converter
     * @param {Object} params Object of parameters. The property 'subfields' is an
     *                 Array of field/subfield names on the form <fieldname><subfieldname>.
     *
     * @return {Array}
     *
     * @name RecordRules.NonRepeatableFieldSubfieldCombination
     * @method
     */
    function validateRecord( record, params ) {
        Log.trace( "Enter - RecordRules.NonRepeatableFieldSubfieldCombination( ", record, ", ", params, " )" );

        var result = [];
        try {
            var bundle = ResourceBundleFactory.getBundle( BUNDLE_NAME );

            ValueCheck.checkThat( "params", params ).type( "object" );

            // Convert to Record so we can use its utility functions.
            var marc = DanMarc2Converter.convertToDanMarc2( record );

            // Array of found subfields. If this array contains 2 or more items, when we
            // have a validation error.
            var count = 0;
            var arg = params.subfield;
            if ( arg.length !== 4 ) {
                Log.debug( ResourceBundle.getString( bundle, "conflictingSubfields.params.subfields.error" ), arg, params.subfield );
                throw ResourceBundle.getStringFormat( bundle, "conflictingSubfields.params.subfields.error", arg, params.subfield );
            }

            var fieldName = arg.substr( 0, 3 );
            var subfieldName = arg[ 3 ];

            marc.eachField( new RegExp( fieldName ), function( field ) {
                field.eachSubField( new RegExp( subfieldName ), function( field, subfield ) {
                    count = count + 1;
                } )
            } );

            if ( count > 1 ) {
                var message = ResourceBundle.getStringFormat( bundle, "NonRepeatableFieldSubfieldCombination.validation.error", arg );
                return result = [ValidateErrors.recordError( "TODO:fixurl", message )];
            }


            return result;
        } finally {
            Log.trace( "Exit - RecordRules.NonRepeatableFieldSubfieldCombination(): ", result );
        }
    }

    return {
        "validateRecord": validateRecord,
        "__BUNDLE_NAME": BUNDLE_NAME
    };
}();
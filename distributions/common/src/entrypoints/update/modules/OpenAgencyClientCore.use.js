use("Log");

EXPORTED_SYMBOLS = ['OpenAgencyClientCore'];

var OpenAgencyClientCore = function () {
    var SERVICE_PROVIDER = getServiceProvider();

    function getServiceProvider() {
        Log.info("Getting OpenAgencyServicePackage..")
        try {
            Packages.dk.dbc.opencat.openagency.OpenAgencyService.exists();
            return Packages.dk.dbc.opencat.openagency.OpenAgencyService;
        }
        catch (ex) {
            return Packages.dk.dbc.updateservice.update.OpenAgencyService;
        }
    }

    var features = {
        create_enrichments: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.CREATE_ENRICHMENTS,
        use_enrichments: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.USE_ENRICHMENTS,
        auth_common_notes: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_COMMON_NOTES,
        auth_common_subjects: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_COMMON_SUBJECTS,
        auth_dbc_records: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_DBC_RECORDS,
        auth_public_lib_common_record: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_PUBLIC_LIB_COMMON_RECORD,
        auth_ret_record: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_RET_RECORD,
        auth_root: Packages.dk.dbc.openagency.client.LibraryRuleHandler.Rule.AUTH_ROOT
    };

    function hasFeature(agencyId, featureName) {
        Log.trace("Enter - OpenAgencyClientCore.hasFeature()");
        var result;
        try {

            return result = SERVICE_PROVIDER.hasFeature(agencyId, features[featureName]);
        } finally {
            Log.trace("Exit - OpenAgencyClientCore.hasFeature(): " + result);
        }
    }

    return {
        'hasFeature': hasFeature
    }
}();

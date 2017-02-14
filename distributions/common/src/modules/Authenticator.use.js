use("DanMarc2Converter");
use("Log");
use("NoteAndSubjectExtentionsHandler");
use("OpenAgencyClient");
use("RawRepoClient");
use("ResourceBundle");
use("ResourceBundleFactory");
use("UpdateConstants");
use("ValidateErrors");

EXPORTED_SYMBOLS = ['Authenticator'];

/**
 * Module to contain entry points for the authenticator API between Java and
 * JavaScript.
 *
 * @namespace
 * @name Authenticator
 */
var Authenticator = function () {
    var BUNDLE_NAME = "default-auth";

    /**
     * Authenticates a record.
     *
     * @param record Record
     * @param userId User id - not used.
     * @param groupId Group id.
     * @param settings Settings collection
     *
     * @returns {Array} Array of authentication errors. We use the same structure
     *                  as for validation errors.
     *
     * @name Authenticator#authenticateRecord
     */
    function authenticateRecordEntryPoint(record, userId, groupId, settings) {
        Log.trace("Enter - Authenticator.authenticateRecord()");
        var result = undefined;
        try {
            if (settings !== undefined) {
                ResourceBundleFactory.init(settings);
            }
            var marcRecord = DanMarc2Converter.convertToDanMarc2(JSON.parse(record));
            result = authenticateRecord(marcRecord, userId, groupId);
            return JSON.stringify(result);
        } finally {
            Log.trace("Exit - Authenticator.authenticateRecord(): " + result);
        }
    }


    function authenticateRecord(record, userId, groupId) {
        Log.trace("Enter - Authenticator.authenticateRecord()");
        try {
            var bundle = ResourceBundleFactory.getBundle(BUNDLE_NAME);
            var agencyId = record.getValue(/001/, /b/);

            if (OpenAgencyClient.hasFeature(groupId, UpdateConstants.AUTH_ROOT_FEATURE)) {
                return [];
            }

            if (agencyId === groupId) {
                return [];
            }

            if (agencyId === UpdateConstants.COMMON_AGENCYID) {
                return __authenticateCommonRecord(record, groupId);
            }

            if (UpdateConstants.SCHOOL_AGENCY_PATTERN.test(groupId)) {
                if (record.matchValue(/001/, /b/, RegExp(UpdateConstants.SCHOOL_COMMON_AGENCYID))) {
                    return [];
                }
            }

            var recId = record.getValue(/001/, /a/);

            return [ValidateErrors.recordError("", ResourceBundle.getStringFormat(bundle, "edit.record.other.library.error", recId))];
        } finally {
            Log.trace("Exit - Authenticator.authenticateRecord()");
        }
    }

    /**
     * Helper function.
     *
     * Handles the special case then a FBS library updates a common DBC record.
     *
     * @param record Record
     * @param groupId Group id.
     *
     * @returns {Array} Array of authentication errors. We use the same structure
     *                  as for validation errors.
     *
     * @private
     * @name Authenticator#__authenticateCommonRecord
     */
    function __authenticateCommonRecord(record, groupId) {
        Log.trace("Enter - Authenticator.__authenticateCommonRecord()");
        try {
            if (NoteAndSubjectExtentionsHandler.isNationalCommonRecord(record) === true) {
                return NoteAndSubjectExtentionsHandler.authenticateExtentions(record, groupId);
            }

            var bundle = ResourceBundleFactory.getBundle(BUNDLE_NAME);
            var recId = record.getValue(/001/, /a/);
            var agencyId = record.getValue(/001/, /b/);
            var owner = record.getValue(/996/, /a/);

            Log.info("Record agency: ", agencyId);
            Log.info("New owner: ", owner);

            if (!RawRepoClient.recordExists(recId, UpdateConstants.RAWREPO_COMMON_AGENCYID)) {
                Log.debug("Checking authentication for new common record.");

                if (owner === "") {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "create.common.record.error"))];
                }

                if (owner !== groupId) {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "create.common.record.other.library.error"))];
                }

                return [];
            }

            Log.debug("Checking authentication for updating existing common record.");
            var curRecord = RawRepoClient.fetchRecord(recId, UpdateConstants.RAWREPO_COMMON_AGENCYID);
            var curOwner = curRecord.getValue(/996/, /a/);

            Log.info("Current owner: ", curOwner);
            if (curOwner === "DBC") {
                if (!OpenAgencyClient.hasFeature(groupId, UpdateConstants.AUTH_DBC_RECORDS)) {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.owner.dbc.error"))];
                }

                return [];
            }

            if (curOwner === "RET") {
                if (!OpenAgencyClient.hasFeature(groupId, UpdateConstants.AUTH_RET_RECORD)) {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.error"))];
                }

                return [];
            }

            if (owner === "") {
                return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.error"))];
            }

            if (OpenAgencyClient.hasFeature(curOwner, UpdateConstants.AUTH_PUBLIC_LIB_COMMON_RECORD)) {
                if (owner !== groupId) {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.give.public.library.error"))];
                }

                if (!OpenAgencyClient.hasFeature(groupId, UpdateConstants.AUTH_PUBLIC_LIB_COMMON_RECORD)) {
                    return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.take.public.library.error"))];
                }
                return [];
            }

            if (!( owner === groupId && groupId === curOwner )) {
                return [ValidateErrors.recordError("", ResourceBundle.getString(bundle, "update.common.record.other.library.error"))];
            }

            return [];
        } finally {
            Log.trace("Exit - Authenticator.__authenticateCommonRecord()");
        }
    }

    return {
        'authenticateRecordEntryPoint': authenticateRecordEntryPoint,
        'authenticateRecord': authenticateRecord,
        '__BUNDLE_NAME': BUNDLE_NAME
    }
}();
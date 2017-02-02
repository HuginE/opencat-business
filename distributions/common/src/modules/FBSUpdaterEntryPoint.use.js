use("DanMarc2Converter");
use("DefaultDoubleRecordHandler");
use("DefaultEnrichmentRecordHandler");
use("DefaultRawRepoRecordHandler");
use("Authenticator");
use("FBSClassificationData");
use("Log");
use("Marc");
use("RecategorizationNoteFieldFactory");
use("RecordSorting");

EXPORTED_SYMBOLS = ['FBSUpdaterEntryPoint'];

/**
 * Module to contain entry points for the update API between Java and
 * JavaScript.
 *
 * @namespace
 * @name FBSUpdaterEntryPoint
 */
var FBSUpdaterEntryPoint = function () {

    /**
     * Creates a new library extended record based on a DBC record.
     *
     * @param {String} currentCommonRecord  The current common record as a json.
     * @param {String} updatingCommonRecord The common record begin updated as a json.
     * @param {int}    agencyId Library id for the local library.
     *
     * @return {String} A json with the new record.
     */
    function createLibraryExtendedRecord(currentCommonRecord, updatingCommonRecord, agencyId) {
        Log.trace("Enter - FBSUpdaterEntryPoint.createLibraryExtendedRecord()");
        var result;
        try {
            var currentCommonMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(currentCommonRecord));
            var updatingCommonMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(updatingCommonRecord));
            var instance = __createEnrichmentRecordHandlerInstance(currentCommonMarc, updatingCommonMarc);
            result = DefaultEnrichmentRecordHandler.createRecord(instance, currentCommonMarc, updatingCommonMarc, agencyId);
            result = JSON.stringify(DanMarc2Converter.convertFromDanMarc2(result));
            return result;
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.createLibraryExtendedRecord(): " + result);
        }
    }

    /**
     * Updates a library extended record with the classifications from
     * a DBC record.
     *
     * @param {String} currentCommonRecord  The current common record as a json.
     * @param {String} updatingCommonRecord The common record begin updated as a json.
     * @param {String} enrichmentRecord The library record to update as a json.
     *
     * @return {String} A json with the updated record.
     */
    function updateLibraryExtendedRecord(currentCommonRecord, updatingCommonRecord, enrichmentRecord) {
        Log.trace("Enter - FBSUpdaterEntryPoint.updateLibraryExtendedRecord()");
        var result;
        try {
            var currentCommonMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(currentCommonRecord));
            var updatingCommonMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(updatingCommonRecord));
            var enrichmentMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(enrichmentRecord));
            var instance = __createEnrichmentRecordHandlerInstance(currentCommonMarc, updatingCommonMarc);
            result = DefaultEnrichmentRecordHandler.updateRecord(instance, currentCommonMarc, updatingCommonMarc, enrichmentMarc);
            result = JSON.stringify(DanMarc2Converter.convertFromDanMarc2(result));
            return result;
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.updateLibraryExtendedRecord(): " + result);
        }
    }

    function correctLibraryExtendedRecord(commonRecord, enrichmentRecord) {
        Log.trace("Enter - FBSUpdaterEntryPoint.correctLibraryExtendedRecord()");
        var result;
        try {
            var commonMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(commonRecord));
            var enrichmentMarc = DanMarc2Converter.convertToDanMarc2(JSON.parse(enrichmentRecord));
            Log.trace("Create instance with ClassificationData");
            var classificationsInstance = ClassificationData.create(UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS);
            var instance = DefaultEnrichmentRecordHandler.create(classificationsInstance, ClassificationData);
            result = DefaultEnrichmentRecordHandler.correctRecord(instance, commonMarc, enrichmentMarc);
            result = JSON.stringify(DanMarc2Converter.convertFromDanMarc2(result));
            return result;
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.correctLibraryExtendedRecord(): " + result);
        }
    }

    /**
     * Returns a 512 note field
     *
     * @param {record} the record as a string
     * @param {updatingRecord} record the updating record as a string
     *
     * @returns {String} JSON representation of a field.
     */
    function recategorizationNoteFieldFactory(currentRecord) {
        Log.trace("Enter - FBSUpdaterEntryPoint.RecategorizationNoteFieldFactory");
        var result;
        try {
            var rec = DanMarc2Converter.convertToDanMarc2(JSON.parse(currentRecord));
            return result = JSON.stringify(DanMarc2Converter.convertFromDanMarc2Field(RecategorizationNoteFieldFactory.newNoteField(rec, rec)));
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.RecategorizationNoteFieldFactory: ", result);
        }
    }

    function __createClassificationInstance(currentRecord, newRecord) {
        Log.trace("Enter - FBSUpdaterEntryPoint.__createClassificationInstance");
        try {
            return FBSClassificationData.create(UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS);
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.__createClassificationInstance");
        }
    }

    function __createEnrichmentRecordHandlerInstance(currentCommonRecord, updatingCommonRecord) {
        Log.trace("Enter - FBSUpdaterEntryPoint.__createEnrichmentRecordHandlerInstance");
        var instance;
        try {
            Log.trace("Create instance with FBSClassificationData");
            var classificationsInstance = FBSClassificationData.create(UpdateConstants.DEFAULT_CLASSIFICATION_FIELDS);
            instance = DefaultEnrichmentRecordHandler.create(classificationsInstance, FBSClassificationData);
            return instance;
        } finally {
            Log.trace("Exit - FBSUpdaterEntryPoint.__createEnrichmentRecordHandlerInstance() " + instance);
        }
    }

    return {
        'recategorizationNoteFieldFactory': recategorizationNoteFieldFactory,
        'createLibraryExtendedRecord': createLibraryExtendedRecord,
        'updateLibraryExtendedRecord': updateLibraryExtendedRecord,
        'correctLibraryExtendedRecord': correctLibraryExtendedRecord
    };
}();
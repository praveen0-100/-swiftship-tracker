trigger ParcelTrigger on Parcel__c (before insert, before update, after insert, after update) {
    if (Trigger.isBefore) {
        ParcelTriggerHandler.validate(Trigger.new, Trigger.oldMap);
    } else {
        ParcelTriggerHandler.notifyOnStatusChange(Trigger.new, Trigger.oldMap);
    }
}

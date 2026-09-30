public with sharing class ParcelTriggerHandler {

    public static void validate(List<Parcel__c> parcels, Map<Id, Parcel__c> oldMap) {
        Boolean isNew = oldMap == null;
        for (Parcel__c p : parcels) {
            if (p.Weight__c == null || p.Weight__c <= 0) {
                p.Weight__c.addError('Weight must be greater than zero.');
            }
            if (p.Sender__c == null) {
                p.Sender__c.addError('A sender is required to book a parcel.');
            }
            if (p.Estimated_Delivery_Date__c == null) {
                p.Estimated_Delivery_Date__c.addError('Estimated delivery date is required.');
            } else if (isNew && p.Estimated_Delivery_Date__c < Date.today()) {
                p.Estimated_Delivery_Date__c.addError('Estimated delivery date cannot be in the past.');
            }
        }
    }

    public static void notifyOnStatusChange(List<Parcel__c> parcels, Map<Id, Parcel__c> oldMap) {
        Set<Id> changed = new Set<Id>();
        for (Parcel__c p : parcels) {
            if (oldMap == null || p.Status__c != oldMap.get(p.Id).Status__c) {
                changed.add(p.Id);
            }
        }
        if (changed.isEmpty()) return;

        List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
        for (Parcel__c p : [
            SELECT Name, Parcel_ID__c, Status__c, Estimated_Delivery_Date__c, Sender__r.Sender_Email__c,
                   (SELECT Receiver_Email__c FROM Receivers__r WHERE Receiver_Email__c != null)
            FROM Parcel__c WHERE Id IN :changed
        ]) {
            List<String> to = new List<String>();
            if (p.Sender__r != null && p.Sender__r.Sender_Email__c != null) {
                to.add(p.Sender__r.Sender_Email__c);
            }
            for (Receiver__c r : p.Receivers__r) {
                to.add(r.Receiver_Email__c);
            }
            if (to.isEmpty()) continue;

            Messaging.SingleEmailMessage m = new Messaging.SingleEmailMessage();
            m.setToAddresses(to);
            m.setSaveAsActivity(false);
            m.setSubject('SwiftShip update: ' + p.Parcel_ID__c + ' is ' + p.Status__c);
            m.setPlainTextBody(
                'Parcel ' + p.Parcel_ID__c + ' (' + p.Name + ')\n' +
                'Status: ' + p.Status__c + '\n' +
                'Estimated delivery: ' + p.Estimated_Delivery_Date__c + '\n\n' +
                'Thank you for using SwiftShip Tracker.'
            );
            mails.add(m);
        }
        if (!mails.isEmpty() && !Test.isRunningTest()) {
            Messaging.sendEmail(mails, false);
        }
    }
}

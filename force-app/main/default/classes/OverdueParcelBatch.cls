public with sharing class OverdueParcelBatch implements Database.Batchable<SObject>, Schedulable {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Parcel_ID__c, Status__c, Estimated_Delivery_Date__c, Sender__r.Sender_Email__c
            FROM Parcel__c
            WHERE Status__c != 'Delivered' AND Estimated_Delivery_Date__c < TODAY
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Parcel__c> scope) {
        List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
        for (Parcel__c p : scope) {
            if (p.Sender__r == null || p.Sender__r.Sender_Email__c == null) continue;
            Messaging.SingleEmailMessage m = new Messaging.SingleEmailMessage();
            m.setToAddresses(new List<String>{ p.Sender__r.Sender_Email__c });
            m.setSaveAsActivity(false);
            m.setSubject('SwiftShip delay notice: ' + p.Parcel_ID__c);
            m.setPlainTextBody('Parcel ' + p.Parcel_ID__c + ' is past its estimated delivery date ('
                + p.Estimated_Delivery_Date__c + ') and is still "' + p.Status__c + '". We are working on it.');
            mails.add(m);
        }
        if (!mails.isEmpty() && !Test.isRunningTest()) {
            Messaging.sendEmail(mails, false);
        }
    }

    public void finish(Database.BatchableContext bc) {}

    public void execute(SchedulableContext sc) {
        Database.executeBatch(new OverdueParcelBatch(), 200);
    }
}

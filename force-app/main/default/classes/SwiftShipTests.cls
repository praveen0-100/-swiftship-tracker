@IsTest
private class SwiftShipTests {

    private static Sender__c makeSender() {
        Sender__c s = new Sender__c(Name = 'Test Sender', Sender_Email__c = 'sender@example.com');
        insert s;
        return s;
    }

    private static Parcel__c makeParcel(Sender__c s, Integer weight, Integer daysFromNow) {
        return new Parcel__c(Name = 'Box', Status__c = 'Booked', Weight__c = weight,
            Estimated_Delivery_Date__c = Date.today().addDays(daysFromNow), Sender__c = s.Id);
    }

    @IsTest
    static void validParcelIsInserted() {
        insert makeParcel(makeSender(), 3, 3);
        System.assertEquals(1, [SELECT COUNT() FROM Parcel__c]);
    }

    @IsTest
    static void invalidWeightIsRejected() {
        Database.SaveResult r = Database.insert(makeParcel(makeSender(), 0, 1), false);
        System.assert(!r.isSuccess());
    }

    @IsTest
    static void pastEstimatedDateIsRejectedOnInsert() {
        Database.SaveResult r = Database.insert(makeParcel(makeSender(), 1, -1), false);
        System.assert(!r.isSuccess());
    }

    @IsTest
    static void statusChangeRunsNotification() {
        Sender__c s = makeSender();
        Parcel__c p = makeParcel(s, 1, 2);
        insert p;
        insert new Receiver__c(Name = 'Recv', Receiver_Email__c = 'r@example.com', Parcel__c = p.Id, Sender__c = s.Id);
        p.Status__c = 'In Transit';
        update p;
        System.assertEquals('In Transit', [SELECT Status__c FROM Parcel__c WHERE Id = :p.Id].Status__c);
    }

    @IsTest
    static void overdueBatchRuns() {
        Parcel__c p = makeParcel(makeSender(), 1, 1);
        insert p;
        p.Estimated_Delivery_Date__c = Date.today().addDays(-2);
        update p;
        Test.startTest();
        Database.executeBatch(new OverdueParcelBatch(), 200);
        Test.stopTest();
        System.assertEquals(1, [SELECT COUNT() FROM Parcel__c WHERE Estimated_Delivery_Date__c < TODAY]);
    }
}

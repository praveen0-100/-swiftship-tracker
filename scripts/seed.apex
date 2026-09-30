Sender__c s = new Sender__c(Name='Asha Traders', Sender_Email__c='sender@example.com', Sender_Contact__c='9876543210');
insert s;
List<Parcel__c> ps = new List<Parcel__c>{
  new Parcel__c(Name='Books Box', Status__c='Booked', Weight__c=2.5, Estimated_Delivery_Date__c=Date.today().addDays(4), Sender__c=s.Id),
  new Parcel__c(Name='Electronics', Status__c='Booked', Weight__c=1.2, Estimated_Delivery_Date__c=Date.today().addDays(2), Sender__c=s.Id),
  new Parcel__c(Name='Clothes', Status__c='Booked', Weight__c=3.0, Estimated_Delivery_Date__c=Date.today().addDays(1), Sender__c=s.Id)
};
insert ps;
insert new Receiver__c(Name='Ravi Kumar', Receiver_Email__c='receiver@example.com', Receiver_Contact__c='9123456780', Sender__c=s.Id, Parcel__c=ps[0].Id);
insert new Delivery__c(Name='DEL-001', Parcel__c=ps[0].Id, Sender__c=s.Id, Estimated_Delivery__c=Date.today().addDays(4));
ps[1].Status__c='In Transit'; ps[2].Status__c='Delivered';
update ps;

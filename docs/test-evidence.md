# Test evidence (generated 2026-10-01)

Org: myPlayground (Developer Edition)

## 1. Apex tests (SwiftShipTests)
```
SwiftShipTests.invalidWeightIsRejected              Pass              143         
SwiftShipTests.overdueBatchRuns                     Pass              328         
SwiftShipTests.pastEstimatedDateIsRejectedOnInsert  Pass              22          
SwiftShipTests.statusChangeRunsNotification         Pass              132         
SwiftShipTests.validParcelIsInserted                Pass              57          
Outcome              Passed                   
Tests Ran            5                        
Pass Rate            100%                     
Fail Rate            0%                       
```

## 2. Validation rules (weight 0, past delivery date)
```
VAL1 false Weight must be greater than zero.
VAL2 false Estimated delivery date cannot be in the past.
```

## 3. Records in org
```
┌──────────────┬─────────────┬────────────┬───────────┬────────────────────────────┐
│ PARCEL_ID__C │ NAME        │ STATUS__C  │ WEIGHT__C │ ESTIMATED_DELIVERY_DATE__C │
├──────────────┼─────────────┼────────────┼───────────┼────────────────────────────┤
│ P-001        │ Books Box   │ Booked     │ 2.5       │ 2026-10-04                 │
│ P-002        │ Electronics │ In Transit │ 1.2       │ 2026-10-02                 │
│ P-003        │ Clothes     │ Delivered  │ 3         │ 2026-10-01                 │
└──────────────┴─────────────┴────────────┴───────────┴────────────────────────────┘
```

## 4. Flow Parcel_Details (input P-001)
```
15:20:20.44 (481292596)|USER_DEBUG|[3]|DEBUG|FLOWOUT: Parcel Tracking Update
- Parcel Name: Books Box
- Parcel ID: P-001
- Status: Booked
- Weight: 2.5 kg
- Estimated Delivery Date: 2026-10-04
```

## 5. Agentforce preview
See screenshots 08 and 09: query 'Track parcel P-001' routed to the Parcel Updates subagent, ran ParcelDetails, and returned Books Box, P-001, Booked, 2.5 kg, 2026-10-04. Agent SwiftShip Tracker Version 1 is Active.

# SwiftShip Tracker (Salesforce Developer Project)

Salesforce parcel booking and tracking system with an Agentforce tracking agent.
Based on the "Swift Ship Tracker: NM" template.

## What is in this repo

| Path | Content |
|---|---|
| `force-app/main/default/objects` | Custom objects `Parcel__c`, `Delivery__c`, `Sender__c`, `Receiver__c` with all fields and lookups |
| `.../tabs`, `.../applications` | Object tabs and the **SwiftShip Tracker** Lightning app |
| `.../permissionsets` | `Swift_Ship` permission set (CRU on all four objects and their fields) |
| `.../flows/Parcel_Details` | Auto-launched flow: input `Ids` (Parcel ID), output `Output` (tracking text). Used as the Agentforce action |
| `.../classes`, `.../triggers` | `ParcelTrigger` + `ParcelTriggerHandler` (validation, status-change emails), `OverdueParcelBatch` (Batch + Schedulable), `SwiftShipTests` |
| `docs/` | Phase-wise documentation and the manual (UI-only) steps |

## Data model

- **Parcel__c**: Parcel_ID__c (auto number `P-{000}`), Status__c (Booked, In Transit, Out for Delivery, Delivered), Weight__c, Estimated_Delivery_Date__c, Sender__c (lookup)
- **Delivery__c**: Current_Location__c (geolocation), Estimated_Delivery__c, Sender__c, Parcel__c (lookups)
- **Sender__c**: Sender_Address__c (geolocation), Sender_Contact__c, Sender_Email__c
- **Receiver__c**: Receiver_Address__c (geolocation), Receiver_Contact__c, Receiver_Email__c, Sender__c, Parcel__c (lookups)

## Deploy

```bash
sf org login web --alias swiftship
sf project deploy start --source-dir force-app --target-org swiftship
sf apex run test --target-org swiftship --code-coverage --result-format human --wait 10
```

Then follow `docs/manual-steps.md` for the parts that can only be done in the Setup UI
(Prompt Template, Agentforce agent, reports and dashboards, screenshots).

## Submission

Final deadline: **Saturday, 3 October 2026**. Push this repo to GitHub, add the filled
phase templates and screenshots to `docs/`, and submit the repo link.

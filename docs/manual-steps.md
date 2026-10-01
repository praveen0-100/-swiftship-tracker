# Manual steps (Setup UI only)

These parts of the template cannot be deployed as metadata and must be done in the org.
Take a screenshot at every step for the phase templates.

## 1. Permission set license
Open **Setup > Permission Sets > Swift Ship** and confirm it saved. If you want it assigned to
the agent user, the guide uses the *Einstein Agent* license; create the set with that license
in the UI, or assign `Swift_Ship` to the **Einstein Service Agent** user under
Users > Permission Set Assignments.

## 2. Prompt Template (Milestone 5) - DEPLOYED via metadata and ACTIVATED (Version 2)
Setup > Prompt Builder > New Prompt Template, type **Record summary** (Flex), object `Parcel__c`.

- Label: `Retrieve Parcel Details`, API name `Retrieve_Parcel_Details`
- Description: Retrieves parcel details where Parcel_ID matches the user input.
- Body:

```
Retrieve details from Parcel__c where Parcel_ID__c matches user input. Return response in this format:

Parcel Tracking Update
- Parcel Name: {!$Input:Parcel__c.Name}
- Parcel ID: {!$Input:Parcel__c.Parcel_ID__c}
- Status: {!$Input:Parcel__c.Status__c}
- Weight: {!$Input:Parcel__c.Weight__c}
- Estimated Delivery Date: {!$Input:Parcel__c.Estimated_Delivery_Date__c}
```
Save and Activate. Test with a record.

## 3. Flow user access
The `Parcel_Details` flow is deployed active. Confirm under Setup > Flows that it is Active
and runs in system context without sharing. (Optionally add the prompt-template action to it
following Milestone 6 step 5.)

## 4. Agentforce (Phase 3, Milestones 3 and 4)
1. Setup > Einstein Setup: turn on Einstein. Setup > Agentforce Agents: turn on Agentforce and the Default Agent.
2. Open the default agent in Builder. New Subagent named `Parcel Updates`, description about parcel tracking by Parcel ID.
3. Subagent actions > New Agent Action > Flow > `Parcel Details`. Input `Ids` = Parcel ID, output `Output`.
4. Rename the agent `SwiftShip Tracker`, Save, Activate.
5. Preview: "Track parcel P-001".

## 5. Test data (Phase 4)
Run `sf apex run --file scripts/seed.apex --target-org <alias>` (also assign the permission set: `sf org assign permset --name Swift_Ship`). Or create manually:
Create one Sender, one Parcel (weight 2.5, future estimated delivery date), one Receiver and one Delivery.
Use the Parcel ID shown on the record (for example `P-001`) in the agent preview.

## 6. Reports and dashboards (Sprint 5 and 6) - DEPLOYED via metadata (folder "SwiftShip Reports"); only screenshots needed
- Report type "Parcels": *Parcels by Status* (summary grouped by Status), *Overdue Parcels* (Estimated Delivery Date < today, Status not Delivered).
- Dashboard *SwiftShip Operations*: donut of parcels by status, table of overdue parcels.

## 7. Schedule the batch (optional)
Developer Console > Execute Anonymous:
```apex
System.schedule('Overdue parcels daily', '0 0 8 * * ?', new OverdueParcelBatch());
```

## Status (updated 2026-10-01)
- Agent `SwiftShip Tracker` (Version 1) was created in the new Agentforce Builder as a separate agent (existing org agents were left untouched), committed and **activated**. The `ParcelDetails` action's `Output` must be typed `string` (an `object` type makes the preview fail).
- Page layouts for all four objects were added so every field is visible and editable.
- Evidence: `docs/screenshots/` and `docs/test-evidence.md`.
- Phase 3, Milestone 2 done (2026-10-01): `Swift_Ship` is assigned to the agent user `EinsteinServiceAgent User` (`swiftship_tracker@...ext`) as well as to the admin user. Command: `sf org assign permset --name Swift_Ship --on-behalf-of <agent-username>`.
- Prompt template (2026-10-02): a metadata deploy only publishes a version, it does not activate it. Version 2 was activated in Setup > Prompt Builder > Retrieve Parcel Details > Activate. "No active template version" means this step is missing.

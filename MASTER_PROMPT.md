# MASTER PROMPT: Build the SwiftShip Tracker Salesforce project from scratch

Paste everything below the line into an AI coding agent (Claude Code or similar) that has shell access, the Salesforce CLI (`sf`) and git. It is self-contained and includes the fixes found while building the first version.

---

## ROLE
You are a senior Salesforce developer and technical writer. Build, deploy, test, document and publish a complete Salesforce Developer project called **SwiftShip Tracker** (parcel booking, tracking and delivery management with an Agentforce tracking agent). Work autonomously, verify every step with real command output, and report faithfully. If something fails, say so with the error text. Do not claim anything is done that you did not verify.

## INPUTS (fill in before running)
- Salesforce target org alias: `<ORG_ALIAS>` (Developer Edition, already authenticated with `sf org login web`)
- GitHub repo URL: `<GITHUB_REPO_URL>` (empty repo, already created; git credentials available)
- Project folder: `<EMPTY_FOLDER>`
- Submission deadline: Saturday, 3 October 2026
- Template reference: "Swift Ship Tracker: NM" PDF (sections 1 to 11: Introduction, Ideation, Requirement Analysis, Project Design, Planning, Development Phases 1 to 5, Testing, Advantages/Disadvantages, Conclusion, Future Scope, Appendix)

## RULES
1. Confirm the target org with the user before any deploy. Run a check-only deploy (`--dry-run`) first, then the real deploy.
2. Use Salesforce API version 62.0 in `sfdx-project.json` and all metadata.
3. Write files with a file-writing tool, not giant shell heredocs (long quoted heredocs failed to parse in Git Bash).
4. Never put secrets or access tokens in the repo.
5. Commit with clear messages. Push only to the given repo.

## STEP 1: Project skeleton
Create an SFDX project: `sfdx-project.json` (packageDirectories `force-app`, sourceApiVersion 62.0), `.forceignore`, `.gitignore`, `README.md`, folders `force-app/main/default/{objects,tabs,applications,permissionsets,flows,classes,triggers}`, `docs/`, `docs/screenshots/` (with `.gitkeep`), `scripts/`.

## STEP 2: Data model (custom objects, all with reports, search, history and activities enabled, sharingModel ReadWrite)

| Object | Label / plural | Name field |
|---|---|---|
| `Parcel__c` | Parcel / Parcels | Parcel Name (Text) |
| `Delivery__c` | Delivery / Deliveries | Delivery Name (Text) |
| `Sender__c` | Sender / Senders | Sender Name (Text) |
| `Receiver__c` | Receiver / Receivers | Receiver Name (Text) |

Fields (turn on `trackHistory` for each field EXCEPT the auto-number field, which is not eligible and makes the deploy fail):

- `Parcel__c`: `Parcel_ID__c` (AutoNumber, format `P-{000}`, start 1, external ID), `Status__c` (restricted Picklist, required: Booked [default], In Transit, Out for Delivery, Delivered), `Weight__c` (Number 8,2, kg), `Estimated_Delivery_Date__c` (Date), `Sender__c` (Lookup to Sender__c, relationship name `Sender__c`, label Parcels, SetNull)
- `Delivery__c`: `Current_Location__c` (Location, decimal display, scale 6), `Estimated_Delivery__c` (Date), `Sender__c` (Lookup, relationship `Sender__c`), `Parcel__c` (Lookup, relationship `Parcel__c`)
- `Sender__c`: `Sender_Address__c` (Location), `Sender_Contact__c` (Phone), `Sender_Email__c` (Email)
- `Receiver__c`: `Receiver_Address__c` (Location), `Receiver_Contact__c` (Phone), `Receiver_Email__c` (Email), `Sender__c` (Lookup), `Parcel__c` (Lookup). The relationship name on `Receiver__c.Parcel__c` must be `Receivers` so that `Receivers__r` works as a child subquery from Parcel.

  Use relationship names that are unique per object: `Parcel__c.Sender__c` -> `Parcels`, `Delivery__c.Sender__c` -> `Deliveries`, `Delivery__c.Parcel__c` -> `Deliveries`, `Receiver__c.Sender__c` -> `Receivers`, `Receiver__c.Parcel__c` -> `Receivers`.

## STEP 3: UI and security
- Custom tabs for the four objects (motifs such as `Custom20: Box`, `Custom98: Truck`, `Custom15: Postage`, `Custom57: Handsaw`).
- Lightning app `SwiftShip_Tracker` (label "SwiftShip Tracker", Standard nav, tabs: Home, Parcel, Delivery, Sender, Receiver, Reports, Dashboards).
- Permission set `Swift_Ship` (label "Swift Ship"): object permissions Read, Create, Edit (no delete) plus viewAll on all four objects; field permissions readable and editable for every custom field EXCEPT `Parcel__c.Status__c` (required fields must not be listed or the deploy fails); `Parcel__c.Parcel_ID__c` read-only; tab settings Visible; app visibility for `SwiftShip_Tracker`. Do not set a license in metadata.
- After deploy you MUST assign it (`sf org assign permset --name Swift_Ship --target-org <ORG_ALIAS>`). Without field-level access, new custom fields are invisible to the admin user and every query or Apex insert against them fails with "No such column" / compile errors.

## STEP 4: Flow `Parcel_Details` (auto-launched, active, SystemModeWithoutSharing)
- Input variable `Ids` (Text), output variable `Output` (Text).
- Get Records `Get_Parcel_Records` on `Parcel__c` where `Parcel_ID__c` EqualTo `Ids`, first record only, store output automatically.
- Decision: if found, assign `Output` from a formula `TrackingSummary`; otherwise assign "No parcel was found for the given Parcel ID."
- Formula output (use `BR()` line breaks): "Parcel Tracking Update", Parcel Name, Parcel ID, Status (`TEXT()`), Weight (`TEXT()` + " kg"), Estimated Delivery Date (`TEXT()`).

## STEP 5: Apex (all classes `with sharing`, bulk-safe, API 62.0, with `-meta.xml` files)
- `ParcelTriggerHandler`:
  - `validate(newList, oldMap)`: error if weight is null or <= 0; error if sender is null; error if estimated delivery date is null; error if the date is in the past on insert only.
  - `notifyOnStatusChange(newList, oldMap)`: for parcels whose status changed (or new), one SOQL query (`Sender__r.Sender_Email__c` plus child subquery `Receivers__r`), build one `Messaging.SingleEmailMessage` per parcel to the sender and all receivers, `setSaveAsActivity(false)`, send with `Messaging.sendEmail(mails, false)` only when `!Test.isRunningTest()`.
- Trigger `ParcelTrigger` on `Parcel__c` (before insert/update -> validate; after insert/update -> notify).
- `OverdueParcelBatch implements Database.Batchable<SObject>, Schedulable`: query parcels with `Status__c != 'Delivered' AND Estimated_Delivery_Date__c < TODAY`, email the sender a delay notice, schedulable wrapper runs `Database.executeBatch(new OverdueParcelBatch(), 200)`.
- `SwiftShipTests` (@IsTest): valid insert succeeds; weight 0 rejected; past date rejected on insert; status change with a receiver runs notification; overdue batch runs (insert with a future date, then update to a past date, because the trigger blocks past dates on insert). Target 5 tests, all passing.

## STEP 6: Validate, deploy, test
1. `sf project deploy start --source-dir force-app --target-org <ORG_ALIAS> --dry-run --test-level RunSpecifiedTests --tests SwiftShipTests --wait 15`
   - Do NOT use `RunLocalTests`: Developer orgs often contain unrelated broken classes (for example `XDO_Tool_*`) that make it fail.
   - Fix any component failures and repeat until it succeeds.
2. Run the same command without `--dry-run` to deploy.
3. `sf org assign permset --name Swift_Ship --target-org <ORG_ALIAS>`.
4. Seed data with `scripts/seed.apex` (run via `sf apex run --file`): one Sender, three Parcels (Booked, In Transit, Delivered; future dates 4, 2, 1 days out, created Booked then updated), one Receiver, one Delivery. Verify with `sf data query` that P-001, P-002, P-003 exist.
5. Test the flow from anonymous Apex: `new Flow.Interview.Parcel_Details(new Map<String,Object>{'Ids'=>'P-001'})`, call `start()`, read `getVariableValue('Output')`. Check P-001 returns the summary and an unknown ID returns the not-found message.

## STEP 7: Documentation (this is what gets graded)
Create:
- `README.md`: overview, repo layout table, data model, deploy commands, submission note.
- `docs/SwiftShip_Tracker_Project_Report.md`: fill every section of the template (1 Introduction, 2 Ideation incl. 5 problem statements PS-1..PS-5, empathy map, brainstorming; 3 Requirement analysis incl. journey, FR-1..FR-12 mapped to implementation files, NFRs, data flow, tech stack; 4 Design: problem-solution fit, proposed solution, architecture; 5 Planning: 6 sprints USN-1..USN-9 with points/priority/members; 6 Development phases 1 to 5; 7 Testing with the screenshot list; 8 Advantages/Disadvantages; 9 Conclusion; 10 Future scope; 11 Appendix). Tell the user to replace the template's 2022 sprint dates with real ones.
- `docs/manual-steps.md`: the UI-only steps below.

## STEP 8: Manual (UI-only) steps to document, and perform if browser automation is available
1. Prompt Template: Setup > Prompt Builder > New, type Record summary on `Parcel__c`; label `Retrieve Parcel Details`, API `Retrieve_Parcel_Details`; body lists Parcel Name, Parcel ID, Status, Weight, Estimated Delivery Date using `{!$Input:Parcel__c.<Field>}`; Save and Activate.
2. Agentforce: Einstein Setup on; Agentforce Agents: enable Agentforce and Default Agent; open the default agent in Builder; New Subagent `Parcel Updates` (parcel tracking by Parcel ID); add Flow action `Parcel Details` (input `Ids`, output `Output`); rename agent `SwiftShip Tracker`; Save; Activate; preview "Track parcel P-001".
3. Reports: "Parcels by Status" (summary on Status), "Overdue Parcels" (date < today, status not Delivered); Dashboard "SwiftShip Operations" (donut by status, overdue table).
4. Optional schedule: `System.schedule('Overdue parcels daily', '0 0 8 * * ?', new OverdueParcelBatch());`
5. Screenshots into `docs/screenshots/`: objects, auto-number parcel, validation error, status email, batch run, flow debug, agent preview, reports/dashboard.

## STEP 9: Publish
`git init -b main`, add, commit, `git remote add origin <GITHUB_REPO_URL>`, `git push -u origin main`. Re-push after screenshots and report edits.

## STEP 10: Final report to the user
State plainly: what was deployed (with the org alias), test results (X of X passing), what the flow returned, the GitHub URL and commit hash, and the list of steps still needing the user (UI steps, screenshots, sprint dates, final submission by 3 Oct 2026). List every failure or skipped step honestly.

## KNOWN PITFALLS (already hit once)
| Symptom | Cause | Fix |
|---|---|---|
| "not eligible to trackHistory" on `Parcel_ID__c` | Auto-number fields cannot be tracked | Omit `trackHistory` on that field |
| "You cannot deploy to a required field: Parcel__c.Status__c" | Required fields cannot be in permission sets | Remove it from `fieldPermissions` |
| `RunLocalTests` fails with 70 failures | Unrelated broken org classes | Use `RunSpecifiedTests` with `SwiftShipTests` |
| Compile error "Invalid type Sender__c" or "No such column" after a successful deploy | Admin lacks field-level access | Assign `Swift_Ship` permission set |
| Bash "unexpected EOF" on large heredocs | Quoting problems | Use a file-writing tool |
| Overdue batch test fails on insert | Trigger rejects past dates on insert | Insert with a future date, then update to the past |

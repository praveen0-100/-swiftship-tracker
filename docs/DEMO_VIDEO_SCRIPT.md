# SwiftShip Tracker: Demo Video Script (about 6 minutes)

Record one continuous screen capture with your voice. Follow the timeline below. Everything shown already exists in the org, so you only need to click through it.

## Before you record (5 minutes)

1. Log in to the org: run `sf org open --target-org myPlayground` in a terminal, or open https://aamec5-dev-ed.develop.lightning.force.com.
2. Close other tabs and notifications. Set browser zoom to 100% and the window to full screen (1920x1080 if possible).
3. Open these tabs in advance, in this order, so you only switch between them:
   1. App Launcher > **SwiftShip Tracker** app > Parcels tab
   2. Setup > Object Manager > Parcel > Fields & Relationships
   3. Setup > Flows > **Parcel Details**
   4. Setup > Prompt Builder > **Retrieve Parcel Details**
   5. Setup > Agentforce Agents > **SwiftShip Tracker** > Open in Builder > Preview
   6. Reports tab > folder **SwiftShip Reports**
   7. Dashboards > **SwiftShip Operations**
   8. GitHub: https://github.com/praveen0-100/-swiftship-tracker
4. Rehearse once without recording. Click **Refresh** on the dashboard just before recording.
5. Recording tool (pick one): Windows **Win + G** (Game Bar, "Capture") or **OBS Studio**, with your microphone on.

## Timeline and narration

| Time | Show on screen | Say (adapt in your own words) |
|---|---|---|
| 0:00 to 0:30 | Title: the GitHub README or the report cover | "Hello, we are Team SwiftShip: Praveen P (team lead), Priyan K, Nishanth S, Nandhakumar A and Prakash V. This is SwiftShip Tracker, a Salesforce parcel booking and tracking system with an Agentforce AI agent." |
| 0:30 to 1:00 | Problem slide or report section 2.1 | "Customers struggle to book and track parcels without calling support or using many apps. Our solution centralizes parcels in Salesforce, automates updates, and lets customers track a parcel by chatting with an AI agent." |
| 1:00 to 1:50 | Object Manager: Parcel fields, then Sender, Receiver, Delivery | "We built four custom objects: Parcel, Delivery, Sender and Receiver. Parcel has an auto-number ID, Status picklist, Weight and Estimated Delivery Date, with a lookup to Sender. Delivery tracks the current location. Receiver links to both Sender and Parcel." |
| 1:50 to 2:50 | SwiftShip Tracker app > Parcels tab > **New**: Name `Gift Box`, Status `Booked`, Weight `1.8`, Estimated Delivery Date = 3 days from today, Sender `Asha Traders` > Save | "Here is the SwiftShip Tracker app. I book a new parcel. The Parcel ID is generated automatically, P-004." |
| 2:50 to 3:20 | Open the same record > Edit > set Weight to `0` > Save (show the red error) > Cancel | "Validation protects data quality. A weight of zero is rejected by our Apex trigger, and a past delivery date is rejected too." |
| 3:20 to 3:50 | Change Status to **In Transit** and save | "When the status changes, the trigger sends an email notification to the sender and receiver. A scheduled Batch Apex job also warns senders about overdue parcels." |
| 3:50 to 4:20 | Setup > Flows > Parcel Details; then Prompt Builder > Retrieve Parcel Details | "The Parcel Details flow takes a Parcel ID, looks up the parcel and returns a tracking summary. The Retrieve Parcel Details prompt template defines the response format using Parcel fields." |
| 4:20 to 5:20 | Agent Builder > Preview. Type `Track parcel P-001`, then `Track parcel P-999` | "This is the SwiftShip Tracker Agentforce agent. It routes to the Parcel Updates subagent, runs the flow, and answers with the parcel name, ID, status, weight and delivery date. For an unknown ID it says no parcel was found." |
| 5:20 to 5:50 | Reports folder: Parcels by Status; Dashboards: SwiftShip Operations | "Managers get reports and a dashboard showing parcels by status and overdue parcels." |
| 5:50 to 6:10 | GitHub repo page (README, `force-app/`, `docs/`) | "All metadata, Apex, tests, documentation and screenshots are in our GitHub repository. Thank you." |

## Demo data you can use

| Item | Value |
|---|---|
| Existing parcels | P-001 Books Box (Booked, 2.5 kg), P-002 Electronics (In Transit), P-003 Clothes (Delivered) |
| Sender | Asha Traders |
| Agent prompts | `Track parcel P-001`, `Track parcel P-999` |
| Validation | Weight `0` shows "Weight must be greater than zero." |

## After recording

1. Save the file as `SwiftShip_Tracker_Demo.mp4`.
2. Upload it:
   - **YouTube**: Create > Upload video > visibility **Unlisted** > copy the link, or
   - **Google Drive**: upload > Share > General access **Anyone with the link: Viewer** > copy link.
3. Open the SkillWallet project page:
   https://myskillwallet.ai/dashboard/skillwallet/module/salesforce-developer-nm-eng-6a69e3b28beabdd402737070/group-projects/6a6b1d2cdafa0b21ea8a08d5/Swift-Ship-Tracker-6ab7955d289ddf930366c040?tab=2
4. Click **Add Demo Link**, paste the video link, and also paste the GitHub link:
   https://github.com/praveen0-100/-swiftship-tracker
5. Test the video link in a private/incognito window to confirm it plays without logging in.
6. Deadline: Saturday, 3 October 2026.

## Ready-made video

A silent captioned slideshow version (about 1.5 minutes, built from the project screenshots) is in `video/SwiftShip_Tracker_Demo.mp4`. Upload it as-is, or record the live walkthrough above for a stronger demo.

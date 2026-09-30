<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>Parcel Details</label>
    <description>Auto-launched flow used by the Agentforce subagent. Input: Parcel ID (e.g. P-001). Output: tracking summary text.</description>
    <processMetadataValues>
        <name>BuilderType</name>
        <value><stringValue>LightningFlowBuilder</stringValue></value>
    </processMetadataValues>
    <processType>AutoLaunchedFlow</processType>
    <runInMode>SystemModeWithoutSharing</runInMode>
    <status>Active</status>
    <start>
        <locationX>50</locationX>
        <locationY>0</locationY>
        <connector><targetReference>Get_Parcel_Records</targetReference></connector>
    </start>
    <recordLookups>
        <name>Get_Parcel_Records</name>
        <label>Get Parcel Records</label>
        <locationX>50</locationX>
        <locationY>120</locationY>
        <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
        <connector><targetReference>Parcel_Found</targetReference></connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Parcel_ID__c</field>
            <operator>EqualTo</operator>
            <value><elementReference>Ids</elementReference></value>
        </filters>
        <getFirstRecordOnly>true</getFirstRecordOnly>
        <object>Parcel__c</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordLookups>
    <decisions>
        <name>Parcel_Found</name>
        <label>Parcel Found?</label>
        <locationX>50</locationX>
        <locationY>240</locationY>
        <defaultConnector><targetReference>Assign_Not_Found</targetReference></defaultConnector>
        <defaultConnectorLabel>Not Found</defaultConnectorLabel>
        <rules>
            <name>Found</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>Get_Parcel_Records</leftValueReference>
                <operator>IsNull</operator>
                <rightValue><booleanValue>false</booleanValue></rightValue>
            </conditions>
            <connector><targetReference>Assign_Outputs</targetReference></connector>
            <label>Found</label>
        </rules>
    </decisions>
    <assignments>
        <name>Assign_Outputs</name>
        <label>Assignment Outputs</label>
        <locationX>50</locationX>
        <locationY>360</locationY>
        <assignmentItems>
            <assignToReference>Output</assignToReference>
            <operator>Assign</operator>
            <value><elementReference>TrackingSummary</elementReference></value>
        </assignmentItems>
    </assignments>
    <assignments>
        <name>Assign_Not_Found</name>
        <label>Assign Not Found</label>
        <locationX>250</locationX>
        <locationY>360</locationY>
        <assignmentItems>
            <assignToReference>Output</assignToReference>
            <operator>Assign</operator>
            <value><stringValue>No parcel was found for the given Parcel ID.</stringValue></value>
        </assignmentItems>
    </assignments>
    <formulas>
        <name>TrackingSummary</name>
        <dataType>String</dataType>
        <expression>&quot;Parcel Tracking Update&quot; &amp; BR() &amp;
&quot;- Parcel Name: &quot; &amp; {!Get_Parcel_Records.Name} &amp; BR() &amp;
&quot;- Parcel ID: &quot; &amp; {!Get_Parcel_Records.Parcel_ID__c} &amp; BR() &amp;
&quot;- Status: &quot; &amp; TEXT({!Get_Parcel_Records.Status__c}) &amp; BR() &amp;
&quot;- Weight: &quot; &amp; TEXT({!Get_Parcel_Records.Weight__c}) &amp; &quot; kg&quot; &amp; BR() &amp;
&quot;- Estimated Delivery Date: &quot; &amp; TEXT({!Get_Parcel_Records.Estimated_Delivery_Date__c})</expression>
    </formulas>
    <variables>
        <name>Ids</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
    <variables>
        <name>Output</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>false</isInput>
        <isOutput>true</isOutput>
    </variables>
</Flow>

import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import s from "underscore.string";

import { addUserRolesAsync } from '../lib/roles/addUserRoles';
import { Prospects } from "../../app/models/server";
import {
  validateEmailDomain,
} from "../../app/lib";



Meteor.methods({
  async registerProspect(formData) {
    
    console.log("<<<<<<< Lead Info >>>>>>>>", formData)
    
    validateEmailDomain(formData.email);

  
    const prospectData = {
      name: formData.name? formData.name: "", // Name // string
      email: s.trim(formData.email.toLowerCase()),
      phone: formData.phone? formData.phone: "", // Phone  // strings
      prospectType: formData.type? formData.type: "",  // Type  // string
      location: formData.location? formData.location: "", // Location  // string
      street: formData.street ? formData.street: "", // Street Address  // string

      gender: formData.gender? formData.gender: "", // Gender // Male or Female
      birth: formData.birth? formData.birth: "", //Birthday // date - 08/19/1950
      height: formData.height? formData.height: "", // Height  // string
      weight: formData.weight? formData.weight: "", // Weight  // string
      tobacco: formData.tobacco? formData.tobacco: "", // Tobacco?  // No or Yes string
      relation: formData.relation? formData.relation: "", // Relation  // string


      maritalStatus: formData.maritalStatus? formData.maritalStatus: "", // Marital Status  // string
      preexistingConditions: formData.preexistingConditions? formData.preexistingConditions: "", // Pre-existing Conditions  // Yes or No string
      typeOfCondition: formData.typeOfCondition? formData.typeOfCondition: "", // Type of Condition  // string
      peopleInHousehold: formData.peopleInHousehold? formData.peopleInHousehold: "", // People in Household  // digits
      annualIncome: formData.annualIncome? formData.annualIncome: "", // Annual Income  // string

      selfEmployed: formData.selfEmployed? formData.selfEmployed: "", // self Employed  // Yes or No string
      qualifyingLifeEvent: formData.qualifyingLifeEvent? formData.qualifyingLifeEvent: "", // Qualifying Life Event  // Yes or No string
      expectantParent: formData.expectantParent? formData.expectantParent: "", // Expectant parent   // Yes or No string
      medications : formData.medications? formData.medications: "", // Medications // string
      healthOfCondition: formData.healthOfCondition? formData.healthOfCondition: "", // Health Conditions  // string
      deniedCoverage: formData.deniedCoverage? formData.deniedCoverage: "", // Denied Coverage in the Past 12 Months?  // Yes or No string
      treatedByPhysician: formData.treatedByPhysician? formData.treatedByPhysician: "", // Treated By Physician in the Past 12 Months?  // Yes or No string 
      planTypes: formData.planTypes? formData.planTypes: "", // Plan Types  // string
      optionalCoverage: formData.optionalCoverage? formData.optionalCoverage: "", // Optional Coverage  // string

      currentlyInsured: formData.currentlyInsured? formData.currentlyInsured: "",  // Currently Insured  // Yes or No string 
      policyExpires: formData.policyExpires? formData.policyExpires: "",  // Policy Expires  // string
      coveredFor: formData.coveredFor? formData.coveredFor: "",  // Covered For  // string
      currentProvider: formData.currentProvider? formData.currentProvider: "",  // Current Provider  // string
      
      leadVendor: formData.leadVendor? formData.leadVendor: "",
	    campaign: formData.campaign? formData.campaign: "",

      type: "prospect",  // not show  // string
    };
  
    let prospectId;
    try {
      // Check if prospect has already been imported and never logged in. If so, set password and let it through
      const importedProspect = Prospects.findOneByEmailAddress(formData.email);
      console.log("importedProspects===>", importedProspect)
      if (
        importedProspect 
      ) {
        // Accounts.setPassword(importedProspect._id, prospectData.password);
        prospectId = importedProspect._id;
      } else {
        prospectId = Prospects.create(prospectData);
      }
    } catch (e) {
      console.log("=========error message========", e.message);
      if (e instanceof Meteor.Error) {
        throw e;
      }

      throw new Meteor.Error(e.message);
    }

    return prospectId;
  },
});

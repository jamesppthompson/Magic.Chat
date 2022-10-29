import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import s from "underscore.string";

import { addUserRolesAsync } from '../lib/roles/addUserRoles';
import { Users } from "../../app/models/server";
import {
  validateEmailDomain,
} from "../../app/lib";



Meteor.methods({
  async registerProspect(formData) {
    
    console.log("<<<<<<< Lead Info >>>>>>>>", formData)
    
    validateEmailDomain(formData.email);

  
    const userData = {
      name: formData.name, // Name // string
      emails: [{ address: s.trim(formData.email.toLowerCase()), verify: false }], // Email // string
      phone: formData.phone, // Phone  // strings
      prospectType: formData.type,  // Type  // string
      location: formData.location, // Location  // string
      street: formData.street , // Street Address  // string

      gender: formData.gender, // Gender // Male or Female
      birth: formData.birth, //Birthday // date - 08/19/1950
      height: formData.height, // Height  // string
      weight: formData.weight, // Weight  // string
      tobacco: formData.tobacco, // Tobacco?  // No or Yes string
      relation: formData.relation, // Relation  // string


      maritalStatus: formData.maritalStatus, // Marital Status  // string
      preexistingConditions: formData.preexistingConditions, // Pre-existing Conditions  // Yes or No string
      typeOfCondition: formData.typeOfCondition, // Type of Condition  // string
      peopleInHousehold: formData.peopleInHousehold, // People in Household  // digits
      annualIncome: formData.annualIncome, // Annual Income  // string

      selfEmployed: formData.selfEmployed, // self Employed  // Yes or No string
      qualifyingLifeEvent: formData.qualifyingLifeEvent, // Qualifying Life Event  // Yes or No string
      expectantParent: formData.expectantParent, // Expectant parent   // Yes or No string
      medications : formData.medications, // Medications // string
      healthOfCondition: formData.healthOfCondition, // Health Conditions  // string
      deniedCoverage: formData.deniedCoverage, // Denied Coverage in the Past 12 Months?  // Yes or No string
      treatedByPhysician: formData.treatedByPhysician, // Treated By Physician in the Past 12 Months?  // Yes or No string 
      planTypes: formData.planTypes, // Plan Types  // string
      optionalCoverage: formData.optionalCoverage, // Optional Coverage  // string

      currentlyInsured: formData.currentlyInsured,  // Currently Insured  // Yes or No string 
      policyExpires: formData.policyExpires,  // Policy Expires  // string
      coveredFor: formData.coveredFor,  // Covered For  // string
      currentProvider: formData.currentProvider,  // Current Provider  // string
      
      type: "prospect",  // not show  // string
      roles: ["prospect"],
    };
  
    let userId;
    try {
      // Check if user has already been imported and never logged in. If so, set password and let it through
      const importedUser = Users.findOneByEmailAddress(formData.email);
      console.log(importedUser)
      if (
        importedUser &&
        importedUser.importIds &&
        importedUser.importIds.length &&
        !importedUser.lastLogin
      ) {
        // Accounts.setPassword(importedUser._id, userData.password);
        userId = importedUser._id;
      } else {
        userId = Users.create(userData);
      }
    } catch (e) {
      console.log("=========error message========", e.message);
      if (e instanceof Meteor.Error) {
        throw e;
      }

      throw new Meteor.Error(e.message);
    }

    return userId;
  },
});

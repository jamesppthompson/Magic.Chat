import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import s from "underscore.string";

import { addUserRolesAsync } from '../lib/roles/addUserRoles';
import { Users } from "../../app/models/server";
import {
  validateEmailDomain,
} from "../../app/lib";



Meteor.methods({
  async registerLead(formData) {
    
    console.log("<<<<<<< Lead Info >>>>>>>>", formData)
    
    validateEmailDomain(formData.email);

    // const obj = {
    //   gender: formData.gender,
    //   state: formData.state,
    //   street: formData.street,
    //   phone: formData.phone,
    //   birth: formData.birth,
    // };
  
    // let others = JSON.stringify(obj);
  
    const userData = {
      emails: [{ address: s.trim(formData.email.toLowerCase()), verify: false }],
      name: formData.name,
      type: "client",
      roles: ["client"],
      gender: formData.gender,
      state: formData.state,
      street: formData.street,
      phone: formData.phone,
      birth: formData.birth,
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

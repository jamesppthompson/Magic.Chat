import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import s from "underscore.string";

import { Users } from "../../app/models/server";
import {
  validateEmailDomain,
} from "../../app/lib";



Meteor.methods({
  async registerLead(formData) {
    
    console.log("<<<<<<< Lead Info >>>>>>>>", formData)
    
    validateEmailDomain(formData.email);

    const obj = {
      gender: formData.gender,
      state: formData.state,
      street: formData.street,
      phone: formData.phone,
      birth: formData.birth,
    };
  
    let others = JSON.stringify(obj);
  
    const userData = {
      email: s.trim(formData.email.toLowerCase()),
      password: "123",
      name: formData.name,
      reason: "",
    };
  
    let userId;
    try {
      // Check if user has already been imported and never logged in. If so, set password and let it through
      const importedUser = Users.findOneByEmailAddress(formData.email);
  
      if (
        importedUser &&
        importedUser.importIds &&
        importedUser.importIds.length &&
        !importedUser.lastLogin
      ) {
        Accounts.setPassword(importedUser._id, userData.password);
        userId = importedUser._id;
      } else {
        userId = Accounts.createUser(userData);
      }
    } catch (e) {
      // if (e instanceof Meteor.Error) {
      // 	console.log("=========error=========", e);
      // }
  
      console.log("=========error message========", e.message);
    }
  
    Users.setName(userId, s.trim(formData.name));
    // add for new properties
    Users.setBio(userId, others.trim());

    return userId;
  },
});
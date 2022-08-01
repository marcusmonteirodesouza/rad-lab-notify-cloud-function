const functions = require('@google-cloud/functions-framework');
// const { Firestore } = require('@google-cloud/firestore');
// const Joi = require('joi');

functions.cloudEvent('notifyRadLab', (cloudEvent) => {
  console.log(JSON.stringify(cloudEvent));
});

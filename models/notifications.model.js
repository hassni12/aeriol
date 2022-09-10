const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user  =  require('../models/User.model')
//creates new instance of mongoose.schema
const NotificationSchema = new Schema ({
  

  notifiableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: user,
        deafault:null
    },
    notificationType:{
    type:String,
    // required:true
  }
,
  title: {
    type: String,
    required: [true, 'Notfication Title']
  },
  body: {
    type: String,
    required: [true, 'Notification Message']
  },

  date: {
    type: Date,
    default: Date.now,
  },
  isread: {
    type: Boolean,
    default:false
    //TODO may have to require later when listener is added to pouchdb
  },
  payload:{
    type:{
      type:String
    },
    id:{
      type:String
    }
  },

});

NotificationSchema.set('timestamps', true)


//export model to be used in routes/api.js
module.exports = Notification=mongoose.model('Notification', NotificationSchema);
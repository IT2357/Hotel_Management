use hotel_management; db.checkinouts.updateOne({_id: ObjectId("68d2761071f7d47a7250eb79")}, {$set: {status: "checked_in"}}); db.checkinouts.findOne({_id: ObjectId("68d2761071f7d47a7250eb79")})

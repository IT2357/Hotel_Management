// 📁 backend/models/migration-js/migrate-refund-requests.js
import mongoose from "mongoose";
import RefundRequest from "../RefundRequest.js";

const migrateRefundRequests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Check if the RefundRequest collection already exists
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((collection) => collection.name);
    if (collectionNames.includes("refundrequests")) {
      console.log("RefundRequest collection already exists");
      return;
    }

    // Create the RefundRequest collection
    await RefundRequest.createCollection();
    console.log("RefundRequest collection created successfully");

    mongoose.disconnect();
  } catch (error) {
    console.error("Error migrating RefundRequest collection:", error);
    mongoose.disconnect();
  }
};

export default migrateRefundRequests;

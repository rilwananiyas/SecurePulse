require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const adminEmail = "admin@securepulse.com";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      await existingAdmin.save();

      console.log("Existing account promoted to admin.");
    } else {
      const admin = await User.create({
        name: "SecurePulse Admin",
        email: adminEmail,
        password: "Admin@12345",
        role: "admin",
      });

      console.log("Admin account created.");
      console.log("Email:", admin.email);
      console.log("Role:", admin.role);
    }

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Admin creation error:", error.message);
    process.exit(1);
  }
};

createAdmin();
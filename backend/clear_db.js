require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Staff = require('./src/models/Staff');
const Department = require('./src/models/Department');
const Visitor = require('./src/models/Visitor');

const clearData = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Bağlandı: ${conn.connection.host}`);
    
    // Her şeyi sil
    await Promise.all([
      User.deleteMany(),
      Staff.deleteMany(),
      Department.deleteMany(),
      Visitor.deleteMany()
    ]);
    
    console.log('✅ Veritabanı başarıyla temizlendi!');
    process.exit();
  } catch (error) {
    console.error(`Hata: ${error.message}`);
    process.exit(1);
  }
};

clearData();

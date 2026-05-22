import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/liameddis'
  await mongoose.connect(uri)
  console.log('MongoDB conectado:', mongoose.connection.host)
}

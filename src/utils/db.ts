import mongoose,{connect} from 'mongoose';


const dbUrl : string  = process.env.DB_URL || "";

const connectDB = async () => {

  try {
    const connection = await connect(dbUrl)
    console.log(`MongoDB connected with : ${connection.ConnectionStates.connected}`);
  } catch (error:any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

}

export {
  connectDB
}







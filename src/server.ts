import { app } from './app';
import { connectDB } from './utils/db';
require('dotenv').config();






connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  })
}).catch((err:any) => {
  console.log(err);
})

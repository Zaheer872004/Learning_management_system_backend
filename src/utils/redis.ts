import {Redis} from 'ioredis';
require('dotenv').config(); // not necessary

const redisClient = () : string => {
  if(process.env.REDIS_URL) {
    console.log("Redis Connected : " );
    return process.env.REDIS_URL;
  } 
  throw new Error('Redis URL not found');
}

export const redis = new Redis(redisClient())


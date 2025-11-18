import 'dotenv/config';

// import dotenv from 'dotenv';

// dotenv.config({ path: '../../.env' });



import { getAuthUrl } from './auth.js';
console.log('Google Auth URL:', getAuthUrl());

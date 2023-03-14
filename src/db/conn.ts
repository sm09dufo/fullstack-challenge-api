const { MongoClient } = require('mongodb');
import { ATLAS_URI } from '../loadEnvironment';

const uri = ATLAS_URI || "";

const client = new MongoClient(uri);
export default client.db('games').collection('games');
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ChatModel from '../chat.model';
import ChatController from '../chat.controller';
import {chats, users, friendRequests, privateRooms, products, publicRooms} from '../../testdata'
import router from '../chat.router'
import express from 'express';
import request from 'supertest';

let mongod;
const chatController = new ChatController();

const app = express();
app.use(express.json());
app.use('/api/chats', router);

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const connectionString = mongod.getUri();
    await mongoose.connect(connectionString, { useNewUrlParser: true });
});

beforeEach(async () => {

    await mongoose.connection.db.dropDatabase();
    const Chats = await mongoose.connection.db.createCollection('chats');
    const Users = await mongoose.connection.db.createCollection('users');
    await Chats.insertMany(chats);
    await Users.insertMany(users);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});


describe('Model Tests', () => {
    it('check chats collection', async () => {
        const chatsFromDb = await ChatModel.find({});
        expect(chatsFromDb).toBeTruthy();
        expect(chatsFromDb.length).toBe(2);

        for (let i = 0; i < chatsFromDb.length; i++) {
        expect(chatsFromDb[i]._id.toString()).toBe(chats[i]._id.toString());
        }
    });
});

describe('Controller Tests', () => {
    it('check get chat from ChatController', async() => {
        const allChatHistory = await chatController.getChat("000000000000000000000001","000000000000000000000002");
        expect(allChatHistory.length).toBe(2);

        expect(allChatHistory[0].message).toBe("hi, back!");
        expect(allChatHistory[1].message).toBe("hi, there");
    });
});

describe('Router Tests', () => {
    it('get chat history (GET /api/chats)', (done) => {
        request(app)
            .get('/api/chats/')
            .query({myId: "000000000000000000000001", customerId: "000000000000000000000002"})
            .send()
            .expect(200)
            .end(async (err, res) => {
                if (err) {
                    return done(err);
                }
                const chatHistoryFromApi = res.body;
                expect(chatHistoryFromApi).toBeTruthy();
                expect(chatHistoryFromApi.length).toBe(2);
                done();
            });
    });
});

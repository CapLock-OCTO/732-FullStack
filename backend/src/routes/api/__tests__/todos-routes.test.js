import routes from '../todos-routes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { request } from 'express';
import axios from 'axios';
import connectToDatabase from '../../../db/db-connect';
import { Todo } from '../../../db/todos-schema';
import dayjs from 'dayjs';
import dotenv from "dotenv";
dotenv.config();
// this is the solution 1
// import getToken from '../utils/fixtures'; 

// Solution 2: Use mock-jwks
import createJWKSMock from "mock-jwks";

let mongod, app, server;

jest.setTimeout(100000);

// Some dummy data to test with
const overdueTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000002'),
    title: 'OverdueTitle',
    description: 'OverdueDesc',
    isComplete: false,
    dueDate: dayjs().subtract(1, 'day').format(),
    userSub: "AaBbCcDdEeFfGgHh"
};

const upcomingTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
    title: 'UpcomingTitle',
    description: 'UpcomingDesc',
    isComplete: false,
    dueDate: dayjs().add(1, 'day').format(),
    userSub: "AaBbCcDdEeFfGgHh"
};

const completeTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000004'),
    title: 'CompleteTitle',
    description: 'CompleteDesc',
    isComplete: true,
    dueDate: dayjs().format(),
    userSub: "AaBbCcDdEeFfGgHh"
}

const dummyTodos = [overdueTodo, upcomingTodo, completeTodo];
const jwks = createJWKSMock(process.env.AUTH0_ISSUER);

const token = jwks.token({
    sub: "AaBbCcDdEeFfGgHh"
});
const authConfig = {
    headers: { Authorization: `Bearer ${token}` }
}

const token2 = jwks.token({
    sub: "1234TEST"
});
const config2 = {
    headers: { Authorization: `Bearer ${token2}` }
}

// Start database and server before any tests run
beforeAll(async done => {
    mongod = new MongoMemoryServer();

    await mongod.getUri()
        .then(cs => connectToDatabase(cs));

    app = express();
    app.use(express.json());
    app.use('/api/todos', routes);
    server = app.listen(3000, done);

});

// Populate database with dummy data before each test
beforeEach(async () => {
    await Todo.insertMany(dummyTodos);

    jwks.start();
});

// Clear database after each test
afterEach(async () => {
    await Todo.deleteMany({});

    jwks.stop();
});

// Stop db and server before we finish
afterAll(done => {
    server.close(async () => {
        await mongoose.disconnect();
        await mongod.stop();
        done();
    });
});

it('retrieves all todos successfully', async () => {
    const response = await axios.get('http://localhost:3000/api/todos', authConfig);
    expect(response.status).toBe(200);
    const responseTodos = response.data;
    expect(responseTodos.length).toBe(3);

    for (let i = 0; i < responseTodos.length; i++) {
        const responseTodo = responseTodos[i];
        const expectedTodo = dummyTodos[i];

        expect(responseTodo._id.toString()).toEqual(expectedTodo._id.toString());
        expect(responseTodo.title).toEqual(expectedTodo.title);
        expect(responseTodo.description).toEqual(expectedTodo.description);
        expect(responseTodo.isComplete).toEqual(expectedTodo.isComplete);
        expect(dayjs(responseTodo.dueDate)).toEqual(dayjs(expectedTodo.dueDate));
    }
});

it('retrieves a single todo successfully', async () => {
    const response = await axios.get('http://localhost:3000/api/todos/000000000000000000000003', authConfig);
    expect(response.status).toBe(200);

    const responseTodo = response.data;
    expect(responseTodo._id.toString()).toEqual(upcomingTodo._id.toString());
    expect(responseTodo.title).toEqual(upcomingTodo.title);
    expect(responseTodo.description).toEqual(upcomingTodo.description);
    expect(responseTodo.isComplete).toEqual(upcomingTodo.isComplete);
    expect(dayjs(responseTodo.dueDate)).toEqual(dayjs(upcomingTodo.dueDate));
});

it('returns a 404 when attempting to retrieve a nonexistant todo (valid id)', async () => {

    try {
        await axios.get('http://localhost:3000/api/todos/000000000000000000000001', authConfig);
        fail('Should have thrown an exception.');
    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(404);
    }
});

it('returns a 400 when attempting to retrieve a nonexistant todo (invalid id)', async () => {
    try {
        await axios.get('http://localhost:3000/api/todos/blah', authConfig);
        fail('Should have thrown an exception.');
    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(400);
        expect(response.data).toBe('Invalid ID');
    }
});

it('Creates a new todo', async () => {
    const newTodo = {
        title: 'NewTodo',
        description: 'NewDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.post('http://localhost:3000/api/todos', newTodo, authConfig);

    // Check response is as expected
    expect(response.status).toBe(201);
    expect(response.data).toBeDefined();
    const rTodo = response.data;
    expect(rTodo.title).toBe('NewTodo');
    expect(rTodo.description).toBe('NewDesc');
    expect(rTodo.isComplete).toBe(false);
    expect(dayjs(rTodo.dueDate)).toEqual(dayjs('2100-01-01'));
    expect(rTodo._id).toBeDefined();
    expect(response.headers.location).toBe(`/api/todos/${rTodo._id}`);

    // Check that the todo was actually added to the database
    const dbTodo = await Todo.findById(rTodo._id);
    expect(dbTodo.title).toBe('NewTodo');
    expect(dbTodo.description).toBe('NewDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));

});

it('Gives a 400 when trying to create a todo with no title', async () => {
    try {
        const newTodo = {
            description: 'NewDesc',
            isComplete: false,
            dueDate: dayjs('2100-01-01').format()
        }

        await axios.post('http://localhost:3000/api/todos', newTodo, authConfig);
        fail('Should have thrown an exception.');
    } catch (err) {

        // Ensure response is as expected
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(400);

        // Ensure DB wasn't modified
        expect(await Todo.countDocuments()).toBe(3);
    }
})

it('updates a todo successfully', async () => {
    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000004'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.put('http://localhost:3000/api/todos/000000000000000000000004', toUpdate, authConfig);

    // Check response
    expect(response.status).toBe(204);

    // Ensure DB was updated
    const dbTodo = await Todo.findById('000000000000000000000004');
    expect(dbTodo.title).toBe('UPDCompleteTitle');
    expect(dbTodo.description).toBe('UPDCompleteDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));


})

it('Uses the path ID instead of the body ID when updating', async () => {
    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.put('http://localhost:3000/api/todos/000000000000000000000004', toUpdate, authConfig);

    // Check response
    expect(response.status).toBe(204);

    // Ensure correct DB entry was updated
    let dbTodo = await Todo.findById('000000000000000000000004');
    expect(dbTodo.title).toBe('UPDCompleteTitle');
    expect(dbTodo.description).toBe('UPDCompleteDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));

    // Ensure incorrect DB entry was not updated
    dbTodo = await Todo.findById('000000000000000000000003');
    expect(dbTodo.title).toBe('UpcomingTitle');
    expect(dbTodo.description).toBe('UpcomingDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs(upcomingTodo.dueDate));
})

it('Gives a 404 when updating a nonexistant todo', async () => {

    try {
        const toUpdate = {
            _id: new mongoose.mongo.ObjectId('000000000000000000000010'),
            title: 'UPDCompleteTitle',
            description: 'UPDCompleteDesc',
            isComplete: false,
            dueDate: dayjs('2100-01-01').format()
        }

        await axios.put('http://localhost:3000/api/todos/000000000000000000000010', toUpdate, authConfig);
        fail('Should have returned a 404');

    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(404);

        // Make sure something wasn't added to the db
        expect(await Todo.countDocuments()).toBe(3);
    }

})

it('Deletes a todo', async () => {
    const response = await axios.delete('http://localhost:3000/api/todos/000000000000000000000003', authConfig);
    expect(response.status).toBe(204);

    // Check db item was deleted
    expect(await Todo.findById('000000000000000000000003')).toBeNull();

})

it('Doesn\'t delete anything when it shouldn\'t', async () => {
    const response = await axios.delete('http://localhost:3000/api/todos/000000000000000000000010', authConfig);
    expect(response.status).toBe(204);

    // Make sure something wasn't deleted from the db
    expect(await Todo.countDocuments()).toBe(3);

})

//Task3 Q2
it('T3Q2: Return 401 when getting all todos but user not authorised', async () => {
    let error;
    await axios.get('http://localhost:3000/api/todos').catch(err => error = err.response.status)
    expect(error).toBe(401);
})

it('T3Q2: Return 401 when get single todo but but user not authorised', async () => {
    let error;
    await axios.get('http://localhost:3000/api/todos/000000000000000000000003').catch(err => error = err.response.status)
    expect(error).toBe(401);
})


it('T3Q2: Return 401 when create todo but user not authorised', async () => {
    const newTodo = {
        title: 'NewTodo1',
        description: 'NewDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }
    
    let error;
    await axios.post('http://localhost:3000/api/todos', newTodo).catch(err => error = err.response.status)
    expect(error).toBe(401);
    // Ensure DB wasn't modified
    expect(await Todo.countDocuments()).toBe(3);
})

it('T3Q2: Return 401 when update todo but user not authorised', async () => {
    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    let error;
    await axios.put('http://localhost:3000/api/todos/000000000000000000000003', toUpdate).catch(err => error = err.response.status)
    expect(error).toBe(401);
    // Ensure DB wasn't modified
    expect(await Todo.countDocuments()).toBe(3);
})

it('T3Q2: Return 401 when deleting todo but user not authorised', async () => {
    let error;
    await axios.delete('http://localhost:3000/api/todos/000000000000000000000003').catch(err => error = err.response.status)
    expect(error).toBe(401);
    // Ensure DB wasn't modified
    expect(await Todo.countDocuments()).toBe(3);
})


//Task3 Q3
it('T3Q3: Return 401 when get single todo but user not authorised', async () => {
    let error;
    await axios.get('http://localhost:3000/api/todos/000000000000000000000003').catch(err => error = err.response.status, config2)
    expect(error).toBe(401);
})

it('T3Q3: Return 401 when update todo but the updated todo do not belongs to that authenticated user', async () => {
    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    let error;
    await axios.put('http://localhost:3000/api/todos/000000000000000000000003', toUpdate, config2).catch(err => error = err.response.status)
    expect(error).toBe(401);
    // Ensure DB wasn't modified
    expect(await Todo.countDocuments()).toBe(3);
})

it('T3Q3: Return 401 when deleting todo but the todo do not belongs to that authenticated user', async () => {
    let error;
    await axios.delete('http://localhost:3000/api/todos/000000000000000000000003', config2).catch(err => error = err.response.status)
    expect(error).toBe(401);
    // Ensure DB wasn't modified
    expect(await Todo.countDocuments()).toBe(3);
})
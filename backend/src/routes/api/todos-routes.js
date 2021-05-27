import express from 'express';
import * as todosDao from '../../db/todos-dao';
import mongoose from 'mongoose';
import checkJwt from "./checkJwt";

// const HTTP_OK = 200; // Not really needed; this is the default if you don't set something else.
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_NO_AUTHORISE = 401;

const router = express.Router();

// TODO Exercise Four: Add your RESTful routes here.
// Error handler
router.use("/", checkJwt, function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        return res.status(HTTP_NO_AUTHORISE).send({ msg: "Invalid token" });
    }

    next(err, req, res);
});

/**
 * A trick to include the check for a valid id in one place, rather than in every single method that needs it.
 * If "next()" is called, the next route below that matches will be called. Otherwise, we just end the response.
 * The "use()" function will match ALL HTTP request method types (i.e. GET, PUT, POST, DELETE, etc).
 */
router.use('/:id', checkJwt, async (req, res, next) => {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
        next();
    }
    else {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('Invalid ID');
    }
});

// Create todo
router.post('/', checkJwt, async (req, res) => {
    if (!req.body.title) {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('New todos must have a title');
        return;
    }
    const userSub = req.user.sub;
    const newTodo = await todosDao.createTodo({ ...req.body, userSub });
    res.status(HTTP_CREATED)
        .header('location', `/api/todos/${newTodo._id}`)
        .json(newTodo);
});

// Retrieve todo list
router.get('/', checkJwt, async (req, res) => {
    const userSub = req.user.sub;
    // Uncomment this code if you want to introduce an artificial delay.
    // setTimeout(async () => {
    //     res.json(await todosDao.retrieveAllTodos());
    // }, 2000);

    // Comment this code if you want to introduce an artificial delay.
    res.json(await todosDao.retrieveAllTodos(userSub));
});

// Retrieve single todo
router.get('/:id', checkJwt, async (req, res) => {
    const { id } = req.params;
    const userSub = req.user.sub;
    const todo = await todosDao.retrieveTodo(id);
    if (todo) {
        if (todo.userSub !== userSub) { res.sendStatus(HTTP_NO_AUTHORISE); return };
        res.json(todo);
    }
    else {
        res.sendStatus(HTTP_NOT_FOUND);
    }
});

// Update todo
router.put('/:id', checkJwt, async (req, res) => {
    const { id } = req.params;
    const userSub = req.user.sub;
    const todo = {
        ...req.body,
        _id: id
    };
    const result = await todosDao.updateTodo(todo, userSub);
    if (result == HTTP_NO_CONTENT) { res.sendStatus(HTTP_NO_CONTENT); };
    if (result == HTTP_NOT_FOUND) { res.sendStatus(HTTP_NOT_FOUND); };
    if (result == HTTP_NO_AUTHORISE) { res.sendStatus(HTTP_NO_AUTHORISE); };
    // res.sendStatus(success ? HTTP_NO_CONTENT : HTTP_NOT_FOUND);
});

// Delete todo
router.delete('/:id', checkJwt, async (req, res) => {
    const { id } = req.params;
    const userSub = req.user.sub;
    const result = await todosDao.deleteTodo(id, userSub);
    if (result == HTTP_NO_AUTHORISE) {
        res.sendStatus(HTTP_NO_AUTHORISE);
    } else { res.sendStatus(HTTP_NO_CONTENT) };
})

export default router;
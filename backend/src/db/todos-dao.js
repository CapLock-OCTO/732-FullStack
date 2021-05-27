/**
 * This file contains functions which interact with MongoDB, via mongoose, to perform Todo-related
 * CRUD operations.
 */

import { Todo } from "./todos-schema";

// TODO Exercise Three: Implement the five functions below.

export async function createTodo(todo) {
    const dbTodo = new Todo(todo);
    await dbTodo.save();
    return dbTodo;
}

export async function retrieveAllTodos(sub) {
    return await Todo.find({ userSub: sub });
}

export async function retrieveTodo(id) {
    return await Todo.findById(id);
}

// A much cleaner way of updating the data compared to the way shown in the video and previous examples...
export async function updateTodo(todo, userSub) {
    const target = await Todo.findById(todo._id);
    if (target.userSub !== userSub) { 
        return 401 
    } else {
        const result = await Todo.findByIdAndUpdate(todo._id, todo, { new: true, useFindAndModify: false });
        return result ? 204 : 404;
    };
}

export async function deleteTodo(id, userSub) {
    const target = await Todo.findById(id);
    if (target.userSub !== userSub) { 
        return 401 
    } else {
        const result = await Todo.deleteOne({ _id: id });
        return result ? 204 : 404;
    };
}
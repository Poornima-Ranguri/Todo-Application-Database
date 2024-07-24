const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at localhost//3000");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityQuery = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusQuery = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoItemQuery = `
        SELECT
          *
        FROM
            todo
        WHERE
            id = '${todoId}';    
  `;
  const resultItem = await database.get(getTodoItemQuery);
  response.send(resultItem);
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const postTodoQuery = `
        INSERT INTO
                todo(id, todo, priority, status)
        VALUES
                (${id}, '${todo}', '${priority}', '${status}');       
  `;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 --PUT

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let resultResponse = "";

  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      resultResponse = "Status";

      break;
    case requestBody.priority !== undefined:
      resultResponse = "Priority";
      break;

    default:
      resultResponse = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`; //Depending on the data in the request body, updateColumn will hold the name of the aspect being updated.
  const previousTodo = await database.get(previousTodoQuery); //The code fetches the current data of the todo item from the database to have a reference for the update.
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body; //The code extracts the updated values for the todo item from the request body. If a value isn't provided, it retains the previous value.

  const updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`;
  await database.run(updateTodoQuery); //Using the extracted data, the code constructs an SQL query to update the todo item's information in the database.
  response.send(`${resultResponse} Updated`); //Sending the required response.
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

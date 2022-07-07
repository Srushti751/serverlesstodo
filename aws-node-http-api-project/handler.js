"use strict";
const connectToDatabase = require("./db");
const Note = require("./models/Note");
const moment = require("moment");

//To create a Todo
module.exports.create = (event, context, callback) => {
  // context.callbackWaitsForEmptyEventLoop = false;

  connectToDatabase().then(() => {
    // obj[time][title] = taskArray
    Note.create(JSON.parse(event.body))
      .then((note) =>
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(note),
        })
      )
      .catch((err) =>
        callback(null, {
          statusCode: err.statusCode || 500,
          body: err.message,
        })
      );
  });
};

// To get a todo by its Id
module.exports.getOne = async (event, context, callback) => {
  let conn = connectToDatabase();
  try {
    if (conn) {
      let note = await Note.findById(event.pathParameters.id);
      if (note) {
        const time = note.time;
        const day = note.day;
        const date = note.created_at;
        const title = note.title;
        const taskArray = note.taskArray;

        let todo = {};
        todo[date] = {
          [time + day]: {
            [title]: taskArray,
          },
        };

        return {
          statusCode: 200,
          body: JSON.stringify(todo),
          headers: { "Content-Type": "application/json" },
        };
      }
    }
  } catch (error) {
    return error.message;
  }
};

// To get All Todos
module.exports.getAll = async (event, context, callback) => {
  console.log("-------event received----", event);
  let conn = connectToDatabase();
  console.log("------con--", conn);
  try {
    if (conn) {
      const notes = await Note.find();
      console.log("notes=========>", notes);
      const newnote = await notes.map((note) => {
        const time = note.time;
        const day = note.day;
        const date = note.created_at;
        // const date1 = date.toDateString().split();
        let date2 = moment(date).format("YYYY-MM-DD");
        const title = note.title;
        const taskArray = note.taskArray;
        var tomorrow = moment(date2).format("YYYY-MM-DD[T00:00:00.000Z]");
        console.log("tomorrow", tomorrow);
        console.log("date", date);

        let todo = {};
        todo[date] = {
          [time + day]: {
            [title]: taskArray,
          },
        };
        console.log("todo=========>", todo);

        return todo;
      });

      return {
        statusCode: 200,
        body: JSON.stringify(newnote),
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ newnote: true }),
      };
    }
  } catch (error) {
    console.log("error------", error);
    return error;
  }
};

// To update the status of particular todo
module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const res = JSON.parse(event.body);
  let conn = connectToDatabase();
  try {
    if (conn) {
      let note = await Note.findOneAndUpdate(
        {
          _id: event.pathParameters.id,
          taskArray: { $elemMatch: { _id: event.pathParameters.todoid } },
        },
        {
          $set: {
            "taskArray.$.done": res.done, // UPDATE
          },
        },
        {
          new: true,
        }
      );

      return {
        body: JSON.stringify(note),
      };
    }
  } catch (error) {
    return error;
  }
};

//To Delete complete Todo
module.exports.delete = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let conn = connectToDatabase();

  try {
    if (conn) {
      let delnote = await Note.findByIdAndRemove(event.pathParameters.id);

      return {
        statusCode: 200,
        body: JSON.stringify("Deleted", delnote),
      };
    }
  } catch (error) {
    return error;
  }
};

// To delete one particular todo from arrayof todos
module.exports.deleteOne = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let conn = connectToDatabase();

  try {
    if (conn) {
      await Note.updateOne(
        {
          _id: event.pathParameters.id,
        },
        {
          $pull: {
            taskArray: {
              _id: event.pathParameters.todoid,
            },
          },
        }
      );

      return {
        body: `removed ${event.pathParameters.todoid}`,
      };
    }
  } catch (error) {
    return error;
  }
};

//To get todo by date
module.exports.getByDate = async (event, context, callback) => {
  let conn = connectToDatabase();
  try {
    if (conn) {
      let notes = await Note.find({
        created_at: { $eq: JSON.parse(event.body).created_at },
      });

      console.log("date", notes);
      let newnote = notes.map((note) => {
        const time = note.time;
        const day = note.day;
        const date = note.created_at;
        const title = note.title;
        const taskArray = note.taskArray;

        let todo = {};
        todo[date] = {
          [time + day]: {
            [title]: taskArray,
          },
        };

        return {
          todo,
        };
      });

      return {
        statusCode: 200,
        body: JSON.stringify(newnote),
      };
    }
  } catch (error) {
    return error;
  }
};

module.exports.authorizer = async function (event) {
  const queryStringParams = event.queryStringParameters.auth;
  // const header = event.headers.approval;

  const methodArn = event.methodArn;

  if (queryStringParams == "yes") {
    console.log("Ia m called");
    return generateAuthResponse("user", "Allow", methodArn);
  } else return generateAuthResponse("user", "Deny", methodArn);
};

function generateAuthResponse(principalId, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn);

  return {
    principalId,
    policyDocument,
  };
}

// To get permission from aws
function generatePolicyDocument(effect, methodArn) {
  if (!effect || !methodArn) return null;

  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };

  return policyDocument;
}

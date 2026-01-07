const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Task = require('./models/Task.model');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const authMiddleware = require('./middlewares/auth.middlewares');
const { createTaskSchema } = require('./validations/task.validation');
const { updateTaskSchema } = require('./validations/task.validation');


const errorHandler = require('./middlewares/error.middleware.js');  






const { status } = require('express/lib/response');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGODB_URL;

app.use(bodyParser.json());

//objectId validation utility function
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id); 
 
mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("Connected to the database successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Cannot connect to the database", err);
    process.exit();
  });







// app.get('/task', async (req, res) => {
//   console.log("GET request for all tasks");
//   try {
//     let data = await Task.find();
//     console.log(data);
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.post('/tasks', async (req, res) => {
//   try {
//     const { title, description, completed, owner } = req.body;

//     // 🔒 Manual validation
//     if (!title || !owner) {
//       return res.status(400).json({
//         error: 'title and owner are required'
//       });
//     }

//     const task = new Task({
//       title,
//       description,
//       completed,
//       owner
//     });

//     const savedTask = await task.save();
//     res.status(201).json(savedTask);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.post('/addtask' , async(req,res) => {
//     try{
//         // const newTask = new Task({
//         //     title : 'Complete CRUD Operations',
//         //     description : 'Reading harry potter series',
//         //     completed : false
//         // });
//         // const newTask = new Task(req.body);
//         // c
//         // const savedTask = await newTask.save();
//         // console.log('Task added successfully:', savedTask);
//         // res.status(201).json({ message: 'Task added successfully', task: savedTask });

//         const {title, description, completed,name} = req.body;

//         const newTask = new Task(req.body);

//         const savedTask = await newTask.save();

//         res.status(201).json({ message: 'Task added successfully', task: savedTask });

//         }catch (err)
//     {
//         // console.error('Error adding task:', err);
//         res.status(500).json({ error: err.message });
//     }
// })


// app.patch('/updatetask/:taskId', async(req,res) => {
//     const taskId= req.params.taskId;
//    if (!mongoose.Types.ObjectId.isValid(taskId)) {
//     return res.status(400).json({ error: 'Invalid Task ID format' });
//   }

//     try{
//         const updatedTask = await Task.findByIdAndUpdate(
//             taskId,
//             { completed : true},
//             { new : true}
//         );
//         if(!updatedTask)
//         {
//           return res.status(404).json({ error: 'Task Id Not found: ' });
//         }

//         console.log('Task Updated successfully: ', updatedTask);
//         res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
//     } catch(error){
//         console.error('Error updating task:' , error);
//         res.status(500).json({ error: error.message });
//     }
// })

// app.delete(('/deletetask/:taskId'), async(req,res) => {
//   const taskId = req.params.taskId;
//   if (!mongoose.Types.ObjectId.isValid(taskId)) {
//     return res.status(400).json({ error: 'Invalid Task ID format' });
//   }


//   try{
//     const deletedTask = await Task.findByIdAndDelete(taskId);
//     if(!deletedTask) 
//     {
//       return res.status(404).json({error: 'Task Id Not found: '});
//     }
//     console.log('Task deleted successfully: ', deletedTask);
//     res.status(200).json({ message: 'Task deleted Successfully:' });

//   } catch(error){
//     console.error('Error deleting task: hbf ' , error);
//     res.status(500).json({error: error.message + ' getting error'})
//   }
// });



//------------------- JWT Implementation for viewing Task for paticular user ------------------//

app.post('/auth/register' , async(req,res) => {
  try
  {
    const {name, email, password, role} = req.body;
    // console.log(req.body);

    if(!name || !email || !password)
    {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }
    const existingUser = await User.findOne({ email});
    if(existingUser)
    {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password : hashedPassword,
      role: role || 'user' 

    });

    const savedUser = await newUser.save();

    res.status(201).json({ message: 'User registered successfully', 
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      } 
    });
  
  }catch (error)
  {
    console.error('Error registering user: ', error);
    res.status(500).json({ error: error.message +'Internal Server Error' });
  }
});


app.post('/auth/login', async (req,res, next) => {
  try 
  {
    const {email, password } = req.body;

    if(!email || !password)
    {
      const err = new Error('Email and Password are required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({email});
    if(!user)
    {
      const err = new Error('User not found Invalid credentials');
      err.statusCode = 401;
      return next(err);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid)
    {
      const err = new Error('Password not matching Invalid Credentials');
      err.statusCode = 401;
      return next(err);
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email : user.email,
        role: user.role
      }
    });


  }
  catch (error)
  {
    next(error);
    // res.status(500).json({ error: error.message + ' Internal Server Error' });
  }
});

app.get('/protected', authMiddleware, async (req,res) => {
  try
  {
    const tasks = await Task.find({owner: req.user.id});
    res.json(tasks);
  }catch(error)
  {
    res.status(500).json({ error: 'Internal Server Error'})
  }
});



//adding jwt for task functionality above may be obsolute

app.post('/tasks', authMiddleware, async (req, res, next) =>
{
  try{
    const{ error, value } =createTaskSchema.validate(req.body);

    if(error)
    {
      const err = new Error(error.details[0].message);
      err.statusCode = 400;
      return next(err);
    }

    const task = new Task({
      ...value,
      owner: req.user.id
    });

    const savedTask = await task.save();

    res.status(201).json({savedTask}, ' Task created successfully');

  }catch(error)
  {
    next(error);
  }
});

app.get('/tasks', authMiddleware, async (req,res) => {
  try 
  {
    const tasks= await Task.find({owner: req.user.id});
    return res.json(tasks);
  }
  catch(error)
  {
    next(error);
  }
});


app.patch('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    
    // console.log(req.body);

    
    //validate ObjectID
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
    {
      const error = new Error('Invalid Task ID format');
      error.statusCode = 400;
      return next(error);
    }

   const { error , value } = updateTaskSchema.validate(req.body);

   if(error)
   {
    const errObj = new Error(error.details[0].message);
    errObj.statusCode = 400;
    return next(errObj); 
   }


    const task = await Task.findOneAndUpdate(
      
        {_id: req.params.id, owner: req.user.id},
        { $set: value},
        {new: true}
      
    );

    // if(Object.keys(updates).length ===0)
    // {
    //   return res.status(400).json({ error : 'No valid fields provided for update' });
    // }

    
    if (!task) {
      const errObj = new Error("Task not found or authorized");
      errObj.statusCode = 404;
      return next(errObj);
    }

    res.json(task);
  
  } catch (err) {
    next(err);
  }
});



app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    //object Validation
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
    {
      const err = new Error("Invalid Task ID");
      err.statusCode = 400;
      return next(err);
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!task) {
      const err = new Error("Task not found or unauthorized");
      err.statusCode = 404;
      return next(err);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

//------------------- END JWT Implementation for viewing Task for paticular user------------------//

app.use(errorHandler);
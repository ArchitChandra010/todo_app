const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Task = require('./models/Task.model');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const authMiddleware = require('./middlewares/auth.middlewares');


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


app.post('/auth/login', async (req,res) => {
  try 
  {
    const {email, password } = req.body;

    if(!email || !password)
    {
      return res.status(400).json({ error: 'Email and password are required ' });
    }

    const user = await User.findOne({email});
    if(!user)
    {
      return res.status(401).json({ error: 'User not found Invalid credentials'});
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid)
    {
      return res.status(401).json({ error : 'Password not matching Invalid Credentials'});
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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

app.post('/tasks', authMiddleware, async (req, res) =>
{
  try{
    const{ title, description } = req.body;

    const task = new Task({
      title,
      description,
      owner: req.user.id
    });

    const savedTask = await task.save();

    res.status(201).json({savedTask}, ' Task created successfully');

  }catch(error)
  {
    res.status(500).json({error : error.message + 'Internal Server Error: Authentication Failed' });
  }
});

app.get('/tasks', authMiddleware, async (req,res) => {
  try 
  {
    const tasks= await Task.find({owner: req.user.id});
    res.json(tasks);
  }
  catch(error)
  {
    res.status(500).json({error : error.message + ' Internal Server Error:token missing' });
  }
});


app.patch('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    
    console.log(req.body);
    
    //validate ObjectID
    if(!isValidObjectId(req.params.id))
    {
      return res.status(400).json({ error : 'Invalid Task ID format' });
    }

    const allowedUpdates = ['title', 'description', 'completed'];
    const updates = {};
    console.log('JWT USER:', req.user.id);
    console.log('TASK ID:', req.params.id);

    for(const key of allowedUpdates)
    {
      if(req.body[key] !== undefined)
      {
        updates[key] = req.body[key];
      }
    }

    if(Object.keys(updates).length ===0)
    {
      return res.status(400).json({ error : 'No valid fields provided for update' });
    }


    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: updates },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }


    res.json(task);
  
  } catch (err) {
    res.status(500).json({ error: err.message + ' Internal Server Error:token missing' });
  }
});



app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    //object Validation
    if(!isValidObjectId(req.params.id))
    {
      return res.status(400).json({ error : 'Invalid Task ID format' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//------------------- END JWT Implementation for viewing Task for paticular user------------------//

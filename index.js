const express = require('express');
const app = express();
const path = require('path');
const port = 8080;
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Task = require('./models/task');

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

main().then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/taskmanager');
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
    res.redirect('/tasks');
});

app.get('/tasks', async(req, res) => {
    let filter = {};
    if (req.query.status === 'completed') {
        filter.completed = true;
    }
    if (req.query.status === 'pending') {
        filter.completed = false;
    }
    if (req.query.search) {
        filter.title = { 
            $regex: req.query.search, 
            $options: 'i' };
    }
    let tasks = await Task.find(filter);
  res.render('index.ejs', { tasks });
});

app.get('/tasks/new', (req, res) => {
    res.render('new.ejs');
});

app.post('/tasks', async (req, res) => {
    let { title, description, dueDate, priority } = req.body;
    let task = new Task({ title, description, dueDate, priority });
    await task.save();
    res.redirect('/tasks');
});

app.get('/tasks/:id/edit', async (req, res) => {
    let { id } = req.params;
    let task = await Task.findById(id);
    res.render('edit.ejs', { task });
});

app.put('/tasks/:id', async (req, res) => {
    let { id } = req.params;
    let { title, description, dueDate, priority, completed } = req.body;
    await Task.findByIdAndUpdate(id, { title, description, dueDate, priority, completed: completed === 'on' });
    res.redirect('/tasks');
});

app.put('/tasks/:id/toggle', async (req, res) => {
    let { id } = req.params;
    let task = await Task.findById(id); 
    task.completed = !task.completed;
    await task.save();
    res.redirect('/tasks');
});

app.delete('/tasks/:id', async (req, res) => {
    let { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.redirect('/tasks');
});

app.get('/tasks/:id', async (req, res) => {
    let { id } = req.params;
    let task = await Task.findById(id);
    res.render('show.ejs', { task });
});
const express = require('express');
const app = express();
const path = require('path');
const port = 8080;
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Task = require('./models/task');
const User = require('./models/user');

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION CONFIGURATION
const sessionOptions = {
    secret: 'mysupersecretkey',
    resave: false,
    saveUninitialized: false
};

app.use(session(sessionOptions));

// PASSPORT CONFIGURATION
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// CONNECT MONGODB
main()
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log(err));

async function main() {
    await mongoose.connect(
        'mongodb://127.0.0.1:27017/taskmanager'
    );
}

// START SERVER
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// GLOBAL USER
app.use((req, res, next) => {

    res.locals.currentUser = req.user;

    next();
});

// AUTH MIDDLEWARE
function isLoggedIn(req, res, next){

    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/login');
}

// HOME
app.get('/', (req, res) => {
    res.redirect('/tasks');
});

// SIGNUP PAGE
app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

// SIGNUP LOGIC
app.post('/signup', async (req, res) => {

    try{

        let { username, password } = req.body;

        let newUser = new User({ username });

        let registeredUser = await User.register(
            newUser,
            password
        );

        console.log(registeredUser);

        res.redirect('/login');

    }catch(err){

        console.log(err);

        res.send(err.message);
    }
});

// LOGIN PAGE
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// LOGIN LOGIC
app.post(
    '/login',

    passport.authenticate('local', {
        failureRedirect: '/login'
    }),

    (req, res) => {

        res.redirect('/tasks');
    }
);

// LOGOUT
app.get('/logout', (req, res, next) => {

    req.logout((err) => {

        if(err){
            return next(err);
        }

        res.redirect('/login');
    });
});

// ALL TASKS
app.get('/tasks', isLoggedIn, async(req, res) => {

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
            $options: 'i'
        };
    }

    let tasks = await Task.find(filter);

    res.render('index.ejs', { tasks });
});

// CREATE PAGE
app.get('/tasks/new', isLoggedIn, (req, res) => {

    res.render('new.ejs');
});

// CREATE TASK
app.post('/tasks', isLoggedIn, async (req, res) => {

    let {
        title,
        description,
        dueDate,
        priority
    } = req.body;

    let task = new Task({
        title,
        description,
        dueDate,
        priority
    });

    await task.save();

    res.redirect('/tasks');
});

// SHOW TASK
app.get('/tasks/:id', isLoggedIn, async (req, res) => {

    let { id } = req.params;

    let task = await Task.findById(id);

    res.render('show.ejs', { task });
});

// EDIT PAGE
app.get('/tasks/:id/edit', isLoggedIn, async (req, res) => {

    let { id } = req.params;

    let task = await Task.findById(id);

    res.render('edit.ejs', { task });
});

// UPDATE TASK
app.put('/tasks/:id', isLoggedIn, async (req, res) => {

    let { id } = req.params;

    let {
        title,
        description,
        dueDate,
        priority,
        completed
    } = req.body;

    await Task.findByIdAndUpdate(id, {
        title,
        description,
        dueDate,
        priority,
        completed: completed === 'on'
    });

    res.redirect('/tasks');
});

// TOGGLE STATUS
app.put('/tasks/:id/toggle', isLoggedIn, async (req, res) => {

    let { id } = req.params;

    let task = await Task.findById(id);

    task.completed = !task.completed;

    await task.save();

    res.redirect('/tasks');
});

// DELETE TASK
app.delete('/tasks/:id', isLoggedIn, async (req, res) => {

    let { id } = req.params;

    await Task.findByIdAndDelete(id);

    res.redirect('/tasks');
});
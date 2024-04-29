const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const expressSession = require('express-session');
const app = express();
const indexRoutes = require('./router');
const { sequelize } = require('./models/models');
const flash = require('connect-flash')
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(flash());


app.use(expressSession({
    secret: 'danceingcat',
    saveUninitialized: true,
    resave: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(flash());
app.use(indexRoutes);


app.use((req, res, next) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found' });
next()
})
const connect = async() =>{
    try {
        await sequelize.authenticate()
        await sequelize.sync({alter: false})
        console.log('connected to db')
        return sequelize
    } catch (error) {
        console.log(error)
        return({message: error.message})
    }
}

connect()

app.listen(3000, () => {
    console.log('listening on port 3000');
});
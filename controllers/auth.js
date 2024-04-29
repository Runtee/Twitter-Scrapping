const bcrypt = require('bcrypt');
const { User, PersonalInformation } = require('../models/models');
const { use } = require('../router');

exports.getLogin = async (req, res) => {
    try {
        // Check if an admin user already exists
        const adminExists = await User.findOne({ where: { Username: "admin" } });
        if (!adminExists) {
            // If no admin user, create one
            // const hashedPassword = bcrypt.hashSync("admin", 12); // Hash the password
            await User.create({
                Username: "admin",
                PasswordHash: "admin", // Store the hashed password
                Email: "admin@gmail.com",
                Role: "Admin",
                Status: "Active" // Assuming there's a Status field to indicate the user's status
            });
        }
        // Render the login page
        res.render('login', { title: 'Login', message: "" });
    } catch (error) {
        console.error("Failed to check or create admin:", error);
        res.status(500).send("Error processing your login request");
    }
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({
            where: { Username: username } // Correct attribute for Sequelize
        });

        // Check if user was found
        if (!user) {
            console.log(user, "-")
            res.render('login', { message: 'Invalid username or password' });
            return;
        }
        console.log(user)

        // Validate password using bcrypt because validatePassword method assumes bcrypt checking
        const isMatch = user.validatePassword(password);

        // Check password match
        if (!isMatch) {
            console.log(isMatch, "-")
            res.render('login', { message: 'Invalid username or password' });
            return;
        }

        // Store user information in session
        req.session.userId = user.UserID; // Assuming UserID is the primary key
        req.session.role = user.Role; // Storing role to session for role-based access control

        // Redirect based on role
        if (user.Role === "Admin") {
            res.redirect('/admin-dashboard'); // Redirect admin to the admin dashboard
        } else {
            // Assuming you need to store personal information for a non-admin user
            const personalInfo = await PersonalInformation.findOne({
                where: { UserID: user.UserID },
                raw: true
            });
            req.session.user = user
            req.session.personalInformationId = personalInfo ? personalInfo.PersonalInfoID : null;
            req.session.personalInformation = personalInfo ? personalInfo : null;
            res.redirect('/dashboard'); // Redirect regular users to a different dashboard
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { message: 'Server error during authentication' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard'); // In case of error, redirect back to dashboard
        }
        res.clearCookie('connect.sid'); // Clear the cookie set by connect-mongo
        res.redirect('/login');
    });
};


exports.changePasswordView = (req, res) => {
    res.render('changePassword', {
        errors: req.flash('error'),
        success: req.flash('success'),
        pageTitle: 'change password',
        personalInformation: req.session.personalInformation,


    })
};

exports.changePassword = async (req, res) => {
    const password = req.body.password;
    const newPassword = req.body.npassword;
    const Confirmpassword = req.body.cpassword;
    var id = req.session.userId
    const user = await User.findByPk(id)
    bcrypt.compare(password, user.PasswordHash, async (error, same) => {
        if (same) {
            if (newPassword === Confirmpassword) {
                var newhash = await bcrypt.hash(newPassword, 12)
                user.PasswordHash = newhash
                await user.save()
                req.flash('success', 'Password successfuly changed')
                res.redirect('/dashboard/changepassword')
            }
            else {
                const validationErrors = ['confirm password is not the same with new password']
                req.flash('error', validationErrors)
                req.flash('data', req.body)
                res.redirect('/dashboard/changepassword')

            }
        }
        else {
            const validationErrors = ['password is not correct']
            req.flash('error', validationErrors)
            req.flash('data', req.body)
            res.redirect('/dashboard/changepassword')

        }
    })
}
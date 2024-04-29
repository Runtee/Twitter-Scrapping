const { User, Application, PersonalInformation, Notification, IdentityCard } = require('../models/models');  // Adjust the path as necessary
const { parse } = require('json2csv');

const getDashboard = async (req, res) => {
    try {
        // Fetch the total number of users
        const totalUsers = await User.count();

        // Fetch the total number of pending applications
        const pendingApplications = await Application.count({
            where: {
                ApplicationStatus: 'Pending'  // Assuming 'Pending' is a valid status
            }
        });

        // Fetch the total number of reports generated (this would depend on how you track reports)
        const reportsGenerated = await Application.count({
            where: {
                ApplicationStatus: 'Completed'  // Assuming 'Completed' means a report can be generated
            }
        });

        // Render the dashboard with the fetched data
        res.render('admin-dashboard', {
            totalUsers,
            pendingApplications,
            reportsGenerated
        });
    } catch (error) {
        console.error('Error fetching data for dashboard:', error);
        res.status(500).send('Error loading the dashboard');
    }
};

const getApplicationReview = async (req, res) => {
    const applicationId = req.params.id;  // Assume the application ID is passed as a route parameter

    try {
        const application = await Application.findOne({
            where: { ApplicationID: applicationId },
            include: [{
                model: User,
                include: [{
                    model: PersonalInformation,
                    as: 'PersonalInformation'  // using alias for easier access if defined in associations
                }]
            }]
        });

        if (!application) {
            res.status(404).send('Application not found');
            return;
        }

        // Pass the application data to the EJS template
        res.render('application-review', {
            applicantId: application.ApplicationID,
            applicant: application.User.PersonalInformation.FirstName + ' ' + application.User.PersonalInformation.LastName,
            dob: application.User.PersonalInformation.DOB.toISOString().split('T')[0],  // Format the date to YYYY-MM-DD
            email: application.User.Email
        });
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).send('Error loading the application review page');
    }
};

// Function to approve an application
const approveApplication = async (req, res) => {
    const applicationId = req.body.applicationId;

    try {
        // Update the application status to 'success'
        const result = await Application.update({ ApplicationStatus: 'success' }, {
            where: { ApplicationID: applicationId }
        });

        // Generate a random 4-digit card number
        const cardNumber = Math.floor(1000 + Math.random() * 9000).toString();

        // Calculate the expiry date to be one year from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Create a new identity card
        const card = await IdentityCard.create({
            ApplicationID: applicationId,
            CardNumber: cardNumber,
            IssueDate: new Date(),
            ExpiryDate: expiryDate,
            Active:true
        });

        // Redirect to the dashboard after successful operation
        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error('Error approving application:', error);
        res.status(500).send('Error processing your request');
    }
};
const getCardIssuance2 = async (req, res) => {
    try {
        const cards = await IdentityCard.findAll({
            include: [{
                model: Application,
                as:"Application",
                include: [{ model: User , as: 'User',
                include: [{
                    model: PersonalInformation,
                    as: 'PersonalInformation'  // using alias for easier access if defined in associations
                }]
                ,raw: true,
                nest: true}],
            }],
            raw: true,
            nest: true
        });
        console.log(cards[0].Application.User)
        res.render('card-issue copy', { cards });
    } catch (error) {
        console.error("Failed to retrieve card data:", error);
        res.status(500).render('card-issue', { message: 'Failed to load card issuance data.' });
    }
};


// Function to reject an application
const rejectApplication = async (req, res) => {
    const applicationId = req.body.applicationId;
    try {
        const result = await Application.update({ ApplicationStatus: 'Rejected' }, {
            where: { ApplicationID: applicationId }
        });
        res.redirect('/admin-dashboard'); // Redirect after action
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).send('Error processing your request');
    }
};

const submitApplication = async (req, res) => {
    const { fullname, dateofbirth, email } = req.body;
    try {
        // Assuming a function to add the application to the database
        const newApplication = await Application.create({
            fullname,
            dateOfBirth: dateofbirth,
            email,
            UserID: req.session.userId
        });
        // Redirect to a success page or render with success message
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error submitting application:', error);
        // Redirect back to form with error message or render the form page with error
        res.render('application.ejs', { error: 'Error processing your application' });
    }
};
const getCardIssuance = async (req, res) => {
    try {
        const cards = await Application.findAll({
            include: [{
                model: IdentityCard,
                as: 'IdentityCards'  // using alias for easier access if defined in associations
            }, {
                model: User,
                include: [{
                    model: PersonalInformation,
                    as: 'PersonalInformation'  // using alias for easier access if defined in associations
                }]
            }],
            raw: true,
            nest: true  // helps to create a nested JSON structure
        });
        console.log(cards);
        res.render('card-issue', { cards });
    } catch (error) {
        console.error("Failed to retrieve card data:", error);
        res.status(500).render('card-issue', { message: 'Failed to load card issuance data.' });
    }
};


const renderIDCard = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch the identity card along with associated application and user info
        const card = await IdentityCard.findAll({
            include: [{
                model: Application,
                required: true,
                include: [{
                    model: User,
                    required: true,
                    where: { UserID: userId },
                    include: [{
                        model: PersonalInformation,
                        required: true
                    }]
                }]
            }]
        });

        if (!card) {
            return res.status(404).send('ID card not found');
        }

        // Check if the application associated with the card has been approved
        if (!card[[0]].Application) {
            return res.status(400).send('No approved ID card applications found. Please apply for an ID card.');
        }

        // Render the ID card page with necessary data
        res.render('card', { 
            card: card[0], // pass the card object
            personalInformation: req.session.personalInformation // pass personal information
        });

    } catch (error) {
        console.error("Failed to load user data:", error);
        res.status(500).send('Internal Server Error');
    }
};


const displayProfile = async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming you store user ID in session
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('profile', { user,            personalInformation: req.session.personalInformation,
        }); // Pass user data to the EJS template
    } catch (error) {
        console.error("Error displaying profile:", error);
        res.status(500).send('Error retrieving profile data');
    }
};


const updateProfile = async (req, res) => {
    const { userId } = req.params; // Assuming the user's ID is passed as a URL parameter
    const {
        name,
        date_graduated,
        country,
        school,
        state_of_origin,
        gender,
        address,
        phone
    } = req.body;

    try {
        const user = await PersonalInformation.findOne({where:{UserID:userId}});
        if (!user) {
            return res.status(404).send('User not found');
        }
        const [FirstName, LastName] = name.split(' ');

        // Update user data
        user.FirstName = FirstName;
        user.LastName = LastName;
        user.DateGraduated = date_graduated;
        user.Country = country;
        user.School = school;
        user.StateOfOrigin = state_of_origin;
        user.Gender = gender;
        user.Address = address;
        user.Phone = phone;

        await user.save();

        res.redirect('/user-management'); // Redirect or send a success message
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send('Error updating profile');
    }
};

// Function to render the report generation page
const renderReportForm = (req, res) => {
    res.render('report-custom');
};

// Function to handle the report generation
const generateReport = async (req, res) => {
    const { reportType, dateFrom, dateTo } = req.body;

    try {
        let data = [];
        let fields = [];
        let csv;

        switch (reportType) {
            case 'demographic':
                data = await User.findAll({
                    attributes: ['UserID', 'Email', 'StateOfOrigin'] // Add other demographic fields as needed
                });
                fields = ['UserID', 'Email', 'StateOfOrigin'];
                break;
            case 'applications':
                data = await Application.findAll({
                    where: {
                        SubmissionDate: {
                            $gte: new Date(dateFrom),
                            $lte: new Date(dateTo)
                        }
                    },
                    attributes: ['ApplicationID', 'UserID', 'ApplicationStatus', 'SubmissionDate']
                });
                fields = ['ApplicationID', 'UserID', 'ApplicationStatus', 'SubmissionDate'];
                break;
            case 'identityCards':
                data = await IdentityCard.findAll({
                    attributes: ['CardID', 'ApplicationID', 'CardNumber', 'IssueDate', 'ExpiryDate', 'Active']
                });
                fields = ['CardID', 'ApplicationID', 'CardNumber', 'IssueDate', 'ExpiryDate', 'Active'];
                break;
            default:
                return res.status(400).send('Invalid report type');
        }

        // Convert JSON to CSV
        csv = parse(data, { fields });
        res.header('Content-Type', 'text/csv');
        res.attachment(`${reportType}-report.csv`);
        return res.send(csv);

    } catch (error) {
        console.error('Error generating report:', error);
        return res.status(500).send('Error generating report');
    }
};

const showReportsDashboard = (req, res) => {
    res.render('reports');
};

const generateDemographicReport = async (req, res) => {
    let data = [];
    let fields = [];
    let csv;
    data = await PersonalInformation.findAll({
        attributes: ['UserID', 'FirstName', 'StateOfOrigin'] // Add other demographic fields as needed
    });
    fields = ['UserID', 'FirstName', 'StateOfOrigin'];
    csv = parse(data, { fields });
        res.header('Content-Type', 'text/csv');
        res.attachment(`${'demo'}-report.csv`);
        return res.send(csv);
    // This would typically fetch and compile demographic data
};

const generateApplicationStatsReport = async (req, res) => {
    let data = [];
    let fields = [];
    let csv;
     data = await Application.findAll({
        where: {
            SubmissionDate: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo)
            }
        },
        attributes: ['ApplicationID', 'UserID', 'ApplicationStatus', 'SubmissionDate']
    });
    fields = ['ApplicationID', 'UserID', 'ApplicationStatus', 'SubmissionDate'];
    // This would compile statistics on applications
    csv = parse(data, { fields });
        res.header('Content-Type', 'text/csv');
        res.attachment(`${'application'}-report.csv`);
        return res.send(csv);
    res.send('Application Stats Report Placeholder');
};

// The custom report generator functionality is already covered in the previous example
const showUserDashboard = async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming you're using session to store user ID
        const user = await User.findByPk(userId);
        const application = await Application.findOne({ where: { UserId: userId } });
        const notifications = await Notification.findAll({ where: { UserId: userId, IsRead: false } });

        res.render('user-dashboard', {
            user: user,
            applicationStatus: application ? application.ApplicationStatus : 'None',
            messageCount: notifications.length,
            personalInformation: req.session.personalInformation,
            lastLogin: (new Date()).toDateString() // Assuming lastLogin is stored in your user model
        });
    } catch (error) {
        res.status(500).send("Error accessing the user dashboard: " + error.message);
    }
};


const getUserManagement = async (req, res) => {
    try {
        const users = await User.findAll();
        res.render('user-management', { users });
    } catch (error) {
        res.status(500).send("Error retrieving user data: " + error.message);
    }
};

const addUserView = (req, res) => {
    // Logic to display a form for adding a new user or handling the post request
    res.render('add-user');
};

const editUser = async (req, res) => {
    // Fetch user details for editing
    const { id } = req.params;
    const user = await PersonalInformation.findOne({where:{UserID:id}});
    res.render('edit-user', { user });
};

const editUserPost = async (req, res) => {
    const { userId } = req.params; // Assuming the user's ID is passed as a URL parameter
    const {
        name,
        date_graduated,
        country,
        school,
        state_of_origin,
        gender,
        address,
        phone
    } = req.body;

    try {
        const user = await PersonalInformation.findOne({where:{UserID:userId}});
        if (!user) {
            return res.status(404).send('User not found');
        }
        const [FirstName, LastName] = name.split(' ');

        // Update user data
        user.FirstName = FirstName;
        user.LastName = LastName;
        user.DateGraduated = date_graduated;
        user.Country = country;
        user.School = school;
        user.StateOfOrigin = state_of_origin;
        user.Gender = gender;
        user.Address = address;
        user.Phone = phone;

        await user.save();

        res.redirect('/user-management'); // Redirect or send a success message
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).send('Error updating profile');
    }
};

const deleteUser = async (req, res) => {
    // Handle delete request
    const { id } = req.params;
    await User.destroy({ where: { UserID: id } });
    res.redirect('/user-management');
};


const showAddUserForm = (req, res) => {
    res.render('add-user');
};

const addUser = async (req, res) => {
    const { name, username, email, date_graduated, country, school, state_of_origin, lga, address, phone } = req.body;

    try {
        // Create user with the hashed username as the password
        const newUser = await User.create({
            Username: username,
            PasswordHash: username,  // This will be hashed in the hook
            Email: email,
            Role: 'User',  // Default role or adjust as necessary
            Status: 'Active'  // Default status or adjust as necessary
        });

        // Extract first and last names from 'name'
        const [FirstName, LastName] = name.split(' ');

        // Create associated PersonalInformation record
        await PersonalInformation.create({
            UserID: newUser.UserID,
            FirstName: FirstName || '',
            LastName: LastName || '',
            DOB: req.body.dob, // Make sure dob is provided in the request body
            Gender: req.body.gender, // Gender should be included in the request
            MaritalStatus: req.body.maritalStatus, // Marital status should be included in the request
            Address: address,
            StateOfOrigin: state_of_origin,
            LGA: lga,
            DateGraduated: date_graduated,
            Country: country,
            School: school,
            Phone: phone,
        });

        res.redirect('/user-management'); // Redirect to user management page or wherever appropriate
    } catch (error) {
        console.log(error);
        res.status(500).send("Failed to add user: " + error.message);
    }
};



module.exports = {
    getDashboard,
    getApplicationReview,
    approveApplication,
    rejectApplication,
    submitApplication,
    getCardIssuance,
    renderIDCard,
    displayProfile,
    updateProfile,
    renderReportForm,

    generateReport,
    showReportsDashboard,
    generateDemographicReport,
    generateApplicationStatsReport,
    showUserDashboard,
    getUserManagement,
    addUserView,
    editUser,
    deleteUser,
    showAddUserForm,
    addUser,
    editUserPost,
    getCardIssuance2,
};

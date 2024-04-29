const express = require('express');
const router = express.Router();
const allController = require('./controllers/all')
const authController = require('./controllers/auth')
const {Application} = require('./models/models');
const { where } = require('sequelize');
const { isAdmin, isAuthenticated } = require('./middleware/authMiddleware');

// Retiree Routes
router.get('/', authController.getLogin);
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/admin-dashboard',[isAuthenticated,isAdmin], allController.getDashboard);
router.get('/application-review/:id', [isAuthenticated,isAdmin], allController.getApplicationReview);
router.post('/approve-application',[isAuthenticated,isAdmin],  allController.approveApplication);
router.post('/reject-application', [isAuthenticated,isAdmin], allController.rejectApplication);
router.post('/submit-application',[isAuthenticated],  allController.submitApplication);
router.get('/cards',[isAuthenticated,isAdmin],  allController.getCardIssuance2)
router.get('/application-form',[isAuthenticated],  async (req, res) => {
    const application = await Application.findOne({where:{UserID: req.session.userId}})

    res.render('application.ejs', {
        error: req.query.error, application,
        user: req.session.user,
        personalInformation: req.session.personalInformation,

    }); // Pass error messages if any
});
router.get('/card-issuance',[isAuthenticated,isAdmin],  allController.getCardIssuance);
router.get('/id-card/:userId',[isAuthenticated],  allController.renderIDCard); // Define a route for the ID card

// // Route to display the profile update form
router.get('/profile',[isAuthenticated],  allController.displayProfile);

// // Route to handle the profile update submission
router.post('/update-profile',[isAuthenticated],  allController.updateProfile);
router.get('/generate-report',[isAuthenticated,isAdmin],  allController.renderReportForm);

// // Route to handle form submission and report generation
router.post('/generate-custom-report', [isAuthenticated,isAdmin], allController.generateReport);

router.get('/reports-dashboard', [isAuthenticated,isAdmin], allController.showReportsDashboard);
router.get('/demographic-report', [isAuthenticated,isAdmin], allController.generateDemographicReport);
router.get('/application-stats-report', [isAuthenticated,isAdmin], allController.generateApplicationStatsReport);
router.get('/custom-report-generator',[isAuthenticated,isAdmin],  allController.renderReportForm); // Assuming this function is defined as per previous setup


router.get('/dashboard', [isAuthenticated], allController.showUserDashboard);



router.get('/user-management',[isAuthenticated,isAdmin],  allController.getUserManagement);
router.get('/add-user',[isAuthenticated,isAdmin],  allController.addUserView);
router.post('/add-user',[isAuthenticated,isAdmin],  allController.addUser); // Handle POST for adding user
router.get('/edit-user/:id',[isAuthenticated,isAdmin],  allController.editUser);
router.post('/edit-user/:userId',[isAuthenticated,isAdmin],  allController.editUserPost); // Handle POST for editing user
router.get('/delete-user/:id', [isAuthenticated,isAdmin], allController.deleteUser);



router.get('/add-user', allController.showAddUserForm);
router.get('/dashboard/changepassword', authController.changePasswordView)
router.post('/dashboard/changepassword', authController.changePassword)

// Handle form submission for adding a new user
router.post('/add-user',[isAuthenticated,isAdmin],  allController.addUser);

router.get('/logout', authController.logout)

module.exports = router;

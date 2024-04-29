const { Sequelize, DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt')
// Assuming you have already created a Sequelize instance named `sequelize`
const sequelize = new Sequelize('laravel', 'evans', 'your_database_password', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql', // or another supported database
});


class User extends Model {
  validatePassword(password) {
    return bcrypt.compareSync(password, this.PasswordHash);
  }
}

User.init({
  UserID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Username: { type: DataTypes.STRING(64), allowNull: false },
  PasswordHash: { type: DataTypes.STRING(128), allowNull: false },
  Email: { type: DataTypes.STRING(255), allowNull: false },
  Role: { type: DataTypes.ENUM('Admin', 'User'), allowNull: false },
  Status: { type: DataTypes.STRING(32), allowNull: false },
}, { sequelize, modelName: 'User',
hooks: {
  beforeCreate(user, options) {
    if (user.PasswordHash) {
      user.PasswordHash = bcrypt.hashSync(user.PasswordHash, 12);
    }
  },
  beforeUpdate(user, options) {
    if (user.changed('PasswordHash')) {
      user.PasswordHash = bcrypt.hashSync(user.PasswordHash, 12);
    }
  }} });

// APPLICATIONS Model
class Application extends Model {}
Application.init({
  ApplicationID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  ApplicationStatus: { type: DataTypes.STRING(32), allowNull: false , defaultValue: "pending"},
  SubmissionDate: { type: DataTypes.DATE, allowNull: false, defaultValue:new Date()},
  LastUpdated: { type: DataTypes.DATE, allowNull: false, defaultValue: new Date() },
}, { sequelize, modelName: 'Application' });

// PERSONAL INFORMATION Model
class PersonalInformation extends Model {}
PersonalInformation.init({
  PersonalInfoID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  FirstName: { type: DataTypes.STRING(64), allowNull: false },
  LastName: { type: DataTypes.STRING(64), allowNull: false },
  DOB: { type: DataTypes.DATE, allowNull: false },
  Gender: { type: DataTypes.STRING(16), allowNull: false },
  MaritalStatus: { type: DataTypes.STRING(16), allowNull: false },
  Address: { type: DataTypes.STRING(255), allowNull: false },
  StateOfOrigin: { type: DataTypes.STRING(64), },
  DateGraduated: { type: DataTypes.DATE(), },
  Country: { type: DataTypes.STRING(255), },
  School: { type: DataTypes.STRING(255), },
  Phone: { type: DataTypes.STRING(255), },
}, { sequelize, modelName: 'PersonalInformation' });

// IDENTITY CARDS Model
class IdentityCard extends Model {}
IdentityCard.init({
  CardID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ApplicationID: { type: DataTypes.INTEGER, allowNull: false },
  CardNumber: { type: DataTypes.STRING(64), allowNull: false },
  IssueDate: { type: DataTypes.DATE, allowNull: false },
  ExpiryDate: { type: DataTypes.DATE, allowNull: false },
  Active: { type: DataTypes.STRING(16), allowNull: false },
}, { sequelize, modelName: 'IdentityCard' });

// NOTIFICATIONS Model
class Notification extends Model {}
Notification.init({
  NotificationID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  Message: { type: DataTypes.TEXT, allowNull: false },
  IsRead: { type: DataTypes.BOOLEAN, allowNull: false },
  DateSent: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, modelName: 'Notification' });


// Assuming all models are defined above this section in the same file

// Example association for Application to User
Application.belongsTo(User, {foreignKey: 'UserID'});
User.hasMany(Application, {foreignKey: 'UserID'});

// Example association for PersonalInformation to Application
PersonalInformation.belongsTo(User, {foreignKey: 'UserID'});
User.hasOne(PersonalInformation, {foreignKey: 'UserID'});

// Identity Card relationship to Application
IdentityCard.belongsTo(Application, {foreignKey: 'ApplicationID'});
Application.hasMany(IdentityCard, {foreignKey: 'ApplicationID'});

// Notification relationship to User
Notification.belongsTo(User, {foreignKey: 'UserID'});
User.hasMany(Notification, {foreignKey: 'UserID'});


// Export models if needed
module.exports = { sequelize, User, Application, PersonalInformation, IdentityCard, Notification };

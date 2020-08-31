require('dotenv').config();

module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    "connectionString": 'postgresql://dunder_mifflin@localhost/noteful'
};
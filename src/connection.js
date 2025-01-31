const mysql = require("mysql");
const conn = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12760527',
    password: '73Pdmt4u4I',
    database: 'sql12760527',
    multipleStatements: true
});
conn.connect(function(error){
    if(error)
    {
        throw error;
    }
    else{
        console.log("Connected To Database")
    }
});
module.exports = conn;

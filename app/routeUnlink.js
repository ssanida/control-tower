module.exports = function(app, passport) {
	
	var mysql = require('mysql');
	var dbconfig = require('../config/database');
	//var connection = mysql.createConnection(dbconfig.connection);
	//var connection = require('../config/ConnectConstant.js');
	var connection;
	//function to handle the disconnects from the MySQL db
	function handleDisconnect() {
	  connection = mysql.createConnection(dbconfig.connection); // Recreate the connection, since
	                                                  // the old one cannot be reused.
	  connection.connect(function(err) {              // The server is either down
	    if(err) {                                     // or restarting (takes a while sometimes).
	      console.log('error when connecting to db:', err);
	      setTimeout(handleDisconnect, 10000); // We introduce a delay before attempting to reconnect,
	    }                                     // to avoid a hot loop, and to allow our node script to
	  });                                     // process asynchronous requests in the meantime.
	                                          // If you're also serving http, display a 503 error.
	  connection.on('error', function(err) {
	    console.log('db error', err);
	    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
	      handleDisconnect();                         // lost due to either server restart, or a
	    } else {                                      // connnection idle timeout (the wait_timeout
	      throw err;                                  // server variable configures this)
	    }
	  });
	  connection.query('USE ' + dbconfig.database);
	}
	var ownerflag;//flag used to check if the user is an owner
	//function to check if the user is owner of a specific project
	function checkIfOwner(user,proj_name,callback){
		handleDisconnect();
		var selectProjects = "SELECT `project_name` FROM " + dbconfig.projects_table +" JOIN " + dbconfig.owners_table + " ON "+ dbconfig.projects_table+
		".`project_id` = "+ dbconfig.owners_table + ".`project_id` "+" WHERE "+ dbconfig.owners_table+".`user_id` = '" + user.id + "'";
		console.log(selectProjects)
		connection.query(selectProjects, function(err, rows){
			if (rows.length > 0) {
            	for(var i in rows){
        			if(rows[i].project_name==proj_name){
        				ownerflag=true;
        			}
            	}
	        }
	        console.log(ownerflag);
	        callback(ownerflag);
		});
	}
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account
// user account will stay active in case they want to reconnect in the future

	// github -------------------------------
	app.get('/unlink/github', isLoggedIn, function(req, res) {
		var user            = req.user;
		var updateQuery = "UPDATE " + dbconfig.users_table + " SET " +
                                "`github_token` = '" + undefined + "' " +                               
                                "WHERE `github_id` = " + user.github_id + " LIMIT 1";
        handleDisconnect();
		connection.query('USE ' + dbconfig.database);
		connection.query(updateQuery, function(err, rows) {
                                res.redirect('/profile');
                            });
	});
};
// route middleware to ensure user is logged i
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}

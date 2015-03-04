module.exports = function(app, passport) {
	
	var mysql = require('mysql');
	var dbconfig = require('../config/database');
	var connConstant = require('../config/ConnectConstant');
	//var connection = mysql.createConnection(dbconfig.connection);
	//var connection = require('../config/ConnectConstant.js');
	var connection;
	
	var ownerflag;//flag used to check if the user is an owner
	//function to check if the user is owner of a specific project
	function checkIfOwner(user,proj_name,callback){
		connection=connConstant.connection;
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
	// Display Projects I own, allow to manage and allow to remove =================
	// =============================================================================
	app.get('/displayOwnprojects/github', isLoggedIn, function(req, res) {
		var user            = req.user;
		var proj_name = req.project_name;//if I want
		connection = connConstant.connection;
		//query for the projects I own
		var projectsOwnedQuery = "SELECT `project_name` FROM " + dbconfig.projects_table +" JOIN " + dbconfig.owners_table + " ON "+ dbconfig.projects_table+
			".`project_id` = "+ dbconfig.owners_table + ".`project_id` "+" WHERE "+ dbconfig.owners_table+".`user_id` = '" + user.id + "'";
		connection.query(projectsOwnedQuery, function(err, rows){
            if (rows.length > 0) {
            	res.render('projectsOwn.ejs', {
					projectnames : rows,//I return the project names in order to be able to remove them
					user: user
				});
            }
            else{
            	res.redirect('/profile');
            }
        });
	});
};
// route middleware to ensure user is logged i
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}

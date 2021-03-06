module.exports = function(app, passport) {
	
	var mysql = require('mysql');
	var dbconfig = require('../../config/database');
	var connConstant = require('../../config/ConnectConstant');
	var connection;
	var ownerflag;//flag used to check if the user is an owner
	//function to check if the user is owner of a specific project
	function checkIfOwner(user,proj_name,callback){
		connection=connConstant.connection;
		var selectProjects = "SELECT `project_name` FROM " + dbconfig.projects_table +" JOIN " + dbconfig.owners_table + " ON "+ dbconfig.projects_table+
		".`project_id` = "+ dbconfig.owners_table + ".`project_id` "+" WHERE "+ dbconfig.owners_table+".`user_id` = '" + user.id + "'";
		//console.log(selectProjects)
		connection.query(selectProjects, function(err, rows){
			if (rows.length > 0) {
            	for(var i in rows){
        			if(rows[i].project_name==proj_name){
        				ownerflag=true;
        			}
            	}
	        }
	        callback(ownerflag);
		});
	}
	// =============================================================================
	// Add an Collaborator in a Project I own ======================================
	// =============================================================================
	app.post('/addCollaborator', isLoggedIn, function(req, res) {
		var name = req.body.name;//github name or google e-mail of the collaborator
		var proj_name = req.body.project_name;//the name of the project to which we add the collaborator
		var google_email;
		var github_name;
		var checkIfUserExistsQuery;//query to check if the provided github name or google email matches to an S-Case user
		if(name.indexOf('gmail.com')>-1){
			google_email=name;
			checkIfUserExistsQuery = "SELECT id FROM " + dbconfig.users_table + " WHERE " +
						dbconfig.users_table +".google_email=" + "'" + google_email +"'";////check if the user's githubname exists			
		}
		else{
			github_name=name;
			checkIfUserExistsQuery = "SELECT id FROM " + dbconfig.users_table + " WHERE " +
						dbconfig.users_table +".github_name=" + "'" + github_name +"'";////check if the user's githubname exists			
		}
		//console.log('projectname to add collaborator '+proj_name);
		var user = req.user;//the user that attempts to add collaborator
		var ownerflag;//flag to check if I am owner
		checkIfOwner(user,proj_name,function(ownerflag){//we check if the user is owner in the project
			if(ownerflag==true){
				connection=connConstant.connection;//we get a new connection to the database
				connection.query(checkIfUserExistsQuery, function(err,rows){// we perform the query to get the id of the user with the provided github name of google email
					if(rows.length>0){
						var user_id = rows[0].id
						var getProjectId = "SELECT project_id FROM " + dbconfig.projects_table + " WHERE project_name="+ "'"
										+ proj_name +"'";//if the user exists, we create a query to get the project's id
						connection=connConstant.connection;//we get a new connection to the database
						connection.query(getProjectId, function(err, rows){//we perform the query to get the project's id
							if(err){
								res.redirect('/manageprojects'+'?project_name='+proj_name);
							}
							else{
								var createCollabQuery = "INSERT INTO " +dbconfig.collaborators_table+ "(user_id,project_id)" +
								" VALUES (" + "'"+ user_id + "'"+ ",'"+rows[0].project_id+"')";// insert the user as a collaborator in the collaborators' table
								connection=connConstant.connection;
								//console.log(createCollabQuery);
								connection.query(createCollabQuery, function(err, rows){
									res.redirect('/manageprojects'+'?project_name='+proj_name);
								});
							}
							
						});
					}
					else{
						res.redirect('/manageprojects'+'?project_name='+proj_name);
					}
				});
			}
		});
	});
};
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	var connConstant = require('../../config/ConnectConstant');
	var connection;
	connection = connConstant.connection;
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}

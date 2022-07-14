const http = require('http'),
    mysql = require('mysql'),
    parser = require('body-parser'),
    express = require('express'),
    fs = require('fs'),
    ejs = require('ejs'),
    aws = require('aws-sdk'),
    multer = require('multer'),
    multers3 = require('multer-s3'),
    app = express();

/** Load Config File FOR S3 bucket */
aws.config = new aws.Config();
process.env.AWS_ACCESS_KEY_ID = "ASIA5CV3GIDNRT3MDXL4"
process.env.AWS_SECRET_ACCESS_KEY = "ZonyDtOidUAlTTsor4uKbxv/mKqdvq2uXaPGZlSE"
process.env.AWS_SESSION_TOKEN ="FwoGZXIvYXdzEFYaDJcxwVPvazMcG2WNYyLKAUG5NvlwAXOWHtvMDxu5UcgVo3P24Be/rdvzZtTTlFhjxQTK+y3svv5PYes5uJjbL5blnfkQARJRadHKiEJfjeF1SGmZsRPCZ4yVY8nDnrWTYVgHSPD8SR6Iesn2x2T7LHNIJfrXaL12CTjEBq02ATXxYBorKAzrLOXxPadK6NcMNDIiK1sz5geT+E4YdEas/L6l8RcyF2mXUILyhGbQ1xrOEEPyc89DfFS7VuRXlCySCi1FIHRU20SghAyKw/a/dz2BnShajrKErH8ojvyykwYyLXi+0qhNL+FA3gH4U7pEaethBSoQbs5ES+DZJIjL7yPzFuBK3GrqxHPIpZAmkA=="
aws.config.region = "us-east-1"
aws.config.update({
  signatureVersion: 'v4'
})

const awsobj = new aws.S3({});

const upload = multer({
  storage: multers3({
    s3: awsobj,
    bucket: 'filedropproject',
    acl: 'public-read',
    destination: function (req, file, cb) {
      cb(null, '/upload/')
    },
    //name the file
    key: function (req, file, callback) {
      callback(null, Date.now() + file.originalname)
    }
  }),
  limits: {
    fileSize: 100000
  }
});

/** Load Config File FOR RDS */
var rds_json = fs.readFileSync('./rds-config.json');
try{
  var rds_config = JSON.parse(rds_json);
  console.log(rds_config);
  var connection = mysql.createConnection({
    host     :rds_config.RDS_HOSTNAME,
    user     :rds_config.RDS_USERNAME,
    password :rds_config.RDS_PASSWORD,
    port : rds_config.DS_PORT,
    timeout: 60000
  });
  connection.connect();
  console.log("successfully connected to AWS RDS");
  connection.query('use userdata', function (error, result) {
    console.log(result);
    var resu =JSON.stringify(result);
    console.log(resu.length);
  });
} catch(e) {
  console.log('Database Connetion failed:' + e);
}

/** APP config **/
app.use(express.static(__dirname + '/'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.get('/', function(request, response){
  response.render('index.html');
});

/** Set Port Number For Web */
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
//app.set('port', 3001);
app.set('port', process.env.PORT || 3000);

/**Set up the header/request_type**/
app.use(function (req, res, next) {
    // Fix CORS error
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Origin,Accept');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
  
/** Create Server **/
http.createServer(app).listen(app.get('port'), function(){
    console.log('Server listening on port ' + app.get('port'));
});

/** File related API **/

// Delete file from S3 and its meta information from RDS
app.get('/api/delete', function (request, response) {
   var params = {
        Key: request.query.key,
        Bucket: 'filedropproject'

    };
  //doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
  awsobj.deleteObject(params, function (error, deleteOutput) {
        if (deleteOutput) {
          // Mysql query to delete metadata of specific file related to input email address
          connection.query('DELETE FROM filedata WHERE filekey = ?',[request.query.key], function (error, returnTable) {
            if (error) {
                console.log("Error for running mysql Select query:" + error)
                throw error;
            }
            response.end(JSON.stringify(returnTable));
         });
          console.log("200: DELETING SUCCESS" + deleteOutput);
        }
        else {
          console.log("400: Didn't found requested file."+error);
        }
    });
});

// Fetch all file metadata from RDS based on EmailId
app.get('/api/filedata', function (req, response) {
    // Mysql query to get metadata of files related to input email address
   connection.query('SELECT * FROM filedata WHERE emailid = ?',[req.query.emailid], function (error, returnData) {
   if (error) {
       console.log("Error for running mysql Select query:" + error)
       throw error;
   }
   if (returnData){
       response.end(JSON.stringify(returnData));
   }
   else{
       console.log("No file found related to email address:" + req.query.emailid)
   }
 });
  console.log("200: GET SUCCESS");
});

//post the file to S3 and upload the file information to RDS
app.post('/api/filedata',upload.any(),function (request,response) {
  var responseList = [];
  if (
      typeof request.body.emailid == 'undefined'
  ) {
    responseList.push({'result' : 'error', 'msg' : 'No emailID found'});
    response.status(400).send(JSON.stringify(responseList));
    console.log("400: POST FAILURE");
  }else{
    var emaiLidValue = request.body.emailid;
    var fileLocation = 'https://d2uzvgbez5r4zk.cloudfront.net/'+request.files[0].key;
    var fileID = request.files[0].key;
    var fileName = request.files[0].originalname;
    //var createdTime = new Date().toLocaleDateString();
    //console.log("createdTime is: " + createdTime)
    // Mysql query to add metadata of new file related to input email address
    connection.query("INSERT INTO filedata (emailid, filelocation, filekey, filename, created) VALUES ( ?, ?, ?, ?, curdate())",
        [emaiLidValue,fileLocation,fileID, fileName],
        function(err, result) {
          if (err){
            response.status(400).send(err);
          }else {
            if (result.affectedRows !== 0) {
              responseList.push({'Query Result' : 'Query success'});
            } else {
              responseList.push({'Query Result' : 'No found'});
            }
            response.status(200).send(JSON.stringify(responseList));
            console.log("200: POST SUCCESS");
          }
        });
  }
});

/** user related API**/
app.post('/api/login', function (req, res) {
    var response = [];
    console.log(req.body);
    var email = req.body.email, password =req.body.password;
    // Mysql query to get metadata of this user for verification
    connection.query('select * from logindata where email =? and password=?',[email,password], function (error, result) {
    console.log("Query Result:" + result);
    var userinfo =JSON.stringify(result);
    console.log(res.length);
    if(userinfo.length > 2){
        response.push({'Query Result' : 'Query success, user exist.'});
        res.status(200).send(JSON.stringify(result));
    }else{
        response.push({'Query Result' : 'Invalid User, Did not found this user in user table'});
        res.status(400).send(JSON.stringify(response));
    }
    });
});

app.post('/api/usercheck',upload.any(),function(req,res){
    //console.log(req.body);
    var emailid = req.body.emailid;
    console.log(emailid);
    connection.query("SELECT emailid FROM filedata where emailid = ?",[emailid],function(err,result){
        var userCheckResult = JSON.stringify(result);
        console.log(userCheckResult);
        console.log("User check response length:" + userCheckResult.length);
        if( userCheckResult.length == 2){
            res.status(200).send(JSON.stringify(userCheckResult))
            console.log('Query Result : Query success, found file for this user.')
        }else{
            res.status(204).send(JSON.stringify(userCheckResult))
            console.log('Query Result : Query success, but no file was found for this user.')
        }
    })
})

 app.post('/api/signup',function (req,res) {
     var response = [];
        console.log("Lin: 0");
        console.log("req.body is " + JSON.stringify(req.body))
     if (
        typeof req.body.firstname !== 'undefined' &&
        typeof req.body.lastname !== 'undefined' &&
        typeof req.body.email !== 'undefined'
     ) {
         var firstname = req.body.firstname, lastname = req.body.lastname, email = req.body.email, password = req.body.password, aboutyou=req.body.aboutyou;
         console.log("firstname is " + JSON.stringify(firstname))
         console.log("lastname is " + JSON.stringify(lastname))
         console.log("email is " + JSON.stringify(email))
         console.log("password is " + JSON.stringify(password))
         connection.query("INSERT INTO logindata (firstname, lastname, email, password, aboutyou) VALUES (?, ?, ?, ?, ?)",
            [firstname, lastname, email, password, aboutyou], 
            function(err, result) {
                if (!err){
                    console.log("200 response")
                    if (result.affectedRows != 0) {
                        response.push({'Query Result' : 'Query success, new user added.'});
                    } else {
                        response.push({'Query Result' : 'Query failed, no user was added, you might already have an account.'});
                    }
                    res.status(200).send(JSON.stringify(response));
                    return;
                } else {
                    res.status(400).send(err);
                }
            });
 
    } else {
         console.log("400 error")
         response.push({'result' : 'error', 'msg' : 'Please fill required details'});
         res.status(400).send(JSON.stringify(response));
   }
});


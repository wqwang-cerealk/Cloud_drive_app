URL = "http://cloudfile-env-1.eba-cec3nvj2.us-east-1.elasticbeanstalk.com/"
const appControllers = angular.module('appControllers', []);

appControllers.controller('loginController',function($scope,$http,$stateParams,$state){
  $scope.loginfn=function(){
      $http({
        url:URL + "api/login",
        data:{'email':$scope.email,'password':$scope.password},
        method: "POST"
      }).then(function(response){
       console.log(response);
       localStorage.setItem('email',$scope.email)
       localStorage.setItem('userdata',JSON.stringify(response.data))
         $('error').text('');
        console.log(response);
         var urlredirect = 'welcome';
            $state.go(urlredirect);
      },function(response){
        alert('Invalid email or password, please try again.');
          $('error').text('Invalid email or password.')
      })
  }
});

appControllers.controller('signupController',function($scope,$http,$stateParams,$state){
    $scope.signup=function () {
       $http({
             data: {
              'firstname':$scope.firstname,
              'lastname':$scope.lastname,
              'email':$scope.email,
              'password':$scope.password, 
              'aboutyou':$scope.aboutyou
             },
            url: URL + "api/signup",
            method: "POST",  
        })
        .then(function(response) {
                // sign up successful
                localStorage.setItem('email',$scope.email);
                var urlredirect = 'home';
            $state.go(urlredirect); 
        }, 
        function(response) {
                // failed to sign up
                alert('Please fill all information in correct format.');
        });
    };
});

appControllers.controller('navlogoutController',function($scope,$http,$stateParams,$state){
  $scope.logoutfn=function(){
    if(localStorage.getItem('email').length>0){
      var urlredirect = 'home';
      $state.go(urlredirect);
      localStorage.setItem('email','');
      localStorage.setItem('userdata','');
    }
  };
});

//Controller for upload files
appControllers.controller('uploadFileController',function($scope,$http){
     $scope.upload = 'uploads';
     $scope.user={};
     $scope.fileUpload=function () {
        var data = new FormData();
        for(key in $scope.user){
          data.append(key,$scope.user[key]);
        }
        var file = $('#myFile')[0].files[0];
        data.append('userfile',file);
       $http({
         data: data,
         url:URL+"api/filedata",
         method: "POST",
         headers: {
            'Content-Type':undefined//,
           },
         tranformRequest: angular.identity,
         tranformResponse: angular.identity,
        })
        .then(function() {
                alert("File is uploaded successfully.");
                $scope.user.emailid='';
        },
        function() {
                 alert("File cannot be uploaded, please check the size and format.")
        });
       $scope.email='';
       $scope.firstName='';
       $scope.lastName='';
    };
});

//Controller for fetching all files
appControllers.controller('fetchAllFileController',function($scope,$http,$stateParams,$state){

      $scope.username =JSON.parse(localStorage.getItem('userdata'))[0].firstname;
      $scope.lastname =JSON.parse(localStorage.getItem('userdata'))[0].lastname;
      $scope.emailadd = localStorage.getItem('email');
      $scope.fetchdata=function(){
         $http.get(URL+'api/filedata',{params:{"emailid": localStorage.getItem('email')}}).success( function(response) {
            console.log("fetch response is: " + JSON.stringify(response))
            $scope.fetched = response;
        });
    };
     $scope.fileRemove=function(key){
        $http.get(URL+'api/delete',{params:{"key": key}}).success( function() {
          alert('File is deleted successfully.');
          $scope.fetchdata();
        });
     };
     $scope.fileUpdate=function(key){
         $state.go("update", { id: key });
     }
});

// Controller for update files
appControllers.controller('updateSingleFileController',function($scope,$http,$stateParams,$state){
  $scope.email = localStorage.getItem('email');
  $scope.firstname =JSON.parse(localStorage.getItem('userdata'))[0].firstname;
  $scope.lastname =JSON.parse(localStorage.getItem('userdata'))[0].lastname;
  $scope.aboutyou =JSON.parse(localStorage.getItem('userdata'))[0].aboutyou;
  $scope.oldfile =$stateParams.id;
  $scope.fileRemove=function(key){
    $http.get(URL+'api/delete',{params:{"key": key}}).success( function(response) {
    });
  };
  $scope.fileUpdate=function(){
    var data = new FormData();
    data.append('emailid',$scope.email);
    var file = $('#newfile')[0].files[0];
    data.append('userfile',file);
    $http({
      data: data,
      url: URL+"api/filedata",
      method: "POST",
      tranformRequest: angular.identity,
      tranformResponse: angular.identity,
      headers: {
        'Content-Type':undefined//,
      },
    })
    .then(function() {
          $scope.fileRemove($scope.oldfile);
          alert("File is updated successfully.");
          $state.go('fetch');
        },
        function() {
          alert("File can't be uploaded, please try again.")
        });
  }
});



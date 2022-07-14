var app = angular.module('cloudFile', ['ui.router','appControllers']);

/***State Routing Start***/  
app.config(function($stateProvider, $urlRouterProvider,$locationProvider) {

    $stateProvider
        .state('home', {
              url: '/',
              views: {
                '': {
                  templateUrl: 'templates/main.html'
                },
                'body@home': {
                    templateUrl: 'static/html/login.html',
                    controller:'loginController'
                },
              }
        })
        .state('signup', {
              url: '/signup',
              views: {
                '': {
                  templateUrl: 'templates/main.html'
                },
                'body@signup': {
                    templateUrl: 'static/html/signup.html',
                    controller:'signupController'
                },
              }
        })
        .state('update', {
              url: '/update/:id',
              views: {
                '': {
                  templateUrl: 'templates/main.html'
                },
                'nav@update': {
                  templateUrl: 'templates/assets/nav.html',
                  controller: 'navlogoutController'
                },
                'body@update': {
                    templateUrl: 'static/html/update.html',
                    controller:'updateSingleFileController'
                }
              }
        })
        .state('welcome', {
            url: '/welcome',
              views: {
                '': {
                  templateUrl: 'templates/main.html'
                },
                'nav@welcome': {
                  templateUrl: 'templates/assets/nav.html',
                  controller: 'navlogoutController'
                }
              }
        })
      .state('upload', {
          url: '/upload',
          views: {
              '': {
                  templateUrl: 'templates/main.html'
              },
              'nav@upload': {
                  templateUrl: 'templates/assets/nav.html',
                  controller: 'navlogoutController'
              },
              'body@upload': {
                  templateUrl: 'static/html/upload.html',
                  controller:'uploadFileController'
              }
          }
      })
      .state('fetch', {
          url: '/fetch',
          views: {
              '': {
                  templateUrl: 'templates/main.html'
              },
              'nav@fetch': {
                  templateUrl: 'templates/assets/nav.html',
                  controller: 'navlogoutController'
              },
              'body@fetch': {
                  templateUrl: 'static/html/fetch.html',
                  controller:'fetchAllFileController'
              }
          }
      })
        
   $locationProvider.html5Mode(true);
  
});



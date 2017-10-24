app.controller('ManageController', function($scope, $http, $rootScope, $timeout, $interval) {
        
        $scope.appTypes = [];
        $scope.filter = {installed:'all',selected:'all'};
        $scope.searchedList = [];
        $scope.sortType     = 'name'
        $scope.sortReverse  = false
        $scope.searchName   = '';
        $scope.mainFunctions = [];
        $scope.functions = [];
        $scope.filteredItems;
        $scope.commandStatus = 0;
        $scope.executions = [];
        $scope.priority = 1;

        $scope.flatten = function(arr) {
          return arr.reduce(function (flat, toFlatten) {
            return flat.concat(Array.isArray(toFlatten) ? $scope.flatten(toFlatten) : toFlatten);
          }, []);
        }

        $scope.setArrays = function() {
            //Clone the app list
            $scope.searchedList = $rootScope.appList.map(function(app) { app.selected = false; return app });
            //Load the different application types
            $scope.appTypes = $rootScope.appList.map(function(app) { return app.type }).filter(function (cat, idx, arr) { return cat != "" && arr.indexOf(cat) === idx; }).sort();
            $scope.appTypes.unshift('all');
            $scope.filter['all'] = true;
            //Get a list of available functions.
            $scope.functions = $scope.flatten($scope.searchedList.map(function(app) { return app.functions }));
            var counts = {};
            $scope.functions.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
            $scope.functions = $scope.functions.filter(function (cat, idx, arr) { return cat != "" && arr.indexOf(cat) === idx; }).sort();
            $scope.mainFunctions = $scope.functions.filter(function (cat, idx, arr) { return cat != "" && counts[cat] > 20 && arr.indexOf(cat) === idx; }).sort();
        }
        
        $scope.setSelected = function(obj) {
            $scope.filteredItems.forEach(function (app) {
                 app.selected = obj.target.checked;
            });
        }
        
        $scope.runCommand = function(comm) {
            console.log(comm);
            var apps=$scope.searchedList.filter(function (app) { return app.selected });
            /*var exec=$scope.executions.filter(function(exec) { return exec.name == comm});
            if(exec.length > 0)
            {
                exec = exec[0];
                exec.totalCount = apps.length;
                exec.completed = 0;
                exec.items = [];
            } else
            {
                exec = {name:comm};
                exec.totalCount = apps.length;
                exec.completed = 0;
                $scope.executions.push(exec);
                exec.items = [];
            }*/
            apps.forEach(function (app) {
                if(app.selected)
                {
                    $http({
                        transformRequest: angular.identity,
                        method: 'POST',
                        url: '/execute',
                        timeout: 1800000,
                        params: {
                            command: comm,
                            app: JSON.stringify(app),
                            priority: $scope.priority
                        }
                    }).then(function(response) {
                        console.log(response.data);
                        //exec.items.push(response.data);
                    });
                }
            });
        }

        $scope.loadApps = function() {
            $http({
                transformRequest: angular.identity,
                method: 'GET',
                url: '/apps',
            }).then(function(response) {
                $rootScope.appList = response.data;
                $scope.setArrays();
            });
        };

        $scope.applyFilter = function(app) {
            var result = app;
            if($scope.filter.installed != 'all')
            {
                if($scope.filter.installed == "are" && app.installed == false)
                {
                    return null;   
                } else if($scope.filter.installed == "not" && app.installed == true)
                {
                    return null;
                }
            }
            if($scope.filter.selected != 'all')
            {
                if($scope.filter.selected == "are" && app.selected == false)
                {
                    return null;
                } else if($scope.filter.selected == "not" && app.selected == true)
                {
                    return null;
                }
            }
            var valid = $scope.filter['all'];
            for(var i = 0; !valid && i < $scope.appTypes.length; i++)
            {
                if(!valid && $scope.filter[$scope.appTypes[i]])
                {
                    valid = (app.type == $scope.appTypes[i]); 
                }
            }
            if(valid)
            {
                return app;
            } else
            {
                return null;
            }
        }

        $scope.updateQue = function()
        {
            $http({
                transformRequest: angular.identity,
                method: 'GET',
                url: '/que',
                timeout: 1800000
            }).then(function(response) {
                var items = response.data.items;
                $scope.executions = [];
                items.forEach(function (exec) {
                    var cat=$scope.executions.filter(function(categ) { return categ.name == exec.command});
                    if(cat.length > 0)
                    {
                        cat = cat[0];
                        //Iteration 2 needs to fix these.
                        cat.totalCount++;
                        if(exec.end_date != null)
                        {
                            cat.completed++;
                        }
                        cat.items.push(exec);
                    } else
                    {
                        cat = {name:exec.command};
                        cat.totalCount = 1;
                        cat.completed = exec.end_date != null ? 1 : 0;
                        cat.items = [];
                        cat.items.push(exec);
                        $scope.executions.push(cat);
                    }
                });
                //console.log(response.data);
            });

        }

        $scope.loadApps();
        $scope.updateQue();
        $interval($scope.updateQue,10000);
        //$interval($scope.updateQue,600000);
});
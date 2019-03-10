// budget controller
var budget = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
        this.type = 'exp';
    }

    Expense.prototype.calcPer = function(totalIncome){
        if(totalIncome > 0){
            this.percentage = Math.round((this.value / totalIncome) * 100);
        }
        else{
            this.percentage = -1;
        }
    }

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.type = 'inc';
    }

    var calcTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(
            function(curr, i, array){
                sum += curr.value;
            }
        );
        data.totals[type] = sum;

        // store totals to local storage
        window.localStorage.setItem(type, sum);
    }

    var allExpense = [];
    var allIncome = [];
    var totalExpenses = 0;

    var data = {

        allItems : {
            exp: [],
            inc: []
        },
        totals: {
            exp : 0,
            inc : 0
        },
        budget: 0,
        percentage : -1
    }

    return {

        addItem : function(type, des, val){

            var newItem, ID, localKey;

            // create id by get the last id + 1
            console.log(data.allItems[type].length);
            if(data.allItems[type].length > 0){
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }
            else{
                ID = 0;
            }
            
            // create new item
            if(type === 'exp'){
                newItem = new Expense(ID, des, val);
                // create local storage key
                localKey = 'exp_' + ID;
            }
            else if(type === 'inc'){
                newItem = new Income(ID, des, val);
                // create local storage key
                localKey = 'inc_' + ID;
            }
 
            // push it into data
            data.allItems[type].push(newItem);

            // push it into local storage
            window.localStorage.setItem(localKey, JSON.stringify(newItem));
            
            return newItem;
        },

        addLocalItem : function(ID, type, des, val){

            var newItem;
            
            // create new item
            if(type === 'exp'){
                newItem = new Expense(ID, des, val);
            }
            else if(type === 'inc'){
                newItem = new Income(ID, des, val);
            }
 
            // push it into data
            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem : function(type, id){
            var ids, index;
            ids = data.allItems[type].map(function(curr){
                return curr.id;
            });
            index = ids.indexOf(id);
            console.log(index);
            if(index !== -1){
                data.allItems[type].splice(index, 1);
            }
            // remove from local storage
            //window.localStorage.removeItem(type + '_' + JSON.stringify(index));
        },

        calcBudget: function() {

            // calc total income and expense
            calcTotal('exp');
            calcTotal('inc');
            // calc the bud: income - expense
            data.budget = data.totals.inc - data.totals.exp;
            // calc percentage
            if(data.totals.inc > 0){
                data.percentage = Math.round(data.totals.exp / data.totals.inc * 100);
            }
            else{
                data.percentage = -1;
            }

            // save budget and percentage to local storage
            window.localStorage.setItem('budget', data.budget);
            window.localStorage.setItem('percentage', data.percentage);
        }, 

        calcPercentage: function() {
            // 20 10 40 income = 100
            // 20% 10% 40%
            data.allItems.exp.forEach(function(curr){
                curr.calcPer(data.totals.inc);
            });
        },

        getPercentages: function(){
            var allPerc = data.allItems.exp.map(function(curr){
                return curr.getPercentage();
            });
            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc : data.totals.inc,
                totalExp : data.totals.exp,
                percentage : data.percentage
            }
        },

        testing : function(){
            console.log(data);
        }
    }


})();

// UI controller
var UI = (function(){

    var DOMstring = {
        addType : '.add__type',
        addDescription : '.add__description',
        addValue : '.add__value',
        addButton : '.add__btn',
        incomeContainer : '.income__list',
        expensesContainer : '.expenses__list',
        budgetLabel : '.budget__value',
        incomeLabel : '.budget__income--value',
        expensesLabel : '.budget__expenses--value',
        percentageLabel : '.budget__expenses--percentage',
        container : '.container',
        expensesPercentage : '.item__percentage',
        date : '.budget__title--month'
    };

    var nodeListForEach = function(list, callback) {
        for(var i = 0; i < list.length; i++){
            callback(list[i], i)
        }
    };

    var formatNumber = function(number, type) {
        var split, int , dec;
        // + or -
        // 2 decial, comma, eg: 2310.4567 => 2,310.46
        number = Math.abs(number);
        number = number.toFixed(2);

        split = number.split('.')
        int = split[0];
        dec = split[1];
        // if(int.length > 3){
        //     int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length); 
        // }
        if (int.length > 3) {
            for (var i = 3; i < int.length; i += 4) {
                int = int.substr(0, int.length - i) + ',' + int.substr(int.length - i, i);
            }
        }
        
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    return {

        getInput: function(){
            return {
                type : document.querySelector(DOMstring.addType).value,
                // inc or exp
                description : document.querySelector(DOMstring.addDescription).value,
                value : parseFloat(document.querySelector(DOMstring.addValue).value)
            }   
        },

        addListItem: function(obj, type){

            var html, newHtml, element;
            // create html string with placeholder text

            if(type === 'inc'){
                element = DOMstring.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
            }
            else if (type === 'exp'){
                element = DOMstring.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
            }

            // replace the placeholder text with some data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // insert html to dom
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem : function(id){
            var e = document.getElementById(id);
            e.parentNode.removeChild(e);
        },

        clearInput : function(){

            var field = document.querySelectorAll(DOMstring.addValue + ',' + DOMstring.addDescription);
            // use call to trick slice() that we pass in an array instead of a list
            var fieldArray = Array.prototype.slice.call(field);
            fieldArray.forEach(function(curr, i, array){
                curr.value = '';
            });
            // focus back to value
            fieldArray[0].focus();

        },

        displayBudget: function(obj) {

            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstring.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstring.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstring.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            if(obj.percentage > 0){
                document.querySelector(DOMstring.percentageLabel).textContent = obj.percentage + '%';
            }
            else{
                document.querySelector(DOMstring.percentageLabel).textContent = '---';
            }
            
        },

        displayPercentage: function(percentages) {

            var fields = document.querySelectorAll(DOMstring.expensesPercentage);

            nodeListForEach(fields, function(curr, i){
                if(percentages[i] > 0){
                    curr.textContent = percentages[i] + '%';
                }
                else{
                    curr.textContent = '---';
                }
            });

        },

        displayMonth: function() {

            var now, year, month, months;  
            now = new Date();
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            year = now.getFullYear();
            month = now.getMonth();
            document.querySelector(DOMstring.date).textContent = months[month] + ' ' + year 

        },

        changeType: function() {

            var fields = document.querySelectorAll(
                DOMstring.addType + ',' +
                DOMstring.addDescription + ',' +
                DOMstring.addValue
            );

            nodeListForEach(fields, function(curr, i){
                curr.classList.toggle('red-focus');
            });

            document.querySelector(DOMstring.addButton).classList.toggle('red');

        },

        getDOMstring : function(){
            return DOMstring;
        }
    }

})();

// global controller
var controller = (function(budgetCtrl, UICtrl){

    var setupEventListeners = function() {
        var DOM = UI.getDOMstring();
        
        document.querySelector(DOM.addButton).addEventListener('click', ctrlAdd);
        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13){
                ctrlAdd();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDelete);

        document.querySelector(DOM.addType).addEventListener('change', UICtrl.changeType);
    }

    var ctrlAdd = function(){
        var input, newItem;
        // get input data
        input = UI.getInput();
        if(input.description != '' && !isNaN(input.value) && input.value > 0){
            // add item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // add itme to ui
            UICtrl.addListItem(newItem, input.type);
            // clear input
            UICtrl.clearInput();
            // update budget
            updateBudget();
            // update percentage
            updatePercentage();
        }
    }

    var ctrlDelete = function(event) {

        var itemID, type, id;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        //console.log(itemID);
        console.log('this item id: ' + itemID)
        if(itemID){

            itemID = itemID.split('-');
            type = itemID[0];
            id = parseInt(itemID[1]);
            //console.log(type, id);

            // delete the item from data struct
            budgetCtrl.deleteItem(type, id);
            // delete from the UI
            UICtrl.deleteListItem(type + '-' + id);
            // update and show new bud
            updateBudget();
            // update percentage
            updatePercentage();
            window.localStorage.removeItem(type + '_' + id);
        }

    }

    var updateBudget = function() {
        // calc budget
        budgetCtrl.calcBudget();
        // return budget
        var bud = budgetCtrl.getBudget();
        // display
        UICtrl.displayBudget(bud);
    }

    var updatePercentage = function(){

        // calc percentage
        budgetCtrl.calcPercentage();
        // read from budget controller
        var percentages = budgetCtrl.getPercentages();
        // update UI
        UICtrl.displayPercentage(percentages);
    }

    return {
        init: function(){
            console.log('starts');
            UICtrl.displayMonth();
            if(window.localStorage.length <= 4){
                window.localStorage.clear();
                UICtrl.displayBudget({
                    budget: 0,
                    totalInc : 0,
                    totalExp : 0,
                    percentage : -1
                });
            }
            else{
                var totalIncome = window.localStorage.getItem('inc');
                var pers = [];
                UICtrl.displayBudget({
                    budget: window.localStorage.getItem('budget'),
                    totalInc : totalIncome,
                    totalExp : window.localStorage.getItem('exp'),
                    percentage : window.localStorage.getItem('percentage')
                });

                for(var i = 0; i < window.localStorage.length; i++){
                    var key = window.localStorage.key(i);
                    //console.log(key);
                    var value = JSON.parse(window.localStorage.getItem(key));
                    if (value.type === 'inc' || value.type === 'exp'){
                        console.log(key, value);
                        if(value.type === 'exp'){
                            if(totalIncome > 0){
                                value.percentage = Math.round(value.value / totalIncome * 100);
                            }
                            else{
                                value.percentage = -1;
                            }     
                            pers.push(value.percentage);
                        }
                        budgetCtrl.addLocalItem(value.id, value.type, value.description, value.value);
                        UICtrl.addListItem(value, value.type);
                    }
                }
                UICtrl.displayPercentage(pers);
            }
            setupEventListeners();
        }
    }

})(budget, UI);

controller.init();
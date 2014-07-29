var TodoApp = {
  todos: [], // Master list of todos currently stored in the app
  currentSorts: {}, // Keeps track of which list is sorted by which property

  initialize: function(){
    this.initializeLists();
    this.initializeSorts();
    this.createSortButtons();

    $('#new-todo').on('submit', $.proxy(this.itemSubmitted, this));
    this.createTodoHandler('click', '.complete-todo', this.itemCompleted);
    this.createTodoHandler('click', '.edit-todo', this.itemEdited);
    this.createTodoHandler('click', '.update-todo', this.itemUpdated);
    this.createTodoHandler('submit', '.name-form', this.itemUpdated);
    this.createTodoHandler('click', '.cancel-edit-todo', this.itemEditCanceled);
    this.createTodoHandler('click', '.delete-todo', this.itemDeleted);
  },

  // Link each of the todo lists already present in the document to the
  // same-indexed status in the list of possible todo statuses (this could be
  // done much more cleanly by just generating the list markup directly from
  // the statuses, but that would be waaay too much jQuery)
  initializeLists: function(){
    TodoItem.statuses.forEach(function(status, index){
      $('.todo-list').eq(index).
        attr('data-status', status).
        find('.count').text('0').end().
        find('.status').text(status);
    }, this);
  },

  // Set the active sort property for each list to the first sortable property
  // of todo items
  initializeSorts: function(){
    TodoItem.statuses.forEach(function(status){
      this.currentSorts[status] = TodoItem.sortableProperties[0];
    }, this);
  },

  // Generate sort buttons on each todo list for each sortable property of todos
  createSortButtons: function(){
    TodoItem.statuses.forEach(function(status){
      var buttons = $('[data-status="' + status + '"] .sort-buttons');

      TodoItem.sortableProperties.forEach(function(property){
        var button = $('<button>').
          attr('type', 'button').
          addClass('btn btn-default').
          data('sort', property).
          text(property).
          on('click', $.proxy(this.sortChanged, this));
        if(this.currentSorts[status] === property){ button.addClass('active'); }
        buttons.append(button);
      }, this);
    }, this);
  },

  // Wrapper around $.on for attaching events on any elements that are children
  // of an element with class "todo". Instead of being called with an `event`
  // argument, the handler function will be called with a `$todo` argument that
  // is the parent element with class "todo", and a `todo` argument that is the
  // corresponding TodoItem object. This is done by dynamically generating an
  // event handler function that retrieves these variables before handing them
  // off to the handler function originally passed in.
  createTodoHandler: function(event, selector, handler){
    handler = $.proxy(handler, this);
    var handlerWrapper = $.proxy(function(event){
      var $todo = $(event.currentTarget).parents('.todo');
      var todo = this.todos.filter(function(todo){
        return todo.id === $todo.data('id');
      })[0];
      handler(todo, $todo);
      event.preventDefault();
    }, this);
    $('#todo-lists').on(event, selector, handlerWrapper);
  },

  // User submitted a new todo item. Validation errors thrown by the constructor
  // are ignored, since for now the only possible error is that there's no text.
  itemSubmitted: function(event){
    try {
      var todo = new TodoItem($('#new-todo-name').val());
      this.todos.push(todo);
      this.rebuildLists();
      $('#new-todo-name').val('');
    } catch(error) {
      if(!error.validationError){ throw error; }
    }
    event.preventDefault();
  },

  // User completed a todo item
  itemCompleted: function(todo){
    todo.complete();
    this.rebuildLists();
  },

  // User started editing a todo item. Since most app actions cause the lists to
  // be rebuilt from scratch, and this would lose the user's editing state, all
  // buttons in the app are disabled while editing except for the ones that will
  // either save or discard the edit.
  itemEdited: function(todo, $todo){
    $todo.find('.name-display').hide();
    $todo.find('.buttons-main').hide();
    $todo.find('.name-input').show().focus().val(todo.name());
    $todo.find('.buttons-edit').show();
    $('button').not($todo.find('.buttons-edit button')).prop('disabled', true);
  },

  // User finished editing a todo item
  itemUpdated: function(todo, $todo){
    todo.rename($todo.find('.name-input').val());
    $('button').prop('disabled', false);
    this.rebuildLists();
  },

  // User canceled editing a todo item
  itemEditCanceled: function(){
    $('button').prop('disabled', false);
    this.rebuildLists();
  },

  // User deleted a todo item
  itemDeleted: function(todo){
    this.todos.splice(this.todos.indexOf(todo), 1);
    this.rebuildLists();
  },

  // User changed the sorting of a list
  sortChanged: function(event){
    var button = $(event.currentTarget);
    button.parents('.sort-buttons').find('button').toggleClass('active');
    this.currentSorts[button.parents('.todo-list').data('status')] = button.data('sort');
    this.rebuildLists();
  },

  // Rebuilds the complete HTML of the todo lists in the document, taking todo
  // status and current sort properties into account. Should be called whenever
  // any todo is created, updated, or deleted. This "destroy-the-world" approach
  // is simple, but wouldn't be very efficient with large numbers of objects.
  rebuildLists: function(){
    $('.todos').empty();

    TodoItem.statuses.forEach(function(status){
      var currentSortProperty = this.currentSorts[status];
      var sortedTodosWithStatus = this.todos.
        filter(function(todo){ return todo.status() === status; }).
        sort(function(a, b){ return a[currentSortProperty]() < b[currentSortProperty]() ? -1 : 1; });

      var todoList = $('[data-status="' + status + '"]');
      var appendTarget = todoList.find('.todos');
      todoList.find('.count').text(sortedTodosWithStatus.length);
      sortedTodosWithStatus.forEach(function(todo){
        appendTarget.append(todo.html());
      });
    }, this);
  }
};
